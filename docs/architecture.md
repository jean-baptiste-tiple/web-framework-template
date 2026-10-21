# Architecture

## Invariants (ne pas violer sans ADR)
1. output: static, aucun runtime serveur.
2. SEO + JSON-LD centralisés dans BaseLayout (src/layouts/BaseLayout.astro).
3. Contenu en collections typées (src/content.config.ts) ; présentation séparée (composants/tokens).
4. Routing : /blog/* (blog), [...slug] racine (landings + pages). Pas de second catch-all racine.
5. Interactivité = par défaut AUCUNE (statique) ; sinon <script> vanilla dans le .astro. Îlots Solid = starter opt-in, seulement si nécessaire.
6. Publication (ADR 0002) : `main` = TEST ; la production = le commit marqué par le tag `production`, construite uniquement par l'action « Mise en ligne » (.github/workflows/production.yml, reconstruction quotidienne à 04:00 UTC). Articles listés uniquement par src/lib/blog.ts (articles programmés absents de la production).
7. Bibliothèque des composants (ADR 0003) : /styleguide/ et /styleguide/<id>/ (src/pages/styleguide/) découvrent démos, sections, tokens et usages au build (src/lib/styleguide.ts) ; tout composant a sa démo colocalisée (contrôle : scripts/check-styleguide.mjs au lint) ; route absente du build de production, slug `styleguide` réservé par [...slug].

## Arbre
- src/pages : routes (index, blog/, blog/[...slug], [...slug], contact, 404, styleguide/ hors production) + routes générées (rss.xml, sitemap.xml, robots.txt, llms.txt)
- src/content : blog/ pages/ landings/ settings/ + content.config.ts
- src/layouts : BaseLayout
- src/components : ui/ seo/ landing/ sections/ styleguide/ (outillage des démos) ; chaque composant a sa démo `<Nom>.demo.astro` (sections : `demo` du `.schema.ts`)
- src/lib : site.ts (valide settings/site.json par Zod, URL depuis astro.config), seo.ts, authors.ts, blog.ts (liste des articles : brouillons, articles programmés)
- src/styles : global.css (tokens Tailwind 4)
- public : favicon, og-default.png, logo.png (placeholders à remplacer)

## Intégrations Astro installées
mdx. (+ @astrojs/rss en dépendance pour la route /rss.xml ; @tailwindcss/vite côté Vite. sitemap/robots/llms = routes custom src/pages/*.ts.)

## Inclus dans le socle
blog, pages, landings, SEO/JSON-LD, sitemap, RSS, formulaire contact vanilla, réglages globaux (settings/site.json).

## Starters opt-in (non installés)
solid (îlots), i18n (multilingue). Voir .claude/starters/.
Édition de contenu : directe dans les fichiers (pas d'interface d'admin).
