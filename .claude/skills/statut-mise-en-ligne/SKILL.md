---
name: statut-mise-en-ligne
description: Dire si une modification est en ligne sur le site public, en cours de mise en ligne ou bloquée, en vérifiant l'état réel (dépôt, hébergeur, page publique) sans rien modifier. À déclencher quand l'utilisateur demande « c'est en ligne ? », « c'est publié ? », « pourquoi je ne vois pas ma modif ? », « la mise en ligne a marché ? ».
---

# Statut de mise en ligne (lecture seule)

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

## Cerner la modification visée
`git status` puis `git diff --stat -- <dossier concerné>` (un article : `src/content/blog/`) : ne retenir que les fichiers dont l'utilisateur parle, et regarder leur date. Fichiers qui ne collent pas à sa description (autre sujet, autre jour) : le dire, plutôt que répondre sur autre chose.

## Vérifier, dans l'ordre
1. **Envoyé ?** `git fetch`, puis `git log origin/main..HEAD` : fichier modifié non committé, ou commit non poussé = pas encore envoyé → proposer `publier`.
2. **Mis en ligne ?** Dernier déploiement de `main` chez l'hébergeur.
   - Vercel : connecteur `list_deployments` (`projectId` ; `teamId` = `orgId` de `.vercel/project.json`, sinon `list_projects`), avec `since` = il y a 48 h en millisecondes (sans lui, la réponse est très longue). Contrôler `target: production`, `meta.githubCommitRef: main`, l'état (`READY`, en cours, `ERROR`) et que le commit déployé est le dernier d'`origin/main`.
   - Hébergeur alimenté par la CI (stockage + CDN) : le run EST le déploiement ; `gh run list --branch main --limit 3 --json headSha,status,conclusion,createdAt` (`--json` : la sortie courte ne montre pas le commit). Une CI qui ne fait que lint + build ne prouve pas une mise en ligne.
3. **Visible ?** Adresse = `site` d'`astro.config.mjs` + chemin (`src/content/blog/<slug>.md` → `/blog/<slug>/`, `src/content/pages/<slug>.md` → `/<slug>/`). Il faut `curl -sI` à 200 ET le texte modifié présent dans la page servie (`curl -s <adresse>` filtré sur un fragment sans apostrophe : le site écrit ’, pas ').

## Répondre en une phrase
- « En ligne depuis <heure> : <adresse> » ; les sources donnent l'heure en UTC, l'annoncer en heure de Paris (UTC+2 l'été, UTC+1 l'hiver) ;
- « En cours de mise en ligne, encore quelques minutes » ;
- « Pas encore envoyé : il faut publier » ;
- « Bloqué : la construction du site a échoué parce que <cause en clair> » → lire le journal du déploiement, proposer le correctif (`verifier`).
Tout est vert mais le changement reste invisible : page en brouillon (`draft: true`, jamais affichée) ; sinon cache du navigateur → rechargement forcé (Ctrl+F5).

## Garde-fous
Lecture seule : aucun fichier modifié, aucun déploiement relancé sans demande.
