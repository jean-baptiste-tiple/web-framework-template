# Déploiement

- Build statique -> dist/. Aucun runtime.
- Gate avant tout déploiement : lint + astro check + build + audits (liens morts, images sans dimensions, meta manquantes) — jamais `build` seul. CI : .github/workflows/ci.yml.
- Hébergement : tout host statique (Vercel/Netlify/Cloudflare Pages/GitHub Pages/CDN de stockage). Brancher le repo.
- Mapping branche → environnement déclaré EXPLICITEMENT ici (ex. `main` → préprod, `production` → prod). Sur un host de stockage statique, pas de preview par branche/PR : conséquence assumée.
- Mise en production = validation humaine explicite et informée : récapituler ce qui part en prod (`git log production..main`) et obtenir AVANT le push une validation sans ambiguïté sur ce récap — pas un « vas-y » en passant.
- Préprod servant le même build que la prod : ses canonical pointent vers la prod (voulu) ; la préprod ne doit PAS être indexée — header `X-Robots-Tag: noindex` posé côté host/CI. Ne PAS copier cette étape dans le workflow de production.
- Si CDN : purger le cache après le sync, sinon l'ancien build reste servi.
- Vérifier un déploiement : le run CI EST le déploiement (étapes sync + purge vertes = en ligne) ; contre-vérifier par `curl -sI` sur l'URL. « Prod ou préprod ? » se répond en lisant la branche déployée.
- Redirections : SOURCE UNIQUE = bloc `redirects` d'astro.config.mjs. En `output: static`, cela génère des stubs meta-refresh (200) : doubler de vraies 301 côté host/CDN si le référencement compte. En migrant d'hébergeur, supprimer la config de l'ancien (jamais deux sources de vérité).
- URL de prod : UNE seule fois, `site` dans astro.config — canonical, sitemap.xml, robots.txt, llms.txt, RSS et JSON-LD en dérivent tous.
- Secrets/variables d'env requis par la CI : listés ici, jamais commités. Distinguer ceux inlinés AU BUILD (ex. PUBLIC_FORM_ENDPOINT — à définir dans l'env de build de l'hébergeur, pas seulement en .env local) de ceux d'outillage.
