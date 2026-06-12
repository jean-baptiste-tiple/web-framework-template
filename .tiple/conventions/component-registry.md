# Component registry

Vérifier ICI avant de créer un composant. Réutiliser si existant.

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
