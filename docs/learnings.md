# Journal des apprentissages

Trace auditable de la boucle « Après une erreur » (CLAUDE.md). Chaque règle écrite dans les
conventions, checklists ou CLAUDE.md suite à une erreur laisse ici une entrée datée — c'est ce
qui permet de relire, contester ou révoquer un apprentissage enregistré sans validation.

Les observations trop spécifiques pour devenir une règle (échec du gate « généralisable »)
s'enregistrent aussi ici : deux occurrences d'une même observation = candidate à généralisation.

Format d'une entrée :

```
## AAAA-MM-JJ — <titre court>
- **Erreur** : ce qui s'est passé (1-2 phrases, factuel).
- **Règle écrite** : la règle, ou « aucune (observation) ».
- **Emplacement** : `<fichier> § <section>`, ou « journal seulement ».
```

<!-- Les entrées s'ajoutent ci-dessous, la plus récente en premier. -->

## 2026-08-20 — Token @theme écrasé en silence par un utilitaire statique Tailwind
- **Erreur** : `--container-prose: 42rem` ne générait PAS `max-w-prose` : Tailwind 4 garde un `max-w-prose` statique (65ch) qui gagne. La migration vers l'utilitaire aurait changé la largeur de lecture sans erreur de build — détecté en vérifiant le CSS émis.
- **Règle écrite** : nommer les tokens sans collision avec les utilitaires statiques, et vérifier dans le CSS émis que la classe générée référence `var(--token)`.
- **Emplacement** : `.tiple/conventions/styling-tailwind.md` ; token renommé `--container-reading`.

## 2026-08-20 — La convention styling enseignait l'inverse de la pratique tenable
- **Erreur** : la convention imposait la forme arbitraire `bg-[var(--color-accent)]` alors que Tailwind 4 génère les utilitaires sémantiques depuis @theme ; le site enfant (merciyanis) a dû inverser la règle après usage (son ADR 0008), et le socle entier suivait la mauvaise forme.
- **Règle écrite** : classes générées par @theme en markup, `var(--color-*)` réservé aux blocs `<style>` scoped ; arbitraire seulement si aucun utilitaire n'est généré. Code du socle migré dans le même commit (une règle contredite par le code du socle est morte à la naissance).
- **Emplacement** : `.tiple/conventions/styling-tailwind.md` ; reprise dans CLAUDE.md § Règles Astro 4 et coding-standards.md.
