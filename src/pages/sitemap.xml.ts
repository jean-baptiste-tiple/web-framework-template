import { getCollection } from 'astro:content';
import { SITE } from '@/lib/site';

// Sitemap custom (remplace @astrojs/sitemap) pour émettre un <lastmod> par
// page depuis updatedDate/pubDate (signal de fraîcheur) et exclure les pages
// noindex. Les collections sont découvertes automatiquement ; toute NOUVELLE
// page .astro bespoke doit être ajoutée à BESPOKE ci-dessous.
const BESPOKE: { path: string; lastmod?: Date }[] = [
  { path: '/' },
  { path: '/contact/' },
];

const day = (d: Date) => d.toISOString().slice(0, 10);

export async function GET() {
  const blog = await getCollection(
    'blog',
    ({ data }) => !data.draft && !data.seo?.noindex,
  );
  const pages = await getCollection('pages', ({ data }) => !data.seo?.noindex);
  const landings = await getCollection(
    'landings',
    ({ data }) => !data.seo?.noindex,
  );

  // /blog : lastmod = date du contenu le plus récent.
  const blogDates = blog
    .map((e) => e.data.updatedDate ?? e.data.pubDate)
    .sort((a, b) => b.getTime() - a.getTime());

  const urls: { path: string; lastmod?: Date }[] = [
    ...BESPOKE,
    ...(blog.length ? [{ path: '/blog/', lastmod: blogDates[0] }] : []),
    ...pages.map((e) => ({
      path: `/${e.id}/`,
      lastmod: e.data.updatedDate,
    })),
    ...landings.map((e) => ({
      path: `/${e.id}/`,
      lastmod: e.data.updatedDate,
    })),
    ...blog.map((e) => ({
      path: `/blog/${e.id}/`,
      lastmod: e.data.updatedDate ?? e.data.pubDate,
    })),
  ];

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      (u) =>
        `  <url><loc>${new URL(u.path, SITE.url).href}</loc>${
          u.lastmod ? `<lastmod>${day(u.lastmod)}</lastmod>` : ''
        }</url>`,
    ),
    '</urlset>',
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
