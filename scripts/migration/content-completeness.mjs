// Diff de COMPLÉTUDE de contenu : source Webflow (EXPORT_DIR) → build (dist/).
//
// Le screenshot-diff compare des PIXELS (aveugle au lazy-load, baseline vide) et le
// leak-linter scanne des fuites PRÉSENTES. Aucun des deux ne voit du contenu ABSENT —
// exactement la classe de bug d'un bloc droppé par le parseur (pas fuité). Ce script
// calcule `source − build` :
//   • blocs de texte présents dans l'original mais manquants dans notre rendu (DROP)
//   • <title> / meta description manquants ou très différents (SEO drift)
//   • chute du nombre d'images de contenu (asset manquant)
//   • pages source sans route équivalente (gap de couverture)
//
// Le bruit nav/footer est retiré automatiquement : tout trigramme présent sur ≥25% des
// pages source est du boilerplate et est exclu. Aucune baseline live nécessaire.
//
//   node scripts/migration/content-completeness.mjs            # rapport classé
//   node scripts/migration/content-completeness.mjs --json     # + dump JSON détaillé
//
import { readFileSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  EXPORT_DIR,
  DIST_DIR,
  EXPORT_SKIP_SLUGS,
  EXPORT_SUBDIRS,
  ALT_ROUTE_PREFIXES,
  BOILERPLATE_PATTERNS,
} from './config.mjs';

const SRC = EXPORT_DIR;
const DIST = DIST_DIR;
const JSON_OUT = process.argv.includes('--json');

// ---------- mapping source → build ----------
// Pages applicatives / techniques / templates CMS : hors périmètre de fidélité contenu.
const SKIP = EXPORT_SKIP_SLUGS;
// notre build peut nicher certaines pages sous un préfixe (ALT_ROUTE_PREFIXES) ;
// on teste tous les emplacements.
const dst = (slug) => {
  const cands = [join(DIST, slug, 'index.html'), ...ALT_ROUTE_PREFIXES.map((pre) => join(DIST, pre, slug, 'index.html'))];
  for (const cand of cands) {
    if (existsSync(cand)) return cand;
  }
  return null;
};

const pairs = [];
const unmapped = [];
// racine
for (const f of readdirSync(SRC)) {
  if (!f.endsWith('.html')) continue;
  const slug = f.slice(0, -5);
  if (slug.startsWith('detail_') || SKIP.has(slug)) continue;
  if (slug === 'index') { pairs.push({ slug: '/', src: join(SRC, f), dst: join(DIST, 'index.html') }); continue; }
  const d = dst(slug);
  if (d) pairs.push({ slug, src: join(SRC, f), dst: d });
  else unmapped.push(slug);
}
// sous-dossiers de l'export (voir EXPORT_SUBDIRS dans config.mjs)
for (const { dir, routePrefix } of EXPORT_SUBDIRS) {
  if (!existsSync(join(SRC, dir))) continue;
  for (const f of readdirSync(join(SRC, dir))) {
    if (!f.endsWith('.html')) continue;
    const base = f.slice(0, -5);
    if (base.startsWith('detail_') || SKIP.has(base)) continue;
    const slug = routePrefix + base;
    const d = dst(slug);
    if (d) pairs.push({ slug, src: join(SRC, dir, f), dst: d });
    else unmapped.push(dir + '/' + base);
  }
}

// ---------- extraction ----------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ', eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', ecirc: 'ê', acirc: 'â', ocirc: 'ô', icirc: 'î', ucirc: 'û', euml: 'ë', iuml: 'ï', uuml: 'ü', ugrave: 'ù', hellip: '…', laquo: '«', raquo: '»', rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"', ndash: '–', mdash: '—', deg: '°', euro: '€', oelig: 'œ', times: '×', rarr: '→' };
function decode(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z0-9]+);/gi, (_, n) => (ENT[n] ?? ENT[n.toLowerCase()] ?? `&${n};`));
}
function norm(s) {
  return decode(s).normalize('NFC').replace(/[’ʼ‘`´]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
}
function strip(html) {
  return html
    .replace(/<head[\s\S]*?<\/head>/i, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
}
// blocs lisibles : on coupe sur les balises de bloc, le reste devient espace.
function blocks(html) {
  let h = strip(html).replace(/<\/(p|div|section|h[1-6]|li|ul|ol|tr|td|th|article|header|footer|nav|main|figure|figcaption|blockquote)>/gi, '\n');
  h = h.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ');
  return h.split('\n').map(norm).filter((s) => s.split(' ').filter(Boolean).length >= 4);
}
// blob normalisé complet (pour la recherche par trigramme dans la cible)
function blob(html) {
  return norm(strip(html).replace(/<[^>]+>/g, ' '));
}
const words = (s) => s.split(/[^a-zà-ÿ0-9'-]+/i).filter((w) => w.length > 1);
function trigrams(s) {
  const w = words(s), out = [];
  for (let i = 0; i + 2 < w.length; i++) out.push(w[i] + ' ' + w[i + 1] + ' ' + w[i + 2]);
  return out;
}
function imgCount(html) {
  const body = strip(html);
  return (body.match(/<img[\s>]/gi) || []).length;
}
function head(html) {
  const h = (html.match(/<head[\s\S]*?<\/head>/i) || [''])[0];
  const title = norm((h.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1]);
  const desc = norm((h.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || [, ''])[1]);
  return { title, desc };
}
// Squelette de section : texte des <h1..h6>. Catch un titre de section COURT que le
// diff par trigrammes filtre (<4 mots) — donc une section entière silencieusement
// droppée que le recall ne voit pas.
function headings(html) {
  const out = [];
  for (const m of strip(html).matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const t = norm(m[2].replace(/<[^>]+>/g, ' '));
    if (t && t.split(' ').filter(Boolean).length >= 1 && t.length >= 3) out.push(t);
  }
  return out;
}

// ---------- boilerplate (df sur les pages source) ----------
const srcBlocks = pairs.map((p) => blocks(readFileSync(p.src, 'utf8')));
const df = new Map();
srcBlocks.forEach((bl) => {
  const seen = new Set();
  bl.forEach((b) => trigrams(b).forEach((t) => seen.add(t)));
  seen.forEach((t) => df.set(t, (df.get(t) || 0) + 1));
});
const boilerThresh = Math.ceil(pairs.length * 0.25);
const isBoiler = (t) => (df.get(t) || 0) >= boilerThresh;
// Headings source + leur fréquence (un heading sur ≥25 % des pages = nav/footer/CTA chrome).
const srcHeadings = pairs.map((p) => headings(readFileSync(p.src, 'utf8')));
const hdf = new Map();
srcHeadings.forEach((hs) => [...new Set(hs)].forEach((h) => hdf.set(h, (hdf.get(h) || 0) + 1)));
const isBoilerHeading = (h) => (hdf.get(h) || 0) >= boilerThresh;
// Scaffolding Webflow (états de formulaire cachés, copyright) : jamais du contenu réel,
// présents dans le DOM source mais absents de notre rendu natif. Mêmes signatures que le
// leak-linter (form-orphelin). On les exclut pour ne pas noyer les vrais drops.
// → BOILERPLATE_PATTERNS dans config.mjs.
const HARD = BOILERPLATE_PATTERNS;
const isScaffold = (b) => HARD.some((re) => re.test(b));

// ---------- diff par page ----------
const report = [];
pairs.forEach((p, i) => {
  const tgtBlob = blob(readFileSync(p.dst, 'utf8'));
  const tgtTris = new Set(trigrams(tgtBlob));
  const dropped = [];
  for (const b of srcBlocks[i]) {
    if (isScaffold(b)) continue;
    const allTris = trigrams(b);
    // bloc dont TOUS les trigrammes sont du boilerplate = chrome (nav/footer) → ignorer.
    if (allTris.length && allTris.every((t) => isBoiler(t))) continue;
    const tris = allTris.filter((t) => !isBoiler(t));
    if (tris.length < 2) {
      // bloc court : présence directe (sous-chaîne normalisée)
      if (b.length > 25 && !tgtBlob.includes(b)) {
        const present = allTris.some((t) => tgtTris.has(t));
        if (!present) dropped.push({ text: b, recall: 0 });
      }
      continue;
    }
    const present = tris.filter((t) => tgtTris.has(t)).length;
    const recall = present / tris.length;
    if (recall < 0.5) dropped.push({ text: b, recall: +recall.toFixed(2) });
  }
  const sh = head(readFileSync(p.src, 'utf8')), th = head(readFileSync(p.dst, 'utf8'));
  const seo = [];
  if (sh.title && !th.title) seo.push('title manquant');
  if (sh.desc && !th.desc) seo.push('description manquante');
  const si = imgCount(readFileSync(p.src, 'utf8')), ti = imgCount(readFileSync(p.dst, 'utf8'));
  // Parité des headings : titre de section source absent du texte de la cible. On retire
  // les guillemets/points de suspension qui entourent les titres-citations (sinon faux
  // positif : la citation est bien présente, juste pas wrappée pareil) et, pour les titres
  // longs, on tolère via recall de trigrammes (≥0.5 présent = OK).
  const missHead = [...new Set(srcHeadings[i])].filter((h) => {
    if (isBoilerHeading(h) || isScaffold(h)) return false;
    const clean = h.replace(/^["'“”«»…\s]+|["'“”«»…\s]+$/g, '').trim();
    if (!clean || tgtBlob.includes(clean)) return false;
    const ht = trigrams(clean);
    if (ht.length >= 2) return ht.filter((t) => tgtTris.has(t)).length / ht.length < 0.5;
    return true; // titre court non trouvé en sous-chaîne
  });
  report.push({ slug: p.slug, dropped, seo, imgSrc: si, imgDst: ti, imgDelta: si - ti, missHead });
});

// ---------- sortie ----------
report.sort((a, b) => b.dropped.length - a.dropped.length);
const withDrops = report.filter((r) => r.dropped.length);
console.log(`Complétude contenu : ${pairs.length} pages comparées (source Webflow → build).\n`);
console.log(`Boilerplate exclu : trigrammes présents sur ≥${boilerThresh}/${pairs.length} pages.\n`);

if (unmapped.length) {
  console.log(`⚠ ${unmapped.length} pages source SANS route équivalente (gap de couverture, hors app/erreur/template) :`);
  console.log('   ' + unmapped.join(', ') + '\n');
}

console.log(`── Blocs de contenu droppés (présents dans la source, absents du build) ──\n`);
for (const r of withDrops) {
  console.log(`■ ${r.slug}  —  ${r.dropped.length} bloc(s) manquant(s)${r.imgDelta > 1 ? `  · img ${r.imgSrc}→${r.imgDst} (−${r.imgDelta})` : ''}${r.seo.length ? '  · SEO: ' + r.seo.join(', ') : ''}`);
  for (const d of r.dropped.slice(0, 6)) {
    const t = d.text.length > 100 ? d.text.slice(0, 100) + '…' : d.text;
    console.log(`    ↳ [recall ${d.recall}] ${t}`);
  }
  if (r.dropped.length > 6) console.log(`    … +${r.dropped.length - 6} autre(s)`);
  console.log('');
}

// ── Parité des headings (titres de section source absents du build) ──
const withMissHead = report.filter((r) => r.missHead.length).sort((a, b) => b.missHead.length - a.missHead.length);
if (withMissHead.length) {
  console.log(`── Titres de section (<h1-6>) présents dans la source, absents du build ──\n`);
  for (const r of withMissHead) {
    console.log(`■ ${r.slug}  —  ${r.missHead.length} titre(s) manquant(s)`);
    for (const h of r.missHead.slice(0, 8)) console.log(`    ↳ ${h.length > 80 ? h.slice(0, 80) + '…' : h}`);
    if (r.missHead.length > 8) console.log(`    … +${r.missHead.length - 8} autre(s)`);
    console.log('');
  }
}

const imgOnly = report.filter((r) => !r.dropped.length && r.imgDelta > 2);
if (imgOnly.length) {
  console.log(`── Chute d'images sans drop texte (à vérifier : lazy/optimisé vs réel) ──`);
  for (const r of imgOnly) console.log(`  ${r.slug}: ${r.imgSrc}→${r.imgDst} (−${r.imgDelta})`);
  console.log('');
}

console.log(`Résumé : ${withDrops.length}/${pairs.length} pages avec contenu droppé · ${report.reduce((n, r) => n + r.dropped.length, 0)} blocs au total.`);
if (JSON_OUT) {
  writeFileSync('content-completeness.json', JSON.stringify({ unmapped, report }, null, 2));
  console.log('→ détail complet : content-completeness.json');
}
