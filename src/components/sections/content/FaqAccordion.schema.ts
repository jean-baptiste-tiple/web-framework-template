import { z } from 'astro/zod';
import type { SectionDemo } from '@/lib/styleguide';

// FAQ en accordéon natif <details>. Discriminant : <famille>.<variante>.
export const schema = z.object({
  type: z.literal('content.faq-accordion'),
  title: z.string().optional(),
  items: z.array(z.object({ q: z.string(), a: z.string() })),
});

export type FaqAccordionSection = z.infer<typeof schema>;

// Fiche de la bibliothèque /styleguide : nom (forme, pas contenu) + un cas par
// variante, libellé par sa différence (src/lib/styleguide.ts).
export const demo = {
  name: 'Colonne de questions dépliables',
  examples: [
    {
      label: 'titre et questions',
      example: {
        type: 'content.faq-accordion',
        title: 'Questions fréquentes',
        items: [
          { q: 'Combien de temps dure l’audit ?', a: 'Environ deux semaines entre le recueil des données et la restitution.' },
          { q: 'Quelles données sont nécessaires ?', a: 'Vos factures, et si possible votre courbe de consommation.' },
        ],
      },
    },
  ],
} satisfies SectionDemo<FaqAccordionSection>;
