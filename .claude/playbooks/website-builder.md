# Playbook — Website builder (d'un brief à un site livré)

Plan et décisions : docs/website-builder.md. Kit : C:\apps\web-kit. Skills mobilisés : copywriting,
section-catalog, design-craft (+ wrappers de conventions). Chaque phase a un gate : on ne passe pas
à la suivante sans lui. Le pilote (session Fable) découpe en lots Opus ; les arbitrages passent par
`AskUserQuestion`.

## P0 — Intake (cadrage, docs/ uniquement)
- Entrée : brief client (fichier, mail, notes) → docs/brief.md (gabarit .claude/templates/brief.md).
- Interview ≤ 2 rounds, 2-3 questions par round, UNIQUEMENT ce qui change le travail : offre, cible,
  preuves disponibles, ton (3 adjectifs + 3 interdits), concurrents/références, whenToUse, CTA principal.
- Gate : site-ready § brief ; toute preuve absente est listée `à confirmer`.

## P1 — Structure (cadrage)
- Sitemap (docs/sitemap.md) : par page type/URL/objectif/CTA/intention SEO, mode visiteur.
- Content-model : collections, champs Zod ; archétype répété = collection (règle absolue 9).
- Page-spec par page (docs/pages/<slug>.md) : hiérarchie de message (skill copywriting) + JSON-LD attendu.
- Gate : site-ready complet.

## P2 — Casting du monde visuel
- Skill section-catalog › Casting : 3 candidats (captures) → `AskUserQuestion` → DESIGN.md du site
  (docs/design/system.md) + tokens @theme posés + fontes self-host.
- Gate : verrous couleur/forme/thème écrits ; `audit:lh` contrastes verts sur la home d'exemple.

## P3 — Composition des pages
- Skill section-catalog › Composition : par page, familles → variantes (catalogue ou portées) → raison.
  Règles comptables de design-craft/composition.md. Header/footer choisis une fois pour le site.
- Sortie : page-spec complétée (liste ordonnée de sections avec ids).
- Gate : matrice pages × familles sans répétition de famille de layout dans une page ; sections à
  porter listées avec leur source.

## P4 — Copywriting
- Skill copywriting : texte final par section, dans le frontmatter MDX/MD de chaque page (contenu en
  content/, jamais dans les composants — règle absolue 3). Méta title/description, tldr, faq.
- Gate : self-audit passé (grep tirets, guillemets droits, Lorem, noms de démo) ; chiffres sourcés ou mock.

## P5 — Build (lots Opus en parallèle)
- Lot 0 : bootstrap technique (.claude/checklists/bootstrap.md : site.json, URL prod, OG/logo).
- Lot par section à porter (section-catalog › Portage, une section = un lot, contrat CONVENTIONS.md).
- Lot par page : contenu + route ; SectionRenderer rend depuis le registre.
- Chaque lot reçoit : mode/échelle, conventions à charger, craft-floor, critères, interdiction de
  commiter et de trancher.
- Gate : lint + astro check + build ; registry + /styleguide à jour ; rayon d'impact tenu.

## P6 — Review
- design-craft › audit-redesign : 5 dimensions /20, captures desktop + mobile de chaque archétype de
  page, verdict `ship|fix|rebuild|recapture` rapporté tel quel ; `pnpm run audit:lh` (4 catégories ≥ 0.95,
  viser 1.00) ; code-review.md complet (§ Craft, § Sobriété).
- Gate : verdict `ship` (≥ 18/20) ; audit:lh vert ; zéro item de checklist ouvert.

## P7 — Déploiement
- deploy.md : validation humaine explicite sur `git log production..main`, `/commit-push`, puis
  contrôles post-déploiement : 404 réelle, Lighthouse prod, `npx is-agentic <domaine> --json` (zéro
  essential), Rich Results Test, sitemap soumis.
- Gate : les 3 contrôles verts, notés dans docs/changelog.md.

### Tirer le socle dans un site dérivé (`git pull socle main`, à chaque correctif hérité)
Trois conflits reviennent à chaque tirage ; leur résolution est fixée, pas rejouée :
- `docs/changelog.md` : version du site (`git checkout --ours`), les deux journaux divergent par construction.
- `.claude/conventions/component-registry.md` : UNION, ligne du site conservée + phrase nouvelle du socle recopiée dedans (jamais un côté entier : le site documente ses écarts au kit, le socle apporte la règle).
- Atome `ui/` adapté au monde du site (classes de focus, graisse, encre d'accent) : UNION des classes, résolue par un agent Opus (le pilote ne touche pas `src/`) ; `--theirs` efface l'adaptation du monde, `--ours` perd le correctif hérité.
Le tirage se fait sur un arbre propre (lots commités avant), et le merge est commité seul, avant tout nouveau lot.

## P8 — Apprentissage
- Boucle « Après une erreur » sur tout ce qui a frotté ; sections portées ajoutées au kit (README +
  captures) ; catalogue mis à jour ; durée par phase notée dans docs/changelog.md pour calibrer.

## Mesures du pilote (à remplir)
Durée par phase · nombre de sections portées vs réutilisées · verdict review · scores Lighthouse ·
issues is-agentic · items `à confirmer` restants à la livraison.
