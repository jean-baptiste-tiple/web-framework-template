// Vérifie qu'AUCUNE image du site n'est cassée :
//  - internes (/assets/…) : le fichier existe-t-il dans dist/ (ou public/) ?
//  - externes (http/data)  : listées à part (vérif réseau optionnelle via --ext).
// Couvre <img src/srcset>, <source srcset>, og:image, et url(...) inline.
// Usage : node scripts/migration/check-broken-images.mjs [--ext]
import { parse } from 'node-html-parser';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { DIST_DIR, ASSETS_DIR } from './config.mjs';

const DIST = DIST_DIR;
const PUBLIC_ROOT = dirname(ASSETS_DIR); // 'public'
const CHECK_EXT = process.argv.includes('--ext');

const pages = [];
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) walk(join(d, e.name));
    else if (e.name === 'index.html') pages.push(join(d, e.name));
  }
})(DIST);

const missing = new Map(); // src -> Set(pages)
const external = new Set();
let imgRefs = 0;

const add = (map, key, page) => {
  const s = map.get(key) || new Set();
  s.add(page);
  map.set(key, s);
};

for (const f of pages) {
  const page = '/' + f.replaceAll('\\', '/').replace(DIST + '/', '').replace('/index.html', '');
  const root = parse(readFileSync(f, 'utf8'));
  const srcs = new Set();
  for (const i of root.querySelectorAll('img')) {
    const s = i.getAttribute('src');
    if (s) srcs.add(s);
    const ss = i.getAttribute('srcset');
    if (ss) ss.split(',').forEach((p) => srcs.add(p.trim().split(/\s+/)[0]));
  }
  for (const s of root.querySelectorAll('source')) {
    const ss = s.getAttribute('srcset') || s.getAttribute('src');
    if (ss) ss.split(',').forEach((p) => srcs.add(p.trim().split(/\s+/)[0]));
  }
  for (const m of root.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]')) {
    const s = m.getAttribute('content');
    if (s) srcs.add(s);
  }
  // url(...) dans les styles inline
  for (const el of root.querySelectorAll('[style*="url("]')) {
    const m = (el.getAttribute('style') || '').match(/url\((['"]?)([^'")]+)\1\)/);
    if (m) srcs.add(m[2]);
  }

  for (const raw of srcs) {
    if (!raw) continue;
    imgRefs++;
    if (/^https?:|^data:/.test(raw)) {
      external.add(raw.split('?')[0]);
      continue;
    }
    const rel = decodeURIComponent(raw.split('?')[0].replace(/^\//, ''));
    if (!existsSync(join(DIST, rel)) && !existsSync(join(PUBLIC_ROOT, rel))) add(missing, raw, page);
  }
}

console.log(`Pages: ${pages.length} | refs images: ${imgRefs} | externes uniques: ${external.size} | INTERNES CASSÉES: ${missing.size}\n`);
if (missing.size === 0) console.log('✓ Aucune image interne cassée.');
let n = 0;
for (const [src, pp] of missing) {
  if (n++ >= 40) {
    console.log(`  … +${missing.size - 40} autres`);
    break;
  }
  console.log(`  ✗ ${src.slice(0, 78)}  (${pp.size} page(s), ex: ${[...pp][0]})`);
}

if (CHECK_EXT) {
  console.log(`\n--- ${external.size} domaines/images externes (échantillon) ---`);
  const hosts = {};
  for (const u of external) {
    const h = (u.match(/^https?:\/\/([^/]+)/) || [])[1] || '?';
    hosts[h] = (hosts[h] || 0) + 1;
  }
  Object.entries(hosts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([h, c]) => console.log(`  ${c}×  ${h}`));
}
