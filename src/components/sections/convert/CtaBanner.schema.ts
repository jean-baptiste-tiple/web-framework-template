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

// Fiche de la bibliothèque /styleguide : nom (forme, pas contenu) + un cas par
// variante, libellé par sa différence (src/lib/styleguide.ts).
export const demo = {
  name: 'Bandeau centré · titre, bouton',
  examples: [
    {
      label: 'titre et bouton',
      example: {
        type: 'convert.cta-banner',
        title: 'Prêt à réduire votre facture ?',
        label: 'Demander un audit',
        href: '/contact',
      },
    },
  ],
} satisfies SectionDemo<CtaBannerSection>;
