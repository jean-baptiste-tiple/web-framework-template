# Carte du site : où vit chaque texte

<!-- Gabarit du socle. Copié au bootstrap dans .claude/skills/comprendre-demande/projet.md (§ Carte du site), puis tenu à jour : une ligne par adresse ou famille d'adresses. Lue en premier par comprendre-demande (§ Localiser) et citée par les autres surcouches (source unique : ne pas la recopier). Retirer ce commentaire. -->

| Adresse | Fichier du texte | Textes venus d'ailleurs |
|---|---|---|
| `/` | `src/pages/index.astro` | <blocs alimentés par `src/content/settings/site.json` : FAQ globale…> |
| `/<slug>/` (pages éditoriales) | `src/content/pages/<slug>.md` | |
| `/<slug>/` (landings) | `src/content/landings/<slug>.mdx` (`hero:`, `sections:`) | |
| `/blog/<slug>/` | `src/content/blog/<slug>.md` | auteur : `src/lib/authors.ts` |
| menu, pied de page, coordonnées, réseaux, FAQ commune | `src/content/settings/site.json` | |
| <collection propre au site> | `src/content/<collection>/<id>.md` | <champ repris sur d'autres pages : cartes…> |

## Textes partagés (à dire avant toute retouche)
- <Champ affiché sur plusieurs pages (ex. carte d'une fiche) : où il apparaît, et si une page peut le remplacer pour elle seule.>
