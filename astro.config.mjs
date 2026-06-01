// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// IMPORTANT : remplacer `site` par l'URL de prod réelle.
// Elle sert au sitemap, au RSS, aux canonical et au JSON-LD.
export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
