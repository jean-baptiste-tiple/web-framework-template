# Component registry

Vérifier ICI + la galerie **/styleguide** (src/pages/styleguide.astro, noindex) AVANT de créer un
composant OU d'écrire du markup de section. Tout nouveau composant/variante → l'ajouter ici ET à
/styleguide dans le même commit.

## Normes transverses
- Préférer UN composant à variantes à N composants quasi identiques. Quand une famille grandit, marquer son CANONIQUE ici (« Canonique hero », « Canonique CTA »…) ; les composants gardés séparés portent un ⛔ avec la raison en une ligne (sinon chaque review rejoue le débat de fusion).
- Largeur : toute section passe par <Container>. Aucune surcharge de largeur en px ; exceptions de LECTURE (prose) listées ici.
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
| Accordion.astro | summary, name?, class? | **Canonique accordéon** : `<details>/<summary>` + slot, chevron Icon en bascule CSS, reduced-motion, focus visible. `name` partagé = exclusivité native. **Cible tactile garantie** : `min-h-11` (44px) + `items-center` sur le `<summary>`, donc au plancher craft-floor même sur un libellé d'une seule ligne. Ne PAS réécrire ce markup dans une section |
| Badge.astro | tone(accent/neutral/inverse)?, class? | Pilule de kicker (sur-titre court, étiquette de section). Slot libre |
| Icon.astro | name, size?, label?, class? | Icône inlinée du jeu FERMÉ `./icons.ts` (sous-ensemble Lucide, ISC). `label` = porteuse de sens, sinon `aria-hidden`. Jamais d'emoji ni de police d'icônes |
| icons.ts | — | Table des tracés + `IconName` + `ICON_NAMES`. Séparée du .astro : les `export` du frontmatter Astro sont hissés au-dessus du corps et ne peuvent pas dériver d'une const locale |
| Faq.astro | title?, items[] | Titre + paires q/a, rendues par Accordion (aucun markup `<details>` propre) |
| GlobalFaq.astro | title? | FAQ globale partagée (SITE.faq, éditée dans site.json) |
| ContactForm.astro | idPrefix?, tone(default/inverse)?, submitLabel? | Formulaire contact statique vanilla (0 framework) vers PUBLIC_FORM_ENDPOINT. `idPrefix` (défaut `contact`) préfixe id/for : deux formulaires sur une page ne dupliquent pas `id="name"`. Les champs posent leur couleur de texte (`text-fg` / `placeholder:text-muted`) : englobé dans une bande `text-inverse-fg`, le formulaire reste lisible sans surcharge au call-site. `tone` = surface qui porte le formulaire, et n'agit QUE sur les messages d'état (seule couleur qui dépende du fond : aucune valeur ne tient 4,5:1 sur `bg` et sur `inverse`) — champs, libellés et Button sont déjà corrects sur les deux surfaces. `submitLabel` (défaut `Envoyer`) = libellé du bouton d'envoi ; le `<script>` ne le redit pas, il LIT le libellé de repos sur le bouton avant de poser « Envoi… » et le restitue — sans quoi tout formulaire à libellé propre repasserait à « Envoyer » après le premier envoi |

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
discriminée `sections` (landings ET pages), SectionRenderer y lit le composant, /styleguide en rend
un exemple par variante (le `Record<SectionType, …>` de la galerie casse `astro check` si l'exemple
manque). Props : un seul prop `section`, typé depuis le schéma.

**Chrome (`chrome: true` au registre)** : header, footer et barre d'annonce sont des variantes de
section comme les autres (schéma + prop `section` + exemple en galerie), mais rendues UNE fois par
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
Un bloc inline non listé est réputé duplication à corriger.
| Page | Bloc | Raison |
| --- | --- | --- |
| index.astro | hero + grille d'articles | design unique de la home (règle DRY : bespoke réservé à l'unique) |

## Doublons & consolidation (roadmap)
Dette de duplication tracée ici : datée, priorisée valeur/risque, avec fait / reste à faire.
Fusion : jamais en aveugle — inspecter la divergence réelle avant (gabarit
.claude/templates/fusion-a-trancher.md), puis décision datée avec sa raison.
_(vide au bootstrap)_
