# Audit & redesign d'un existant

Pour évaluer un site (le nôtre ou un site à migrer/reprendre). Verdict dérivé, jamais ressenti.

## Protocole d'audit — 5 dimensions notées 0-4, total /20

1. **Hiérarchie & layout** : squint test (primaire, secondaire, groupes lisibles dans l'ordre), rythme d'espacement (plus d'espace au-dessus des titres), alignements, débordements aux vrais contenus.
2. **Typographie** : échelle et écarts, mesure, interlignage, tailles planchers (11px fonctionnel / 14px corps), fontes justifiées.
3. **Couleur & contraste** : stratégie nommée tenue, verrous couleur/forme/thème, contrastes AA machine (`pnpm run audit:lh`), gris-sur-couleur.
4. **États & robustesse** : 7 états des contrôles, empty states qui enseignent, focus visible, textes longs/courts, `prefers-reduced-motion`, contenu visible sans JS.
5. **Contenu & crédibilité** : copy self-audit, chiffres sourcés ou mock, tells IA (craft-floor § Refuse), cohérence des CTA.

Barème : 18-20 excellent · 14-17 solide · 10-13 moyen (liste priorisée) · 6-9 faible · 0-5 critique. Sévérités P0 (casse l'usage/l'accès) → P3 (poli). Le rapport liste aussi les motifs SYSTÉMIQUES (une cause, N symptômes) et les acquis à ne pas casser.

**Verdict final, un mot parmi quatre** : `ship` (rien à faire) · `fix` (défauts localisés — une page qu'un directeur artistique renverrait est AU MIEUX fix, même parfaitement fonctionnelle) · `rebuild` (défaut structurel : reprendre la section/le composant) · `recapture` (les preuves de vérification sont invalides : re-vérifier avant de juger). Le verdict se rapporte tel quel, sans l'adoucir.

## Redesign : ordre de correction (le plus de gain d'abord)
1. Fontes (swap + échelle) → 2. Couleurs vers tokens + contrastes → 3. États hover/focus/active manquants → 4. Espacement/alignement (base 4, rythme des titres) → 5. Composants (cartes, boutons, listes > 5 items) → 6. Empty/erreur → 7. Micro-typo (balance des titres, veuves).

## Checklist symptôme → correctif
- Mots orphelins en fin de titre → `text-wrap: balance`.
- Boutons de cartes non alignés en bas → structure flex, CTA épinglé en bas de carte.
- Colonnes de features qui ne démarrent pas au même Y → aligner les hauteurs de zones (icône/titre/texte).
- Chaque ligne de liste bordée haut ET bas → `divide-y` seul, ou changer de composant.
- Texte gris sur bloc coloré → teinter depuis la surface.
- Tout espacé pareil → réintroduire le contraste serré/généreux (le rythme est le contraste).
- Reveal au scroll qui laisse du blanc sans JS → contenu visible au repos, animation en bonus.
- Titre hero en 4 lignes → réduire le corps ou élargir le conteneur, pas raccourcir la copie.

## Règles de prudence (redesign, jamais violées en silence)
- Ne pas migrer de framework CSS ni toucher au contenu/SEO pendant un redesign visuel.
- Diffs petits et thématiques (une passe = un domaine) ; passes bornées, pas de boucle.
- Ce qui ne change JAMAIS silencieusement : structure des URL, balises meta/JSON-LD, textes (hors correctifs de copy signalés), ordre du DOM porteur de sens.

Source : pbakaus/impeccable audit/critique (Apache-2.0) + Leonxlnx/taste-skill redesign-skill (MIT), distillé.
