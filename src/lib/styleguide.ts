// Bibliothèque de composants (/styleguide) : tout ce qu'elle montre est
// DÉCOUVERT au build, rien n'y est listé à la main (ADR 0003).
//  - composants : chaque `<Nom>.demo.astro` colocalisé (rendu + `export const demo`) ;
//  - sections : `export const demo` (nom + `examples` typés) de chaque
//    `<Variante>.schema.ts`, rendus par SectionRenderer ;
//  - tokens : blocs @theme de src/styles/global.css ;
//  - styles partagés : @utility de global.css annotés juste au-dessus
//    `/* Style de texte « Nom » : rôle. */` ou `/* Style « Nom » : rôle. */` ;
//  - illustrations : fichiers de src/assets/illustrations (dossier facultatif) ;
//  - « Utilisé sur » : graphe des imports de src/ + frontmatter `sections:` des
//    collections ; une route dynamique est dépliée en ses pages réelles.
// Une fiche par page (ADR 0003, révision v2) : /styleguide/<id>/ = nom, aperçu,
// « Utilisé sur » ; /styleguide/<id>/apercu/ = le rendu seul (cadre de l'aperçu).
// Le contrôle « tout composant a sa démo » et la forme des noms sont faits au
// lint (scripts/check-styleguide.mjs) ; ce module casse le build si une démo est
// incomplète ou si un exemple de section ne passe pas son schéma.
import { getCollection } from 'astro:content';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import type { z } from 'astro/zod';
import { collections } from '@/content.config';
import { SECTION_REGISTRY, type AnySection } from '@/lib/sections';
import themeCss from '@/styles/global.css?raw';

// Galerie absente du build de production (action « Mise en ligne »,
// VERCEL_ENV=production) ; présente sur TEST, les aperçus et en local.
export const GALLERY_ENABLED = process.env.VERCEL_ENV !== 'production';

/** Fiche d'un composant : son nom, qui DÉCRIT la forme (component-registry.md
 *  § Bibliothèque vivante : type de mise en page + éléments, 5 mots au plus). */
export interface DemoDoc {
  name: string;
}

/** Un cas d'une section : libellé (sa différence, « avec pictos ») + exemple typé. */
export interface SectionCase<T> {
  label: string;
  example: T;
}

/** Démo d'une section : nom + un cas par variante, typés par le schéma de la section. */
export interface SectionDemo<T> extends DemoDoc {
  examples: [SectionCase<T>, ...SectionCase<T>[]];
}

export interface Usage {
  label: string;
  href?: string;
}

export interface GalleryEntry {
  /** Fiche /styleguide/<id>/ et rendu seul /styleguide/<id>/apercu/. */
  id: string;
  file: string;
  group: string;
  sectionType?: string;
  name: string;
  usedBy: Usage[];
  render: { kind: 'demo'; Demo: AstroComponentFactory } | { kind: 'section'; examples: SectionCase<AnySection>[] };
}

/** Lien du menu : une fiche de composant ou une rubrique de Fondations. */
export interface NavItem {
  href: string;
  name: string;
  /** Texte où la recherche du menu cherche (nom, famille, identifiant). */
  search: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Style partagé (@utility annoté de global.css) : nom de classe, rôle, contenu. */
export interface SharedStyle {
  /** Classe à poser (`title-section`). */
  name: string;
  /** Nom donné dans l'annotation (« Titre de section »). */
  label: string;
  description: string;
  /** Style de texte (aperçu en phrase) ou autre (déclaration seule). */
  text: boolean;
  /** Ce que le style applique (`@apply …`). */
  rule: string;
  /** Fichiers .astro de src/ qui posent la classe (hors outillage de la bibliothèque). */
  usedIn: string[];
}

/** Illustration de src/assets/illustrations : le nom est celui à citer à Claude. */
export interface Illustration {
  name: string;
  src: ImageMetadata;
}

export interface TokenGroup {
  id: string;
  label: string;
  kind: 'color' | 'font' | 'weight' | 'text' | 'space' | 'radius' | 'shadow' | 'width' | 'value';
  tokens: { name: string; value: string }[];
}

/** Rubrique de Fondations : une page /styleguide/fondations/<id>/. */
export type Foundation =
  | { id: string; label: string; kind: 'tokens'; group: TokenGroup }
  | { id: 'styles'; label: string; kind: 'styles'; styles: SharedStyle[] }
  | { id: 'illustrations'; label: string; kind: 'illustrations'; illustrations: Illustration[] };

// --- Sources découvertes --------------------------------------------------------

const DEMOS = import.meta.glob<{ default: AstroComponentFactory; demo?: DemoDoc }>(
  '/src/components/**/*.demo.astro',
  { eager: true },
);
const SCHEMAS = import.meta.glob<{
  schema: z.AnyZodObject;
  demo?: SectionDemo<AnySection>;
}>('/src/components/sections/**/*.schema.ts', { eager: true });
// Sources brutes : graphe des imports et styles partagés.
const SOURCES = import.meta.glob<string>('/src/**/*.{astro,ts,mdx}', {
  query: '?raw',
  import: 'default',
  eager: true,
});
// Routes du site (hors bibliothèque), chargées à la demande : une route dynamique
// qui utilise un composant est dépliée en ses pages réelles (getStaticPaths).
const ROUTES = import.meta.glob<{ getStaticPaths?: (options: unknown) => unknown }>([
  '/src/pages/**/*.astro',
  '!/src/pages/styleguide/**',
]);

// Dossier FACULTATIF : absent (cas du modèle), le glob est vide et la rubrique
// « Illustrations » n'apparaît pas (component-registry.md § Bibliothèque vivante).
const ILLUSTRATIONS = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/illustrations/*.{webp,png,jpg,jpeg,svg}',
  { eager: true },
);

const rel = (path: string) => path.replace(/^\//, '');
const FILES = new Map(Object.entries(SOURCES).map(([k, v]) => [rel(k), v]));

// Libellés français des familles. Dossier absent ici : son nom, capitalisé.
const FOLDER_LABELS: Record<string, string> = { ui: 'Éléments' };
const SECTION_FAMILY_LABELS: Record<string, string> = {
  nav: 'Haut et bas de page',
  offer: 'Sections : offre',
  proof: 'Sections : preuve',
  content: 'Sections : contenu',
  convert: 'Sections : conversion',
};

// Adresse publique d'une entrée de collection (mêmes routes que src/pages/).
// Collection absente : l'usage s'affiche sans lien (« collection/id »).
const ENTRY_URL: Record<string, (id: string) => string> = {
  pages: (id) => `/${id}/`,
  landings: (id) => `/${id}/`,
  blog: (id) => `/blog/${id}/`,
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const idOf = (file: string) =>
  kebab(file.replace(/^src\/components\//, '').replace(/\.astro$/, '')).replace(/\//g, '-');

// --- Graphe des imports : qui utilise quoi --------------------------------------

function normalize(path: string) {
  const out: string[] = [];
  for (const part of path.split('/')) {
    if (part === '..') out.pop();
    else if (part && part !== '.') out.push(part);
  }
  return out.join('/');
}

function resolveImport(from: string, spec: string): string | undefined {
  let base: string;
  if (spec.startsWith('@/')) base = `src/${spec.slice(2)}`;
  else if (spec.startsWith('.')) base = normalize(`${from.slice(0, from.lastIndexOf('/'))}/${spec}`);
  else return undefined;
  return ['', '.ts', '.astro', '/index.ts'].map((ext) => base + ext).find((p) => FILES.has(p));
}

// Imports de valeur seulement (`import type` n'utilise pas le composant).
const IMPORT = /^\s*import\s+(?!type\s)(?:[\s\S]*?\sfrom\s+)?['"]([^'"]+)['"]/gm;

const IMPORTERS = new Map<string, Set<string>>();
for (const [file, source] of FILES) {
  for (const m of source.matchAll(IMPORT)) {
    const target = resolveImport(file, m[1]);
    if (!target) continue;
    if (!IMPORTERS.has(target)) IMPORTERS.set(target, new Set());
    IMPORTERS.get(target)!.add(file);
  }
}

// Outillage de la galerie : n'est pas un usage.
const isTooling = (file: string) =>
  file.endsWith('.demo.astro') ||
  file === 'src/lib/styleguide.ts' ||
  file.startsWith('src/pages/styleguide/') ||
  file.startsWith('src/components/styleguide/');

function contentUrl(collection: string, id: string): Usage {
  const url = ENTRY_URL[collection]?.(id);
  return url ? { label: url, href: url } : { label: `${collection}/${id}` };
}

// Pages réelles d'une route : statique = elle-même ; dynamique = ses chemins
// (getStaticPaths de la route). Pagination ou échec : la route, sans lien.
async function routeUsages(file: string): Promise<Usage[]> {
  const route = `${file.replace(/^src\/pages/, '').replace(/\.(astro|ts)$/, '').replace(/\/?index$/, '')}/`;
  if (!route.includes('[')) return [{ label: route, href: route }];
  const fallback = [{ label: `${route} (chaque page de cette route)` }];
  try {
    const mod = await ROUTES[`/${file}`]?.();
    const paths = (await mod?.getStaticPaths?.({ paginate: () => [], routePattern: route })) as
      | { params: Record<string, string | number | undefined> }[]
      | undefined;
    if (!paths?.length) return fallback;
    return paths.map(({ params }) => {
      const url = route
        .replace(/\[(?:\.\.\.)?(\w+)\]/g, (_, key: string) => String(params[key] ?? ''))
        .replace(/\/{2,}/g, '/');
      return { label: url, href: url };
    });
  } catch {
    return fallback;
  }
}

async function usageOf(file: string, sectionFiles: Map<string, string>, bySection: Map<string, Usage[]>) {
  const out = new Map<string, Usage>();
  const seen = new Set([file]);
  const queue = [file];
  while (queue.length) {
    const current = queue.shift()!;
    const type = sectionFiles.get(current);
    if (type) for (const u of bySection.get(type) ?? []) out.set(u.label, u);
    for (const importer of IMPORTERS.get(current) ?? []) {
      if (seen.has(importer) || isTooling(importer)) continue;
      seen.add(importer);
      // Le registre importe toutes les sections : leur usage réel est dans le contenu.
      if (importer === 'src/lib/sections.ts') continue;
      if (importer.startsWith('src/layouts/')) out.set('*', { label: 'Toutes les pages (mise en page commune)' });
      else if (importer.startsWith('src/pages/')) {
        for (const u of await routeUsages(importer)) out.set(u.label, u);
      } else if (importer.startsWith('src/content/')) {
        const [, collection, ...rest] = importer.replace(/\.mdx?$/, '').split('/').slice(1);
        const u = contentUrl(collection, rest.join('/'));
        out.set(u.label, u);
      } else queue.push(importer);
    }
  }
  return [...out.values()].sort((a, b) => a.label.localeCompare(b.label, 'fr'));
}

// Pages qui déclarent chaque type de section dans leur frontmatter `sections:`.
// Toutes les collections sont lues : la galerie ne liste pas d'articles (la
// règle getPosts de src/lib/blog.ts vise les listes publiques) et n'existe pas
// en production.
async function sectionUsage() {
  const bySection = new Map<string, Usage[]>();
  for (const name of Object.keys(collections) as (keyof typeof collections)[]) {
    for (const entry of await getCollection(name)) {
      const sections = (entry.data as { sections?: { type: string }[] }).sections ?? [];
      for (const type of new Set(sections.map((s) => s.type))) {
        if (!bySection.has(type)) bySection.set(type, []);
        bySection.get(type)!.push(contentUrl(name, entry.id));
      }
    }
  }
  return bySection;
}

// --- Tokens (@theme de global.css) ----------------------------------------------

const TOKEN_KINDS: { prefix: string; id: string; label: string; kind: TokenGroup['kind'] }[] = [
  { prefix: 'color-', id: 'couleurs', label: 'Couleurs', kind: 'color' },
  { prefix: 'font-weight-', id: 'graisses', label: 'Graisses', kind: 'weight' },
  { prefix: 'font-', id: 'polices', label: 'Polices', kind: 'font' },
  { prefix: 'text-', id: 'tailles', label: 'Tailles de texte', kind: 'text' },
  { prefix: 'spacing', id: 'espacements', label: 'Espacements', kind: 'space' },
  { prefix: 'radius', id: 'rayons', label: 'Rayons', kind: 'radius' },
  { prefix: 'shadow', id: 'ombres', label: 'Ombres', kind: 'shadow' },
  { prefix: 'inset-shadow', id: 'ombres', label: 'Ombres', kind: 'shadow' },
  { prefix: 'drop-shadow', id: 'ombres', label: 'Ombres', kind: 'shadow' },
  { prefix: 'container-', id: 'largeurs', label: 'Largeurs', kind: 'width' },
];

export function readTokens(css: string): TokenGroup[] {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const groups = new Map<string, TokenGroup>();
  for (const start of clean.matchAll(/@theme\b[^{;]*\{/g)) {
    // Corps du bloc, sans ses blocs imbriqués (@keyframes déclarés dans @theme).
    let i = start.index! + start[0].length;
    let body = '';
    for (let depth = 1; i < clean.length && depth > 0; i++) {
      if (clean[i] === '{') depth++;
      else if (clean[i] === '}') depth--;
      else if (depth === 1) body += clean[i];
    }
    for (const m of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
      const [, name, value] = m;
      // Sous-tokens (`--text-xl--line-height`) : portés par leur token parent.
      if (name.includes('--')) continue;
      const k = TOKEN_KINDS.find((t) => name === t.prefix || name.startsWith(t.prefix)) ?? {
        id: 'autres',
        label: 'Autres',
        kind: 'value' as const,
      };
      if (!groups.has(k.id)) groups.set(k.id, { id: k.id, label: k.label, kind: k.kind, tokens: [] });
      groups.get(k.id)!.tokens.push({ name, value: value.replace(/\s+/g, ' ').trim() });
    }
  }
  return [...groups.values()];
}

// --- Styles partagés et illustrations -------------------------------------------

// Annotation sur UN commentaire collé au @utility (le rôle ne déborde jamais sur
// un autre commentaire) ; espaces insécables tolérés autour des guillemets.
const SHARED_STYLE =
  /\/\*\s*Style( de texte)?\s*«\s*([^»]+?)\s*»\s*:\s*((?:(?!\*\/)[\s\S])*?)\s*\*\/\s*@utility\s+([\w-]+)\s*\{([^}]*)\}/g;

export function readSharedStyles(css: string): SharedStyle[] {
  return [...css.matchAll(SHARED_STYLE)].map(([, text, label, description, name, body]) => {
    // Le nom comme classe : entouré d'espaces, de guillemets ou de bords de chaîne.
    const token = new RegExp(`(^|[\\s"'\`])${name}([\\s"'\`]|$)`);
    return {
      name,
      label,
      description: description.replace(/\s+/g, ' ').trim(),
      text: !!text,
      rule: body.replace(/\s+/g, ' ').trim(),
      usedIn: [...FILES]
        .filter(([file, source]) => !isTooling(file) && file.endsWith('.astro') && token.test(source))
        .map(([file]) => file)
        .sort(),
    };
  });
}

const illustrations = (): Illustration[] =>
  Object.entries(ILLUSTRATIONS)
    .map(([path, mod]) => ({ name: path.split('/').pop()!.replace(/\.\w+$/, ''), src: mod.default }))
    .sort((a, b) => a.name.localeCompare(b.name));

// --- Assemblage -----------------------------------------------------------------

function checkName(doc: DemoDoc | undefined, file: string, expected: string): string {
  if (!doc?.name?.trim()) {
    throw new Error(`${file} : \`export const demo\` sans \`name\`. Fiche attendue : ${expected} (src/lib/styleguide.ts).`);
  }
  return doc.name;
}

async function buildGallery() {
  const bySection = await sectionUsage();
  const entries: GalleryEntry[] = [];

  // Sections : une fiche par variante du registre, ses cas pris dans son .schema.ts.
  const sectionFiles = new Map<string, string>();
  const sectionEntries: { file: string; schemaFile: string; type: string; mod: (typeof SCHEMAS)[string] }[] = [];
  for (const [path, mod] of Object.entries(SCHEMAS)) {
    const schemaFile = rel(path);
    const type = mod.schema?.shape?.type?._def?.value as string | undefined;
    if (!type) throw new Error(`${schemaFile} : \`schema\` sans discriminant \`type\` littéral.`);
    if (!(type in SECTION_REGISTRY)) {
      throw new Error(`${schemaFile} : la section « ${type} » n'est pas enregistrée dans src/lib/sections.ts.`);
    }
    const file = schemaFile.replace(/\.schema\.ts$/, '.astro');
    sectionFiles.set(file, type);
    sectionEntries.push({ file, schemaFile, type, mod });
  }
  for (const type of Object.keys(SECTION_REGISTRY)) {
    if (!sectionEntries.some((s) => s.type === type)) {
      throw new Error(`Section « ${type} » du registre : aucun fichier .schema.ts trouvé sous src/components/sections/.`);
    }
  }

  for (const { file, schemaFile, type, mod } of sectionEntries) {
    const name = checkName(mod.demo, schemaFile, '{ name, examples: [{ label, example }] }');
    const examples = mod.demo?.examples ?? [];
    if (!examples.length) throw new Error(`${schemaFile} : \`demo.examples\` vide (un cas au moins).`);
    for (const { label, example } of examples) {
      const parsed = mod.schema.safeParse(example);
      if (!parsed.success) {
        throw new Error(`${schemaFile} : l'exemple « ${label} » ne passe pas le schéma : ${parsed.error.message}`);
      }
    }
    const family = type.split('.')[0];
    entries.push({
      id: idOf(file),
      file,
      group: SECTION_FAMILY_LABELS[family] ?? `Sections : ${family}`,
      sectionType: type,
      name,
      usedBy: await usageOf(file, sectionFiles, bySection),
      render: { kind: 'section', examples },
    });
  }

  // Composants : une démo colocalisée `<Nom>.demo.astro` chacun.
  for (const [path, mod] of Object.entries(DEMOS)) {
    const demoFile = rel(path);
    const file = demoFile.replace(/\.demo\.astro$/, '.astro');
    if (!FILES.has(file)) throw new Error(`${demoFile} : composant ${file} introuvable.`);
    const folder = file.split('/')[2];
    entries.push({
      id: idOf(file),
      file,
      group: FOLDER_LABELS[folder] ?? capitalize(folder),
      name: checkName(mod.demo, demoFile, '{ name }'),
      usedBy: await usageOf(file, sectionFiles, bySection),
      render: { kind: 'demo', Demo: mod.default },
    });
  }

  // Ordre du menu : Éléments, autres dossiers, puis familles de sections (ordre du registre).
  const sectionOrder = [...new Set(Object.keys(SECTION_REGISTRY).map((t) => t.split('.')[0]))];
  const rank = (e: GalleryEntry) =>
    e.sectionType ? 100 + sectionOrder.indexOf(e.sectionType.split('.')[0]) : e.group === FOLDER_LABELS.ui ? 0 : 1;
  entries.sort((a, b) => rank(a) - rank(b) || a.group.localeCompare(b.group, 'fr') || a.name.localeCompare(b.name, 'fr'));

  // `fondations` : segment réservé aux rubriques (/styleguide/fondations/<id>/).
  const ids = new Set<string>(['fondations']);
  for (const e of entries) {
    if (ids.has(e.id)) throw new Error(`Identifiant de galerie en double ou réservé : ${e.id} (${e.file}).`);
    ids.add(e.id);
  }

  // Fondations : une rubrique par groupe de tokens, puis les rubriques
  // facultatives, présentes seulement si le site en a (le modèle n'a ni @utility
  // annoté ni src/assets/illustrations).
  const styles = readSharedStyles(themeCss);
  const art = illustrations();
  const foundations: Foundation[] = [
    ...readTokens(themeCss).map((group) => ({ id: group.id, label: group.label, kind: 'tokens' as const, group })),
    ...(styles.length ? [{ id: 'styles' as const, label: 'Styles partagés', kind: 'styles' as const, styles }] : []),
    ...(art.length
      ? [{ id: 'illustrations' as const, label: 'Illustrations', kind: 'illustrations' as const, illustrations: art }]
      : []),
  ];

  // Menu (et ordre précédent / suivant) : Fondations, puis les familles.
  const nav: NavGroup[] = [
    {
      label: 'Fondations',
      items: foundations.map((f) => ({
        href: `/styleguide/fondations/${f.id}/`,
        name: f.label,
        search: `fondations ${f.label}`,
      })),
    },
  ];
  for (const e of entries) {
    const item = { href: `/styleguide/${e.id}/`, name: e.name, search: `${e.name} ${e.group} ${e.id}` };
    const last = nav.at(-1)!;
    if (last.label === e.group) last.items.push(item);
    else nav.push({ label: e.group, items: [item] });
  }

  return { entries, foundations, nav };
}

let cache: ReturnType<typeof buildGallery> | undefined;
export const getGallery = () => (cache ??= buildGallery());
