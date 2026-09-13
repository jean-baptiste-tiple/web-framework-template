# Website builder — plan validé (2026-09-13)

Objectif : d'un brief client à un site livré en 1-2 sessions, au niveau design des 37 templates Astro
(C:\apps\TEMPLATES Astro, libres d'usage), avec un contenu écrit pour ce client, et TOUS les gates verts.

## Critères de « parfait » (mesurables)
Lighthouse 100/100/100/100 (`pnpm run audit:lh`) · is-agentic zéro issue essential · audit design-craft
≥ 18/20, verdict `ship` · copy self-audit sans reprise · JSON-LD valide (Rich Results) · zéro tell IA
(grep craft-floor) · aucune section ni page qui ne vienne du sitemap validé.

## Principe d'architecture : découpage en trois couches indépendantes
Un template n'est JAMAIS utilisé comme page entière. Il est découpé en :
1. **Monde** : tokens (@theme, OKLCH), typo, radius, ombres, motion — un DESIGN.md par template (gabarit
   .claude/templates/design-system.md).
2. **Sections** : unités atomiques recomposables. Une section ne consomme QUE les tokens (zéro CSS propre
   au template) : une section du template A rend juste sous le monde du template B. Variantes de
   densité/alignement par props typées, pas par copie.
3. **Contenu** : frontmatter validé Zod, une union par type de section (règle absolue 4).
Conséquence : n'importe quel sitemap s'assemble depuis n'importe quelles sections sous n'importe quel
monde — c'est ce qui permet de « redécouper un template dans tous les sens » selon le client.

## Décisions (arbitrages posés via AskUserQuestion)
- **Kit dans un repo séparé** `C:\apps\web-kit` : le socle reste un template léger cloné par site ; les
  sections sont COPIÉES dans un site quand elles y servent (puis vivent dans son registry).
- **Portage par couverture** : une taxonomie complète des familles (ci-dessous), chaque famille couverte par
  **au minimum 2-3 variantes** portées depuis les meilleurs templates ; les familles absentes des 37 sont
  CRÉÉES par nous (même langue de design, mêmes règles). Pas de portage des ~300 variantes : le catalogue
  les rend trouvables, une variante supplémentaire se porte quand un site la demande.
- **Pas d'e-commerce** (aucune famille ni archétype marchand). Le blog est dans le périmètre.
- **Pilote sur un vrai client** (brief réel, preuves réelles, mise en prod).

## Taxonomie des familles de sections (couverture obligatoire — aucune oubliée)
- **Navigation** : header (simple, sticky, transparent-sur-hero, avec CTA, mega-menu), footer (minimal,
  colonnes, avec newsletter), barre d'annonce, fil d'Ariane.
- **Hero** : texte centré, split image, split visuel produit, vidéo (façade), avec formulaire intégré,
  hero de page interne (titre + intro), hero d'article, hero de recherche/catalogue.
- **Preuve** : mur de logos, témoignages (grille, citation unique, vidéo façade), chiffres/stats, études de
  cas (teaser), notes/avis, certifications/labels, presse « ils parlent de nous ».
- **Offre** : features (grille, alternée/zigzag, bento, tabs via `<details>`), services, bénéfices, cas
  d'usage, comparaison, pricing (cartes, table, toggle mensuel/annuel), process/étapes, intégrations.
- **Contenu** : prose riche, image + texte, galerie, vidéo, timeline, FAQ, glossaire, table de specs,
  téléchargements/ressources, accordéon, citation/manifeste.
- **Personnes** : équipe, bio auteur, valeurs, recrutement/offres d'emploi.
- **Conversion** : bandeau CTA, formulaire contact, newsletter, devis/calculateur (îlot justifié), prise
  de RDV (lien), carte/adresse/horaires.
- **Blog** : index (grille, liste, à la une + grille), article (mesure de lecture, sommaire, auteur, articles liés), catégorie/tag, auteur, newsletter d'article.
- **Archétypes de pages** (layouts complets recomposables) : cas client, fiche service, page secteur, page locale (ville), contact, mentions légales, 404, actualités/événements, changelog.
Toute famille découverte dans un template et absente ici s'AJOUTE à cette liste (et inversement, une
famille sans aucun template source se crée).

## Les 6 conversions de portage (règles, contrôlables en review)
1. Valeurs en dur → tokens @theme (couleur, radius, espacement, typo) ; aucun hex, aucun px arbitraire.
2. Contenu en dur → props typées + schéma Zod ; la section rend depuis le frontmatter.
3. JS du template → natif (`<details>`, CSS) ou script vanilla ; îlot seulement si justifié (règle 2).
4. Icônes/emoji → système d'icônes SVG unique du socle ; images → astro:assets, alt + dimensions.
5. a11y : sémantique, états, focus, contrastes (audit:lh) — craft-floor passé.
6. Registry : entrée + galerie /styleguide dans le même commit ; fiche catalogue mise à jour (portée : oui).

## Couches à construire
- **Kit** (`web-kit`) : `catalog/worlds/` (37 DESIGN.md + screenshot home), `catalog/sections/` (fiche par
  section : id, famille, mode visiteur, secteurs, densité, screenshot, chemin source, slots, JS requis,
  portée oui/non), `sections/` (les portées, prêtes à copier), `scripts/` (inventaire, screenshot).
- **Socle** (ce repo) : union Zod `sections` extensible par famille ; SectionRenderer route vers les
  composants ; `pages` gagnent un `sections:` optionnel ; header/footer sélectionnables par variante.
- **Skills** : `copywriting` (hiérarchie de message, copy par type de section, voix du brief, typo FR,
  self-audit en gate) ; `section-catalog` (chercher, composer selon composition.md, procédure de portage).
- **Playbook** `.claude/playbooks/website-builder.md` : le pipeline ci-dessous, avec ses gates.

## Pipeline par site
| Phase | Quoi | Artefact | Gate |
|---|---|---|---|
| P0 Intake | Brief + interview ≤ 2 rounds (offre, cible, preuves, ton, concurrents, whenToUse) | docs/brief.md | site-ready § brief |
| P1 Structure | Sitemap + content-model + page-spec par page | docs/sitemap.md, content-model.md | site-ready |
| P2 Casting | 3 mondes candidats (screenshots) matchés secteur/mode/vibe → `AskUserQuestion` → DESIGN.md, tokens | docs/design/system.md | verrous posés (composition.md) |
| P3 Composition | Par page : sections du catalogue, variété des familles, hero, une intention par CTA, raison par choix | page-spec × N | composition.md (comptable) |
| P4 Copywriting | Texte final par section depuis le brief ; chiffres sourcés ou mock ; self-audit | frontmatter prêt | copy self-audit |
| P5 Build | Lots Opus parallèles par page ; portage JIT des variantes manquantes ; registry | code + contenu | lint/build, craft-floor |
| P6 Review | audit-redesign 5 dimensions, audit:lh, screenshots desktop+mobile, verdict | rapport | ≥ 18/20, `ship` |
| P7 Deploy | deploy.md (validation humaine explicite, post-déploiement) | prod | 404 réelle, LH prod, is-agentic |
| P8 Apprentissage | learnings + catalogue enrichi | docs/learnings.md | gate apprentissage |

## Chantiers
1. **Kit-0 Inventaire** (1 session, agents parallèles) : dézipper, builder, screenshoter les 37 ; produire
   `catalog/worlds/` et `catalog/sections/` ; croiser avec la taxonomie → matrice de couverture (famille ×
   templates sources, familles orphelines à créer).
2. **Kit-1 Portage par couverture** : les 6 conversions écrites et testées ; 2-3 variantes minimum par
   famille portées ; familles orphelines créées ; union Zod étendue ; galerie.
3. **Skills + playbook** : copywriting, section-catalog, website-builder.md, ancrage CLAUDE.md.
4. **Pilote client** : pipeline suivi à la main de bout en bout ; mesure temps/gates/verdict ; learnings.
5. **Industrialisation** : ce qui a frotté au pilote devient outillage (fiche catalogue auto, portage
   assisté) ; le catalogue grossit site après site.

## Hors périmètre (volontaire)
Pas d'interface graphique (l'agent est le builder) · pas de portage massif des ~300 variantes ·
pas de génération d'images ni de mode « live » (hors 0 JS, hors besoin).
