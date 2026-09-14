# Performance

- Objectif : 0 JS sur les pages sans interaction. Chaque îlot = un coût justifié.
- Images optimisées (astro:assets), dimensions fixées (CLS), lazy par défaut hors hero.
- Pas de gros script tiers sans nécessité. Polices : système par défaut (provisoire) ; si police custom, self-host + font-display: swap.
- Embed tiers lourd (YouTube…) : façade — miniature + bouton play focusable, l'iframe n'est chargée qu'au clic (0 JS tiers au chargement). Un seul embed lourd par page.
- Scripts tiers (analytics, tag manager) : inclus UNIQUEMENT en build de production réelle, via le layout, en is:inline — jamais en dev ni en préprod (stats polluées).
- Vérifier le récap de build (chunks JS) après chaque ajout d îlot.

## Lighthouse (seuils contrôlés)
- LCP : l'image hero (au-dessus de la ligne de flottaison) porte `loading="eager"` + `fetchpriority="high"` — `<Image>` d'astro:assets est lazy par défaut, ce défaut est FAUX pour le hero. Toutes les autres images restent lazy. Une seule image eager par page.
- Audit local : `pnpm run audit:lh` (`scripts/audit-lh.mjs` : sert `dist/`, lance et ferme son propre Chrome, lit URL et seuils dans `lighthouserc.json` — seule source à éditer). Seuils : performance, accessibility, best-practices, seo ≥ 0.95 — tableau page × catégorie et code de sortie 1 sinon. À lancer avant toute mise en prod (deploy.md) et après tout changement de layout/îlot/hero ; pas dans le gate /commit-push (trop lent pour chaque push, arbitrage assumé).
- Ce que Lighthouse mesure en local ne couvre pas le host : compression (brotli/gzip), cache immutable sur /_astro/*, HTTP/2+ et redirections sans chaîne se vérifient sur l'URL déployée (deploy.md).
