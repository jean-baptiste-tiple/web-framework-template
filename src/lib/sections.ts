import { z } from 'astro/zod';

import HeaderSimple from '@/components/sections/nav/HeaderSimple.astro';
import { schema as headerSimple } from '@/components/sections/nav/HeaderSimple.schema';
import FooterSimple from '@/components/sections/nav/FooterSimple.astro';
import { schema as footerSimple } from '@/components/sections/nav/FooterSimple.schema';
import FeaturesGrid from '@/components/sections/offer/FeaturesGrid.astro';
import { schema as featuresGrid } from '@/components/sections/offer/FeaturesGrid.schema';
import TestimonialsGrid from '@/components/sections/proof/TestimonialsGrid.astro';
import { schema as testimonialsGrid } from '@/components/sections/proof/TestimonialsGrid.schema';
import FaqAccordion from '@/components/sections/content/FaqAccordion.astro';
import { schema as faqAccordion } from '@/components/sections/content/FaqAccordion.schema';
import CtaBanner from '@/components/sections/convert/CtaBanner.astro';
import { schema as ctaBanner } from '@/components/sections/convert/CtaBanner.schema';

// Registre unique des sections : un `type` = son schéma Zod + son composant.
// content.config.ts en dérive l'union discriminée du frontmatter, SectionRenderer
// y lit le composant à rendre. Ajouter une section = un dossier
// src/components/sections/<famille>/ + UNE entrée ici, rien d'autre.
//
// `chrome: true` = variante rendue UNE fois par BaseLayout (header/footer/barre
// d'annonce) depuis SITE, jamais choisie dans le frontmatter d'une page : elle
// est au registre pour être prévisualisable et galerisée, mais `sectionSchema`
// (l'union offerte aux collections) l'EXCLUT.
export const SECTION_REGISTRY = {
  'nav.header-simple': { schema: headerSimple, component: HeaderSimple, chrome: true },
  'nav.footer-simple': { schema: footerSimple, component: FooterSimple, chrome: true },
  'offer.features-grid': { schema: featuresGrid, component: FeaturesGrid },
  'proof.testimonials-grid': { schema: testimonialsGrid, component: TestimonialsGrid },
  'content.faq-accordion': { schema: faqAccordion, component: FaqAccordion },
  'convert.cta-banner': { schema: ctaBanner, component: CtaBanner },
} as const;

type Registry = typeof SECTION_REGISTRY;

// Tous les types du registre (chrome inclus) : indexe la galerie /styleguide.
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
  Object.values(SECTION_REGISTRY)
    .filter((entry) => !('chrome' in entry))
    .map((entry) => entry.schema) as [PageSectionSchema, ...PageSectionSchema[]],
);

export type Section = z.infer<typeof sectionSchema>;

// Union de TOUTES les variantes, chrome compris : type de rendu de
// SectionRenderer et des exemples de /styleguide. L'exclusion du chrome se fait
// dans `sectionSchema` (Zod, au frontmatter), pas ici.
export type AnySection = z.infer<Registry[SectionType]['schema']>;
