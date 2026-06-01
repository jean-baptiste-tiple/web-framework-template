# Content collections / MDX

## Règle DRY (la plus importante)
Tout archétype de page qui se répète avec la même forme = UNE collection + UN template. Test : « est-ce que j'aurais 2+ pages avec les mêmes champs ? » → oui ⇒ collection (jamais des .astro copiés-collés). Exemples typiques : cas clients, fiches produit/capteurs, pages secteur. Le bespoke .astro est réservé à un design unique (home).

## Principes
- Tout type de contenu = une collection dans src/content.config.ts avec un schéma Zod. Champ obligatoire manquant = build cassé (volontaire). JAMAIS de `any` côté rendu : typer via `CollectionEntry<'x'>` (cf. [...slug].astro, SectionRenderer.astro).
- Blocs Zod réutilisables (seoSchema, faqSchema) factorisés en tête de content.config.ts : un nouveau type de page réutilise ces blocs, ne les redéfinit pas.
- 1 fichier markdown par page. heroImage/hero.image via image() (validation + optimisation).
- Frontmatter minimal commun : title, description. Plus : tldr, faq, updatedDate (SEO/GEO).
- Slug = nom de fichier (kebab-case).

## Collections du socle
- Blog : Markdown, src/content/blog/. Pages : Markdown, src/content/pages/. Landings : MDX, src/content/landings/.
- Landing = page-builder léger : sections[] (union discriminée par type) + corps MDX optionnel. Ajouter un type de section = l'ajouter au schéma ET à SectionRenderer.astro (un seul endroit pour le markup de chaque section).

## Texte global vs texte de page
- Texte partagé (nom, nav, footer, organisation, réseaux, FAQ globale) = src/content/settings/site.json, lu par src/lib/site.ts (SITE). Édité directement dans le fichier. NE PAS dupliquer dans les pages ; consommer SITE.
- FAQ globale : SITE.faq, rendue via GlobalFaq.astro (réutilise Faq.astro). FAQ propre à une page : dans son frontmatter.

## Ajouter une nouvelle collection (archétype répété)
1. Schéma Zod dans content.config.ts (réutiliser seoSchema/faqSchema ; champs structurés répétés en blocs).
2. UNE route templatisée (getStaticPaths) typée via CollectionEntry — pas de page par entrée.
3. Composants de présentation réutilisables (pas de markup en double).
4. Mettre à jour component-registry + docs/content-model.
