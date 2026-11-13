// Garde-fou de mise en ligne (ADR 0006) : hook PreToolUse de .claude/settings.json.
// Lit l'appel d'outil sur l'entrée standard et répond à Claude Code :
// - `npm run mettre-en-ligne` (scripts/mettre-en-ligne.mjs, qui déclenche l'action
//   « Mise en ligne ») : « ask » avec ce qui part ; Claude Code ouvre sa fenêtre de
//   confirmation sur cette commande courte. C'est le seul oui (publier/projet.md § 2).
//   Les règles « ask » de settings.json garantissent la fenêtre même si ce script ne
//   tourne pas ;
// - toute autre façon de changer la production, ou d'écrire dans les fichiers qui
//   portent ce garde-fou : « deny » ;
// - le reste : aucune réponse, Claude Code décide comme d'habitude.
import { execFileSync } from 'node:child_process';

const LAUNCH = /\b(npm|pnpm)\s+run\s+mettre-en-ligne\b|\bnode\s+\S*scripts[\\/]mettre-en-ligne\.mjs\b/;

/** Autres chemins vers la production : refusés, la seule voie est `npm run mettre-en-ligne`. */
const OTHER_ROUTES = [
  /\b(gh\s+api|curl|wget|Invoke-WebRequest|Invoke-RestMethod)\b[^|;&]*dispatches/,
  /\bgh\s+workflow\s+run\b/,
  /\bvercel\b[^|;&]*\s(--prod|promote|rollback)\b/,
  /\bgit\s+push\b[^|;&]*(\bproduction\b|--tags|refs\/tags)/,
];

/** Fichiers du garde-fou : lisibles, jamais réécrits par Claude. */
const PROTECTED_PATH = String.raw`(\.claude[\\/](settings(\.local)?\.json|hooks[\\/])|scripts[\\/]mettre-en-ligne\.mjs)`;
const PROTECTED = new RegExp(PROTECTED_PATH);
const WRITES = new RegExp(
  String.raw`(>\s*["']?[^\s"'|;&]*${PROTECTED_PATH}|\btee\b|\bsed\s+-i|\b(cp|mv|rm)\b|\bgit\s+(checkout|restore)\b|\bnode\s+-e|\bpython|\bperl|\b(Copy|Move|Remove|New|Rename)-Item\b|\b(Set|Add|Clear)-Content\b|\bOut-File\b)`,
  'i',
);

const reply = (permissionDecision, permissionDecisionReason) => {
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision, permissionDecisionReason } }),
  );
  process.exit(0);
};

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();

/** Sujets qui partent : du commit en production au commit demandé. */
function recap(command) {
  const ref = command.match(/mettre-en-ligne(?:\.mjs)?\s+(?:--\s+)?([\w./-]+)/)?.[1] ?? 'origin/main';
  try {
    git('fetch', '-q', 'origin', '--tags', '--force');
  } catch {
    // Hors ligne : récapitulatif sur l'état local, dit comme tel.
  }
  try {
    const subjects = git('log', '--first-parent', '--format=- %s (%an)', `production..${ref}`);
    if (!subjects) return `Rien de nouveau : le site officiel est déjà à ce commit (${ref}).`;
    const lines = subjects.split('\n');
    const shown = lines.slice(0, 12).join('\n');
    const more = lines.length > 12 ? `\n… et ${lines.length - 12} autres` : '';
    return `Ce qui part (tout le site de test) :\n${shown}${more}`;
  } catch {
    return `Récapitulatif indisponible (${ref} introuvable) : vérifier avant d'accepter.`;
  }
}

let input = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) input += chunk;
const command = String(JSON.parse(input || '{}').tool_input?.command ?? '');

if (PROTECTED.test(command) && WRITES.test(command)) {
  reply('deny', 'Les fichiers du garde-fou de mise en ligne ne se modifient pas depuis Claude (ADR 0006) : le développeur du site les change à la main.');
}
if (LAUNCH.test(command)) {
  reply('ask', `Mettre en ligne sur le site officiel ?\n\n${recap(command)}\n\nAutoriser = mise en ligne (environ 2 minutes). Refuser = rien ne part.`);
}
if (OTHER_ROUTES.some((re) => re.test(command))) {
  reply('deny', 'La production ne change que par `npm run mettre-en-ligne` (skill publier, ADR 0006) : cette commande est refusée.');
}

// Envoi vers le site de test (main) ou vers une branche : aucune fenêtre, le site
// officiel ne change pas (demande JB du 06/11/2026). La commande peut enchaîner `cd`, des
// opérations git locales, un message de commit sur plusieurs lignes, `2>&1` ou
// `| tail` : seuls comptent l'envoi (vers main ou une branche) et l'absence de toute
// autre action. Les règles « deny » de settings.json (push forcé…) s'appliquent quand même.
const PUSH = /\bgit\s+(-C\s+\S+\s+)?push\s+(-u\s+|--set-upstream\s+)?origin\s+(HEAD:main|HEAD:refs\/heads\/[a-z0-9-]+|HEAD:[a-z0-9-]+|[a-z0-9-]+)(?=\s|$|;|&|\|)/;
const RISKY = /\b(rm|mv|cp|curl|wget|gh|vercel|npm|pnpm|npx|node|python3?|perl|sed|tee|chmod|Invoke-\w+|Remove-Item|Set-Content|Copy-Item|Move-Item)\b|--force|--delete|--tags|--mirror|refs\/tags|\bproduction\b|\s-f\b|\s\+\S/;
const withoutMessages = command.replace(/-m\s+("([^"\\]|\\.)*"|'[^']*')/g, '-m MSG').replace(/<<'?(\w+)'?[\s\S]*?\n\1\b/g, 'HEREDOC');
if (PUSH.test(command) && !RISKY.test(withoutMessages)) {
  reply('allow', 'Envoi vers le site de test ou vers une branche : le site officiel ne change pas.');
}
