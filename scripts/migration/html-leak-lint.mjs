// Linter déterministe de fuites markdown/chrome dans le HTML BUILDÉ (dist/).
//
// Principe : après rendu, certains motifs ne doivent JAMAIS apparaître dans le HTML —
// ce sont des signatures de markdown non converti ou de chrome Webflow fuité. Ce check
// ne dépend d'AUCUNE baseline (pas de live, pas d'export), couvre TOUTES les pages, et
// attrape exactement la classe de bug que le screenshot-diff rate (charabia markdown à
// hauteur/couleur "normales"). 0 occurrence = propre ; sinon on inspecte.
//
//   node scripts/migration/html-leak-lint.mjs            # scanne dist/
//   node scripts/migration/html-leak-lint.mjs <dir>      # scanne un autre dossier
//   node scripts/migration/html-leak-lint.mjs --quiet    # résumé seul
//
// Exit code 1 si des fuites sont trouvées (utilisable en gate).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DIST_DIR, FORM_STATE_PATTERNS, THANK_YOU_PAGE_RE } from './config.mjs';

const ROOT = process.argv.slice(2).find((a) => !a.startsWith('--')) || DIST_DIR;
const QUIET = process.argv.includes('--quiet');

function walk(d) {
  let out = [];
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) out = out.concat(walk(p));
    else if (e.endsWith('.html')) out.push(p);
  }
  return out;
}

// On retire script/style/SVG inline + commentaires : du bruit qui peut contenir des
// caractères ressemblant à du markdown sans en être.
function clean(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
}

// États de formulaire orphelins : signatures combinées depuis FORM_STATE_PATTERNS (config).
const formStateRe = new RegExp(FORM_STATE_PATTERNS.map((r) => r.source).join('|'), 'gi');

// Signatures de fuite. `re` global ; on rapporte un échantillon de contexte.
const SIGNATURES = [
  { id: 'lien-md', desc: 'lien markdown non converti [..](..)', re: /\]\((?:\/|https?:|#|tel:|mailto:)[^)\s]*\)/g },
  { id: 'image-md', desc: 'image markdown non convertie ![..](..)', re: /!\[[^\]]*\]\([^)]*\)/g },
  { id: 'titre-md', desc: 'marqueur de titre ## littéral', re: /(?:^|>|\s)#{2,6}\s+[A-Za-zÀ-ÿ0-9]/g },
  { id: 'echappe-md', desc: 'ponctuation markdown échappée (1\\. \\- …)', re: />[^<]*[0-9A-Za-zÀ-ÿ)]\\[.\-)\]]/g },
  { id: 'lien-js', desc: 'lien javascript: / history.go', re: /javascript:|history\.go\(/g },
  { id: 'form-orphelin', desc: 'état de formulaire orphelin', re: formStateRe },
];

const findings = [];
for (const file of walk(ROOT)) {
  const text = clean(readFileSync(file, 'utf8'));
  // Pages de remerciement (TYP) : leur message de remerciement est du CONTENU légitime,
  // pas un état de formulaire orphelin → on exempte ces pages de la règle form-orphelin.
  const isTyp = THANK_YOU_PAGE_RE ? THANK_YOU_PAGE_RE.test(file) : false;
  for (const sig of SIGNATURES) {
    if (sig.id === 'form-orphelin' && isTyp) continue;
    sig.re.lastIndex = 0;
    const hits = text.match(sig.re);
    if (hits && hits.length) {
      findings.push({ file: file.replace(ROOT + '\\', '').replace(ROOT + '/', ''), sig: sig.id, desc: sig.desc, count: hits.length, sample: hits[0].slice(0, 70) });
    }
  }
}

if (!findings.length) {
  console.log(`✓ Aucune fuite. ${walk(ROOT).length} pages scannées dans ${ROOT}/.`);
  process.exit(0);
}

findings.sort((a, b) => b.count - a.count);
const byPage = new Set(findings.map((f) => f.file));
console.log(`✗ ${findings.length} signalements sur ${byPage.size} pages (${ROOT}/) :\n`);
if (!QUIET) {
  for (const f of findings) {
    console.log(`  ${String(f.count).padStart(4)}×  [${f.sig}]  ${f.file}`);
    console.log(`        ↳ ${JSON.stringify(f.sample)}`);
  }
  console.log('');
}
// Résumé par signature.
const bySig = {};
for (const f of findings) bySig[f.sig] = (bySig[f.sig] || 0) + f.count;
console.log('Par signature :', Object.entries(bySig).map(([k, v]) => `${k}=${v}`).join('  '));
process.exit(1);
