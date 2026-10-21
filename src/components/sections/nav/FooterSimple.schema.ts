import { z } from 'astro/zod';
import type { SectionDemo } from '@/lib/styleguide';

// Pied de page simple : mention de copyright + liens de service. Variante de
// CHROME — rendue une fois par BaseLayout depuis SITE (src/lib/chrome.ts),
// jamais depuis le frontmatter d'une page (exclue de l'union `sectionSchema`).
export const schema = z.object({
  type: z.literal('nav.footer-simple'),
  organizationName: z.string(),
  links: z.array(z.object({ label: z.string(), href: z.string() })),
});

export type FooterSimpleSection = z.infer<typeof schema>;

// Fiche et exemple de la bibliothèque /styleguide (src/lib/styleguide.ts).
export const demo = {
  name: 'Pied de page',
  purpose: 'Mention de copyright et liens de service (mentions légales, confidentialité) en bas de chaque page.',
  ask: 'Ajoute un lien « Plan du site » dans le pied de page.',
  example: {
    type: 'nav.footer-simple',
    organizationName: 'Mon Organisation',
    links: [
      { label: 'Mentions légales', href: '/mentions-legales' },
      { label: 'Politique de confidentialité', href: '/politique-de-confidentialite' },
    ],
  },
} satisfies SectionDemo<FooterSimpleSection>;
