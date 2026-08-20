// Helpers partagés de conversion HTML → Markdown/MDX (migration Webflow → Astro).
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parse } from 'node-html-parser';
import TurndownService from 'turndown';
import { SOURCE_ORIGIN, SNAPSHOT_DIR, ASSETS_DIR, CDN_HOSTS, SHARED_SECTION_RE } from './config.mjs';

const STAGING = join(SNAPSHOT_DIR, 'assets');
const PUBLIC = ASSETS_DIR;
// Liens internes absolus → relatifs : origine canonique OU apex du site source.
const apexEsc = new URL(SOURCE_ORIGIN).hostname.replace(/^www\./, '').replace(/\./g, '\\.');
const INTERNAL_RE = new RegExp(`^https?:\\/\\/(www\\.)?${apexEsc}(?=\\/|$)`);

const td = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
});
// Conserver les <figure>/<br> proprement ; retirer les attributs Webflow.
td.addRule('stripDataAttrs', {
  filter: (node) => node.nodeName === 'BR',
  replacement: () => '\n',
});

// CDN url → chemin local /assets/... + copie du fichier (uniquement si utilisé).
const copied = new Set();
export function rewriteAsset(rawUrl) {
  if (!rawUrl) return rawUrl;
  let u;
  try {
    u = new URL(rawUrl, SOURCE_ORIGIN);
  } catch {
    return rawUrl;
  }
  if (!CDN_HOSTS.includes(u.hostname)) return rawUrl; // lien externe/inchangé
  // Caractères illégaux sous Windows (: < > " | ? *) → _ , pour fs ET URL (cohérence).
  const safe = (p) => p.replace(/%3A/gi, '_').replace(/[<>:"|?*]/g, '_');
  const encodedPath = safe(u.pathname.replace(/^\//, '')); // %20 conservés pour l'attribut
  const fsPath = safe(decodeURIComponent(u.pathname.replace(/^\//, '')));
  const staging = join(STAGING, fsPath);
  const dest = join(PUBLIC, fsPath);
  if (!copied.has(dest)) {
    if (existsSync(staging)) {
      mkdirSync(dirname(dest), { recursive: true });
      try {
        copyFileSync(staging, dest);
      } catch {
        /* ignore */
      }
    }
    copied.add(dest);
  }
  return '/assets/' + encodedPath;
}
export const copiedCount = () => copied.size;

// Nettoie un fragment HTML : réécrit les src d'images CDN → local, retire srcset/sizes,
// supprime les iframes de tracking. Retourne le HTML nettoyé (string).
export function cleanFragment(node) {
  for (const img of node.querySelectorAll('img')) {
    const src = img.getAttribute('src');
    if (src) img.setAttribute('src', rewriteAsset(src));
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.removeAttribute('loading');
    img.removeAttribute('sizes');
  }
  // Liens : assets CDN → local ; liens internes absolus → relatifs (règle Astro) ; reste inchangé.
  for (const a of node.querySelectorAll('a')) {
    const href = a.getAttribute('href');
    if (!href) continue;
    if (CDN_HOSTS.some((h) => href.includes(h))) {
      a.setAttribute('href', rewriteAsset(href));
    } else {
      let rel = href.replace(INTERNAL_RE, '') || '/';
      // Typo source : liens internes avec ) parasite final (ex. "/)") → nettoyage.
      if (/^\/[^?#]*\)+$/.test(rel)) rel = rel.replace(/\)+$/, '') || '/';
      a.setAttribute('href', rel);
    }
  }
  return node.innerHTML;
}

// Extrait le contenu principal d'une page (hors chrome nav/footer/scripts),
// retire les sections partagées (CTA global, bandeaux « découvrir aussi »…)
// qui sont rendues par les composants (SHARED_SECTION_RE). Retourne le HTML nettoyé.
export function extractMain(root) {
  const body = root.querySelector('body') ?? root;
  const chrome =
    'script,style,noscript,svg,nav,header,footer,form,[class*="navbar"],[class*="footer"],[class*="w-nav"],[class*="cookie"],[class*="popup"]';
  body.querySelectorAll(chrome).forEach((n) => n.remove());
  // Sections partagées (rendues par des composants) à retirer pour éviter le doublon.
  if (SHARED_SECTION_RE) {
    for (const sec of body.querySelectorAll('section,[class*="section"],[class*="cta"]')) {
      const t = sec.text.replace(/\s+/g, ' ').trim();
      if (t.length < 700 && SHARED_SECTION_RE.test(t)) sec.remove();
    }
  }
  return cleanFragment(body);
}

// HTML fragment → Markdown.
export function htmlToMarkdown(html) {
  return td
    .turndown(html)
    .replace(/‍/g, '') // ZWJ résiduels de Webflow (lignes "‍" isolées)
    .replace(/[ \t]+\n/g, '\n') // espaces de fin de ligne
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export { parse, readFileSync, writeFileSync, mkdirSync, existsSync };

// Sérialise une valeur en scalaire YAML sûr (double-quoted, à la JSON).
export function yamlString(s) {
  return JSON.stringify(s ?? '');
}

// Construit un frontmatter YAML depuis un objet { clé: valeur }.
// Valeurs : string → quoted ; Date ISO (string déjà) → quoted ; number/bool → brut ;
// array de strings → liste inline.
export function frontmatter(obj) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      lines.push(`${k}:`);
      for (const item of v) lines.push(`  - ${yamlString(item)}`);
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      lines.push(`${k}: ${v}`);
    } else {
      lines.push(`${k}: ${yamlString(v)}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}
