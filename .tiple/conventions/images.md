# Images

- astro:assets. Dans le frontmatter : heroImage/hero.image typés via image() (colocaliser l image à côté du .md), avec heroImageAlt/hero.imageAlt (refine Zod : alt requis dès qu une image est fournie → build cassé sinon).
- Dans les composants : import { Image } from "astro:assets" + <Image src width height alt />.
- alt OBLIGATOIRE (a11y + GEO). width/height obligatoires (anti-CLS) — inférés automatiquement pour les images importées via image().
- heroImage d un article alimente aussi og:image et l image du JSON-LD (cf. blog/[...slug].astro).
- /public = assets bruts non optimisés (favicon, og, logo).
