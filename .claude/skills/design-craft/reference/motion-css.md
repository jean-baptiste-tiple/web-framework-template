# Motion — CSS pur (contrainte socle : 0 JS)

Tout motion du socle est CSS (transitions, animations, `animation-timeline: view()` si supporté). Du motion piloté JS = un îlot à justifier (règle absolue 2) ; GSAP/Motion : hors socle.

## Avant d'animer : la thèse en une phrase
Répondre à « qu'est-ce que cette animation communique ? » — réponses valides : hiérarchie, feedback, transition d'état, narration. « Ça faisait joli » : supprimer l'animation. Si la page annonce du motion, elle doit réellement bouger ; sinon assumer un statique propre plutôt qu'un motion à moitié cassé.

## Règles dures
- **Contenu visible au repos.** L'état par défaut (sans JS, sans animation jouée) montre tout le contenu. Un élément en `opacity: 0` en attendant un reveal est la signature du « reveal cassé » : il se lit comme un élément manquant. Le socle 0 JS rend ce défaut fatal — jamais d'état initial caché.
- **Un seul moment de motion auteur par page**, depuis un état déjà visible — pas une entrée identique répliquée sur chaque section.
- **`prefers-reduced-motion` = alternative intentionnelle**, pas un kill global à 0.01ms : retirer le mouvement spatial, préserver les transitions d'opacité/couleur/état qui portent du sens. Moins et plus doux, pas rien.
- `transform` + `opacity` uniquement pour animer (jamais layout : width/height/top). `backdrop-blur` uniquement sur éléments fixed/sticky.
- Marquee : max 1 par page. Jamais bounce/elastic par réflexe.

## Durées (repères)
| Usage | Durée |
| --- | --- |
| Feedback immédiat (hover, press) | 100-150 ms |
| Changement d'état courant | 150-300 ms |
| Layout, overlay, transition de vue | 300-500 ms |
| Entrée focale délibérée (unique) | 500-800 ms |

- Surfaces Operate/Read : rester dans 150-250 ms, aucune séquence orchestrée au chargement.
- Sortie plus rapide que l'entrée. Easing d'arrivée : ease-out prononcé (ex. `cubic-bezier(0.16, 1, 0.3, 1)`), jamais `linear` ni `ease-in-out` par défaut.

Source : pbakaus/impeccable animate/operate/craft-floor (Apache-2.0), distillé pour un socle statique.
