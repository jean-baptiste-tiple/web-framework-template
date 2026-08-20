// ============================================================================
// CONFIG UNIQUE — scripts de migration Webflow → Astro (scripts/migration/)
// et harnais de parité (scripts/parity/).
//
// TOUT ce qui est propre au site migré vit ici : les scripts sont génériques.
// Les valeurs « À REMPLACER » sont des placeholders évidents. Les exemples
// commentés viennent d'une migration réelle et montrent le format attendu.
// ============================================================================

// --- Site source ------------------------------------------------------------

// Origine canonique du site source (celle du sitemap). À REMPLACER.
export const SOURCE_ORIGIN = 'https://www.example.com';

// Hostnames acceptés comme « internes » (canonique + apex), dérivés de SOURCE_ORIGIN.
const srcHost = new URL(SOURCE_ORIGIN).hostname;
export const SOURCE_HOSTS = [...new Set([srcHost, srcHost.replace(/^www\./, '')])];

// User-Agent du crawler (poli : identifiez-vous + contact). À REMPLACER.
export const USER_AGENT = 'SiteMigrationBot/1.0 (migration interne; contact: you@example.com)';

// Date du snapshot (jour du crawl), consignée dans inventory.json. À REMPLACER.
export const SNAPSHOT_DATE = '2026-01-01';

// Hosts CDN des assets du site source. Valeurs par défaut = CDN Webflow (génériques
// à toute migration Webflow) ; adapter si le source sert ses assets ailleurs.
export const CDN_HOSTS = [
  'cdn.prod.website-files.com',
  'assets-global.website-files.com',
  'assets.website-files.com',
];

// --- Chemins ---------------------------------------------------------------
// Tous relatifs à la racine du repo (les scripts se lancent depuis la racine).

// Export de code Webflow (zip décompressé : *.html, css/, images/…).
export const EXPORT_DIR = 'docs/source.webflow';

// Snapshot du site live (pages/ + assets/ + sitemap.xml + crawl-log.json). Gitignoré.
export const SNAPSHOT_DIR = 'scripts/migration/snapshot';

// Build Astro.
export const DIST_DIR = 'dist';

// Assets copiés dans le projet (servis en /assets/...).
export const ASSETS_DIR = 'public/assets';

// Racine des Content Collections.
export const CONTENT_DIR = 'src/content';

// Collection du blog (cible de convert-articles / fix-article-bodies).
export const BLOG_CONTENT_DIR = `${CONTENT_DIR}/blog`;

// Sorties d'inventaire (versionnées : vérité source de toute la migration).
export const INVENTORY_FILE = 'docs/migration/inventory.json';
export const ASSETS_MAP_FILE = 'docs/migration/assets-map.json';

// --- Serveurs locaux / navigateur ------------------------------------------

// Port où servir l'export Webflow en local (npx serve, http-server…).
export const LOCAL_PORT_EXPORT = 4398;

// Port de la preview du build (`astro preview --port 4399`).
export const LOCAL_PORT_SITE = 4399;

// Port interne du serveur statique éphémère de capture.mjs (dist/ servi en direct).
export const CAPTURE_PORT = 4517;

// Chrome/Chromium système utilisé par playwright-core. À ADAPTER à la machine.
export const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// --- Déploiements distants (deep-capture / vision.workflow) -----------------

// Notre site déployé (préprod/staging) pour les comparaisons à distance. À REMPLACER.
export const DEPLOYED_ORIGIN = 'https://preview.example.com';

// Origine live des landing pages hébergées à part (ex. HubSpot). À REMPLACER si utilisé.
export const LP_LIVE_ORIGIN = 'https://info.example.com';

// Slugs des landing pages à capturer par deep-capture.mjs (vide = passer --only/--slugs).
// Exemple : ['demo', 'contact', 'lp-produit', 'inscription-salon-2026']
export const LP_SLUGS = [];

// --- Viewports --------------------------------------------------------------

// Viewports du harnais de parité (capture/diff).
export const VIEWPORTS = [1440, 768, 360];

// Viewports de l'audit responsive (tablette + mobile).
export const RESPONSIVE_VIEWPORTS = [768, 375];

// --- Classification des pages (inventory.mjs) -------------------------------

// path (« / », « /post/mon-article »…) → type de page. À ADAPTER au site migré :
// la table sert de stats + de filtre pour les conversions (ex. type 'article').
// Exemple réel :
//   if (path.startsWith('/post/')) return 'article';
//   if (path.startsWith('/clients/')) return 'cas-client';
//   if (path.startsWith('/produit/')) return 'produit';
//   if (/^\/(cgv|mentions-legales)/.test(path)) return 'legal';
//   if (/^\/(lp-|landing-)/.test(path)) return 'landing';
export function classifyPath(path) {
  if (path === '/') return 'home';
  if (path.startsWith('/post/')) return 'article'; // exemple, à adapter
  return 'page';
}

// Regex extrayant la date de publication du HTML d'un article (groupes : jour, mois,
// année). Exemple ci-dessous = markup Webflow FR « Publié le </p><div>D.M.YYYY ».
// À ADAPTER au markup source (null = pas d'extraction).
export const PUB_DATE_RE = /Publié le<\/p>\s*<div[^>]*>\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/i;

// Regex extrayant l'auteur (groupe 1). Même logique. null = pas d'extraction.
export const AUTHOR_RE = />par<\/p>\s*<div[^>]*>\s*([^<]+?)\s*<\/div>/i;

// --- Conversion (convert-articles / lib-convert) ----------------------------

// Préfixe d'URL source des articles de blog (slug = le reste du chemin).
export const BLOG_SOURCE_PREFIX = '/post/';

// Préfixe d'URL des pages catégorie (détection best-effort de la catégorie d'un article).
export const CATEGORY_PATH_PREFIX = '/categories/';

// Auteur par défaut (clé de src/lib/authors.ts ou équivalent). À REMPLACER.
export const DEFAULT_AUTHOR = 'default-author';

// Date de publication de repli quand la source n'en expose pas.
export const FALLBACK_PUB_DATE = '2020-01-01';

// Sections PARTAGÉES du site source (CTA global, bandeaux « autres articles »…)
// rendues chez nous par des composants : à retirer du contenu extrait pour éviter
// le doublon. Regex testée sur le texte de chaque <section> (< 700 caractères).
// null = ne rien retirer. Exemple réel :
//   /(Proposez des locaux sains|Découvrir nos autres (articles|témoignages))/
export const SHARED_SECTION_RE = null;

// --- Vérifications (verify / content-completeness / html-leak-lint / live-diff) ---

// Meta description de repli du site (BaseLayout) : acceptée par verify.mjs quand la
// source n'a PAS de description. '' = aucun fallback accepté. À REMPLACER si utilisé.
export const FALLBACK_DESCRIPTION = '';

// Slugs de l'export Webflow HORS périmètre de fidélité (pages applicatives,
// techniques, templates, archives). Exemple réel :
//   ['401', '404', 'style-guide-relume', 'search', 'old-home', 'connexion', 'tutoriel']
export const EXPORT_SKIP_SLUGS = new Set(['401', '404', 'search']);

// Sous-dossiers de l'export Webflow à scanner, avec le préfixe de route correspondant.
// Exemple réel : [{ dir: 'produit', routePrefix: 'produit/' }, { dir: 'ressources', routePrefix: '' }]
export const EXPORT_SUBDIRS = [];

// Préfixes alternatifs où notre build peut nicher une page racine du source
// (dst teste /slug PUIS /<prefix>/slug). Exemple réel : ['ressources']
export const ALT_ROUTE_PREFIXES = [];

// Scaffolding du source jamais rendu chez nous (états de formulaire cachés,
// copyright…) : exclu du diff de complétude pour ne pas noyer les vrais drops.
// Regex testées sur les blocs de texte NORMALISÉS (minuscule). Exemple réel :
//   /^merci\s*!?\s*nous avons bien reçu/, /^oups\s*!?\s*une erreur s'est produite/,
//   /tous droits réservés à monsite/, /^merci pour votre (inscription|message)/
export const BOILERPLATE_PATTERNS = [
  /^oops! something went wrong while submitting/, // état d'erreur Webflow par défaut
];

// Signatures « état de formulaire orphelin » du leak-linter (texte fuité dans le
// HTML buildé). Exemple réel (FR) : /Oups\s*!\s*Une erreur s['’].?est produite/i
export const FORM_STATE_PATTERNS = [/Something went wrong while submitting/gi];

// Pages de remerciement (TYP) : leur message est du contenu légitime → exemptées
// de la règle form-orphelin. Regex sur le chemin de fichier dist. null = aucune.
// Exemple réel : /[\\/](merci-|page-de-remerciement-)/
export const THANK_YOU_PAGE_RE = null;

// Titres de bandes PARTAGÉES rendues par des composants (≠ contenu de page),
// ignorés par live-diff. Texte brut (normalisé automatiquement). Exemple réel :
//   ['Découvrir nos autres articles', 'Foire aux questions', 'Newsletter']
export const SHARED_HEADINGS = [];

// Entités connues (noms de clients, marques…) pour repérer un nom présent sur le
// live mais absent chez nous (ou inventé). Exemple réel : ['acme', 'globex', 'initech']
export const KNOWN_ENTITIES = [];

// --- Échantillonnage des collections (manifest / visual-sweep / audits) -----

// Fiches CMS : le layout est porté par le TEMPLATE, pas le contenu → on ne compare
// que N fiches par collection. Clé = 1er segment de route, valeur = N.
// Exemple réel : { post: 3, clients: 3, categories: 2, produit: 3, 'capteurs-x': 1 }
export const COLLECTION_SAMPLE = {};

// Buckets supplémentaires par regex de chemin (collections sans préfixe commun).
// [{ re: /^newsletter/, bucket: 'newsletters', cap: 3 }] — [] = aucun.
export const BUCKET_PATTERNS = [];

// --- fix-split-headings -----------------------------------------------------

// Dossiers de contenu où recoller les titres coupés sur 2 lignes. Par défaut tout
// CONTENT_DIR ; restreindre si certaines collections gèrent le cas dans leur parser.
// Exemple réel : ['src/content/newsletters', 'src/content/pages', 'src/content/blog']
export const SPLIT_HEADING_ROOTS = [CONTENT_DIR];

// --- sync-meta-to-source ----------------------------------------------------

// Pages dont on réaligne title/description sur inventory.json : { pathSource: fichierContenu }.
// Exemple réel : { '/contact': 'src/content/pages/contact.mdx' }
export const SYNC_META_MAP = {};

// Coquilles ÉVIDENTES du source à corriger au passage (appliquées à la page ET à
// inventory.json). [['texte fautif', 'texte corrigé']] — [] = aucune.
export const SYNC_TYPO_FIXES = [];

// --- Harnais de parité (capture / diff / bg-audit) --------------------------

// Familles de polices dont capture.mjs vérifie le chargement (document.fonts.check)
// des deux côtés. Exemple réel : ['Montserrat', 'Calistoga']
export const FONTS_TO_CHECK = [];

// Polices n'existant qu'en UNE graisse chez nous (le source affichait un faux-gras
// synthétique) : delta de font-weight ignoré par diff.mjs. En minuscule.
// Exemple réel : ['calistoga']
export const SINGLE_WEIGHT_FONTS = [];

// Étiquettes lisibles des fonds de section de la palette du site (bg-audit).
// [{ rgb: [r, g, b], label: 'nom' }] — tolérance ±3 par canal. Exemple réel :
//   [{ rgb: [246, 241, 240], label: 'beige(#f6f1f0)' }, { rgb: [255, 255, 255], label: 'white' }]
export const BG_COLOR_LABELS = [];

// Paires de fonds considérées ÉQUIVALENTES par bg-audit (écart assumé, non signalé).
// [['transparent', 'beige(#f6f1f0)']] — comparées dans les deux sens. [] = aucune.
export const BG_EQUIVALENT_PAIRS = [];
