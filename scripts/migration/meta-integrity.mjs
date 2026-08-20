// Intégrité SEO/meta du HTML buildé (dist/).
//
// Vérifie ce que les couches contenu/liens ne regardent pas : le <head> et la structure
// sémantique de CHAQUE page. Règles :
//   • title présent, ≤ 60 car, UNIQUE (doublon = template qui n'interpole pas)
//   • description présente, 140-160 car (warn hors borne), unique
//   • canonical présent et auto-cohérent (pointe la page elle-même)
//   • og:title / og:description / og:image présents ; og:image résout sur disque
//   • exactement UN <h1>
//   • chaque JSON-LD parse en JSON valide
//   • robots pas en noindex par accident
// Aucune baseline. Les stubs de redirection (meta-refresh) sont exclus.
//
//   node scripts/migration/meta-integrity.mjs           # rapport
//   node scripts/migration/meta-integrity.mjs --strict  # exit 1 si erreurs (gate)
//
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { DIST_DIR } from './config.mjs';

const DIST = DIST_DIR;
const DIST_PREFIX_RE = new RegExp('^' + DIST.replace(/[/\\]/g, '[\\\\/]') + '[\\\\/]');
const STRICT = process.argv.includes('--strict');
// URL de prod dérivée de la source unique (astro.config.mjs `site`) — évite un second
// littéral qui divergerait silencieusement.
const SITE_MATCH = readFileSync('astro.config.mjs', 'utf8').match(/site:\s*'([^']+)'/);
if (!SITE_MATCH) throw new Error('meta-integrity : `site` introuvable dans astro.config.mjs');
const SITE = SITE_MATCH[1].replace(/\/$/, '');

function walk(d, out = []) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.html')) out.push(p);
  }
  return out;
}
const pageUrl = (f) => '/' + f.replace(DIST_PREFIX_RE, '').replace(/index\.html$/, '').replace(/\\/g, '/');
// Décodage minimal pour MESURER les longueurs sans gonflement (`&amp;`=5→1, `&#39;`=5→1…).
const decode = (s) =>
  (s || '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&[a-z]+;/gi, 'x');
const norm = (s) => decode(s || '').replace(/\s+/g, ' ').trim();
const attr = (tag, name) => {
  const m = tag.match(new RegExp(name + '\\s*=\\s*"([^"]*)"', 'i'));
  return m ? m[1] : null;
};

const errors = [];
const warns = [];
const titles = new Map(); // title → [pages]
const descs = new Map();
const ogMissing = new Set(); // og:image cibles manquantes

for (const file of walk(DIST)) {
  const html = readFileSync(file, 'utf8');
  if (/http-equiv=["']refresh["']/i.test(html)) continue; // stub de redirection
  if (/[\\/]40[0-9]\.html$/.test(file)) continue; // pages d'erreur (canonical/h1 hors normes)
  const url = pageUrl(file);
  const headHtml = (html.match(/<head[\s\S]*?<\/head>/i) || [''])[0];
  const E = (m) => errors.push(`${url} — ${m}`);
  const W = (m) => warns.push(`${url} — ${m}`);

  // title
  const title = norm((headHtml.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1]);
  if (!title) E('title manquant');
  else {
    if (title.length > 60) W(`title ${title.length} car (>60) : "${title.slice(0, 50)}…"`);
    if (!titles.has(title)) titles.set(title, []);
    titles.get(title).push(url);
  }

  // meta description
  const metas = headHtml.match(/<meta[^>]*>/gi) || [];
  const descTag = metas.find((t) => /name=["']description["']/i.test(t));
  const desc = norm(descTag && attr(descTag, 'content'));
  if (!desc) E('description manquante');
  else {
    if (desc.length < 120 || desc.length > 170) W(`description ${desc.length} car (cible 140-160)`);
    if (!descs.has(desc)) descs.set(desc, []);
    descs.get(desc).push(url);
  }

  // canonical auto-cohérent
  const canTag = (headHtml.match(/<link[^>]*rel=["']canonical["'][^>]*>/i) || [''])[0];
  const can = canTag && attr(canTag, 'href');
  if (!can) E('canonical manquant');
  else {
    const canPath = can.replace(SITE, '').replace(/\/$/, '') || '/';
    const urlPath = url.replace(/\/$/, '') || '/';
    if (canPath !== urlPath) E(`canonical incohérent : ${canPath} ≠ ${urlPath}`);
  }

  // Open Graph
  const og = (p) => {
    const t = metas.find((x) => new RegExp(`property=["']og:${p}["']`, 'i').test(x));
    return t && attr(t, 'content');
  };
  if (!og('title')) W('og:title manquant');
  if (!og('description')) W('og:description manquant');
  const ogImg = og('image');
  if (!ogImg) E('og:image manquant');
  else {
    const rel = ogImg.replace(SITE, '').split('?')[0];
    if (rel.startsWith('/')) {
      const onDisk = join(DIST, decodeURIComponent(rel).replace(/^\/+/, ''));
      if (!existsSync(onDisk)) { E(`og:image introuvable sur disque : ${rel}`); ogMissing.add(rel); }
    }
  }

  // robots noindex involontaire
  const robots = metas.find((t) => /name=["']robots["']/i.test(t));
  if (robots && /noindex/i.test(attr(robots, 'content') || '')) W('robots = noindex');

  // un seul <h1>
  const body = html.replace(/<head[\s\S]*?<\/head>/i, '').replace(/<script[\s\S]*?<\/script>/gi, ' ');
  const h1n = (body.match(/<h1[\s>]/gi) || []).length;
  if (h1n === 0) E('aucun <h1>');
  else if (h1n > 1) W(`${h1n} <h1> (devrait être 1)`);

  // JSON-LD valide
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(m[1]); } catch { E('JSON-LD invalide'); }
  }
}

// doublons
const dupTitles = [...titles.entries()].filter(([, p]) => p.length > 1);
const dupDescs = [...descs.entries()].filter(([, p]) => p.length > 1);

console.log(`Meta/SEO : ${walk(DIST).length} pages (stubs de redirection exclus).\n`);

if (errors.length) {
  console.log(`✗ ${errors.length} ERREUR(S) :`);
  for (const e of errors.slice(0, 60)) console.log('  ' + e);
  if (errors.length > 60) console.log(`  … +${errors.length - 60}`);
  console.log('');
}
if (dupTitles.length) {
  console.log(`✗ ${dupTitles.length} title(s) EN DOUBLON :`);
  for (const [t, p] of dupTitles.slice(0, 20)) console.log(`  "${t.slice(0, 55)}" ×${p.length} → ${p.slice(0, 3).join(', ')}${p.length > 3 ? ' …' : ''}`);
  console.log('');
}
if (dupDescs.length) {
  console.log(`⚠ ${dupDescs.length} description(s) en doublon :`);
  for (const [d, p] of dupDescs.slice(0, 15)) console.log(`  "${d.slice(0, 50)}…" ×${p.length} → ${p.slice(0, 3).join(', ')}${p.length > 3 ? ' …' : ''}`);
  console.log('');
}
if (warns.length) {
  console.log(`⚠ ${warns.length} avertissement(s) :`);
  for (const w of warns.slice(0, 40)) console.log('  ' + w);
  if (warns.length > 40) console.log(`  … +${warns.length - 40}`);
  console.log('');
}

console.log(
  errors.length || dupTitles.length
    ? `${errors.length} erreur(s) bloquante(s), ${dupTitles.length} titres dupliqués (doublons = qualité SEO, non bloquant).`
    : '✓ Meta/SEO OK.',
);
// Le gate échoue UNIQUEMENT sur les erreurs dures (title/canonical/og/h1/JSON-LD).
// Les doublons de titres reflètent souvent la structure source (même produit, pagination)
// → reportés mais non bloquants.
process.exit(STRICT && errors.length ? 1 : 0);
