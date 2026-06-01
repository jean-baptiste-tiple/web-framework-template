# forms (intégré au socle)
Formulaire de contact statique posté vers un service tiers (Formspree/Web3Forms). Aucun backend, aucune hydratation.
Fichiers : src/components/ui/ContactForm.astro (composant vanilla, `<script>` intégré), src/pages/contact.astro, variable PUBLIC_FORM_ENDPOINT (.env).
Honeypot anti-spam + états envoi/succès/erreur. Sans endpoint, le formulaire le signale.
Retirer : supprimer ContactForm.astro + contact.astro + l'entrée "Contact" de la nav dans src/content/settings/site.json.
