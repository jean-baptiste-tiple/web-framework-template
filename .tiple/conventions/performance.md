# Performance

- Objectif : 0 JS sur les pages sans interaction. Chaque îlot = un coût justifié.
- Images optimisées (astro:assets), dimensions fixées (CLS), lazy par défaut hors hero.
- Pas de gros script tiers sans nécessité. Polices : système par défaut (provisoire) ; si police custom, self-host + font-display: swap.
- Vérifier le récap de build (chunks JS) après chaque ajout d îlot.
