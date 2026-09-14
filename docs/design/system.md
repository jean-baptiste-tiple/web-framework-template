# Design system (provisoire)
Tokens dans src/styles/global.css (@theme Tailwind 4) : couleurs sémantiques (bg, fg, muted, border, surface, accent, accent-fg), surface inversée (inverse, inverse-fg, inverse-muted), font-sans (système), radius, container-reading.
Provisoire : sera remplacé par le design system définitif. Ne pas sur-investir.
Quand un monde visuel s'engage (site dérivé, phase design) : remplir ce fichier au format .claude/templates/design-system.md — les règles de craft vivent dans le skill design-craft, pas ici.

## Rôles des tokens
| Token | Rôle | Utilitaires |
| --- | --- | --- |
| bg / fg | Papier et encre de la page | `bg-bg`, `text-fg` |
| surface / border | Surface de carte et son filet | `bg-surface`, `border-border` |
| muted | Texte secondaire ET bordure de contrôle (5,35:1 sur bg) | `text-muted`, `border-muted` |
| accent / accent-fg | Action primaire, liens, anneau de focus | `bg-accent`, `text-accent`, `outline-accent` |
| inverse / inverse-fg / inverse-muted | Bande sombre posée sur une page claire, et voile sur média (`bg-inverse/50`) | `bg-inverse`, `text-inverse-fg`, `border-inverse-muted` |
| error / success (+ `-on-inverse`) | Message d'état d'un formulaire. Le suffixe nomme la SURFACE qui porte le texte, pas une seconde nuance : aucune valeur unique ne tient 4,5:1 sur `bg` ET sur `inverse` (voir ci-dessous) | `text-error`, `text-success`, `text-error-on-inverse`, `text-success-on-inverse` |

## Atomes du socle
Galerie exécutable : **/styleguide** (noindex). Props et règles d'emploi : .claude/conventions/component-registry.md.
Container, Section (mise en page) · Button (variant primary/outline × tone default/inverse) · Card (padding default/none × tone default/inverse) · Accordion (squelette `<details>` canonique) · Badge (pilule de kicker) · Icon (jeu FERMÉ, sous-ensemble Lucide ISC) · Faq / GlobalFaq · ContactForm.

## Contrastes tenus
Seuils : 4,5:1 pour le texte, 3:1 pour une bordure de contrôle, une icône ou un anneau de focus.
Contrôle machine sur les 4 archétypes de page : `pnpm run audit:lh` (audit `color-contrast`).
Les paires hors de ces 4 pages (surface inverse, tons de Badge) se recalculent à la main à chaque changement de token : OKLCH → sRGB → ratio WCAG.

| Paire | Ratio | Seuil |
| --- | --- | --- |
| fg / bg | 17,59:1 | 4,5 |
| muted / surface | 5,05:1 | 4,5 |
| muted / bg (placeholder de champ) | 5,35:1 | 4,5 |
| accent-fg / accent | 4,72:1 | 4,5 |
| bordure muted / bg (Button outline) | 5,35:1 | 3 |
| anneau accent / bg | 4,72:1 | 3 |
| inverse-fg / inverse | 17,25:1 | 4,5 |
| bordure inverse-muted / inverse | 7,58:1 | 3 |
| accent / inverse (surface de bouton) | 3,88:1 | 3 |
| error / bg | 5,90:1 | 4,5 |
| success / bg | 5,51:1 | 4,5 |
| error-on-inverse / inverse | 6,60:1 | 4,5 |
| success-on-inverse / inverse | 7,49:1 | 4,5 |

**Deux valeurs par état, et l'audit machine ne les voit pas.** `bg` (Y=0,970) et `inverse`
(Y=0,006) imposent au texte des domaines de luminance disjoints : ≤ 0,177 pour tenir 4,5:1 sur
`bg`, ≥ 0,201 pour le tenir sur `inverse`. Aucune couleur unique ne peut donc servir les deux
fonds — d'où le suffixe `-on-inverse`, qui nomme la surface et non une nuance. Et comme les
messages d'état naissent `hidden`, `color-contrast` ne les audite sur aucune des 4 pages :
ces 4 lignes se recalculent à la main (OKLCH → sRGB → ratio WCAG) à chaque changement de
`--color-bg`, `--color-inverse` ou d'un token d'état.

Hors seuil — **filets décoratifs** (bordure de carte ou de champ : ni contrôle, ni porteuse
d'information, aucun seuil WCAG ne s'y applique) : `border / bg` 1,23:1 (Card ton default,
champs de ContactForm) et `inverse-muted/40 / inverse` 2,20:1 (Card `tone="inverse"` posée sur
une bande `bg-inverse`, où la surface de la carte et la bande sont le même token : c'est le filet,
pas le fond, qui dessine la carte). Une bordure qui devient une limite de contrôle (Button
`outline`) sort de cette classe et passe au seuil 3:1, ligne dédiée ci-dessus.
