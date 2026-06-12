# /commit-push — Gate qualité + commit + push

Seule commande du projet. Vérifie tout, puis commit + push. Ne JAMAIS pusher sans passer ce gate.

## Étapes (dans l'ordre, s'arrêter au premier échec)
1. **Lint** : `pnpm run lint` (eslint, incl. plugin astro). Corriger les erreurs avant de continuer.
2. **Build + types + contenu** : `pnpm run build` (= `astro check && astro build`).
   - `astro check` valide TypeScript ET le frontmatter des collections contre les schémas Zod : un champ MD/MDX manquant ou mal typé casse ici. C'est la validation "les markdown n'ont pas d'erreur".
   - Le build doit passer entièrement.
3. **Finalisation docs** (si pas déjà fait) : component-registry, docs/changelog.md à jour. (llms.txt et sitemap.xml sont générés au build ; page bespoke ajoutée = la référencer dans llms.txt.ts et sitemap.xml.ts.)
4. **Commit** : message court et factuel (français), sur une branche (jamais committer directement sur main sans raison ; brancher si besoin).
5. **Push**.

## Règles
- Si lint ou build échoue : NE PAS committer. Réparer la cause, relancer le gate.
- Ne pas committer .env, dist/, node_modules.
- Ne pas utiliser --no-verify ni contourner un hook.
- Vérifs sites : rester 100% static (aucun adapter/SSR), 0 JS sur les pages sans interaction, liens/slugs/alt+dimensions images OK.
