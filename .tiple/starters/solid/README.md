# solid (opt-in — NON installé)
Îlots interactifs SolidJS. À n'activer que si le natif (<details>, <script> vanilla) ne suffit pas (state complexe, events, fetch côté client).

Installer :
- `pnpm add @astrojs/solid-js solid-js`
- astro.config.mjs : `import solid from '@astrojs/solid-js'` + `integrations: [solid(), mdx(), sitemap()]`.
- tsconfig.json (compilerOptions) : `"jsx": "preserve"`, `"jsxImportSource": "solid-js"`.

Usage : composants .tsx dans src/components/islands/, montés avec une directive client:* (préférer client:visible / client:idle). Garder l'îlot petit, le plus bas possible dans l'arbre, données passées en props depuis le .astro. Vérifier le poids du chunk JS après build.
