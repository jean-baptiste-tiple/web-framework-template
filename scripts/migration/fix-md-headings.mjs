// Fix — titres Markdown cassés (artefact de conversion Webflow→MD).
// Motif : une ligne ne contenant QUE des `#` (`##`, `###`…) suivie IMMÉDIATEMENT
// du texte du titre à la ligne n+1. CommonMark rend alors `<h2></h2>` vide (titre
// invisible) + le texte dégradé en `<p>`. On rejoint : `##\nTexte` → `## Texte`.
// Sûr : ignore le frontmatter et les blocs de code ``` ; ne touche que les vrais
// cas (ligne n+1 non vide et qui n'est ni un titre, ni une liste, ni une citation).
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CONTENT_DIR } from './config.mjs';

const ROOT = CONTENT_DIR;
const DRY = process.argv.includes('--dry');

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.mdx?$/.test(e)) out.push(p);
  }
  return out;
}

const HASH_ONLY = /^#{1,6}[ \t]*$/; // ligne = uniquement des # (+ espaces éventuels)
// La ligne n+1 doit être du VRAI texte de titre : pas un autre titre, ni liste,
// ni citation, ni table, ni ligne vide. (On autorise `**gras**`, chiffres, lettres.)
const NOT_TITLE_TEXT = /^(\s*$|#{1,6}\s|[-*+]\s|\d+\.\s|>\s|\||```)/;

let totalFixed = 0;
const touched = [];

for (const file of walk(ROOT)) {
  const raw = readFileSync(file, 'utf8');
  const lines = raw.split('\n');

  // Délimiter le frontmatter (--- ... ---) pour ne pas y toucher.
  let bodyStart = 0;
  if (lines[0] === '---') {
    const end = lines.indexOf('---', 1);
    if (end !== -1) bodyStart = end + 1;
  }

  let inFence = false;
  let fixed = 0;
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i < bodyStart) {
      out.push(line);
      continue;
    }
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (
      !inFence &&
      HASH_ONLY.test(line) &&
      i + 1 < lines.length &&
      !NOT_TITLE_TEXT.test(lines[i + 1])
    ) {
      out.push(`${line.trim()} ${lines[i + 1].trim()}`);
      i++; // consomme la ligne n+1 (texte du titre)
      fixed++;
      continue;
    }
    out.push(line);
  }

  if (fixed > 0) {
    totalFixed += fixed;
    touched.push(`${file} (${fixed})`);
    if (!DRY) writeFileSync(file, out.join('\n'));
  }
}

console.log(`${DRY ? '[DRY] ' : ''}Titres réparés : ${totalFixed} dans ${touched.length} fichiers`);
for (const t of touched) console.log('  ' + t);
