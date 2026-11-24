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

// Agents (.claude/agents/) : même frontmatter, et chacun cité par un skill ou CLAUDE.md. Un
// `name` différent du fichier rend l'agent introuvable : la session retombe sur un agent
// générique sans méthode ni interdictions, sans message. Un agent que rien ne cite n'est plus
// lancé par personne et dérive sans que personne le voie.
const agentsRoot = '.claude/agents';
if (existsSync(agentsRoot)) {
  const cites = [readFileSync('CLAUDE.md', 'utf8')];
  for (const dir of readdirSync(root)) {
    const dossier = join(root, dir);
    for (const f of existsSync(dossier) ? readdirSync(dossier, { recursive: true }) : []) {
      if (String(f).endsWith('.md')) cites.push(readFileSync(join(dossier, String(f)), 'utf8'));
    }
  }
  const corpus = cites.join('\n');
  for (const f of readdirSync(agentsRoot).filter((f) => f.endsWith('.md'))) {
    const file = join(agentsRoot, f);
    const nom = f.slice(0, -3);
    const fm = readFileSync(file, 'utf8').replace(/\r/g, '').match(/^---\n([\s\S]*?)\n---/);
    const champ = (k) => fm?.[1].match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1].trim();
    if (!fm) errors.push(`${file} : pas de frontmatter`);
    else if (champ('name') !== nom) errors.push(`${file} : name doit valoir « ${nom} »`);
    else if (!champ('description')) errors.push(`${file} : description absente`);
    if (!corpus.includes(`\`${nom}\``)) errors.push(`${file} : agent cité par aucun skill ni par CLAUDE.md`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Skills : frontmatter lisible partout.');
