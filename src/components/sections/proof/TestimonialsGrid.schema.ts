import { z } from 'astro/zod';

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
