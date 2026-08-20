// Conversion des articles de blog (BLOG_SOURCE_PREFIX) → BLOG_CONTENT_DIR/<slug>.md
// Usage : node scripts/migration/convert-articles.mjs [--limit N]
import {
  parse,
  readFileSync,
  writeFileSync,
  mkdirSync,
  cleanFragment,
  htmlToMarkdown,
  rewriteAsset,
  frontmatter,
  copiedCount,
} from './lib-convert.mjs';
import {
  INVENTORY_FILE,
  BLOG_CONTENT_DIR,
  BLOG_SOURCE_PREFIX,
  CATEGORY_PATH_PREFIX,
  DEFAULT_AUTHOR,
  FALLBACK_PUB_DATE,
} from './config.mjs';

const inv = JSON.parse(readFileSync(INVENTORY_FILE, 'utf8'));
const OUT = BLOG_CONTENT_DIR;
mkdirSync(OUT, { recursive: true });

const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

const articles = inv.pages.filter((p) => p.type === 'article');
let done = 0;
let skipped = 0;
const problems = [];

for (const a of articles) {
  if (done >= LIMIT) break;
  const html = readFileSync(a.localFile, 'utf8');
  const root = parse(html, { blockTextElements: { script: false, style: false } });

  // Corps = le .w-richtext avec le plus de texte (évite les fragments navbar).
  const richtexts = root.querySelectorAll('.w-richtext');
  if (!richtexts.length) {
    problems.push(`${a.path}: pas de .w-richtext`);
    skipped++;
    continue;
  }
  const body = richtexts.sort((x, y) => y.text.length - x.text.length)[0];
  const cleanedHtml = cleanFragment(body);
  const md = htmlToMarkdown(cleanedHtml);

  // Catégorie : best-effort (lien vers CATEGORY_PATH_PREFIX dans la page hors nav/footer).
  let category;
  for (const link of root.querySelectorAll(`a[href*="${CATEGORY_PATH_PREFIX}"]`)) {
    const label = link.text.trim();
    // On ignore les liens du méga-menu (souvent vides ou génériques).
    if (label && label.length < 40 && !/blog|menu/i.test(label)) {
      category = label;
      break;
    }
  }

  const slug = a.path.replace(BLOG_SOURCE_PREFIX, '');
  const hero = a.ogImage ? rewriteAsset(a.ogImage) : undefined;

  const fm = frontmatter({
    title: a.title,
    description: a.metaDescription,
    pubDate: a.datePub ?? FALLBACK_PUB_DATE,
    author: a.author ?? DEFAULT_AUTHOR,
    category,
    heroImage: hero,
    heroImageAlt: hero ? a.h1 || a.title : undefined,
  });

  writeFileSync(`${OUT}/${slug}.md`, fm + md + '\n');
  done++;
}

console.log(`Articles convertis : ${done}/${articles.length} (skipped ${skipped}). Assets copiés : ${copiedCount()}.`);
if (problems.length) console.log('PROBLÈMES:\n' + problems.slice(0, 20).join('\n'));
