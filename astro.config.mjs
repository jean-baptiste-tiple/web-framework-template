// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import markdownTwins from './src/integrations/markdown-twins.mjs';

// IMPORTANT : remplacer `site` par l'URL de prod réelle.
// Source UNIQUE de l'URL : canonical, sitemap, robots.txt, llms.txt, RSS et
// JSON-LD en dérivent tous (via import.meta.env.SITE, lu dans src/lib/site.ts).
export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  integrations: [mdx(), markdownTwins()],
  // Alias anglais que les scanners agentiques sondent pour les pages de
  // confiance. Source unique des redirections (deploy.md) ; un site dérivé
  // adapte les cibles s'il renomme ces pages.
  redirects: {
    '/about': '/a-propos',
    '/privacy': '/politique-de-confidentialite',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
