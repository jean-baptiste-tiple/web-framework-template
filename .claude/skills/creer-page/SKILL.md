---
name: creer-page
description: Ajouter une nouvelle page au site - page d'information ou légale, landing de présentation d'un service, ou nouvelle fiche dans une série qui existe déjà (un produit, un membre de l'équipe ou du réseau). À déclencher quand l'utilisateur dit « ajoute une page… », « crée une landing pour… », « il nous faut une page… », « ajoute un nouveau <produit / membre / expert> ». Pour un article de blog : integrer-article ; un site peut avoir un skill dédié à une série (voir `projet.md`).
---

# Créer une page

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

## Traduire la demande : quel type de page ?
Si ce n'est pas évident, poser la question en mots simples (`AskUserQuestion`) :
1. **Une fiche de plus dans une série existante** (même forme que d'autres pages) → un `.md` dans la collection existante (`src/content/<collection>/`), jamais une page sur mesure (CLAUDE.md règle absolue 9).
2. **Une page de présentation à blocs** (accroche, avantages, questions, appel à l'action) → `src/content/landings/<slug>.mdx`, blocs pris dans le registre `src/lib/sections.ts` (galerie `/styleguide`).
3. **Une page de texte** (à propos, mentions, FAQ) → `src/content/pages/<slug>.md`.
Forme qu'aucun des trois ne couvre → `modifier-design` (c'est du développement).

## Faire
1. Slug : kebab-case, court ; absent de `src/content/pages/`, de `src/content/landings/` et des routes de `src/pages/` (collision = build cassé).
2. Frontmatter conforme au schéma de la collection (`src/content.config.ts`) : champs requis remplis, aucun champ inventé.
3. Textes : ceux de l'utilisateur. Manquants → les demander, ou proposer un brouillon présenté comme tel ; jamais de fait inventé.
4. Menu : proposer d'ajouter la page à `nav` (`editer-global`), sans le faire d'office.

## Garde-fous
- Blocs existants seulement (CLAUDE.md règle absolue 6) : aucun composant créé ici.
- title ≤ 60 car., description 140-160, `tldr` rempli (CLAUDE.md § Règles contenu / SEO / GEO).

## Rendre compte
« La page <titre> est prête à l'adresse <URL> ; elle <figure / ne figure pas> dans le menu. » Puis `verifier` et `publier`.

## Hors périmètre
Nouvelle série de pages (nouvelle collection), page au design unique, formulaire : c'est du développement (`comprendre-demande` § Hors périmètre).
