# Scripts de migration Webflow → Astro & harnais de parité

Outillage d'une migration de site (Webflow ou similaire) vers ce template Astro.
**Toute la configuration site-spécifique vit dans un seul module :
[`migration/config.mjs`](migration/config.mjs)** — à remplir en début de migration
(origines, chemins, listes métier). Les scripts eux-mêmes sont génériques et se
lancent **depuis la racine du repo** : `node scripts/migration/<script>.mjs`.

Le mode d'emploi complet de la migration (phases, checklists, critères de sortie)
est dans le playbook : **`.tiple/playbooks/migration-webflow.md`**.

## Dépendances (début de migration uniquement)

Volontairement **absentes de `package.json`** : ce sont des outils jetables de
migration, pas des dépendances du site. Les installer au début du chantier
(`pnpm add -D …`), les retirer à la fin. Versions utilisées avec succès :

```bash
pnpm add -D node-html-parser@^7.1.0 turndown@^7.2.4 sharp@^0.35.1 \
  playwright-core@^1.61.1 pixelmatch@^7.2.0 pngjs@^7.0.0
```

- `node-html-parser` + `turndown` — parsing HTML et conversion → Markdown (convert, audits de contenu)
- `sharp` — optimisation d'images + chargement de screenshots
- `playwright-core` — pilote le Chrome système (`CHROME_PATH`, config) pour captures/audits
- `pixelmatch` + `pngjs` — diff de screenshots

`crawl`, `inventory`, `assets`, `verify`, `link-integrity`, `meta-integrity`,
`html-leak-lint`, `fix-md-*`, `fix-broken-links`, `sync-meta-to-source` sont
**zéro dépendance** (Node seul).

## Ordre d'usage typique

```
crawl → inventory → assets → convert → fix-md-* → couches de vérif → parité
```

1. **Acquisition** : `crawl.mjs` (snapshot HTML du live), `inventory.mjs` (vérité source), `assets.mjs` (téléchargement des assets CDN).
2. **Conversion** : `convert-articles.mjs` (+ vos scripts de conversion par archétype, bâtis sur `lib-convert.mjs`), puis `optimize-assets.mjs`, `fix-hash-assets.mjs`.
3. **Réparations Markdown** (dry-run d'abord, chaque script a son flag d'écriture) : `fix-md-headings`, `fix-md-bold`, `fix-split-headings`, `fix-broken-links`, `fix-article-bodies`.
4. **Vérification** (après `pnpm build`) : `verify`, `verify-text`, `link-integrity`, `meta-integrity`, `content-completeness`, `html-leak-lint`, `check-broken-images`, `find-unused-assets`, `live-diff`, `visual-sweep` / `screenshot-diff`.
5. **Parité fine** (scripts/parity/) : `manifest` → `capture` → `diff` (gate), plus les audits ciblés.

## scripts/migration/ — rôle de chaque script

| Script | Rôle |
| --- | --- |
| `config.mjs` | Config UNIQUE site-spécifique (origines, chemins, ports, listes métier). |
| `crawl.mjs` | Crawl poli (≤1 req/s) du site source → snapshot HTML local, resumable. |
| `inventory.mjs` | Inventaire du snapshot (URL, type, title, meta, h1, dates) → `inventory.json`, vérité source. |
| `assets.mjs` | Télécharge les assets CDN référencés par le snapshot → staging + `assets-map.json`. |
| `lib-convert.mjs` | Helpers partagés HTML → Markdown (turndown, réécriture d'assets, frontmatter YAML). |
| `convert-articles.mjs` | Convertit les articles de blog du snapshot → `src/content/blog/*.md`. |
| `optimize-assets.mjs` | Recompresse/cappe (1600px) les images raster de `public/assets`, in-place. |
| `fix-hash-assets.mjs` | Renomme les assets contenant `#` (cassent en URL) + met à jour les références. |
| `find-unused-assets.mjs` | Liste (ou `--delete`) les assets jamais référencés dans le build. |
| `check-broken-images.mjs` | Vérifie que chaque image du build (src/srcset/og/url()) existe sur disque. |
| `fix-md-headings.mjs` | Recolle `##\nTexte` → `## Texte` (titres vides). |
| `fix-md-bold.mjs` | Répare les `**` orphelins sur leur propre ligne (gras littéral). |
| `fix-split-headings.mjs` | Recolle les titres coupés sur 2 lignes par l'export. |
| `fix-broken-links.mjs` | Recolle les liens Markdown multi-lignes (lignes vides dans le texte du lien). |
| `fix-article-bodies.mjs` | Réinsère les fragments d'article perdus autour des bandeaux CTA Webflow. |
| `sync-meta-to-source.mjs` | Réaligne title/description de pages ciblées sur l'inventaire source. |
| `verify.mjs` | Gate post-build : couverture, titles/descriptions = source, liens, images, générateurs. |
| `verify-text.mjs` | Rappel du texte source dans le build (complétude, % par page/type). |
| `link-integrity.mjs` | Chaque href/src interne du build résout dans `dist/` (gate, + `--frag` pour les ancres). |
| `meta-integrity.mjs` | `<head>` de chaque page : title/desc/canonical/OG/h1/JSON-LD (gate avec `--strict`). |
| `content-completeness.mjs` | Diff source Webflow − build : blocs/titres droppés, boilerplate auto-exclu. |
| `html-leak-lint.mjs` | Fuites de markdown/chrome dans le HTML buildé (gate, zéro baseline). |
| `live-diff.mjs` | Empreinte snapshot live vs build : titres manquants/en trop, images, ratio texte. |
| `visual-sweep.mjs` | Screenshots full-page live vs preview locale, diff pixel + histogramme couleur, classé. |
| `screenshot-diff.mjs` | Compare deux PNG (ou un manifest de paires) : hauteur, % pixels, bande divergente, couleurs. |
| `dump-section.mjs` | Fonction `__dump(sel)` à injecter (Playwright) : specs exactes d'une section (texte, styles, marges). |
| `extract-section.mjs` | Fonction d'extraction d'arbre stylé d'une section (spec JSON pour ré-écriture). |

## scripts/parity/ — harnais de parité pixel-perfect

| Script | Rôle |
| --- | --- |
| `lib.mjs` | Briques partagées : normalisation, hash de finding, tolérances MINOR/MAJOR. |
| `manifest.mjs` | Table de correspondance baseline (export Webflow / snapshot) ↔ routes `dist/`. |
| `probe.mjs` | Sonde injectée dans les 2 DOM : sections, éléments, styles calculés, layouts. |
| `capture.mjs` | Charge chaque paire du manifest × viewports, réseau hermétique, dumpe des JSON de métriques. |
| `diff.mjs` | Diff offline des dumps : appariement LCS+fuzzy, styles+géométrie, rapport + **gate** (exit 1 si MAJOR non accepté). |
| `bg-audit.mjs` | Couleur de fond de bande de chaque titre, source vs build (export + preview servis en local). |
| `responsive-audit.mjs` | Défauts responsive : débordement horizontal, images trop larges, texte <12px. |
| `section-gap-audit.mjs` | Sections dont le contenu colle le bord bas de leur bande de fond. |
| `deep-capture.mjs` | Landing pages distantes (live vs déployé) : screenshots pleine page + par bande + dump JSON. |
| `vision.workflow.js` | Workflow Claude Code : 1 agent vision par LP sur les captures de `deep-capture`, puis vérif adversariale des MAJOR. |

### `accepted.json` et `accepted-rules.json`

Le gate `diff.mjs` **échoue sur tout écart MAJOR non listé**. Deux registres
d'écarts acceptés (chaque acceptation est une décision justifiée, versionnée) :

- `accepted.json` — acceptations **unitaires**, par hash de finding :
  `[{ "hash": "abc123def456", "reason": "hero source à hauteur variable (slider)" }]`.
  Le hash apparaît dans le rapport (`#abc123def456`).
- `accepted-rules.json` — acceptations **systémiques** (décision de canon qui
  s'applique partout, ex. « tous nos boutons ont le radius du design system ») :
  `[{ "prop": "radius", "el": "btn", "reason": "canon design system" }]`.
  Champs : `prop`, `sec`/`el`/`page` (regex), `a`/`b` (valeurs exactes), `vp`
  (liste de viewports), `reason`.

Les deux fichiers démarrent vides (`[]`).
