// Aligne title + description de pages ciblées sur la vérité source (inventory.json),
// au caractère près (apostrophes typographiques incluses). Corrige les diffs SEO.
// Pages ciblées : SYNC_META_MAP (config). Coquilles source : SYNC_TYPO_FIXES (config).
// Usage : node scripts/migration/sync-meta-to-source.mjs [--apply]
import { readFileSync, writeFileSync } from 'node:fs';
import { INVENTORY_FILE, SYNC_META_MAP, SYNC_TYPO_FIXES } from './config.mjs';

const APPLY = process.argv.includes('--apply');
const inv = JSON.parse(readFileSync(INVENTORY_FILE, 'utf8'));
const arr = Array.isArray(inv) ? inv : inv.pages || Object.values(inv);
const find = (p) => arr.find((x) => x.path === p || x.path === p + '/');

// Nettoie les artefacts d'extraction Webflow (espaces multiples + coquilles source
// évidentes). Appliqué À LA FOIS à la page ET à inventory.json → contenu propre + verify vert.
const TYPO = SYNC_TYPO_FIXES;
function clean(s) {
  let v = String(s ?? '').replace(/\s+/g, ' ').trim();
  for (const [a, b] of TYPO) v = v.split(a).join(b);
  return v;
}

// { pathSource: fichier de contenu } — voir SYNC_META_MAP dans config.mjs.
const MAP = SYNC_META_MAP;

function setFmLine(fm, key, value) {
  const re = new RegExp(`^${key}:.*$`, 'm');
  const line = `${key}: ${JSON.stringify(value)}`;
  return re.test(fm) ? fm.replace(re, line) : fm; // ne crée pas la clé si absente
}

let changed = 0;
for (const [p, file] of Object.entries(MAP)) {
  const e = find(p);
  if (!e) { console.log(`⚠️  ${p} absent d'inventory`); continue; }
  const src = readFileSync(file, 'utf8');
  const m = src.match(/^(---\n)([\s\S]*?)(\n---)/);
  if (!m) { console.log(`⚠️  ${file} sans frontmatter`); continue; }
  let fm = m[2];
  // Page : valeur source NETTOYÉE (espaces collapsés + coquilles corrigées).
  if (e.title != null) fm = setFmLine(fm, 'title', clean(e.title));
  if (e.metaDescription != null) fm = setFmLine(fm, 'description', clean(e.metaDescription));
  const out = src.replace(m[0], m[1] + fm + m[3]);
  if (out !== src) {
    changed++;
    console.log(`✎ ${p}`);
    if (APPLY) writeFileSync(file, out, 'utf8');
  }
}
// inventory.json : on corrige UNIQUEMENT les coquilles listées (remplacement ciblé,
// format préservé). Les espaces multiples restants sont neutralisés par norm() dans verify.
if (APPLY && TYPO.length) {
  let raw = readFileSync(INVENTORY_FILE, 'utf8');
  for (const [a, b] of TYPO) raw = raw.split(a).join(b);
  writeFileSync(INVENTORY_FILE, raw, 'utf8');
}
console.log(`\n${APPLY ? 'APPLIQUÉ' : 'DRY-RUN'} : ${changed} pages nettoyées${TYPO.length ? ` + ${APPLY ? 'inventory corrigé' : 'inventory à corriger'} (${TYPO.length} coquille(s))` : ''}`);
if (!APPLY) console.log('(relancer avec --apply)');
