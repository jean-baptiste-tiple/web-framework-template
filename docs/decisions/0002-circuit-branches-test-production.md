# ADR 0002 — Circuit branches → TEST → production, production par action et tag

## Statut
Accepté le 2026-10-21 (Demande JB). Remplace, comme défaut du socle, « une seule branche `main` = site public » (Demande JB 2026-09-18, changelog du 2026-09-18). Porté depuis un site dérivé où le circuit a été éprouvé en production avec une équipe d'éditeurs novices.

## Contexte
Le socle publiait par une seule branche : l'envoi sur `main` mettait le site en ligne, l'aperçu local tenant lieu de préprod. Sur un site édité à plusieurs, par des novices en Claude Code (desktop ou session cloud), le client veut relire avant la production, sans Node sur le poste de l'éditeur. Vercel construit chaque branche à une adresse d'aperçu. Sur le site dérivé, une première version (branche `test` → `main` = production) a désynchronisé TEST et production dès que du développement partait directement sur `main` ; une branche `production` visible encombrait le menu des branches de Claude Code en ligne.

## Décision
- Trois lieux : l'aperçu de chaque branche de chantier, TEST (`main`, déploiement Preview Vercel, domaine rattaché à `main`), la production (le commit marqué par le tag `production`). Une seule branche durable : `main`.
- La production n'est construite QUE par l'action GitHub « Mise en ligne » (`.github/workflows/production.yml`, Vercel CLI `deploy --prod`) ; elle déplace le tag `production` et pose un tag daté `mise-en-ligne-AAAAMMJJ-HHMM` (historique, retour en arrière). Le skill `publier` la déclenche par l'API REST de GitHub, sur un oui explicite ; les éditeurs y ont droit.
- Dans Vercel, la branche de production est un nom de branche inexistant (`deploiement-par-action`) : aucun envoi git ne peut toucher la production, un envoi direct sur `main` n'est donc pas un risque.
- Une modification courte se fait directement sur TEST, envoyée sans confirmation ; une branche seulement pour un chantier, 2 au plus par personne, qui rejoint TEST par une fusion `--no-ff` après récapitulatif et oui (`envoyer-sur-test`).
- Vocabulaire avec les éditeurs : TEST, production, branche, aperçu ; jamais les termes git.
- Contrôles : léger avant chaque envoi ; construction complète par Vercel à chaque envoi, qui vaut contrôle avant TEST et avant la production.
- Article programmé : `pubDate` future, absent du build de production (`VERCEL_ENV=production`), filtre centralisé dans `src/lib/blog.ts` (`getPosts`, `getIndexablePosts`), seule porte d'accès à la collection `blog`. La même action reconstruit chaque jour à 04:00 UTC la production depuis le tag `production`.
- Identifiants Vercel hors du dépôt : secret `VERCEL_TOKEN`, variables de dépôt `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. Propriétaire et nom du dépôt déduits du remote dans les skills.
- Site sans Vercel : un seul environnement (`main` = site public), déclaré dans deploy.md et porté par les `projet.md` des skills de publication.

## Options écartées
- Branche `test` qui avance `main` (= production) : TEST et production divergent dès qu'un commit de développement part sur `main`.
- Branche `production` : visible dans le menu des branches de Claude Code en ligne, que l'on veut réduit à `main`.
- Tag `production` posé par Claude : la passerelle GitHub des sessions cloud refuse l'envoi de tags ; l'action le pose.
- Promotion d'un déploiement Vercel (« Promote to production ») : les éditeurs n'ont pas accès à Vercel.
- Mise en ligne branche par branche : on mettrait en ligne un état jamais vu sur TEST.
- Vercel Cron, ou fonction serveur, pour la publication programmée : demande une fonction serveur, interdit par la règle absolue 1.
- Commit quotidien automatique pour faire paraître les articles : historique pollué ; Deploy Hook Vercel : déploierait la branche de production Vercel, qui n'existe pas.
- Build local complet avant chaque envoi : la construction Vercel du même état le remplace, sans Node sur le poste de l'éditeur.

## Conséquences
- Règles : CLAUDE.md § Circuit de publication, § Seule commande ; mapping, invariants, réglages : `.claude/conventions/deploy.md` § Circuit ; mise en place : `.claude/checklists/bootstrap.md` ; procédures : skills `branches`, `envoyer-sur-test`, `publier`, `statut-mise-en-ligne`, `annuler-modification`, `verifier`, `comprendre-demande`, `integrer-article` ; garde-fous machine : `deny` de `.claude/settings.json`.
- Sites dérivés : ils héritent du circuit au prochain tirage du socle. Un site dérivé qui publie encore par `main` = production doit, au tirage, soit dérouler bootstrap.md § Circuit (réglages Vercel et GitHub), soit déclarer l'exception « un seul environnement » dans deploy.md et ses `projet.md` ; sinon les skills enverront les modifications courtes sur `main` sans confirmation (« TEST n'est pas public ») alors que Vercel y construit encore la production : elles partiraient en ligne sans récapitulatif ni oui.
- Contrôlable : `rg -n "getCollection\('blog'" src` ne renvoie que `src/lib/blog.ts` ; un envoi sur `main` produit un déploiement Vercel Preview, jamais Production ; `git ls-remote --tags origin production` désigne le commit en production.
