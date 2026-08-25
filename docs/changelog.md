# Changelog

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
