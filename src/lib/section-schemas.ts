import { z } from 'astro/zod';

import { schema as headerSimple } from '@/components/sections/nav/HeaderSimple.schema';
import { schema as footerSimple } from '@/components/sections/nav/FooterSimple.schema';
import { schema as featuresGrid } from '@/components/sections/offer/FeaturesGrid.schema';
import { schema as testimonialsGrid } from '@/components/sections/proof/TestimonialsGrid.schema';
import { schema as faqAccordion } from '@/components/sections/content/FaqAccordion.schema';
import { schema as ctaBanner } from '@/components/sections/convert/CtaBanner.schema';

// Registre des SCHÉMAS de sections : un `type` = son schéma Zod (+ `chrome`).
// Séparé des composants (src/lib/sections.ts) : content.config.ts n'importe que
// ce fichier. Importer un .astro depuis la config des collections fait
// transformer ses styles avant que Vite soit prêt, et `pnpm dev` renvoie 500
// sur toutes les pages (« reading 'get' », ADR 0004). Contrôlé au lint
// (scripts/check-content-config.mjs).
//
// `chrome: true` = variante rendue UNE fois par BaseLayout (header/footer/barre
// d'annonce) depuis SITE, jamais choisie dans le frontmatter d'une page : elle
// est au registre pour être prévisualisable et galerisée, mais `sectionSchema`
// (l'union offerte aux collections) l'EXCLUT.
export const SECTION_SCHEMAS = {
  'nav.header-simple': { schema: headerSimple, chrome: true },
  'nav.footer-simple': { schema: footerSimple, chrome: true },
  'offer.features-grid': { schema: featuresGrid },
  'proof.testimonials-grid': { schema: testimonialsGrid },
  'content.faq-accordion': { schema: faqAccordion },
  'convert.cta-banner': { schema: ctaBanner },
} as const;

type Registry = typeof SECTION_SCHEMAS;

// Tous les types du registre (chrome inclus).
export type SectionType = keyof Registry;

// Types de chrome, dérivés du marqueur : aucune liste à tenir à jour.
export type ChromeType = {
  [K in SectionType]: Registry[K] extends { chrome: true } ? K : never;
}[SectionType];

// Types réellement offerts au frontmatter des collections.
export type PageSectionType = Exclude<SectionType, ChromeType>;

type PageSectionSchema = Registry[PageSectionType]['schema'];

// Union discriminée dérivée du registre : un type absent du registre — ou marqué
// `chrome` — est rejeté par Zod au sync des collections (message listant les
// types acceptés).
export const sectionSchema = z.discriminatedUnion(
  'type',
  Object.values(SECTION_SCHEMAS)
    .filter((entry) => !('chrome' in entry))
    .map((entry) => entry.schema) as [PageSectionSchema, ...PageSectionSchema[]],
);

export type Section = z.infer<typeof sectionSchema>;

// Union de TOUTES les variantes, chrome compris : type de rendu de
// SectionRenderer et des exemples de /styleguide. L'exclusion du chrome se fait
// dans `sectionSchema` (Zod, au frontmatter), pas ici.
export type AnySection = z.infer<Registry[SectionType]['schema']>;
