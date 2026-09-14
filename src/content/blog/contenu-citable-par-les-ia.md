---
title: "Écrire un contenu que les IA peuvent citer"
description: "Résumé autonome, questions explicites, phrases qui tiennent hors contexte : trois réglages d'écriture qui rendent une page reprenable par un moteur génératif."
pubDate: 2026-07-30
author: "jb"
category: "guides"
tags: ["geo", "contenu"]
topics: ["GEO", "structure de contenu", "données structurées"]
heroImage: "./contenu-citable-par-les-ia.png"
heroImageAlt: "Six barres horizontales évoquant les lignes d'un document, dont deux encadrées par un rectangle bleu, sur fond gris clair."
draft: false
tldr: "Un moteur génératif reprend des passages courts et autonomes, pas des pages entières. Les champs tldr et faq du frontmatter produisent ces passages et alimentent au passage le JSON-LD et le fichier llms.txt."
faq:
  - q: "Quelle est la différence entre le SEO et le GEO ?"
    a: "Le SEO vise un classement dans une liste de liens : la page est la réponse. Le GEO vise la reprise d'un passage dans une réponse rédigée par un modèle : le paragraphe est la réponse. Les deux se travaillent avec le même contenu, mais le GEO exige des phrases qui restent vraies une fois sorties de leur page."
  - q: "Le champ tldr est-il visible par les visiteurs ?"
    a: "Oui. Il est rendu en tête d'article dans un encadré En bref, et il sert aussi de résumé dans le fichier llms.txt généré au build. Un résumé écrit pour les machines seules finirait par mal vieillir."
  - q: "Faut-il remplir faq sur toutes les pages ?"
    a: "Non, seulement quand des questions se posent réellement. Une FAQ inventée pour produire du balisage dégrade la page pour les lecteurs et n'apporte rien : le JSON-LD FAQPage reprend exactement les paires question/réponse du frontmatter."
---

## Le passage, pas la page

Un moteur de recherche classique renvoie une liste de liens : l'unité utile est la page. Un moteur
génératif rédige une réponse et cite ses sources : l'unité utile devient le paragraphe. Une page
excellente mais dont aucune phrase ne tient seule est difficile à reprendre.

Le test tient en une manipulation : sortir une phrase de son contexte et la relire. Si elle commence
par « comme on l'a vu plus haut » ou si son sujet est un pronom, elle ne sera pas reprise.

## Trois réglages concrets

### Un résumé autonome en tête

Le champ `tldr` du frontmatter attend une ou deux phrases factuelles, compréhensibles sans avoir lu
l'article. Il est rendu en tête de page dans un encadré et repris dans le fichier `llms.txt` généré
au build. Le piège habituel est d'y écrire une promesse commerciale : « nous vous expliquons tout
sur ce sujet » ne dit rien et ne sera jamais cité.

### Des questions écrites comme on les pose

Le champ `faq` produit deux choses à la fois : un bloc de questions visible et un balisage JSON-LD
de type FAQPage. Les questions se formulent comme un visiteur les taperait, avec ses mots, pas avec
le vocabulaire interne de l'entreprise. Une réponse fait deux à quatre phrases et donne le fait
avant le contexte.

### Des titres qui annoncent, pas qui teasent

Un titre de section sert de point d'entrée à la lecture comme à l'extraction. « Ce que vous devez
savoir » n'annonce rien. « Trois signaux qui justifient un îlot interactif » annonce le contenu de
la section et sa forme.

## Ce que le socle génère tout seul

Il n'y a pas de fichier à tenir à la main. Au build, les collections de contenu alimentent le
sitemap avec une date de dernière modification, le flux RSS, le fichier `llms.txt` qui liste les
pages avec leur résumé, et le JSON-LD injecté par le layout de base. Bumper `updatedDate` à chaque
modification suffit à propager le signal de fraîcheur partout.

## L'erreur à éviter

Écrire deux contenus, l'un pour les visiteurs et l'autre pour les machines. Un résumé qu'on
n'assume pas d'afficher est un résumé faux, et un balisage qui décrit autre chose que la page
visible se retourne contre le site. La bonne version est la même dans les deux cas : des phrases
courtes, vérifiables, et qui restent exactes le jour où elles sont recopiées ailleurs.
