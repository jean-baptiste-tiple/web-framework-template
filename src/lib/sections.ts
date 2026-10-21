import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

import HeaderSimple from '@/components/sections/nav/HeaderSimple.astro';
import FooterSimple from '@/components/sections/nav/FooterSimple.astro';
import FeaturesGrid from '@/components/sections/offer/FeaturesGrid.astro';
import TestimonialsGrid from '@/components/sections/proof/TestimonialsGrid.astro';
import FaqAccordion from '@/components/sections/content/FaqAccordion.astro';
import CtaBanner from '@/components/sections/convert/CtaBanner.astro';
import { SECTION_SCHEMAS, type SectionType } from './section-schemas';

export { sectionSchema } from './section-schemas';
export type { SectionType, ChromeType, PageSectionType, Section, AnySection } from './section-schemas';

// Registre unique des sections : un `type` = son schéma Zod (section-schemas.ts)
// + son composant (ici). SectionRenderer y lit le composant à rendre, /styleguide
// en rend un exemple par type. Ajouter une section = un dossier
// src/components/sections/<famille>/ + UNE entrée dans chacun des deux fichiers ;
// le `Record<SectionType, …>` ci-dessous casse `astro check` si l'une manque.
// Ce fichier importe des .astro : content.config.ts ne l'importe JAMAIS
// (section-schemas.ts seulement, ADR 0004, contrôlé au lint).
const COMPONENTS: Record<SectionType, AstroComponentFactory> = {
  'nav.header-simple': HeaderSimple,
  'nav.footer-simple': FooterSimple,
  'offer.features-grid': FeaturesGrid,
  'proof.testimonials-grid': TestimonialsGrid,
  'content.faq-accordion': FaqAccordion,
  'convert.cta-banner': CtaBanner,
};

export const SECTION_REGISTRY = Object.fromEntries(
  (Object.keys(SECTION_SCHEMAS) as SectionType[]).map((type) => [type, { ...SECTION_SCHEMAS[type], component: COMPONENTS[type] }]),
) as { [K in SectionType]: (typeof SECTION_SCHEMAS)[K] & { component: AstroComponentFactory } };
