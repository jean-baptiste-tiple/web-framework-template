import { z } from 'astro/zod';
import type { SectionDemo } from '@/lib/styleguide';

// FAQ en accordéon natif <details>. Discriminant : <famille>.<variante>.
export const schema = z.object({
  type: z.literal('content.faq-accordion'),
  title: z.string().optional(),
  items: z.array(z.object({ q: z.string(), a: z.string() })),
});

export type FaqAccordionSection = z.infer<typeof schema>;

// Fiche et exemple de la bibliothèque /styleguide (src/lib/styleguide.ts).
export const demo = {
  name: 'Questions fréquentes',
  purpose: 'Bloc de questions et réponses dépliables, repris par Google dans ses résultats.',
  ask: 'Ajoute un bloc de questions fréquentes à la page Audit énergétique avec la question « Combien de temps dure l’audit ? ».',
  example: {
    type: 'content.faq-accordion',
    title: 'Questions fréquentes',
    items: [
      { q: 'Combien de temps dure l’audit ?', a: 'Environ deux semaines entre le recueil des données et la restitution.' },
      { q: 'Quelles données sont nécessaires ?', a: 'Vos factures, et si possible votre courbe de consommation.' },
    ],
  },
} satisfies SectionDemo<FaqAccordionSection>;
