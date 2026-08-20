// Inventaire du site source à partir du snapshot HTML local.
// Zéro dépendance. Produit INVENTORY_FILE (vérité source de toute la migration).
// Usage : node scripts/migration/inventory.mjs
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import {
  SOURCE_ORIGIN,
  SNAPSHOT_DIR,
  SNAPSHOT_DATE,
  INVENTORY_FILE,
  classifyPath,
  PUB_DATE_RE,
  AUTHOR_RE,
} from './config.mjs';

const ORIGIN = SOURCE_ORIGIN;
// Origine apex (sans www) : certains sitemaps la mélangent avec la canonique.
const APEX_ORIGIN = new URL(SOURCE_ORIGIN).protocol + '//' + new URL(SOURCE_ORIGIN).hostname.replace(/^www\./, '');
const PAGES = join(SNAPSHOT_DIR, 'pages');

// Décode les entités HTML les plus courantes (titres/descriptions).
function decode(s) {
  if (!s) return s;
  return s
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .trim();
}

const stripTags = (s) => decode((s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();

// Récupère un attribut content d'une balise meta (name OU property), insensible à l'ordre.
function meta(html, key) {
  const re = new RegExp(
    `<meta[^>]*?(?:name|property)=["']${key}["'][^>]*?content=["']([^"']*)["'][^>]*?>` +
      `|<meta[^>]*?content=["']([^"']*)["'][^>]*?(?:name|property)=["']${key}["'][^>]*?>`,
    'i',
  );
  const m = html.match(re);
  return m ? decode(m[1] ?? m[2]) : null;
}

// Date de publication "D.M.YYYY" -> ISO YYYY-MM-DD (articles seulement).
function pubDate(html) {
  if (!PUB_DATE_RE) return null;
  const m = html.match(PUB_DATE_RE);
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function author(html) {
  if (!AUTHOR_RE) return null;
  const m = html.match(AUTHOR_RE);
  return m ? decode(m[1]) : null;
}

// Walk récursif des index.html
function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (name === 'index.html') yield p;
  }
}

const items = [];
for (const file of walk(PAGES)) {
  const rel = relative(PAGES, file).replace(/\\/g, '/').replace(/\/index\.html$/, '');
  const path = rel === 'index.html' ? '/' : '/' + rel;
  const html = readFileSync(file, 'utf8');
  const titleM = html.match(/<title>([^<]*)<\/title>/i);
  const h1M = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const type = classifyPath(path);
  const entry = {
    url: ORIGIN + (path === '/' ? '/' : path),
    path,
    type,
    title: titleM ? decode(titleM[1]) : null,
    metaDescription: meta(html, 'description'),
    ogImage: meta(html, 'og:image'),
    h1: h1M ? stripTags(h1M[1]) : null,
    localFile: relative('.', file).replace(/\\/g, '/'),
  };
  if (type === 'article') {
    entry.datePub = pubDate(html);
    entry.author = author(html);
  }
  items.push(entry);
}

items.sort((a, b) => a.path.localeCompare(b.path));

// Stats par type
const byType = {};
for (const it of items) byType[it.type] = (byType[it.type] || 0) + 1;

// Réconciliation avec le sitemap source + liens cassés (crawl-log).
const sitemapXml = readFileSync(join(SNAPSHOT_DIR, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1].trim().replace(/\/$/, '').replace(APEX_ORIGIN, ORIGIN));
const sitemapSet = new Set(sitemapUrls);
const invSet = new Set(items.map((p) => p.url.replace(/\/$/, '')));
const crawlLog = JSON.parse(readFileSync(join(SNAPSHOT_DIR, 'crawl-log.json'), 'utf8'));

const sitemapMissingFromSnapshot = [...sitemapSet].filter((u) => !invSet.has(u) && u !== ORIGIN);
const snapshotNotInSitemap = [...invSet].filter((u) => !sitemapSet.has(u) && u !== ORIGIN);
const brokenSourceLinks = Object.entries(crawlLog)
  .filter(([, v]) => v.status !== 200)
  .map(([url, v]) => ({ url, status: v.status }))
  .filter((x) => x.url !== ORIGIN + '/)'); // artefact de parsing

const out = {
  source: ORIGIN,
  snapshotDate: SNAPSHOT_DATE,
  generatedFrom: PAGES.replace(/\\/g, '/'),
  total: items.length,
  byType,
  reconciliation: {
    sitemapCount: sitemapSet.size,
    snapshotCount: invSet.size,
    sitemapMissingFromSnapshot, // dans le sitemap source mais 404 → non répliquables
    snapshotNotInSitemap, // pages réelles (200) découvertes au crawl, hors sitemap
    brokenSourceLinks, // liens internes cassés DU SITE SOURCE (à ne pas répliquer)
  },
  pages: items,
};
mkdirSync(dirname(INVENTORY_FILE), { recursive: true });
writeFileSync(INVENTORY_FILE, JSON.stringify(out, null, 2));
console.log(INVENTORY_FILE + ' :', items.length, 'pages');
console.log(JSON.stringify(byType, null, 0));
// Pages sans title ou sans description : à signaler
const missing = items.filter((i) => !i.title || !i.metaDescription);
if (missing.length) console.log('SANS title/description :', missing.map((m) => m.path).join(', '));
