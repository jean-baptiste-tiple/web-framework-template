# Checklist — Code review (étape interne du mode développement)

## Statique / archi
- [ ] Aucun adapter/SSR/Server Action/API dynamique introduit
- [ ] Pages sans interaction = 0 JS ; tout îlot Solid justifié et en client:visible/idle
- [ ] Routing OK (pas de second catch-all racine ; /blog et /index prioritaires)

## Contenu / typage
- [ ] Nouveau type de contenu = schéma Zod ; champs obligatoires présents
- [ ] Contenu en .md/.mdx, rien en dur dans les composants
- [ ] Slugs cohérents (kebab-case)

## SEO / GEO
- [ ] title <= 60, description 140-160, canonical OK
- [ ] tldr + faq remplis (articles/landings) ; updatedDate bumpé
- [ ] JSON-LD présent et valide (type correct, FAQPage si faq)
- [ ] llms.txt mis à jour si page importante
- [ ] Un seul H1, titres sémantiques
- [ ] Page de confiance touchée (home, à propos, contact, confidentialité) : ≥ 500 caractères de texte dans son `<main>` (mesure sur `dist/<chemin>.md`, hors front matter) ; toute page indexable a son jumeau `.md` dans `dist/` (ls), toute page noindex n'en a pas

## A11y / perf / qualité
- [ ] Images : alt + width/height
- [ ] Image LCP (hero au-dessus de la ligne de flottaison) : `loading="eager"` + `fetchpriority="high"` ; toutes les autres lazy (une seule eager par page)
- [ ] HTML sémantique, navigable clavier
- [ ] Composants réutilisés (registry vérifié), pas de couleur en dur
- [ ] Bibliothèque (component-registry.md § Bibliothèque vivante) : le plan ou le rayon d'impact cite, pour chaque markup ou composant touché, le composant réutilisé ou étendu (sa fiche `/styleguide/<id>/`) ou ce qui casse sans le nouveau ; aucune citation = violation
- [ ] Composant créé ou modifié (prop, variante, rendu) : sa démo (un cas libellé par variante) et son nom sont à jour dans le MÊME commit ; `pnpm run lint` vert (check-styleguide : démo présente, nom conforme et unique) ; toute ligne ajoutée aux EXCLUSIONS du script porte sa raison
- [ ] Nom de fiche (component-registry.md § Bibliothèque vivante) : il décrit la forme (type de mise en page + éléments), sans contenu, nom de page ni slogan ; ce que le lint ne voit pas se cite ici. Deux composants qui ne diffèrent que par un élément ou une valeur = un composant à variante, ou un brief fusion-a-trancher au § Doublons, jamais deux fiches voisines
- [ ] Fiche de la bibliothèque : nom + visuel + « Utilisé sur », rien d'autre (aucune phrase d'usage, aucune vue technique) ; une page de la galerie rend UNE fiche, sans en-tête ni pied de page du site (ADR 0003, révision v2) ; une section qui ne fait qu'emballer un bloc le déclare par `wraps` et le bloc n'a pas de fiche à lui (lint et build) ; un dossier ou une famille de sections nouveau est ajouté à `FOLDER_LABELS` / `SECTION_FAMILY_LABELS` (src/lib/styleguide.ts) à sa place dans l'ordre d'une page, sinon il tombe en fin de menu
- [ ] Pastille, coche ou étiquette (component-registry.md § Normes transverses) : rendue par son composant (Badge, ou le canonique du site), variante additive si une taille ou un ton manque ; jamais du markup écrit à la main dans un bloc ou une page. Filet machine : contrôle A du lint ; une copie unique ou de moins de 4 classes se cite ici
- [ ] Markup recopié : `pnpm run lint` vert, donc contrôle machine A (même groupe de 4 classes ou plus dans deux fichiers) et B (page qui compose ses sections déclarée en § Pages bespoke) passés, sans contournement (classes renommées ou réordonnées, ligne bespoke sans vraie raison) ; ce qu'ils ne voient pas (moins de 4 classes, corps MDX) se cite en review ; deux composants qui font la même chose = brief fusion-a-trancher au registre, pas un troisième
- [ ] Aucun composant forcé (surcharge inline, `!important`, valeur arbitraire, prop détournée, wrapper qui écrase son style) : besoin non couvert = prop/variante additive OU scission, jamais un hack au call-site
- [ ] DRY, edits chirurgicaux
- [ ] Gate complet vert : lint + astro check + build (pas build seul)
- [ ] Aucune balise `<…>` dans un commentaire `{/* */}` du corps d'un `.astro` (le compilateur la rend) : `grep -rn -A5 "{/\*" src --include=*.astro | grep "<"` vide
- [ ] Contraste relevé au pixel sur une capture : l'anneau d'échantillonnage du fond est BORNÉ au conteneur qui porte ce fond (barre, panneau, carte). Un ratio ≈ 1:1 sur une encre visible à l'œil = sonde fausse, pas rendu faux — confirmé sur la capture avant toute correction
- [ ] Contrôle par grep (« vide », « zéro occurrence ») : lire le code de sortie, 1 = aucune occurrence, 2 = contrôle cassé donc échec. Jamais masqué par `|| echo`, `2>/dev/null` ou `| wc -l` ; grep en tête de pipe : lire `${PIPESTATUS[0]}`, car `set -o pipefail` rend le code du dernier grep (1) et non celui du grep cassé (2). Motif non ASCII (tirets, guillemets, accents) : `LC_ALL=C.UTF-8 grep`, sinon la locale C de Git Bash compare des octets

## Sobriété (anti-over-engineering)
- [ ] Chaque surface nouvelle du diff (fichier, composant, variante, prop optionnelle, util, champ Zod, token, option, dépendance) a une justification au présent — ce qui casse sans elle aujourd'hui. Justifiée au futur (« on pourrait vouloir ») = retirée
- [ ] Au-delà d'un edit trivial, le récap de fin de tâche nomme l'option d'un cran plus simple écartée et la raison
- [ ] Changement > 1-2 fichiers ou surface créée : rayon d'impact rempli (4 items, item Appelants avec commande citée), et tout refacto proposé a été posé via `AskUserQuestion`, pas laissé en note
- [ ] Aucun arbitrage rendu en prose dans le récap (« j'ai choisi », « à toi de voir ») : chaque décision qui revenait à l'utilisateur a un appel `AskUserQuestion` dans la trace. Et l'inverse : une question posée découle d'un message de l'utilisateur. Un point ouvert remonté par un sous-agent sur une hypothèse que le pilote a lui-même mise dans la consigne se tranche par le pilote, et rien n'est présenté comme « demandé » sans le message qui le demande

## Craft (si de l'UI a été touchée — réf. : skill design-craft)
- [ ] Zéro `—` / `–` dans le texte visible (grep) ; zéro faux screenshot en div ; zéro carte imbriquée
- [ ] Hero : ≤ 4 éléments texte, titre ≤ 2 lignes desktop, 1 CTA primaire
- [ ] Une famille de layout max 1×/page ; max 2 splits image+texte consécutifs ; bento : N items = N cellules
- [ ] CTA : un label par intention, identique partout ; aucun label de bouton sur 2 lignes
- [ ] Verrous tenus : 1 accent, 1 système de rayons, 1 thème par page
- [ ] Contrôles : 7 états présents ; contenu visible au repos (sans JS/animation) ; reduced-motion = alternative, pas un kill
- [ ] Cibles tactiles ≥ 44px mesurées à 390 sur les contrôles d'UNE ligne (summary, liens de nav, marque du header et du footer) : hauteur GARANTIE par une classe de l'échelle (`min-h-11`, ou `py-*` équivalent) dans le `class` du contrôle, jamais déduite du texte ni du padding du parent
- [ ] Surfaces navigateur thématisées (::selection, focus ring, underline-offset)
- [ ] Rayons concentriques (craft-floor § Verify 10) : tout arrondi posé dans un arrondi a pour rayon celui du parent moins sa bordure et sa marge intérieure ; relevé au rendu (`getComputedStyle` : `border-radius`, `border-width`, `padding` du parent et de l'enfant), écart 0 px, ou le rayon de l'enfant est 0
- [ ] Stabilité (craft-floor § Verify 11) : hauteur du document relevée 5 s puis 60 s après le chargement, identique ; aucune taille posée d'après une mesure d'un contenu qui dépend de cette taille (iframe, `vh`, `%`)
- [ ] Copy self-audit passé ; chiffres précis sourcés ou marqués mock
- [ ] Une comparaison de captures avant/après ne prouve rien sans témoin : deux captures de la MÊME page doivent d'abord donner 0 pixel d'écart. Neutraliser ce qui varie seul — aléa au chargement (`Math.random`), images paresseuses que le défilement vertical ne charge pas, rastérisation partielle hors viewport (`captureBeyondViewport`) — puis mesurer
- [ ] **Test du directeur artistique** : chaque archétype de page est posé CÔTE À CÔTE avec sa page source du template du monde (capture du kit) ; placeholders vides, silhouettes, mouvements absents, largeurs de sections inégales ou écart de densité visible = `fix` au mieux, jamais « livré » (une note /20 ne remplace pas ce test)

## Documentation
- [ ] Un ADR qui révise une règle de CLAUDE.md ou d'une convention met à jour ce texte dans le même commit (l'ADR trace la décision, il ne la remplace pas)
- [ ] Skill d'intention (CLAUDE.md § Demandes non techniques) : aucune règle technique ou éditoriale absente de CLAUDE.md et de `.claude/conventions/` (il cite, il ne légifère pas) ; ce qui est propre au site vit dans `projet.md`, jamais dans le SKILL.md livré par le socle
- [ ] Erreur corrigée pendant le chantier = boucle « Après une erreur » passée (garde écrite ou observation dans docs/learnings.md)
