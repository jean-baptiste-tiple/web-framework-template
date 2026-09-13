import { z } from 'astro/zod';

// Bandeau CTA centré (titre + bouton). Discriminant : <famille>.<variante>.
export const schema = z.object({
  type: z.literal('convert.cta-banner'),
  title: z.string().optional(),
  label: z.string(),
  href: z.string(),
});

export type CtaBannerSection = z.infer<typeof schema>;
