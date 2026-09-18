---
name: optimiser-seo
description: Rendre une page plus facile à trouver sur Google et à citer par les assistants IA (ChatGPT, Perplexity…) - titre et description affichés dans les résultats, résumé citable, FAQ à créer, fraîcheur. À déclencher quand l'utilisateur dit « améliore le référencement de… », « on n'apparaît pas sur Google », « optimise pour les IA », « ajoute une FAQ à… », « le titre dans Google est coupé ». Corriger une question d'une FAQ existante : editer-page.
---

# Optimiser le référencement d'une page

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

## Traduire la demande
Tout se règle dans le frontmatter de la page (trouver le fichier : `editer-page`) ; balises et données structurées sont générées par `BaseLayout`.
Faire d'abord l'état des lieux, en clair : longueur du titre et de la description, `tldr` présent ou non, `faq` présente ou non, date de `updatedDate`, un seul titre principal.

## Leviers (règles : CLAUDE.md § Règles contenu / SEO / GEO, `.claude/conventions/seo-geo.md`)
- `title` ≤ 60 car., `description` 140-160 car. ; titre long à garder à l'écran → `seo.title` / `seo.description`.
- `tldr` : 1-2 phrases factuelles, autonomes, citables telles quelles par une IA.
- `faq` : vraies questions de clients, réponses courtes et factuelles (rendu visuel + données structurées FAQPage).
- Titres `##` / `###` qui disent le sujet ; phrases qui se comprennent seules.
- `updatedDate` bumpée à chaque modification.

## Faire
1. Présenter l'état des lieux et les changements proposés (avant → après) ; appliquer après accord.
2. FAQ : partir de ce que l'utilisateur sait de ses clients ; jamais de réponse, de chiffre ou de promesse inventés.

## Garde-fous
Aucune balise meta ni JSON-LD écrite dans une page (CLAUDE.md règle absolue 5).

## Rendre compte
Avant → après, en quelques lignes, puis `verifier` et `publier`. Préciser que Google met des jours ou des semaines à en tenir compte.

## Hors périmètre
Structure d'un nouveau type de page, audit du site entier, score agentique (`is-agentic`) : travail technique.
