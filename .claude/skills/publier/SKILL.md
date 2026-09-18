---
name: publier
description: Mettre en ligne des modifications déjà faites dans le site - récapitulatif en clair de ce qui va changer sur le site public, confirmation explicite, contrôle qualité, puis envoi. À déclencher quand l'utilisateur dit « mets en ligne », « publie tout ça », « envoie », « c'est bon, on peut pousser », « déploie ». Texte ou document pas encore intégré au site (« publie cet article ») : integrer-article d'abord. Pour savoir si c'est déjà en ligne : statut-mise-en-ligne.
---

# Publier (mettre en ligne)

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

Une seule branche, `main`, synchronisée avec le site public : envoyer = mettre en ligne pour tout le monde, en quelques minutes (`.claude/conventions/deploy.md`).

## 1. Récapituler ce qui part
1. `git status`, `git diff --stat` et `git log origin/main..HEAD` : fichiers modifiés et commits pas encore envoyés.
2. Les traduire en changements visibles : « page X : titre modifié », « tout le site : lien ajouté au menu ». Aucun nom de fichier dans le récap destiné à l'utilisateur.
3. Fichiers modifiés qui ne viennent pas de la demande en cours (travail d'une autre session ou d'un autre éditeur) : les nommer et demander s'ils partent aussi ; par défaut, ils restent.
4. Fichier de contenu modifié dont `updatedDate` n'a pas bougé (CLAUDE.md § Règles contenu / SEO / GEO, règle 2) : le signaler, proposer la date du jour.

## 2. Obtenir un oui explicite
`AskUserQuestion` : « Mettre en ligne maintenant : <récap> ? ». Un accord vague, ancien ou donné pour une autre modification ne compte pas ; dans le doute, redemander.

## 3. Contrôler puis envoyer
Dérouler `/commit-push` (`.claude/commands/commit-push.md`) : lint et build d'abord, rien ne part à la première erreur ; n'ajouter que les fichiers validés au point 1 ; message de commit en français qui dit le changement visible (pour une édition de contenu, ce message est la seule trace : pas d'entrée au changelog, étape 3).

## 4. Confirmer
Suivre la mise en ligne avec `statut-mise-en-ligne` ; annoncer « En ligne : <adresse publique de la page> » seulement quand c'est vérifié.

## Garde-fous
- Jamais de publication glissée en fin d'une autre tâche, jamais sans récap ; jamais `--no-verify`, jamais `push --force`.
- Build en échec : l'expliquer en clair (`verifier`), corriger, reprendre au point 1.
