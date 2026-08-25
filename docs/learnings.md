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

## 2026-08-25 — « Contraste suffisant (tokens prévus pour) » : affirmation fausse et invérifiable
- **Erreur** : a11y.md garantissait le contraste par construction, mais `text-muted` sur `bg-surface` = 4.43:1 (< 4.5:1) sur les 4 archétypes de page — détecté par le premier audit Lighthouse machine, jamais par la règle relue.
- **Règle écrite** : toute paire de tokens texte/fond utilisée en markup tient ≥ 4.5:1, contrôlée par `pnpm run audit:lh` (audit `color-contrast`) après tout changement de token couleur. Token `--color-muted` corrigé (oklch 55% → 52%).
- **Emplacement** : `.claude/conventions/a11y.md` ; contrôle machine via lighthouserc.json.

## 2026-08-25 — « lazy par défaut hors hero » : règle non actionnable, hero lazy en prod
- **Erreur** : performance.md disait « lazy par défaut hors hero » sans dire qu'`<Image>` d'astro:assets met `loading="lazy"` d'office : les deux heros du socle partaient lazy (LCP dégradé, signalé par Lighthouse), et la règle relue ne permettait pas de le détecter.
- **Règle écrite** : image LCP = `loading="eager"` + `fetchpriority="high"` explicites, toutes les autres lazy, une seule eager par page — contrôlable en review par lecture du call-site.
- **Emplacement** : `.claude/conventions/performance.md § Lighthouse` + `.claude/checklists/code-review.md § A11y/perf`.

## 2026-08-25 — Le build du socle ne passait que parce qu'aucun contenu d'exemple n'a d'image
- **Erreur** : `sharp` absent des dépendances — `astro build` casse en `MissingSharp` dès qu'un contenu porte une vraie image ; invisible sur le template car les exemples n'en ont aucune. Le premier site dérivé qui ajoute un `heroImage` hérite de l'erreur.
- **Règle écrite** : aucune (fix : `sharp` en devDependency du socle ; le build exerce le pipeline dès la première image). Observation : un chemin du socle qu'aucun contenu d'exemple n'exerce est un chemin non testé — 2e occurrence = règle sur les contenus d'exemple.
- **Emplacement** : journal seulement.

## 2026-08-20 — Token @theme écrasé en silence par un utilitaire statique Tailwind
- **Erreur** : `--container-prose: 42rem` ne générait PAS `max-w-prose` : Tailwind 4 garde un `max-w-prose` statique (65ch) qui gagne. La migration vers l'utilitaire aurait changé la largeur de lecture sans erreur de build — détecté en vérifiant le CSS émis.
- **Règle écrite** : nommer les tokens sans collision avec les utilitaires statiques, et vérifier dans le CSS émis que la classe générée référence `var(--token)`.
- **Emplacement** : `.claude/conventions/styling-tailwind.md` ; token renommé `--container-reading`.

## 2026-08-20 — La convention styling enseignait l'inverse de la pratique tenable
- **Erreur** : la convention imposait la forme arbitraire `bg-[var(--color-accent)]` alors que Tailwind 4 génère les utilitaires sémantiques depuis @theme ; le site enfant (merciyanis) a dû inverser la règle après usage (son ADR 0008), et le socle entier suivait la mauvaise forme.
- **Règle écrite** : classes générées par @theme en markup, `var(--color-*)` réservé aux blocs `<style>` scoped ; arbitraire seulement si aucun utilitaire n'est généré. Code du socle migré dans le même commit (une règle contredite par le code du socle est morte à la naissance).
- **Emplacement** : `.claude/conventions/styling-tailwind.md` ; reprise dans CLAUDE.md § Règles Astro 4 et coding-standards.md.
