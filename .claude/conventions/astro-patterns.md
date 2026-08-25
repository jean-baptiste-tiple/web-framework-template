# Astro patterns

- Pages = routing fichier dans src/pages/. Une page = un BaseLayout + des composants.
- Collections rendues via getCollection + render(entry) (Astro 5 : import { render } from "astro:content"). Pas entry.render().
- getStaticPaths : params.slug = entry.id (Astro 5, sans extension).
- Routing racine : [...slug].astro sert landings + pages. /blog/* et /index gagnent (routes plus spécifiques prioritaires). Ne pas ajouter un second catch-all racine.
- Filtrer les brouillons : getCollection("blog", ({data}) => !data.draft).
- Pas de meta en dur dans une page : passer par BaseLayout (meta, type, faq, breadcrumbs).
