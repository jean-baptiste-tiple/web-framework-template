// Les noms de fichiers d'assets contenant `#` (encodé %23 dans les URLs) cassent
// au runtime (dev Vite + nombreux hôtes statiques traitent `#` comme fragment).
// On RENOMME ces fichiers (suppression du `#`) et on met à jour les références
// `%23` dans le contenu. Idempotent.
import { readdirSync, statSync, renameSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { ASSETS_DIR, CONTENT_DIR } from './config.mjs';

const walk = (dir, test) =>
  readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? walk(p, test) : test(p) ? [p] : [];
  });

// 1. Renomme les fichiers avec `#`.
let renamed = 0;
for (const p of walk(ASSETS_DIR, (f) => basename(f).includes('#'))) {
  const next = join(dirname(p), basename(p).replace(/#/g, ''));
  if (existsSync(next)) {
    console.log('SKIP (collision):', p);
    continue;
  }
  renameSync(p, next);
  renamed++;
}

// 2. Retire `%23` des références dans le contenu (les espaces %20 restent valides).
let files = 0,
  occ = 0;
for (const p of walk(CONTENT_DIR, (f) => /\.mdx?$/.test(f))) {
  const txt = readFileSync(p, 'utf8');
  if (!txt.includes('%23')) continue;
  const n = (txt.match(/%23/g) || []).length;
  writeFileSync(p, txt.replace(/%23/g, ''));
  files++;
  occ += n;
}

console.log(`Fichiers renommés (sans #) : ${renamed}`);
console.log(`Références %23 nettoyées : ${occ} dans ${files} fichiers`);
