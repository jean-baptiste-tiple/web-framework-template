// Crawl poli du site source (migration Webflow → Astro).
// Zéro dépendance. Resumable : les pages déjà téléchargées sont sautées.
// Pré-requis : SNAPSHOT_DIR/sitemap.xml téléchargé à la main (seed du crawl).
// Usage : node scripts/migration/crawl.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { SOURCE_ORIGIN, SOURCE_HOSTS, SNAPSHOT_DIR, USER_AGENT } from './config.mjs';

const ORIGIN = SOURCE_ORIGIN;
const CANONICAL_HOST = new URL(SOURCE_ORIGIN).hostname;
const SNAP = SNAPSHOT_DIR;
const PAGES = join(SNAP, 'pages');
const UA = USER_AGENT;
const DELAY_MS = 1000; // ≤ 1 req/s

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// URL -> chemin de fichier local (/, /a/b -> pages/index.html, pages/a/b/index.html)
function fileFor(url) {
  const path = new URL(url).pathname.replace(/\/$/, '') || '/';
  return path === '/' ? join(PAGES, 'index.html') : join(PAGES, path.slice(1), 'index.html');
}

// Normalise une URL interne (strip query/hash, slash final, host canonique)
function normalize(href, base) {
  try {
    const u = new URL(href, base);
    if (!SOURCE_HOSTS.includes(u.hostname)) return null;
    u.hostname = CANONICAL_HOST;
    u.search = '';
    u.hash = '';
    let p = u.pathname.replace(/\/$/, '') || '/';
    // Fichiers binaires/feed : pas des pages
    if (/\.(pdf|jpg|jpeg|png|gif|svg|webp|ico|css|js|xml|txt|zip|mp4|webm)$/i.test(p)) return null;
    return ORIGIN + (p === '/' ? '/' : p);
  } catch {
    return null;
  }
}

const seeds = [...readFileSync(join(SNAP, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => normalize(m[1].trim(), ORIGIN))
  .filter(Boolean);

const queue = [...new Set([ORIGIN + '/', ...seeds])];
const seen = new Set(queue);
const log = existsSync(join(SNAP, 'crawl-log.json'))
  ? JSON.parse(readFileSync(join(SNAP, 'crawl-log.json'), 'utf8'))
  : {};

let fetched = 0;
while (queue.length > 0) {
  const url = queue.shift();
  const file = fileFor(url);
  let html = null;

  if (existsSync(file) && log[url]?.status === 200) {
    html = readFileSync(file, 'utf8'); // déjà crawlé : on ré-extrait juste les liens
  } else {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
      const finalUrl = res.url;
      const body = await res.text();
      log[url] = { status: res.status, finalUrl, bytes: body.length };
      if (res.status === 200 && (res.headers.get('content-type') || '').includes('text/html')) {
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, body);
        html = body;
      }
      fetched++;
      if (fetched % 20 === 0) {
        writeFileSync(join(SNAP, 'crawl-log.json'), JSON.stringify(log, null, 1));
        console.log(`${fetched} fetch, file=${queue.length} restants`);
      }
      await sleep(DELAY_MS);
    } catch (e) {
      log[url] = { status: 'ERROR', error: String(e) };
      await sleep(DELAY_MS);
    }
  }

  // Découverte : liens internes hors sitemap
  if (html) {
    for (const m of html.matchAll(/href="([^"#]+)"/g)) {
      const n = normalize(m[1], url);
      if (n && !seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
}

writeFileSync(join(SNAP, 'crawl-log.json'), JSON.stringify(log, null, 1));
const statuses = {};
for (const v of Object.values(log)) statuses[v.status] = (statuses[v.status] || 0) + 1;
console.log('FINI.', Object.keys(log).length, 'URLs.', JSON.stringify(statuses));
