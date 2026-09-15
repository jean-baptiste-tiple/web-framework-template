# Craft floor — plancher mécanique avant toute édition UI

À lire juste avant d'éditer de l'UI, y compris une micro-retouche. Jamais pour du planning.
Un brief épinglé ou le DESIGN.md du projet peut racheter un « Refuse » ; ton propre réflexe, non.

## Verify — sur le résultat construit, en UNE passe batchée (desktop + mobile)

1. **Contraste** : corps ET placeholder ≥ 4.5:1, texte large ≥ 3:1, contrôles/icônes/focus ≥ 3:1 — y compris états interactifs, texte sur image, les deux thèmes. Machine : `pnpm run audit:lh` (color-contrast).
2. **Typo** : mesure du corps 65-75ch ; display ≤ 6rem ; tracking jamais sous -0.04em ; interlignage corps 1.5-1.7 (jamais < 1.3) ; texte fonctionnel (liens, boutons, nav, labels, méta) ≥ 11px, corps ≥ 14px ; passer la VRAIE copie à chaque breakpoint et corriger ce qui déborde.
3. **Espacement** : groupes serrés, séparations généreuses ; PLUS d'espace au-dessus d'un titre qu'en dessous (lire les valeurs calculées — un titre colle au contenu qu'il introduit, sinon chaque section semble légender la précédente) ; échelle documentée base 4, jamais de valeur one-off ; le rythme EST le contraste entre intervalles — un espacement identique partout est un défaut.
4. **Hiérarchie** : squint test — en plissant les yeux, l'élément primaire, le secondaire et les groupes majeurs se lisent DANS L'ORDRE. Écart net entre titre dominant et corps (≥ 1.25×).
5. **États** : tout contrôle interactif a ses 7 états (default, hover, focus, active, disabled, loading, error) + empty pour les listes. Ne pas livrer avec la moitié. **Cible tactile ≥ 44px** (hauteur mesurée à 390) sur tout contrôle, garantie par une classe (`min-h-11`) et non par la longueur du libellé : un `<summary>` ou un lien de nav d'une seule ligne est le cas qui rate, pas celui de deux.
6. **Surfaces navigateur** : sélection de texte (::selection), focus ring, underline-offset, chiffres tabulaires dans les données — thématisés depuis la palette. C'est le signal le moins cher qu'une page a été DESSINÉE et non assemblée, et le plus souvent oublié.
7. **Motion** : contenu visible au repos (un élément caché en attendant un script est un élément absent) ; `prefers-reduced-motion` respecté avec une alternative intentionnelle. Détail : motion-css.md.
8. **Copy** : relire chaque chaîne visible (titres, labels, alt, footer, erreurs) — grammaire, référent clair, pas de mignon-mais-faux. Dans le doute, remplacer par une phrase fonctionnelle plate. Chiffre précis (92 %, 4.1×) = donnée réelle ou marqué `<!-- mock -->`, sinon interdit.
9. **Tracé SVG dessiné à la main** (logo, pictogramme) : deux formes de même remplissage ne se touchent jamais bord à bord. Elles se recouvrent d'au moins 0,5 unité ou fusionnent en un seul chemin : deux bords anticrénelés posés sur la même droite laissent passer le fond, un liseré clair que le code ne montre pas. Contrôle : rendu à 1024 px, aucun liseré aux jonctions.

## Interdits durs (grep = échec de review)

- **Tiret cadratin/demi-cadratin : ZÉRO `—` et `–` dans tout texte visible** (titres, corps, labels, boutons, alt, légendes). Remplacer par deux-points, virgule, parenthèses ou une phrase coupée. Formulé en binaire parce que « avec parcimonie » est systématiquement ignoré. Contrôle sur le HTML construit : `LC_ALL=C.UTF-8 grep -rn '[—–]' dist/` sort en code 1. Sans locale UTF-8, la classe compare des octets et signale « nœud » comme un tiret.
- **Faux screenshot reconstruit en `<div>`** : une capture produit est une image réelle, jamais un décor DOM.
- **Cartes imbriquées** (carte dans carte) — cf. règle anti double-carte de styling-tailwind.md.

## Refuse — défauts-par-réflexe (le brief peut les racheter, ton habitude non)

- Grille de cartes identiques icône+titre+texte comme structure de page : la carte est le conteneur paresseux.
- Texte en dégradé : l'emphase vient de la graisse ou du corps.
- Glassmorphism décoratif ; `border-left` coloré > 1px ; ombre dure décalée hors monde néobrutaliste.
- Monospace comme costume « technique » ; fonte display système (Impact, Arial Black, le sans de l'OS) comme voix display — la fonte installée la plus proche est un échec, pas un fallback (stacks système : légitimes en Read/Operate).
- Emoji ou glyphe Unicode à la place d'un système d'icônes : une icône se dessine (SVG maison ou set cohérent), un seul trait et une seule graisse.
- Numéros de section décoratifs (01/02/03), pagination sur images, scroll cues (« ↓ scroll »), labels de version (V0.6, BETA) sur page marketing, bandeaux locale/heure/météo, points de statut décoratifs, faux crédits photo.
- Thème clair/sombre choisi par habitude de catégorie : une phrase de scène physique (qui, où, sous quelle lumière) force la réponse.
- Modal par réflexe quand une section ou une page suffit.

Le plancher tient la mécanique ; il ne choisit jamais la direction.
