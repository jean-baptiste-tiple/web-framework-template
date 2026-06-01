# Architecture

## Invariants (ne pas violer sans ADR)
1. output: static, aucun runtime serveur.
2. SEO + JSON-LD centralisés dans BaseLayout (src/layouts/BaseLayout.astro).
3. Contenu en collections typées (src/content.config.ts) ; présentation séparée (composants/tokens).
4. Routing : /blog/* (blog), [...slug] racine (landings + pages). Pas de second catch-all racine.
5. Interactivité = par défaut AUCUNE (statique) ; sinon <script> vanilla dans le .astro. Îlots Solid = starter opt-in, seulement si nécessaire.

## Arbre
- src/pages : routes (index, blog/, blog/[...slug], [...slug], rss.xml, 404)
- src/content : blog/ pages/ landings/ settings/ + content.config.ts
- src/layouts : BaseLayout
- src/components : ui/ seo/ landing/
- src/lib : site.ts, seo.ts, authors.ts
- src/styles : global.css (tokens Tailwind 4)
- public : robots.txt, llms.txt, favicon

## Intégrations Astro installées
mdx, sitemap. (+ @astrojs/rss en dépendance pour la route /rss.xml ; @tailwindcss/vite côté Vite.)

## Inclus dans le socle
blog, pages, landings, SEO/JSON-LD, sitemap, RSS, formulaire contact vanilla, réglages globaux (settings/site.json).

## Starters opt-in (non installés)
solid (îlots), i18n (multilingue). Voir .tiple/starters/.
Édition de contenu : directe dans les fichiers (pas d'interface d'admin).
