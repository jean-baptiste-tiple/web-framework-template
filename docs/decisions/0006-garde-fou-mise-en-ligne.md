# ADR 0006 : garde-fou déterministe avant la mise en ligne

## Statut
Accepté le 2026-11-13 (Demande JB : vulgarisation du socle au niveau du site dérivé Movinmotion, où ce garde-fou est en service depuis le 2026-11-05). Complète l'ADR 0002.

## Contexte
La mise en ligne passait par `gh api -X POST …/production.yml/dispatches`, autorisée sans confirmation dans `.claude/settings.json` : seul le skill `publier` demandait un oui (`AskUserQuestion`), consigne suivie au mieux par le modèle. Sur le site dérivé, deux constats : une vérification système est attendue hors des fichiers Markdown, et la commande `gh api …` affichée dans une fenêtre fait peur aux éditeurs.

## Décision
- **Une seule commande vers la production** : `npm run mettre-en-ligne` (`scripts/mettre-en-ligne.mjs`, qui lit le dépôt depuis `origin`, résout le commit de `main` ou le tag donné, déclenche l'action « Mise en ligne » et suit son résultat).
- **Règles `ask`** dans `.claude/settings.json` sur `npm run mettre-en-ligne`, `pnpm run mettre-en-ligne`, `node scripts/mettre-en-ligne.mjs` (et `gh api …/dispatches` en filet) : Claude Code ouvre sa fenêtre de confirmation à chaque fois. Cette fenêtre est le seul oui (`publier` § 2, `annuler-modification` en production).
- **Hook `PreToolUse`** (`.claude/hooks/mise-en-ligne.mjs`, outils Bash et PowerShell) : « ask » avec ce qui part sur la commande ci-dessus ; « deny » pour tout autre chemin vers la production (`gh workflow run`, `dispatches` direct, `vercel --prod`/`promote`/`rollback`, envoi de tags) et toute écriture dans les fichiers du garde-fou ; « allow » pour un envoi vers le site de test (`git push origin HEAD:main`) ou vers une branche, sans autre action : aucune fenêtre hors de la mise en ligne.
- **Règles `deny`** `Edit(.claude/settings.json)`, `Edit(.claude/settings.local.json)`, `Edit(.claude/hooks/**)`, `Edit(scripts/mettre-en-ligne.mjs)` : Claude ne modifie pas le garde-fou ; le développeur du site le change à la main.

## Options écartées
- Approbation obligatoire dans GitHub (environnement « production » avec relecteurs) : un clic de plus hors de Claude, refusé sur le site dérivé.
- Règle `ask` seule, sans hook : pas de récapitulatif, et les autres formes de commande passent.
- Garder `AskUserQuestion` en plus de la fenêtre : deux oui pour une seule action, l'éditeur ne sait plus lequel compte.

## Conséquences
- Sites dérivés : ils héritent du garde-fou au prochain tirage du socle ; un site qui l'a déjà (Movinmotion, ADR 0009) garde le sien.
- La fenêtre en session cloud ne montre pas toujours le récapitulatif du hook : c'est le texte de Claude juste avant qui le porte (`publier` § 2).
- Un fil de projet à plusieurs dépôts ne lit pas les réglages du dépôt (documentation Claude Code) : le garde-fou ne vaut que dans une session ouverte sur le dépôt du site.
- Contrôlable : `echo '{"tool_input":{"command":"gh workflow run production.yml"}}' | node .claude/hooks/mise-en-ligne.mjs` → `deny` ; `npm run mettre-en-ligne` → `ask` ; `git push origin HEAD:main` → `allow`.
