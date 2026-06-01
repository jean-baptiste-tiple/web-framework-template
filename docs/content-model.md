# Content model (template)
Source de vérité : src/content.config.ts.
- blog (md) : title, description, pubDate, updatedDate?, author, category?, tags[], topics[], heroImage?, tldr?, faq?, draft.
- pages (md) : title, description, updatedDate?, tldr?, faq?.
- landings (mdx) : title, description, tldr?, topics[], hero{}, sections[features|proof|faq|cta], schema{Service|Product}.
Règles : title<=60, description 140-160, tldr 1-2 phrases, faq si pertinent, bumper updatedDate.
