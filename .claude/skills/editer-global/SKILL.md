---
name: editer-global
description: Modifier un texte présent sur toutes les pages - liens du menu, bouton du haut, pied de page, liens légaux, réseaux sociaux, coordonnées, FAQ commune, nom et description du site. À déclencher quand l'utilisateur dit « change le menu », « ajoute un lien dans le pied de page », « modifie le bouton en haut », « mets à jour notre adresse / email / LinkedIn », « change la FAQ générale ».
---

# Éditer les textes communs à tout le site

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

## Traduire la demande
Tout vit dans `src/content/settings/site.json` (validé par `src/lib/site.ts`) ; le header et le footer ne font que l'afficher. Rôle de chaque clé : CLAUDE.md § Changer le TEXTE GLOBAL.
Prévenir avant d'éditer : « Ce changement s'affichera sur toutes les pages. »

## Faire
1. Éditer la seule clé concernée de `site.json`.
2. JSON strict : ni virgule finale, ni commentaire ; relire le fichier après édition.
3. Lien interne : chemin absolu (`/offres`) vers une page qui existe (la chercher dans `src/content/` ou `src/pages/`).
4. Coordonnée inconnue : retirer la clé plutôt que laisser une valeur fausse (CLAUDE.md § Changer le TEXTE GLOBAL).

## Garde-fous
- Jamais de texte en dur dans `Header.astro` ou `Footer.astro` : clé absente de `site.json` = changement de schéma, c'est du développement.
- Menu : 5 entrées au plus (`.claude/conventions/a11y.md`, charge cognitive). Au-delà : le dire et demander ce qu'on retire (`AskUserQuestion`).
- `name` et `description` alimentent aussi le titre de l'onglet, l'aperçu des liens partagés et llms.txt : le signaler.

## Rendre compte
« <Menu / pied de page / …> modifié sur tout le site : <avant> → <après>. » Proposer `verifier`, puis `publier`.

## Hors périmètre
Sous-menu, second bouton, nouvelle zone du header ou du footer : c'est de la structure → `modifier-design`.
