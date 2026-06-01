# Coding standards

- TypeScript strict. PAS de `any` côté rendu : typer le contenu via `CollectionEntry<'x'>`. Le typage Zod EST le filet de sécurité.
- Composants .astro pour le statique ; .tsx (Solid) seulement pour les îlots, et Solid est un starter opt-in (non installé par défaut).
- Imports via alias @/ (pas de ../../).
- Nommage : composants PascalCase, fichiers de contenu kebab-case (= slug).
- Pas de logique métier dans les pages : extraire dans src/lib/.
- Commentaires en français, concis, sur le pourquoi.
- Pas de couleur/espacement en dur : tokens CSS (var(--color-*)) + classes Tailwind sémantiques.

## DRY & réutilisation (CRITIQUE)
- Avant de créer un composant : vérifier component-registry, réutiliser/étendre l'existant.
- Markup répété 2+ fois ⇒ composant. Données répétées 2+ fois ⇒ collection (content) ou SITE (global). Jamais de copier-coller.
- Un seul endroit par responsabilité : SEO/JSON-LD = BaseLayout ; texte global = site.json ; markup d'une section landing = SectionRenderer.
- Composants petits, props minimales et typées. Pas de variante codée en dur : paramétrer par prop/token.
- Structure : pages = orchestration (data + layout) uniquement ; présentation dans components/ ; data/derivations dans lib/.
