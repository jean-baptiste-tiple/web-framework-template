# Formulaires (statique)

- Pas de backend : le site ne parle qu'AU fournisseur de forms (Formspree, Web3Forms, HubSpot…), en fetch vanilla vers son API publique. JAMAIS de SDK ni d'embed JS/UI du fournisseur.
- PUBLIC_FORM_ENDPOINT — variable inlinée AU BUILD : à définir dans l'env de build de l'hébergeur.
- Validation côté client minimale (HTML required/type) + validation côté service.
- Anti-spam : honeypot + time-trap (rejet des soumissions trop rapides). Pas de secret côté client.
- Intégré au socle (ContactForm.astro + /contact). Vanilla, aucune hydratation.

## Règles quand le fournisseur a un schéma serveur (HubSpot et similaires)
- Les champs envoyés DOIVENT couvrir TOUS les champs `required` du schéma SERVEUR du form, sinon 400 à chaque soumission — silencieux côté visiteur. Relever le schéma via l'API du fournisseur (jamais l'inventer : ni champs, ni labels, ni options) ; tout changement du form côté fournisseur ⇒ re-relever et mettre à jour.
- Un form qui n'affiche qu'un email est peut-être l'étape 1 d'un form multi-étapes : implémenter les étapes, pas réduire les champs.
- Envoyer le contexte de la page d'origine à chaque soumission (ex. pageUri) : base du routage et de la segmentation en aval.
- Une intention = un form dédié. Ne jamais détourner un form existant (ex. newsletter) pour une autre intention : l'aval taguerait faux.
- Configurations de forms factorisées dans un module partagé de src/lib/ (schémas relevés sur l'API), pas dupliquées aux call-sites.
- Mécanismes fermés, à réutiliser tels quels : form multi-champs · capture email 1 champ · téléchargement gated (le succès du form révèle le lien).
- L'aval (notifications, tâches, emails) vit dans l'outil marketing (workflows natifs), pas dans le site.

## Tester
- JAMAIS de soumission de test sur un form branché à des automatisations réelles (notifications, création de contact/lead) : tester uniquement sur un form sans workflow actif.
- Tester depuis la préprod : une protection type Basic Auth ne bloque pas le POST (il part du navigateur).
- Relever le payload d'un form existant plutôt que le déduire de la doc (certains services exigent des champs inattendus).

## Implémentation de référence (intégré au socle)
src/components/ui/ContactForm.astro — composant vanilla (PAS d'îlot Solid, aucune hydratation) : un `<script>` attache le submit, fetch POST FormData vers PUBLIC_FORM_ENDPOINT (header Accept: application/json). Honeypot _gotcha. États gérés en DOM (bouton disabled + messages ok/error). Utilisé tel quel dans src/pages/contact.astro, sans directive client:*.
