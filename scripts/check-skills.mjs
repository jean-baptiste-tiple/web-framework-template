// CONTRÔLE DES SKILLS — chaque .claude/skills/<nom>/SKILL.md doit avoir un frontmatter
// lisible par Claude Code : `name` et `description` présents, description sur une ligne.
//
//   node scripts/check-skills.mjs   (appelé par pnpm run lint)
//
// Pourquoi : une description YAML sans guillemets qui contient « : » ou « # » n'est pas
// lisible ; Claude Code ignore alors le frontmatter, affiche la première ligne du corps et
// perd les phrases déclencheuses du skill, sans aucun message (5 skills touchés,
// docs/learnings.md 2026-10-20). Règle : description entre guillemets doubles, ou sans
// « : » ni « # » précédé d'une espace.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = '.claude/skills';
const errors = [];

for (const dir of readdirSync(root)) {
  const file = join(root, dir, 'SKILL.md');
  if (!existsSync(file)) continue;
  const text = readFileSync(file, 'utf8').replace(/\r/g, '');
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) {
    errors.push(`${file} : pas de frontmatter`);
    continue;
  }
  const fields = Object.fromEntries(
    fm[1].split('\n').map((line) => {
      const i = line.indexOf(':');
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }),
  );
  if (fields.name !== dir) errors.push(`${file} : name doit valoir « ${dir} »`);
  const desc = fields.description;
  if (!desc) {
    errors.push(`${file} : description absente`);
  } else if (desc.startsWith('"')) {
    if (!desc.endsWith('"') || desc.slice(1, -1).includes('"')) {
      errors.push(`${file} : description entre guillemets mal fermée`);
    }
  } else if (/:\s|\s#/.test(desc)) {
    errors.push(`${file} : description avec « : » ou « # » sans guillemets doubles`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Skills : frontmatter lisible partout.');
