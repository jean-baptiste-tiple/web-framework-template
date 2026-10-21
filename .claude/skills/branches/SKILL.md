---
name: branches
description: "Où et comment modifier le site - faire le point en début de session, modifier directement sur TEST (cas courant), ouvrir une branche pour un chantier (2 au plus par personne), envoyer chaque modification, lister, abandonner ou ranger les branches. À déclencher au début d'une session d'édition, avant toute modification du site, et quand l'utilisateur dit « où j'en suis ? », « sur quelle branche je suis ? », « ouvre une branche pour… », « reprends la branche… », « mes branches », « montre-moi l'aperçu », « abandonne cette branche », « fais le ménage dans les branches ». Envoyer une branche sur TEST : envoyer-sur-test ; mettre en ligne : publier."
---

# Où et comment modifier

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

Vocabulaire, règle « TEST d'abord, branche pour un chantier » : CLAUDE.md § Circuit de publication. Lieux, nommage, invariants git : `.claude/conventions/deploy.md` § Circuit branches → TEST → production. Adresses du site (TEST, modèle d'aperçu) : CLAUDE.md § Projet. En bref : `main` est TEST ; la production est le commit marqué par le tag `production`.

## 1. Faire le point (début de session, puis avant toute modification)
1. `git fetch origin --prune --tags --force` (le tag `production` se déplace à chaque mise en ligne), `git status -sb`, `git branch --show-current` (vide : la copie suit TEST, aucune branche ouverte).
2. Branche de chantier en retard sur GitHub (`behind` dans `git status -sb` : travail fait depuis un autre poste) : `git pull --ff-only`.
3. Dire en une phrase où l'on est (« sur le site de test » ou « sur la branche <nom> ») et ce qui n'est pas encore envoyé.
« Où j'en suis ? » : ajouter ce que TEST a de plus que la production (`git log --first-parent --format=%s production..origin/main`, en clair) et les branches de la personne (§ 6), en signalant celles sans envoi depuis 14 jours.

## 2. TEST directement, ou une branche ?
- Modification courte, terminée dans la session (texte, faute, article, image, couleur, FAQ, menu, blocs réordonnés) : directement sur TEST (§ 3). C'est le cas courant ; ne pas ouvrir de branche pour ça.
- Chantier (plusieurs sessions ou jours, plusieurs pages refaites, nouvelle page ou section à montrer seule avant TEST, essai incertain, code) : une branche (§ 4). Dire pourquoi en une phrase.
- Doute : `AskUserQuestion`, « directement sur le site de test » (recommandé) ou « dans une branche » (avec la raison).
- Sur une branche : demande du même chantier → continuer dessus ; demande courte sans rapport → envoyer d'abord sur sa branche (§ 5) ce qui est en cours, puis § 3.
- Session cloud : la branche `claude/…` créée par l'interface n'est jamais utilisée (CLAUDE.md § Circuit de publication).

## 3. Modifier directement sur TEST
1. `git switch --detach origin/main` après le `fetch` du § 1 : la copie suit TEST à jour.
2. Faire la modification (skill d'intention concerné).
3. Envoyer sur TEST (§ 5, destination `HEAD:main`), sans confirmation : TEST n'est pas public. Envoi refusé parce que TEST a bougé entre-temps (autre éditeur) : `git fetch origin`, `git rebase origin/main` (déplace seulement ce qui n'est pas encore envoyé), renvoyer. Conflit : `git rebase --abort`, puis règle de conflit d'`envoyer-sur-test` § 3.
4. Demande courte suivante : reprendre au § 1.

## 4. Ouvrir une branche (chantier)
1. Limite : 2 branches en cours par personne. Compter les branches de la personne pas encore sur TEST : pour chaque `origin/<nom>` de `git branch -r --no-merged origin/main`, auteur `git log -1 --format=%an origin/<nom>` égal à `git config user.name`. Déjà 2 : `AskUserQuestion`, « terminer <branche> et l'envoyer sur TEST » ou « abandonner <branche> » ; rien n'est ouvert avant.
2. Nom choisi par Claude d'après le chantier : minuscules sans accent, chiffres, tirets, 25 caractères au plus (`refonte-tarifs`), absent de `git branch -a`.
3. `git switch -c <nom> --no-track origin/main` : la branche part de TEST à jour ; les changements pas encore enregistrés la suivent.
4. Annoncer : « J'ouvre la branche <nom> pour <chantier> : <raison>. »

## 5. Envoyer (après chaque modification, sans confirmation)
1. Contrôle léger : fichier JSON relu après édition ; `pnpm run lint` seulement si un fichier de code a changé (`src/**/*.{ts,astro,mjs}`, `scripts/`, configuration) et que `node_modules/` existe. La construction complète est faite par Vercel à l'envoi.
2. `git add <fichiers de la demande>` (jamais `-A` ni `.`), `git commit -m "<changement visible, en français>"`, puis `git push origin HEAD:main` (directement sur TEST) ou `git push -u origin <nom>` (branche).
3. Attendre (adresse TEST ou d'aperçu : CLAUDE.md § Projet ; construction de quelques minutes) : toutes les 30 secondes, 5 minutes au plus, `curl -s <adresse de la page>` filtré sur un fragment du nouveau texte, sans apostrophe (le site écrit ’). Le statut HTTP ne prouve rien : pendant la construction d'une branche neuve, Vercel sert une page d'attente en 200 ; seul le fragment fait foi. Retrait de texte : le fragment de l'ancien texte disparaît.
   Adresse injoignable depuis la session (session cloud : le réseau de la machine bloque le domaine, réponse du proxy au lieu de la page Vercel) : connecteur Vercel s'il est branché (`list_deployments`, état `READY` du commit envoyé) ; sinon donner le lien à l'éditeur et lui demander de l'ouvrir dans 2 minutes. Le dire une fois au développeur du site : domaines à autoriser, `.claude/checklists/bootstrap.md`.
4. Toujours rien après 5 minutes : construction sans doute en échec (Vercel continue de servir la version précédente). Connecteur Vercel branché : `list_deployments` (`branch: main` ou `<nom>`) puis journal du déploiement, cause en clair, correction, nouvel envoi. Sans connecteur : le dire et proposer de prévenir le développeur du site. Sur TEST, l'échec bloque la mise en ligne de tous : corriger ou défaire (`annuler-modification`) tout de suite.

## 6. Lister les branches
`git branch -r --no-merged production`, sans `origin/main` : une ligne par branche, en clair : sujet (`git log -1 --format=%s origin/<nom>`), auteur, date du dernier envoi, sur TEST ou non (`git merge-base --is-ancestor origin/<nom> origin/main`), lien d'aperçu.

## 7. Abandonner une branche
1. Dire ce qui serait perdu, en clair. Branche déjà sur TEST : la retirer d'abord (`envoyer-sur-test` § 5).
2. `AskUserQuestion` : la perte est définitive.
3. `git switch --detach origin/main` si c'est la branche en cours, puis `git branch -D <nom>` et `git push origin --delete <nom>`.
4. Suppression refusée par GitHub (session cloud : la passerelle refuse toute suppression de branche) : la branche reste sur GitHub, sans effet sur le site ; le dire, et la signaler au développeur du site pour le ménage.

## 8. Ranger après une mise en ligne
Branches entièrement en production (`git branch -r --merged production`, sans `origin/main`) : proposer de les supprimer, une seule question pour toutes ; `git push origin --delete <nom>`, `git branch -d <nom>`. Refus en session cloud : comme § 7.4.

## Garde-fous
- Jamais `push --force`, `reset --hard`, `clean`, ni réécriture d'un envoi déjà fait (`rebase` seulement sur ce qui n'est pas encore envoyé). Jamais de tag posé à la main : le tag `production` appartient à l'action « Mise en ligne ».
- État git incompris (conflit, branche inattendue) : ne rien forcer ; dire la situation en clair, proposer de prévenir le développeur du site.

## Rendre compte
Fin de chaque réponse à un éditeur, avec les mots de CLAUDE.md § Circuit de publication : « Visible sur le site de test : <adresse de la page> (pas encore sur le site public) · Prochaine étape : <une phrase, en général « dites mets en ligne »> », ou pour un chantier « Branche <nom> · Aperçu : <adresse> · Prochaine étape : … ».
