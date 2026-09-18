---
name: integrer-article
description: Intégrer un article au blog - texte déjà rédigé (collé, fichier Word ou PDF, Google Doc) ou à rédiger avec l'auteur - converti en page d'article propre avec image, résumé et relecture typographique, sans toucher au fond ; la mise en ligne reste à publier. À déclencher quand l'utilisateur dit « publie cet article », « ajoute ce billet au blog », « mets ce texte sur le blog », « écris un article sur… », ou partage un document à mettre sur le blog. Pour corriger un article déjà en ligne : editer-page.
---

# Intégrer un article de blog

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

## Traduire la demande
- Entrées : le texte et les images éventuelles. `.docx` ou PDF : en extraire le texte (skill `docx` ou `pdf` s'il est disponible) ; Google Doc : connecteur Drive s'il est branché, sinon demander un copier-coller.
- Pas de texte : le demander à l'auteur, ou proposer un brouillon rédigé avec `copywriting`, présenté comme tel ; les faits (date, lieu, chiffres, noms) se demandent.
- Sortie : `src/content/blog/<slug>.md` → page `/blog/<slug>`. Lire d'abord le schéma `blog` de `src/content.config.ts` : il dit les champs requis.

## Faire
1. Slug : kebab-case tiré du titre, court, sans accents ; vérifier qu'aucun article ne l'utilise.
2. Frontmatter : `title` (≤ 60 car. ; titre plus long gardé à l'écran → `seo.title` court), `description` (140-160 car.), `pubDate` (date du jour, sauf date donnée), `author` (clé de `src/lib/authors.ts` ; auteur inconnu → demander, puis ajouter l'entrée), `tldr` (1-2 phrases factuelles, citables), et ce que le schéma exige en plus.
3. Corps : intertitres éventuels en `##` (jamais `#` : le titre est déjà rendu en H1) ; paragraphes courts ; listes et gras conservés. Ni titre, ni ligne auteur ou date, ni résumé répétés : le gabarit les affiche.
4. Typographie française appliquée (apostrophe ’, guillemets « », espace insécable avant « : ; ! ? » ; règles : `copywriting`, et `content-patterns` si le site en pose) ; fautes évidentes corrigées, le reste signalé. Tout est listé dans le compte rendu.
5. Avant d'écrire, une seule question `AskUserQuestion` : liens vers 2-3 pages du site (choix multiple, posés sur des mots de l'auteur) et FAQ (CLAUDE.md § Règles contenu, règle 4 ; questions venues de l'auteur). Ajout que le site impose (`projet.md`) : l'appliquer et le signaler.
6. Images : `gerer-images` (rangement, `alt` descriptif obligatoire). Image requise par le schéma et pas encore là : ne pas écrire le fichier avant elle (un champ requis manquant casse le build de tout le blog).

## Garde-fous
- Le fond appartient à l'auteur : ni ajout, ni coupe, ni reformulation sans accord explicite.
- Auteur, chiffre ou source manquants : les demander, jamais les inventer.
- Rédaction : CLAUDE.md § Règles contenu / SEO / GEO et § Projet ; demande contraire à une règle : `comprendre-demande` § Demande contraire à une règle.

## Rendre compte
Titre, adresse de la page, résumé, image placée, corrections faites. Puis `verifier` (aperçu) ; `publier` seulement après validation de l'aperçu.

## Hors périmètre
Mise en forme que le gabarit d'article ne prévoit pas (encadré, tableau complexe, vidéo intégrée) → `modifier-design`.
