# Intégrer un bloc ou une page — le coup d'œil d'ensemble

Pour ajouter, déplacer ou retirer un bloc, créer une page, ajouter un lien au menu. Le défaut
d'un agent est de trouver une place au nouveau bloc, pas de se demander si la page le supporte
encore : une boîte de plus à chaque demande, et plus personne ne sait à quoi sert la page.
Les seuils ci-dessous ne se recopient pas : ils citent `composition.md` et `a11y.md`.

## Avant de toucher la page

1. **Capturer la page telle qu'elle est**, ordinateur et téléphone, page entière
   (`node scripts/verify/shot.mjs <adresse> .captures/<page>-avant-1440.png 1440 --full`,
   puis 390). Pas de navigateur : capturer avec l'outil navigateur de la session, et le dire.
2. **Inventaire en une ligne** : à quoi sert la page, son action principale, la suite de ses
   blocs dans l'ordre.
3. **Coup d'œil d'ensemble** : la page dira-t-elle encore en une phrase à quoi elle sert, une
   fois le changement fait ? Test de mémoire du premier écran (`composition.md` § Sections).

## Seuils qui imposent de réorganiser plutôt qu'ajouter

Un seuil franchi par le changement demandé, et seulement alors, déclenche une question :

- une famille de layout présente deux fois sur la page, ou une 3e section image+texte
  d'affilée (`composition.md` § Sections) ;
- deux appels à l'action pour la même intention, ou deux boutons primaires dans un même écran
  (`composition.md` § CTA, `a11y.md`) ;
- un hero qui dépasse 4 éléments texte (`composition.md` § Hero) ;
- plus de 5 entrées dans le menu (`a11y.md`) ;
- un bloc qui redit ce qu'un autre bloc de la page dit déjà (mêmes témoignages, mêmes
  avantages, même FAQ) ;
- l'action principale de la page repoussée sous le premier écran.

## Ce qu'on fait

- **Aucun seuil franchi** : on fait exactement ce qui est demandé, sans question.
- **Un seuil franchi** : une question `AskUserQuestion` en mots courants, née de la demande,
  jamais d'une idée de l'agent. Options typiques, la recommandation en premier :
  - « l'ajouter tel quel » (et la conséquence visible, dite simplement : « la page aura deux
    blocs de témoignages ») ;
  - « remplacer le bloc <nom> par le nouveau » ;
  - « fusionner avec le bloc <nom> » (un bloc existant reçoit le nouveau contenu) ;
  - « réorganiser <le haut de la page / le menu> » : dire ce qui bouge.
- **L'option la plus petite est toujours regardée** : compléter un bloc existant plutôt
  qu'en ajouter un, retirer ce que le nouveau rend inutile. Intégrer, c'est aussi retirer.
- **La demande de l'éditeur gagne** (`design-craft` principe 1) : s'il choisit « tel quel »,
  on le fait, sans y revenir.
- **Refaire toute la page** n'est pas une édition : c'est un chantier (branche), et une refonte
  complète passe par le cadrage (`modifier-design` § Hors périmètre).

## Après le changement

Changement de structure (bloc ajouté, déplacé ou retiré, page créée, code d'une page) : la
session lance l'agent `relecteur-visuel` avec les captures avant, une seule passe
(`design-craft` principe 4). Ses remarques se corrigent si elles ne contredisent pas la
demande ; sinon elles deviennent une question, en mots courants. Texte, image, faute,
couleur d'un bloc existant : pas de relecture, `verifier` suffit.

## Chemin développeur (code d'une page, bloc nouveau, landing composée)

Avant le code, l'agent `concepteur` écrit le brief de conception (captures avant, coup d'œil
d'ensemble, au moins deux options dont la plus petite, blocs de la bibliothèque réutilisés,
texte exact, critères visibles sur capture). Il s'appuie sur `.claude/templates/page-spec.md`
pour une page nouvelle. Après le rendu, `relecteur-visuel` juge contre ce brief.
