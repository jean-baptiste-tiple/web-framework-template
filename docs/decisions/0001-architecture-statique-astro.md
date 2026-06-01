# ADR 0001 — Site statique Astro, pas d application

## Statut
Accepté.

## Contexte
Besoin : sites vitrines (blog, landings, pages), pas d app. Pas de serveur souhaité.

## Décision
Astro en output static, aucun adapter. Contenu en Content Collections Markdown/MDX typées. Interactivité via îlots SolidJS uniquement si nécessaire. Tailwind 4 pour le style (provisoire).

## Conséquences
+ Hébergement statique trivial, perf et SEO/GEO forts, surface d attaque minimale.
- Pas de logique serveur : formulaires via tiers (starter forms), pas de Server Actions.
