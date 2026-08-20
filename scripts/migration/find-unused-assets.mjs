// Détecte (et avec --delete supprime) les fichiers de ASSETS_DIR jamais
// référencés dans le SITE BUILDÉ. Source de vérité = dist/**.html (les chemins
// d'assets réellement servis, après résolution Markdown). On décode l'URL et on
// normalise en NFC des DEUX côtés pour neutraliser apostrophes %27 / accents NFD
// (%CC%81) / espaces %20 / parens. verify.mjs reste le filet final.
//
// Pré-requis : build à jour (dist/ présent).
import { readFileSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, basename, relative, dirname } from 'node:path';
import { ASSETS_DIR, DIST_DIR } from './config.mjs';

const ASSETS = ASSETS_DIR;
const DIST = DIST_DIR;
const PUBLIC_ROOT = dirname(ASSETS_DIR); // 'public' — racine servie à /
const DELETE = process.argv.includes('--delete');
const nfc = (s) => s.normalize('NFC');

function walk(dir, test) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p, test));
    else if (!test || test(e)) out.push({ path: p, size: st.size });
  }
  return out;
}

// 1) Ensemble des chemins /assets/... référencés dans le HTML buildé (décodés, NFC).
// IMPORTANT : on extrait d'abord les valeurs d'attributs ENTRE GUILLEMETS
// (src/href/srcset/style/content), PUIS les `/assets/...` à l'intérieur — ainsi les
// parenthèses LITTÉRALES des noms de fichiers (`(1).jpg`, non encodées en dist) sont
// incluses (un `/assets/[^"')...]` naïf tronquerait au `)`).
const used = new Set();
const attrRe = /(?:src|href|srcset|content|style)="([^"]*)"/g;
const assetRe = /\/assets\/[^\s,"']+/g;
const addRef = (u) => {
  u = u.replace(/&amp;/g, '&');
  try {
    u = decodeURIComponent(u);
  } catch {
    /* séquence % invalide → garder brut */
  }
  used.add(nfc(u));
};
for (const { path } of walk(DIST, (e) => e.endsWith('.html'))) {
  const html = readFileSync(path, 'utf8');
  for (const am of html.matchAll(attrRe)) {
    for (const m of am[1].matchAll(assetRe)) addRef(m[0]);
  }
}

// 2) Fichiers de ASSETS_DIR non référencés.
const assets = walk(ASSETS);
const relUrl = (p) => '/' + relative(PUBLIC_ROOT, p).split('\\').join('/');
const unused = assets.filter((a) => !used.has(nfc(relUrl(a.path))));
const totalMB = (unused.reduce((s, a) => s + a.size, 0) / 1048576).toFixed(1);

const cat = (p) =>
  /\.pptx?$/i.test(p) ? 'pptx'
  : /-p-\d+\./.test(p) ? 'webflow -p-* (responsive)'
  : /[ _]\(\d+\)\./.test(p) ? 'doublon (n)'
  : 'autre';
const byCat = {};
for (const a of unused) byCat[cat(a.path)] = (byCat[cat(a.path)] || 0) + 1;

console.log(
  `${DELETE ? '[DELETE] ' : '[DRY] '}Réfs dist : ${used.size} · assets : ${assets.length} · non référencés : ${unused.length} (${totalMB} MB)`,
);
for (const [k, v] of Object.entries(byCat)) console.log(`  ${k}: ${v}`);
if (!DELETE) {
  console.log('\nExemples « autre » :');
  unused.filter((a) => cat(a.path) === 'autre').slice(0, 15).forEach((a) => console.log('  ' + basename(a.path)));
} else {
  for (const a of unused) unlinkSync(a.path);
  console.log(`Supprimés : ${unused.length}`);
}
