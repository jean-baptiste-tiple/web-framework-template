# DESIGN.md — <Nom du site>

Gabarit du design system d'un site dérivé (à remplir en phase design du cadrage, à faire vivre ensuite dans docs/design/system.md). Le frontmatter est l'export portable des tokens ; le corps dit les décisions. Règle : tout ce qui est écrit ici EST implémenté en tokens @theme — jamais deux sources.

---

## Vue d'ensemble
<!-- 3 phrases : le monde visuel engagé (pas « moderne et épuré »), le mode visiteur dominant
     (Persuade/Read/Operate), la scène physique qui a tranché clair vs sombre. -->

## Couleurs
<!-- Stratégie nommée (Restrained / Committed / Full palette / Drenched) puis table :
     token @theme | valeur OKLCH | rôle (canvas, surface, texte 1/2, action, focus, sémantiques).
     L'accent unique est verrouillé ici. Paires texte/fond validées ≥ 4.5:1 (audit:lh). -->

## Typographie
<!-- Familles (≤ 2, self-host + swap si custom, raison si fonte « training-data »),
     échelle : ratio retenu par surface (Read/Operate 1.125-1.2 rem fixe ; Persuade ample),
     mesure, graisses utilisées. -->

## Espacement & layout
<!-- Base 4, pas utilisés, familles de layout du site, largeur de lecture, breakpoints (640/768/1024). -->

## Formes & profondeur
<!-- LE système de rayons (verrou de forme), usage des ombres/élévations, bordures. -->

## Motion
<!-- Le moment de motion auteur du site (un seul), durées, easing, alternative reduced-motion. -->

## Composants signature
<!-- 2-4 composants qui portent l'identité (renvoi au component-registry, pas de doublon de spec). -->

## Named rules (interdits & décisions propres à CE site)
<!-- Décisions datées qui dérogent ou précisent le craft-floor, avec leur raison.
     Ne JAMAIS canoniser ici un défaut livré par erreur : une violation documentée devient le style maison. -->

Format inspiré de pbakaus/impeccable document.md (Apache-2.0).
