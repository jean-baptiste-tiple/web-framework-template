# Déploiement

- Build statique -> dist/. Aucun runtime.
- CI (.github/workflows/ci.yml) = pnpm build uniquement (astro check + build = gate).
- Hébergement : tout host statique (Vercel/Netlify/Cloudflare Pages/GitHub Pages). Brancher le repo.
- GitHub Pages : ajouter base dans astro.config si sous-chemin + workflow deploy. (Géré ultérieurement.)
- URL de prod : UNE seule fois, `site` dans astro.config — canonical, sitemap.xml, robots.txt, llms.txt, RSS et JSON-LD en dérivent tous.
- PUBLIC_FORM_ENDPOINT est inliné AU BUILD : le définir dans les variables d'environnement de build de l'hébergeur (pas seulement dans .env local).
