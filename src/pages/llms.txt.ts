import { getCollection } from 'astro:content';
import { SITE } from '@/lib/site';

// llms.txt (GEO) généré au build depuis les collections : titres + descriptions
// du frontmatter, URLs dérivées de la source unique. Une nouvelle page de
// contenu y apparaît automatiquement ; une page .astro bespoke s'ajoute ici.
const url = (path: string) => new URL(path, SITE.url).href;

export async function GET() {
  const pages = await getCollection('pages', ({ data }) => !data.seo?.noindex);
  const landings = await getCollection(
    'landings',
    ({ data }) => !data.seo?.noindex,
  );
  const blog = (
    await getCollection('blog', ({ data }) => !data.draft && !data.seo?.noindex)
  ).sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    '## Pages',
    `- [Accueil](${url('/')}) : ${SITE.description}`,
    `- [Blog](${url('/blog/')}) : articles et guides.`,
    ...pages.map(
      (e) => `- [${e.data.title}](${url(`/${e.id}/`)}) : ${e.data.description}`,
    ),
    ...landings.map(
      (e) => `- [${e.data.title}](${url(`/${e.id}/`)}) : ${e.data.description}`,
    ),
    '',
    '## Articles',
    ...blog.map(
      (e) =>
        `- [${e.data.title}](${url(`/blog/${e.id}/`)}) : ${e.data.tldr ?? e.data.description}`,
    ),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
