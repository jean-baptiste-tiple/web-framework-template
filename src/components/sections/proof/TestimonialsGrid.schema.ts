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

// Fiche et exemple de la bibliothèque /styleguide (src/lib/styleguide.ts).
export const demo = {
  name: 'Témoignages',
  purpose: 'Citations de clients sur deux colonnes, avec leur nom et leur fonction.',
  ask: 'Ajoute un bloc de témoignages « Ils nous font confiance » avec deux citations de clients sur la page Audit énergétique.',
  example: {
    type: 'proof.testimonials-grid',
    title: 'Ils nous font confiance',
    items: [
      { quote: 'Un diagnostic clair, des actions faciles à lancer.', author: 'Claire Martin', role: 'Directrice administrative' },
      { quote: 'Nous savons enfin où agir en premier.', author: 'Paul Durand', role: 'Gérant' },
    ],
  },
} satisfies SectionDemo<TestimonialsGridSection>;
