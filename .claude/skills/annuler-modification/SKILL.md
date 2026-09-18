---
name: annuler-modification
description: Revenir en arrière sur une modification - avant publication (abandonner des changements en cours) ou après (remettre le site dans son état précédent) - sans perdre autre chose que ce qui est visé. À déclencher quand l'utilisateur dit « annule », « reviens en arrière », « j'ai cassé quelque chose », « remets comme avant », « le site affiche une erreur depuis ma modif ».
---

# Annuler une modification

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

## Situer la modification
Identifier précisément ce qui doit être défait (quelle page, quel changement), avec `git status`, `git log --oneline -10` et `git diff`, traduits en clair :
- **pas encore enregistrée** : fichier modifié dans `git status` ;
- **enregistrée, pas envoyée** : commit listé par `git log origin/main..HEAD` ;
- **publiée** : commit présent sur `origin/main`, donc en ligne.

## Pas encore enregistrée
1. Dire ce qui serait perdu, fichier par fichier, en clair.
2. Confirmation explicite (`AskUserQuestion`) : la perte est définitive.
3. `git restore <fichiers visés>` seulement. Jamais `git restore .`, `git checkout .`, `git reset --hard` ni `git clean` : ils effacent aussi le travail d'autres sessions.

## Enregistrée ou publiée
1. Trouver le commit fautif ; récapituler son contenu en clair.
2. `git revert <commit>` : un nouveau commit qui défait, sans réécrire l'historique.
3. Annuler une partie seulement : `git restore --source=<commit>~1 <fichier>` pour les seuls fichiers visés.
4. Déjà publiée : remettre en ligne par `publier` (récap + oui explicite).

## Garde-fous
- Jamais `push --force`, jamais de réécriture d'un historique envoyé.
- Doute sur ce qui serait perdu : ne rien faire, expliquer, demander.

## Rendre compte
« C'est annulé : <changement> est revenu à l'état du <date>. » Puis la prochaine étape (rien, ou `publier`).
