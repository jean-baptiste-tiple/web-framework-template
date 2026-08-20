# Playbook — Dupliquer un site Webflow vers Astro (ce template)

> Méthode éprouvée sur une migration réelle (~430 pages, 2900 assets, 27 LP marketing).
> Chaque règle vient d'un écart réellement constaté et corrigé — souvent après un
> aller-retour utilisateur qui aurait pu être évité. Outillage : `scripts/migration/` +
> `scripts/parity/` (config unique `scripts/migration/config.mjs`, voir `scripts/README.md`).

## Principes fondamentaux (les 3 leçons n°1)

1. **Transcrire, jamais recomposer.** Une page source n'est PAS une occasion de réutiliser le
   design system : si le live a un carrousel sur bande cyan sans titre, on fait exactement ça —
   pas une grille de cartes avec un titre inventé. La cause racine du plus gros lot d'écarts
   (151 sur 18 pages, constatés APRÈS une passe déclarée finie) : « pages recomposées avec les
   composants canoniques au lieu d'être transcrites du live ».
2. **Zéro caractère inventé.** Interdiction absolue de rédiger du texte qui n'existe pas dans le
   source (titres de section, CTA, promesses commerciales). Cette classe d'erreur est invisible
   aux diffs de complétude (qui cherchent le manquant, pas le surnuméraire) : câbler
   `live-diff.mjs` (détection du « en trop ») en gate.
3. **Reconstruire « à l'œil » ne marche jamais.** Structure + contenu ← HTML de l'export ;
   valeurs visuelles (tailles, couleurs, marges, layout) ← **styles CALCULÉS mesurés au
   navigateur** sur l'export servi (`dump-section.mjs`), PAS lues dans le CSS à la main, PAS
   estimées. Critère d'arrêt = parité des valeurs calculées desktop ET mobile. Le diff pixel
   (pixelmatch) n'est pas fiable entre moteurs (antialiasing) : abandonné comme critère.

## Phase 0 — Inventaire & carte des baselines

- Crawl poli du live (`crawl.mjs`, 1 req/s, resumable) → snapshot HTML local. Réconcilier avec
  le sitemap source : les pages **hors sitemap** existent (31 trouvées sur la mission de
  référence) et doivent être décidées (migrer / exclure), pas découvertes en cours de route.
- `inventory.mjs` → `inventory.json` = **source de vérité** (url, type, title, meta, og, h1,
  dates). `assets.mjs` → téléchargement des assets CDN Webflow.
- Récupérer l'**export de code Webflow** (`EXPORT_DIR`) : c'est la référence de structure et de
  valeurs. Attention : les listes CMS y sont parfois VIDES (`w-dyn-bind-empty`) — pour les fiches
  de collection, la baseline est le **snapshot du live**, pas l'export.
- **GATE : la carte des baselines.** Un tableau `page → baseline (export / snapshot / live /
  AUCUNE)` couvrant 100 % de l'inventaire. Toute page sans baseline (ex. LP hébergées sur un
  sous-domaine marketing, absentes de l'export ET du snapshot) est un **chantier à part avec sa
  propre baseline à constituer** (`scripts/parity/deep-capture.mjs` sur le live), jamais un
  sous-produit. C'est l'oubli qui a coûté le plus cher.

## Phase 1 — Cadrage (les ADRs à poser AVANT de coder)

Chaque cas limite tranché d'emblée par un ADR court (`docs/decisions/`), sinon il se re-débat à
chaque page :
- **Routes calquées à l'identique** sur le source (parité d'URL = signal SEO, zéro redirection).
  Le routing du socle s'adapte au source, pas l'inverse.
- **La fidélité prime sur les règles éditoriales du socle** : title/description reproduits au
  caractère près même hors normes (longueur, vide) ; pas d'invention de tldr ; `updatedDate` =
  date du source, pas de la migration. Les apports invisibles au rendu (JSON-LD, sitemap,
  llms.txt) sont conservés. Assouplir les schémas Zod en conséquence.
- **Pages utilitaires / tierces** (search dynamique, connexion, forms tiers) : reproduites au
  même chemin pour la parité d'URL, sans runtime ; liens externes conservés tels quels ; scripts
  tiers exclus par défaut.
- **Stratégie images** : des centaines d'images inline en Markdown converti ⇒ assets statiques
  `public/assets/` référencés par URL (PAS `astro:assets`), avec width/height reproduits du
  source (anti-CLS) et copie des seuls assets référencés (`find-unused-assets.mjs`).

## Phase 2 — Socle partagé, puis GEL PROUVÉ

- Tokens (`global.css`) = valeurs **mesurées** sur le source (hex relevés, pas choisis).
  Polices self-hostées. Header (méga-menus), Footer, Button — avec les props découvertes à la
  dure : `size` (le source a presque toujours ≥ 2 tailles de bouton), `titleSize` par section
  (**ne jamais laisser un composant imposer sa taille de titre** : l'écart 50→30px a touché 8
  sections d'une seule page).
- **GATE : gel du socle prouvé par diff** (diff vide sur global.css/Header/Footer/Button sur
  tout l'intervalle), pas supposé. Un changement de socle se traite en séquentiel, jamais dans
  un worktree parallèle.

## Phase 3 — Conversion du contenu

- `lib-convert.mjs` (turndown + node-html-parser) + un script de conversion par archétype.
- Pièges connus du parseur (chacun a son script de réparation) :
  - Webflow découpe un corps d'article en **plusieurs** `.w-richtext` autour d'un bandeau CTA —
    ne garder que le plus gros bloc a tronqué 177 articles sur 247 (`fix-article-bodies.mjs`).
  - Artefacts Turndown : titres cassés, `**` orphelin, liens multi-lignes (`fix-md-headings.mjs`,
    `fix-md-bold.mjs`, `fix-broken-links.mjs`, `fix-split-headings.mjs`).
  - Éléments **hydratés en JS** (sliders, listes « related ») : invisibles à l'extraction
    statique — les vérifier au NAVIGATEUR sur le live avant de conclure qu'ils n'existent pas
    (des témoignages ont été supprimés à tort).
- **GATE : collections PEUPLÉES, pas seulement rendues.** Auditer les champs de frontmatter
  vides par collection : un template correct + 29 fiches sur 30 aux champs vides = 29 pages
  fausses qui buildent en vert.

## Phase 4 — Couches de vérification déterministes (gates cumulés)

Six couches, chacune née d'un bug que les autres ne voyaient pas. Propriétés communes : aucune
baseline requise (sauf verify/live-diff), 100 % des pages, `exit 1` câblé dans le build.
1. `verify.mjs` — couverture / titles / meta / liens / images vs `inventory.json`.
2. `html-leak-lint.mjs` — fuites markdown/chrome Webflow dans le HTML buildé.
3. `content-completeness.mjs` — blocs du source absents du build (boilerplate nav/footer retiré
   automatiquement par fréquence).
4. `link-integrity.mjs` — chaque href/src interne résolu contre `dist/` réel. Attrape le piège
   `%2B` : Node décode les URL-encodés, un host statique NON → 404 en prod uniquement.
5. `meta-integrity.mjs` — title/desc/canonical/og/H1 unique/JSON-LD.
6. `live-diff.mjs` — manquant ET **en trop** (contenu inventé), séquence des titres.

Limite connue : **aucune de ces couches ne voit « fidèle en texte, faux en design »** (mêmes 9
titres, même longueur, mais prose linéaire au lieu d'une grille de cartes). C'est le rôle des
phases 5-6.

## Phase 5 — Parité visuelle par MESURE (boucle par page)

Boucle par section, déterministe (voir `dump-section.mjs`/`extract-section.mjs`) :
(a) lire la section dans l'export → structure + contenu exacts ; (b) `__dump` sur l'export servi
aux 2 viewports (desktop + 360) → spec de valeurs ; (c) réécrire proprement (archétype réutilisé
si déjà construit, variante additive sinon — jamais de bespoke inline) ; (d) re-`__dump` le
local et comparer **champ par champ** ; (e) capture côte-à-côte ; (f) gate + commit atomique.

Harnais global `scripts/parity/` (a fait passer 3492 écarts MAJOR → 266) :
- `probe.mjs` : UNE sonde pour les deux DOM (div-soup Webflow et Astro sémantique) — pas de
  drift entre deux implémentations.
- `capture.mjs` → JSON de métriques (zéro screenshot dans la boucle rapide), tiers coupés.
- `diff.mjs` : appariement par texte normalisé + styles calculés + géométrie, tolérances
  calibrées (`lib.mjs`) ; **gate exit 1 sur tout MAJOR non listé dans `accepted.json`** (écart
  accepté = justifié par écrit, identifié par hash).
- Balayages mécaniques transverses — les classes d'écarts n°1 se voient en global, pas page par
  page : `bg-audit.mjs` (fonds de bande de CHAQUE titre — l'écart le plus fréquent : rythme des
  bandes de couleur), `section-gap-audit.mjs`, `responsive-audit.mjs` (**en continu dès le
  socle**, 1 page par template : débordement horizontal, texte < 12px, cibles < 40px).

Classes d'écarts récurrentes à balayer systématiquement (fréquences réelles constatées) : fonds
de section / rythme des bandes (~100 % des pages) · tailles de titres héritées du canon ·
boutons de form (pleine largeur + libellé exact) · logos (taille, répartition, proportions) ·
pattern remplacé (carrousel→grille, accordéon→cartes) · bandes saturées délavées · miroir
gauche/droite · sections manquantes ou réordonnées · icônes interverties · eyebrows/gras perdus.

## Phase 6 — Audit VISION adversarial (le filet final)

Sur toute page dont la baseline est le live (et sur un échantillon des autres) :
`deep-capture.mjs` (screenshot + dump JSON **par bande visuelle**, live et local), puis le
workflow `vision.workflow.js` : **1 agent vision par page** aligne les bandes et liste les
écarts, puis **1 vérificateur sceptique par page** confirme/réfute chaque MAJOR sur pièces
(sur la mission de référence : 152 findings, 151 confirmés, 1 réfuté). C'est le SEUL dispositif
qui a vu la classe « recomposé au lieu de transcrit ». Un audit structurel grossier qui sort du
bruit n'est pas un faux positif à ignorer : **il faut comparer le RENDU**.

## Phase 7 — Formulaires : un chantier à part, testé en réel

Le poste le plus coûteux de la mission de référence (7 passes de correctifs, tous découverts en
production). Règles (détail : `.tiple/conventions/forms.md`) :
- Relever le **schéma serveur** de chaque form par l'API du fournisseur (champs requis, noms
  exacts — `email` ≠ `work_email`) ; jamais le déduire du rendu. Un form qui n'affiche qu'un
  champ fait peut-être du **progressive profiling** : reproduire le mécanisme, pas le schéma
  complet (hero ×3 en hauteur sinon).
- Reproduire le **cookie/token de tracking** (ex. `hutk` HubSpot) : sans lui l'API répond 200
  mais ne crée AUCUN contact.
- Redirections post-soumission (pages de remerciement) : les recenser dans l'inventaire et les
  tester une par une.
- **GATE : une soumission réelle de bout en bout par mécanisme** — le lead arrive dans le CRM
  (contrôler l'onglet spam), la notification part, la page de remerciement s'affiche. Sur un
  form SANS workflow actif ; jamais de test sur un form branché à des automatisations réelles.

## Phase 8 — Cutover

- Redirections : source unique + vraies 301 côté host/CDN ; noindex préprod ; purge cache CDN ;
  suppression de la config de l'ancien host (voir `.tiple/conventions/deploy.md`).
- **Une passe NAVIGATEUR sur l'environnement déployé** : les bugs `%2B`, lazy-load, hydratation
  n'existent qu'en réel.
- Surveiller les soumissions de forms les premiers jours (quarantaine anti-spam du fournisseur).

## Parallélisation (après le gel du socle uniquement)

1 worktree + 1 port de preview par unité de travail ; une unité = un type de page (puis une page
pour les LP) ; chaque agent ne touche QUE son fichier cible + ses assets → merges sans conflit ;
re-gate global à chaque merge ; navigateur = goulot, sérialiser les captures.

## Journal & apprentissage

Tenir dès le JOUR 1 le tableau « retour → cause racine → règle » (boucle « Après une erreur »
de CLAUDE.md, journal `docs/learnings.md`) : c'est le mécanisme qui transforme un aller-retour
utilisateur en garde permanente. Sur la mission de référence il n'a été instauré qu'à mi-course ;
chaque ligne du présent playbook en est issue.
