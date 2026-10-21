---
name: statut-mise-en-ligne
description: "Dire où en est une modification - pas encore envoyée, sur l'aperçu d'une branche, sur TEST, en production ou programmée - en vérifiant l'état réel (dépôt, hébergeur, page servie) sans rien modifier. À déclencher quand l'utilisateur demande « c'est en ligne ? », « c'est publié ? », « c'est sur TEST ? », « pourquoi je ne vois pas ma modif ? », « la mise en ligne a marché ? »."
---

# Statut de mise en ligne (lecture seule)

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

Trois lieux : l'aperçu d'une branche, TEST (`main`), la production (tag `production`) ; adresses : CLAUDE.md § Projet et `site` d'`astro.config.mjs` (production).

## Cerner la modification visée
`git status` puis `git diff --stat -- <dossier concerné>` (un article : `src/content/blog/`) et `git log --format="%h %cs %s" -10 -- <dossier>` : ne retenir que ce dont l'utilisateur parle. Ce qui ne colle pas à sa description (autre sujet, autre jour) : le dire, plutôt que répondre sur autre chose.

## Situer la modification, dans l'ordre
`git fetch origin --tags --force` d'abord.
1. **Pas envoyée** : changement dans `git status`, ou commit dans `git log origin/main..HEAD` (modification directe) ou `git log origin/<branche>..HEAD` (branche) → `branches` § 5.
2. **Sur l'aperçu d'une branche seulement** : commit absent d'`origin/main` (`git merge-base --is-ancestor <commit> origin/main` en échec).
3. **Sur TEST, pas en production** : présent dans `origin/main`, absent de `production`.
4. **En production** : présent dans `production`. Heure de la mise en ligne : tag daté `mise-en-ligne-AAAAMMJJ-HHMM` le plus ancien qui le contient (`git tag --list "mise-en-ligne-*" --contains <commit>`, heure UTC).

## Vérifier qu'elle se voit
Adresse du lieu + chemin de la page (`src/content/blog/<slug>.md` → `/blog/<slug>/`, `src/content/pages/<slug>.md` → `/<slug>/`) : `curl -s` filtré sur un fragment du texte modifié, sans apostrophe (le site écrit ’, pas ') ; le statut 200 seul ne prouve rien. Absent alors que git dit présent : construction en cours (quelques minutes) ou en échec :
- aperçu, TEST : connecteur Vercel `list_deployments` (`projectId` ; `teamId` = `orgId` de `.vercel/project.json`, sinon `list_projects`), avec `branch` et `since` = il y a 48 h en millisecondes (sans lui, la réponse est très longue) : état (`READY`, en cours, `ERROR`) du commit visé ;
- production : dernière exécution de l'action « Mise en ligne » (`publier` § 3.4).

## Répondre en une phrase
- « Pas encore envoyée » ; « Sur l'aperçu seulement : <adresse> » ; « Visible sur le site de test : <adresse>, pas encore sur le site public » ; « En ligne sur le site public depuis <heure> : <adresse> » ; les sources donnent l'heure en UTC, l'annoncer en heure de Paris (UTC+2 l'été, UTC+1 l'hiver) ;
- article à `pubDate` future, présent dans `production` : « Mis en ligne, programmé : il paraîtra sur le site public le <date> vers 6 h » (`integrer-article` § Article programmé) ;
- « Bloqué : la construction du site a échoué parce que <cause en clair> » → lire le journal, proposer le correctif (`verifier`).
Tout est vert mais le changement reste invisible : page en brouillon (`draft: true`, jamais affichée) ; sinon cache du navigateur → rechargement forcé (Ctrl+F5).

## Garde-fous
Lecture seule : aucun fichier modifié, aucun déploiement relancé sans demande.
