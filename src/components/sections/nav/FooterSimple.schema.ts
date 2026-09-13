import { z } from 'astro/zod';

// Pied de page simple : mention de copyright + liens de service. Variante de
// CHROME — rendue une fois par BaseLayout depuis SITE (src/lib/chrome.ts),
// jamais depuis le frontmatter d'une page (exclue de l'union `sectionSchema`).
export const schema = z.object({
  type: z.literal('nav.footer-simple'),
  organizationName: z.string(),
  links: z.array(z.object({ label: z.string(), href: z.string() })),
});

export type FooterSimpleSection = z.infer<typeof schema>;
