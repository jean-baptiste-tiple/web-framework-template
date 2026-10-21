import { z } from 'astro/zod';
import type { SectionDemo } from '@/lib/styleguide';

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

// Fiche et exemple de la bibliothèque /styleguide (src/lib/styleguide.ts).
export const demo = {
  name: 'Grille d’avantages',
  purpose: 'Trois avantages ou services côte à côte, chacun avec un titre court et une phrase.',
  ask: 'Ajoute une grille d’avantages « Ce que vous obtenez » avec trois points sur la page Audit énergétique.',
  example: {
    type: 'offer.features-grid',
    title: 'Ce que vous obtenez',
    items: [
      { title: 'Diagnostic complet', body: 'Analyse de vos consommations et de vos usages.' },
      { title: 'Recommandations chiffrées', body: 'Des actions priorisées, avec leur retour estimé.' },
      { title: 'Accompagnement', body: 'Un appui à la mise en œuvre des préconisations.' },
    ],
  },
} satisfies SectionDemo<FeaturesGridSection>;
