# SEO & GEO

## SEO
- Une page = un title (<= 60 car.) + une description (140-160 car.). Override via seo.* dans le frontmatter.
- Canonical auto (resolveSeo) : URL absolue AVEC slash final (= URL servie et sitemap, une seule forme déclarée). noindex via seo.noindex (exclut aussi du sitemap et de llms.txt).
- JSON-LD via JsonLd.astro (graph : Organization + WebSite toujours ; BlogPosting/WebPage/Service ou Product ; FAQPage ; BreadcrumbList). dateModified : updatedDate (articles + pages).
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
