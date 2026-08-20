// Intégrité des liens INTERNES dans le HTML buildé (dist/).
//
// Angle mort des autres couches : un lien peut être bien rendu (pas une fuite), la page
// peut être complète (pas de drop), et pourtant pointer vers une route/asset qui N'EXISTE
// PAS dans le build — slug typo, vieux lien Webflow `.html`, page droppée, ancre morte.
// Risque #1 d'une migration : navigation cassée. Ce check résout chaque href/src interne
// contre l'arborescence dist/ réelle. Aucune baseline.
//
//   node scripts/migration/link-integrity.mjs            # rapport
//   node scripts/migration/link-integrity.mjs --frag     # + valide les ancres #id
//
// Exit 1 si des liens cassés (utilisable en gate).
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { DIST_DIR } from './config.mjs';

const DIST = DIST_DIR;
const DIST_PREFIX_RE = new RegExp('^' + DIST.replace(/[/\\]/g, '[\\\\/]') + '[\\\\/]');
const CHECK_FRAG = process.argv.includes('--frag');

function walk(d, out = []) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.html')) out.push(p);
  }
  return out;
}
const htmls = walk(DIST);

// Résout une cible interne (chemin absolu /… ou relatif) vers un fichier dist/ existant.
function resolves(target, fromFile) {
  let t = target.split('#')[0].split('?')[0];
  if (!t) return true; // ancre/searchparams pure → même page
  try { t = decodeURIComponent(t); } catch { /* garde tel quel */ }
  if (t === '/') return existsSync(join(DIST, 'index.html'));
  let base;
  if (t.startsWith('/')) base = join(DIST, t.replace(/^\/+/, ''));
  else base = join(dirname(fromFile), t); // relatif à la page courante
  base = normalize(base).replace(/[\\/]+$/, '');
  return (
    existsSync(base) || // asset (png, pdf, xml, js…)
    existsSync(base + '.html') || // route à plat
    existsSync(join(base, 'index.html')) // route Astro
  );
}

// On matche le guillemet ouvrant et on capture jusqu'au MÊME guillemet — sinon une
// apostrophe dans une valeur en "…" (ex. nom de fichier avec apostrophe) tronque la
// capture et produit un faux positif.
const ATTR = /(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const isExternal = (u) =>
  /^(https?:)?\/\//i.test(u) || /^(mailto:|tel:|data:|javascript:|blob:)/i.test(u) || u.startsWith('#');

// id présents par page (pour --frag).
function idsOf(html) {
  const ids = new Set();
  for (const m of html.matchAll(/\sid\s*=\s*["']([^"']+)["']/gi)) ids.add(m[1]);
  for (const m of html.matchAll(/\sname\s*=\s*["']([^"']+)["']/gi)) ids.add(m[1]);
  return ids;
}

const broken = new Map(); // target → Set(pages)
const htmlLinks = []; // liens internes en .html (legacy Webflow)
const encIssues = new Map(); // url → Set(pages) : %2B (et co.) que le host statique ne décode pas
let fragBroken = 0;
const total = { links: 0, internal: 0 };

for (const file of htmls) {
  const html = readFileSync(file, 'utf8');
  // on ignore srcset/scripts inline : on ne scanne que href/src d'attributs simples
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  const ids = CHECK_FRAG ? idsOf(html) : null;
  const page = file.replace(DIST_PREFIX_RE, '').replace(/[\\/]index\.html$/, '/').replace(/\\/g, '/');
  for (const m of body.matchAll(ATTR)) {
    const url = (m[1] ?? m[2]).trim();
    total.links++;
    if (isExternal(url)) {
      // ancre interne #id sur la même page
      if (CHECK_FRAG && url.startsWith('#') && url.length > 1 && ids && !ids.has(url.slice(1))) fragBroken++;
      continue;
    }
    total.internal++;
    if (/\.html(\?|#|$)/i.test(url) && !url.startsWith('//')) htmlLinks.push({ page, url });
    // %2B (= « + » encodé) : Node le décode (le fichier disque existe → "résout"), mais
    // beaucoup de hosts statiques ne le décodent PAS → 404 en prod. Piège invisible au
    // check disque, attrapé en navigateur. On le signale comme cassé.
    if (/%2b/i.test(url)) {
      if (!encIssues.has(url)) encIssues.set(url, new Set());
      encIssues.get(url).add(page);
    }
    if (!resolves(url, file)) {
      if (!broken.has(url)) broken.set(url, new Set());
      broken.get(url).add(page);
    }
  }
}

console.log(`Intégrité des liens : ${htmls.length} pages, ${total.internal} liens internes (${total.links} au total).\n`);

if (broken.size) {
  const rows = [...broken.entries()].sort((a, b) => b[1].size - a[1].size);
  console.log(`✗ ${broken.size} cible(s) interne(s) CASSÉE(S) :\n`);
  for (const [target, pages] of rows) {
    console.log(`  ${String(pages.size).padStart(4)} page(s) → ${target}`);
    console.log(`        ex: ${[...pages].slice(0, 3).join(', ')}${pages.size > 3 ? ' …' : ''}`);
  }
  console.log('');
} else {
  console.log('✓ Aucun lien interne cassé.\n');
}

if (htmlLinks.length) {
  const uniq = [...new Set(htmlLinks.map((l) => l.url))];
  console.log(`⚠ ${htmlLinks.length} lien(s) interne(s) en .html (reliquat Webflow probable) — ${uniq.length} cible(s) :`);
  console.log('   ' + uniq.slice(0, 20).join(', ') + (uniq.length > 20 ? ' …' : '') + '\n');
}

if (encIssues.size) {
  console.log(`✗ ${encIssues.size} URL(s) avec %2B (« + » encodé) — 404 sur host statique :`);
  for (const [u, pages] of [...encIssues.entries()].sort((a, b) => b[1].size - a[1].size)) {
    console.log(`  ${String(pages.size).padStart(4)} page(s) → ${u}`);
  }
  console.log('');
}

if (CHECK_FRAG) console.log(`Ancres #id cassées : ${fragBroken}\n`);

const fail = broken.size > 0 || encIssues.size > 0;
console.log(fail ? `✗ ${broken.size} cible(s) cassée(s)${encIssues.size ? `, ${encIssues.size} URL(s) %2B` : ''}.` : '✓ Liens internes OK.');
process.exit(fail ? 1 : 0);
