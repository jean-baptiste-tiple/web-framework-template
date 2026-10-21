import { z } from 'astro/zod';
import type { SectionDemo } from '@/lib/styleguide';

// Bandeau CTA centré (titre + bouton). Discriminant : <famille>.<variante>.
export const schema = z.object({
  type: z.literal('convert.cta-banner'),
  title: z.string().optional(),
  label: z.string(),
  href: z.string(),
});

export type CtaBannerSection = z.infer<typeof schema>;

// Fiche et exemple de la bibliothèque /styleguide (src/lib/styleguide.ts).
export const demo = {
  name: 'Bandeau d’appel à l’action',
  purpose: 'Une phrase et un bouton centrés, pour conclure une page sur l’action attendue.',
  ask: 'Termine la page Audit énergétique par un bandeau « Prêt à réduire votre facture ? » avec un bouton « Demander un audit » vers la page Contact.',
  example: {
    type: 'convert.cta-banner',
    title: 'Prêt à réduire votre facture ?',
    label: 'Demander un audit',
    href: '/contact',
  },
} satisfies SectionDemo<CtaBannerSection>;
