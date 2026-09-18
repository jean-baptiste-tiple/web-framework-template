---
name: modifier-design
description: Changer l'apparence d'une page - ajouter, déplacer ou retirer un bloc, changer une couleur, un espacement, une taille de texte, refaire une section, corriger l'affichage sur mobile. À déclencher quand l'utilisateur dit « c'est moche », « ajoute un bloc témoignages / logos », « déplace cette section », « change la couleur de… », « ça rend mal sur téléphone », « refais le haut de la page ».
---

# Modifier le design

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

## Traduire la demande
1. Faire préciser en mots simples : quelle page, quel bloc (capture bienvenue), quel problème ressenti (« trop chargé », « on ne voit pas le bouton »), quel résultat attendu.
2. Reformuler en brief : page, bloc, changement, critère de réussite visible (« le bouton se voit sans défiler sur téléphone »). Le faire valider.
3. Classer :
   - **Réagencer des blocs existants d'une landing** (ordre, ajout, retrait) → éditer `sections:` de son `.mdx`, blocs pris dans `src/lib/sections.ts`.
   - **Tout le reste** (couleur, espacement, bloc nouveau, page sur mesure) → travail de code : CLAUDE.md § Modes de travail > Développement.

## Faire (travail de code)
1. Charger `design-craft`, puis `component-registry` : réutiliser ou étendre un composant existant (CLAUDE.md règle absolue 6) ; couleurs et espacements par les tokens de `src/styles/global.css` (`styling-tailwind`).
2. Au-delà d'un ou deux fichiers : rayon d'impact écrit avant de coder (CLAUDE.md § Avant de coder).
3. Goût à interpréter (« plus moderne », « plus pro ») : proposer 2 options concrètes via `AskUserQuestion`, ne pas deviner.

## Garde-fous
- Texte éditorial jamais en dur dans un composant (CLAUDE.md règle absolue 3).
- Aucun JavaScript ajouté pour un effet visuel (règle absolue 2).
- Un modèle de section ou un conseil de design qui heurte une règle du site (CLAUDE.md § Projet) ne s'applique pas ; écart en jeu : `comprendre-demande` § Demande contraire à une règle.

## Rendre compte
Capture avant / après, sur ordinateur ET sur téléphone (`verifier`), et une phrase sur ce qui a changé. Puis `publier` sur accord.

## Hors périmètre
Refonte complète, nouvelle identité visuelle : cadrage d'abord (CLAUDE.md § Modes de travail > Cadrage).
