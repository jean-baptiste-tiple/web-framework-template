---
name: design-craft
description: Charger avant de créer ou retoucher toute UI (composant, section, page, tokens, styles) et pour auditer ou redesigner un site existant. Fournit le plancher de craft mécanique (craft-floor), les règles de composition de page comptables, la typo/couleur, le motion CSS pur et le protocole d'audit. Complète frontend-design ; ne se charge pas pour du cadrage pur.
---

# Design craft — routeur

Distillé de pbakaus/impeccable (Apache-2.0, © 2025 Paul Bakaus) et Leonxlnx/taste-skill (MIT, © 2026 Leonxlnx), adapté à ce socle : Astro statique, 0 JS par défaut, tokens @theme, gate Lighthouse (`pnpm run audit:lh`).

## Quand charger quoi (ne charger que le nécessaire)

| Travail | Références à lire |
| --- | --- |
| Toute édition d'UI, même micro (composant, section, styles, tokens) | `reference/craft-floor.md` — juste avant d'éditer, jamais pour planifier |
| Créer/modifier une page ou une section de landing | + `reference/composition.md` |
| Toucher typo, palette, tokens, dark mode | + `reference/typo-couleur.md` |
| Ajouter la moindre animation/transition | + `reference/motion-css.md` |
| Auditer ou redesigner un site existant (dont migration) | `reference/audit-redesign.md` |

## Principes (dans cet ordre)

1. **Le brief gagne.** Une demande explicite de l'utilisateur ou un DESIGN.md engagé bat toute règle d'ici. Ces règles n'ont autorité que contre les réflexes du modèle, jamais contre une décision humaine.
2. **Plancher ≠ plafond.** Le craft-floor tient la mécanique ; il ne choisit jamais la direction. Tous les checks au vert, dépenser la page sur le monde visuel engagé — entre raffiné et engagé, choisir engagé.
3. **Raffiner préserve ; redesigner remplace.** Jamais de « moyenne » entre l'existant et une nouvelle direction.
4. **Passes bornées, pas de boucle.** Construire complètement → inspecter UNE fois en lot (desktop + mobile ensemble) → corriger tout en un lot → au plus un round de confirmation → s'arrêter.

## Mode visiteur (choisir AVANT d'appliquer les règles)

Le mode se déduit de la SURFACE demandée, pas du produit : la landing d'un outil reste Persuade, la doc d'une maison de mode reste Read.

- **Persuade** (landing, home) : le visiteur décide et agit. Typo expressive et fluide permise, couleur qui s'engage, un moment de motion.
- **Read** (blog, pages éditoriales, mentions) : le visiteur comprend. Échelle rem FIXE (pas de clamp sur les titres), mesure 65-75ch, couleur sobre, motion quasi nulle. Stack système ou fonte de labeur : légitime ici.
- **Operate** (formulaires, styleguide) : le visiteur accomplit. Ratio d'échelle 1.125-1.2, transitions 150-250 ms, 7 états par contrôle.
- **Experience** : hors périmètre du socle (page-œuvre) — brief explicite requis.

## Consignes sous-agents (le pilote les copie dans chaque prompt UI)

- Toute dégradation de protocole (pas de screenshot possible, revue inline au lieu d'un agent isolé…) s'ANNONCE en une ligne en tête de rapport — une revue dégradée silencieuse est une revue ratée.
- Un correctif revendiqué mais invisible dans la vérification est non résolu : la narration n'est pas une preuve.
