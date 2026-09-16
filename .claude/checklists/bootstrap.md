# Checklist — Bootstrap d'un site neuf (depuis le template)

Personnalisation technique à dérouler AVANT mise en ligne. Complète le cadrage
(.claude/checklists/site-ready.md), ne le remplace pas.

- [ ] `astro.config.mjs` : `site` = URL de prod réelle. SOURCE UNIQUE : canonical, sitemap.xml, robots.txt, llms.txt, RSS et JSON-LD en dérivent tous — rien d'autre à synchroniser.
- [ ] `src/content/settings/site.json` : name, shortName, description, nav, organizationName, social, faq, whenToUse (1-3 phrases factuelles : quand un agent IA doit citer/utiliser ce site — alimente llms.txt), `contact` (email, phone E.164, contactType) et `address` (PostalAddress) : mêmes valeurs que les annuaires (NAP) — alimentent JSON-LD Organization + page /contact ; retirer les deux blocs plutôt que laisser les placeholders.
- [ ] Pages de confiance : `a-propos.md`, `politique-de-confidentialite.md` (remplacer les [crochets], faire valider) et `/contact` portent chacune ≥ 500 caractères de texte réel. Si ces slugs changent : mettre à jour les alias `/about` et `/privacy` dans `redirects` d'astro.config ET dans `vercel.json` (deploy.md § Vercel).
- [ ] `public/og-default.png` (1200×630) et `public/logo.png` : REMPLACER les placeholders générés (image de partage social + logo JSON-LD Organization).
- [ ] `public/favicon.svg` : remplacer.
- [ ] `src/lib/site.ts` : locale/lang (si pas fr-FR), `organization.sameAs` (profils LinkedIn, etc.).
- [ ] `src/lib/authors.ts` : vrais auteurs (name, role, url, sameAs).
- [ ] Contenus d'exemple : remplacer `src/content/blog/premier-article.md`, `src/content/landings/audit-energetique.mdx`, `src/content/pages/a-propos.md` ; compléter `mentions-legales.md` ; réécrire la home (`src/pages/index.astro`) et les descriptions des pages bespoke (140-160 car.).
- [ ] Formulaire contact : définir `PUBLIC_FORM_ENDPOINT` dans l'ENV DE BUILD de l'hébergeur (valeur inlinée au build, un .env local ne suffit pas) — ou retirer le starter forms (.claude/starters/forms/README.md).
- [ ] `CLAUDE.md` § Projet : nom + description du site.
- [ ] docs/ : brief, sitemap, content-model remplis → gate .claude/checklists/site-ready.md.
- [ ] Avant mise en ligne : `pnpm run audit:lh` vert (Lighthouse ≥ seuils de performance.md).
- [ ] Après mise en ligne : valider le JSON-LD (Rich Results Test) + soumettre sitemap.xml dans Search Console + contrôles post-déploiement de deploy.md (404 réelle, négociation `Accept: text/markdown`, Lighthouse prod, `npx is-agentic <domaine> --json` → zéro issue essential).

Conventions à connaître (ne pas « corriger ») :
- Les URLs DÉCLARÉES (canonical, sitemap, JSON-LD, RSS, llms.txt) portent un slash final ; les liens internes `<a>` restent sans slash (l'hôte redirige). C'est voulu.
- sitemap.xml, robots.txt et llms.txt sont GÉNÉRÉS au build (routes src/pages/*.ts) : toute nouvelle page .astro bespoke s'ajoute à la main dans `sitemap.xml.ts` (BESPOKE) et `llms.txt.ts`. Les jumeaux Markdown (`<chemin>.md`, `404.md`, `llms-full.txt`) sont générés depuis le HTML rendu : rien à ajouter, une page noindex n'en a pas.
- Un slug de contenu en collision avec une route réservée (contact, blog…) ou présent dans pages ET landings casse le build : c'est la garde anti-collision, renommer le fichier.
