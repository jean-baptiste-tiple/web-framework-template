---
name: verifier
description: Montrer le résultat d'une modification avant de la mettre en ligne et contrôler que rien n'est cassé - aperçu des pages touchées, contrôle automatique du site entier, rapport en clair. À déclencher quand l'utilisateur dit « montre-moi », « je veux voir avant », « est-ce que ça marche ? », « vérifie », et avant toute mise en ligne.
---

# Vérifier avant de publier

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

Ce skill ne modifie aucun contenu : une correction repasse par le skill d'édition concerné.

## Voir le rendu
1. Première fois sur cette machine (`node_modules/` absent) : `pnpm install`.
2. Lancer l'aperçu : `pnpm dev` (http://localhost:4321) ; dans Claude Code desktop, par la configuration `.claude/launch.json`.
3. Ouvrir les pages touchées et donner leurs adresses locales à l'utilisateur ; capture sur ordinateur et, si la mise en page a bougé, en largeur téléphone (390 px).

## Contrôler le site
1. `pnpm run lint`, puis `pnpm run build` (types, champs des fichiers de contenu, génération de toutes les pages).
2. Fichier de contenu supprimé ou renommé depuis le dernier build : `rm -rf node_modules/.astro dist` avant.

## Rendre compte, en clair
- Tout va bien : « Aperçu prêt à <adresse locale> ; le site se construit sans erreur. » Proposer `publier`.
- Erreur : la traduire (« l'article n'a pas de description, elle est obligatoire »), dire où, proposer le correctif. Jamais le journal brut.
- Build en échec : on ne publie pas ; corriger, puis revérifier.

## Garde-fous
Serveur d'aperçu : l'arrêter à la fin s'il a été lancé ici ; ne jamais arrêter un processus qu'on n'a pas lancé soi-même.
