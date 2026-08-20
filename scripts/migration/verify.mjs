// Vérification de couverture & parité après build (migration Webflow → Astro).
// Zéro dépendance. Usage : node scripts/migration/verify.mjs
// Lit INVENTORY_FILE (vérité source) et dist/ (build).
// Sort un rapport par check + code de sortie non-zéro si échec bloquant.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DIST_DIR, INVENTORY_FILE, FALLBACK_DESCRIPTION } from './config.mjs';

const DIST = DIST_DIR;
const inv = JSON.parse(readFileSync(INVENTORY_FILE, 'utf8'));

// Pages source non répliquées (consignées) : sitemap-404 + bespoke équivalents.
const SOURCE_404 = new Set(inv.reconciliation.sitemapMissingFromSnapshot.map((u) => new URL(u).pathname));
// Chemins source → fichier dist attendu.
const distFile = (path) => (path === '/' ? join(DIST, 'index.html') : join(DIST, path.replace(/^\//, ''), 'index.html'));

const decode = (s) =>
  (s || '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
// Normalise : décode, ramène nbsp (U+00A0) et apostrophes typographiques, réduit les espaces.
const norm = (s) => decode(s).replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

function metaOf(html, key) {
  // Backreference \1 sur le guillemet délimiteur : ne pas s'arrêter à une apostrophe interne.
  const re = new RegExp(
    `<meta[^>]*?(?:name|property)=["']${key}["'][^>]*?content=(["'])([\\s\\S]*?)\\1` +
      `|<meta[^>]*?content=(["'])([\\s\\S]*?)\\3[^>]*?(?:name|property)=["']${key}["']`,
    'i',
  );
  const m = html.match(re);
  return m ? decode(m[2] ?? m[4]) : null;
}
const titleOf = (html) => {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? decode(m[1]) : null;
};

const report = { coverage: [], title: [], desc: [], links: [], images: [], generators: [] };
let fail = 0;

// --- 1. Couverture : chaque URL source a son fichier dist -----------------
const expect = inv.pages.filter((p) => !SOURCE_404.has(p.path));
let covered = 0;
for (const p of expect) {
  if (existsSync(distFile(p.path))) covered++;
  else report.coverage.push(p.path);
}

// --- 2 & 3. Title + meta description = source (par page) ------------------
let titleOk = 0;
let descOk = 0;
let descFallback = 0;
let redirectStubs = 0;
// Description de repli du site (source vide → fallback accepté et documenté).
const SITE_DESC = FALLBACK_DESCRIPTION;
for (const p of expect) {
  const f = distFile(p.path);
  if (!existsSync(f)) continue;
  const html = readFileSync(f, 'utf8');
  // Redirections intentionnelles (astro.config redirects) : stub « Redirecting to: … »,
  // pas une page de contenu → non comparé.
  if (/^Redirecting to:/i.test(titleOf(html))) {
    redirectStubs++;
    continue;
  }
  // Title
  if (p.title != null) {
    if (norm(titleOf(html)) === norm(p.title)) titleOk++;
    else report.title.push({ path: p.path, source: norm(p.title), dist: norm(titleOf(html)) });
  }
  // Description (source vide → fallback site accepté, si FALLBACK_DESCRIPTION est défini)
  const srcDesc = norm(p.metaDescription);
  const distDesc = norm(metaOf(html, 'description'));
  if (srcDesc) {
    if (distDesc === srcDesc) descOk++;
    else report.desc.push({ path: p.path, source: srcDesc.slice(0, 60), dist: distDesc.slice(0, 60) });
  } else if (SITE_DESC && distDesc === norm(SITE_DESC)) {
    descFallback++; // source vide, fallback site : accepté/documenté
  }
}

// --- 4. Liens internes cassés + images manquantes dans dist ---------------
function* distHtml(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* distHtml(p);
    else if (n.endsWith('.html')) yield p;
  }
}
const distHas = (urlPath) => {
  const clean = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  if (/\.[a-z0-9]{2,5}$/i.test(clean)) return existsSync(join(DIST, clean.replace(/^\//, ''))); // fichier (asset)
  const p = clean.replace(/\/$/, '');
  return existsSync(join(DIST, p.replace(/^\//, ''), 'index.html')) || existsSync(join(DIST, p.replace(/^\//, '') + '.html'));
};
// Liens cassés HÉRITÉS du source (404 source, liens internes cassés du source) : documentés, non bloquants.
const inheritedBroken = new Set([
  ...inv.reconciliation.brokenSourceLinks.map((b) => new URL(b.url).pathname.replace(/\/$/, '')),
  ...[...SOURCE_404].map((p) => p.replace(/\/$/, '')),
]);
const brokenLinks = new Map();
const inheritedLinks = new Map();
const missingImgs = new Map();
let pagesScanned = 0;
for (const f of distHtml(DIST)) {
  pagesScanned++;
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/href="(\/[^"#]*)"/g)) {
    const href = m[1];
    if (href.startsWith('/_astro/') || href.startsWith('//')) continue;
    if (distHas(href)) continue;
    if (inheritedBroken.has(decodeURIComponent(href).replace(/\/$/, '')))
      inheritedLinks.set(href, (inheritedLinks.get(href) || 0) + 1);
    else brokenLinks.set(href, (brokenLinks.get(href) || 0) + 1);
  }
  for (const m of html.matchAll(/<img[^>]+src="(\/[^"]+)"/g)) {
    const src = m[1];
    if (src.startsWith('/_astro/')) continue;
    if (!existsSync(join(DIST, decodeURIComponent(src).replace(/^\//, '')))) missingImgs.set(src, (missingImgs.get(src) || 0) + 1);
  }
}

// --- 5. Générateurs : sitemap / llms couvrent le contenu ------------------
const sitemap = existsSync(join(DIST, 'sitemap.xml')) ? readFileSync(join(DIST, 'sitemap.xml'), 'utf8') : '';
const llms = existsSync(join(DIST, 'llms.txt')) ? readFileSync(join(DIST, 'llms.txt'), 'utf8') : '';
const sitemapCount = (sitemap.match(/<loc>/g) || []).length;

// --- Bilan ----------------------------------------------------------------
const line = (ok, label) => `${ok ? 'PASS' : 'FAIL'}  ${label}`;
console.log('===== VÉRIFICATION MIGRATION =====');
console.log(`Pages source attendues (hors 404 source) : ${expect.length}`);
const covOk = report.coverage.length === 0;
console.log(line(covOk, `Couverture dist : ${covered}/${expect.length}`));
if (!covOk) {
  fail++;
  console.log('   manquantes:', report.coverage.slice(0, 25).join(', '));
}
const titleAllOk = report.title.length === 0;
console.log(line(titleAllOk, `Titles = source : ${titleOk} ok, ${report.title.length} diffs`));
if (!titleAllOk) {
  fail++;
  report.title.slice(0, 12).forEach((d) => console.log(`   ${d.path}\n     src : ${d.source}\n     dist: ${d.dist}`));
}
const descAllOk = report.desc.length === 0;
console.log(line(descAllOk, `Meta desc = source : ${descOk} ok, ${descFallback} fallback site (vide source), ${report.desc.length} diffs`));
if (!descAllOk) {
  fail++;
  report.desc.slice(0, 12).forEach((d) => console.log(`   ${d.path}\n     src : ${d.source}\n     dist: ${d.dist}`));
}
if (redirectStubs) console.log(`INFO  redirections intentionnelles ignorées (title/meta) : ${redirectStubs}`);
const linksOk = brokenLinks.size === 0;
console.log(
  line(linksOk, `Liens internes : ${pagesScanned} pages scannées, ${brokenLinks.size} cassées (hors ${inheritedLinks.size} héritées du source)`),
);
if (!linksOk) {
  fail++;
  [...brokenLinks.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([h, n]) => console.log(`   ${h} (×${n})`));
}
if (inheritedLinks.size)
  console.log(`INFO  liens cassés hérités du source (documentés, non répliqués) : ${inheritedLinks.size}`);
const imgOk = missingImgs.size === 0;
console.log(line(imgOk, `Images : ${missingImgs.size} manquantes`));
if (!imgOk) {
  fail++;
  [...missingImgs.keys()].slice(0, 25).forEach((s) => console.log(`   ${s}`));
}
console.log(`INFO  sitemap.xml : ${sitemapCount} URLs · llms.txt : ${llms.length} octets`);

console.log(`\n${fail === 0 ? '✅ TOUT VERT' : `❌ ${fail} check(s) en échec`}`);
process.exit(fail === 0 ? 0 : 1);
