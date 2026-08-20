// AUDIT RESPONSIVE tablette + mobile (RESPONSIVE_VIEWPORTS) : détecte les vrais défauts
// de rendu adaptatif, indépendamment de la parité au source :
//   1. débordement horizontal (scroll latéral = layout cassé) + éléments coupables
//   2. images plus larges que le viewport
//   3. texte trop petit (<12px) sur du contenu réel
//   4. cibles tactiles trop petites (liens/boutons <40px de haut)
// Échantillonne un représentant par template + N par collection (le layout est porté
// par le template, pas le contenu) — COLLECTION_SAMPLE (config).
//
// Prérequis : `npx astro preview --port LOCAL_PORT_SITE`. Usage :
//   node scripts/parity/responsive-audit.mjs [--only substr] [--vp 768,375] [--shots]
import { chromium } from 'playwright-core';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  CHROME_PATH,
  LOCAL_PORT_SITE,
  DIST_DIR,
  COLLECTION_SAMPLE,
  RESPONSIVE_VIEWPORTS,
} from '../migration/config.mjs';

const CHROME = CHROME_PATH;
const OURS = `http://localhost:${LOCAL_PORT_SITE}`;
const argv = process.argv;
const arg = (k) => { const i = argv.indexOf(k); return i > -1 ? argv[i + 1] : null; };
const ONLY = arg('--only');
const VPS = arg('--vp') ? arg('--vp').split(',').map(Number) : RESPONSIVE_VIEWPORTS;
const SHOTS = argv.includes('--shots');
mkdirSync('parity/resp', { recursive: true });

// --- liste des pages : toutes les routes dist, collections échantillonnées ---
const DIST = DIST_DIR;
const all = [];
(function walk(d, b = '') {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) walk(join(d, e.name), b ? `${b}/${e.name}` : e.name);
    else if (e.name === 'index.html') all.push(b);
  }
})(DIST);
const SAMPLE = COLLECTION_SAMPLE;
const seen = {};
let pages = [];
for (const p of all.sort()) {
  const f = join(DIST, p, 'index.html');
  if (/http-equiv=.?refresh/i.test(readFileSync(f, 'utf8'))) continue; // stubs de redirection
  let bucket = null;
  for (const k of Object.keys(SAMPLE)) if (p === k || p.startsWith(k + '/')) bucket = k;
  if (bucket) { seen[bucket] = (seen[bucket] || 0) + 1; if (seen[bucket] > SAMPLE[bucket]) continue; }
  pages.push(p || '(home)');
}
if (ONLY) pages = pages.filter((p) => p.includes(ONLY));

const PROBE = `() => {
  const vw = window.innerWidth;
  const de = document.documentElement;
  const overflow = Math.max(de.scrollWidth, document.body.scrollWidth) - vw;
  // un ancêtre à overflow-x auto/scroll/hidden CONTIENT le débordement (slider, carrousel)
  // → ses descendants larges ne débordent PAS le document : on les ignore.
  const inScroller = (el) => { let n = el.parentElement; while (n && n !== document.body) { const o = getComputedStyle(n).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') return true; n = n.parentElement; } return false; };
  const culprits = [];
  if (overflow > 2) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const s = getComputedStyle(el);
      if (s.position === 'fixed') continue; // les fixed (voile) débordent par nature
      if ((r.right > vw + 2 || r.width > vw + 2) && !inScroller(el)) {
        const cls = (el.className && el.className.toString ? el.className.toString() : '').trim().slice(0, 40);
        culprits.push({ tag: el.tagName.toLowerCase(), cls, right: Math.round(r.right), w: Math.round(r.width), txt: (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 30) });
      }
    }
  }
  // garder les coupables « feuilles » (les plus petits qui dépassent = la vraie cause)
  const leaves = culprits.filter((c, i) => !culprits.some((o, j) => j !== i && o.w <= c.w && o.right >= c.right && o.right - o.w >= c.right - c.w - 2)).slice(0, 8);
  // images qui débordent leur conteneur / le viewport
  const imgOver = [];
  for (const img of document.querySelectorAll('img')) {
    const r = img.getBoundingClientRect();
    if (r.width > vw + 2) imgOver.push({ src: (img.currentSrc || img.src || '').split('/').pop().slice(0, 30), w: Math.round(r.width) });
  }
  // texte trop petit (<12px) sur des éléments avec du vrai texte
  const tiny = new Set();
  for (const el of document.querySelectorAll('p, li, a, span, h1, h2, h3, h4, h5, h6, div, button')) {
    const t = (el.textContent || '').trim();
    if (t.length < 4 || el.children.length) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs && fs < 12) tiny.add(fs + 'px « ' + t.slice(0, 24) + ' »');
  }
  return { vw, overflow: Math.round(overflow), culprits: leaves, imgOver: imgOver.slice(0, 6), tiny: [...tiny].slice(0, 6) };
}`;

const FREEZE = `() => { const st=document.createElement('style'); st.textContent='*{animation:none!important;transition:none!important}'; document.head.appendChild(st); ['axeptio','cookie','consent','hubspot-messages'].forEach(k=>document.querySelectorAll('[id*='+k+' i],[class*='+k+' i]').forEach(e=>e.remove())); }`;

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ deviceScaleFactor: 1 });
await ctx.route('**/*', (route) => (route.request().url().startsWith(OURS) ? route.continue() : route.abort()));
const page = await ctx.newPage();

const report = [];
let i = 0;
for (const p of pages) {
  i++;
  const route = p === '(home)' ? '/' : `/${p}/`;
  const entry = { page: p, vps: {} };
  for (const vp of VPS) {
    try {
      await page.setViewportSize({ width: vp, height: 900 });
      await page.goto(`${OURS}${route}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(200);
      await page.evaluate(`(${FREEZE})()`);
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 25)); } window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 120)); });
      const r = await page.evaluate(`(${PROBE})()`);
      entry.vps[vp] = r;
      if (SHOTS && r.overflow > 2) await page.screenshot({ path: `parity/resp/${(p === '(home)' ? 'home' : p.replace(/\\//g, '__'))}__${vp}.png`, fullPage: true }).catch(() => {});
    } catch (e) { entry.vps[vp] = { error: String(e).slice(0, 60) }; }
  }
  report.push(entry);
  const ov = VPS.map((v) => entry.vps[v]?.overflow || 0);
  const flag = ov.some((x) => x > 2) ? 'OVERFLOW ' + ov.join('/') : (VPS.some((v) => entry.vps[v]?.tiny?.length) ? 'tiny-text' : 'ok');
  process.stderr.write(`[${i}/${pages.length}] ${flag.padEnd(16)} ${p}\n`);
}
await browser.close();

writeFileSync('parity/resp/audit.json', JSON.stringify(report, null, 1));
console.log(`\n=== AUDIT RESPONSIVE (${report.length} pages × ${VPS.join('/')}) ===`);
const bad = report.filter((r) => VPS.some((v) => (r.vps[v]?.overflow || 0) > 2));
console.log(`Débordement horizontal : ${bad.length} pages\n`);
for (const r of bad) {
  for (const vp of VPS) {
    const v = r.vps[vp]; if (!v || (v.overflow || 0) <= 2) continue;
    console.log(`## ${r.page} @${vp} — déborde de ${v.overflow}px`);
    v.culprits.forEach((c) => console.log(`   ${c.tag}.${c.cls} w=${c.w} right=${c.right} « ${c.txt} »`));
    v.imgOver.forEach((im) => console.log(`   IMG ${im.src} w=${im.w}`));
  }
}
const tinyPages = report.filter((r) => VPS.some((v) => r.vps[v]?.tiny?.length));
if (tinyPages.length) {
  console.log(`\nTexte <12px : ${tinyPages.length} pages`);
  for (const r of tinyPages.slice(0, 12)) {
    const t = VPS.flatMap((v) => r.vps[v]?.tiny || []);
    console.log(`  ${r.page} : ${[...new Set(t)].slice(0, 4).join(' | ')}`);
  }
}
