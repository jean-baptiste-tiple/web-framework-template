---
name: annuler-modification
description: Revenir en arrière sur une modification - avant envoi (abandonner des changements en cours), sur l'aperçu d'une branche, sur TEST ou en production (remettre le site dans son état précédent) - sans perdre autre chose que ce qui est visé. À déclencher quand l'utilisateur dit « annule », « reviens en arrière », « j'ai cassé quelque chose », « remets comme avant », « le site affiche une erreur depuis ma modif ».
---

# Annuler une modification

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

Invariants : `.claude/conventions/deploy.md` § Circuit branches → TEST → production.

## Situer la modification
Identifier précisément ce qui doit être défait (quelle page, quel changement), avec `git status`, `git log --oneline -10` et `git diff`, traduits en clair, puis la situer comme `statut-mise-en-ligne` § Situer : pas encore enregistrée, enregistrée pas envoyée, sur l'aperçu d'une branche, sur TEST, en production.

## Pas encore enregistrée
1. Dire ce qui serait perdu, fichier par fichier, en clair.
2. Confirmation explicite (`AskUserQuestion`) : la perte est définitive.
3. `git restore <fichiers visés>` seulement. Jamais `git restore .`, `git checkout .`, `git reset --hard` ni `git clean` : ils effacent aussi le travail d'autres sessions.

## Enregistrée, ailleurs qu'en production
Défaire = un nouveau commit (`git revert --no-edit <commit>`), jamais une réécriture. Annuler une partie seulement : `git restore --source=<commit>~1 <fichier>` pour les seuls fichiers visés, puis envoyer.
- **Pas envoyée, ou sur l'aperçu seulement** : le défaire sur la branche, puis `branches` § 5. Tout le sujet : `branches` § 7 (abandonner).
- **Sur TEST, pas en production** : tout le sujet → `envoyer-sur-test` § 5 (retirer de TEST) ; une partie d'une modification directe → la corriger directement sur TEST (`branches` § 3) ; une partie d'un sujet de branche → la défaire sur la branche, puis la renvoyer sur TEST.

## En production
1. Récap en clair + `AskUserQuestion` (le site public change).
2. La défaire sur TEST comme ci-dessus, puis remettre en ligne (`publier`). Tout ce qui est sur TEST repartirait avec.
3. TEST contient d'autres sujets pas prêts, ou urgence : retour immédiat à la mise en ligne précédente, `publier` § 3 avec `inputs[ref]=<tag mise-en-ligne-… précédent>` (`git tag --list "mise-en-ligne-*" --sort=-creatordate`), puis la défaire quand même sur TEST, sinon elle repartirait à la prochaine mise en ligne.

## Garde-fous
- Jamais `push --force`, jamais de réécriture d'un historique envoyé, jamais de tag posé à la main.
- Doute sur ce qui serait perdu : ne rien faire, expliquer, demander.

## Rendre compte
« C'est annulé sur <lieu> : <changement> est revenu à l'état du <date>. » Puis la ligne d'état (`branches` § Rendre compte).
