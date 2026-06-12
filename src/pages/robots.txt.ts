import { SITE } from '@/lib/site';

// robots.txt généré au build : l'URL du sitemap dérive de la source unique
// (site dans astro.config.mjs), rien à synchroniser à la main.
export function GET() {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
