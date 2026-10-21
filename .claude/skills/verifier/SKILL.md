---
name: verifier
description: Montrer le résultat d'une modification avant de la mettre en ligne et contrôler que rien n'est cassé - lien TEST ou d'aperçu des pages touchées, aperçu local, contrôle du site entier, rapport en clair. À déclencher quand l'utilisateur dit « montre-moi », « je veux voir avant », « est-ce que ça marche ? », « vérifie », et avant toute mise en ligne.
---

# Vérifier avant de mettre en ligne

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

Ce skill ne modifie aucun contenu : une correction repasse par le skill d'édition concerné.

## Voir le rendu
- « Montre-moi » : TEST (modification directe) ou l'aperçu de la branche (chantier), construits par Vercel à chaque envoi (`branches` § 5) ; donner l'adresse de chaque page touchée, avec le slash final (adresses : CLAUDE.md § Projet), et la capture sur ordinateur et, si la mise en page a bougé, en largeur téléphone (390 px).
- Rendu immédiat avant envoi : aperçu local, seulement si Node est présent sur le poste. Première fois (`node_modules/` absent) : `pnpm install` ; puis `pnpm dev` (http://localhost:4321), dans Claude Code desktop par la configuration `.claude/launch.json`.

## Contrôler le site
- La construction complète (types, champs des fichiers de contenu, toutes les pages) est faite par Vercel à chaque envoi (TEST ou branche) : page à jour = site construit sans erreur. Échec : `branches` § 5.4.
- Contrôle local (développement, lecture d'une erreur sans connecteur Vercel) : `pnpm run lint`, puis `pnpm run build`. Fichier de contenu supprimé ou renommé depuis le dernier build : `rm -rf node_modules/.astro dist` avant.

## Rendre compte, en clair
- Tout va bien : « Visible sur le site de test : <adresse> ; le site se construit sans erreur. » Proposer `publier`.
- Erreur : la traduire (« l'article n'a pas de description, elle est obligatoire »), dire où, proposer le correctif. Jamais le journal brut.
- Construction en échec : on ne met pas en ligne ; corriger, puis revérifier.

## Garde-fous
Serveur d'aperçu : l'arrêter à la fin s'il a été lancé ici ; ne jamais arrêter un processus qu'on n'a pas lancé soi-même.
