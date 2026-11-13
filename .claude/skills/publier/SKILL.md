---
name: publier
description: "Mettre en ligne - passer tout TEST en production, le site officiel - récapitulatif en clair de ce qui va changer, confirmation explicite, puis lancement de la mise en ligne et contrôle. À déclencher quand l'utilisateur dit « mets en ligne », « publie tout ça », « passe en production », « envoie », « c'est bon, on peut pousser », « déploie ». Envoyer une branche sur TEST : envoyer-sur-test. Texte ou document pas encore intégré au site (« publie cet article ») : integrer-article d'abord. Pour savoir si c'est déjà en ligne : statut-mise-en-ligne."
---

# Publier (mettre TEST en production)

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

Circuit : CLAUDE.md § Circuit de publication. Lieux et invariants : `.claude/conventions/deploy.md` § Circuit branches → TEST → production. TEST est `main` ; la production est le commit marqué par le tag `production`, et seule l'action GitHub « Mise en ligne » (`.github/workflows/production.yml`) la change.

## Ce que vise chaque mot
- « mets en ligne », « passe en production », « publie » : tout TEST part tel quel en production (ce fichier). Les éditeurs y ont droit, sur un oui explicite.
- « envoie sur TEST » : `envoyer-sur-test`. « envoie » sans lieu, sur une branche pas encore sur TEST : `AskUserQuestion`, « sur TEST » (recommandé) ou « seulement sur l'aperçu ».
- Sujet de l'éditeur pas encore sur TEST (pas envoyé, ou sur sa branche seulement) : il ne part pas en production ; le dire, proposer de l'envoyer sur TEST d'abord (`branches` § 5 ou `envoyer-sur-test`).

## 1. Récapituler
1. `git fetch origin --tags --force`. `git log production..origin/main` vide : rien à mettre en ligne, le dire.
2. Sujets qui partent : `git log --first-parent --format="%s (%an)" production..origin/main` (fusions « TEST : … » de branches, et modifications faites directement sur TEST ; un sujet retiré, suivi de son « Revert », ne part pas : ne citer que les sujets restants, avec leur auteur quand ce n'est pas l'éditeur). Changements visibles : `git diff --stat production origin/main`, traduits en pages (« page X : titre modifié », « tout le site : lien ajouté au menu »). Aucun nom de fichier dans le récap destiné à l'utilisateur.
3. TEST construit sur ce dernier état : la page principale du récapitulatif, sur l'adresse TEST (CLAUDE.md § Projet), montre le changement (contrôle de `branches` § 5.3). Sinon, on ne met pas en ligne.
4. Fichier de contenu dont `updatedDate` précède le jour où il a été modifié (CLAUDE.md § Règles contenu / SEO / GEO, règle 2) : le signaler, proposer ce jour-là. Comparer à la date de la modification (`git log -1 --format=%cs -- <fichier>`), pas à celle du commit précédent : un fichier retouché le jour de sa dernière mise à jour garde légitimement la même date. La correction se fait sur TEST (`branches` § 3) avant la mise en ligne.
5. Article programmé (`pubDate` future) parmi ce qui part : le dire (« il restera caché jusqu'au <date> »), `integrer-article` § Article programmé.

## 2. Oui explicite : la fenêtre de confirmation, une seule fois
Pas d'`AskUserQuestion` : le oui est celui de la fenêtre que Claude Code ouvre lui-même au lancement du § 3 (règle `ask` de `.claude/settings.json` et hook `.claude/hooks/mise-en-ligne.mjs`, ADR 0006). Elle montre la description de l'appel et la commande courte `npm run mettre-en-ligne`, pas toujours le récapitulatif : c'est le texte écrit juste avant qui informe l'éditeur.
- Avant de lancer, écrire le récapitulatif du § 1 en clair (« Tout ce qui est sur le site de test part »), puis exactement : « Une fenêtre « Autoriser Claude à exécuter cette commande ? » va s'ouvrir : « Autoriser une fois » veut dire OUI, je mets en ligne ; « Refuser » veut dire NON, rien ne change. »
- Description de l'appel (affichée dans la fenêtre) : « Souhaitez-vous mettre en ligne ces changements sur le site officiel (<adresse>) ? Autoriser une fois = OUI · Refuser = NON ».
- Claude ne voit pas le clic : la commande qui s'exécute veut dire que l'éditeur a cliqué « Autoriser une fois ». Refusé : rien ne part, le dire.
- Commande refusée par le hook (autre forme que celle du § 3) : ne jamais chercher un autre chemin ; le dire et proposer de prévenir le développeur du site.

## 3. Lancer l'action « Mise en ligne »
Pas de `/commit-push` ni d'envoi git : l'action construit la production depuis le commit donné, puis déplace le tag `production`.
1. `npm run mettre-en-ligne` (retour à une mise en ligne précédente : `npm run mettre-en-ligne -- <tag mise-en-ligne-…>`), seule commande admise : `scripts/mettre-en-ligne.mjs` résout le dernier commit de `main` et le dépôt (`origin`), puis déclenche l'action par `gh api` ; toute autre forme est refusée par le hook. En session cloud, `gh` passe par la passerelle GitHub (API REST) ; en local, il faut `gh` connecté. Impossible : le dire et proposer de prévenir le développeur du site.
2. Le script suit lui-même l'exécution et affiche « Mise en ligne réussie » ou « en échec » (jusqu'à 10 minutes) : lancer la commande avec un délai d'attente de 10 minutes et lire sa sortie. Échec : `gh api repos/<propriétaire>/<dépôt>/actions/runs/<id>/jobs` (id affiché par le script), cause en clair (réglage absent du dépôt : `.claude/checklists/bootstrap.md`), proposer de prévenir le développeur du site.

## 4. Confirmer
Contrôler l'adresse de production (`site` d'`astro.config.mjs` + chemin) de la page principale comme en `branches` § 5.3. Modèle « après une mise en ligne » de CLAUDE.md § Circuit de publication, seulement quand c'est vérifié. Puis proposer de ranger les branches parties (`branches` § 8).

## Garde-fous
- Jamais de mise en ligne glissée en fin d'une autre tâche, jamais sans récap ; jamais `--no-verify`, jamais `push --force`, jamais de tag posé à la main.
- Construction en échec (TEST ou action) : l'expliquer en clair (`verifier`), corriger sur TEST, reprendre au point 1.
