---
name: envoyer-sur-test
description: "Envoyer une branche sur TEST (la version que le client relit, qui partira telle quelle en production), ou en retirer un sujet - récapitulatif en clair, oui explicite, fusion, contrôle de TEST. À déclencher quand l'utilisateur dit « envoie sur TEST », « mets ça sur TEST », « c'est prêt pour la relecture », « fais valider », « retire … de TEST ». Passer TEST en production : publier."
---

# Envoyer sur TEST

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

Circuit : CLAUDE.md § Circuit de publication. Invariants git : `.claude/conventions/deploy.md` § Circuit branches → TEST → production ; adresses : CLAUDE.md § Projet. Tout ce qui est sur TEST partira ensemble à la prochaine mise en ligne : le rappeler dans chaque récapitulatif.

## 1. Préparer
1. `branches` § 1 ; les changements de la demande sont envoyés sur l'aperçu (`branches` § 5).
2. Aperçu construit sur le dernier envoi (contrôlé en `branches` § 5) : cette construction complète est le contrôle avant TEST ; sans elle, rien ne part.
3. Déjà sur TEST sans rien de nouveau (`git merge-base --is-ancestor origin/<branche> origin/main`) : le dire, s'arrêter.

## 2. Récapituler, obtenir un oui
1. Changements visibles de la branche (`git log --format=%s origin/main..origin/<branche>`, `git diff --stat origin/main...origin/<branche>`), traduits en pages, sans nom de fichier.
2. Sujets déjà sur TEST qui partiront avec (`git log --first-parent --format=%s production..origin/main`).
3. `AskUserQuestion` : « Envoyer <sujet> sur le site de test ? ».

## 3. Fusionner dans TEST
Dans un worktree temporaire : la copie de l'éditeur ne change pas de branche. Toujours `git -C <worktree>`, jamais `cd` dedans (sous Windows, un terminal placé dedans empêche de le retirer : « Permission denied », alors `git worktree prune` et suppression du dossier). Une commande par appel, résultat lu avant la suivante : jamais de chaîne `| tail` ou `&&` qui laisserait partir un envoi après une fusion en conflit.
1. `git worktree add --detach .claude/worktrees/envoi-test origin/main`.
2. Sujet retiré de TEST auparavant (`Revert "TEST : <sujet>"` dans `git log --format=%s origin/main`) : `git -C .claude/worktrees/envoi-test revert --no-edit <ce commit>` d'abord, sinon ses changements ne reviendraient pas.
3. `git -C .claude/worktrees/envoi-test merge --no-ff origin/<branche> -m "TEST : <sujet en clair>"`.
   Conflit (même passage changé sur TEST et sur la branche) : texte de contenu dont les deux versions se combinent sans ambiguïté → les combiner et le dire ; sinon `AskUserQuestion` avec les deux versions en clair. Fichier de code : `merge --abort`, s'arrêter, proposer de prévenir le développeur du site.
4. `git -C .claude/worktrees/envoi-test push origin HEAD:main`, puis `git worktree remove .claude/worktrees/envoi-test`.

## 4. Contrôler TEST
Adresse TEST + chemin de la page, contrôlée comme en `branches` § 5.3. Prêt : « Visible sur le site de test : <adresse>. On peut relire ; pour le site public, dites « mets en ligne ». » Construction en échec : retirer le sujet (§ 5) pour rendre TEST sain, corriger sur la branche, renvoyer.

## 5. Retirer un sujet de TEST
1. Trouver ce qui l'a apporté : `git log --first-parent --format="%h %s" production..origin/main` : une fusion « TEST : <sujet> » (branche) ou un ou plusieurs commits simples (modification directe sur TEST). Déjà en production : `annuler-modification`.
2. Récap + `AskUserQuestion` : un sujet de branche reste sur sa branche et pourra revenir ; une modification directe est défaite (à refaire plus tard si besoin).
3. Worktree temporaire sur `origin/main` (§ 3.1), `git -C … revert -m 1 --no-edit <fusion>` ou `git -C … revert --no-edit <commit>` pour chaque commit simple, `push origin HEAD:main`, retrait du worktree, contrôle de TEST (§ 4).

## Garde-fous
- Jamais de fusion de `main` dans une branche de sujet (elle emporterait les sujets des autres sur sa branche).
- Jamais `push --force` sur `main`.

## Rendre compte
« <Sujet> est visible sur le site de test : <adresse>. » Puis la ligne d'état (`branches` § Rendre compte).
