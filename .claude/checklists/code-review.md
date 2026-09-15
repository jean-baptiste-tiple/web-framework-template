# Checklist — Code review (étape interne du mode développement)

## Statique / archi
- [ ] Aucun adapter/SSR/Server Action/API dynamique introduit
- [ ] Pages sans interaction = 0 JS ; tout îlot Solid justifié et en client:visible/idle
- [ ] Routing OK (pas de second catch-all racine ; /blog et /index prioritaires)

## Contenu / typage
- [ ] Nouveau type de contenu = schéma Zod ; champs obligatoires présents
- [ ] Contenu en .md/.mdx, rien en dur dans les composants
- [ ] Slugs cohérents (kebab-case)

## SEO / GEO
- [ ] title <= 60, description 140-160, canonical OK
- [ ] tldr + faq remplis (articles/landings) ; updatedDate bumpé
- [ ] JSON-LD présent et valide (type correct, FAQPage si faq)
- [ ] llms.txt mis à jour si page importante
- [ ] Un seul H1, titres sémantiques

## A11y / perf / qualité
- [ ] Images : alt + width/height
- [ ] Image LCP (hero au-dessus de la ligne de flottaison) : `loading="eager"` + `fetchpriority="high"` ; toutes les autres lazy (une seule eager par page)
- [ ] HTML sémantique, navigable clavier
- [ ] Composants réutilisés (registry vérifié), pas de couleur en dur
- [ ] Aucun composant forcé (surcharge inline, `!important`, valeur arbitraire, prop détournée, wrapper qui écrase son style) : besoin non couvert = prop/variante additive OU scission, jamais un hack au call-site
- [ ] DRY, edits chirurgicaux
- [ ] Gate complet vert : lint + astro check + build (pas build seul)
- [ ] Aucune balise `<…>` dans un commentaire `{/* */}` du corps d'un `.astro` (le compilateur la rend) : `grep -rn -A5 "{/\*" src --include=*.astro | grep "<"` vide
- [ ] Contrôle par grep (« vide », « zéro occurrence ») : lire le code de sortie, 1 = aucune occurrence, 2 = contrôle cassé donc échec. Jamais masqué par `|| echo`, `2>/dev/null` ou `| wc -l` ; grep en tête de pipe : lire `${PIPESTATUS[0]}`, car `set -o pipefail` rend le code du dernier grep (1) et non celui du grep cassé (2). Motif non ASCII (tirets, guillemets, accents) : `LC_ALL=C.UTF-8 grep`, sinon la locale C de Git Bash compare des octets

## Sobriété (anti-over-engineering)
- [ ] Chaque surface nouvelle du diff (fichier, composant, variante, prop optionnelle, util, champ Zod, token, option, dépendance) a une justification au présent — ce qui casse sans elle aujourd'hui. Justifiée au futur (« on pourrait vouloir ») = retirée
- [ ] Au-delà d'un edit trivial, le récap de fin de tâche nomme l'option d'un cran plus simple écartée et la raison
- [ ] Changement > 1-2 fichiers ou surface créée : rayon d'impact rempli (4 items, item Appelants avec commande citée), et tout refacto proposé a été posé via `AskUserQuestion`, pas laissé en note
- [ ] Aucun arbitrage rendu en prose dans le récap (« j'ai choisi », « à toi de voir ») : chaque décision qui revenait à l'utilisateur a un appel `AskUserQuestion` dans la trace

## Craft (si de l'UI a été touchée — réf. : skill design-craft)
- [ ] Zéro `—` / `–` dans le texte visible (grep) ; zéro faux screenshot en div ; zéro carte imbriquée
- [ ] Hero : ≤ 4 éléments texte, titre ≤ 2 lignes desktop, 1 CTA primaire
- [ ] Une famille de layout max 1×/page ; max 2 splits image+texte consécutifs ; bento : N items = N cellules
- [ ] CTA : un label par intention, identique partout ; aucun label de bouton sur 2 lignes
- [ ] Verrous tenus : 1 accent, 1 système de rayons, 1 thème par page
- [ ] Contrôles : 7 états présents ; contenu visible au repos (sans JS/animation) ; reduced-motion = alternative, pas un kill
- [ ] Cibles tactiles ≥ 44px mesurées à 390 sur les contrôles d'UNE ligne (summary, liens de nav, marque du header et du footer) : hauteur GARANTIE par une classe de l'échelle (`min-h-11`, ou `py-*` équivalent) dans le `class` du contrôle, jamais déduite du texte ni du padding du parent
- [ ] Surfaces navigateur thématisées (::selection, focus ring, underline-offset)
- [ ] Copy self-audit passé ; chiffres précis sourcés ou marqués mock
- [ ] **Test du directeur artistique** : chaque archétype de page est posé CÔTE À CÔTE avec sa page source du template du monde (capture du kit) ; placeholders vides, silhouettes, mouvements absents, largeurs de sections inégales ou écart de densité visible = `fix` au mieux, jamais « livré » (une note /20 ne remplace pas ce test)

## Documentation
- [ ] Un ADR qui révise une règle de CLAUDE.md ou d'une convention met à jour ce texte dans le même commit (l'ADR trace la décision, il ne la remplace pas)
- [ ] Erreur corrigée pendant le chantier = boucle « Après une erreur » passée (garde écrite ou observation dans docs/learnings.md)
