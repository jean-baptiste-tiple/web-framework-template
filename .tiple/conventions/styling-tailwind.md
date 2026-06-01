# Styling (Tailwind 4)

- Config CSS-first : tokens dans @theme (src/styles/global.css). Pas de tailwind.config.js.
- Couleurs/espacements via tokens : var(--color-bg/fg/muted/border/surface/accent), var(--radius).
- Classes utilitaires sémantiques. Arbitraires uniquement pour référencer un token : bg-[var(--color-accent)].
- Contenu Markdown rendu : classe .prose-content sur le conteneur.
- Tokens provisoires : seront remplacés par le design system Tiple. Ne pas multiplier les valeurs custom.
