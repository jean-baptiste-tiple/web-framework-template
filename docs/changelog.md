# Changelog

## 2026-09-13 — Header/Footer en variantes de section (chrome)
- `src/components/ui/Header.astro` et `Footer.astro` deviennent des variantes au format du kit : `src/components/sections/nav/HeaderSimple.astro` + `.schema.ts` (`nav.header-simple` : `brand`, `nav[]`) et `nav/FooterSimple.astro` + `.schema.ts` (`nav.footer-simple` : `organizationName`, `links[]`). Prop unique `section`, aucun `SITE` importé dans le composant : une variante portée du kit (`nav.header-cta`, `nav.footer-columns`…) se branche par une ligne d'import.
- `src/lib/chrome.ts` (nouveau) : `SITE_HEADER` / `SITE_FOOTER` construits depuis `SITE` (site.json). `BaseLayout` rend `<HeaderSimple section={SITE_HEADER} />` / `<FooterSimple section={SITE_FOOTER} />` — changer de variante = changer l'import + l'objet, rien d'autre. `site.ts` reste pur (settings), sans dépendance vers les schémas de composants.
- Registre : les deux variantes sont dans `SECTION_REGISTRY` avec `chrome: true`. Elles sont prévisualisables et galerisées (2 exemples ajoutés à /styleguide, marqués « chrome »), mais `sectionSchema` — l'union offerte aux collections — les EXCLUT : un `type: nav.header-simple` dans un `sections:` casse `astro check` (« Invalid discriminator value. Expected 'offer.features-grid' | 'proof.testimonials-grid' | 'content.faq-accordion' | 'convert.cta-banner' »). Exclusion dérivée du marqueur (`ChromeType`/`PageSectionType`), aucune liste à tenir.
- Vérifié : HTML des 8 pages générées identique au pré-refacto une fois les espaces retirés (seule différence : le nœud d'espace entre les deux liens du footer, désormais rendus par `.map()` ; sans effet visuel, conteneur flex) ; bundle CSS au hash inchangé (`_slug_.wpMT9PBx.css`) = aucune classe Tailwind modifiée ; sitemap/llms.txt/rss/robots inchangés ; lint + astro check + build verts.
- Le `Record<SectionType, …>` de /styleguide couvre aussi le chrome : retirer un exemple `nav.*` casse `astro check` (ts 2741), vérifié.

## 2026-09-13 — Sections extensibles par variante (registre unique)
- Les 4 sections jusque-là en markup inline dans `SectionRenderer.astro` deviennent des composants autonomes `src/components/sections/<famille>/<Variante>.astro` + `<Variante>.schema.ts` (fragment Zod), au format de type `<famille>.<variante>` de la taxonomie du kit : `offer.features-grid`, `proof.testimonials-grid`, `content.faq-accordion`, `convert.cta-banner`.
- `src/lib/sections.ts` : registre unique `{ [type]: { schema, component } }`. `content.config.ts` en DÉRIVE l'union discriminée `sections` (plus de types redéclarés) ; `SectionRenderer.astro` n'est plus qu'une table type → composant (zéro markup, zéro chaîne de `section.type === …`). Ajouter une section du kit = un dossier + une entrée.
- La collection `pages` gagne le même `sections:` optionnel, rendu sous le corps Markdown par `src/pages/[...slug].astro`. Landing inchangée.
- `/styleguide` rend un exemple par variante ; son `Record<SectionType, …>` casse `astro check` si une variante ajoutée n'a pas d'exemple. Registry et content-patterns mis à jour.
- Vérifié : HTML de `/audit-energetique` identique au pré-refacto (hors espaces) ; lint + astro check + build verts ; un `type` absent du registre casse `astro check` en listant les types acceptés.

## 2026-09-13 — Plan website builder (cadrage)
- `docs/website-builder.md` : plan validé — découpage monde/sections/contenu (un template n'est jamais une page entière), kit dans un repo séparé `web-kit`, portage par couverture (taxonomie complète des familles, familles orphelines créées), pipeline P0→P8 avec gates, 5 chantiers, pilote sur un vrai client.

## 2026-09-13 — Wrapper skills pour les conventions + dédoublonnage CLAUDE.md
- 14 wrapper skills (.claude/skills/<nom>/SKILL.md), un par convention : le harness liste leurs descriptions en permanence et les charge à la demande — déclenchement mécanique au lieu de la seule obéissance à CLAUDE.md. Le contenu reste UNIQUEMENT dans .claude/conventions/ (le wrapper est un pointeur) ; nouvelle convention = wrapper + ligne _index.md dans le même commit.
- CLAUDE.md : § Activation et § Conventions par tags mis à jour ; doublons supprimés (§ Avant push fusionné dans § Seule commande ; règle absolue 10 fusionnée dans la 2/Stack).

## 2026-09-13 — Skill design-craft (distillé de impeccable + taste-skill)
- Nouveau skill repo-local `.claude/skills/design-craft/` : routeur (modes visiteur Persuade/Read/Operate, plancher ≠ plafond, le brief gagne, passes bornées) + 5 références : craft-floor (plancher mécanique avant toute édition UI : contrastes, mesures, rythme des titres, états, surfaces navigateur, interdits durs dont zéro tiret cadratin, défauts-par-réflexe), composition (règles comptables : hero ≤ 4 éléments/2 lignes, familles de layout, bento N=N, CTA une intention = un label, verrous couleur/forme/thème), typo-couleur (échelles par surface, fontes « training-data », OKLCH, stratégies), motion-css (0 JS : contenu visible au repos, reduced-motion intentionnel, durées), audit-redesign (5 dimensions /20, verdicts ship/fix/rebuild/recapture, symptôme→correctif).
- Gabarit `.claude/templates/design-system.md` (tokens + rôles + named rules) référencé par docs/design/system.md et le cadrage.
- Ancrage : CLAUDE.md § Skills (chargement avant toute UI), code-review.md § Craft (checks mécaniques), styling-tailwind (surfaces navigateur), a11y (nav ≤ 5). Distillé de pbakaus/impeccable (Apache-2.0) et Leonxlnx/taste-skill (MIT), attribution en tête des fichiers ; aucune dépendance ni outillage importé. Décisions : ban total du tiret cadratin ; pas de règle eyebrow (choix JB).

## 2026-08-28 — Rayon d'impact + arbitrages via AskUserQuestion (portés depuis app-pmo-luciole)
- Ce qui change pour le lecteur : au-delà de 1-2 fichiers ou dès qu'une surface est créée, le plan cite AVANT le code quatre items vérifiables (appelants avec commande citée, doublons, effet produit, refacto proposé/écarté) — gabarit `.claude/templates/rayon-impact.md`. Un refacto repéré devient une question, jamais un silence ni un refacto fait sans accord.
- Toute décision qui revient à l'utilisateur passe par l'outil `AskUserQuestion` (contexte par option, recommandation en premier) ; une phrase « j'ai choisi X » dans un récap est une violation. Un sous-agent ne tranche pas : il remonte au pilote.
- Emplacements : CLAUDE.md § Avant de coder (2 sous-sections datées), § Modes (flow dev + cadrage), § Qui exécute (consigne sous-agents) ; page-spec.md (renvoi) ; code-review.md § Sobriété et prd-evolution.md (points de contrôle).

## 2026-08-25 — SEO/GEO agentic + audit Lighthouse contrôlé
- Audit Lighthouse local : `pnpm run audit:lh` (lhci sur dist/, lighthouserc.json, 4 archétypes de page, seuils ≥ 0.95 en assertion). Résultat socle : 100/100/100/100 partout.
- Corrections révélées par l'audit : image hero en `loading="eager"` + `fetchpriority="high"` (LCP — astro:assets est lazy d'office) ; `--color-muted` 55% → 52% (contraste 4.43:1 → 5.05:1 sur surface) ; `sharp` en devDependency (build cassait à la première vraie image, invisible car les contenus d'exemple n'en ont pas).
- GEO/agentic : champ optionnel `whenToUse` (site.json, Zod) rendu dans llms.txt sous « Quand utiliser ce site » ; skill is-agentic installé (.claude/skills/) ; conventions seo-geo (§ Agentic readiness), performance (§ Lighthouse), deploy (réglages host + contrôles post-déploiement), a11y (contraste contrôlé machine) ; checklists bootstrap et code-review complétées.

## 2026-08-25 — Débranding + règles de méthode (anti-over-engineering, pilotage Fable/Opus)
- `.tiple/` déplacé dans `.claude/` (checklists, conventions, playbooks, starters, templates) ; toutes les références de chemins mises à jour ; mentions de la marque retirées (CLAUDE.md, docs/design/system.md, global.css).
- CLAUDE.md § Anti-over-engineering : deux obligations contrôlables (justification au présent de toute surface nouvelle ; récap qui nomme l'option plus simple écartée) — relayées dans coding-standards.md et code-review.md § Sobriété.
- CLAUDE.md § Qui exécute : session Fable = pilotage (lots + `Agent model: "opus"`), session Opus = écriture directe.
- Invariants d'archi : l'ADR reste obligatoire mais s'écrit sans attendre d'accord (table § Après une erreur, checklist apprentissage) — révocable a posteriori via ADR + journal.

## 2026-08-20 — Playbook migration Webflow + outillage porté
- `.claude/playbooks/migration-webflow.md` : méthode complète de duplication d'un site Webflow (phases 0→cutover avec gates : carte des baselines, ADRs de cadrage, gel du socle prouvé, conversion, 6 couches de vérif, parité par mesure, audit vision adversarial, formulaires end-to-end, cutover). Distillé d'une migration réelle (~430 pages).
- `scripts/migration/` (25 scripts) + `scripts/parity/` (10) portés depuis cette migration et généricisés : toute la config site-spécifique dans `scripts/migration/config.mjs`, dépendances installables au début du chantier seulement (voir `scripts/README.md`).
- (Même jour, commit précédent) CLAUDE.md § Après une erreur : apprentissage auto-écrit sous gate d'auto-contrôle + journal `docs/learnings.md` ; conventions renforcées depuis le vécu du site enfant ; code du socle migré vers les utilitaires générés `@theme` ; galerie `/styleguide`.

## 2026-06-12 — Correctifs audit du socle
- Assets OG/logo placeholders ajoutés (og-default.png, logo.png) : plus de 404 sur og:image et le logo JSON-LD.
- JSON-LD landings : schema.type (Service/Product) et schema.provider honorés ; dateModified sur les WebPage (updatedDate).
- Canonical/og:url avec slash final, alignés sur les URL servies et le sitemap ; breadcrumbs et liens RSS idem.
- sitemap.xml custom (lastmod par page depuis updatedDate, exclusion noindex) ; robots.txt et llms.txt générés au build ; @astrojs/sitemap retiré.
- URL de prod en source unique : `site` (astro.config) lue via import.meta.env.SITE.
- settings/site.json validé par Zod au build ; updatedDate ajouté aux landings ; heroImageAlt/hero.imageAlt requis avec image (refine).
- heroImage d'article rendue + propagée en og:image et image JSON-LD ; hero.image de landing rendue.
- Garde anti-collision de slugs (pages vs landings vs routes réservées) : build cassé avec message explicite.
- ESLint couvre désormais les .ts (typescript-eslint) ; Button avec prop type réutilisé par ContactForm ; aria-current sur la nav, role=status/alert sur les états du formulaire ; header wrap sur mobile.
- Descriptions des pages bespoke mises au format 140-160 caractères.
- Checklist de bootstrap (.claude/checklists/bootstrap.md) : personnalisation technique d'un site neuf, référencée dans README et CLAUDE.md.
