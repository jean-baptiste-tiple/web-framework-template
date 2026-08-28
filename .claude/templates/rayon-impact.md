# Rayon d'impact — <changement>

Obligatoire dès que le changement dépasse 1-2 fichiers OU crée une surface (composant, variante,
util src/lib/, champ Zod, collection, route, token). Écrit AVANT la première ligne, dans le plan
proposé en live ou dans la spec de page. Règle : CLAUDE.md § Avant de coder › Rayon d'impact.

## Appelants
<!-- Pour CHAQUE composant / fonction / champ / collection / route modifié : la commande de recherche
     citée avec chemin absolu (ex. `rg -n "<Faq" c:\apps\<site>\src`), la liste des usages trouvés,
     et ce qui change pour chacun. « Aucun autre appelant » = la commande et son résultat vide,
     jamais une affirmation. -->

## Doublons
<!-- Ce qui fait déjà la même chose : entrée du component-registry, galerie /styleguide, recherche
     sur le concept (pas seulement sur le nom). Verdict par doublon : réutiliser / fusionner (gabarit
     fusion-a-trancher.md) / laisser — et pourquoi. -->

## Effet produit
<!-- Quel parcours voit une différence hors du fichier modifié : autres pages qui rendent le
     composant, fichiers générés au build (sitemap.xml, llms.txt, rss.xml, robots.txt, JSON-LD),
     formulaire de contact (PUBLIC_FORM_ENDPOINT), redirections (astro.config), galerie /styleguide,
     sites dérivés du template (tout changement du socle leur est hérité). « Aucun » se justifie
     item par item. -->

## Refacto
<!-- Proposé ou écarté — écrit dans tous les cas. Proposé ⇒ question posée via AskUserQuestion avec
     le coût et la conséquence de ne pas le faire ; non fait tant qu'il n'y a pas d'accord. Écarté ⇒
     la raison. Un refacto repéré et tu est une violation. -->
