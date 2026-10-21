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

// Fiche de la bibliothèque /styleguide : nom (forme, pas contenu) + un cas par
// variante, libellé par sa différence (src/lib/styleguide.ts).
export const demo = {
  name: 'En-tête · marque et menu',
  examples: [
    {
      label: 'marque et trois liens',
      example: {
        type: 'nav.header-simple',
        brand: 'Mon Site',
        nav: [
          { label: 'Accueil', href: '/' },
          { label: 'Blog', href: '/blog' },
          { label: 'Contact', href: '/contact' },
        ],
      },
    },
  ],
} satisfies SectionDemo<HeaderSimpleSection>;
