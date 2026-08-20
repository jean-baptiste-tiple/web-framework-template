// Fix — gras Markdown malformé (`**` orphelin sur sa propre ligne).
// Artefact de conversion `<strong>…<br></strong>` : le délimiteur `**` se
// retrouve seul sur une ligne. CommonMark l'affiche LITTÉRAL.
//   H  (titre+gras cassé) : `## **` puis `Texte` puis `**` → `## **Texte**`
//   A  (fermeture poussée): `**Texte` puis `**`            → `**Texte**` (join ↑)
//   B  (ouverture poussée): `**` puis `Texte**`            → `**Texte**` (join ↓)
//   C  (orphelin/enchevêtré) : signalé, NON touché (relecture manuelle)
// Garde-fous : on ne joint JAMAIS si cela créerait `****` (voisin déjà délimité).
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CONTENT_DIR } from './config.mjs';

const ROOT = CONTENT_DIR;
const DRY = process.argv.includes('--dry');
const walk = (dir) =>
  readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? walk(p) : /\.mdx?$/.test(e) ? [p] : [];
  });

const LONE = /^\s*\*\*\s*$/;
const HEAD_BOLD = /^(#{1,6})\s+\*\*\s*$/; // `## **`
const odd = (s) => ((s.match(/\*\*/g) || []).length) % 2 === 1;

let h = 0,
  a = 0,
  b = 0;
const cCases = [];

for (const file of walk(ROOT)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  let bodyStart = 0;
  if (lines[0] === '---') {
    const end = lines.indexOf('---', 1);
    if (end !== -1) bodyStart = end + 1;
  }

  const out = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i < bodyStart) {
      out.push(line);
      continue;
    }
    if (/^\s*```/.test(line)) inFence = !inFence;

    // H : `## **` (ligne) + texte de titre → `## **texte**`
    const hb = !inFence && line.match(HEAD_BOLD);
    if (hb && i + 1 < lines.length && !LONE.test(lines[i + 1]) && lines[i + 1].trim()) {
      const t1 = lines[i + 1].trim();
      // 3 lignes : `## **` / `texte` / `**`
      if (i + 2 < lines.length && LONE.test(lines[i + 2])) {
        out.push(`${hb[1]} **${t1}**`);
        i += 2;
        h++;
        continue;
      }
      // 2 lignes : `## **` / `texte**` (le texte porte déjà la fermeture)
      if (odd(t1) && !/^\*\*/.test(t1)) {
        out.push(`${hb[1]} **${t1}`);
        i += 1;
        h++;
        continue;
      }
    }

    if (!inFence && LONE.test(line)) {
      const prev = out.length ? out[out.length - 1] : '';
      const next = i + 1 < lines.length ? lines[i + 1] : '';
      // A : la ligne précédente ouvre un gras non clos → fermer (sauf si elle finit déjà par `**`).
      if (prev && odd(prev) && !/\*\*\s*$/.test(prev)) {
        out[out.length - 1] = prev.replace(/\s*$/, '') + '**';
        a++;
        continue;
      }
      // B : la ligne suivante ferme un gras → ouvrir (sauf si elle commence déjà par `**`).
      if (next && odd(next) && !/^\s*\*\*/.test(next)) {
        out.push('**' + next.replace(/^\s*/, ''));
        i++;
        b++;
        continue;
      }
      cCases.push(`${file}:${i + 1}`);
    }
    out.push(line);
  }

  if (!DRY) writeFileSync(file, out.join('\n'));
}

console.log(
  `${DRY ? '[DRY] ' : ''}Gras réparé — H (titre+gras): ${h} · A (join↑): ${a} · B (join↓): ${b}`,
);
console.log(`Motif C (à traiter à la main) : ${cCases.length}`);
for (const c of cCases) console.log('  ' + c);
