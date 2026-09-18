---
name: editer-page
description: Modifier le texte d'une page qui existe déjà, sans toucher à son apparence - corriger une faute, réécrire ou ajouter une phrase, changer un titre, une date, une question de FAQ existante. À déclencher quand l'utilisateur dit « corrige… », « remplace la phrase… », « ajoute cette phrase sur la page… », « change le titre de la page… », « corrige une question de la FAQ… », « il y a une faute sur… ». Pas pour le menu ni le pied de page (editer-global), l'adresse de la page (renommer-rediriger) ou la mise en page (modifier-design).
---

# Éditer le texte d'une page

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

## Traduire la demande
Trouver le seul fichier qui porte ce texte (pour une page de collection, le nom du fichier donne l'adresse) :
- `/blog/<slug>` → `src/content/blog/<slug>.md`
- `/<slug>` → `src/content/pages/<slug>.md`, ou `src/content/landings/<slug>.mdx` (textes des blocs dans `hero:` et `sections:` du frontmatter)
- accueil, contact, 404 → `src/pages/index.astro`, `contact.astro`, `404.astro` : pages sur mesure ; titre et description dans l'objet `meta`, textes dans les objets déclarés en tête du fichier et dans le balisage
Une page affiche aussi des textes venus d'ailleurs (fiche d'une collection, réglages) : chercher la phrase dans `src/` avant de supposer le fichier. Introuvable → `comprendre-demande`.
Texte affiché sur plusieurs pages (méthode : `comprendre-demande` § Localiser, étape 3) : confirmer via `AskUserQuestion`, « partout » (recommandé, une seule retouche) ou « seulement sur <page> » (il faudrait dédoubler le texte : développement). Texte d'une seule page : annoncer « Je modifie <page> » suffit.

## Faire
1. Changer seulement le texte demandé, dans le frontmatter (entre les `---`) ou le corps.
2. Bumper `updatedDate` à la date du jour si la collection a ce champ (`src/content.config.ts`).
3. Aucun champ inventé : le schéma de la collection fait foi.
4. Page sur mesure (`.astro`) : ne toucher qu'aux chaînes des objets déclarés en tête du fichier et au texte visible du balisage ; ajouter ou retirer une entrée d'une liste de textes existante (une question de FAQ) est permis ; ni balise, ni classe, ni expression `{…}`, ni import.
5. Réécriture pour convaincre (« plus percutant », « qui donne envie ») : charger `copywriting`, proposer avant → après, appliquer sur accord.

## Garde-fous
- Rédaction : CLAUDE.md § Règles contenu / SEO / GEO (title ≤ 60 car., description 140-160, un seul H1) et § Projet (règles propres au site).
- Fait absent de la demande (chiffre, date, nom, label) : le demander, jamais l'inventer.
- Faute repérée ailleurs : la signaler, ne pas la corriger d'office (CLAUDE.md § Avant de coder : edits chirurgicaux).
- Demande contraire à une règle du site : `comprendre-demande` § Demande contraire à une règle.

## Rendre compte
« C'est modifié sur <pages> : <avant> → <après>. » Proposer de voir le résultat (`verifier`), puis de mettre en ligne (`publier`).

## Hors périmètre
Texte figé dans un composant (`src/components/`) : c'est du développement (`comprendre-demande` § Hors périmètre).
