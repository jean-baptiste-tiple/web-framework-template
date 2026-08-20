// AUDIT « collision bas de section » : détecte les sections dont le CONTENU touche le
// bord BAS de leur bande de fond (padding-bottom trop faible → le texte colle le
// changement de section). Motif typique : hero à fond coloré avec padding-bottom:0.
// On ne signale que les bandes à fond DISTINCT de la section suivante (bord visible).
//
// Prérequis : `npx astro preview --port LOCAL_PORT_SITE`. Usage :
//   node scripts/parity/section-gap-audit.mjs [--only substr] [--vp 1440] [--min 20]
import { chromium } from 'playwright-core';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { CHROME_PATH, LOCAL_PORT_SITE, DIST_DIR, COLLECTION_SAMPLE } from '../migration/config.mjs';

const CHROME = CHROME_PATH;
const OURS = `http://localhost:${LOCAL_PORT_SITE}`;
const argv = process.argv;
const arg = (k) => { const i = argv.indexOf(k); return i > -1 ? argv[i + 1] : null; };
const ONLY = arg('--only');
const VP = arg('--vp') ? Number(arg('--vp')) : 1440;
const MIN = arg('--min') ? Number(arg('--min')) : 20; // gap mini toléré (px)
mkdirSync('parity/gap', { recursive: true });

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
  if (/http-equiv=.?refresh/i.test(readFileSync(join(DIST, p, 'index.html'), 'utf8'))) continue;
  let bucket = null;
  for (const k of Object.keys(SAMPLE)) if (p === k || p.startsWith(k + '/')) bucket = k;
  if (bucket) { seen[bucket] = (seen[bucket] || 0) + 1; if (seen[bucket] > SAMPLE[bucket]) continue; }
  pages.push(p || '(home)');
}
if (ONLY) pages = pages.filter((p) => p.includes(ONLY));

const PROBE = `(MIN) => {
  const px = (v) => Math.round(parseFloat(v) || 0);
  const vis = (el) => { const r = el.getBoundingClientRect(); if (r.width < 3 || r.height < 3) return false; const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden'; };
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  const bgOf = (el) => { let n = el; while (n && n !== document.documentElement) { const s = getComputedStyle(n); const b = s.backgroundColor; if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') return b; if (s.backgroundImage && s.backgroundImage !== 'none') return 'image'; n = n.parentElement; } return bodyBg; };
  // blocs top-level = enfants directs de <main> (ou du wrapper)
  let host = document.querySelector('main') || document.body;
  const blocks = [...host.children].filter((e) => !/^(SCRIPT|STYLE|LINK)$/.test(e.tagName) && vis(e));
  const findings = [];
  blocks.forEach((b, i) => {
    const rb = b.getBoundingClientRect();
    const bg = b.tagName === 'SECTION' || /section|hero|band/i.test(b.className || '') ? bgOf(b) : getComputedStyle(b).backgroundColor;
    if (!bg || bg === 'image' || bg === 'rgba(0, 0, 0, 0)') return;
    // bande à fond DISTINCT du fond de page : sinon la « fin » n'est pas une bande
    // colorée visible (le paragraphe touchant un fond identique au body ne « colle » rien).
    if (bg === bodyBg) return;
    // large marge basse → l'espace existe même avec padding 0
    if (px(getComputedStyle(b).marginBottom) >= MIN) return;
    // fond de la section suivante : si identique, pas de bord visible → on ignore
    const next = blocks[i + 1];
    const nextBg = next ? bgOf(next) : bodyBg;
    if (nextBg === bg) return;
    // bas du dernier contenu porteur de texte/image (hors éléments décoratifs pleine hauteur)
    let maxBottom = rb.top;
    let lastTxt = '';
    for (const el of b.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,a,button,img,blockquote,summary,[class*=title i],[class*=eyebrow i]')) {
      if (!vis(el)) continue;
      if (el.closest('details:not([open])') && el.tagName !== 'SUMMARY') continue; // réponse d'accordéon fermé
      const r = el.getBoundingClientRect();
      if (r.bottom > rb.bottom + 4) continue; // déborde la section (décor) → ignore
      if (r.bottom > maxBottom) { maxBottom = r.bottom; lastTxt = (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 40) || el.tagName.toLowerCase(); }
    }
    const gap = Math.round(rb.bottom - maxBottom);
    const padB = px(getComputedStyle(b).paddingBottom);
    if (gap < MIN) findings.push({ i, cls: (b.className || '').toString().split(' ').filter((c) => !/^(w-full|mx-auto|px-)/.test(c))[0] || b.tagName.toLowerCase(), bg, padBottom: padB, gap, last: lastTxt });
  });
  return findings;
}`;

const FREEZE = `() => { ['axeptio','cookie','consent','hubspot-messages'].forEach(k=>document.querySelectorAll('[id*='+k+' i],[class*='+k+' i]').forEach(e=>e.remove())); }`;

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: VP, height: 1000 }, deviceScaleFactor: 1 });
await ctx.route('**/*', (route) => (route.request().url().startsWith(OURS) ? route.continue() : route.abort()));
const page = await ctx.newPage();

const report = [];
let i = 0;
for (const p of pages) {
  i++;
  const route = p === '(home)' ? '/' : `/${p}/`;
  try {
    await page.goto(`${OURS}${route}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(200);
    await page.evaluate(`(${FREEZE})()`);
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 20)); } window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 120)); });
    const f = await page.evaluate(`(${PROBE})(${MIN})`);
    if (f.length) report.push({ page: p, findings: f });
    process.stderr.write(`[${i}/${pages.length}] ${f.length ? 'COLLE ' + f.length : 'ok'}  ${p}\n`);
  } catch (e) { process.stderr.write(`[${i}] ERR ${p} ${String(e).slice(0, 50)}\n`); }
}
await browser.close();

writeFileSync('parity/gap/audit.json', JSON.stringify(report, null, 1));
console.log(`\n=== COLLISION BAS DE SECTION @${VP} (gap < ${MIN}px, fond distinct) ===`);
console.log(`${report.length} pages concernées\n`);
for (const r of report) {
  console.log(`## ${r.page}`);
  r.findings.forEach((f) => console.log(`   .${f.cls} — gap ${f.gap}px, padding-bottom ${f.padBottom}px, fond ${f.bg} — sous « ${f.last} »`));
}
