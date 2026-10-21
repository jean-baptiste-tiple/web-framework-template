// Bibliothèque de composants (/styleguide) : tout ce qu'elle montre est
// DÉCOUVERT au build, rien n'y est listé à la main (ADR 0003).
//  - composants : chaque `<Nom>.demo.astro` colocalisé (rendu + `export const demo`) ;
//  - sections : `export const demo` (métadonnées + `example` typé) de chaque
//    `<Variante>.schema.ts`, rendu par SectionRenderer ;
//  - tokens : blocs @theme de src/styles/global.css ;
//  - styles partagés : @utility de global.css annotés juste au-dessus
//    `/* Style de texte « Nom » : rôle. */` ou `/* Style « Nom » : rôle. */` ;
//  - illustrations : fichiers de src/assets/illustrations (dossier facultatif) ;
//  - « pages qui l'utilisent » : graphe des imports de src/ + frontmatter
//    `sections:` des collections.
// Le contrôle « tout composant a sa démo » est fait au lint
// (scripts/check-styleguide.mjs) ; ce module casse le build si une démo est
// incomplète ou si l'exemple d'une section ne passe pas son schéma.
import { getCollection } from 'astro:content';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import type { z } from 'astro/zod';
import { collections } from '@/content.config';
import { SECTION_REGISTRY, type AnySection, type SectionType } from '@/lib/sections';
import themeCss from '@/styles/global.css?raw';

// Galerie absente du build de production (action « Mise en ligne »,
// VERCEL_ENV=production) ; présente sur TEST, les aperçus et en local.
export const GALLERY_ENABLED = process.env.VERCEL_ENV !== 'production';

/** Fiche éditeur d'un composant : ce que la bibliothèque affiche en tête. */
export interface DemoDoc {
  /** Nom en français, celui qu'un éditeur emploie (« Bandeau d'appel à l'action »). */
  name: string;
  /** À quoi ça sert, en une phrase. */
  purpose: string;
  /** Phrase à dire à Claude pour l'utiliser (« Ajoute un bandeau… sur la page… »). */
  ask: string;
}

/** Démo d'une section : fiche + exemple typé par le schéma de la section. */
export interface SectionDemo<T> extends DemoDoc {
  example: T;
}

/** Qui peut s'en servir : `page` = section ajoutable dans `sections:` (édition),
 *  `global` = chrome (textes dans site.json, modèle = développement), `dev` = développement. */
export type Access = 'page' | 'global' | 'dev';

export interface Field {
  name: string;
  optional: boolean;
  type: string;
  note?: string;
}

export interface Usage {
  label: string;
  href?: string;
}

export interface GalleryEntry {
  /** Ancre (#id) et page isolée /styleguide/<id>/. */
  id: string;
  file: string;
  demoFile: string;
  group: string;
  access: Access;
  sectionType?: string;
  doc: DemoDoc;
  fields: Field[];
  variants: { name: string; values: string[] }[];
  usedBy: Usage[];
  render: { kind: 'demo'; Demo: AstroComponentFactory } | { kind: 'section'; example: AnySection };
  search: string;
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

// --- Sources découvertes --------------------------------------------------------

const DEMOS = import.meta.glob<{ default: AstroComponentFactory; demo?: DemoDoc }>(
  '/src/components/**/*.demo.astro',
  { eager: true },
);
const SCHEMAS = import.meta.glob<{
  schema: z.AnyZodObject;
  demo?: SectionDemo<AnySection>;
}>('/src/components/sections/**/*.schema.ts', { eager: true });
// Sources brutes : props des composants et graphe des imports.
const SOURCES = import.meta.glob<string>('/src/**/*.{astro,ts,mdx}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

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

// --- Props d'un composant (interface Props du frontmatter) ----------------------

function propsOf(source: string): Field[] {
  const code = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const start = code.match(/(?:interface\s+Props\b[^{]*|type\s+Props\s*=\s*)\{/);
  if (!start || start.index === undefined) return [];
  let i = start.index + start[0].length;
  const from = i;
  for (let depth = 1; i < code.length && depth > 0; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') depth--;
  }
  const fields: Field[] = [];
  let note = '';
  let inComment = false;
  let buf = '';
  let depth = 0;
  for (const raw of code.slice(from, i - 1).split('\n')) {
    const line = raw.trim();
    if (!buf) {
      if (inComment || line.startsWith('/*')) {
        inComment = !line.endsWith('*/');
        note += ` ${line.replace(/^\/\*+|\*+\/$|^\*+/g, '').trim()}`;
        continue;
      }
      if (line.startsWith('//')) {
        note += ` ${line.slice(2).trim()}`;
        continue;
      }
      if (!line) continue;
    }
    buf += ` ${line.replace(/\s\/\/.*$/, '')}`;
    depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
    if (depth > 0) continue;
    const m = buf.trim().match(/^(?:readonly\s+)?([\w$]+)(\?)?\s*:\s*(.+?);?$/);
    // Note affichée telle quelle : les tirets des commentaires de code deviennent
    // des virgules (zéro tiret dans le texte visible, craft-floor).
    const text = note.replace(/\s*[—–]\s*/g, ', ').trim();
    if (m) fields.push({ name: m[1], optional: !!m[2], type: m[3], note: text || undefined });
    buf = '';
    note = '';
  }
  return fields;
}

// --- Champs d'une section (schéma Zod) ------------------------------------------

type AnyZod = z.ZodTypeAny;

function zodType(t: AnyZod): string {
  const d = t._def;
  switch (d.typeName) {
    case 'ZodOptional':
    case 'ZodNullable':
    case 'ZodDefault':
      return zodType(d.innerType);
    case 'ZodEffects':
      return zodType(d.schema);
    case 'ZodString':
      return 'texte';
    case 'ZodNumber':
      return 'nombre';
    case 'ZodBoolean':
      return 'oui / non';
    case 'ZodDate':
      return 'date';
    case 'ZodLiteral':
      return JSON.stringify(d.value);
    case 'ZodEnum':
      return (d.values as string[]).map((v) => `'${v}'`).join(' | ');
    case 'ZodArray':
      return `liste de ${zodType(d.type)}`;
    case 'ZodObject':
      return `{ ${Object.entries((t as z.AnyZodObject).shape)
        .map(([k, v]) => `${k}${(v as AnyZod).isOptional() ? '?' : ''}`)
        .join(', ')} }`;
    case 'ZodUnion':
    case 'ZodDiscriminatedUnion':
      return (d.options as AnyZod[]).map(zodType).join(' | ');
    default:
      return String(d.typeName).replace(/^Zod/, '').toLowerCase();
  }
}

const fieldsOf = (schema: z.AnyZodObject): Field[] =>
  Object.entries(schema.shape)
    .filter(([name]) => name !== 'type')
    .map(([name, t]) => ({ name, optional: (t as AnyZod).isOptional(), type: zodType(t as AnyZod) }));

// Variantes = champs dont le type est une union de littéraux texte.
const variantsOf = (fields: Field[]) =>
  fields.flatMap((f) => {
    const values = [...f.type.matchAll(/'([^']+)'/g)].map((m) => m[1]);
    return values.length > 1 && /^\s*'[^']+'(\s*\|\s*'[^']+')+\s*$/.test(f.type)
      ? [{ name: f.name, values }]
      : [];
  });

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

function routeUsage(file: string): Usage {
  const route = `${file.replace(/^src\/pages/, '').replace(/\.(astro|ts)$/, '').replace(/\/?index$/, '')}/`;
  return route.includes('[') ? { label: `${route} (chaque page de cette route)` } : { label: route, href: route };
}

function usageOf(file: string, sectionFiles: Map<string, string>, bySection: Map<string, Usage[]>): Usage[] {
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
        const u = routeUsage(importer);
        out.set(u.label, u);
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

function checkDoc(doc: DemoDoc | undefined, file: string): DemoDoc {
  const missing = (['name', 'purpose', 'ask'] as const).filter((k) => !doc?.[k]?.trim());
  if (!doc || missing.length) {
    throw new Error(
      `${file} : \`export const demo\` incomplet (${missing.join(', ') || 'absent'}). Fiche attendue : { name, purpose, ask } (src/lib/styleguide.ts, DemoDoc).`,
    );
  }
  return doc;
}

async function buildGallery() {
  const bySection = await sectionUsage();
  const entries: GalleryEntry[] = [];

  // Sections : une démo par variante du registre, prise dans son .schema.ts.
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
    const doc = checkDoc(mod.demo, schemaFile);
    const parsed = mod.schema.safeParse(mod.demo!.example);
    if (!parsed.success) {
      throw new Error(`${schemaFile} : \`demo.example\` ne passe pas le schéma : ${parsed.error.message}`);
    }
    const family = type.split('.')[0];
    const fields = fieldsOf(mod.schema);
    entries.push({
      id: idOf(file),
      file,
      demoFile: schemaFile,
      group: SECTION_FAMILY_LABELS[family] ?? `Sections : ${family}`,
      access: 'chrome' in SECTION_REGISTRY[type as SectionType] ? 'global' : 'page',
      sectionType: type,
      doc,
      fields,
      variants: variantsOf(fields),
      usedBy: usageOf(file, sectionFiles, bySection),
      render: { kind: 'section', example: mod.demo!.example },
      search: '',
    });
  }

  // Composants : une démo colocalisée `<Nom>.demo.astro` chacun.
  for (const [path, mod] of Object.entries(DEMOS)) {
    const demoFile = rel(path);
    const file = demoFile.replace(/\.demo\.astro$/, '.astro');
    const source = FILES.get(file);
    if (source === undefined) throw new Error(`${demoFile} : composant ${file} introuvable.`);
    const folder = file.split('/')[2];
    const fields = propsOf(source);
    entries.push({
      id: idOf(file),
      file,
      demoFile,
      group: FOLDER_LABELS[folder] ?? capitalize(folder),
      access: 'dev',
      doc: checkDoc(mod.demo, demoFile),
      fields,
      variants: variantsOf(fields),
      usedBy: usageOf(file, sectionFiles, bySection),
      render: { kind: 'demo', Demo: mod.default },
      search: '',
    });
  }

  for (const e of entries) {
    // « aucune page » : retrouver d'un mot les composants inutilisés (ligne visible de la fiche).
    const unused = e.usedBy.length ? '' : 'aucune page inutilisé';
    e.search = [e.doc.name, e.doc.purpose, e.doc.ask, e.group, e.id, e.file, e.sectionType ?? '', unused].join(' ');
  }

  // Ordre du menu : Éléments, autres dossiers, puis familles de sections (ordre du registre).
  const sectionOrder = [...new Set(Object.keys(SECTION_REGISTRY).map((t) => t.split('.')[0]))];
  const rank = (e: GalleryEntry) =>
    e.sectionType ? 100 + sectionOrder.indexOf(e.sectionType.split('.')[0]) : e.group === FOLDER_LABELS.ui ? 0 : 1;
  entries.sort((a, b) => rank(a) - rank(b) || a.group.localeCompare(b.group, 'fr') || a.doc.name.localeCompare(b.doc.name, 'fr'));

  const groups: { label: string; entries: GalleryEntry[] }[] = [];
  for (const e of entries) {
    const last = groups.at(-1);
    if (last?.label === e.group) last.entries.push(e);
    else groups.push({ label: e.group, entries: [e] });
  }

  const ids = new Set<string>();
  for (const e of entries) {
    if (ids.has(e.id)) throw new Error(`Identifiant de galerie en double : ${e.id} (${e.file}).`);
    ids.add(e.id);
  }

  return {
    entries,
    groups,
    tokens: readTokens(themeCss),
    styles: readSharedStyles(themeCss),
    illustrations: illustrations(),
  };
}

let cache: ReturnType<typeof buildGallery> | undefined;
export const getGallery = () => (cache ??= buildGallery());
