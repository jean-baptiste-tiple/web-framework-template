# Composition de page — règles comptables

Pour créer/modifier une page ou des sections de landing. Toutes contrôlables par comptage en review.

## Hero
- **≤ 4 éléments texte** : (badge OU bandeau de marque OU rien) + titre + sous-texte + CTA.
- **Titre ≤ 2 lignes** au viewport desktop. Un titre en 4 lignes est TOUJOURS une erreur de corps de fonte ou de conteneur (élargir le max-w, réduire le clamp), jamais une erreur de longueur de copie.
- Sous-texte ≤ 20 mots et ≤ 4 lignes. 1 CTA primaire + au plus 1 secondaire, visibles sans scroll.
- Bannis DANS le hero (à déplacer en section dédiée) : liste de features, bandeau de confiance, teaser de prix, rangée d'avatars, micro-tagline sous les CTA.
- Le mur de logos vit SOUS le hero : vrais SVG (jamais des wordmarks en texte brut), lisibles en clair ET sombre, AUCUN label de catégorie sous les logos.

## Sections
- **Une famille de layout apparaît au plus 1 fois par page** (une landing de 8 sections utilise ≥ 4 familles différentes). Max 2 sections consécutives en split image+texte : la 3e est un échec.
- Rythmer le scroll : varier densité, échelle, image et calme DANS une même grammaire ; un passage dense s'achète un passage calme ; la page se termine sur une vraie clôture (pas une section qui s'éteint).
- Test de mémoire du premier viewport : si un visiteur partait après un écran, que décrirait-il une heure plus tard ? Si la réponse honnête est « une ambiance », le concept ne s'est pas engagé.

## Grilles (bento)
- N items ⇒ EXACTEMENT N cellules. Une cellule vide au milieu ou en fin = grille mal planifiée : re-dessiner la grille, ne jamais coller une tuile vide. Vérifier l'arithmétique des col-span/row-span (`grid-flow-dense` aide).
- Dans toute grille multi-cellules, 2-3 cellules minimum portent une variation visuelle réelle (image, fond teinté, motif) — pas N cartes blanc-sur-blanc.

## CTA
- **Un label par intention, réutilisé à l'identique** partout (nav, hero, footer). « Nous contacter » = « Parlons-en » = « Démarrer un projet » : même intention ⇒ même label, une seule fois par page en primaire.
- Aucun label de bouton ne passe à 2 lignes en desktop : raccourcir (1-3 mots) ou élargir le bouton, jamais contraindre sa largeur.

## Listes et contenus longs
- Au-delà de 5 items, `<ul>` + filets est le choix paresseux : préférer split 2 colonnes groupé, grille de cartes, tabs/accordéon (`<details>`) si catégorisable.
- Jamais `border-t` ET `border-b` sur chaque ligne d'une liste/table de specs.
- Pas de méta-labels génériques : « SECTION 01 », « QUESTION 05 », « Stage 1/2/3 », « Phase 01 ».

## Verrous de cohérence (posés une fois, tenus partout)
- **Couleur** : UN accent verrouillé pour toute la page — pas de CTA bleu en section 7 sur un site à accent chaud.
- **Forme** : UN système de rayons (ou une règle documentée « boutons pill, cartes 16px, inputs 8px ») appliqué partout.
- **Thème** : UN seul clair/sombre/auto par page ; les teintes de section restent dans la famille (un bloc ambre clair au milieu d'une page zinc-950 est cassé).

Source : Leonxlnx/taste-skill (MIT) § 4.5-4.11 + pbakaus/impeccable new-work (Apache-2.0), distillé.
