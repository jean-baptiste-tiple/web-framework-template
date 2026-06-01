# i18n (opt-in — NON installé)
Routing multilingue Astro : fr par défaut à la racine, /en préfixé. Retiré du socle ; voici comment l'ACTIVER.

À ajouter/créer :
- astro.config.mjs : bloc `i18n: { defaultLocale: 'fr', locales: ['fr','en'], routing: { prefixDefaultLocale: false } }`.
- src/i18n/ui.ts : dictionnaire des chaînes UI + helpers (useTranslations, getLangFromUrl).
- src/components/ui/LanguagePicker.astro : bascule FR/EN (à intégrer dans Header.astro).
- src/pages/en/ : pages localisées.
- prop `alternates` (hreflang) sur BaseLayout + BaseHead, et `<link rel="alternate" hreflang>` dans BaseHead.

Contenu éditorial multilingue : collections par locale (blog/fr, blog/en) ou champ `lang` — à câbler selon le besoin.
