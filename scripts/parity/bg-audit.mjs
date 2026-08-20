// AUDIT DES FONDS DE SECTION : source Webflow (export rendu) vs notre build.
// Mesure, pour chaque titre h1–h4 d'une page, la couleur de fond VISIBLE de sa bande
// (1er ancêtre au fond non-transparent), des deux côtés, et liste les écarts.
//
// Prérequis (servis en local par le runner) :
//   - SOURCE : export Webflow servi à http://localhost:LOCAL_PORT_EXPORT (EXPORT_DIR/)
//   - OURS   : `astro preview --port LOCAL_PORT_SITE`  (dist/)
// Usage : node scripts/parity/bg-audit.mjs
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';
import {
  CHROME_PATH,
  LOCAL_PORT_EXPORT,
  LOCAL_PORT_SITE,
  EXPORT_DIR,
  BG_COLOR_LABELS,
  BG_EQUIVALENT_PAIRS,
} from '../migration/config.mjs';

const CHROME = CHROME_PATH;
const SRC = `http://localhost:${LOCAL_PORT_EXPORT}`;
const OURS = `http://localhost:${LOCAL_PORT_SITE}`;

// Pages export ayant des sections (template:sections). On lit le manifest du harnais.
const manifest = JSON.parse(readFileSync('scripts/parity/manifest.json', 'utf8'));
const ENTRIES = manifest.entries
  .filter((e) => e.kind === 'export' && e.src)
  .map((e) => ({
    page: e.page,
    srcUrl: `${SRC}/${e.src.replace(EXPORT_DIR.replace(/\\/g, '/') + '/', '')}`,
    ourUrl: `${OURS}${e.page.endsWith('/') ? e.page : e.page + '/'}`,
  }));

const nk = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

// Étiquette lisible d'un fond : palette du site dans BG_COLOR_LABELS (config).
function label(rgb) {
  const m = (rgb || '').match(/(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
  if (!m) return rgb || '?';
  const [r, g, b] = [+m[1], +m[2], +m[3]];
  const a = m[4] === undefined ? 1 : +m[4];
  if (a === 0) return 'transparent';
  const near = (x, y) => Math.abs(x - y) <= 3;
  for (const entry of BG_COLOR_LABELS) {
    const [lr, lg, lb] = entry.rgb;
    if (near(r, lr) && near(g, lg) && near(b, lb)) return entry.label;
  }
  return `rgb(${r},${g},${b})`;
}

// Paires de fonds considérées équivalentes (écart assumé) — config.
const equivalent = (x, y) => BG_EQUIVALENT_PAIRS.some(([p, q]) => (x === p && y === q) || (x === q && y === p));

// Dans la page : {titre normalisé -> couleur de fond visible de sa bande}.
const PROBE = `() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); if (r.width < 3 || r.height < 3) return false; const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden'; };
  const opaque = (c) => { const m = (c||'').match(/[\\d.]+/g); return c && c !== 'transparent' && !(m && m.length === 4 && +m[3] === 0); };
  const isBand = (n) => n.tagName === 'SECTION' || /section/i.test(n.className || '');
  const effBg = (el) => {
    // 1) remonter à la BANDE de section (balise <section> ou classe « section »), en sautant les cartes
    let band = null, n = el;
    while (n && n !== document.body) { if (isBand(n)) { band = n; break; } n = n.parentElement; }
    band = band || el;
    // 2) fond visible de la bande : elle-même, sinon 1er ancêtre opaque, sinon body
    let m = band;
    while (m && m !== document.documentElement) { const c = getComputedStyle(m).backgroundColor; if (opaque(c)) return c; m = m.parentElement; }
    return getComputedStyle(document.body).backgroundColor;
  };
  const out = {};
  for (const h of document.querySelectorAll('h1,h2,h3,h4')) {
    if (!vis(h)) continue;
    const t = (h.textContent || '').replace(/\\s+/g, ' ').trim();
    if (t.length < 3) continue;
    if (!(t in out)) out[t] = effBg(h);
  }
  return out;
}`;

const FREEZE = `() => { const st=document.createElement('style'); st.textContent='*{animation:none!important;transition:none!important}'; document.head.appendChild(st); }`;

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
const page = await ctx.newPage();

async function grab(url) {
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.evaluate(`(${FREEZE})()`);
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 1000) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } window.scrollTo(0, 0); });
    return await page.evaluate(`(${PROBE})()`);
  } catch (e) { return { __err: String(e).slice(0, 60) }; }
}

const report = [];
for (const e of ENTRIES) {
  const src = await grab(e.srcUrl);
  const ours = await grab(e.ourUrl);
  if (src.__err || ours.__err) { process.stderr.write(`SKIP ${e.page} (${src.__err || ''}${ours.__err || ''})\n`); continue; }
  const srcN = {}; for (const [k, v] of Object.entries(src)) srcN[nk(k)] = { t: k, bg: label(v) };
  const diffs = [];
  for (const [k, v] of Object.entries(ours)) {
    const key = nk(k);
    const s = srcN[key];
    if (!s) continue; // titre non trouvé dans la source → ignoré (pas comparable)
    const ourBg = label(v);
    if (s.bg !== ourBg && !equivalent(s.bg, ourBg)) {
      diffs.push({ titre: k.slice(0, 48), source: s.bg, nous: ourBg });
    }
  }
  if (diffs.length) report.push({ page: e.page, diffs });
  process.stderr.write(`${String(diffs.length).padStart(2)} écarts  ${e.page}\n`);
}

await browser.close();
writeFileSync('scripts/parity/bg-audit.json', JSON.stringify(report, null, 1));
console.log(`\n=== ECARTS DE FOND (source Webflow vs build) — ${report.length} pages ===`);
for (const r of report) {
  console.log(`\n## ${r.page}`);
  for (const d of r.diffs) console.log(`  « ${d.titre} »  source=${d.source}  nous=${d.nous}`);
}
