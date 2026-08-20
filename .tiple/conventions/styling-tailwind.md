# Styling (Tailwind 4)

- Config CSS-first : tokens dans @theme (src/styles/global.css). Pas de tailwind.config.js.
- En markup : classes utilitaires sémantiques GÉNÉRÉES par @theme (`bg-accent`, `text-muted`, `border-border`, `rounded`, `max-w-reading`…), PAS la forme arbitraire `[var(--color-*)]` — Tailwind 4 génère les utilitaires depuis les tokens, la forme arbitraire est du bruit non contrôlable.
- Nommer les tokens SANS collision avec les utilitaires statiques de Tailwind : vérifier dans le CSS émis que la classe générée référence bien `var(--token)` (ex. `--container-prose` est écrasé par le `max-w-prose` legacy à 65ch → token nommé `--container-reading`).
- Les `var(--color-*)` ne servent QUE dans le CSS hors portée de Tailwind : blocs `<style>` scoped et global.css (ex. `.prose-content`). Jamais de couleur/valeur en dur nulle part.
- Arbitraire (`p-[13px]`, `text-[var(--x)]`) toléré uniquement si aucun utilitaire n'est généré pour ce token — le vérifier avant, et préférer ajouter le token à @theme.
- Contenu Markdown rendu : classe .prose-content sur le conteneur.
- Surface de carte : Card.astro est LA surface canonique (fond + bordure + radius). Un wrapper ne pose jamais une surface que son slot porte déjà (anti double-carte). Une carte dont la bordure/teinte encode une information garde son identité et ne reçoit que la surface neutre.
- Largeur : toute section passe par <Container> (gouttière + boîte centrée unique). Aucune surcharge de largeur de section en px ; seules exceptions : colonnes de LECTURE (prose, corps d'article), listées au registre.
- Design system léger et évolutif : affiner les tokens au fil de l'eau plutôt que multiplier des valeurs custom en dur.
