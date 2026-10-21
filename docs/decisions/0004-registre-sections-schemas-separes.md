# ADR 0004 — Registre des sections : schémas séparés des composants

## Statut
Accepté le 2026-10-21. Porté du site dérivé Movinmotion (son ADR 0004 du 19/10), où `pnpm dev` répondait 500 sur toutes les pages.

## Contexte
`src/lib/sections.ts` portait dans un même objet le schéma Zod et le composant `.astro` de chaque section, et `content.config.ts` l'importait pour dériver l'union `sections`. Charger la config des collections importait donc tous les composants de section. Dès qu'un de ces composants a un bloc `<style>`, Vite le transforme avant d'être prêt : la config n'est pas chargée (« Cannot read properties of undefined (reading 'get') », « Content config not loaded ») et `pnpm dev` répond 500 sur toutes les pages. Le build n'est pas touché : le défaut échappe au gate.

Dans le modèle, le défaut était latent : aucune section n'a de `<style>`, `pnpm dev` répondait 200. Un `<style>` ajouté à `FeaturesGrid.astro` suffisait à le déclencher (500 sur `/`, `/audit-energetique/`, `/blog/`, `/styleguide/`) ; un site dérivé y tombe à sa première section stylée.

## Décision
- `src/lib/section-schemas.ts` : `SECTION_SCHEMAS` (`type` → schéma, `chrome`), `sectionSchema` et les types (`SectionType`, `ChromeType`, `PageSectionType`, `Section`, `AnySection`). C'est le seul module du registre que `content.config.ts` importe.
- `src/lib/sections.ts` : les composants, dans un `Record<SectionType, …>` (un type sans composant casse `astro check`), fusionnés en `SECTION_REGISTRY` avec la même forme qu'avant ; il réexporte `sectionSchema` et les types. SectionRenderer et /styleguide ne changent pas.
- Invariant : `content.config.ts` n'importe jamais un `.astro`, ni directement ni via un module qui le fait.
- Ajouter une section = une entrée dans chacun des deux fichiers.

## Conséquences
- Contrôle machine : `scripts/check-content-config.mjs` (dans `pnpm run lint`) suit le graphe des imports d'exécution depuis `content.config.ts` et échoue sur tout `.astro` atteint, en affichant la chaîne. `import type` est ignoré (effacé à la compilation).
- Comportement inchangé : HTML de `dist` identique octet pour octet avant / après.
- Une ligne de plus par section (deux fichiers au lieu d'un).
- Sites dérivés : ceux qui ont gardé l'ancien registre ont le défaut latent ; leur porter les deux fichiers et le contrôle (changelog du 2026-10-21).
