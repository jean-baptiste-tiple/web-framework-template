# Stack technique

- Astro ^5.7 — output: "static", aucun adapter.
- TypeScript strict (extends astro/tsconfigs/strict). Alias @/* -> src/*.
- Tailwind CSS ^4 via @tailwindcss/vite (config CSS-first dans global.css, PAS de tailwind.config.js).
- @astrojs/mdx ^4 — landings.
- @astrojs/sitemap ^3 — sitemap-index.xml auto.
- @astrojs/rss ^4 — /rss.xml.
- Gestionnaire : pnpm (npm fonctionne aussi).

Socle volontairement minimal. Starters OPT-IN (non installés par défaut) :
- îlots interactifs : @astrojs/solid-js ^5 + solid-js ^1.9 (+ jsx/jsxImportSource dans tsconfig). À n'ajouter qu'en cas de besoin réel.
- i18n : routing multilingue Astro (voir i18n.md).

Interdits : adapter SSR, API routes dynamiques, Server Actions, toute dépendance runtime serveur.
