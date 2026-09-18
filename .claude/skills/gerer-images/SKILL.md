---
name: gerer-images
description: Ajouter, remplacer ou corriger une image du site - photo d'article ou de page, visuel d'une fiche, logo, image affichée quand on partage un lien. À déclencher quand l'utilisateur dit « change la photo de… », « remplace le logo », « ajoute une image à… », « l'image est floue / cassée / trop lourde », ou envoie une image à mettre sur le site.
---

# Gérer les images

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

## Traduire la demande
Trouver le champ qui porte l'image : `heroImage` d'un article, `hero.image` d'une landing, champ image d'une fiche (le schéma `src/content.config.ts` les liste), ou fichier de `public/` (`logo.png`, `og-default.png`). Image importée dans un composant ou une page `.astro` : remplacer le fichier à l'identique de nom se fait ici ; tout autre changement est du développement.

## Faire
1. Image de contenu : déposer le fichier là où les fiches voisines rangent les leurs (voir leur champ image ; défaut du socle : à côté du `.md`), le référencer en chemin relatif dans le frontmatter. `astro:assets` l'optimise et lit ses dimensions au build.
2. Remplacement : garder le même nom de fichier si possible ; sinon mettre à jour chaque référence (chercher l'ancien nom dans `src/`).
3. `alt` obligatoire : il décrit ce que montre l'image, pas le sujet de la page ; `alt=""` seulement pour une image purement décorative.
4. Logo, image de partage : remplacer `public/logo.png`, `public/og-default.png` (1200×630) sous le même nom.

## Garde-fous
- Règles : `.claude/conventions/images.md` (dimensions anti-CLS, image LCP, formats).
- Origine inconnue (banque d'images, site tiers, photo de personne, logo de client) : demander si l'usage est autorisé avant de l'ajouter.

## Rendre compte
« L'image de <page> est remplacée ; texte alternatif : "<alt>". » Puis `verifier` (l'aperçu montre le recadrage réel) et `publier`.

## Hors périmètre
Retouche, détourage, création d'illustration : hors du site ; demander le fichier final.
