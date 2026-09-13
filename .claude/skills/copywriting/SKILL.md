---
name: copywriting
description: Charger pour écrire ou réécrire tout texte visible d'un site (hero, sections, CTA, pages, méta, FAQ, articles) à partir d'un brief - hiérarchie de message, copy par type de section, voix du client, typographie française, self-audit avant livraison. Le maillon qui sépare un beau template d'un site qui convertit.
---

# Copywriting — du brief au texte final

Le design vient du kit, le contenu vient d'ICI. Un texte générique sur une belle section donne un site
générique. Tout ce qui suit est contrôlable en relecture.

## Avant d'écrire : la hiérarchie de message (par page, écrite dans page-spec)
1. **Promesse** (une phrase) : ce que le visiteur obtient, formulé de son point de vue.
2. **Preuves** (3 max, sourcées dans le brief) : chiffres, clients, méthode, garantie.
3. **Objection principale** et sa réponse (alimente FAQ ou une section dédiée).
4. **Intention unique de CTA** de la page (« Demander un devis » ≠ « Nous contacter » ≠ « Essayer »).
Sans brief pour un item : le marquer `<!-- à confirmer -->`, jamais inventer une preuve.

## Copy par type de section (règles comptables)
- **Hero** : titre ≤ 2 lignes desktop (≈ 8-12 mots), formulé bénéfice, pas nom de produit ; sous-texte ≤ 20 mots qui précise pour qui et comment ; 1 CTA primaire à l'intention de la page.
- **Features / services** : titre = bénéfice, corps = mécanisme (comment on l'obtient), 1-2 phrases, parallélisme grammatical entre items (tous verbes ou tous noms).
- **Preuve** : chiffre + contexte + source (« 430 pages migrées en 6 semaines, client X »). Témoignage = résultat concret, pas adjectifs ; nom, rôle, entreprise réels ou `<!-- mock -->`.
- **Process** : étapes numérotées à l'infinitif ou à l'impératif, une phrase d'issue par étape.
- **FAQ** : la question telle qu'un client la pose ; réponse autonome (citable hors contexte, GEO), 2-4 phrases, factuelle.
- **CTA** : verbe d'action + objet concret ; jamais « En savoir plus » seul, jamais « Cliquez ici ».
- **Pages éditoriales / articles** : intro de 2-3 phrases qui répond à l'intention de recherche, H2 sémantiques en questions ou affirmations, `tldr` 1-2 phrases citables, `description` 140-160 car., `title` ≤ 60.

## Voix et registre
- La voix se déduit du brief (ton, exemples, concurrents) et s'écrit en 3 adjectifs + 3 interdits dans docs/brief.md ; tout texte s'y tient.
- Tutoiement/vouvoiement : décidé une fois, tenu partout.
- Interdits par défaut : superlatifs sans preuve (« leader », « meilleur »), jargon interne, buzzwords (« solutions innovantes », « accompagnement sur-mesure »), phrases creuses de transition, exclamations.

## Typographie française (contrôlable au grep)
- Zéro tiret cadratin `—` ni demi-cadratin `–` (règle craft-floor). Incise : virgules, parenthèses, deux-points.
- Espace insécable avant `: ; ! ?` et à l'intérieur des guillemets français « … » ; jamais de guillemets droits "…" en texte visible.
- Nombres : espace insécable comme séparateur de milliers, virgule décimale, `%` précédé d'une insécable.
- Majuscule initiale seule dans les titres (pas de Title Case) ; sigles expliqués à la première occurrence.

## Self-audit (gate avant livraison, dans le récap)
Relire CHAQUE chaîne visible (titres, sous-titres, labels, boutons, alt, footer, méta, erreurs) :
- grammaire et référent clairs ; aucune phrase « mignonne mais fausse » ; dans le doute, phrase fonctionnelle plate ;
- chaque chiffre a sa source dans le brief ou porte `<!-- mock -->` ;
- un label par intention de CTA, identique partout sur le site ;
- aucune promesse absente du brief ; aucun texte de démonstration du template restant (grep « Lorem », noms de démo).
Le récap liste : hiérarchie de message par page, items `à confirmer`, chiffres mock.
