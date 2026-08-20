# Checklist — Apprentissage après erreur (gate d'auto-contrôle)

L'écriture d'un apprentissage est **automatique, sans validation humaine**. Ce gate remplace
l'accord : une règle qui ne passe pas TOUS les points ne s'écrit pas (elle va au journal
`docs/learnings.md` en observation, et c'est tout).

- [ ] **Généralisable.** La règle décrit la CLASSE d'erreur, pas l'instance. Test : en masquant
      les noms propres (page, composant, URL), la règle reste vraie pour le prochain site issu du
      template. Sinon : journal seulement, pas de règle.
- [ ] **Contrôlable.** En relisant la règle, on peut vérifier qu'elle a été tenue — par une
      machine (lint, astro check, build) ou par une citation en review
      (`conventions/<fichier>.md § <section>`). « Faire attention à X » ne se contrôle pas :
      interdit. Reformuler jusqu'à ce que la violation soit détectable.
- [ ] **Non dupliquée.** Chercher d'abord (grep) dans les conventions du tag concerné ET dans
      CLAUDE.md. Si une règle existante couvre déjà le cas : la renforcer sur place (préciser,
      ajouter le gotcha), ne jamais créer un doublon.
- [ ] **Au bon emplacement.** Suivre la table de routage de CLAUDE.md § Après une erreur.
      Jamais de nouveau fichier de convention sans mise à jour de `_index.md` (globs + tag).
- [ ] **Pérenne.** Tout chemin, commande ou nom cité dans la règle existe dans le repo au moment
      de l'écriture (le vérifier, pas le supposer). La règle se comprend seule, sans le contexte
      de l'erreur qui l'a motivée.
- [ ] **Sobre.** La règle tient en ≤ 5 lignes. Le fichier cible reste sous ~400 lignes ; s'il
      déborde, élaguer une règle devenue mécanisée (couverte par lint/build) plutôt qu'empiler.
- [ ] **Journalisée.** Entrée datée ajoutée à `docs/learnings.md` (format dans le fichier) :
      c'est la trace qui permet à l'humain d'auditer et de révoquer a posteriori. Une règle
      écrite sans entrée de journal est une règle clandestine.
- [ ] **Vérifiée.** Si la règle cite du code ou un exemple : lint + build encore verts après
      l'écriture. Une règle qui casse le build est pire que l'erreur qu'elle prévient.

**Hors périmètre du gate** : un invariant d'architecture (règles absolues de CLAUDE.md) ne se
change JAMAIS automatiquement — proposer un ADR (`docs/decisions/`) et attendre l'accord.
