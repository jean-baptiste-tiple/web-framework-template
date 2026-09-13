import { SITE } from '@/lib/site';
import type { HeaderSimpleSection } from '@/components/sections/nav/HeaderSimple.schema';
import type { FooterSimpleSection } from '@/components/sections/nav/FooterSimple.schema';

// Chrome du site : header et footer sont des VARIANTES de section (famille nav),
// rendues une seule fois par BaseLayout. Ce fichier est le seul endroit qui
// traduit le texte global (SITE ← site.json) vers la forme attendue par la
// variante choisie. Changer de variante = changer l'import + le type dans
// BaseLayout, et adapter l'objet ci-dessous au schéma de la nouvelle variante.

export const SITE_HEADER: HeaderSimpleSection = {
  type: 'nav.header-simple',
  brand: SITE.name,
  nav: [...SITE.nav],
};

export const SITE_FOOTER: FooterSimpleSection = {
  type: 'nav.footer-simple',
  organizationName: SITE.organization.name,
  // Liens de service, hors navigation principale (site.json `nav`).
  links: [
    { label: 'Mentions légales', href: '/mentions-legales' },
    { label: 'RSS', href: '/rss.xml' },
  ],
};
