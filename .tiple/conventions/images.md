# Images

- astro:assets. Dans le frontmatter : heroImage/hero.image typés via image() (colocaliser l image à côté du .md), avec heroImageAlt/hero.imageAlt (refine Zod : alt requis dès qu une image est fournie → build cassé sinon).
- Dans les composants : import { Image } from "astro:assets" + <Image src width height alt />.
- alt OBLIGATOIRE (a11y + GEO). width/height obligatoires (anti-CLS) — inférés automatiquement pour les images importées via image().
- heroImage d un article alimente aussi og:image et l image du JSON-LD (cf. blog/[...slug].astro).
- /public = assets bruts non optimisés (favicon, og, logo).
- Si un projet sort d'astro:assets (images sous /public, src dynamique venant du frontmatter ou du Markdown) : « width/height obligatoires » ne se tient pas à la main. Mécanisme éprouvé : un atome Img qui lit les dimensions réelles au build (sharp en lecture seule, mémoïsé) + un plugin rehype pour le corps Markdown ; dims explicites court-circuitent ; src externe/`data:` → fallback sans dims. `<img>` nu proscrit pour toute image de contenu.
