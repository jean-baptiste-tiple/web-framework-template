// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// IMPORTANT : remplacer `site` par l'URL de prod réelle.
// Source UNIQUE de l'URL : canonical, sitemap, robots.txt, llms.txt, RSS et
// JSON-LD en dérivent tous (via import.meta.env.SITE, lu dans src/lib/site.ts).
export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
