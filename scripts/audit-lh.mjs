// AUDIT LIGHTHOUSE — sert dist/ en local, lance Lighthouse sur les URL de
// lighthouserc.json (source unique des URL ET des seuils) et sort en code 1 si un
// seuil n'est pas tenu.
//
//   node scripts/audit-lh.mjs   (alias : pnpm run audit:lh)
//
// Pourquoi pas `lhci autorun` : sur Windows, chrome-launcher (utilisé par lhci et
// par la CLI Lighthouse) tue Chrome par `taskkill` sans atteindre les processus
// enfants, puis échoue en EPERM sur `rmSync` du profil temporaire — l'outil
// s'effondre après la 1re page alors que les scores sont bons (docs/learnings.md,
// 2026-09-14, 2 occurrences). Ici c'est CE script qui lance Chrome (profil dédié)
// et qui le ferme : l'API Lighthouse ne fait que se connecter au port CDP, donc
// chrome-launcher n'entre jamais en jeu. Un profil qui résiste à l'effacement est
// un avertissement, jamais un échec d'audit.
//
// Aucune dépendance déclarée : Lighthouse est résolu à la volée (node_modules du
// projet s'il y est, sinon `npx --yes --package=lighthouse`), Chrome est le Chrome
// du système (CHROME_PATH pour pointer un autre binaire).
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { delimiter, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RC_FILE = join(ROOT, 'lighthouserc.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const die = (msg) => { console.error(`audit:lh — ${msg}`); process.exit(2); };

// --- 1. lighthouserc.json : URL, dossier servi et seuils (source unique) -----
if (!existsSync(RC_FILE)) die(`config introuvable : ${RC_FILE}`);
const rc = JSON.parse(readFileSync(RC_FILE, 'utf8')).ci ?? {};
const DIST_DIR = resolve(ROOT, rc.collect?.staticDistDir ?? 'dist');
const URLS = rc.collect?.url ?? [];
const REPORT_DIR = resolve(ROOT, rc.upload?.outputDir ?? '.lighthouseci');
if (!URLS.length) die(`aucune URL dans ${RC_FILE} (ci.collect.url)`);
if (!existsSync(join(DIST_DIR, 'index.html'))) die(`${DIST_DIR} n'a pas de build — lance \`pnpm build\` d'abord.`);
if ((rc.collect?.numberOfRuns ?? 1) !== 1) {
  console.warn(`audit:lh — ci.collect.numberOfRuns = ${rc.collect.numberOfRuns} ignoré : ce script fait 1 run par URL.`);
}

// Seuils : `"categories:performance": ["error", { "minScore": 0.95 }]`.
// Les catégories auditées sont exactement celles qui portent un seuil.
const thresholds = Object.entries(rc.assert?.assertions ?? {})
  .filter(([key]) => key.startsWith('categories:'))
  .map(([key, value]) => {
    const [level, opts] = Array.isArray(value) ? value : [value, {}];
    return { id: key.slice('categories:'.length), level, minScore: opts?.minScore ?? 0 };
  })
  .filter((t) => t.level !== 'off');
if (!thresholds.length) die(`aucun seuil "categories:*" dans ${RC_FILE} (ci.assert.assertions)`);
const CATEGORIES = thresholds.map((t) => t.id);

// --- 2. serveur statique éphémère sur dist/ (port libre) ---------------------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
};
const server = createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = join(DIST_DIR, pathname);
    if (!file.startsWith(DIST_DIR)) { res.writeHead(403).end('403'); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      const fallback = join(DIST_DIR, '404.html');
      res.writeHead(404, { 'content-type': MIME['.html'] });
      res.end(existsSync(fallback) ? readFileSync(fallback) : '404');
      return;
    }
    res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  } catch { res.writeHead(500).end('500'); }
});
await new Promise((ok, ko) => { server.once('error', ko); server.listen(0, '127.0.0.1', ok); });
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

// --- 3. résolution de Lighthouse (projet, sinon npx) ------------------------
async function resolveLighthouse() {
  try {
    return createRequire(join(ROOT, 'noop.js')).resolve('lighthouse/core/index.js');
  } catch { /* pas installé dans le projet : on passe par npx */ }
  console.log('audit:lh — résolution de lighthouse via npx (téléchargé au 1er appel, puis mis en cache)…');
  // npx préfixe le PATH du .bin du paquet installé : on en déduit son node_modules.
  // `node` (nom nu) et non process.execPath : npx relance la commande via un shell
  // Windows, où un chemin contenant des espaces casse.
  const binDir = await run(process.execPath, [
    npxBin(), '--yes', '--package=lighthouse', '--', 'node',
    '-e', "process.stdout.write(process.env.PATH.split(require('path').delimiter)[0])",
  ]).then((out) => out.trim().split(delimiter)[0]);
  const entry = join(binDir, '..', 'lighthouse', 'core', 'index.js');
  if (!existsSync(entry)) die(`lighthouse introuvable après npx (${entry})`);
  return entry;
}
function npxBin() {
  const local = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js');
  if (!existsSync(local)) die("npx introuvable à côté de node — installe lighthouse dans le projet ou renseigne npm.");
  return local;
}
function run(cmd, args) {
  return new Promise((ok, ko) => {
    const child = spawn(cmd, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.on('error', ko);
    child.on('close', (code) => (code === 0 ? ok(out) : ko(new Error(`${cmd} a rendu ${code}`))));
  });
}

// --- 4. Chrome lancé PAR CE SCRIPT (profil dédié, port CDP propre) ----------
let chrome = null;
let profileDir = null;
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  join(process.env.LOCALAPPDATA ?? '', 'Google/Chrome/Application/chrome.exe'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

// Renseigne `chrome` (portée module) DÈS le spawn : toute erreur ensuite passe par
// le `finally` du run, qui ferme ce Chrome-là — jamais d'orphelin.
async function launchChrome(profileDir) {
  const bin = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!bin) throw new Error('Chrome introuvable — renseigne CHROME_PATH.');
  const child = spawn(bin, [
    '--headless=new', `--user-data-dir=${profileDir}`, '--remote-debugging-port=0',
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-background-networking', '--disable-sync', '--disable-default-apps',
    '--disable-component-update', '--disable-client-side-phishing-detection',
    '--metrics-recording-only', '--no-pings', '--mute-audio', '--password-store=basic',
    '--use-mock-keychain', '--force-color-profile=srgb', '--disable-gpu',
    '--disable-features=Translate,MediaRouter,OptimizationHints,DialMediaRouteProvider',
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'ignore'], detached: false });
  chrome = { child, bin, port: null, wsUrl: null };
  let spawnError = null;
  child.on('error', (err) => { spawnError = err; });

  // Chrome écrit le port réel + le chemin WebSocket dans <profil>/DevToolsActivePort.
  const portFile = join(profileDir, 'DevToolsActivePort');
  for (let i = 0; i < 200; i++) {
    if (spawnError) throw new Error(`Chrome n'a pas démarré (${bin}) : ${spawnError.message}`);
    if (child.exitCode !== null) throw new Error(`Chrome s'est arrêté au démarrage (code ${child.exitCode}).`);
    try {
      const [port, wsPath] = (await readFile(portFile, 'utf8')).split('\n');
      if (port && wsPath) {
        Object.assign(chrome, { port: Number(port), wsUrl: `ws://127.0.0.1:${port}${wsPath.trim()}` });
        return chrome;
      }
    } catch { /* pas encore écrit */ }
    await sleep(100);
  }
  throw new Error("Chrome n'a pas exposé son port CDP en 20 s.");
}

// Fermeture : d'abord `Browser.close` (CDP), qui termine aussi les processus
// enfants ; sinon kill de NOTRE pid seulement (jamais de kill global).
async function closeChrome(chrome) {
  if (!chrome || chrome.child.exitCode !== null) return;
  const exited = new Promise((ok) => chrome.child.once('exit', ok));
  try {
    if (chrome.wsUrl && typeof WebSocket !== 'undefined') {
      const ws = new WebSocket(chrome.wsUrl);
      await new Promise((ok) => { ws.onopen = ok; ws.onerror = ok; setTimeout(ok, 3000); });
      if (ws.readyState === 1) ws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
      await Promise.race([exited, sleep(5000)]);
      try { ws.close(); } catch { /* déjà fermé */ }
    }
  } catch { /* on passe au kill */ }
  if (chrome.child.exitCode !== null) return;
  chrome.child.kill();
  await Promise.race([exited, sleep(2000)]);
  if (chrome.child.exitCode === null && process.platform === 'win32' && chrome.child.pid) {
    // Arbre de NOTRE processus uniquement (/PID), jamais `taskkill /IM chrome.exe`.
    spawn('taskkill', ['/PID', String(chrome.child.pid), '/T', '/F'], { stdio: 'ignore' });
    await Promise.race([exited, sleep(3000)]);
  }
}

// Windows garde des handles sur le profil quelques instants après l'arrêt : on
// réessaie, et un échec résiduel n'est qu'un avertissement (c'est exactement ce
// qui faisait tomber lhci).
async function removeProfile(dir) {
  for (let i = 0; i < 6; i++) {
    try { await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); return true; }
    catch { await sleep(500); }
  }
  console.warn(`audit:lh — profil Chrome non effacé (verrou Windows), à supprimer à l'occasion : ${dir}`);
  return false;
}

// --- 5. run -----------------------------------------------------------------
let exitCode = 0;
const results = [];
try {
  const lighthouse = (await import(pathToFileURL(await resolveLighthouse()).href)).default;
  profileDir = await mkdtemp(join(tmpdir(), 'audit-lh-'));
  chrome = await launchChrome(profileDir);
  await mkdir(REPORT_DIR, { recursive: true });
  console.log(`audit:lh — ${DIST_DIR} servi sur ${ORIGIN} · Chrome ${chrome.child.pid} (CDP ${chrome.port})\n`);

  for (const declared of URLS) {
    const pathname = new URL(declared, ORIGIN).pathname;
    const started = Date.now();
    if (process.stdout.isTTY) process.stdout.write(`  ... ${pathname}`);
    const { lhr } = await lighthouse(ORIGIN + pathname, {
      port: chrome.port, output: 'json', logLevel: 'silent', onlyCategories: CATEGORIES,
    });
    if (lhr.runtimeError?.code && lhr.runtimeError.code !== 'NO_ERROR') {
      throw new Error(`${pathname} : ${lhr.runtimeError.message}`);
    }
    const name = pathname.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'index';
    await writeFile(join(REPORT_DIR, `${name}.report.json`), JSON.stringify(lhr));
    results.push({ pathname, scores: Object.fromEntries(CATEGORIES.map((id) => [id, lhr.categories[id]?.score])) });
    process.stdout.write(`${process.stdout.isTTY ? '\r' : ''}  ok  ${pathname} (${((Date.now() - started) / 1000).toFixed(1)} s)\n`);
  }
} catch (err) {
  console.error(`\naudit:lh — échec : ${err?.message ?? err}`);
  exitCode = 2;
} finally {
  await closeChrome(chrome);
  server.closeAllConnections?.();
  server.close();
  if (profileDir) await removeProfile(profileDir);
}

// --- 6. tableau page × catégorie + verdict ---------------------------------
if (results.length) {
  const fmt = (score) => (typeof score === 'number' ? String(Math.round(score * 100)) : 'n/a');
  const w = Math.max(4, ...results.map((r) => r.pathname.length));
  const cols = thresholds.map((t) => ({ ...t, w: Math.max(6, t.id.length) }));
  console.log(`\n${'page'.padEnd(w)}  ${cols.map((c) => c.id.padStart(c.w)).join('  ')}`);
  console.log('-'.repeat(w + cols.reduce((n, c) => n + c.w + 2, 0)));
  const failures = [];
  for (const { pathname, scores } of results) {
    const cells = cols.map(({ id, w: cw, minScore, level }) => {
      const score = scores[id];
      const ok = typeof score === 'number' && score >= minScore;
      if (!ok && level === 'error') failures.push(`${pathname} · ${id} : ${fmt(score)} < ${Math.round(minScore * 100)}`);
      return `${fmt(score)}${ok ? '' : ' !'}`.padStart(cw);
    });
    console.log(`${pathname.padEnd(w)}  ${cells.join('  ')}`);
  }
  if (failures.length) {
    exitCode = 1;
    console.error('');
    for (const f of failures) console.error(`  ECHEC  ${f}`);
    console.error(`\naudit:lh — ${failures.length} seuil(s) sous la cible. Rapports : ${REPORT_DIR}`);
  } else if (exitCode === 0) {
    const min = Math.round(Math.min(...thresholds.map((t) => t.minScore)) * 100);
    console.log(`\naudit:lh — ${results.length} page(s), tous les seuils tenus (>= ${min}). Rapports : ${REPORT_DIR}`);
  }
}
process.exitCode = exitCode;
