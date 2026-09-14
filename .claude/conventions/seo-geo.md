# SEO & GEO

## SEO
- Une page = un title (<= 60 car.) + une description (140-160 car.). Override via seo.* dans le frontmatter.
- Canonical auto (resolveSeo) : URL absolue AVEC slash final (= URL servie et sitemap, une seule forme déclarée). noindex via seo.noindex (exclut aussi du sitemap et de llms.txt).
- JSON-LD via JsonLd.astro (graph : Organization + WebSite toujours ; BlogPosting/WebPage/Service ou Product ; FAQPage ; BreadcrumbList). dateModified : updatedDate (articles + pages).
- BreadcrumbList : émis par JsonLd dès que `breadcrumbs` est passé à BaseLayout (`{ name, url }[]` → `ListItem` + `position` 1..n). C'est la PAGE qui construit le fil, en URL ABSOLUES (`new URL('/blog/<slug>/', SITE.url).href`, slash final comme le canonical) — cf. src/pages/[...slug].astro et src/pages/blog/[...slug].astro. Une section visuelle de fil d'Ariane (famille `nav/breadcrumb-*` du kit) n'émet AUCUN JSON-LD, par la règle absolue 5 et parce qu'une section ignore l'URL absolue : la poser sur une page n'exonère pas de passer `breadcrumbs` au layout, et ne le duplique pas non plus.
- sitemap.xml : route custom src/pages/sitemap.xml.ts — lastmod par page = updatedDate (pubDate en repli pour le blog). Nouvelle page .astro bespoke = à ajouter dans BESPOKE.
- rss.xml + robots.txt (généré, URL depuis astro.config).
- Un seul H1 par page (= title). H2/H3 sémantiques.
- Bumper updatedDate à chaque MAJ (fraîcheur).
- Préprod : canonical vers la prod (même build, voulu) + noindex posé côté host (X-Robots-Tag) — jamais laissée indexable (duplicate content). Voir deploy.md.
- Renommage/suppression d'URL : redirection déclarée dans la source unique (bloc redirects d'astro.config) + vraie 301 côté host/CDN si le référencement compte — les stubs meta-refresh du statique ne transmettent pas le jus.

## GEO (moteurs génératifs)
- tldr : 1-2 phrases factuelles autonomes, citables hors contexte. Rendu visuel + sert de résumé.
- faq : questions/réponses autonomes -> JSON-LD FAQPage + bloc lisible. Fort levier d extraction.
- topics : entités/sujets explicites dans le frontmatter.
- llms.txt : GÉNÉRÉ au build (src/pages/llms.txt.ts) depuis titres/descriptions/tldr des collections. Pages bespoke : à ajouter à la main dans la route.
- Phrases déclaratives, sourcées, sans dépendance au contexte visuel.

## Agentic readiness (agents IA comme visiteurs)
Un site de contenu statique passe la plupart des checks par construction (0 JS = contenu lisible sans JavaScript, règles absolues 1-2 — ne rien redire ici). Ce qui reste à tenir :
- llms.txt dit QUAND utiliser le site : section « Quand utiliser ce site » alimentée par `whenToUse` (site.json) — cas d'usage concrets, pas de marketing. Bootstrap : la renseigner.
- robots.txt n'exclut AUCUN crawler IA (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot…) : le `User-agent: * / Allow: /` généré les couvre ; un blocage ciblé = décision explicite (ADR), jamais un copier-coller de blocklist.
- 404 réelle : un chemin inexistant renvoie le statut HTTP 404 (pas un 200 avec l'app shell). En statique c'est le HOST qui décide (la page src/pages/404.astro existe) — contrôle post-déploiement : `curl -s -o /dev/null -w "%{http_code}" <domaine>/chemin-inexistant` doit afficher 404. Voir deploy.md.
- Mesure : `npx is-agentic <domaine> --json` après mise en ligne (rapport public, rescans espacés de 6 h+ — skill installé : .claude/skills/is-agentic/SKILL.md, avec API et gotchas). Objectif : zéro issue tier `essential`. Les checks orientés produit/API (OAuth scopes, rate-limit headers, serveur MCP, OpenAPI) sont N/A pour un site de contenu et ne comptent pas contre le score — ne PAS construire d'API/MCP pour un point de score (règle absolue 1).
