# Content model (template)
Source de vérité : src/content.config.ts.
- blog (md) : title, description, pubDate, updatedDate?, author, category?, tags[], topics[], heroImage?+heroImageAlt (alt requis si image), tldr?, faq?, draft.
- pages (md) : title, description, updatedDate?, tldr?, faq?.
- landings (mdx) : title, description, updatedDate?, tldr?, topics[], hero{... image?+imageAlt}, sections[features|proof|faq|cta], schema{Service|Product}.
- settings/site.json : texte global (name, nav, organizationName, social, faq) — validé par Zod dans src/lib/site.ts.
Règles : title<=60, description 140-160, tldr 1-2 phrases, faq si pertinent, bumper updatedDate (dateModified JSON-LD + lastmod sitemap).
