---
name: deploy
description: À charger avant tout travail technique de déploiement - config CI/CD, redirection, changement d'hébergeur, purge CDN. Gates, mapping branche→environnement, préprod noindex, réglages host, contrôles post-déploiement (404 réelle, Lighthouse prod, is-agentic). Mettre en ligne une modification (« publie », « déploie ») : skill publier.
---

Ce skill est un pointeur : la règle vit dans `.claude/conventions/deploy.md` (source unique).
Lis ce fichier MAINTENANT. Rappel dur : `main` est le site public ; mise en production = validation humaine explicite sur le récap `git log origin/main..HEAD` (skill `publier`).
