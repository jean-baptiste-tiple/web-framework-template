# Component registry

Vérifier ICI + la bibliothèque **/styleguide** (noindex, absente de la production, ADR 0003) AVANT
de créer un composant OU d'écrire du markup de section. Tout nouveau composant/variante → l'ajouter
ici ET lui donner sa démo colocalisée dans le même commit (§ Bibliothèque vivante).

## Bibliothèque vivante (/styleguide)
La bibliothèque montre TOUS les composants, découverts au build (`src/lib/styleguide.ts`) : la page
(`src/pages/styleguide/[...galerie].astro`) ne liste rien, chaque composant y entre par sa démo.
- **Démo colocalisée** : `<Nom>.demo.astro` à côté de `<Nom>.astro`. Frontmatter :
  `export const demo: DemoDoc = { name, purpose, ask }` (annotation de type, jamais `satisfies` :
  coding-standards), corps = rendu des variantes, TOUTES dans `DemoCase` (libellé + `surface="inverse"`
  pour un `tone="inverse"`) : la page isolée ne pose aucune marge latérale, c'est `DemoCase` qui la
  pose. `bleed` la retire : à poser quand le rendu pose lui-même sa Section/Container (haut de page,
  bloc pleine largeur, comme `ui/PageHero.demo.astro`), sinon ses gouttières s'ajoutent à la marge et
  l'aperçu téléphone est faux (32 px au lieu de 16) ; jamais sur un élément (bouton, carte, champ).
  Modèle : `ui/Button.demo.astro`. Une section porte la sienne dans son
  `.schema.ts` : `export const demo = { name, purpose, ask, example } satisfies SectionDemo<…Section>`
  (fichier `.ts`, `satisfies` y est permis), rendu par SectionRenderer.
- **Fiche éditeur** : `name` = nom français que l'éditeur emploie (pas le nom du fichier), `purpose` =
  à quoi ça sert en une phrase, `ask` = phrase à dire à Claude pour l'utiliser, sur une page réelle du
  site. « Seul ou développeur » est DÉDUIT : section ajoutable dans `sections:` = l'éditeur seul ;
  chrome = textes seuls, modèle = développement ; tout le reste = développement. Props/champs,
  variantes (unions de littéraux) et « pages qui l'utilisent » sont calculés, jamais écrits.
- **Contrôles machine** : `pnpm run lint` (`scripts/check-styleguide.mjs`) échoue si un composant de
  `src/components` n'a ni démo ni exemple de section, si une démo n'a plus de composant, si une
  exclusion ne vise plus rien ; le build (hors production) échoue si une fiche est incomplète, si un
  `example` ne passe pas son schéma, si une section du registre n'a pas de `.schema.ts`. Exclusions
  (composants sans rendu propre) : liste COURTE dans le script, une raison par ligne.
- **Fondations** (lues au build, rien à écrire dans la page) : tokens des blocs `@theme` de
  `src/styles/global.css` ; « Styles partagés » = ses `@utility` annotés (format et règle :
  styling-tailwind.md), avec aperçu, règle appliquée et fichiers qui posent chaque style ;
  « Illustrations » = `src/assets/illustrations/*.{webp,png,jpg,jpeg,svg}`, le nom de fichier sans
  extension étant le nom à citer à Claude. Ces deux rubriques sont FACULTATIVES : absentes du menu et
  de la page tant que le site n'a ni `@utility` annoté ni ce dossier (cas du modèle).
- **Usage visible** : chaque fiche dit « Utilisé sur aucune page pour l'instant » ou « Utilisé sur : … »
  (trois usages, le reste en vue technique) ; chercher « aucune page » liste les composants inutilisés.
- **En-tête collant** : la barre d'aperçu et le menu collent à `top-0`, les ancres gardent
  `scroll-mt-36` (hauteur de la barre sur téléphone). Un site dont l'en-tête colle décale ces valeurs
  de sa hauteur dans `src/pages/styleguide/[...galerie].astro` ; la barre reste opaque (`bg-bg`), une
  barre translucide laisse lire les aperçus à travers elle.
- **Avant tout markup ou composant** (développement, `modifier-design`, `creer-page`, design-craft,
  portage d'une section du kit) : chercher dans la bibliothèque PAR LE CONCEPT (« témoignage »,
  « chiffres »), puis citer dans le plan ou le rayon d'impact, item Doublons, le composant réutilisé
  ou étendu par son ancre `/styleguide/#<id>`, ou ce qui casse sans le nouveau. Contrôle en review.
- **Markup recopié (contrôle machine A)** : le même ensemble de 4 classes ou plus (ordre indifférent,
  attribut `class="…"` statique, au moins une classe visuelle : texte, fond, bordure, rayon, ombre,
  typo, contour) dans deux fichiers `.astro` fait échouer `pnpm run lint`. Hors périmètre : les
  `*.demo.astro`, les `class={…}` calculés, les groupes de pure mise en page (`grid gap-6
  sm:grid-cols-2`). Remède : le composant de la bibliothèque qui porte ce markup, ou en extraire un
  (avec sa démo), ou, pour une combinaison de style sans structure (titre, chapô, légende, barre
  collante), un style partagé de `global.css` (styling-tailwind.md) ; jamais renommer ou réordonner
  des classes pour passer le contrôle.
- **Page qui compose ses sections (contrôle machine B)** : déclarée dans § Pages bespoke ci-dessous,
  sinon `pnpm run lint` échoue.
- **Amélioration continue** : un composant modifié (prop, variante, rendu, usage) voit sa démo et sa
  fiche mises à jour dans le même commit ; deux composants qui font la même chose = brief
  `.claude/templates/fusion-a-trancher.md` reporté ici (§ Doublons), jamais un troisième ; une page
  (`src/pages/`, corps MDX) qui recopie le markup d'un composant existant = violation (contrôles A et
  B ; ce qu'ils ne voient pas, moins de 4 classes ou corps MDX, se cite en review).
- **Côté éditeurs** : un bloc se propose par son nom français de la bibliothèque, avec le lien
  `<TEST>/styleguide/#<id>` (CLAUDE.md § Projet) ; jamais un bloc inventé ni un bricolage dans la page.
  Besoin non couvert = développement : un nouveau composant, qui entre dans la bibliothèque.

## Normes transverses
- Préférer UN composant à variantes à N composants quasi identiques. Quand une famille grandit, marquer son CANONIQUE ici (« Canonique hero », « Canonique CTA »…) ; les composants gardés séparés portent un ⛔ avec la raison en une ligne (sinon chaque review rejoue le débat de fusion).
- Largeur : toute section passe par <Container>. Aucune surcharge de largeur en px ; exceptions de LECTURE (prose) listées ici, et la bibliothèque /styleguide (pleine largeur à gouttières relatives : l'aperçu ordinateur de 1280 px y est réduit à la colonne, qui doit rester large).
- Styles partagés : `@utility` annotés de global.css (styling-tailwind.md), montrés en Fondations de la bibliothèque. Aucun dans le modèle ; un site dérivé en tient la liste ici (classe : rôle).
- Surface de carte : Card.astro. Un wrapper ne pose pas une surface que son slot porte déjà (anti double-carte).
- Squelette d'accordéon : Accordion.astro. Une section qui a besoin d'un `<details>` le consomme (comme Faq.astro) au lieu de réécrire summary + marqueur + bascule.
- Icônes : jeu FERMÉ d'Icon.astro. Un tracé dessiné dans une section (au lieu d'être ajouté à icons.ts) est une duplication à corriger ; emoji et police d'icônes sont interdits (craft-floor § Refuse).
- Ne pas créer de composant sans usage. Une donnée déclarée (settings, schéma) mais rendue par aucun composant est annotée « dormante » ici, pas présentée comme branchée.

## UI (src/components/ui/)
| Composant | Props | Rôle |
| --- | --- | --- |
| Container.astro | class?, prose? | Largeur max + padding (prose = colonne de lecture) |
| Section.astro | class? | Espacement vertical de section |
| Button.astro | href?, variant(primary/outline)?, tone(default/inverse)?, type(button/submit)?, class? | Bouton/lien (type pour usage formulaire ; tone = surface qui le porte) |
| Card.astro | padding(default/none)?, tone(default/inverse)?, class? | **Canonique surface de carte** : fond + bordure + radius. `padding="none"` = contenu bord à bord (rogné au radius), pas de surcharge de gouttière depuis un parent. `tone="inverse"` = carte sombre (surface, filet ET couleur de texte fixés par le ton, jamais hérités) : ne PAS repeindre une `Card` par une classe au call-site |
| PageHero.astro | eyebrow?, title ; slots lead, actions, défaut (média) | **Canonique haut de page** : sur-titre + H1 + chapô + actions + média, centrés dans Section/Container. Home et landings ; une image de haut de page passée en slot garde `loading="eager"` + `fetchpriority="high"` |
| Tldr.astro | text | Encadré « En bref » (tldr du frontmatter) en tête d'une page éditoriale ou d'un article ; porte sa marge basse (`mb-8`) |
| Accordion.astro | summary, name?, open?, class? | **Canonique accordéon** : `<details>/<summary>` + slot, chevron Icon en bascule CSS, reduced-motion, focus visible. `name` partagé = exclusivité native. `open` = ouvert au chargement (contenu visible sans script). **Cible tactile garantie** : `min-h-11` (44px) + `items-center` sur le `<summary>`, donc au plancher craft-floor même sur un libellé d'une seule ligne. Ne PAS réécrire ce markup dans une section |
| Badge.astro | tone(accent/neutral/inverse)?, class? | Pilule de kicker (sur-titre court, étiquette de section). Slot libre |
| Icon.astro | name, size?, label?, class? | Icône inlinée du jeu FERMÉ `./icons.ts` (sous-ensemble Lucide, ISC). `label` = porteuse de sens, sinon `aria-hidden`. Jamais d'emoji ni de police d'icônes |
| icons.ts | — | Table des tracés + `IconName` + `ICON_NAMES`. Séparée du .astro : les `export` du frontmatter Astro sont hissés au-dessus du corps et ne peuvent pas dériver d'une const locale |
| Faq.astro | title?, items[] | Titre + paires q/a, rendues par Accordion (aucun markup `<details>` propre) |
| GlobalFaq.astro | title? | FAQ globale partagée (SITE.faq, éditée dans site.json) |
| ContactForm.astro | idPrefix?, tone(default/inverse)?, submitLabel? | Formulaire contact statique vanilla (0 framework) vers PUBLIC_FORM_ENDPOINT. `idPrefix` (défaut `contact`) préfixe id/for : deux formulaires sur une page ne dupliquent pas `id="name"`. Les champs posent leur couleur de texte (`text-fg` / `placeholder:text-muted`) : englobé dans une bande `text-inverse-fg`, le formulaire reste lisible sans surcharge au call-site. `tone` = surface qui porte le formulaire, et n'agit QUE sur les messages d'état (seule couleur qui dépende du fond : aucune valeur ne tient 4,5:1 sur `bg` et sur `inverse`) — champs, libellés et Button sont déjà corrects sur les deux surfaces. `submitLabel` (défaut `Envoyer`) = libellé du bouton d'envoi ; le `<script>` ne le redit pas, il LIT le libellé de repos sur le bouton avant de poser « Envoi… » et le restitue — sans quoi tout formulaire à libellé propre repasserait à « Envoyer » après le premier envoi |

## Outillage de la bibliothèque (src/components/styleguide/)
| Composant | Props | Rôle |
| --- | --- | --- |
| DemoCase.astro | label, surface(default/inverse)?, bleed? | Un cas d'une démo : libellé + rendu, avec la marge latérale de la page isolée ; `inverse` pose la bande sombre (fond ET texte) ; `bleed` = rendu bord à bord, libellé aligné sur le Container (bloc qui pose sa Section/Container). Utilisé par les `*.demo.astro` seulement |

## SEO (src/components/seo/)
| Composant | Rôle |
| --- | --- |
| BaseHead.astro | Balises meta/OG/Twitter/canonical + `<link rel="alternate" type="text/markdown">` vers le jumeau `.md` (pages indexables seulement) |
| JsonLd.astro | JSON-LD @graph selon le type de page ; Organization avec contactPoint/address dès que site.json renseigne `contact`/`address` |

## Landing (src/components/landing/)
| Composant | Rôle |
| --- | --- |
| SectionRenderer.astro | Lit `SECTION_REGISTRY[section.type].component` (src/lib/sections.ts) et le rend. Ne contient AUCUN markup : ajouter une section ne le touche pas. |

## Sections (src/components/sections/&lt;famille&gt;/)
Une variante = `<Variante>.astro` + `<Variante>.schema.ts` à côté (fragment Zod dont le `type` vaut
`<famille>.<variante>`, taxonomie : C:\apps\web-kit\catalog\taxonomy.md), + UNE entrée dans
`src/lib/sections.ts`. Le registre est la source unique : `content.config.ts` en dérive l'union
discriminée `sections` (landings ET pages), SectionRenderer y lit le composant, la bibliothèque rend
l'`example` du `demo` exporté par le `.schema.ts` (lint et build cassent s'il manque). Props : un seul
prop `section`, typé depuis le schéma.

**Chrome (`chrome: true` au registre)** : header, footer et barre d'annonce sont des variantes de
section comme les autres (schéma + prop `section` + `demo` dans le schéma), mais rendues UNE fois par
`BaseLayout` depuis `src/lib/chrome.ts` (qui traduit `SITE` ← site.json vers la forme de la variante).
Le marqueur `chrome: true` les EXCLUT de `sectionSchema`, l'union offerte au frontmatter des
collections : un `type: nav.header-simple` dans un `sections:` casse `astro check` (discriminant
refusé). Changer de variante = changer l'import dans BaseLayout + l'objet dans chrome.ts. Ne jamais
rendre une variante chrome depuis une page.

| Type (discriminant) | Composant | Rôle |
| --- | --- | --- |
| nav.header-simple (chrome) | nav/HeaderSimple.astro | Header : marque + nav principale (brand, nav[]) |
| nav.footer-simple (chrome) | nav/FooterSimple.astro | Footer : copyright + liens de service (organizationName, links[]) |
| offer.features-grid | offer/FeaturesGrid.astro | Grille de features en Card (3 colonnes) |
| proof.testimonials-grid | proof/TestimonialsGrid.astro | Témoignages en figure/blockquote (2 colonnes) |
| content.faq-accordion | content/FaqAccordion.astro | FAQ en colonne de lecture (réutilise Faq.astro) |
| convert.cta-banner | convert/CtaBanner.astro | Bandeau CTA centré (titre + Button) |

## Islands (src/components/islands/)
SolidJS = starter opt-in, non installé par défaut. Créer un îlot ici UNIQUEMENT après avoir
installé @astrojs/solid-js et seulement si le natif (<details>, <script>) ne suffit pas.

## Layouts (src/layouts/)
| Layout | Rôle |
| --- | --- |
| BaseLayout.astro | Head SEO + JSON-LD + chrome (variantes nav.*, alimentées par src/lib/chrome.ts). Utilisé par TOUTES les pages. |

## Pages bespoke (markup inline déclaré)
Chaque bloc resté en markup inline (hors composant) est listé ici avec sa raison en une ligne.
Contrôle machine (`scripts/check-styleguide.mjs`, contrôle B) : tout fichier de `src/pages/` qui pose
`<Section>` ou `<section>` lui-même figure dans la colonne Page (chemin depuis `src/pages/`, plusieurs
séparés par des virgules), sinon `pnpm run lint` échoue ; une ligne qui vise un fichier disparu aussi.
| Page | Bloc | Raison |
| --- | --- | --- |
| index.astro | grille des derniers articles | design unique de la home (règle DRY : bespoke réservé à l'unique) ; le haut de page passe par PageHero |
| blog/index.astro | titre + liste des articles en cartes | route unique de la collection blog |
| contact.astro | titre, coordonnées (site.json), formulaire | page unique ; coordonnées lues dans SITE, formulaire = ContactForm |
| styleguide/[...galerie].astro, styleguide/[id].astro | menu, recherche, bascule ordinateur/téléphone, fiches | page outil (hors production) : son markup ne sert nulle part ailleurs |

## Doublons & consolidation (roadmap)
Dette de duplication tracée ici : datée, priorisée valeur/risque, avec fait / reste à faire.
Fusion : jamais en aveugle — inspecter la divergence réelle avant (gabarit
.claude/templates/fusion-a-trancher.md), puis décision datée avec sa raison.
- 2026-10-21, fait : haut de page de la home et des landings → PageHero ; encadré « En bref » des pages et articles → Tldr (rendu identique au pixel, 4 pages × 2 largeurs).
- 2026-10-21, à trancher : carte d'article de `index.astro` (Card cliquable, h3, description) et de `blog/index.astro` (même carte + date, h2). Candidat ArticleCard : brief fusion-a-trancher à remplir avant toute fusion (le contrôle A ne la voit pas : moins de 4 classes par attribut).
