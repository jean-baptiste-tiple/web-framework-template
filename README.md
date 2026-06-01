# Socle + starters

Socle minimal et léger, mono-langue, zéro JS par défaut, **édition directe des fichiers** (pas d'admin) :
- Astro statique + TypeScript strict + Tailwind 4.
- Content Collections markdown typées Zod : `blog` (.md), `pages` (.md), `landings` (.mdx, hero + sections structurées).
- SEO/JSON-LD centralisés (BaseLayout), sitemap, RSS.
- 1 fichier markdown par page : éditer le texte = éditer ce seul fichier ; le design reste dans les composants.
- Texte global partagé : `src/content/settings/site.json` (nom, nav, footer, FAQ globale).

Le formulaire de contact (vanilla, sans framework) est intégré au socle.

Starters OPT-IN (à activer au besoin, non installés par défaut) :
- solid : îlots SolidJS pour interactivité riche.
- i18n : routing multilingue (retiré du socle).

Édition du contenu : **directement dans les fichiers** .md/.mdx/.json. Pas d'interface d'admin.
