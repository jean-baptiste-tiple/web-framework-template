// AUDIT live-vs-ours : compare CHAQUE page de dist/ à son snapshot live (site source)
// sur plusieurs dimensions — précisément les classes d'erreurs que la relecture HUMAINE
// attrape et que les checks internes (liens, meta, fuites HTML) NE voient pas :
//   · contenu MANQUANT chez nous (titres/blocs/texte présents sur le live) → troncature
//   · contenu EN TROP chez nous (présent chez nous, absent du live)        → inventé/affiché à tort
//   · nombre d'images différent                                            → images droppées
//   · ratio de longueur de texte                                          → fin tronquée / vide
//   · séquence des titres                                                  → sections réordonnées
//
// Usage : node scripts/migration/live-diff.mjs [--full] [--min SCORE] [--only substr]
import { parse } from 'node-html-parser';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SNAPSHOT_DIR, DIST_DIR, SHARED_HEADINGS, KNOWN_ENTITIES } from './config.mjs';

const SNAP = join(SNAPSHOT_DIR, 'pages');
const DIST = DIST_DIR;
const FULL = process.argv.includes('--full');
const minArg = process.argv.indexOf('--min');
const MIN = minArg > -1 ? Number(process.argv[minArg + 1]) : 4;
const onlyArg = process.argv.indexOf('--only');
const ONLY = onlyArg > -1 ? process.argv[onlyArg + 1] : null;

// Normalisation agressive (casse, accents, ponctuation) pour comparer des titres.
const nk = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Bandes/headings partagés rendus par les composants (≠ contenu de page) → ignorés du diff.
// Liste dans config.mjs (SHARED_HEADINGS).
const SHARED = new Set(SHARED_HEADINGS.map(nk));

function stripChrome(root) {
  const body = root.querySelector('body') || root;
  body
    .querySelectorAll(
      'script,style,noscript,svg,nav,header,footer,iframe,' +
        '[class*="navbar"],[class*="w-nav"],[class*="footer"],[class*="mega"],' +
        '[class*="cookie"],[class*="w-embed"],[role="navigation"],[role="banner"],[role="contentinfo"]',
    )
    .forEach((n) => n.remove());
  return body;
}

function fingerprint(html) {
  const body = stripChrome(parse(html, { blockTextElements: { script: false, style: false } }));
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const headings = body
    .querySelectorAll('h1,h2,h3')
    .map((h) => norm(h.text))
    .filter((t) => t.length > 1 && t.length < 130);
  const imgs = body.querySelectorAll('img').filter((i) => {
    const a = (i.getAttribute('class') || '') + (i.getAttribute('src') || '');
    return !/icon|arrow|fleche|logo-|dots/i.test(a); // exclut pictos décoratifs
  });
  const text = norm(body.text);
  return { headings, imgCount: imgs.length, textLen: text.length, text };
}

// Entités connues (clients, marques… — config KNOWN_ENTITIES) : repérer une entité
// présente sur le live mais absente chez nous, ou inventée.
const CLIENTS = KNOWN_ENTITIES;

const pages = [];
function walk(dir, base = '') {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) walk(join(dir, e.name), base ? `${base}/${e.name}` : e.name);
    else if (e.name === 'index.html') pages.push(base);
  }
}
walk(SNAP);

const results = [];
for (const p of pages) {
  if (ONLY && !p.includes(ONLY)) continue;
  const distFile = join(DIST, p, 'index.html');
  if (!existsSync(distFile)) {
    results.push({ p, score: 99, note: 'PAS DE PAGE dist/ (supprimée/redirigée ?)' });
    continue;
  }
  const live = fingerprint(readFileSync(join(SNAP, p, 'index.html'), 'utf8'));
  const ours = fingerprint(readFileSync(distFile, 'utf8'));

  const liveH = new Set(live.headings.map(nk));
  const oursH = new Set(ours.headings.map(nk));
  const missing = [...new Set(live.headings.filter((h) => !oursH.has(nk(h)) && !SHARED.has(nk(h))))];
  const extra = [...new Set(ours.headings.filter((h) => !liveH.has(nk(h)) && !SHARED.has(nk(h))))];

  const imgDelta = ours.imgCount - live.imgCount;
  const ratio = live.textLen ? ours.textLen / live.textLen : 1;
  const liveText = nk(live.text);
  const oursText = nk(ours.text);
  const clientsMissing = CLIENTS.filter((c) => liveText.includes(nk(c)) && !oursText.includes(nk(c)));
  const clientsExtra = CLIENTS.filter((c) => !liveText.includes(nk(c)) && oursText.includes(nk(c)));

  const score =
    missing.length * 3 +
    extra.length * 2 +
    Math.min(8, Math.abs(imgDelta)) +
    (ratio < 0.75 ? 5 : 0) +
    (ratio > 1.4 ? 2 : 0) +
    clientsMissing.length * 2 +
    clientsExtra.length * 2;

  results.push({ p, score, missing, extra, imgDelta, ratio: ratio.toFixed(2), clientsMissing, clientsExtra });
}

results.sort((a, b) => b.score - a.score);
const flagged = results.filter((r) => r.score >= MIN);
console.log(`Pages comparées : ${results.length} | signalées (score≥${MIN}) : ${flagged.length}\n`);
for (const r of (FULL ? flagged : flagged.slice(0, 45))) {
  if (r.note) { console.log(`[${r.score}] ${r.p} — ${r.note}`); continue; }
  const bits = [];
  if (r.missing.length) bits.push(`MANQUE(${r.missing.length}): ${r.missing.slice(0, 4).join(' | ').slice(0, 110)}`);
  if (r.extra.length) bits.push(`EN+TROP(${r.extra.length}): ${r.extra.slice(0, 3).join(' | ').slice(0, 80)}`);
  if (Math.abs(r.imgDelta) >= 2) bits.push(`imgΔ=${r.imgDelta}`);
  if (r.ratio < 0.75 || r.ratio > 1.4) bits.push(`texte×${r.ratio}`);
  if (r.clientsMissing.length) bits.push(`entités manquantes: ${r.clientsMissing.join(',')}`);
  if (r.clientsExtra.length) bits.push(`entités en trop: ${r.clientsExtra.join(',')}`);
  console.log(`[${r.score}] ${r.p}\n    ${bits.join('\n    ')}`);
}
