import { z } from 'astro/zod';
import settings from '@/content/settings/site.json';

// --- Validation du texte global (règle absolue 4 : tout contenu passe par Zod) --
// site.json est parsé au build : un champ manquant ou mal typé casse le build.
const settingsSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  description: z.string().min(1),
  nav: z.array(z.object({ label: z.string().min(1), href: z.string().min(1) })),
  organizationName: z.string().min(1),
  social: z.object({ twitter: z.string(), linkedin: z.string() }),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
});
const SETTINGS = settingsSchema.parse(settings);

// --- Configuration TECHNIQUE (éditée par un dev) -----------------------------
// Locale, chemins d'assets, identité JSON-LD.
const TECHNICAL = {
  // Source unique de l'URL de prod : `site` dans astro.config.mjs,
  // exposé par Astro via import.meta.env.SITE (canonical, sitemap, robots,
  // llms.txt et RSS en dérivent tous).
  url: (import.meta.env.SITE ?? 'http://localhost:4321').replace(/\/$/, ''),
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
  name: SETTINGS.name,
  shortName: SETTINGS.shortName,
  url: TECHNICAL.url,
  description: SETTINGS.description,
  locale: TECHNICAL.locale,
  lang: TECHNICAL.lang,
  defaultOgImage: TECHNICAL.defaultOgImage,
  social: {
    twitter: SETTINGS.social.twitter,
    linkedin: SETTINGS.social.linkedin,
  },
  // Bloc Organization pour le JSON-LD (E-E-A-T).
  organization: {
    name: SETTINGS.organizationName,
    logo: TECHNICAL.organization.logo,
    sameAs: TECHNICAL.organization.sameAs,
  },
  // Navigation principale (header).
  nav: SETTINGS.nav,
  // FAQ globale partagée (affichable sur plusieurs pages via GlobalFaq.astro).
  faq: SETTINGS.faq,
} as const;
