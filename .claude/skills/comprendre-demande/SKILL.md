---
name: comprendre-demande
description: Point d'entrée quand on ne sait pas où vit ce que l'utilisateur veut changer, ou que sa demande est floue - retrouver l'origine d'un texte, d'une image ou d'un bloc vu à l'écran, dire ce qui relève de l'édition, du développement ou d'une règle du site, puis passer au bon skill. À déclencher quand l'utilisateur dit « il vient d'où, ce texte ? », « je ne sais pas où c'est », « que puis-je faire ? », mêle plusieurs demandes dans un message, ou quand une demande heurte une règle du site.
---

# Comprendre une demande

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

Ce skill localise et oriente ; il ne modifie rien. Élément localisé : passer la main au skill du tableau, sans revenir ici.

## Localiser ce que l'utilisateur voit
1. Obtenir la page (adresse ou nom) et le texte exact vu à l'écran ; pour un ajout, l'endroit où il doit apparaître. Une capture ou un copier-coller suffit.
2. Chercher un fragment de 3-4 mots, sans ponctuation (apostrophes et espaces diffèrent entre l'écran et le fichier), dans `src/content/` (pages, articles, fiches, réglages), puis `src/pages/`, puis `src/components/`.
3. Trouvé dans une fiche ou un réglage : relever les pages qui affichent CE CHAMP, pas tout le fichier. Chercher `data.<champ>` (ou `SITE.<clé>`) dans `src/`, puis les pages qui rendent les composants trouvés. Contre-épreuve : la phrase dans `dist/` après un build (`verifier`).

## Router
| L'utilisateur veut… | Skill |
|---|---|
| changer ou ajouter un texte, un titre, une date, une question de FAQ | `editer-page` |
| changer le menu, le bouton du haut, le pied de page, un texte présent partout | `editer-global` |
| publier un article (texte fourni, ou à rédiger) | `integrer-article` |
| ajouter une page | `creer-page` |
| changer une photo, un logo | `gerer-images` |
| être mieux trouvé sur Google ou cité par les IA, créer une FAQ | `optimiser-seo` |
| changer l'adresse d'une page, la supprimer, rediriger | `renommer-rediriger` |
| changer l'apparence, ajouter ou déplacer un bloc (choisi dans la bibliothèque) | `modifier-design` |
| savoir quels blocs existent, à quoi ils ressemblent | la bibliothèque : `<site de test>/styleguide/` (CLAUDE.md § Projet) |
| voir le résultat (lien TEST ou d'aperçu) | `verifier` |
| savoir où il en est, ouvrir, reprendre, lister ou abandonner une branche | `branches` |
| envoyer une branche sur TEST, faire relire, retirer un sujet de TEST | `envoyer-sur-test` |
| programmer un article pour une date | `integrer-article` (§ Article programmé) |
| mettre en ligne, passer en production | `publier` |
| savoir où est une modification (aperçu, TEST, production) | `statut-mise-en-ligne` |
| défaire une modification, où qu'elle soit | `annuler-modification` |

Plusieurs demandes dans un message : les lister, confirmer l'ordre, les traiter une par une.

## « Que puis-je faire ? »
Répondre avec les lignes du tableau en mots courants (ni noms de skills, ni fichiers), un exemple de phrase par ligne, le lien de la bibliothèque (`<site de test>/styleguide/` : chaque bloc du site sur sa fiche, son nom, son aperçu et les pages qui l'utilisent ; l'éditeur choisit un bloc par son nom, et c'est Claude qui lui dit s'il peut l'ajouter seul ou si c'est du développement), et le circuit en une phrase : « une petite modification se fait directement sur le site de test, qu'on relit, puis on la met en ligne sur le site public ; un gros chantier a sa branche et son aperçu » (CLAUDE.md § Circuit de publication).

## Demande contraire à une règle du site
Procédure commune à tous les skills d'intention (CLAUDE.md § Demandes non techniques).
1. Ne rien modifier encore.
2. Dire la règle en une phrase, avec sa raison telle qu'elle est écrite (CLAUDE.md, `docs/`) ; aucune raison inventée.
3. `AskUserQuestion` : les options qui respectent la règle (« ne rien changer » compris) et celle qui la change, chacune avec sa conséquence (risque écrit dans la règle, développement induit).
4. L'éditeur peut changer la règle, sur un oui explicite à cette question : la réécrire dans CLAUDE.md (qui a décidé, et quand) dans le même commit que la modification. Si elle exige du développement (schéma, composant), le dire avant d'agir.

## Hors périmètre
- **Développement** (texte figé dans `src/components/` ou `src/lib/` ; texte partagé à changer sur une seule des pages qui l'affichent, qu'il faudrait dédoubler ; nouvelle fonctionnalité : formulaire, espace client, paiement, recherche, multilingue) : le dire en une phrase (« ce n'est plus de l'édition, c'est du développement, plus risqué »), puis dérouler CLAUDE.md § Modes de travail > Développement seulement si l'utilisateur confirme.
- **Réglage hors du dépôt** (nom de domaine, hébergeur, adresse de réception du formulaire, comptes) : il se fait dans la console du service concerné ; le dire et nommer le service.

## Garde-fou
Deux lectures possibles qui mènent à des travaux différents : `AskUserQuestion`, options en langage courant, jamais une supposition.
