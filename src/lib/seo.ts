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

  const path =
    pathname.endsWith('/') && pathname !== '/'
      ? pathname.slice(0, -1)
      : pathname;
  const canonical = input.seo?.canonical ?? new URL(path, SITE.url).href;

  const rawOg = input.seo?.ogImage ?? input.ogImage ?? SITE.defaultOgImage;
  const ogImage = rawOg.startsWith('http')
    ? rawOg
    : new URL(rawOg, SITE.url).href;

  return {
    title: baseTitle === SITE.name ? baseTitle : `${baseTitle} — ${SITE.name}`,
    description,
    canonical,
    ogImage,
    noindex: input.seo?.noindex ?? false,
  };
}
