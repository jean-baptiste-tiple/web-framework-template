// Corrige les liens Markdown multi-lignes cassés par l'export Webflow :
//   [![alt](img)\n\nLabel\n\n](url)   ·   [Label\n\n](url)   ·   [![alt](img)\n\n](url)
// CommonMark interdit les lignes vides DANS le texte d'un lien → rendu en « ](url) » cassé.
// On recolle UNIQUEMENT les liens qui contiennent un saut de ligne (les liens valides
// mono-ligne ne sont jamais touchés : la fonction renvoie le match inchangé).
//
// Usage : node scripts/migration/fix-broken-links.mjs [--apply]
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CONTENT_DIR } from './config.mjs';

const APPLY = process.argv.includes('--apply');
const ROOT = CONTENT_DIR;

// URL Markdown : « char échappé OU non-parenthèse-non-antislash », ≥1.
const U = '(?:\\\\.|[^)\\\\])+';
// [ (suite de : image complète ![alt](img) OU char non-crochet) ] ( url )
// L'image peut apparaître n'importe où dans le texte du lien (l'export Webflow met
// des lignes vides avant/après). Alternative image en PREMIER pour qu'un « ! » suivi
// de « [ » soit lu comme une image, pas comme un char isolé.
const INNER = '(?:!\\[[^\\]]*\\]\\(' + U + '\\)|[^\\[\\]])*?';
const RE = new RegExp('\\[(' + INNER + ')\\]\\((' + U + ')\\)', 'g');

function fixContent(src) {
  let n = 0;
  const out = src.replace(RE, (m, inner, url) => {
    if (!/\n/.test(inner)) return m; // lien mono-ligne valide → intact
    n += 1;
    const collapsed = inner.replace(/\s+/g, ' ').trim();
    return `[${collapsed}](${url})`;
  });
  return { out, n };
}

function walk(dir) {
  const files = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) files.push(...walk(p));
    else if (/\.(md|mdx)$/.test(e)) files.push(p);
  }
  return files;
}

const files = walk(ROOT);
let changed = 0;
let total = 0;
const samples = [];
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const { out, n } = fixContent(src);
  if (n > 0 && out !== src) {
    changed += 1;
    total += n;
    if (samples.length < 3) {
      // capture un avant/après autour du 1er changement
      const idx = src.search(/\n\]\(/);
      samples.push({ f, before: src.slice(Math.max(0, idx - 80), idx + 40).replace(/\n/g, '⏎') });
    }
    if (APPLY) writeFileSync(f, out, 'utf8');
  }
}

console.log(`${APPLY ? 'APPLIQUÉ' : 'DRY-RUN'} : ${changed} fichiers, ${total} liens recollés`);
for (const s of samples) console.log(`\n— ${s.f}\n  AVANT: …${s.before}…`);
if (!APPLY) console.log('\n(relancer avec --apply pour écrire)');
