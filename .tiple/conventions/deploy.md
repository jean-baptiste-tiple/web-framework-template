# Déploiement

- Build statique -> dist/. Aucun runtime.
- CI (.github/workflows/ci.yml) = pnpm build uniquement (astro check + build = gate).
- Hébergement : tout host statique (Vercel/Netlify/Cloudflare Pages/GitHub Pages). Brancher le repo.
- GitHub Pages : ajouter base dans astro.config si sous-chemin + workflow deploy. (Géré ultérieurement.)
- Vérifier que site (astro.config) = URL de prod avant build (sitemap/canonical/RSS en dépendent).
