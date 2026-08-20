# Component registry

Vérifier ICI + la galerie **/styleguide** (src/pages/styleguide.astro, noindex) AVANT de créer un
composant OU d'écrire du markup de section. Tout nouveau composant/variante → l'ajouter ici ET à
/styleguide dans le même commit.

## Normes transverses
- Préférer UN composant à variantes à N composants quasi identiques. Quand une famille grandit, marquer son CANONIQUE ici (« Canonique hero », « Canonique CTA »…) ; les composants gardés séparés portent un ⛔ avec la raison en une ligne (sinon chaque review rejoue le débat de fusion).
- Largeur : toute section passe par <Container>. Aucune surcharge de largeur en px ; exceptions de LECTURE (prose) listées ici.
- Surface de carte : Card.astro. Un wrapper ne pose pas une surface que son slot porte déjà (anti double-carte).
- Ne pas créer de composant sans usage. Une donnée déclarée (settings, schéma) mais rendue par aucun composant est annotée « dormante » ici, pas présentée comme branchée.

## UI (src/components/ui/)
| Composant | Props | Rôle |
| --- | --- | --- |
| Container.astro | class?, prose? | Largeur max + padding (prose = colonne de lecture) |
| Section.astro | class? | Espacement vertical de section |
| Button.astro | href?, variant(primary/outline)?, type(button/submit)?, class? | Bouton/lien (type pour usage formulaire) |
| Card.astro | class? | Carte surface + bordure |
| Header.astro | — | Nav principale (depuis SITE.nav) |
| Footer.astro | — | Pied de page |
| Faq.astro | title?, items[] | Accordéon natif <details> (0 JS), crawlable |
| GlobalFaq.astro | title? | FAQ globale partagée (SITE.faq, éditée dans site.json) |
| ContactForm.astro | — | Formulaire contact statique vanilla (0 framework) vers PUBLIC_FORM_ENDPOINT |

## SEO (src/components/seo/)
| Composant | Rôle |
| --- | --- |
| BaseHead.astro | Balises meta/OG/Twitter/canonical |
| JsonLd.astro | JSON-LD @graph selon le type de page |

## Landing (src/components/landing/)
| Composant | Rôle |
| --- | --- |
| SectionRenderer.astro | Mappe sections[].type (features/proof/faq/cta) -> rendu |

## Islands (src/components/islands/)
SolidJS = starter opt-in, non installé par défaut. Créer un îlot ici UNIQUEMENT après avoir
installé @astrojs/solid-js et seulement si le natif (<details>, <script>) ne suffit pas.

## Layouts (src/layouts/)
| Layout | Rôle |
| --- | --- |
| BaseLayout.astro | Head SEO + JSON-LD + Header/Footer. Utilisé par TOUTES les pages. |

## Pages bespoke (markup inline déclaré)
Chaque bloc resté en markup inline (hors composant) est listé ici avec sa raison en une ligne.
Un bloc inline non listé est réputé duplication à corriger.
| Page | Bloc | Raison |
| --- | --- | --- |
| index.astro | hero + grille d'articles | design unique de la home (règle DRY : bespoke réservé à l'unique) |

## Doublons & consolidation (roadmap)
Dette de duplication tracée ici : datée, priorisée valeur/risque, avec fait / reste à faire.
Fusion : jamais en aveugle — inspecter la divergence réelle avant (gabarit
.tiple/templates/fusion-a-trancher.md), puis décision datée avec sa raison.
_(vide au bootstrap)_
