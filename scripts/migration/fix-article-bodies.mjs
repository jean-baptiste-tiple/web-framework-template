// Répare la TRONCATURE des articles de blog.
//
// Cause : convert-articles.mjs ne gardait QUE le plus gros bloc `.w-richtext` du corps.
// Or Webflow découpe le corps en PLUSIEURS `.w-richtext` autour d'un bandeau CTA
// intégré (heading + bouton « Télécharger le guide » vers une LP). Tout ce qui
// suit ce bandeau était donc perdu.
//
// Ce script reconstruit le corps COMPLET dans l'ordre DOM :
//   richtext[0] … [bandeau CTA] … richtext[1] …
// en CONSERVANT le bloc déjà présent (post-corrections bold/headings/links) et en
// (ré)insérant les fragments manquants + le bandeau CTA (rendu en encart markdown).
//
// Usage : node scripts/migration/fix-article-bodies.mjs [--write] [--limit N]
import { parse, readFileSync, writeFileSync, existsSync, cleanFragment, htmlToMarkdown } from './lib-convert.mjs';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { BLOG_CONTENT_DIR, BLOG_SOURCE_PREFIX, SNAPSHOT_DIR } from './config.mjs';

const WRITE = process.argv.includes('--write');
const limArg = process.argv.indexOf('--limit');
const LIMIT = limArg > -1 ? Number(process.argv[limArg + 1]) : Infinity;

const BLOG = BLOG_CONTENT_DIR;
// Dossier snapshot des articles (ex. scripts/migration/snapshot/pages/post).
const SNAP = join(SNAPSHOT_DIR, 'pages', BLOG_SOURCE_PREFIX.replace(/^\/|\/$/g, '')).replace(/\\/g, '/');

const isHidden = (cls) => /w-condition-inv|w-dyn-bind-empty/.test(cls);
const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();

// Encart CTA intégré (heading + bouton vers une LP). Rendu en blockquote markdown
// (à mettre en valeur côté site, ex. .prose-content blockquote) avec le lien de conversion.
function ctaMarkdown(el) {
  const a = el.querySelector('a[href]');
  if (!a) return '';
  let href = a.getAttribute('href') || '';
  const label = a.text.replace(/\s+/g, ' ').trim();
  // Texte du heading = tout le texte de l'encart SAUF le libellé du bouton.
  let heading = el.text.replace(/\s+/g, ' ').trim();
  if (label && heading.includes(label)) heading = heading.replace(label, '').trim();
  heading = heading.replace(/[?!.]\s*$/, (m) => m.trim());
  if (!heading && !label) return '';
  const lines = [];
  if (heading) lines.push(`> **${heading}**`);
  if (label) lines.push(`>`, `> [${label}](${href})`);
  return lines.join('\n');
}

let changed = 0;
let scanned = 0;
const report = [];

for (const file of readdirSync(BLOG).filter((f) => f.endsWith('.md'))) {
  if (changed >= LIMIT) break;
  const slug = file.replace(/\.md$/, '');
  const snap = `${SNAP}/${slug}/index.html`;
  if (!existsSync(snap)) continue;
  scanned++;

  const root = parse(readFileSync(snap, 'utf8'), { blockTextElements: { script: false, style: false } });
  const richtexts = root.querySelectorAll('.w-richtext').filter((r) => r.text.trim().length > 20 && !isHidden(r.getAttribute('class') || ''));
  if (richtexts.length < 2) continue; // pas tronqué

  // Conteneur de corps = parent commun des richtexts.
  const container = richtexts[0].parentNode;

  // Fragments dans l'ordre DOM (richtext | bandeau CTA).
  const frags = [];
  for (const child of container.childNodes) {
    if (!child.tagName) continue;
    const cls = child.getAttribute('class') || '';
    if (isHidden(cls)) continue;
    if (/\bw-richtext\b/.test(cls) && child.text.trim().length > 20) {
      frags.push({ type: 'rt', node: child, len: child.text.trim().length });
    } else if (child.querySelector && child.querySelector('a[href]') && child.text.trim().length > 12 && child.text.trim().length < 320) {
      // Bandeau CTA intégré (heading + bouton). On exclut les blocs trop longs (vrais paragraphes).
      const md = ctaMarkdown(child);
      if (md) frags.push({ type: 'cta', md });
    }
  }
  const rtFrags = frags.filter((f) => f.type === 'rt');
  if (rtFrags.length < 2) continue;

  // Bloc « gardé » par convert-articles = le plus gros richtext.
  const keptLen = Math.max(...rtFrags.map((f) => f.len));

  // Corps actuel (préserve les post-corrections). Normalise CRLF → LF (autocrlf Windows).
  const raw = readFileSync(`${BLOG}/${file}`, 'utf8').replace(/\r\n/g, '\n');
  const m = raw.match(/^---\n[\s\S]*?\n---\n?/);
  if (!m) continue;
  const fm = m[0];
  const currentBody = raw.slice(fm.length).trim();

  // Reconstruit le corps dans l'ordre DOM.
  let keptUsed = false;
  const parts = frags.map((f) => {
    if (f.type === 'cta') return f.md;
    if (f.len === keptLen && !keptUsed) {
      keptUsed = true;
      return currentBody; // bloc déjà présent, corrigé → on le garde tel quel
    }
    return htmlToMarkdown(cleanFragment(f.node));
  });
  const newBody = parts.filter(Boolean).join('\n\n').replace(/\n{3,}/g, '\n\n').trim();

  // Garde-fou : le nouveau corps doit CONTENIR l'ancien (on n'a fait qu'ajouter).
  if (!norm(newBody).includes(norm(currentBody).slice(0, 120))) {
    report.push(`SKIP (mismatch) ${slug}`);
    continue;
  }
  if (norm(newBody) === norm(currentBody)) continue; // rien à ajouter

  changed++;
  report.push(`+ ${slug}  (+${newBody.length - currentBody.length} car, ${rtFrags.length} blocs)`);
  if (WRITE) writeFileSync(`${BLOG}/${file}`, fm + newBody + '\n');
}

console.log(`Scannés (avec snapshot): ${scanned} | Reconstruits: ${changed}${WRITE ? ' (ÉCRITS)' : ' (dry-run)'}`);
console.log(report.slice(0, 40).join('\n'));
if (report.length > 40) console.log(`… +${report.length - 40} autres`);
