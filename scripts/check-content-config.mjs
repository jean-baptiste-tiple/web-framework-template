// CONTRÔLE DE LA CONFIG DES COLLECTIONS — src/content.config.ts n'importe jamais un
// .astro, ni directement ni via un module qui le fait (ADR 0004).
//
//   node scripts/check-content-config.mjs   (appelé par pnpm run lint)
//
// Pourquoi : Astro charge content.config.ts avant que Vite soit prêt à transformer les
// styles d'un composant. Un .astro atteint depuis la config (le registre des sections
// importait tous les composants) fait échouer le chargement : `pnpm dev` répond 500 sur
// toutes les pages (« Cannot read properties of undefined (reading 'get') », « Content
// config not loaded »), alors que le build passe. Défaut invisible au gate, vu sur un site
// dérivé (docs/learnings.md 2026-10-21).
//
// Méthode : graphe des imports d'exécution depuis content.config.ts (statiques, `export …
// from`, effets de bord, `import()` dynamiques). Alias `@/` → src/, chemins relatifs
// résolus ; paquets et modules virtuels (`astro:content`) ignorés. `import type` et
// `export type` sont effacés à la compilation : ignorés.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const ENTRY = 'src/content.config.ts';
const EXTENSIONS = ['', '.ts', '.mts', '.js', '.mjs', '/index.ts', '/index.js'];

const IMPORT_PATTERNS = [
  /^\s*import\s+(type\s+)?[^;'"]*?\bfrom\s*['"]([^'"]+)['"]/gm,
  /^\s*export\s+(type\s+)?(?:\*|\{[^}]*\})[^;'"]*?\bfrom\s*['"]([^'"]+)['"]/gm,
  /^\s*import\s*()['"]([^'"]+)['"]/gm,
  /\bimport\s*\(()\s*['"]([^'"]+)['"]\s*\)/g,
];

function specifiers(file) {
  const code = readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  const out = [];
  for (const pattern of IMPORT_PATTERNS) {
    for (const m of code.matchAll(pattern)) if (!m[1]) out.push(m[2]);
  }
  return out;
}

function resolve(spec, from) {
  const clean = spec.replace(/\?.*$/, '');
  let base;
  if (clean.startsWith('@/')) base = join('src', clean.slice(2));
  else if (clean.startsWith('.')) base = join(dirname(from), clean);
  else return null; // paquet ou module virtuel
  for (const ext of EXTENSIONS) {
    const candidate = base + ext;
    if (existsSync(candidate) && statSync(candidate).isFile()) return relative('.', candidate).replace(/\\/g, '/');
  }
  return undefined;
}

const parent = new Map([[ENTRY, null]]);
const queue = [ENTRY];
const errors = [];

function chain(file) {
  const path = [];
  for (let f = file; f; f = parent.get(f)) path.unshift(f);
  return path.join(' → ');
}

while (queue.length) {
  const file = queue.shift();
  for (const spec of specifiers(file)) {
    const target = resolve(spec, file);
    if (target === null) continue;
    if (target === undefined) {
      errors.push(`${file} : import « ${spec} » introuvable (contrôle incapable de suivre le graphe)`);
      continue;
    }
    if (parent.has(target)) continue;
    parent.set(target, file);
    if (target.endsWith('.astro')) errors.push(`.astro atteint depuis la config des collections : ${chain(target)}`);
    else queue.push(target);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(
    'content.config.ts ne doit importer aucun .astro (ADR 0004) : importer les schémas (src/lib/section-schemas.ts, *.schema.ts), jamais le registre des composants (src/lib/sections.ts).',
  );
  process.exit(1);
}
console.log(`Config des collections : aucun .astro dans ses imports (${parent.size} modules suivis).`);
