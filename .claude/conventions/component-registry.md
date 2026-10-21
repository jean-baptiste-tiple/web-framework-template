# Component registry

Vérifier ICI + la bibliothèque **/styleguide** (noindex, absente de la production, ADR 0003) AVANT
de créer un composant OU d'écrire du markup de section. Tout nouveau composant/variante → l'ajouter
ici ET lui donner sa démo colocalisée dans le même commit (§ Bibliothèque vivante).

## Bibliothèque vivante (/styleguide)
La bibliothèque montre TOUS les composants, découverts au build (`src/lib/styleguide.ts`) : ses pages
(`src/pages/styleguide/`) ne listent rien, chaque composant y entre par sa démo.
- **Forme (ADR 0003, révision v2)** : UNE fiche par page, jamais toutes les fiches sur une page.
  `/styleguide/` = accueil léger (familles, nombre de fiches) ; `/styleguide/<id>/` = une fiche ;
  `/styleguide/fondations/<rubrique>/` = une rubrique de Fondations ; `/styleguide/<id>/apercu/` = le
  rendu seul, affiché dans le cadre de la fiche et ouvrable seul. Mise en page dédiée
  (`src/components/styleguide/GalleryShell.astro`) : AUCUN en-tête ni pied de page du site
  (`BaseLayout chrome={false}`), menu à gauche (familles repliables par `Accordion variant="plain"`,
  celle de la page courante ouverte, page marquée `aria-current`, recherche qui filtre), filet
  `border-r` entre menu et fiche sur toute la hauteur ; précédente / suivante dans l'ordre du menu
  (`GalleryPager.astro`). Téléphone : la fiche, puis le menu (lien « Menu »).
- **Ordre du menu : celui d'une page** (ADR 0003, révision du 21/10 soir) : Fondations, Éléments
  (`ui/`), les autres dossiers de composants, puis les familles de sections : haut et bas de page,
  haut de page, offre, preuve, équipe, contenu, conversion. Réglé en UN endroit, l'ordre des clés de
  `FOLDER_LABELS` puis de `SECTION_FAMILY_LABELS` (`src/lib/styleguide.ts`), qui donnent aussi les
  libellés ; un dossier ou une famille qu'elles ne nomment pas passe après (libellé par défaut). Un
  sous-composant rangé sous `sections/<famille>/` (sans `.schema.ts`) est classé avec sa famille.
- **Fiche = nom + visuel + « Utilisé sur », rien d'autre** : ni phrase « à quoi ça sert », ni « seul /
  développeur », ni phrase à dire à Claude, ni vue technique (props et fichiers se lisent dans le code).
  Une variante se montre comme un CAS de l'aperçu, libellé par sa différence (`DemoCase label`,
  `examples[].label` d'une section), jamais par un texte au-dessus du visuel. « Utilisé sur » : liens
  des pages (une route dynamique est dépliée en ses pages réelles par son `getStaticPaths`), les 5
  premières puis « et N autres » ; sinon « Utilisé sur aucune page pour l'instant ». Contrôle :
  `DemoDoc` = `{ name }`, `SectionDemo` = `{ name, wraps?, examples }` (un champ de plus casse
  `astro check`) ; ajouter une ligne à la fiche = révision de l'ADR 0003.
- **Bloc qu'une section ne fait qu'emballer : UNE fiche, la section** : quand une section se contente
  de poser un composant existant (le « bloc ») dans sa Section/Container, elle le déclare par
  `wraps: '<chemin sous src/components>'` dans son `demo` (ex. `wraps: 'blocks/FinalCta.astro'`). Le
  bloc n'a PAS de démo : ses variantes sont des cas (`examples`) de la section, et les pages qui le
  rendent directement (gabarits `.astro`) s'ajoutent au « Utilisé sur » de la section. Une variante du
  bloc que la section ne sait pas exprimer reste non montrée et se note au § Doublons : on n'ajoute
  pas un champ de section offert aux éditeurs pour la seule galerie. Contrôle : lint (chemin
  inexistant, section qui n'importe pas le bloc déclaré, bloc emballé par deux sections, démo d'un
  bloc emballé = échec) et build (chemin inexistant, bloc emballé deux fois, démo d'un bloc emballé = échec). Le modèle n'en
  déclare aucun ; la liste des blocs emballés d'un site dérivé se tient ici.
- **Aperçu à hauteur bornée et stable** : le cadre prend la hauteur libre de l'écran (fiche en
  `h-svh`), JAMAIS celle de son contenu ; rien n'est mesuré dans l'iframe ni renvoyé à la page. Un
  composant en `vh` se rend dans un cadre fixe et la page ne grandit pas (avant : barre de défilement
  qui grandissait 1 à 2 minutes sur 107 fiches). Contrôle : hauteur du document d'une fiche relevée à
  5 s puis à 60 s, identique (règle générale : craft-floor § Verify, stabilité).
- **Démo colocalisée** : `<Nom>.demo.astro` à côté de `<Nom>.astro`. Frontmatter :
  `export const demo: DemoDoc = { name }` (annotation de type, jamais `satisfies` : coding-standards),
  corps = rendu des variantes, TOUTES dans `DemoCase` (libellé = la différence du cas ;
  `surface="inverse"` pour un `tone="inverse"`) : la page isolée ne pose aucune marge latérale, c'est
  `DemoCase` qui la pose. `bleed` la retire : à poser quand le rendu pose lui-même sa Section/Container
  (haut de page, bloc pleine largeur, comme `ui/PageHero.demo.astro`), sinon ses gouttières s'ajoutent
  à la marge et l'aperçu téléphone est faux (32 px au lieu de 16) ; jamais sur un élément (bouton,
  carte, champ). Modèle : `ui/Button.demo.astro`. Une section porte la sienne dans son `.schema.ts` :
  `export const demo = { name, examples: [{ label, example }, …] } satisfies SectionDemo<…Section>`
  (fichier `.ts`, `satisfies` y est permis) : un cas par variante, chacun rendu par SectionRenderer
  dans un `DemoCase bleed`.
- **Nom d'une fiche : la forme, pas le contenu** : type de mise en page + éléments, 2 à 5 mots (un
  seul permis pour un élément simple : « Bouton », « Icône »), sans contenu marketing, nom de page, nom
  du site ni slogan. « Trois forces » → « 3 colonnes · picto, titre, texte » ; « Haut de page Tarifs
  avec les offres » → « Haut de page · titre, offres ». Les variantes ne font pas de fiche : elles se
  nomment par leur différence dans le libellé de leur cas (« avec pictos », « sans pictos »). L'éditeur
  choisit un bloc par ce nom ; Claude dit lui-même s'il peut l'ajouter seul (section ajoutable dans
  `sections:`) ou si c'est du développement. Contrôle machine (`pnpm run lint`, check-styleguide) :
  nombre de mots, guillemets et `!`/`?` refusés, nom du site (site.json) refusé, nom unique dans la
  bibliothèque ; ce qu'il ne voit pas (nom de page, slogan sans guillemets) se cite en review.
- **Variante plutôt que composant voisin** : deux composants qui ne diffèrent que par la présence d'un
  élément (picto, image, bouton, sur-titre) ou par une valeur (alignement, nombre de colonnes, fond) =
  UN composant à variante, prop typée et additive (`icon?`, `align: 'left' | 'center'` : les
  call-sites existants ne bougent pas, CLAUDE.md règle absolue 6), montrée comme deux cas dans sa
  fiche. Deux composants existants dans ce cas = candidats à la fusion, brief
  `.claude/templates/fusion-a-trancher.md` reporté au § Doublons ; la fusion attend l'arbitrage, jamais
  un troisième composant. Contrôle : deux fiches au même nom font échouer le lint ; deux noms qui ne
  diffèrent que par un élément (« … avec picto » / « … ») se citent en review.
- **Contrôles machine** : `pnpm run lint` (`scripts/check-styleguide.mjs`) échoue si un composant de
  `src/components` n'a ni démo ni exemple de section (hors bloc emballé), si une démo n'a plus de
  composant, si une exclusion ne vise plus rien, si un nom de fiche sort de la règle ci-dessus, si un
  `wraps` est faux (ci-dessus) ; le build (hors
  production) échoue si une fiche n'a pas de nom, si un exemple ne passe pas son schéma, si une section
  du registre n'a pas de `.schema.ts`, si un identifiant est en double ou vaut `fondations`. Exclusions
  (composants sans rendu propre) : liste COURTE dans le script, une raison par ligne ; l'outillage de la
  bibliothèque (`src/components/styleguide/`) est hors contrôle.
- **Fondations** (lues au build, rien à écrire dans les pages), une rubrique par page : tokens des
  blocs `@theme` de `src/styles/global.css` ; « Styles partagés » = ses `@utility` annotés (format et
  règle : styling-tailwind.md), avec aperçu, règle appliquée et fichiers qui posent chaque style ;
  « Illustrations » = `src/assets/illustrations/*.{webp,png,jpg,jpeg,svg}`, le nom de fichier sans
  extension étant le nom à citer à Claude. Ces deux rubriques sont FACULTATIVES : absentes du menu tant
  que le site n'a ni `@utility` annoté ni ce dossier (cas du modèle).
- **Avant tout markup ou composant** (développement, `modifier-design`, `creer-page`, design-craft,
  portage d'une section du kit) : chercher dans la bibliothèque PAR LE CONCEPT (« témoignage »,
  « chiffres »), puis citer dans le plan ou le rayon d'impact, item Doublons, le composant réutilisé
  ou étendu par sa fiche `/styleguide/<id>/`, ou ce qui casse sans le nouveau. Contrôle en review.
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
- **Amélioration continue** : un composant modifié (prop, variante, rendu, usage) voit sa démo (cas et
  libellés) et son nom mis à jour dans le même commit ; deux composants qui font la même chose = brief
  `.claude/templates/fusion-a-trancher.md` reporté ici (§ Doublons), jamais un troisième ; une page
  (`src/pages/`, corps MDX) qui recopie le markup d'un composant existant = violation (contrôles A et
  B ; ce qu'ils ne voient pas, moins de 4 classes ou corps MDX, se cite en review).
- **Côté éditeurs** : un bloc se désigne par son nom dans la bibliothèque, avec le lien de sa fiche
  `<TEST>/styleguide/<id>/` (CLAUDE.md § Projet) ; Claude dit lui-même si l'éditeur peut l'ajouter seul
  (section ajoutable dans `sections:` d'une page) ou si c'est du développement ; jamais un bloc inventé
  ni un bricolage dans la page. Besoin non couvert = développement : un nouveau composant, qui entre
  dans la bibliothèque.

## Normes transverses
- Préférer UN composant à variantes à N composants quasi identiques. Quand une famille grandit, marquer son CANONIQUE ici (« Canonique hero », « Canonique CTA »…) ; les composants gardés séparés portent un ⛔ avec la raison en une ligne (sinon chaque review rejoue le débat de fusion).
- Largeur : toute section passe par <Container>. Aucune surcharge de largeur en px ; exceptions de LECTURE (prose) listées ici, et la bibliothèque /styleguide (pleine largeur à gouttières relatives : l'aperçu ordinateur de 1280 px y est réduit à la colonne, qui doit rester large).
- Styles partagés : `@utility` annotés de global.css (styling-tailwind.md), montrés en Fondations de la bibliothèque. Aucun dans le modèle ; un site dérivé en tient la liste ici (classe : rôle).
- Surface de carte : Card.astro. Un wrapper ne pose pas une surface que son slot porte déjà (anti double-carte).
- Squelette d'accordéon : Accordion.astro. Une section qui a besoin d'un `<details>` le consomme (comme Faq.astro) au lieu de réécrire summary + marqueur + bascule.
- Pastilles, coches et étiquettes : passent par LEUR composant, jamais par du markup écrit à la main dans un bloc ou une page. Modèle : étiquette en pilule = Badge ; un site dérivé ajoute ses canoniques (pastille de pictogramme, pastille d'état ou coche de confirmation, pastille de lecture…) et les liste ici. Une taille, un ton ou un contenu manquant = variante additive du composant (prop typée, call-sites inchangés, cas ajouté à sa démo), jamais une copie à côté. Hors règle : indicateurs internes d'un composant canonique (chevron d'Accordion), contrôles (bouton rond, interrupteur, case à cocher). Contrôle : machine A du lint (même groupe de 4 classes ou plus dans deux fichiers) comme filet ; une copie unique ou de moins de 4 classes se cite en review (code-review.md).
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
| Accordion.astro | summary, name?, open?, variant(boxed/plain)?, class? | **Canonique accordéon** : `<details>/<summary>` + slot, chevron Icon en bascule CSS, reduced-motion, focus visible. `name` partagé = exclusivité native. `open` = ouvert au chargement (contenu visible sans script). `variant="plain"` = sans cadre ni marge intérieure, pour une liste de volets serrés (familles du menu de /styleguide) ; défaut `boxed` inchangé. **Cible tactile garantie** : `min-h-11` (44px) + `items-center` sur le `<summary>`, donc au plancher craft-floor même sur un libellé d'une seule ligne. Ne PAS réécrire ce markup dans une section |
| Badge.astro | tone(accent/neutral/inverse)?, class? | **Canonique étiquette** en pilule (sur-titre court, étiquette de section, statut). Slot libre. Ton ou taille manquant = variante additive, jamais une pilule écrite à la main (§ Normes transverses) |
| Icon.astro | name, size?, label?, class? | Icône inlinée du jeu FERMÉ `./icons.ts` (sous-ensemble Lucide, ISC). `label` = porteuse de sens, sinon `aria-hidden`. Jamais d'emoji ni de police d'icônes |
| icons.ts | — | Table des tracés + `IconName` + `ICON_NAMES`. Séparée du .astro : les `export` du frontmatter Astro sont hissés au-dessus du corps et ne peuvent pas dériver d'une const locale |
| Faq.astro | title?, items[] | Titre + paires q/a, rendues par Accordion (aucun markup `<details>` propre) |
| GlobalFaq.astro | title? | FAQ globale partagée (SITE.faq, éditée dans site.json) |
| ContactForm.astro | idPrefix?, tone(default/inverse)?, submitLabel? | Formulaire contact statique vanilla (0 framework) vers PUBLIC_FORM_ENDPOINT. `idPrefix` (défaut `contact`) préfixe id/for : deux formulaires sur une page ne dupliquent pas `id="name"`. Les champs posent leur couleur de texte (`text-fg` / `placeholder:text-muted`) : englobé dans une bande `text-inverse-fg`, le formulaire reste lisible sans surcharge au call-site. `tone` = surface qui porte le formulaire, et n'agit QUE sur les messages d'état (seule couleur qui dépende du fond : aucune valeur ne tient 4,5:1 sur `bg` et sur `inverse`) — champs, libellés et Button sont déjà corrects sur les deux surfaces. `submitLabel` (défaut `Envoyer`) = libellé du bouton d'envoi ; le `<script>` ne le redit pas, il LIT le libellé de repos sur le bouton avant de poser « Envoi… » et le restitue — sans quoi tout formulaire à libellé propre repasserait à « Envoyer » après le premier envoi |

## Outillage de la bibliothèque (src/components/styleguide/)
| Composant | Props | Rôle |
| --- | --- | --- |
| DemoCase.astro | label, surface(default/inverse)?, bleed? | Un cas d'une démo : libellé (la différence du cas : « sur fond sombre », « avec pictos ») + rendu, avec la marge latérale de la page isolée ; `inverse` pose la bande sombre (fond ET texte) ; `bleed` = rendu bord à bord, libellé aligné sur le Container (bloc qui pose sa Section/Container, et chaque cas de section). Utilisé par les `*.demo.astro` et `/styleguide/<id>/apercu/` seulement |
| GalleryShell.astro | title, current? | Mise en page des pages de la bibliothèque : sans en-tête ni pied de page du site, menu à gauche (familles repliables, page courante marquée, recherche), filet sur toute la hauteur, une fiche à droite |
| GalleryPager.astro | current | Fiche précédente / suivante dans l'ordre du menu, et lien « Menu » sur téléphone |

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
| styleguide/[...galerie].astro, styleguide/[id]/index.astro, styleguide/[id]/apercu.astro, styleguide/fondations/[rubrique].astro | accueil, fiche (nom, aperçu, bascule ordinateur/téléphone, « Utilisé sur »), rendu seul, rubrique de Fondations | pages outil (hors production) : leur markup ne sert nulle part ailleurs |

## Doublons & consolidation (roadmap)
Dette de duplication tracée ici : datée, priorisée valeur/risque, avec fait / reste à faire.
Fusion : jamais en aveugle — inspecter la divergence réelle avant (gabarit
.claude/templates/fusion-a-trancher.md), puis décision datée avec sa raison.
- 2026-10-21, fait : haut de page de la home et des landings → PageHero ; encadré « En bref » des pages et articles → Tldr (rendu identique au pixel, 4 pages × 2 largeurs).
- Règle : deux composants qui ne diffèrent que par un élément ou une valeur = UN composant à variante (§ Bibliothèque vivante, « Variante plutôt que composant voisin ») ; les candidats se signalent ici, la fusion attend l'arbitrage.
- 2026-10-21, signalé (aucune fusion) : `offer.features-grid` déclare `icon` dans son schéma sans le rendre (donnée dormante). Le jour où le picto est rendu, c'est une variante de cette section (cas « avec pictos » / « sans pictos »), jamais une section voisine. Examinés, pas candidats : Questions dépliables (`ui/Faq`), Questions dépliables communes (`ui/GlobalFaq`, même rendu, questions lues dans site.json) et Colonne de questions dépliables (`content.faq-accordion`, Faq posée dans une section) : le second et le troisième RÉUTILISENT le premier, ils ne le recopient pas.
- 2026-10-21, à trancher : carte d'article de `index.astro` (Card cliquable, h3, description) et de `blog/index.astro` (même carte + date, h2). Candidat ArticleCard : brief fusion-a-trancher à remplir avant toute fusion (le contrôle A ne la voit pas : moins de 4 classes par attribut).
