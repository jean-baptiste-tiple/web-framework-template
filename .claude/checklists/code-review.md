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
- [ ] HTML sémantique, navigable clavier
- [ ] Composants réutilisés (registry vérifié), pas de couleur en dur
- [ ] Aucun composant forcé (surcharge inline, `!important`, valeur arbitraire, prop détournée, wrapper qui écrase son style) : besoin non couvert = prop/variante additive OU scission, jamais un hack au call-site
- [ ] DRY, edits chirurgicaux
- [ ] Gate complet vert : lint + astro check + build (pas build seul)

## Sobriété (anti-over-engineering)
- [ ] Chaque surface nouvelle du diff (fichier, composant, variante, prop optionnelle, util, champ Zod, token, option, dépendance) a une justification au présent — ce qui casse sans elle aujourd'hui. Justifiée au futur (« on pourrait vouloir ») = retirée
- [ ] Au-delà d'un edit trivial, le récap de fin de tâche nomme l'option d'un cran plus simple écartée et la raison

## Documentation
- [ ] Un ADR qui révise une règle de CLAUDE.md ou d'une convention met à jour ce texte dans le même commit (l'ADR trace la décision, il ne la remplace pas)
- [ ] Erreur corrigée pendant le chantier = boucle « Après une erreur » passée (garde écrite ou observation dans docs/learnings.md)
