// WORKFLOW Claude Code (outil Workflow) — comparaison VISION des landing pages.
// Prérequis : captures faites par `node scripts/parity/deep-capture.mjs` (parity/lp/deep/<slug>/).
// Lancement : Workflow({ scriptPath: 'scripts/parity/vision.workflow.js', args: { slugs: [...] } })
// 1 agent vision par page (aligne les bandes par contenu, lit les PNG des 2 côtés, liste les
// écarts) puis 1 vérificateur sceptique par page qui confirme/réfute chaque MAJOR sur pièces.
// Rapport humain : docs/reviews/parite-lp.md (généré depuis le retour du workflow).
//
// ⚠ À ALIGNER avec scripts/migration/config.mjs (le runtime Workflow n'importe pas de
// modules — valeurs dupliquées à la main) :
const LIVE_ORIGIN = 'https://info.example.com' // = LP_LIVE_ORIGIN
const OURS_ORIGIN = 'https://preview.example.com' // = DEPLOYED_ORIGIN

export const meta = {
  name: 'lp-vision-parity',
  description: `Compare visuellement des landing pages (live ${LIVE_ORIGIN} vs notre version ${OURS_ORIGIN}) via screenshots par bande, puis vérifie adversarialement les findings MAJOR`,
  phases: [
    { title: 'Compare', detail: 'un agent vision par LP' },
    { title: 'Verify', detail: 'contre-lecture des findings MAJOR' },
  ],
}

const FINDINGS = {
  type: 'object', required: ['slug', 'pageVerdict', 'findings'], additionalProperties: false,
  properties: {
    slug: { type: 'string' },
    pageVerdict: { enum: ['OK', 'MINOR', 'MAJOR'] },
    notes: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object', required: ['severity', 'zone', 'diff'], additionalProperties: false,
        properties: {
          severity: { enum: ['MAJOR', 'MINOR'] },
          zone: { type: 'string', description: 'nom court de la section (ex: hero, benefices, faq, temoignages, cta-final)' },
          diff: { type: 'string', description: 'écart précis, factuel, en français' },
          live: { type: 'string', description: 'ce que montre le live' },
          ours: { type: 'string', description: 'ce que montre notre version' },
          evidence: { type: 'array', items: { type: 'string' }, description: 'noms des fichiers PNG regardés' },
        },
      },
    },
  },
}

const VERDICTS = {
  type: 'object', required: ['verdicts'], additionalProperties: false,
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object', required: ['zone', 'verdict'], additionalProperties: false,
        properties: {
          zone: { type: 'string' },
          verdict: { enum: ['CONFIRMED', 'REFUTED', 'ADJUSTED'] },
          note: { type: 'string' },
        },
      },
    },
  },
}

// À ADAPTER AU SITE : liste des écarts ASSUMÉS (décisions déjà tranchées) que les agents
// ne doivent PAS signaler. Exemples typiques d'une migration (à remplacer par les vôtres) :
const CANON = `NE PAS signaler (écarts assumés, décisions déjà tranchées) :
1. Header : notre header global du site au lieu du header minimal du live (logo seul) — décision explicite.
2. Footer : notre footer complet du site au lieu du footer minimal live — même décision.
3. Boutons : couleur/rayon/padding du design system canonique. (MAIS signale quand un bouton live est PLEINE LARGEUR et le nôtre petit, quand un bouton manque, ou est en trop.)
4. Coquilles corrigées chez nous et placeholders ajoutés dans les champs de formulaire.
5. Différences de rendu de police/anti-aliasing au pixel.

ARTEFACTS DE SONDE à ignorer :
- bande(s) de fin de page avec bg rgba(0,0,0,0.7) ou vides (~1010px) = overlay technique rendu visible par la sonde, pas réel ;
- une image marquée dans le JSON mais floue/en cours de chargement sur UN screenshot isolé ;
- le découpage en bandes peut différer (une section live = 2 bandes chez nous ou l'inverse) : aligne par CONTENU, pas par index.`

const REPORT = `À SIGNALER (MAJOR quand visible au premier regard, MINOR sinon) :
- fond de bande différent (ex. beige vs blanc/bleu clair, bande saturée colorée vs claire) ;
- pattern de section différent : accordéon vs cartes ouvertes, carrousel vs grille statique, centré vs 2 colonnes, liste 1 colonne vs grille 3 colonnes, cartes bordées vs sans bordure ;
- taille/alignement de titre nettement différents (écart ≥ 8px de font-size, ou center vs left) ;
- contenu manquant, inventé ou réécrit : eyebrow, phrase d'intro, titre de section ajouté, section CTA entière qui n'existe pas sur le live, texte des paragraphes qui diverge ;
- section absente, ajoutée, ou ORDRE des sections différent ;
- icônes/images absentes ou très différentes, logos déformés, tassés ou beaucoup plus petits ;
- formulaire : champs affichés/masqués différents, bouton pleine largeur vs petit ;
- hauteur de zone très différente (> 40%) = rythme visuel cassé (gros vides ou tassement).`

phase('Compare')
const a = typeof args === 'string' ? JSON.parse(args) : args
const slugs = Array.isArray(a) ? a : a.slugs
const compared = await pipeline(
  slugs,
  (slug) => agent(
    `Tu es un œil pixel-perfect. Compare le rendu de la landing page LIVE (référence à reproduire : ${LIVE_ORIGIN}/${slug}) avec NOTRE version Astro déployée (${OURS_ORIGIN}/${slug}). Des captures desktop 1440px existent déjà — ne lance PAS de navigateur.

Répertoire de travail : parity/lp/deep/${slug}/ (relatif à la racine du repo)
- deep.json : dump structuré. Pour chaque côté (live / ours) : bandes visuelles ordonnées { i, y, h, bg, head{tag,text,fs,lh,color,align,fam}, text (500 premiers caractères), textLen, imgs, nImgs, btns{t,bg,c,fs,rad}, cols, form }.
- live__band-NN.png et ours__band-NN.png : screenshot de CHAQUE bande.
- live__full.png / ours__full.png : page entière (aperçu grossier, à n'utiliser que pour l'ordre global).

Méthode OBLIGATOIRE :
1. Lis deep.json en entier. Aligne les bandes live↔ours par CONTENU (headings, texte), jamais par index.
2. Pour chaque zone alignée, LIS les deux PNG de bande (Read) et compare visuellement. Ne conclus JAMAIS un écart visuel sans avoir regardé les deux images.
3. Zones sans correspondance = section absente/ajoutée : confirme dans le PNG.
4. Compare l'ORDRE des sections entre les deux côtés.
5. Chiffre ce qui est chiffrable avec deep.json (font-size, bg, hauteurs, nb de colonnes).

${CANON}

${REPORT}

Retourne le résultat structuré : slug='${slug}', pageVerdict = MAJOR si ≥1 écart MAJOR, MINOR si seulement des MINOR, OK sinon. Chaque finding : zone, diff (précis et factuel), live, ours, evidence (fichiers PNG lus). Sois exhaustif : liste TOUS les écarts, pas un échantillon.`,
    { label: `cmp:${slug}`, phase: 'Compare', schema: FINDINGS }
  ),
  (res, slug) => {
    if (!res) return null
    const majors = res.findings.filter((f) => f.severity === 'MAJOR')
    if (!majors.length) return { ...res, verified: true }
    return agent(
      `Tu es un vérificateur sceptique. Un premier agent a comparé la landing page live ${LIVE_ORIGIN}/${slug} et notre version ${OURS_ORIGIN}/${slug} à partir des captures dans parity/lp/deep/${slug}/ (deep.json + live__band-NN.png / ours__band-NN.png, découpage en bandes pouvant différer entre côtés — aligne par contenu).

Voici ses findings MAJOR :
${JSON.stringify(majors, null, 1)}

Pour CHAQUE finding : relis les fichiers PNG cités (et d'autres bandes si l'alignement te semble faux), et tranche :
- CONFIRMED : l'écart est réel et visible tel que décrit ;
- REFUTED : faux positif (artefact de sonde : bande rgba(0,0,0,0.7) de fin de page, image en cours de chargement, mauvais alignement de bandes ; ou écart canon assumé : header/footer globaux voulus, boutons du design system, coquilles corrigées) ;
- ADJUSTED : réel mais mal décrit — précise dans note.
Par défaut, doute : si tu ne peux pas VOIR l'écart dans les images, REFUTED.
Retourne un verdict par finding MAJOR (même valeur de zone).`,
      { label: `ver:${slug}`, phase: 'Verify', schema: VERDICTS }
    ).then((v) => ({ ...res, verify: v ? v.verdicts : null }))
  }
)

const results = compared.filter(Boolean)
const summary = results.map((r) => ({
  slug: r.slug,
  pageVerdict: r.pageVerdict,
  majors: r.findings.filter((f) => f.severity === 'MAJOR').length,
  minors: r.findings.filter((f) => f.severity === 'MINOR').length,
  confirmed: r.verify ? r.verify.filter((v) => v.verdict !== 'REFUTED').length : null,
}))
log(`Comparé ${results.length}/${slugs.length} LP`)
return { summary, results }
