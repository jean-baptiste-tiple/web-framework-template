import { z } from 'astro/zod';

// Header simple : marque à gauche, navigation à droite. Variante de CHROME —
// rendue une fois par BaseLayout depuis SITE (src/lib/chrome.ts), jamais depuis
// le frontmatter d'une page (exclue de l'union `sectionSchema`).
export const schema = z.object({
  type: z.literal('nav.header-simple'),
  brand: z.string(),
  nav: z.array(z.object({ label: z.string(), href: z.string() })),
});

export type HeaderSimpleSection = z.infer<typeof schema>;
