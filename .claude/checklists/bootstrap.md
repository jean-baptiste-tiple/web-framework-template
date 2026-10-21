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
- [ ] Circuit branches → TEST → production (deploy.md § Circuit, ADR 0002), dans l'ordre :
  1. Projet Vercel importé depuis le dépôt GitHub ; commande de build = `rm -f node_modules/.astro/data-store.json && pnpm astro build` (deploy.md § Vercel) ; protection « Vercel Authentication » désactivée (Settings > Deployment Protection) pour que les relecteurs ouvrent TEST et les aperçus sans compte Vercel.
  2. Branche de production Vercel = `deploiement-par-action`, nom d'une branche qui n'existera pas : Vercel exige qu'elle existe au moment du réglage, donc la créer (`git push origin origin/main:refs/heads/deploiement-par-action`), enregistrer le réglage (Settings > Environments > Production > Branch Tracking), puis la supprimer (`git push origin --delete deploiement-par-action`) ; le réglage persiste. Contrôle : un envoi sur `main` produit un déploiement de type Preview, jamais Production.
  3. Domaine TEST rattaché à `main` (Settings > Domains, ajouter le domaine, « Git branch » = `main`), par ex. `<projet>-test.vercel.app` ou `test.<domaine>`. Domaine de production = celui de `site` dans astro.config, rattaché sans branche.
  4. `CLAUDE.md` § Projet : adresses TEST, modèle d'aperçu, relecteurs.
  5. Réglages du dépôt GitHub (Settings > Secrets and variables > Actions) : secret `VERCEL_TOKEN` (jeton créé sur vercel.com/account/tokens, portée = l'équipe du projet) ; variables `VERCEL_ORG_ID` et `VERCEL_PROJECT_ID` (`orgId` et `projectId` de `.vercel/project.json` après `vercel link`).
  6. Première mise en ligne : lancer l'action « Mise en ligne » (onglet Actions, « Run workflow », ou skill `publier`) ; elle pose le tag `production`, que la reconstruction quotidienne de 04:00 UTC lit. Contrôles : `git ls-remote --tags origin production` non vide ; le déploiement Production de Vercel porte le commit de `main`.
  7. Indexation : dans `vercel.json`, remplacer `example.com` (route `missing` host) par le domaine public ; puis `curl -sI <adresse TEST>/` porte `x-robots-tag: noindex`, `curl -sI <production>/` non (deploy.md § Circuit, Accès et indexation).
  8. Sessions cloud (si des éditeurs travaillent depuis claude.ai/code) : application GitHub « Claude » installée sur le dépôt ; environnement cloud en accès réseau « Custom » = liste « Trusted » + `*.vercel.app` + domaines propres de TEST et de la production ; par personne, compte GitHub invité sur le dépôt avec droit d'écriture.
- [ ] Avant mise en ligne : `pnpm run audit:lh` vert (Lighthouse ≥ seuils de performance.md).
- [ ] Après mise en ligne : valider le JSON-LD (Rich Results Test) + soumettre sitemap.xml dans Search Console + contrôles post-déploiement de deploy.md (404 réelle, négociation `Accept: text/markdown`, Lighthouse prod, `npx is-agentic <domaine> --json` → zéro issue essential).

Conventions à connaître (ne pas « corriger ») :
- Les URLs DÉCLARÉES (canonical, sitemap, JSON-LD, RSS, llms.txt) portent un slash final ; les liens internes `<a>` restent sans slash (l'hôte redirige). C'est voulu.
- sitemap.xml, robots.txt et llms.txt sont GÉNÉRÉS au build (routes src/pages/*.ts) : toute nouvelle page .astro bespoke s'ajoute à la main dans `sitemap.xml.ts` (BESPOKE) et `llms.txt.ts`. Les jumeaux Markdown (`<chemin>.md`, `404.md`, `llms-full.txt`) sont générés depuis le HTML rendu : rien à ajouter, une page noindex n'en a pas.
- Un slug de contenu en collision avec une route réservée (contact, blog…) ou présent dans pages ET landings casse le build : c'est la garde anti-collision, renommer le fichier.
