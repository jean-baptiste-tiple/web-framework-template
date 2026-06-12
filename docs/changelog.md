# Changelog

## 2026-06-12 — Correctifs audit du socle
- Assets OG/logo placeholders ajoutés (og-default.png, logo.png) : plus de 404 sur og:image et le logo JSON-LD.
- JSON-LD landings : schema.type (Service/Product) et schema.provider honorés ; dateModified sur les WebPage (updatedDate).
- Canonical/og:url avec slash final, alignés sur les URL servies et le sitemap ; breadcrumbs et liens RSS idem.
- sitemap.xml custom (lastmod par page depuis updatedDate, exclusion noindex) ; robots.txt et llms.txt générés au build ; @astrojs/sitemap retiré.
- URL de prod en source unique : `site` (astro.config) lue via import.meta.env.SITE.
- settings/site.json validé par Zod au build ; updatedDate ajouté aux landings ; heroImageAlt/hero.imageAlt requis avec image (refine).
- heroImage d'article rendue + propagée en og:image et image JSON-LD ; hero.image de landing rendue.
- Garde anti-collision de slugs (pages vs landings vs routes réservées) : build cassé avec message explicite.
- ESLint couvre désormais les .ts (typescript-eslint) ; Button avec prop type réutilisé par ContactForm ; aria-current sur la nav, role=status/alert sur les états du formulaire ; header wrap sur mobile.
- Descriptions des pages bespoke mises au format 140-160 caractères.
- Checklist de bootstrap (.tiple/checklists/bootstrap.md) : personnalisation technique d'un site neuf, référencée dans README et CLAUDE.md.
