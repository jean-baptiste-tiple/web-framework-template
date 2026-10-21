import { z } from 'astro/zod';
import type { SectionDemo } from '@/lib/styleguide';

// Header simple : marque à gauche, navigation à droite. Variante de CHROME —
// rendue une fois par BaseLayout depuis SITE (src/lib/chrome.ts), jamais depuis
// le frontmatter d'une page (exclue de l'union `sectionSchema`).
export const schema = z.object({
  type: z.literal('nav.header-simple'),
  brand: z.string(),
  nav: z.array(z.object({ label: z.string(), href: z.string() })),
});

export type HeaderSimpleSection = z.infer<typeof schema>;

// Fiche et exemple de la bibliothèque /styleguide (src/lib/styleguide.ts).
export const demo = {
  name: 'En-tête du site',
  purpose: 'Nom du site à gauche et menu principal à droite, en haut de chaque page.',
  ask: 'Ajoute « Tarifs » au menu du haut, entre Blog et Contact.',
  example: {
    type: 'nav.header-simple',
    brand: 'Mon Site',
    nav: [
      { label: 'Accueil', href: '/' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
    ],
  },
} satisfies SectionDemo<HeaderSimpleSection>;
