---
name: section-catalog
description: Charger pour composer les pages d'un site depuis le kit de sections (C:\apps\web-kit) - choisir un monde visuel (casting), chercher des sections par famille/mode/secteur, composer une page selon les règles comptables, et porter une section du kit vers le socle. Phases P2-P3-P5 du playbook website-builder.
---

# Section catalog — composer et porter depuis le kit

Le kit vit dans `C:\apps\web-kit` (repo séparé). Lire son `README.md` et `catalog/taxonomy.md` avant
d'y chercher. Rien ne se modifie dans le kit pendant un chantier client, sauf marquer une section
`portée: oui` après portage.

## Casting d'un monde (P2)
1. Lire `catalog/worlds/*.md` (un DESIGN.md par template) ; filtrer par mode visiteur dominant du
   sitemap, secteur, stratégie couleur voulue par le brief.
2. Proposer 3 candidats avec leur capture `catalog/screenshots/<t>/index.jpg` et une ligne de raison
   chacun → `AskUserQuestion` (recommandation en premier). Jamais choisir seul.
3. Copier le monde retenu dans `docs/design/system.md` du site (format design-system.md), poser les
   tokens dans `src/styles/global.css` (@theme, OKLCH). Les verrous couleur/forme/thème sont posés ici.

## Composition d'une page (P3)
- Par page du sitemap : lister les sections voulues par FAMILLE (taxonomy.md) selon l'objectif de la
  page, puis chercher les variantes : `catalog/sections/*.json` filtré sur `family`, `port_candidate`,
  `mode`, `sectors`, `quality ≥ 4`. Sections déjà portées : `sections/<famille>/<variante>/`.
- Règles comptables (skill design-craft › composition.md) : une famille de layout max 1×/page,
  ≤ 2 splits consécutifs, hero ≤ 4 éléments, une intention de CTA. Une page = 5-8 sections.
- Écrire la composition dans `docs/pages/<slug>.md` (page-spec) : famille → variante choisie (id
  catalogue ou chemin portée) → raison en une ligne. Le contenu se rédige ensuite (skill copywriting).

## Portage d'une section (P5, quand la variante n'est pas encore portée)
- Contrat : `C:\apps\web-kit\sections\CONVENTIONS.md` (les 6 conversions) — à lire intégralement.
- Source : `catalog/inventory/<t>.json` donne la page ; le code est dans `sources/<t>/<t>-astro/src/`
  (page ou composant). Capture d'origine : `catalog/screenshots/<t>/<id>.jpg`.
- Cible : `src/components/sections/<famille>/<Variante>.astro` + `<Variante>.schema.ts` (type
  `<famille>.<variante>`, prop unique `section`), enregistrés dans `src/lib/sections.ts`
  (SECTION_REGISTRY) ; exemple ajouté à /styleguide (obligatoire : `astro check` casse sinon) + registry
  dans le même commit ; craft-floor lu avant, vérifié après ; capture `preview.jpg`.
- Chrome (`nav.header-*`, `nav.footer-*`) : même contrat + `chrome: true` dans le registre ; le site
  l'active dans `src/layouts/BaseLayout.astro` (import) et `src/lib/chrome.ts` (objet construit depuis
  SITE) — jamais dans un frontmatter. Archétypes de page (`layouts/<archetype>/<variante>/` du kit) : la
  route (`src/pages/blog/[...slug].astro`…) importe la variante, contrat `entry` + `<slot />`.
- La section portée est ensuite COPIÉE dans le kit (`sections/<famille>/<variante>/`) avec README,
  source.jpg, preview.jpg, et la fiche catalogue passe `port_candidate → portée`.
- Un portage = un lot Opus indépendant (une section, critères : conversions 1-3 contrôlées, build vert,
  preview lisible).

## Recettes d'archétypes sans layout (compositions de sections)
Certaines familles `page.*` de la taxonomie ne sont pas des layouts mais des compositions standard, à
déclarer dans le frontmatter `sections:` d'une page ou d'une landing :
- **page.sector / page locale** : `hero.inner` (ou `hero.center` sur visuel) → `offer.services` → `proof.stats`
  ou `proof.cases` → `offer.process` → `content.faq` (questions du secteur/de la ville) → `convert.cta` ;
  une page par secteur = une entrée d'une collection dédiée (règle absolue 9), jamais N pages bespoke.
- **page.contact** : `hero.inner` ou `hero.form` → `convert.contact` (englobe ContactForm) → `convert.map` →
  `content.faq` courte.
- **page.news / actualités** : `hero.inner` → `blog.index` ou `page.event` (grille) → `convert.newsletter`.

## Ce que le catalogue ne décide pas
Le kit fournit structure et proportions ; le monde fournit couleurs et fontes ; le brief fournit le
texte. Une section du template A sous le monde du template B est le cas NORMAL, pas une exception.
