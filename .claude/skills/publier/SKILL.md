---
name: publier
description: "Mettre en ligne - passer tout TEST en production, le site public - récapitulatif en clair de ce qui va changer, confirmation explicite, puis lancement de la mise en ligne et contrôle. À déclencher quand l'utilisateur dit « mets en ligne », « publie tout ça », « passe en production », « envoie », « c'est bon, on peut pousser », « déploie ». Envoyer une branche sur TEST : envoyer-sur-test. Texte ou document pas encore intégré au site (« publie cet article ») : integrer-article d'abord. Pour savoir si c'est déjà en ligne : statut-mise-en-ligne."
---

# Publier (mettre TEST en production)

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

Circuit : CLAUDE.md § Circuit de publication. Lieux et invariants : `.claude/conventions/deploy.md` § Circuit branches → TEST → production. TEST est `main` ; la production est le commit marqué par le tag `production`, et seule l'action GitHub « Mise en ligne » (`.github/workflows/production.yml`) la change.

## Ce que vise chaque mot
- « mets en ligne », « passe en production », « publie » : tout TEST part tel quel en production (ce fichier). Les éditeurs y ont droit, sur un oui explicite.
- « envoie sur TEST » : `envoyer-sur-test`. « envoie » sans lieu, sur une branche pas encore sur TEST : `AskUserQuestion`, « sur TEST » (recommandé) ou « seulement sur l'aperçu ».
- Sujet de l'éditeur pas encore sur TEST (pas envoyé, ou sur sa branche seulement) : il ne part pas en production ; le dire, proposer de l'envoyer sur TEST d'abord (`branches` § 5 ou `envoyer-sur-test`).

## 1. Récapituler
1. `git fetch origin --tags --force`. `git log production..origin/main` vide : rien à mettre en ligne, le dire.
2. Sujets qui partent : `git log --first-parent --format="%s (%an)" production..origin/main` (fusions « TEST : … » de branches, et modifications faites directement sur TEST ; un sujet retiré, suivi de son « Revert », ne part pas : ne citer que les sujets restants, avec leur auteur quand ce n'est pas l'éditeur). Changements visibles : `git diff --stat production origin/main`, traduits en pages (« page X : titre modifié », « tout le site : lien ajouté au menu »). Aucun nom de fichier dans le récap destiné à l'utilisateur.
3. TEST construit sur ce dernier état : la page principale du récapitulatif, sur l'adresse TEST (CLAUDE.md § Projet), montre le changement (contrôle de `branches` § 5.3). Sinon, on ne met pas en ligne.
4. Fichier de contenu dont `updatedDate` précède le jour où il a été modifié (CLAUDE.md § Règles contenu / SEO / GEO, règle 2) : le signaler, proposer ce jour-là. Comparer à la date de la modification (`git log -1 --format=%cs -- <fichier>`), pas à celle du commit précédent : un fichier retouché le jour de sa dernière mise à jour garde légitimement la même date. La correction se fait sur TEST (`branches` § 3) avant la mise en ligne.
5. Article programmé (`pubDate` future) parmi ce qui part : le dire (« il restera caché jusqu'au <date> »), `integrer-article` § Article programmé.

## 2. Obtenir un oui explicite
`AskUserQuestion` : « Mettre en ligne sur le site public : <sujets> ? Tout ce qui est sur le site de test part. » Un accord vague, ancien ou donné pour une autre modification ne compte pas ; dans le doute, redemander.

## 3. Lancer l'action « Mise en ligne »
Pas de `/commit-push` ni d'envoi git : l'action construit la production depuis le commit donné, puis déplace le tag `production`.
1. Noter le commit : `git rev-parse origin/main`.
2. Dépôt GitHub : `git remote get-url origin`, en garder les deux derniers segments sans `.git` (`<propriétaire>/<dépôt>`) et les écrire en clair dans les commandes suivantes (l'état du terminal ne se garde pas d'un appel à l'autre). `gh repo view` ne suffit pas en session cloud, où l'adresse du dépôt passe par un proxy.
3. `gh api -X POST repos/<propriétaire>/<dépôt>/actions/workflows/production.yml/dispatches -f ref=main -f "inputs[ref]=<commit>"`. En session cloud, `gh` passe par la passerelle GitHub (API REST) ; en local, il faut `gh` connecté. Impossible : le dire et proposer de prévenir le développeur du site.
4. Suivre l'exécution : `gh api "repos/<propriétaire>/<dépôt>/actions/workflows/production.yml/runs?per_page=1" --jq '.workflow_runs[0] | "\(.id) \(.status) \(.conclusion)"'`, toutes les 30 secondes, 10 minutes au plus. Échec : `gh api repos/<propriétaire>/<dépôt>/actions/runs/<id>/jobs`, cause en clair (réglage absent du dépôt : `.claude/checklists/bootstrap.md`), proposer de prévenir le développeur du site.

## 4. Confirmer
Contrôler l'adresse de production (`site` d'`astro.config.mjs` + chemin) de la page principale comme en `branches` § 5.3. « En ligne sur le site public : <adresse> » seulement quand c'est vérifié. Puis proposer de ranger les branches parties (`branches` § 8).

## Garde-fous
- Jamais de mise en ligne glissée en fin d'une autre tâche, jamais sans récap ; jamais `--no-verify`, jamais `push --force`, jamais de tag posé à la main.
- Construction en échec (TEST ou action) : l'expliquer en clair (`verifier`), corriger sur TEST, reprendre au point 1.
