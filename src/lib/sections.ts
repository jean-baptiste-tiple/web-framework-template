import { z } from 'astro/zod';

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
export const SECTION_REGISTRY = {
  'offer.features-grid': { schema: featuresGrid, component: FeaturesGrid },
  'proof.testimonials-grid': { schema: testimonialsGrid, component: TestimonialsGrid },
  'content.faq-accordion': { schema: faqAccordion, component: FaqAccordion },
  'convert.cta-banner': { schema: ctaBanner, component: CtaBanner },
} as const;

export type SectionType = keyof typeof SECTION_REGISTRY;

type SectionSchema = (typeof SECTION_REGISTRY)[SectionType]['schema'];

// Union discriminée dérivée du registre : un type absent du registre est rejeté
// par Zod au sync des collections (message listant les types acceptés).
export const sectionSchema = z.discriminatedUnion(
  'type',
  Object.values(SECTION_REGISTRY).map((entry) => entry.schema) as [
    SectionSchema,
    ...SectionSchema[],
  ],
);

export type Section = z.infer<typeof sectionSchema>;
