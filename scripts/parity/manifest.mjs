// Génère scripts/parity/manifest.json : la table de correspondance baseline ↔ dist.
//   - pages uniques : export Webflow (EXPORT_DIR/<slug>.html) ↔ dist/<slug>/
//   - fiches CMS (absentes de l'export, templates detail_* vides) : snapshot live échantillonné
//   - stubs de redirection dist (meta-refresh) suivis jusqu'à la cible
//   node scripts/parity/manifest.mjs
import { readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  EXPORT_DIR,
  SNAPSHOT_DIR,
  DIST_DIR,
  EXPORT_SKIP_SLUGS,
  EXPORT_SUBDIRS,
  ALT_ROUTE_PREFIXES,
  COLLECTION_SAMPLE,
} from '../migration/config.mjs';

const WF = EXPORT_DIR;
const SNAP = join(SNAPSHOT_DIR, 'pages');
const DIST = DIST_DIR;

// Hors périmètre fidélité (applicatif/technique/archives) — même liste que content-completeness.
const SKIP = EXPORT_SKIP_SLUGS;

const redirectTarget = (file) => {
  const html = readFileSync(file, 'utf8');
  const m = /http-equiv=.?refresh.?[^>]*url=([^">]+)/i.exec(html);
  return m ? m[1].replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '') || '/' : null;
};

// slug webflow → route dist réelle (teste /slug et les ALT_ROUTE_PREFIXES, suit les redirects).
const resolveDist = (slug, depth = 0) => {
  if (depth > 3) return null;
  for (const route of [slug, ...ALT_ROUTE_PREFIXES.map((pre) => pre + '/' + slug)]) {
    const f = route === '' ? join(DIST, 'index.html') : join(DIST, route, 'index.html');
    if (!existsSync(f)) continue;
    const t = redirectTarget(f);
    if (t) return resolveDist(t.replace(/^\//, ''), depth + 1);
    return route === '' ? '/' : '/' + route;
  }
  return null;
};

const entries = [];
const unmapped = [];

// --- pages uniques : export Webflow ---
const scanWf = (dir, prefix) => {
  if (!existsSync(join(WF, dir))) return;
  for (const f of readdirSync(join(WF, dir))) {
    if (!f.endsWith('.html')) continue;
    const slug = f.slice(0, -5);
    if (slug.startsWith('detail_') || SKIP.has(slug)) continue;
    const wfFile = join(WF, dir, f);
    const route = slug === 'index' && !prefix ? '' : prefix + slug;
    const page = resolveDist(route);
    if (page) entries.push({ page, kind: 'export', src: wfFile.replace(/\\/g, '/') });
    else unmapped.push(prefix + slug);
  }
};
scanWf('', '');
for (const { dir, routePrefix } of EXPORT_SUBDIRS) scanWf(dir, routePrefix);

// --- fiches CMS : snapshot live, échantillonné par collection (les templates partagent leur rendu) ---
const SAMPLE = COLLECTION_SAMPLE;
for (const [bucket, n] of Object.entries(SAMPLE)) {
  const dir = join(SNAP, bucket);
  if (!existsSync(dir)) continue;
  let taken = 0;
  for (const slug of readdirSync(dir).sort()) {
    if (taken >= n) break;
    const snapFile = join(dir, slug, 'index.html');
    if (!existsSync(snapFile)) continue;
    const page = resolveDist(bucket + '/' + slug);
    if (!page || page === '/' + bucket) continue; // supprimé/redirigé vers l'index → pas comparable
    entries.push({ page, kind: 'snap', src: snapFile.replace(/\\/g, '/') });
    taken++;
  }
}

// dédup (deux slugs webflow peuvent rediriger vers la même route dist) : premier gagnant
const seen = new Set();
const final = entries.filter((e) => (seen.has(e.page) ? false : (seen.add(e.page), true)));

writeFileSync('scripts/parity/manifest.json', JSON.stringify({ generated: 'scripts/parity/manifest.mjs', entries: final, unmapped }, null, 1));
console.log(`manifest: ${final.length} paires (${final.filter((e) => e.kind === 'export').length} export, ${final.filter((e) => e.kind === 'snap').length} snapshot), ${unmapped.length} sans cible dist: ${unmapped.join(', ')}`);
