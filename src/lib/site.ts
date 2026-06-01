import settings from '@/content/settings/site.json';

// --- Configuration TECHNIQUE (éditée par un dev) -----------------------------
// URL de prod, locale, chemins d'assets, identité JSON-LD.
const TECHNICAL = {
  // Doit correspondre à `site` dans astro.config.mjs (sans slash final).
  url: 'https://example.com',
  locale: 'fr-FR',
  lang: 'fr',
  // Image OG par défaut (dans /public). Override possible par page via seo.ogImage.
  defaultOgImage: '/og-default.png',
  organization: {
    logo: '/logo.png',
    sameAs: [] as string[], // ['https://www.linkedin.com/company/...', ...]
  },
};

// --- Configuration ÉDITORIALE (src/content/settings/site.json) ---------------
// Textes globaux partagés, édités directement dans ce fichier JSON :
// nom, description, navigation, organisation, réseaux, FAQ globale partagée.
export const SITE = {
  name: settings.name,
  shortName: settings.shortName,
  url: TECHNICAL.url,
  description: settings.description,
  locale: TECHNICAL.locale,
  lang: TECHNICAL.lang,
  defaultOgImage: TECHNICAL.defaultOgImage,
  social: {
    twitter: settings.social.twitter,
    linkedin: settings.social.linkedin,
  },
  // Bloc Organization pour le JSON-LD (E-E-A-T).
  organization: {
    name: settings.organizationName,
    logo: TECHNICAL.organization.logo,
    sameAs: TECHNICAL.organization.sameAs,
  },
  // Navigation principale (header).
  nav: settings.nav as { label: string; href: string }[],
  // FAQ globale partagée (affichable sur plusieurs pages via GlobalFaq.astro).
  faq: settings.faq as { q: string; a: string }[],
} as const;
