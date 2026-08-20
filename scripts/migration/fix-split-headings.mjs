// Répare les TITRES coupés par la migration : le source avait des titres sur 2 lignes
// (retour à la ligne interne) ; l'export markdown a produit `# Ligne1\nLigne2` SANS ligne
// vide → CommonMark rend un titre `# Ligne1` + un paragraphe `Ligne2`. Sur le live le
// titre est entier. On recolle la ligne de continuation au titre.
//
// Sûreté : on ne fusionne QUE `# Titre` + UNE ligne de continuation (texte simple, courte)
// SUIVIE d'une ligne vide. Un titre correctement suivi d'une ligne vide n'est pas touché ;
// un paragraphe multi-lignes (2e ligne non vide) n'est pas touché. Restreindre
// SPLIT_HEADING_ROOTS (config) si certaines collections gèrent le cas dans leur parser.
//
// Usage : node scripts/migration/fix-split-headings.mjs [--write]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SPLIT_HEADING_ROOTS } from './config.mjs';

const WRITE = process.argv.includes('--write');
const ROOTS = SPLIT_HEADING_ROOTS;

const isCont = (l) =>
  l.trim().length > 0 &&
  l.trim().length < 110 &&
  !/^#{1,6} /.test(l) && // pas un titre
  !/^[-*>|]/.test(l.trim()) && // pas liste/citation/table
  !/^!\[/.test(l.trim()) && // pas image
  !/^\[/.test(l.trim()); // pas lien/CTA

let changed = 0;
const report = [];

function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.mdx?$/.test(e.name)) fixFile(p);
  }
}

function fixFile(file) {
  const raw = readFileSync(file, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const txt = raw.replace(/\r\n/g, '\n');
  const fmEnd = txt.indexOf('\n---', 3);
  const head = fmEnd > -1 ? txt.slice(0, fmEnd + 4) : '';
  const body = fmEnd > -1 ? txt.slice(fmEnd + 4) : txt;

  const lines = body.split('\n');
  const out = [];
  const merges = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const next = lines[i + 1];
    const after = lines[i + 2];
    if (/^#{1,6} \S/.test(l) && next !== undefined && isCont(next) && (after === undefined || after.trim() === '')) {
      out.push(l.replace(/\s+$/, '') + ' ' + next.trim());
      merges.push(`${l.trim()}  +  ${next.trim()}`.slice(0, 90));
      i++; // consomme la continuation
    } else {
      out.push(l);
    }
  }
  if (!merges.length) return;
  changed++;
  report.push(`+ ${file.replace(/.*content[\\/]/, '')} (${merges.length})`);
  merges.forEach((m) => report.push(`     ${m}`));
  if (WRITE) {
    const result = (head + out.join('\n')).replace(/\n/g, eol);
    writeFileSync(file, result);
  }
}

ROOTS.forEach(walk);
console.log(`Fichiers corrigés : ${changed}${WRITE ? ' (ÉCRITS)' : ' (dry-run)'}\n`);
console.log(report.join('\n'));
