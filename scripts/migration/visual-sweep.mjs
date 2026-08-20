// Diff visuel AUTOMATISÉ ours (preview locale) vs live (site source), full-page 1440px.
// Couvre toutes les pages ayant un snapshot live, en ÉCHANTILLONNANT les collections CMS
// (COLLECTION_SAMPLE / BUCKET_PATTERNS, config). Nettoie l'overlay de consentement
// (sinon faux écart). Sort un tableau classé par divergence ; flag GROS ÉCART / couleurs.
//
// Prérequis : preview locale (`astro preview --port LOCAL_PORT_SITE`), Chrome système.
// Usage : node scripts/migration/visual-sweep.mjs [--limit N]
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import { readdirSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  CHROME_PATH,
  SNAPSHOT_DIR,
  DIST_DIR,
  SOURCE_ORIGIN,
  LOCAL_PORT_SITE,
  COLLECTION_SAMPLE,
  BUCKET_PATTERNS,
} from './config.mjs';

const CHROME = CHROME_PATH;
const SNAP = join(SNAPSHOT_DIR, 'pages');
const DIST = DIST_DIR;
const LIVE = SOURCE_ORIGIN;
const OURS = `http://localhost:${LOCAL_PORT_SITE}`;
const W = 1440;
const OUT = 'vsweep';
mkdirSync(OUT, { recursive: true });
const limArg = process.argv.indexOf('--limit');
const LIMIT = limArg > -1 ? Number(process.argv[limArg + 1]) : Infinity;

// --- liste des pages : snapshot ∩ dist, hors redirects, CMS échantillonné ---
const all = [];
(function walk(d, b = '') {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) walk(join(d, e.name), b ? `${b}/${e.name}` : e.name);
    else if (e.name === 'index.html') all.push(b);
  }
})(SNAP);

const SAMPLE = COLLECTION_SAMPLE;
const seen = {};
const pages = [];
for (const p of all.sort()) {
  const dist = join(DIST, p, 'index.html');
  if (!existsSync(dist)) continue;
  if (/http-equiv=.?refresh/i.test(readFileSync(dist, 'utf8'))) continue; // redirects
  // bucket CMS (préfixe de route, puis motifs regex — config)
  let bucket = null;
  let cap = null;
  for (const k of Object.keys(SAMPLE)) if (p === k || p.startsWith(k + '/')) { bucket = k; cap = SAMPLE[k]; }
  for (const bp of BUCKET_PATTERNS) if (bp.re.test(p)) { bucket = bp.bucket; cap = bp.cap; }
  if (bucket) {
    seen[bucket] = (seen[bucket] || 0) + 1;
    if (seen[bucket] > (cap ?? 3)) continue;
  }
  pages.push(p);
}

const CLEAN = `() => {
  const s=document.createElement('style');s.textContent='*{opacity:1!important;transform:none!important;animation:none!important;transition:none!important}';document.head.appendChild(s);
  const kill=['axeptio','cookie','consent','hubspot','messages','chat','widget','popup','modal','lightbox','optin','promo','newsletter-card'];
  const vw=window.innerWidth, vh=window.innerHeight;
  [...document.querySelectorAll('body *')].forEach(e=>{const id=(e.id||'')+' '+(e.className||'').toString();const cs=getComputedStyle(e);
    const fixed=(cs.position==='fixed'||cs.position==='absolute');
    const r=e.getBoundingClientRect();
    const z=parseInt(cs.zIndex)||0;
    // overlay/popup : couvre une grande partie de l'écran, fixé/absolu, z élevé (peu importe la couleur)
    const overlay=fixed && r.width>vw*0.6 && r.height>vh*0.5 && z>=200;
    const darkBackdrop=fixed && /rgba\\(0, 0, 0/.test(cs.backgroundColor) && r.width>800;
    if(kill.some(k=>new RegExp(k,'i').test(id)) || overlay || darkBackdrop) e.remove();
  });
  document.querySelectorAll('img').forEach(i=>{i.loading='eager';if(i.dataset.src)i.src=i.dataset.src;});
}`;

async function shoot(page, url, file) {
  // domcontentloaded (rapide) — le live ne devient JAMAIS 'networkidle' (tags marketing).
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(900); // laisse le CSS/police + 1er paint
  await page.evaluate(CLEAN);
  // scroll pour déclencher le lazy-load
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 900) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
    window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 400));
  });
  await page.screenshot({ path: file, fullPage: true });
}

async function load(file) {
  const { data, info } = await sharp(file).resize({ width: W }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, height: info.height };
}
function histogram(data) {
  const h = new Float64Array(64);
  for (let i = 0; i < data.length; i += 4) h[(data[i] >> 6) * 16 + (data[i + 1] >> 6) * 4 + (data[i + 2] >> 6)]++;
  const n = data.length / 4 || 1;
  for (let i = 0; i < 64; i++) h[i] /= n;
  return h;
}
const l1 = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / 2; };

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: W, height: 1400 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

const results = [];
let i = 0;
for (const p of pages) {
  if (i >= LIMIT) break;
  i++;
  const tag = p.replace(/\//g, '__') || 'home';
  try {
    await shoot(page, `${LIVE}/${p}`, `${OUT}/live-${tag}.png`);
    await shoot(page, `${OURS}/${p}`, `${OUT}/ours-${tag}.png`);
    const a = await load(`${OUT}/live-${tag}.png`);
    const b = await load(`${OUT}/ours-${tag}.png`);
    const H = Math.min(a.height, b.height);
    const bytes = W * H * 4;
    const nDiff = pixelmatch(a.data.subarray(0, bytes), b.data.subarray(0, bytes), null, W, H, { threshold: 0.1 });
    const pct = +((nDiff / (W * H)) * 100).toFixed(1);
    const color = +l1(histogram(a.data), histogram(b.data)).toFixed(3);
    const hRatio = +(b.height / a.height).toFixed(2);
    const verdict = pct > 35 || color > 0.18 ? 'GROS ÉCART' : pct > 18 || color > 0.08 || hRatio < 0.7 || hRatio > 1.4 ? 'À VÉRIFIER' : 'OK';
    results.push({ p: p || '(home)', pct, color, hRatio, verdict });
    process.stderr.write(`[${i}/${Math.min(pages.length, LIMIT)}] ${verdict.padEnd(11)} ${p || '(home)'}\n`);
  } catch (e) {
    results.push({ p: p || '(home)', error: String(e).slice(0, 60) });
    process.stderr.write(`[${i}] ERREUR ${p}: ${String(e).slice(0, 50)}\n`);
  }
}
await browser.close();

const rank = { 'GROS ÉCART': 0, 'À VÉRIFIER': 1, OK: 2 };
results.sort((x, y) => (rank[x.verdict] ?? -1) - (rank[y.verdict] ?? -1) || (y.pct || 0) - (x.pct || 0));
console.log(`\n=== ${results.length} pages comparées (full-page 1440) ===`);
const gros = results.filter((r) => r.verdict === 'GROS ÉCART');
const verif = results.filter((r) => r.verdict === 'À VÉRIFIER');
console.log(`OK: ${results.filter((r) => r.verdict === 'OK').length} | À VÉRIFIER: ${verif.length} | GROS ÉCART: ${gros.length} | erreurs: ${results.filter((r) => r.error).length}\n`);
for (const r of [...gros, ...verif]) {
  if (r.error) { console.log(`  ERR  ${r.p} — ${r.error}`); continue; }
  console.log(`  ${r.verdict.padEnd(11)} ${(r.p).padEnd(52)} pix=${r.pct}% couleur=${r.color} hRatio=${r.hRatio}`);
}
for (const r of results.filter((r) => r.error)) console.log(`  ERR  ${r.p} — ${r.error}`);
