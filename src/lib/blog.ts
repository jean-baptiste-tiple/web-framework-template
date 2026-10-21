import { getCollection, type CollectionEntry } from 'astro:content';

// Source unique de la liste des articles (ADR 0002) : toute page ou route qui
// liste ou rend des articles passe par ici, jamais par getCollection('blog').
export type Post = CollectionEntry<'blog'>;

// Article programmé : `pubDate` dans le futur. En production (build lancé par
// l'action « Mise en ligne », VERCEL_ENV=production), il n'existe pas avant ce
// jour-là : ni page, ni carte, ni sitemap, RSS, llms.txt. La reconstruction
// quotidienne de l'action (.github/workflows/production.yml, 04:00 UTC) le fait
// paraître. Sur TEST, les aperçus et en local, il est visible pour la relecture.
const showScheduled = process.env.VERCEL_ENV !== 'production';
const buildTime = Date.now();

const byDate = (a: Post, b: Post) => b.data.pubDate.getTime() - a.data.pubDate.getTime();

// Articles publiés (ni brouillon, ni programmé en production), du plus récent au plus ancien.
export async function getPosts(): Promise<Post[]> {
  return (
    await getCollection(
      'blog',
      ({ data }) => !data.draft && (showScheduled || data.pubDate.getTime() <= buildTime),
    )
  ).sort(byDate);
}

// Articles indexables (sitemap, llms.txt).
export async function getIndexablePosts(): Promise<Post[]> {
  return (await getPosts()).filter((p) => !p.data.seo?.noindex);
}
