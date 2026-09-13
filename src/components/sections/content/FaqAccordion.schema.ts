import { z } from 'astro/zod';

// FAQ en accordéon natif <details>. Discriminant : <famille>.<variante>.
export const schema = z.object({
  type: z.literal('content.faq-accordion'),
  title: z.string().optional(),
  items: z.array(z.object({ q: z.string(), a: z.string() })),
});

export type FaqAccordionSection = z.infer<typeof schema>;
