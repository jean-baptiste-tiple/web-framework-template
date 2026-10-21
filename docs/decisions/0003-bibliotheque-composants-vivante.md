# ADR 0003 — Bibliothèque des composants vivante, absente de la production

## Statut
Accepté le 2026-10-21 (Demande JB). Remplace la galerie écrite à la main (`src/pages/styleguide.astro`) et la règle « tout nouveau composant s'ajoute à /styleguide dans le même commit ».

## Contexte
La galerie /styleguide recopiait ses exemples dans la page, ajoutait chaque composant à la main et recopiait la liste des tokens. Les oublis passaient sans bruit : sur un site dérivé, 23 composants sur 69 n'y figuraient pas. Elle n'avait ni navigation ni aperçu téléphone, était visible sur le site public, et ne servait qu'au développeur alors que des éditeurs novices choisissent des blocs en parlant à Claude.

## Décision
- **Démo colocalisée** : chaque composant a sa démo à côté de lui. Composant : `<Nom>.demo.astro` (rendu des variantes + `export const demo: DemoDoc`). Section : `export const demo` (fiche + `example` typé par `SectionDemo<…>`) dans son `.schema.ts`. Fiche éditeur : nom français, à quoi ça sert, phrase à dire à Claude ; « seul ou développeur » est déduit (section ajoutable = seul, chrome = textes seuls, reste = développeur).
- **Découverte au build** (`src/lib/styleguide.ts`) : démos par `import.meta.glob`, tokens lus dans les blocs `@theme` de `src/styles/global.css`, props lues dans `interface Props`, champs dans le schéma Zod, « pages qui l'utilisent » par le graphe des imports de `src/` et le frontmatter `sections:` des collections. La page ne liste rien.
- **Routes** : `/styleguide/` (`src/pages/styleguide/[...galerie].astro`) et une page isolée par composant `/styleguide/<id>/` (`[id].astro`, `BaseLayout chrome={false}`), affichée dans une iframe à 1280 px (réduite à la colonne) ou 390 px : les vrais points de rupture s'appliquent. Routes dynamiques dont `getStaticPaths` rend `[]` quand `VERCEL_ENV=production` : absentes du build de production, présentes sur TEST, les aperçus et en local. noindex, hors sitemap et llms.txt. Slug `styleguide` réservé par `[...slug].astro`.
- **Contrôles** : `scripts/check-styleguide.mjs` au lint (composant sans démo, démo orpheline, exclusion périmée ; markup recopié : même groupe de 4 classes ou plus, dont une visuelle, dans deux fichiers ; page de `src/pages/` qui compose ses sections sans être déclarée au registre) ; build hors production (fiche incomplète, exemple refusé par le schéma, section du registre sans schéma). Exclusions : liste courte et commentée dans le script.
- **Règles d'usage** : consulter la bibliothèque et citer le composant réutilisé avant tout markup (CLAUDE.md règle absolue 6, component-registry.md § Bibliothèque vivante, code-review.md) ; les skills d'intention proposent les blocs par leur nom français et le lien de la bibliothèque du site de test.

## Options écartées
- Métadonnées dans un `.demo.ts` voisin : deux fichiers par composant. Astro 5 expose les `export const` d'un `.astro` à `import.meta.glob` (vérifié au build) ; seule contrainte, l'annotation de type au lieu de `satisfies` (coding-standards).
- Exemples de section dans le registre `src/lib/sections.ts` (garantie à `astro check`) : une ligne d'import de plus par section et pas de chemin de fichier pour la vue technique ; la garantie passe au lint et au build.
- Aperçu par conteneur redimensionné dans la page (sans iframe) : les classes `sm:`/`lg:` suivent la fenêtre, pas le conteneur ; l'aperçu téléphone serait faux.
- Galerie construite partout puis supprimée de `dist` en production par une intégration : la page existerait quand même au build, et un post-traitement de `dist` est une source d'écart de plus.
- Page statique `styleguide.astro` protégée par mot de passe : pas de serveur (règle absolue 1).

## Conséquences
- Un site dérivé qui tire ce changement : son `src/pages/styleguide.astro` entre en conflit (supprimé ici) et doit être retiré, sinon deux routes produisent `/styleguide/` ; `pnpm run lint` échoue tant que chaque composant n'a pas sa démo (toutes portées, pas d'exclusion « à porter » : décision JB), que ses pages qui composent leurs sections ne sont pas déclarées et que ses groupes de classes recopiés ne sont pas résolus (mode d'emploi : changelog du 2026-10-21) ; une route racine dynamique propre au site (`[fonctionnalite].astro`…) réserve aussi `styleguide`.
- Le build de TEST construit une page de plus par composant (quelques secondes) ; la production n'en construit aucune.
- `BaseLayout` gagne la prop `chrome` (défaut `true`, appelants inchangés).
