---
name: modifier-design
description: Changer l'apparence d'une page - ajouter, déplacer ou retirer un bloc, changer une couleur, un espacement, une taille de texte, refaire une section, corriger l'affichage sur mobile. À déclencher quand l'utilisateur dit « c'est moche », « ajoute un bloc témoignages / logos », « déplace cette section », « change la couleur de… », « ça rend mal sur téléphone », « refais le haut de la page ».
---

# Modifier le design

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

## Traduire la demande
1. Faire préciser en mots simples : quelle page, quel bloc (capture bienvenue), quel problème ressenti (« trop chargé », « on ne voit pas le bouton »), quel résultat attendu.
2. Reformuler en brief : page, bloc, changement, critère de réussite visible (« le bouton se voit sans défiler sur téléphone »). Le faire valider.
3. Ajout d'un bloc : proposer les blocs DE LA BIBLIOTHÈQUE par leur nom, avec le lien de leur fiche (`<site de test>/styleguide/<id>/`, CLAUDE.md § Projet), et dire soi-même si l'éditeur peut l'ajouter seul (section ajoutable dans `sections:` de la page) ou si c'est du développement ; jamais un bloc inventé. Aucun ne convient : le dire, c'est un nouveau composant (développement), qui rejoindra la bibliothèque ; jamais un bricolage dans la page (component-registry.md § Bibliothèque vivante).
4. Classer :
   - **Réagencer des blocs existants d'une page à sections** (ordre, ajout, retrait d'une section de la bibliothèque, famille « Sections ») → éditer `sections:` de son `.mdx` ou `.md`, champs d'un `example` du bloc (`demo.examples` de son `.schema.ts`) comme modèle.
   - **Tout le reste** (couleur, espacement, bloc nouveau, page sur mesure) → travail de code : CLAUDE.md § Modes de travail > Développement.

## Faire (travail de code)
1. Charger `design-craft`, puis `component-registry` : chercher dans la bibliothèque, réutiliser ou étendre un composant existant et le citer dans le plan, ou écrire ce qui casse sans le nouveau (CLAUDE.md règle absolue 6) ; composant créé ou modifié = sa démo et sa fiche dans le même envoi ; couleurs et espacements par les tokens de `src/styles/global.css` (`styling-tailwind`).
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
