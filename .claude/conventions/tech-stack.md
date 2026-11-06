# Stack technique

- Astro ^7.4 — output: "static", aucun adapter (ADR 0005). `compressHTML: true` dans astro.config (le défaut `'jsx'` d'Astro 7 colle des mots). Schémas : Zod 4, `z` importé de `astro/zod`. `pnpm-workspace.yaml` fixe `@emnapi/*` sur ^1.11 (la bêta 2.0 fait planter `astro check`).
- TypeScript strict (extends astro/tsconfigs/strict). Alias @/* -> src/*.
- Tailwind CSS ^4 via @tailwindcss/vite (config CSS-first dans global.css, PAS de tailwind.config.js).
- @astrojs/mdx ^8 (+ @astrojs/markdown-remark ^7, sa dépendance pair) — landings.
- @astrojs/rss ^4 — /rss.xml.
- sitemap.xml, robots.txt, llms.txt : routes custom src/pages/*.ts (pas d'intégration) — lastmod par page depuis updatedDate, exclusion noindex, URL unique depuis astro.config.
- Lint : eslint ^10 + eslint-plugin-astro + typescript-eslint (.ts ET .astro couverts). @types/node ^24 (`process.env` dans src/lib).
- Dépendances : Dependabot chaque semaine (.github/dependabot.yml ; groupes « astro » et « mineures »).
- Gestionnaire : pnpm (npm fonctionne aussi).

Socle volontairement minimal. Starters OPT-IN (non installés par défaut) :
- îlots interactifs : @astrojs/solid-js ^5 + solid-js ^1.9 (+ jsx/jsxImportSource dans tsconfig). À n'ajouter qu'en cas de besoin réel.
- i18n : routing multilingue Astro (voir i18n.md).

Interdits : adapter SSR, API routes dynamiques, Server Actions, toute dépendance runtime serveur.
