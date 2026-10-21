// CONTRÔLE DE LA BIBLIOTHÈQUE (/styleguide) — chaque composant de src/components a sa
// démo colocalisée, sinon il n'existe pas pour les éditeurs ni pour la review (ADR 0003).
//
//   node scripts/check-styleguide.mjs   (appelé par pnpm run lint)
//
// Règles :
//  - `<Nom>.astro` avec un `<Nom>.schema.ts` voisin (section) : le schéma exporte `demo`
//    (`name` + `examples`, un cas libellé par variante), rendu par SectionRenderer ;
//  - tout autre `<Nom>.astro` : un `<Nom>.demo.astro` voisin qui exporte `demo` (`name`) ;
//  - outillage de la bibliothèque (src/components/styleguide/) : hors contrôle ;
//  - une démo sans composant, ou une exclusion qui ne vise plus rien, est une erreur.
// Pourquoi : la galerie écrite à la main oubliait sans bruit (23 composants sur 69
// absents sur un site dérivé). La complétude des fiches et la validité des exemples
// sont contrôlées au build (src/lib/styleguide.ts).
//
// NOMS des fiches (component-registry.md § Bibliothèque vivante, « Nom d'une fiche ») :
//  le nom DÉCRIT la forme (type de mise en page + éléments), jamais le contenu. Contrôlé :
//  5 mots au plus (2 au moins pour une section), sans guillemets ni ponctuation de
//  slogan (« » " “ ” ! ?), sans le nom du site (site.json : name, shortName,
//  organizationName), unique dans la bibliothèque. Ce que la machine ne voit pas (nom
//  de page, slogan sans guillemets) se cite en review.
//
// Deux contrôles de RÉUTILISATION en plus (component-registry.md § Bibliothèque vivante) :
//  A. Groupe de classes recopié : le même ensemble de classes (ordre indifférent) dans
//     deux fichiers .astro = du markup recopié au lieu d'un composant. Périmètre réglé
//     contre les faux positifs : attribut `class="…"` statique (les `class={…}` sont
//     calculés), 4 classes ou plus, au moins une classe VISUELLE (texte, fond,
//     bordure, rayon, ombre, typo, contour) : une pure mise en page (`grid gap-6
//     sm:grid-cols-2`) est une grammaire, pas l'identité d'un composant. Les
//     `*.demo.astro` sont hors périmètre (ils montrent des compositions d'usage).
//  B. Page qui compose ses sections : tout fichier de src/pages qui pose `<Section>`
//     ou `<section>` lui-même est déclaré, avec sa raison, dans la table « Pages
//     bespoke » de component-registry.md ; sinon il doit passer par les composants.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Composants sans démo, liste COURTE : chacun porte sa raison. Ajouter une ligne ici
// demande la même justification qu'une surface nouvelle (code-review § Sobriété).
const EXCLUSIONS = new Map([
  ['src/components/seo/BaseHead.astro', 'balises du <head>, rien de visible'],
  ['src/components/seo/JsonLd.astro', 'données structurées, rien de visible'],
  ['src/components/landing/SectionRenderer.astro', 'aiguillage sans markup : chaque section a sa démo'],
  ['src/components/ui/Container.astro', 'primitive de largeur, visible dans toutes les démos'],
  ['src/components/ui/Section.astro', 'primitive d’espacement vertical, sans rendu propre'],
]);
// Outillage de la bibliothèque elle-même (DemoCase, mise en page, navigation) : sans démo.
const TOOLING = 'src/components/styleguide/';

const root = 'src/components';
const exportsDemo = (file) => /export\s+const\s+demo\b/.test(readFileSync(file, 'utf8'));

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name).split('\\').join('/')],
  );
}

const files = walk(root);
const errors = [];
let covered = 0;

for (const file of files.filter((f) => f.endsWith('.astro') && !f.endsWith('.demo.astro'))) {
  if (EXCLUSIONS.has(file) || file.startsWith(TOOLING)) continue;
  const base = file.slice(0, -'.astro'.length);
  const schema = `${base}.schema.ts`;
  const demo = `${base}.demo.astro`;
  if (existsSync(schema)) {
    if (exportsDemo(schema)) covered++;
    else
      errors.push(
        `${file} : section sans exemple. Ajouter \`export const demo = { name, examples: [{ label, example }] } satisfies SectionDemo<…>\` dans ${schema}.`,
      );
  } else if (existsSync(demo)) {
    if (exportsDemo(demo)) covered++;
    else
      errors.push(
        `${demo} : \`export const demo: DemoDoc = { name }\` absent du frontmatter (annotation de type : \`satisfies\` casse le build d'un export hissé).`,
      );
  } else {
    errors.push(
      `${file} : aucune démo. Créer ${demo} (fiche \`demo\` + rendu des variantes, modèle : src/components/ui/Button.demo.astro), ou l'ajouter aux EXCLUSIONS de scripts/check-styleguide.mjs avec sa raison.`,
    );
  }
}

for (const demo of files.filter((f) => f.endsWith('.demo.astro'))) {
  if (!existsSync(demo.replace(/\.demo\.astro$/, '.astro'))) errors.push(`${demo} : démo sans composant voisin.`);
}
for (const file of EXCLUSIONS.keys()) {
  if (!existsSync(file)) errors.push(`EXCLUSIONS de scripts/check-styleguide.mjs : ${file} n'existe plus, retirer la ligne.`);
}

// --- Noms des fiches : la forme, pas le contenu --------------------------------------
const site = JSON.parse(readFileSync('src/content/settings/site.json', 'utf8'));
const siteNames = [...new Set([site.name, site.shortName, site.organizationName].filter(Boolean))];
const names = new Map();
for (const file of files.filter((f) => f.endsWith('.demo.astro') || f.endsWith('.schema.ts'))) {
  const m = readFileSync(file, 'utf8').match(/export\s+const\s+demo\b[\s\S]*?\bname:\s*(['"`])((?:(?!\1).)*)\1/);
  if (!m) continue;
  const name = m[2];
  const section = file.endsWith('.schema.ts');
  const words = name.split(/[\s·,+/«»"“”!?:;()-]+/).filter(Boolean).length;
  const problems = [];
  if (words > 5 || (section && words < 2)) problems.push(`${words} mot${words > 1 ? 's' : ''} (attendu : ${section ? '2' : '1'} à 5)`);
  if (/[«»"“”!?]/.test(name)) problems.push('guillemets ou ponctuation de slogan');
  for (const s of siteNames) if (name.toLowerCase().includes(s.toLowerCase())) problems.push(`nom du site « ${s} »`);
  if (problems.length) {
    errors.push(
      `${file} : nom « ${name} » refusé (${problems.join(', ')}). Le nom décrit la forme : type de mise en page + éléments (« 3 colonnes · picto, titre, texte »), sans contenu, nom de page ni slogan ; une variante se nomme dans le libellé de son cas (component-registry.md § Bibliothèque vivante).`,
    );
  }
  if (!names.has(name)) names.set(name, []);
  names.get(name).push(file);
}
for (const [name, where] of names) {
  if (where.length > 1) {
    errors.push(
      `Nom « ${name} » porté par ${where.join(', ')} : deux fiches au même nom. Même forme = un composant à variante (component-registry.md § Doublons), sinon nommer la différence.`,
    );
  }
}

// --- A. Groupes de classes recopiés entre fichiers ---------------------------------
const VISUAL =
  /^(text-|bg-|border|rounded|shadow|font-|tracking-|leading-|underline|decoration-|outline|ring|opacity-|italic|uppercase|lowercase|capitalize|fill-|stroke-)/;
const groups = new Map();
for (const file of walk('src').filter((f) => f.endsWith('.astro') && !f.endsWith('.demo.astro'))) {
  for (const m of readFileSync(file, 'utf8').matchAll(/\sclass="([^"{}]+)"/g)) {
    const classes = [...new Set(m[1].trim().split(/\s+/))].sort();
    if (classes.length < 4 || !classes.some((c) => VISUAL.test(c.replace(/^([\w-]+:)+/, '')))) continue;
    const key = classes.join(' ');
    if (!groups.has(key)) groups.set(key, new Set());
    groups.get(key).add(file);
  }
}
for (const [key, where] of groups) {
  if (where.size < 2) continue;
  errors.push(
    `Classes « ${key} » recopiées dans ${[...where].join(', ')} : un composant de la bibliothèque (/styleguide) le porte peut-être déjà ; sinon en extraire un, avec sa démo (component-registry.md § Bibliothèque vivante).`,
  );
}

// --- B. Pages qui composent leurs sections : déclarées au registre ------------------
const registry = readFileSync('.claude/conventions/component-registry.md', 'utf8').replace(/\r/g, '');
const table = registry.split('## Pages bespoke')[1]?.split('\n## ')[0] ?? '';
const declared = new Set(
  table
    .split('\n')
    .filter((line) => line.startsWith('|') && !/^\|\s*(Page|-)/.test(line))
    .flatMap((line) => line.split('|')[1].split(',').map((p) => p.trim()))
    .filter(Boolean),
);
if (!table) errors.push('component-registry.md : table « Pages bespoke » introuvable.');
for (const file of walk('src/pages').filter((f) => f.endsWith('.astro') && !/\/_[^/]*$/.test(f))) {
  const page = file.replace(/^src\/pages\//, '');
  if (/<(Section|section)\b/.test(readFileSync(file, 'utf8')) && !declared.has(page)) {
    errors.push(
      `src/pages/${page} compose ses sections elle-même (<Section> ou <section>) sans être déclarée dans la table « Pages bespoke » de component-registry.md : passer par les composants de la bibliothèque (/styleguide), ou déclarer la page avec sa raison.`,
    );
  }
}
for (const page of declared) {
  if (!existsSync(`src/pages/${page}`)) errors.push(`Table « Pages bespoke » : src/pages/${page} n'existe plus, retirer la ligne.`);
}

if (errors.length) {
  console.error(`Bibliothèque /styleguide incomplète :\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `Bibliothèque : ${covered} composants avec démo, ${names.size} noms conformes, ${EXCLUSIONS.size} exclusions déclarées, 0 groupe de classes recopié, ${declared.size} pages bespoke déclarées.`,
);
