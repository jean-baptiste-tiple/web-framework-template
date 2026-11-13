# Modifier le site <Nom du site> avec Claude Code

<!-- Gabarit du socle (CLAUDE.md § Demandes non techniques). Copié au bootstrap vers docs/guide-edition.md, puis rempli : remplacer chaque <…>, retirer les sections sans objet, ajouter les tâches propres au site (fiches, événements…). Écrit pour un éditeur novice : phrases complètes, aucun nom de fichier ni mot de git (CLAUDE.md § Circuit de publication, vocabulaire). Retirer ce commentaire. -->

Guide pour <l'équipe qui édite le site>. Version du <date>, à relire avec <relecteur côté client>.

Vous n'avez rien à coder : vous écrivez à Claude Code ce que vous voulez, en phrases normales, et il s'occupe du reste. Ce guide donne, pour chaque tâche courante, ce qu'il faut préparer et la phrase à lui dire.

## Avant de commencer

- Ouvrez https://claude.ai/code dans votre navigateur et choisissez le dépôt `<dépôt>` (rien à installer : § Où travailler). Pour commencer, demandez : « Où j'en suis ? ». Claude vous dit ce qui attend sur le site de test et vos chantiers en cours.
- Une demande par message, c'est le plus simple ; si vous en mettez plusieurs, Claude les liste et les traite une par une.
- S'il hésite entre deux façons de comprendre votre demande, il vous pose la question avec des choix. Répondez simplement.
- Il n'invente rien : chiffre, date, nom d'une personne, citation d'un client. S'il lui manque une information, il vous la demande.
- Si vous ne savez pas par où commencer : « Qu'est-ce que je peux faire sur le site ? »

## Site de test, site officiel et branches (à lire une fois)

### Le cas courant : le site de test, puis le site officiel

1. **Le site de test**, <adresse TEST> : la version de travail que vous relisez. Une petite modification (un texte, une faute, un article, une image, une question de FAQ, un lien du menu) s'y fait **directement**, sans rien d'autre à demander : Claude modifie, l'envoie sur le site de test et vous donne le lien de la page. Comptez deux minutes pour la voir à jour.
2. **Le site officiel**, <adresse de production>, celui que voient vos visiteurs : c'est le seul qui soit « en ligne ». Quand c'est bon, dites « Mets en ligne » : Claude résume ce qui part et vous demande confirmation. Attention : **tout ce qui est sur le site de test part**, y compris les modifications de vos collègues ; le résumé les cite. Si l'une n'est pas prête : « Retire … du site de test ».

### Les branches : seulement pour un chantier

Une **branche** est une copie du site à part, avec sa propre adresse d'**aperçu**. Elle sert à un chantier qu'on ne veut pas voir sur le site de test tant qu'il n'est pas fini : une page refaite sur plusieurs jours, une nouvelle page, plusieurs pages à reprendre, un essai qu'on n'est pas sûr de garder. Claude en propose une quand c'est le cas, en disant pourquoi ; vous pouvez aussi la demander (« ouvre une branche pour la refonte de la page Tarifs »).

- Chaque modification du chantier part sur son aperçu, sans rien vous demander.
- Chantier fini : « Envoie sur le site de test ». Claude résume et attend votre « oui ».
- **Deux branches en cours au plus par personne.** Pour en ouvrir une troisième, il faut d'abord finir ou abandonner l'une des deux.
- Ne demandez pas de branche pour une petite modification : elle irait plus vite directement sur le site de test.

À la fin de chaque réponse, Claude rappelle où vous en êtes : le lien sur le site de test ou sur le site officiel (ou la branche et son aperçu), et la prochaine étape.

> « Où j'en suis ? » · « Qu'est-ce qui attend sur le site de test ? » · « Montre-moi le résultat. »
>
> « Mets en ligne. » · « Retire <sujet> du site de test. »
>
> « Ouvre une branche pour… » · « Quelles sont mes branches ? » · « Envoie la branche sur le site de test. » · « Laisse tomber cette branche. »

## Changer un texte sur une page

Préparez : la page (son adresse ou son nom), le texte actuel (un copier-coller suffit) et le nouveau texte.

> « Sur la page <page>, remplace "<ancien texte>" par "<nouveau texte>". »
>
> « Sur la page <page>, corrige la faute dans le titre. »
>
> « Ajoute une question à la FAQ de la page <page> : … »

Certains textes s'affichent sur plusieurs pages. Claude vous demande alors si le changement vaut partout ou seulement sur cette page.

Si vous ne savez pas d'où vient un texte : « D'où vient la phrase "…" sur la page d'accueil ? »

## Changer un texte présent sur tout le site

Menu du haut, pied de page, bouton principal, coordonnées, réseaux sociaux, FAQ commune.

> « Dans le pied de page, ajoute un lien "<libellé>" vers <adresse>. »
>
> « Mets à jour notre adresse : … »

Claude vous prévient que le changement s'affiche sur toutes les pages.

## Ajouter un article au blog

Préparez :

- le texte (copier-coller, fichier Word ou PDF, Google Doc) ;
- l'auteur (s'il n'a jamais écrit sur le blog : son nom et son rôle) ;
- une image à la une si vous en avez une, et ce qu'elle montre.

> « Publie cet article sur le blog, auteur <nom>. » (et joignez le fichier)

Claude prépare l'article (titre pour Google, résumé, mise en forme, typographie), puis vous le montre sur le site de test. Il ne change pas le fond sans votre accord.

### Programmer un article

> « Programme cet article pour le 12 novembre. »

L'article est visible tout de suite sur le site de test, avec sa date. Mettez-le en ligne quand vous voulez avant ce jour-là : il restera caché sur le site officiel, puis paraîtra seul le jour venu, tôt le matin.

## Corriger un article existant

> « Dans l'article sur <sujet>, remplace le chiffre de 2025 par celui de 2026 : … »

Donnez la source d'un chiffre réglementaire ou d'une citation : Claude ne complète pas de mémoire.

## Changer une photo

Préparez : la photo (la plus grande version disponible), ce qu'elle montre, et pour une personne son accord pour apparaître sur le site.

> « Change la photo du haut de la page <page>. » (joignez-la)

Claude range la photo, écrit sa description pour les personnes malvoyantes et vous montre le résultat sur ordinateur et sur téléphone.

## Mieux apparaître sur Google

> « Améliore le référencement de la page <page>. »
>
> « Le titre de la page <page> est coupé dans Google. »

Claude vous montre l'état actuel et ses propositions, avant / après, puis applique ce que vous validez.

## Voir les blocs disponibles

La bibliothèque montre tous les blocs du site : <adresse TEST>/styleguide/ (sur le site de test seulement, jamais sur le site officiel). Une fiche par bloc : son nom, son aperçu, et les pages qui l'utilisent. Pour en utiliser un, citez son nom à Claude : il vous dit s'il l'ajoute directement ou si c'est un chantier.

> « Ajoute le bloc <nom du bloc> en bas de la page <page>. »

## Voir le résultat

> « Montre-moi le résultat. »

Claude vous donne le lien de la page modifiée sur le site de test (ou sur l'aperçu de votre branche). À chaque envoi, le site entier est reconstruit et contrôlé : si la page se met à jour, rien n'est cassé. Sinon, Claude vous explique pourquoi et corrige.

## Mettre en ligne

> « C'est bon, mets en ligne. »

Claude résume tout ce qui est sur le site de test, car tout part ensemble. Puis une fenêtre s'ouvre : « Autoriser Claude à exécuter cette commande ? », avec la question « Souhaitez-vous mettre en ligne ces changements sur le site officiel ? » et la commande `npm run mettre-en-ligne`. C'est normal : « Autoriser une fois » veut dire OUI, « Refuser » veut dire NON (rien ne change). Claude met en ligne, vérifie, puis vous donne l'adresse de la page sur le site officiel.

> « C'est en ligne ? » · « Pourquoi je ne vois pas ma modification ? »

Claude vous dit où elle en est : sur l'aperçu d'une branche, sur le site de test, sur le site officiel, ou programmée.

## Revenir en arrière

> « Annule ma dernière modification. » · « Remets la page <page> comme hier. »

Claude défait la modification là où elle se trouve (aperçu, site de test ou site officiel) sans toucher au reste. Sur le site officiel, la même fenêtre de confirmation s'ouvre avant.

## Les changements plus profonds

Vous pouvez tout faire vous-même avec Claude, y compris changer l'apparence d'une page, créer un nouveau type de bloc, ajouter un formulaire ou changer l'adresse d'une page connue de Google. Claude vous prévient que c'est plus délicat qu'une modification de texte, ouvre une branche, vous montre l'avant et l'après sur ordinateur et sur téléphone, et l'envoie sur le site de test quand vous dites oui.

## Où travailler : dans le navigateur, sans rien installer

Ouvrez https://claude.ai/code, choisissez le dépôt `<dépôt>` et écrivez votre demande. Claude travaille sur une copie du site chez Anthropic : votre ordinateur n'a besoin de rien d'autre qu'un navigateur. Une session par sujet : quand c'est en ligne, ouvrez une nouvelle session pour la demande suivante.

<!-- Modèle à conseiller : pour une petite modification, le modèle rapide ; pour une nouvelle page ou un chantier, le plus capable. Écrire leurs noms actuels. -->

## Ce qu'il faut à chaque personne (à vérifier une fois)

- Compte GitHub invité sur le dépôt `<dépôt>`, avec droit d'écriture.
- Compte Claude avec Claude Code, GitHub connecté dans claude.ai/code.
- Environnement cloud qui laisse joindre le site de test et le site officiel (`.claude/checklists/bootstrap.md`, sessions cloud).

Comptes, licences et environnement : <contact>.
