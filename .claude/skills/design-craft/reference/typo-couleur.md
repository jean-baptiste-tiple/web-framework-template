# Typographie & couleur

Pour tout travail sur fontes, échelle, palette, tokens @theme, dark mode. Complète styling-tailwind.md (tokens) et a11y.md (contrastes) — ne pas les redire.

## Échelle typographique
- Distinguer deux mesures : le RATIO entre pas de l'échelle, et l'ÉCART titre dominant ↔ corps.
  - Surfaces Read/Operate (blog, pages, formulaires) : ratio 1.125-1.2 entre pas — un contraste exagéré fait du bruit en UI. Échelle **rem fixe, pas de clamp() sur les titres** : un h1 fluide qui rétrécit dans un panneau est pire, pas mieux.
  - Surfaces Persuade (landing, home) : échelle plus ample et fluide permise.
  - Dans tous les cas, l'écart titre dominant ↔ corps reste ≥ 1.25× à chaque pas, sinon la hiérarchie est plate.
- Rythme de paragraphe : espacement OU indentation de première ligne, JAMAIS les deux (double marquage de la frontière).
- Emphase dans un titre : italique ou graisse de la MÊME famille — injecter un mot serif dans un titre sans-serif est amateur. Mot italique display avec descendantes (y g j p q) : leading ≥ 1.1 + réserve basse, sinon la descendante est coupée.

## Fontes
- **Fontes « défaut de training-data »** — en choisir une exige une raison qu'aucune autre fonte ne satisfait, et « ça fait premium/créatif/le sujet s'y prête » n'en est jamais une : Fraunces, Playfair Display, Cormorant, Lora, Crimson, Newsreader, Syne, Space Grotesk, Space Mono, IBM Plex, Inter-en-display, DM Sans/Serif, Outfit, Plus Jakarta Sans, Instrument Sans/Serif. (Livre ⇒ serif, artisan ⇒ manuscrite, tech ⇒ mono : ce sont exactement les associations que la liste casse.)
- Stacks système et fontes de labeur : parfaitement légitimes en Read/Operate — la liste vise les surfaces Persuade/Experience.
- Fonte custom : self-host + `font-display: swap` (cf. performance.md), jamais plus de 2 familles.

## Dark mode
- Texte clair sur fond sombre : compenser sur les TROIS axes perceptuels — un peu plus d'interlignage, un peu plus de tracking, un cran de graisse en plus si la fonte le demande.
- Le choix clair/sombre ne se fait jamais par catégorie de produit : une phrase de scène physique (qui utilise, où, sous quelle lumière) force la réponse.

## Couleur
- **Stratégie AVANT les couleurs** — en nommer UNE : Restrained (neutres + un accent — le défaut quand le visiteur vient lire ou opérer, et celui des tokens du socle) ; Committed (une couleur saturée porte 30-60 % de la surface) ; Full palette (3-4 rôles nommés) ; Drenched (la surface EST la couleur). La couleur s'engage à l'échelle de la page : des champs qui possèdent des régions entières, pas des accents saupoudrés sur fond neutre.
- **OKLCH pour toute nouvelle palette** (déjà le cas des tokens @theme) : varier la lightness, réduire la chroma près du blanc et du noir — ne pas garder une chroma haute aux extrêmes pour faire joli en math. Préférer des couleurs explicites aux empilements d'alpha quand la transparence rendrait le contraste dépendant du contexte.
- **Texte secondaire sur surface colorée : teinté depuis la teinte de la surface ou du texte principal, JAMAIS gris.**
- Anti-look-IA : trois looks de convergence à reconnaître — (a) fond crème chaud + serif display contrasté + accent terracotta ; (b) near-black + un néon + bords qui glow ; (c) filets éditoriaux + serif italique + petits labels mono. Légitimes si le brief les demande ; si l'esthétique était libre et qu'on peut deviner le rendu depuis la seule catégorie du client, le travail n'a pas d'identité : retravailler.
- Tout passe par les tokens @theme (styling-tailwind.md) : jamais de hex en dur, y compris pour appliquer ces règles.

Source : pbakaus/impeccable typeset/colorize/new-work (Apache-2.0) + Leonxlnx/taste-skill § 4.1-4.2 (MIT), distillé.
