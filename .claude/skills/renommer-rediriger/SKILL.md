---
name: renommer-rediriger
description: Changer l'adresse (URL) d'une page, supprimer une page, ou envoyer une ancienne adresse vers une nouvelle, sans casser les liens ni le référencement. À déclencher quand l'utilisateur dit « change l'adresse de la page… », « renomme l'URL », « supprime / retire cette page », « redirige X vers Y », « ce lien ne marche plus ».
---

# Renommer, supprimer, rediriger

> Surcouche du site : si `projet.md` existe dans ce dossier, le lire MAINTENANT ; il prime sur ce fichier.

## Traduire la demande
Le nom du fichier est l'adresse : `src/content/<collection>/<slug>.md` → `/<slug>` (ou `/blog/<slug>`). Renommer l'un change l'autre, et casse les liens déjà partagés si rien ne redirige.
Annoncer : ancienne adresse → nouvelle adresse (ou page de destination après suppression).

## Faire
1. Renommer avec `git mv` (garde l'historique) ; le nouveau slug ne doit exister ni dans les collections ni dans les routes de `src/pages/`.
2. Redirection ancienne → nouvelle : bloc `redirects` d'`astro.config.mjs`, source unique (`.claude/conventions/deploy.md`).
3. Liens internes : chercher l'ancien slug dans `src/` (menu et pied de page compris, `src/content/settings/site.json`) ; corriger chaque occurrence.
4. Suppression : retirer le fichier ET rediriger son adresse vers la page la plus proche ; le dire si c'est l'accueil.
5. Page sur mesure (`src/pages/*.astro`) : la retirer aussi de `BESPOKE` dans `src/pages/sitemap.xml.ts` et de `src/pages/llms.txt.ts`.
6. Fichier de collection renommé ou supprimé : `rm -rf node_modules/.astro dist` avant le build (sinon le cache rend une page fantôme, `.claude/commands/commit-push.md`).

## Garde-fous
- Toujours une redirection pour une adresse qui a pu être indexée ou partagée.
- La redirection d'Astro est une page de renvoi ; pour une adresse qui compte en référencement, doubler d'une vraie 301/308 chez l'hébergeur (`.claude/conventions/deploy.md`).
- Alias `/about` et `/privacy` : déclarés dans `astro.config.mjs` ET `vercel.json` ; renommer leur cible = mettre à jour les deux.

## Rendre compte
« /ancienne mène désormais à /nouvelle ; <n> liens internes corrigés. » Puis `verifier` et `publier`.

## Hors périmètre
Changer la forme des adresses d'une collection entière (`/blog/…` → `/articles/…`) : routage, c'est du développement.
