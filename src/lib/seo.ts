import { SITE } from './site';

export interface SeoInput {
  title?: string;
  description?: string;
  seo?: {
    title?: string;
    description?: string;
    canonical?: string;
    ogImage?: string;
    noindex?: boolean;
  };
  ogImage?: string;
}

export interface ResolvedSeo {
  title: string;
  description: string;
  canonical: string;
  /** URL absolue du jumeau Markdown de la page (voir integrations/markdown-twins). */
  markdown: string;
  ogImage: string;
  noindex: boolean;
}

/**
 * Résout les meta finales d'une page.
 * Priorité : champ `seo.*` (override explicite) > champ de base > défaut du site.
 * `pathname` doit être Astro.url.pathname.
 */
export function resolveSeo(input: SeoInput, pathname: string): ResolvedSeo {
  const baseTitle = input.seo?.title ?? input.title ?? SITE.name;
  const description =
    input.seo?.description ?? input.description ?? SITE.description;

  // Slash final systématique : c'est l'URL réellement servie (build format
  // "directory") et celle du sitemap. Une seule forme déclarée partout.
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const canonical = input.seo?.canonical ?? new URL(path, SITE.url).href;

  // Jumeau Markdown : le canonical sans slash final + .md ; la racine n'a pas
  // de segment, son jumeau est /index.md (cf. src/integrations/markdown-twins.mjs).
  const markdown =
    new URL(canonical).pathname === '/'
      ? new URL('/index.md', SITE.url).href
      : `${canonical.replace(/\/$/, '')}.md`;

  const rawOg = input.seo?.ogImage ?? input.ogImage ?? SITE.defaultOgImage;
  const ogImage = rawOg.startsWith('http')
    ? rawOg
    : new URL(rawOg, SITE.url).href;

  return {
    title: baseTitle === SITE.name ? baseTitle : `${baseTitle} | ${SITE.name}`,
    description,
    canonical,
    markdown,
    ogImage,
    noindex: input.seo?.noindex ?? false,
  };
}
