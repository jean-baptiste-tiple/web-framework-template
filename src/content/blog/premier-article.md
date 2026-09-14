---
title: "Premier article : structure d un post de blog"
description: "Exemple d article de blog montrant le frontmatter complet : champs obligatoires validés par Zod, résumé citable tldr, FAQ structurée et image de hero."
pubDate: 2026-05-20
updatedDate: 2026-09-14
author: "jb"
category: "guides"
tags: ["astro", "contenu"]
topics: ["structure de contenu", "SEO", "GEO"]
heroImage: "./premier-article.png"
heroImageAlt: "Cinq barres horizontales évoquant les lignes d un document, la première en bleu, sur fond gris clair."
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
Un article sans `description` ou sans `pubDate` casse le build, volontairement.

## Rédiger le corps

Le corps est du Markdown standard. Utiliser des titres `##` et `###` sémantiques :
ils structurent la page pour les lecteurs, pour Google, et pour les moteurs génératifs.

La méthode du projet, décrite dans `CLAUDE.md` à la section Modèle de contenu, tient en trois
phrases :

> 1 fichier markdown par page pour le texte de la page ; 1 fichier de réglages pour le texte
> partagé entre pages. Éditer du texte revient donc à éditer ce seul fichier. Le design vit dans
> les composants et les tokens, jamais dans le contenu.

### Bonnes pratiques

- Une idée par section, titre explicite.
- Phrases factuelles et autonomes (citables hors contexte).
- Lier les sources quand c est pertinent.
