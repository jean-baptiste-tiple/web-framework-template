# Astro patterns

- Pages = routing fichier dans src/pages/. Une page = un BaseLayout + des composants.
- Collections rendues via getCollection + render(entry) (Astro 5 : import { render } from "astro:content"). Pas entry.render().
- getStaticPaths : params.slug = entry.id (Astro 5, sans extension).
- Routing racine : [...slug].astro sert landings + pages. /blog/* et /index gagnent (routes plus spécifiques prioritaires). Ne pas ajouter un second catch-all racine.
- Filtrer les brouillons : getCollection("blog", ({data}) => !data.draft).
- Pas de meta en dur dans une page : passer par BaseLayout (meta, type, faq, breadcrumbs).
- Un `<script>` de .astro est compilé à part : il ne voit NI les props NI les const du frontmatter. Toute valeur que le markup rend depuis une prop et que le script réécrit ensuite (libellé de bouton, texte d'état) se LIT dans le DOM avant d'être remplacée, jamais redite en littéral — sinon le littéral gagne en silence dès qu'un call-site passe autre chose, et le défaut du composant masque le bug. Contrôlable en review : une chaîne visible écrite à la fois dans le markup et dans le `<script>` du même fichier est une violation (référence : `src/components/ui/ContactForm.astro`, libellé d'envoi).
