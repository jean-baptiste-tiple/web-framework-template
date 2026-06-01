# CLAUDE.md — Tiple Method (sites statiques)

## Style de réponse (CRITIQUE)
- Réponses courtes, droit au but. Le minimum de mots possibles.
- Pas de récap qui répète ce que l user vient de dire. Pas de tableaux décoratifs ni d emojis sauf si demandé.
- Pas de "voici ce que j ai fait", pas de phrases d intro/transition. État du résultat seulement.

## Avant de coder (CRITIQUE)
- Surfacer les hypothèses, pas les masquer. Si ambigu : nommer le doute, proposer, demander.
- Edits chirurgicaux. Chaque ligne tracée à la demande. Pas de cleanup ni refacto non demandé.
- Critères de succès vérifiables avant d implémenter.
- Push back quand une approche plus simple existe.

## Projet
<!-- Nom + description du site à remplir au bootstrap -->

## Stack
Astro 5 (output: static, AUCUN adapter serveur) + TypeScript strict + Tailwind CSS 4 (via @tailwindcss/vite).
Contenu : Content Collections (Markdown/MDX) typées par Zod.
Interactivité : par défaut AUCUN framework JS. Préférer le natif (<details>, <script> vanilla). SolidJS est un starter OPT-IN non installé par défaut : ne l'ajouter (`pnpm add @astrojs/solid-js solid-js` + intégration dans astro.config) qu'en cas de besoin réel d'interactivité riche.
Mono-langue par défaut : pas d'i18n dans le socle. L'i18n est un starter à réactiver si besoin (voir .tiple/conventions/i18n.md).
Voir .tiple/conventions/tech-stack.md pour les versions exactes.

## Méthode
Le projet suit la Tiple Method (variante sites). La doc dans docs/ est la source de vérité.
Lire les fichiers pertinents avant chaque action.

## Règles absolues
1. output: static. Ne JAMAIS introduire d adapter, de SSR, d API route dynamique, de Server Action ou de dépendance serveur. Tout doit être généré au build.
2. Zéro JS par défaut. Pas d îlot Solid sauf besoin réel d interactivité (state, events). Pousser client:* le plus bas possible et préférer client:visible / client:idle à client:load.
3. Le contenu éditorial vit en Markdown/MDX dans src/content/, JAMAIS en dur dans des composants. Présentation (composants/tokens) et contenu (.md) restent séparés.
4. Tout nouveau champ de contenu passe par un schéma Zod dans src/content.config.ts. Le typage du contenu EST le filet de sécurité (pas de tests).
5. SEO/JSON-LD passent TOUJOURS par BaseLayout. Ne pas dupliquer de balises meta dans une page.
6. Réutiliser les composants de src/components/ui/ avant d en créer un nouveau (voir component-registry).
7. Ne JAMAIS modifier un invariant d archi sans ADR dans docs/decisions/.
8. Mode cadrage (auto-détecté) = documentation uniquement. Aucune install, aucun fichier de code, aucun build pendant un cadrage.
9. DRY structurel (CRITIQUE) : tout archétype de page qui se répète avec la MÊME forme (cas clients, fiches produit, secteurs…) = UNE collection Zod + UN seul template/route, JAMAIS N pages .astro bespoke. Si tu écris deux fois la même structure, c est une collection. Le bespoke (.astro) est réservé à un design réellement unique (home).
10. Un seul framework JS par défaut : AUCUN. Préférer natif (<details>, <script> vanilla). Solid = starter opt-in.

## Modèle de contenu (décision structurante)
Principe : **1 fichier markdown par page** pour le texte de la page ; **1 fichier de réglages** pour le texte partagé entre pages. Éditer du texte = éditer ce seul fichier ; le design vit dans les composants + tokens.

Deux tiers de texte :
- Texte DE PAGE (titre, corps, FAQ propre) -> dans le .md/.mdx de la page.
- Texte GLOBAL/partagé (nom du site, nav, footer, organisation, réseaux, FAQ globale) -> src/content/settings/site.json, édité directement dans le fichier, lu par src/lib/site.ts (SITE). NE JAMAIS dupliquer ce texte dans une page.
- Config TECHNIQUE (URL prod, locale, logo, sameAs) -> src/lib/site.ts, dev uniquement.

Où va chaque contenu :
- Article de blog -> Markdown dans src/content/blog/ (collection blog). URL /blog/<slug>.
- Page éditoriale (à propos, mentions légales, FAQ, contact) -> Markdown dans src/content/pages/. URL racine /<slug>.
- Landing page -> MDX dans src/content/landings/ : frontmatter structuré (hero/sections/schema) + corps MDX. URL racine /<slug>. Exception : si design vraiment unique, page .astro bespoke dans src/pages/.
- Archétype répété (cas clients, fiches produit/capteurs, secteurs…) -> NOUVELLE collection dédiée (schéma Zod + une route templatisée). Voir règle absolue 9.
- Home -> .astro bespoke (src/pages/index.astro). Hérite SEO/JSON-LD de BaseLayout.
Routing : /blog/* et /index gagnent sur le catch-all racine [...slug].astro.

## Éditer le contenu à la main (guide humain)
Tout s'édite dans des fichiers texte, sans interface d'admin. Après édition : `npm run dev` pour prévisualiser (http://localhost:4321), puis `/commit-push` pour publier.

### Changer le TEXTE d'une page existante
Ouvrir le seul fichier de cette page et éditer le frontmatter (entre les `---`) et/ou le corps :
- Article : `src/content/blog/<slug>.md`
- Page (à propos, mentions…) : `src/content/pages/<slug>.md`
- Landing : `src/content/landings/<slug>.mdx` (les textes des sections sont dans le frontmatter `hero:` / `sections:`)
Le nom du fichier = l'URL (slug). Penser à bumper `updatedDate`.

### Changer le TEXTE GLOBAL (présent sur tout le site)
Éditer `src/content/settings/site.json` :
- `name`, `shortName`, `description` : identité du site (titre, meta par défaut).
- `nav` : liens du menu (header) — liste de `{ "label", "href" }`.
- `organizationName` : nom affiché dans le footer + JSON-LD.
- `social` : `twitter`, `linkedin`.
- `faq` : FAQ globale partagée (affichée via `<GlobalFaq />`).
Une seule modif ici → répercutée partout. Ne PAS recopier ces textes dans les pages.

### Réglages TECHNIQUES (rares, plutôt dev)
`src/lib/site.ts` : URL de prod (`url`), `locale`/`lang`, image OG par défaut, logo et `sameAs` de l'organisation. Penser à aligner `site:` dans `astro.config.mjs`.

### Créer une nouvelle page
- Nouvel article : créer `src/content/blog/<slug>.md`. Frontmatter minimum : `title`, `description`, `pubDate` (sinon le build échoue). Optionnels utiles : `updatedDate`, `author` (clé de `src/lib/authors.ts`, défaut `jb`), `tags`, `tldr`, `faq`.
- Nouvelle page éditoriale : créer `src/content/pages/<slug>.md`. Minimum : `title`, `description`.
- Nouvelle landing : créer `src/content/landings/<slug>.mdx`. Minimum : `title`, `description`, `hero.headline`. Sections via `sections:` (types : features/proof/faq/cta).
- Ajouter un lien vers la nouvelle page dans `nav` (site.json) si besoin.

### Auteurs
`src/lib/authors.ts` : ajouter une entrée `{ clé: { name, role?, url?, sameAs? } }`, puis référencer la clé dans `author:` d'un article.

### Images
Déposer l'image et la référencer via `heroImage:` (frontmatter) ; `alt` + dimensions obligatoires (anti-CLS). Voir conventions/images.md.

## Règles contenu / SEO / GEO
1. Tout contenu a title + description. description = 140-160 car., title <= 60 car.
2. Bumper updatedDate à CHAQUE modification de contenu (alimente dateModified JSON-LD + lastmod sitemap = signal de fraîcheur).
3. Remplir tldr (1-2 phrases factuelles, autonomes, citables par un LLM) sur articles et landings.
4. Renseigner faq dès que pertinent -> rendu visuel + JSON-LD FAQPage (rich results + GEO).
5. Titres Markdown sémantiques (un seul H1 = title, puis H2/H3). Phrases factuelles autonomes.
6. Images via astro:assets (heroImage dans le frontmatter, <Image/> dans les composants) : width/height (anti-CLS) + alt obligatoire.
7. Mettre à jour public/llms.txt quand on ajoute une page importante.
8. Vérifier le rendu du JSON-LD (Rich Results Test) sur tout nouveau type de page.

## Règles Astro
1. Tout est statique. AUCUN JS hydraté par défaut. Interactivité simple = <script> vanilla dans le .astro (cf. ContactForm.astro). Îlot Solid SEULEMENT après avoir installé le starter solid, et seulement si le natif/vanilla ne suffit pas.
2. Préférer le natif au JS : un accordéon = <details> (cf. Faq.astro), pas un composant hydraté.
3. Liens internes en chemins absolus (/blog/...). Slugs = nom de fichier (kebab-case).
4. Pas de couleurs en dur : utiliser les tokens CSS (var(--color-*)) / classes Tailwind sémantiques.
5. Un bloc visuel réutilisé = UN composant dans src/components/ui/ (ou landing/ pour les sections). Pas de copier-coller de markup entre pages.

## Avant push
Le push passe TOUJOURS par `/commit-push` (lint + astro check + build, puis commit + push). C'est le seul gate. Ne jamais committer .env, dist/, node_modules.

## Modes de travail (auto-détectés — AUCUNE commande à taper)
Détecter l'intention de la demande et appliquer le bon mode automatiquement. En cas d'ambiguïté : nommer le doute et demander.

### Cadrage (planification)
Déclencheurs : cadre/planifie/sitemap/content-model/architecture/structure/V2/refonte, ou site neuf sans docs.
**Documentation UNIQUEMENT** : modifier seulement docs/. JAMAIS installer, créer du code ni builder.
- Initial (docs/sitemap.md absent) : créer from scratch. Évolution (docs existants + V2/refonte) : éditer l'existant, ADR par invariant touché. Annoncer le mode.
- Déroulé : brief → sitemap (par page : type/URL/objectif/CTA/intention SEO ; trancher landing MDX vs .astro) → content-model (collections, champs Zod, taxonomie ; règle DRY : archétype répété = collection) → architecture (invariants + starters à activer) → design (tokens légers) → gate .tiple/checklists/site-ready.md. Templates : .tiple/templates/.

### Développement (code)
Déclencheurs : ajoute/implémente/corrige/refacto/explore. Sous-modes auto (si ambigu, priorité Explore > Refacto > Fix > Feature) :
- Fix (reproduire avant, diff minimal) · Feature (si non-trivial → cadrer d'abord) · Refacto (pas de changement de comportement) · **Explore (comprends/explique/analyse/audit = READ-ONLY, aucune écriture)**.
- Flow : lire refs + conventions pertinentes → implémenter (schéma Zod si nouveau type → composant ui/ → contenu .md/.mdx → route) → review (.tiple/checklists/code-review.md) → finaliser (component-registry, llms.txt, changelog) → `/commit-push`.

### Activation live des conventions & skills
- **Conventions** : toujours lire coding-standards + tech-stack + component-registry. En plus, charger AUTOMATIQUEMENT les conventions .tiple/conventions/ dont les tags matchent la demande ou les fichiers touchés (mapping dans .tiple/conventions/_index.md). Ne pas attendre qu'on le demande.
- **Skills** : invoquer le skill pertinent au bon moment, sans qu'on le nomme — ex. frontend-design quand on crée/peaufine de l'UI ; code-review avant un push important ; verify/run pour vérifier un rendu. Annoncer brièvement le skill utilisé.

## Seule commande : /commit-push
Le push passe TOUJOURS par `/commit-push` (lint + astro check + build = validation TS et frontmatter MD/MDX, puis commit + push). C'est le seul gate et la seule commande. Détail : .claude/commands/commit-push.md.

## Design System
Tokens neutres légers dans src/styles/global.css (@theme Tailwind 4). Le design system viendra plus tard : ne pas sur-investir le style. Réutiliser les composants src/components/ui/. Registry : .tiple/conventions/component-registry.md.

## Conventions par tags
Index : .tiple/conventions/_index.md. Base toujours lues : coding-standards.md, tech-stack.md, component-registry.md.
Tags : astro, content-collections, mdx, islands-solid, styling-tailwind, images, seo, geo, a11y, performance, i18n, forms, deploy.
