---
title: "Premier article : structure d un post de blog"
description: "Exemple d article de blog montrant le frontmatter complet, le résumé GEO et la FAQ structurée."
pubDate: 2026-05-20
updatedDate: 2026-05-28
author: "jb"
category: "guides"
tags: ["astro", "contenu"]
topics: ["structure de contenu", "SEO", "GEO"]
draft: false
tldr: "Un article = un fichier Markdown avec un frontmatter typé. Le champ tldr alimente le résumé citable, faq génère le JSON-LD FAQPage."
faq:
  - q: "Où placer un nouvel article ?"
    a: "Dans src/content/blog/. Le nom du fichier devient le slug de l URL (/blog/mon-fichier)."
  - q: "Que se passe-t-il si un champ obligatoire manque ?"
    a: "Le build échoue avec une erreur Zod explicite. Le typage du contenu remplace les tests."
---

## Pourquoi un frontmatter typé

Chaque champ du frontmatter est validé par un schéma Zod défini dans `src/content.config.ts`.
Un article sans `description` ou sans `pubDate` casse le build — volontairement.

## Rédiger le corps

Le corps est du Markdown standard. Utiliser des titres `##` et `###` sémantiques :
ils structurent la page pour les lecteurs, pour Google, et pour les moteurs génératifs.

### Bonnes pratiques

- Une idée par section, titre explicite.
- Phrases factuelles et autonomes (citables hors contexte).
- Lier les sources quand c est pertinent.
