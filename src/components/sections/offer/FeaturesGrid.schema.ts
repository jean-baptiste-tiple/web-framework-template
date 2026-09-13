import { z } from 'astro/zod';

// Grille de features (3 colonnes). Discriminant : <famille>.<variante>.
export const schema = z.object({
  type: z.literal('offer.features-grid'),
  title: z.string().optional(),
  items: z.array(
    z.object({
      title: z.string(),
      body: z.string(),
      icon: z.string().optional(),
    }),
  ),
});

export type FeaturesGridSection = z.infer<typeof schema>;
