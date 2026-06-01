import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// --- Blocs réutilisables -------------------------------------------------

// Bloc SEO commun à tous les types de contenu.
const seoSchema = z
  .object({
    title: z.string().max(70).optional(), // override du <title>
    description: z.string().max(170).optional(), // override de la meta description
    canonical: z.string().url().optional(),
    ogImage: z.string().optional(), // chemin override de l'image Open Graph
    noindex: z.boolean().default(false),
  })
  .optional();

// FAQ : rendue visuellement ET en JSON-LD FAQPage (SEO rich results + GEO).
const faqSchema = z
  .array(z.object({ q: z.string(), a: z.string() }))
  .optional();

// --- Collections ---------------------------------------------------------

// Articles de blog (Markdown).
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(), // sert de H1 et de <title> par défaut
      description: z.string(), // meta + OG par défaut
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(), // bump à chaque MAJ → fraîcheur
      author: z.string().default('jb'), // clé dans src/lib/authors.ts
      category: z.string().optional(),
      tags: z.array(z.string()).default([]),
      topics: z.array(z.string()).default([]), // entités/sujets explicites (GEO)
      heroImage: image().optional(),
      draft: z.boolean().default(false),
      tldr: z.string().optional(), // résumé citable par un LLM (GEO)
      faq: faqSchema,
      seo: seoSchema,
    }),
});

// Pages éditoriales statiques : à propos, mentions légales, etc. (Markdown).
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updatedDate: z.coerce.date().optional(),
    tldr: z.string().optional(),
    faq: faqSchema,
    seo: seoSchema,
  }),
});

// Landing pages (MDX) : frontmatter structuré + corps MDX pour le sur-mesure.
const landings = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/landings' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      tldr: z.string().optional(),
      topics: z.array(z.string()).default([]),
      hero: z.object({
        eyebrow: z.string().optional(),
        headline: z.string(),
        subheadline: z.string().optional(),
        cta: z.object({ label: z.string(), href: z.string() }).optional(),
        image: image().optional(),
      }),
      // Page-builder léger : chaque section est mappée à un composant.
      sections: z
        .array(
          z.discriminatedUnion('type', [
            z.object({
              type: z.literal('features'),
              title: z.string().optional(),
              items: z.array(
                z.object({
                  title: z.string(),
                  body: z.string(),
                  icon: z.string().optional(),
                }),
              ),
            }),
            z.object({
              type: z.literal('proof'),
              title: z.string().optional(),
              items: z.array(
                z.object({
                  quote: z.string(),
                  author: z.string(),
                  role: z.string().optional(),
                }),
              ),
            }),
            z.object({
              type: z.literal('faq'),
              title: z.string().optional(),
              items: z.array(z.object({ q: z.string(), a: z.string() })),
            }),
            z.object({
              type: z.literal('cta'),
              title: z.string().optional(),
              label: z.string(),
              href: z.string(),
            }),
          ]),
        )
        .default([]),
      // Données pour le JSON-LD (Service ou Product).
      schema: z
        .object({
          type: z.enum(['Service', 'Product']),
          name: z.string(),
          provider: z.string().optional(),
        })
        .optional(),
      seo: seoSchema,
    }),
});

export const collections = { blog, pages, landings };
