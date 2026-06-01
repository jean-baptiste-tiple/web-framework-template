# Images

- astro:assets. Dans le frontmatter : heroImage/hero.image typés via image() (colocaliser l image à côté du .md).
- Dans les composants : import { Image } from "astro:assets" + <Image src width height alt />.
- alt OBLIGATOIRE (a11y + GEO). width/height obligatoires (anti-CLS).
- /public = assets bruts non optimisés (favicon, og, logo).
