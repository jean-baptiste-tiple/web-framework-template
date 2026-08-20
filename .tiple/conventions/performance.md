# Performance

- Objectif : 0 JS sur les pages sans interaction. Chaque îlot = un coût justifié.
- Images optimisées (astro:assets), dimensions fixées (CLS), lazy par défaut hors hero.
- Pas de gros script tiers sans nécessité. Polices : système par défaut (provisoire) ; si police custom, self-host + font-display: swap.
- Embed tiers lourd (YouTube…) : façade — miniature + bouton play focusable, l'iframe n'est chargée qu'au clic (0 JS tiers au chargement). Un seul embed lourd par page.
- Scripts tiers (analytics, tag manager) : inclus UNIQUEMENT en build de production réelle, via le layout, en is:inline — jamais en dev ni en préprod (stats polluées).
- Vérifier le récap de build (chunks JS) après chaque ajout d îlot.
