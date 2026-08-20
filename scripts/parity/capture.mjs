// CAPTURE — sonde de mesure : charge chaque paire du manifest aux viewports demandés
// (baseline Webflow en file://, dist via serveur local) et dumpe un JSON de métriques
// par (page, côté, viewport) dans parity/dumps/. AUCUN screenshot — tout le diff est
// offline ensuite (diff.mjs). Réseau : tiers coupés, CDN Webflow servi depuis le
// snapshot local (assets-map), Google Fonts autorisé (mêmes familles des 2 côtés).
//
//   node scripts/parity/capture.mjs [--only substr] [--vp 1440,768] [--limit N] [--side wf|astro]
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { VIEWPORTS, DUMPS, tagOf } from './lib.mjs';
import { PROBE_FN, FREEZE_FN } from './probe.mjs';
import {
  CHROME_PATH,
  CAPTURE_PORT,
  DIST_DIR,
  SNAPSHOT_DIR,
  EXPORT_DIR,
  ASSETS_MAP_FILE,
  FONTS_TO_CHECK,
} from '../migration/config.mjs';

const CHROME = CHROME_PATH;
const PORT = CAPTURE_PORT;
const argv = process.argv;
const arg = (k) => { const i = argv.indexOf(k); return i > -1 ? argv[i + 1] : null; };
const ONLY = arg('--only');
const VPS = arg('--vp') ? arg('--vp').split(',').map(Number) : VIEWPORTS;
const LIMIT = arg('--limit') ? +arg('--limit') : Infinity;
const SIDE = arg('--side');

const manifest = JSON.parse(readFileSync('scripts/parity/manifest.json', 'utf8'));
let entries = manifest.entries.filter((e) => !ONLY || e.page.includes(ONLY));
entries = entries.slice(0, LIMIT);
mkdirSync(DUMPS, { recursive: true });

// --- serveur statique pour dist (chemins absolus /_astro → un serveur racine) ---
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.mp4': 'video/mp4', '.pdf': 'application/pdf' };
const server = createServer((req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let f = join(DIST_DIR, p);
    if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
    if (!existsSync(f)) f = join(DIST_DIR, p, 'index.html');
    if (!existsSync(f)) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'content-type': MIME[extname(f).toLowerCase()] || 'application/octet-stream' });
    res.end(readFileSync(f));
  } catch { res.writeHead(500); res.end(); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

// --- politique réseau : assets CDN Webflow → snapshot local ; tiers → abort ---
const assetsMap = JSON.parse(readFileSync(ASSETS_MAP_FILE, 'utf8'));
const byUrl = new Map(Object.entries(assetsMap));
const byBase = new Map();
for (const [u, f] of Object.entries(assetsMap)) byBase.set(decodeURIComponent(u.split('/').pop()), f);
// index des assets du snapshot + images de l'export pour le fallback par basename
for (const root of [join(SNAPSHOT_DIR, 'assets'), join(EXPORT_DIR, 'images')]) {
  if (!existsSync(root)) continue;
  (function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const f = join(d, e.name);
      if (e.isDirectory()) walk(f);
      else if (!byBase.has(e.name)) byBase.set(e.name, f);
    }
  })(root);
}
let misses = [];
const routeHandler = async (route) => {
  const u = route.request().url();
  if (u.startsWith('file://') || u.startsWith(`http://127.0.0.1:${PORT}`)) return route.continue();
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com|ajax\.googleapis\.com\/ajax\/libs\/webfont/.test(u)) return route.continue();
  if (/website-files\.com|webflow\.com/.test(u)) {
    const clean = u.split('?')[0];
    const f = byUrl.get(clean) || byUrl.get(u) || byBase.get(decodeURIComponent(clean.split('/').pop()));
    if (f && existsSync(f)) {
      return route.fulfill({ body: readFileSync(f), contentType: MIME[extname(f).toLowerCase()] || 'application/octet-stream' });
    }
    misses.push(clean.split('/').pop());
    return route.abort();
  }
  return route.abort(); // tags marketing/analytics/chat tiers → état CSS-only déterministe
};

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 1440, height: 900 } });
await ctx.route('**/*', routeHandler);
const page = await ctx.newPage();

async function capture(url, vp) {
  misses = [];
  await page.setViewportSize({ width: vp, height: 900 });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(300);
  await page.evaluate(`(${FREEZE_FN})()`);
  // sweep pour lazy-load, puis retour en haut (rects en coordonnées page)
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 900) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); }
    window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 200));
  });
  await page.evaluate(() => document.fonts.ready.then(() => {}));
  await page.waitForTimeout(150);
  // familles clés du site (FONTS_TO_CHECK, config) : chargées des deux côtés ?
  const fonts = await page.evaluate(
    (names) => Object.fromEntries(names.map((n) => [n, document.fonts.check('16px ' + n)])),
    FONTS_TO_CHECK,
  );
  const dump = await page.evaluate(`(${PROBE_FN})()`);
  dump.meta = { url, vp, fonts, misses: [...new Set(misses)].slice(0, 20) };
  return dump;
}

let done = 0, errors = 0;
for (const e of entries) {
  const tag = tagOf(e.page);
  const wfUrl = pathToFileURL(resolve(e.src)).href;
  const astroUrl = `http://127.0.0.1:${PORT}${e.page === '/' ? '/' : e.page + '/'}`;
  for (const vp of VPS) {
    for (const [side, url] of [['wf', wfUrl], ['astro', astroUrl]]) {
      if (SIDE && side !== SIDE) continue;
      const out = join(DUMPS, `${tag}__${side}__${vp}.json`);
      try {
        const dump = await capture(url, vp);
        dump.meta.page = e.page; dump.meta.kind = e.kind; dump.meta.side = side;
        writeFileSync(out, JSON.stringify(dump));
        if (dump.meta.misses.length) process.stderr.write(`  ! ${tag} ${side}@${vp}: ${dump.meta.misses.length} assets manquants (${dump.meta.misses.slice(0, 3).join(', ')})\n`);
      } catch (err) {
        errors++;
        process.stderr.write(`  ERR ${tag} ${side}@${vp}: ${String(err).slice(0, 100)}\n`);
      }
    }
  }
  done++;
  process.stderr.write(`[${done}/${entries.length}] ${e.page}\n`);
}

await browser.close();
server.close();
console.log(`capture terminée : ${done} pages × ${VPS.length} vp, ${errors} erreurs → ${DUMPS}/`);
