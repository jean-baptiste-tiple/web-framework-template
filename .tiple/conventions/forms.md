# Formulaires (statique)

- Pas de backend : un formulaire poste vers un service tiers (Formspree, Web3Forms) via PUBLIC_FORM_ENDPOINT — variable inlinée AU BUILD : à définir dans l'env de build de l'hébergeur.
- Validation côté client minimale (HTML required/type) + validation côté service.
- Anti-spam : honeypot. Pas de secret côté client.
- Intégré au socle (ContactForm.astro + /contact). Vanilla, aucune hydratation.

## Implémentation de référence (intégré au socle)
src/components/ui/ContactForm.astro — composant vanilla (PAS d'îlot Solid, aucune hydratation) : un `<script>` attache le submit, fetch POST FormData vers PUBLIC_FORM_ENDPOINT (header Accept: application/json). Honeypot _gotcha. États gérés en DOM (bouton disabled + messages ok/error). Utilisé tel quel dans src/pages/contact.astro, sans directive client:*.
