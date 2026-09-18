# /commit-push — Gate qualité + commit + push

Seule commande du projet. Vérifie tout, puis commit + push. Ne JAMAIS pusher sans passer ce gate.

## Étapes (dans l'ordre, s'arrêter au premier échec)
1. **Lint** : `pnpm run lint` (eslint, incl. plugin astro). Corriger les erreurs avant de continuer.
2. **Build + types + contenu** : `pnpm run build` (= `astro check && astro build`). Si un fichier de collection a été supprimé ou renommé depuis le dernier build : `rm -rf node_modules/.astro dist` d'abord (le cache `data-store.json` garde l'entrée et le build rend une page fantôme, docs/learnings.md 2026-09-14).
   - `astro check` valide TypeScript ET le frontmatter des collections contre les schémas Zod : un champ MD/MDX manquant ou mal typé casse ici. C'est la validation "les markdown n'ont pas d'erreur".
   - Le build doit passer entièrement.
3. **Finalisation docs** (si pas déjà fait) : component-registry, docs/changelog.md à jour pour un travail sur le site (code, règles, structure) ; une édition de contenu seule (texte, article, image) se trace par son message de commit. (llms.txt et sitemap.xml sont générés au build ; page bespoke ajoutée = la référencer dans llms.txt.ts et sitemap.xml.ts.)
4. **Commit** : message court et factuel (français), sur `main`, branche unique synchronisée avec le site public (conventions/deploy.md) : le push qui suit EST la mise en ligne. N'ajouter que les fichiers de la demande (`git add <fichiers>`, jamais `-A` ni `.`) : l'arbre de travail peut porter le travail en cours d'une autre session.
5. **Push**.

## Règles
- Si lint ou build échoue : NE PAS committer. Réparer la cause, relancer le gate.
- Ne pas committer .env, dist/, node_modules.
- Ne pas utiliser --no-verify ni contourner un hook.
- Vérifs sites : rester 100% static (aucun adapter/SSR), 0 JS sur les pages sans interaction, liens/slugs/alt+dimensions images OK.
