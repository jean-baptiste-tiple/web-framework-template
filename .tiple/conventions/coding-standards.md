# Coding standards

- TypeScript strict. PAS de `any` côté rendu : typer le contenu via `CollectionEntry<'x'>`. Le typage Zod EST le filet de sécurité.
- Composants .astro pour le statique ; .tsx (Solid) seulement pour les îlots, et Solid est un starter opt-in (non installé par défaut).
- Imports via alias @/ (pas de ../../).
- Nommage : composants PascalCase, fichiers de contenu kebab-case (= slug).
- Pas de logique métier dans les pages : extraire dans src/lib/.
- Commentaires en français, concis, sur le pourquoi.
- Pas de couleur/espacement en dur : classes Tailwind sémantiques générées par @theme (var(--color-*) réservé aux blocs <style> scoped — voir styling-tailwind.md).

## DRY & réutilisation (CRITIQUE)
- Avant de créer un composant : vérifier component-registry ET la galerie /styleguide, réutiliser/étendre l'existant.
- Besoin non couvert par l'existant → l'étendre ou le scinder, JAMAIS le forcer. Interdit : surcharge inline, `!important`, valeur arbitraire, prop détournée, wrapper parent qui écrase le style du composant. À la place : une prop/variante typée additive et rétrocompatible (les call-sites existants ne changent pas), OU scinder en deux composants si la divergence est réelle et que fusionner alourdirait le canonique (« bloat »).
- Fusion de doublons : ne PAS fusionner en aveugle — inspecter la divergence réelle avant (gabarit .tiple/templates/fusion-a-trancher.md), puis décision datée au registre.
- Markup répété 2+ fois ⇒ composant. Données répétées 2+ fois ⇒ collection (content) ou SITE (global). Jamais de copier-coller.
- Un seul endroit par responsabilité : SEO/JSON-LD = BaseLayout ; texte global = site.json ; markup d'une section landing = SectionRenderer.
- Composants petits, props minimales et typées. Pas de variante codée en dur : paramétrer par prop/token.
- Structure : pages = orchestration (data + layout) uniquement ; présentation dans components/ ; data/derivations dans lib/.
