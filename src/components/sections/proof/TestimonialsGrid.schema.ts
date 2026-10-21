import { z } from 'astro/zod';
import type { SectionDemo } from '@/lib/styleguide';

// Témoignages en grille (2 colonnes). Discriminant : <famille>.<variante>.
export const schema = z.object({
  type: z.literal('proof.testimonials-grid'),
  title: z.string().optional(),
  items: z.array(
    z.object({
      quote: z.string(),
      author: z.string(),
      role: z.string().optional(),
    }),
  ),
});

export type TestimonialsGridSection = z.infer<typeof schema>;

// Fiche de la bibliothèque /styleguide : nom (forme, pas contenu) + un cas par
// variante, libellé par sa différence (src/lib/styleguide.ts).
export const demo = {
  name: '2 colonnes · citation, auteur',
  examples: [
    {
      label: 'deux citations',
      example: {
        type: 'proof.testimonials-grid',
        title: 'Ils nous font confiance',
        items: [
          { quote: 'Un diagnostic clair, des actions faciles à lancer.', author: 'Claire Martin', role: 'Directrice administrative' },
          { quote: 'Nous savons enfin où agir en premier.', author: 'Paul Durand', role: 'Gérant' },
        ],
      },
    },
  ],
} satisfies SectionDemo<TestimonialsGridSection>;
