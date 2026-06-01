# SEO & GEO

## SEO
- Une page = un title (<= 60 car.) + une description (140-160 car.). Override via seo.* dans le frontmatter.
- Canonical auto (resolveSeo). noindex via seo.noindex.
- JSON-LD via JsonLd.astro (graph : Organization + WebSite toujours ; BlogPosting/WebPage/Service ; FAQPage ; BreadcrumbList).
- sitemap (lastmod = updatedDate) + rss.xml + robots.txt.
- Un seul H1 par page (= title). H2/H3 sémantiques.
- Bumper updatedDate à chaque MAJ (fraîcheur).

## GEO (moteurs génératifs)
- tldr : 1-2 phrases factuelles autonomes, citables hors contexte. Rendu visuel + sert de résumé.
- faq : questions/réponses autonomes -> JSON-LD FAQPage + bloc lisible. Fort levier d extraction.
- topics : entités/sujets explicites dans le frontmatter.
- public/llms.txt : index lisible des pages clés + résumés. Maintenir à jour.
- Phrases déclaratives, sourcées, sans dépendance au contexte visuel.
