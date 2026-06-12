# Checklist — Bootstrap d'un site neuf (depuis le template)

Personnalisation technique à dérouler AVANT mise en ligne. Complète le cadrage
(.tiple/checklists/site-ready.md), ne le remplace pas.

- [ ] `astro.config.mjs` : `site` = URL de prod réelle. SOURCE UNIQUE : canonical, sitemap.xml, robots.txt, llms.txt, RSS et JSON-LD en dérivent tous — rien d'autre à synchroniser.
- [ ] `src/content/settings/site.json` : name, shortName, description, nav, organizationName, social, faq.
- [ ] `public/og-default.png` (1200×630) et `public/logo.png` : REMPLACER les placeholders générés (image de partage social + logo JSON-LD Organization).
- [ ] `public/favicon.svg` : remplacer.
- [ ] `src/lib/site.ts` : locale/lang (si pas fr-FR), `organization.sameAs` (profils LinkedIn, etc.).
- [ ] `src/lib/authors.ts` : vrais auteurs (name, role, url, sameAs).
- [ ] Contenus d'exemple : remplacer `src/content/blog/premier-article.md`, `src/content/landings/audit-energetique.mdx`, `src/content/pages/a-propos.md` ; compléter `mentions-legales.md` ; réécrire la home (`src/pages/index.astro`) et les descriptions des pages bespoke (140-160 car.).
- [ ] Formulaire contact : définir `PUBLIC_FORM_ENDPOINT` dans l'ENV DE BUILD de l'hébergeur (valeur inlinée au build, un .env local ne suffit pas) — ou retirer le starter forms (.tiple/starters/forms/README.md).
- [ ] `CLAUDE.md` § Projet : nom + description du site.
- [ ] docs/ : brief, sitemap, content-model remplis → gate .tiple/checklists/site-ready.md.
- [ ] Après mise en ligne : valider le JSON-LD (Rich Results Test) + soumettre sitemap.xml dans Search Console.

Conventions à connaître (ne pas « corriger ») :
- Les URLs DÉCLARÉES (canonical, sitemap, JSON-LD, RSS, llms.txt) portent un slash final ; les liens internes `<a>` restent sans slash (l'hôte redirige). C'est voulu.
- sitemap.xml, robots.txt et llms.txt sont GÉNÉRÉS au build (routes src/pages/*.ts) : toute nouvelle page .astro bespoke s'ajoute à la main dans `sitemap.xml.ts` (BESPOKE) et `llms.txt.ts`.
- Un slug de contenu en collision avec une route réservée (contact, blog…) ou présent dans pages ET landings casse le build : c'est la garde anti-collision, renommer le fichier.
