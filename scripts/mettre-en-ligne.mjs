// Mise en ligne : déclenche l'action GitHub « Mise en ligne » (.github/workflows/production.yml)
// sur le commit de TEST, ou sur un tag pour revenir en arrière, puis attend son résultat.
//   npm run mettre-en-ligne                     → dernier commit de main (site de test)
//   npm run mettre-en-ligne -- <tag ou commit>  → retour à une mise en ligne précédente
// Seule voie vers la production (ADR 0006) : la fenêtre de confirmation de Claude Code
// s'ouvre sur cette commande courte (règle « ask » et hook), et le commit est résolu ici,
// jamais recopié à la main. Le suivi se fait ici aussi : en session cloud, `gh` lancé
// seul n'a pas d'accès à l'API (constaté le 06/11/2026 sur un site dérivé). Fichier protégé, comme le
// hook : le développeur du site le change à la main.
import { execFileSync } from 'node:child_process';

const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();
// Dépôt lu depuis `origin` (deux derniers segments) : en session cloud, l'adresse passe par un proxy.
const REPO = run('git', ['remote', 'get-url', 'origin']).replace(/\.git$/, '').split(/[/:]/).slice(-2).join('/');
const RUNS = `repos/${REPO}/actions/workflows/production.yml/runs?per_page=1&event=workflow_dispatch`;
const lastRun = () => JSON.parse(run('gh', ['api', RUNS, '--jq', '.workflow_runs[0] // {} | {id, status, conclusion}']) || '{}');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

run('git', ['fetch', '-q', 'origin', '--tags', '--force']);
const target = process.argv[2] ?? 'origin/main';
let commit;
try {
  commit = run('git', ['rev-parse', '--verify', `${target}^{commit}`]);
} catch {
  console.error(`Introuvable : ${target}. Rien n'est parti.`);
  process.exit(1);
}

const before = lastRun().id;
run('gh', [
  'api', '-X', 'POST',
  `repos/${REPO}/actions/workflows/production.yml/dispatches`,
  '-f', 'ref=main',
  '-f', `inputs[ref]=${commit}`,
]);
console.log(`Mise en ligne lancée sur le commit ${commit.slice(0, 7)} (${target}). Suivi en cours…`);

// Jusqu'à 10 minutes : l'exécution apparaît, puis se termine.
for (let i = 0; i < 40; i++) {
  await wait(15000);
  const r = lastRun();
  if (!r.id || r.id === before) continue;
  if (r.status !== 'completed') continue;
  if (r.conclusion === 'success') {
    console.log(`Mise en ligne réussie (exécution ${r.id}).`);
    process.exit(0);
  }
  console.error(`Mise en ligne en échec (exécution ${r.id}, ${r.conclusion}) : le site officiel n'a pas changé.`);
  process.exit(1);
}
console.error("Pas de résultat après 10 minutes : vérifier le site officiel avant de conclure.");
process.exit(1);
