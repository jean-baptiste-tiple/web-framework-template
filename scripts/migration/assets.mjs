// Téléchargement poli des assets CDN référencés dans le snapshot.
// Zéro dépendance. Resumable (skip si déjà téléchargé). Produit ASSETS_MAP_FILE.
// Usage : node scripts/migration/assets.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { SNAPSHOT_DIR, USER_AGENT, CDN_HOSTS, ASSETS_MAP_FILE } from './config.mjs';

const PAGES = join(SNAPSHOT_DIR, 'pages');
const DEST = join(SNAPSHOT_DIR, 'assets'); // staging gitignoré ; la conversion copie dans le projet
const UA = USER_AGENT;
const DELAY_MS = 250; // CDN statique : pas besoin d'1 req/s, mais on reste poli
const HOSTS = CDN_HOSTS;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (name === 'index.html') yield p;
  }
}

// Collecte des URLs d'assets (src, srcset, href, url(), content="...og:image").
// On autorise ( ) dans le nom de fichier (Webflow : "feuille (2).png"), on stoppe
// seulement aux délimiteurs d'attribut ; on retire ensuite une ) finale non appariée
// (cas CSS url(...) ou markup ...png) ).
const hostAlt = HOSTS.map((h) => h.replace(/\./g, '\\.')).join('|');
const re = new RegExp(`https?://(?:${hostAlt})/[^"'\\s\\\\>]+`, 'g');
const urls = new Set();
for (const f of walk(PAGES)) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(re)) {
    let u = m[0].replace(/&amp;/g, '&');
    // Retire une ) finale tant qu'elle est non appariée (plus de ) que de ( ).
    while (u.endsWith(')') && (u.match(/\)/g) || []).length > (u.match(/\(/g) || []).length) {
      u = u.slice(0, -1);
    }
    urls.add(u);
  }
}

// URL CDN -> chemin local (on garde la structure /<id>/<fichier>)
function localPath(u) {
  const { pathname } = new URL(u);
  return join(DEST, decodeURIComponent(pathname).replace(/^\//, ''));
}

// Nettoyage : retire ponctuation parasite de fin et URLs non parsables.
const list = [...urls]
  .map((u) => u.replace(/[),.;]+$/, ''))
  .filter((u) => {
    try {
      new URL(u);
      return true;
    } catch {
      return false;
    }
  })
  .sort();
console.log(list.length, 'assets uniques à traiter');

const map = existsSync(ASSETS_MAP_FILE)
  ? JSON.parse(readFileSync(ASSETS_MAP_FILE, 'utf8'))
  : {};
// Purge les entrées ERROR (souvent URLs tronquées d'un ancien run) : elles seront
// soit re-téléchargées correctement, soit absentes de la nouvelle extraction.
for (const [k, v] of Object.entries(map)) if (String(v).startsWith('ERROR')) delete map[k];
let done = 0;
let downloaded = 0;
mkdirSync(dirname(ASSETS_MAP_FILE), { recursive: true });
for (const u of list) {
  let dest;
  try {
    dest = localPath(u);
  } catch {
    map[u] = 'ERROR bad-url';
    continue;
  }
  if (existsSync(dest)) {
    map[u] = dest.replace(/\\/g, '/');
    done++;
    continue;
  }
  try {
    const res = await fetch(u, { headers: { 'user-agent': UA } });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, buf);
      map[u] = dest.replace(/\\/g, '/');
      downloaded++;
    } else {
      map[u] = `ERROR ${res.status}`;
    }
    await sleep(DELAY_MS);
  } catch (e) {
    map[u] = `ERROR ${String(e)}`;
  }
  done++;
  if (done % 100 === 0) {
    writeFileSync(ASSETS_MAP_FILE, JSON.stringify(map, null, 1));
    console.log(`${done}/${list.length} (${downloaded} téléchargés cette session)`);
  }
}
writeFileSync(ASSETS_MAP_FILE, JSON.stringify(map, null, 1));
const errors = Object.entries(map).filter(([, v]) => String(v).startsWith('ERROR'));
console.log(`FINI. ${list.length} assets, ${downloaded} nouveaux. Erreurs: ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 20).map(([k, v]) => `${v} ${k}`).join('\n'));
