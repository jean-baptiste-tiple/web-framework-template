---
title: "Zéro JavaScript par défaut : ce que ça change"
description: "Un site statique sans runtime côté client charge plus vite et tombe moins souvent en panne. Ce que ce choix impose au quotidien, et ses limites."
pubDate: 2026-06-18
updatedDate: 2026-07-02
author: "jb"
category: "guides"
tags: ["performance", "astro"]
topics: ["performance web", "rendu statique", "accessibilité"]
heroImage: "./zero-javascript-par-defaut.png"
heroImageAlt: "Trois cadres rectangulaires empilés en décalé, le plus proche tracé en bleu, sur fond gris clair."
draft: false
tldr: "Le socle n'envoie aucun framework au navigateur : les composants sont rendus au build et le HTML suffit. Un îlot interactif reste possible, mais il doit être demandé par un besoin d'état ou d'événement, pas par habitude."
faq:
  - q: "Un site sans JavaScript peut-il être interactif ?"
    a: "Oui pour l'essentiel des besoins d'un site vitrine : un accordéon se fait avec l'élément natif details, un menu avec des liens, une validation de formulaire avec les attributs required et type. Le JavaScript ne devient nécessaire que pour un état à conserver ou un échange réseau."
  - q: "Comment vérifier qu'aucun script ne s'est glissé dans le build ?"
    a: "La commande pnpm run audit:lh lance Lighthouse sur le dossier dist et échoue si un score passe sous 0,95. Un fichier JavaScript inattendu se voit aussi dans dist/_astro, qui reste vide de bundles tant qu'aucun îlot n'est hydraté."
---

## Un réglage par défaut, pas une prouesse

Les composants de ce socle sont rendus pendant le build. Le navigateur reçoit du HTML et une
feuille de style, rien d'autre. Ce n'est pas un exploit d'optimisation : c'est l'état initial, et
c'est l'ajout de JavaScript qui devient la décision à justifier.

La conséquence pratique tient en une phrase : il n'y a pas de phase pendant laquelle la page est
affichée mais inutilisable. Un lien fonctionne dès que le HTML est là, y compris sur une connexion
lente, sur un vieux téléphone, ou quand un script tiers refuse de se charger.

## Ce que le HTML natif couvre déjà

Beaucoup de composants pour lesquels on installe un framework existent dans le navigateur depuis
des années.

- Un accordéon ou une FAQ : l'élément `details` avec son `summary`. Le contenu reste dans le
  document même replié, donc indexable et trouvable au Ctrl+F.
- Une navigation : des liens. Un menu déroulant sur mobile peut se faire avec le même `details`.
- Une validation de formulaire : les attributs `required`, `type="email"` et `pattern` déclenchent
  les messages du navigateur, traduits dans la langue de l'utilisateur.
- Un défilement doux : la propriété CSS `scroll-behavior`.

Ces éléments arrivent avec leur comportement clavier et leur restitution par les lecteurs d'écran.
Un composant maison doit les réimplémenter, et c'est là que l'accessibilité se perd.

## Quand un îlot se justifie vraiment

Trois signaux, et ils se cumulent rarement sur un site vitrine : un état qui doit survivre à
plusieurs interactions, un échange réseau pendant la visite, ou une mise à jour qui ne peut pas
attendre le prochain build.

Le formulaire de contact du socle illustre la frontière. Il a besoin d'un appel réseau, donc de
JavaScript, mais pas d'un framework : une vingtaine de lignes dans une balise `script` suffisent à
intercepter l'envoi et à afficher un message. Le budget reste à zéro composant hydraté.

## Le coût d'un framework ajouté

Ajouter une bibliothèque d'interface ne coûte pas seulement son poids en kilo-octets. Elle
introduit une deuxième façon d'écrire un composant, une deuxième façon de styler, un cycle de mise
à jour, et une tentation permanente de la réutiliser là où le HTML suffisait. La règle du socle est
donc binaire : aucun framework par défaut, et l'installation devient une décision tracée.

## Comment le vérifier

La commande `pnpm run audit:lh` construit le site puis lance Lighthouse sur quatre pages
représentatives. Les quatre catégories sont assertées au-dessus de 0,95 : une régression de
performance, d'accessibilité ou de SEO fait échouer la commande au lieu de passer inaperçue.
