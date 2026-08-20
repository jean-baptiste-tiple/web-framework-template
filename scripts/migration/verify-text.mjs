// Mesure la complétude/similarité du TEXTE entre le source (snapshot) et le build (dist).
// Compare le texte visible normalisé du <main>/contenu, hors chrome (nav/footer).
// Zéro dépendance hors node-html-parser. Usage : node scripts/migration/verify-text.mjs
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'node-html-parser';
import { DIST_DIR, INVENTORY_FILE } from './config.mjs';

const inv = JSON.parse(readFileSync(INVENTORY_FILE, 'utf8'));
const SOURCE_404 = new Set(inv.reconciliation.sitemapMissingFromSnapshot.map((u) => new URL(u).pathname));
const distFile = (p) => (p === '/' ? join(DIST_DIR, 'index.html') : join(DIST_DIR, p.replace(/^\//, ''), 'index.html'));

// Texte visible normalisé : on retire scripts/style/nav/header/footer, on garde les mots.
function visibleWords(html) {
  const root = parse(html, { blockTextElements: { script: false, style: false } });
  root
    .querySelectorAll('script,style,noscript,nav,header,footer,[class*="navbar"],[class*="footer"],[class*="w-nav"]')
    .forEach((n) => n.remove());
  const txt = (root.querySelector('body') ?? root).text
    .replace(/‍/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  return txt ? txt.split(/\s+/) : [];
}

// Similarité = part des mots-source retrouvés dans le local (rappel sur multiset de mots).
function recall(srcWords, locWords) {
  if (srcWords.length === 0) return 1;
  const locCount = new Map();
  for (const w of locWords) locCount.set(w, (locCount.get(w) || 0) + 1);
  let found = 0;
  const need = new Map();
  for (const w of srcWords) need.set(w, (need.get(w) || 0) + 1);
  for (const [w, n] of need) found += Math.min(n, locCount.get(w) || 0);
  return found / srcWords.length;
}

const results = [];
for (const p of inv.pages) {
  if (SOURCE_404.has(p.path)) continue;
  const f = distFile(p.path);
  if (!existsSync(f)) continue;
  const src = visibleWords(readFileSync(p.localFile, 'utf8'));
  const loc = visibleWords(readFileSync(f, 'utf8'));
  results.push({ path: p.path, type: p.type, src: src.length, loc: loc.length, recall: recall(src, loc) });
}

results.sort((a, b) => a.recall - b.recall);
const avg = results.reduce((s, r) => s + r.recall, 0) / results.length;
const byType = {};
for (const r of results) {
  (byType[r.type] ??= []).push(r.recall);
}

console.log('===== SIMILARITÉ TEXTE (rappel des mots source dans le local) =====');
console.log(`Pages comparées : ${results.length} · rappel moyen : ${(avg * 100).toFixed(1)} %`);
console.log('\nRappel moyen par type :');
for (const [t, arr] of Object.entries(byType).sort())
  console.log(`  ${t.padEnd(16)} ${((arr.reduce((s, x) => s + x, 0) / arr.length) * 100).toFixed(1)} %  (${arr.length} pages)`);
const thresholds = [0.99, 0.95, 0.9, 0.8];
console.log('\nRépartition :');
for (const t of thresholds)
  console.log(`  rappel ≥ ${(t * 100).toFixed(0)} % : ${results.filter((r) => r.recall >= t).length}/${results.length}`);
console.log('\n20 pages au plus faible rappel :');
results.slice(0, 20).forEach((r) => console.log(`  ${(r.recall * 100).toFixed(0).padStart(3)}%  ${r.type.padEnd(12)} src=${r.src} loc=${r.loc}  ${r.path}`));
