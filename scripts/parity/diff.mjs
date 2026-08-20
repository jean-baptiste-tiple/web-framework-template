// DIFF — 100 % offline sur les dumps JSON de capture.mjs. Apparie les éléments des
// deux DOM par texte normalisé (LCS monotone + fuzzy), en déduit les paires de
// sections, compare styles calculés + géométrie, et sort un rapport actionnable :
//   « page · Composant (sec-x ↔ classe-wf) [vp] : prop a vs b Δ SÉVÉRITÉ #hash »
// Gate : exit 1 si MAJOR non listé dans scripts/parity/accepted.json.
//
//   node scripts/parity/diff.mjs [--only substr] [--vp 1440] [--full] [--no-fail]
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { nk, hash, TOL, rgbDelta, jaccard, DUMPS } from './lib.mjs';
import { SINGLE_WEIGHT_FONTS } from '../migration/config.mjs';

const argv = process.argv;
const arg = (k) => { const i = argv.indexOf(k); return i > -1 ? argv[i + 1] : null; };
const ONLY = arg('--only');
const VP = arg('--vp');
const FULL = argv.includes('--full');
const NO_FAIL = argv.includes('--no-fail');

const accepted = existsSync('scripts/parity/accepted.json')
  ? new Map(JSON.parse(readFileSync('scripts/parity/accepted.json', 'utf8')).map((a) => [a.hash, a.reason]))
  : new Map();

// Règles d'acceptation SYSTÉMIQUES (décisions de canon : composants unifiés).
// Chaque règle : { prop, sec?, el?, a?, b?, reason } — sec/el = regex, a/b = valeur exacte.
const rules = existsSync('scripts/parity/accepted-rules.json')
  ? JSON.parse(readFileSync('scripts/parity/accepted-rules.json', 'utf8'))
  : [];
const ruleFor = (f) =>
  rules.find((r) =>
    (!r.prop || r.prop === f.prop) &&
    (!r.sec || new RegExp(r.sec).test(f.sec)) &&
    (!r.el || new RegExp(r.el).test(f.el)) &&
    (r.a === undefined || String(r.a) === String(f.a)) &&
    (r.b === undefined || String(r.b) === String(f.b)) &&
    (!r.page || new RegExp(r.page).test(f.page)) &&
    (!r.vp || r.vp.includes(f.vp)), // r.vp = liste de viewports [768, 360]
  );

// --- appariement -----------------------------------------------------------
const keyOf = (e) => (e.type === 'img' ? 'img:' + (e.src || '').replace(/-p-\d+(\.\w+)?/, '$1') : 't:' + nk(e.text));

function lcsMatch(A, B) {
  // LCS classique sur l'égalité des clés → appariement monotone gérant les répétitions
  const n = A.length, m = B.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = A[i].k === B[j].k ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const pairs = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i].k === B[j].k) { pairs.push([A[i], B[j], 'exact']); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return pairs;
}

function fuzzyMatch(pairs, A, B) {
  // pour les restants : meilleur Jaccard ≥ 0.75 dans la fenêtre monotone entre voisins appariés
  const mA = new Set(pairs.map((p) => p[0].i)), mB = new Set(pairs.map((p) => p[1].i));
  const restA = A.filter((e) => !mA.has(e.i) && e.type !== 'img' && e.text);
  const restB = B.filter((e) => !mB.has(e.i) && e.type !== 'img' && e.text);
  const used = new Set();
  for (const a of restA) {
    let best = null, bestScore = 0.75;
    for (const b of restB) {
      if (used.has(b.i)) continue;
      const s = jaccard(a.text, b.text);
      if (s > bestScore) { bestScore = s; best = b; }
    }
    if (best) { pairs.push([a, best, 'fuzzy']); used.add(best.i); }
  }
  return pairs;
}

// --- comparaison d'une paire de dumps ---------------------------------------
function compare(wf, as, page, vp) {
  const F = [];
  const seenH = new Set();
  const add = (sev, sec, el, prop, a, b, note = '') => {
    const h = hash(page, vp, sec, prop, String(a), String(b), el.slice(0, 40));
    if (seenH.has(h)) return; // éléments répétés identiques (cartes) → un seul finding
    seenH.add(h);
    const f = { sev, page, vp, sec, el: el.slice(0, 60), prop, a, b, note, hash: h, accepted: accepted.get(h) };
    if (!f.accepted) { const r = ruleFor(f); if (r) f.accepted = 'règle : ' + r.reason; }
    F.push(f);
  };
  const isHome = page === '/';
  const keep = (d) => (e) => { const s = d.sections[e.sec]; return s && (!s.chrome || isHome); };
  const A = wf.els.filter(keep(wf)).map((e, i) => ({ ...e, i, k: keyOf(e) })).filter((e) => e.k !== 't:');
  const B = as.els.filter(keep(as)).map((e, i) => ({ ...e, i, k: keyOf(e) })).filter((e) => e.k !== 't:');
  const pairs = fuzzyMatch(lcsMatch(A, B), A, B);

  // paires de sections par vote majoritaire des éléments appariés
  const votes = new Map();
  for (const [a, b] of pairs) {
    const k = a.sec + '>' + b.sec;
    votes.set(k, (votes.get(k) || 0) + 1);
  }
  const secPair = new Map(); // wfSec → astroSec
  for (const [k, v] of [...votes.entries()].sort((x, y) => y[1] - x[1])) {
    const [ws, os] = k.split('>').map(Number);
    if (!secPair.has(ws)) secPair.set(ws, { os, v });
  }
  const secLabel = (ws) => {
    const w = wf.sections[ws], o = secPair.has(ws) ? as.sections[secPair.get(ws).os] : null;
    const short = (c) => (c || '').split(' ').slice(0, 2).join('.') || '?';
    return `${o ? short(o.cls) : '∅'}↔${short(w ? w.cls : '')}`;
  };

  // 1. styles élément à élément
  for (const [a, b, how] of pairs) {
    const sec = secLabel(a.sec);
    const label = (a.type === 'img' ? 'img:' + (a.src || '') : `«${(a.text || '').slice(0, 45)}»`) + '·' + a.type;
    if (a.type === 'img' || b.type === 'img') {
      if (a.type === 'img' && b.type === 'img') {
        const dw = Math.abs(a.rect[2] - b.rect[2]), dh = Math.abs(a.rect[3] - b.rect[3]);
        if (Math.max(dw, dh) > TOL.imgSize.major) add('MAJOR', sec, label, 'img-dims', a.rect[2] + '×' + a.rect[3], b.rect[2] + '×' + b.rect[3]);
        else if (Math.max(dw, dh) > TOL.imgSize.minor) add('MINOR', sec, label, 'img-dims', a.rect[2] + '×' + a.rect[3], b.rect[2] + '×' + b.rect[3]);
      }
      continue;
    }
    const dFs = Math.abs(a.fs - b.fs);
    // Gros titres (≥36px) : tolérance relative — un écart ≤3px (clamp/vw arrondi) est
    // imperceptible (<8%). Évite de flaguer 40 vs 43 sur les héros.
    const fsMajorTol = Math.min(a.fs, b.fs) >= 36 ? 3 : TOL.fontSize.major;
    if (dFs > fsMajorTol) add('MAJOR', sec, label, 'font-size', a.fs, b.fs);
    else if (dFs > TOL.fontSize.minor) add('MINOR', sec, label, 'font-size', a.fs, b.fs);
    const dLh = Math.abs(a.lh - b.lh);
    if (dLh > TOL.lineHeight.major) add('MAJOR', sec, label, 'line-height', a.lh, b.lh);
    else if (dLh > TOL.lineHeight.minor) add('MINOR', sec, label, 'line-height', a.lh, b.lh);
    // Polices mono-graisse chez nous (faux-gras Webflow côté source) → graisse ignorée
    // (SINGLE_WEIGHT_FONTS, config).
    const singleWeight = SINGLE_WEIGHT_FONTS.some((fnt) => (a.ff || '').includes(fnt) || (b.ff || '').includes(fnt));
    const dFw = Math.abs(a.fw - b.fw);
    if (!singleWeight) {
      if (dFw > TOL.fontWeight.major) add('MAJOR', sec, label, 'font-weight', a.fw, b.fw);
      else if (dFw > TOL.fontWeight.minor) add('MINOR', sec, label, 'font-weight', a.fw, b.fw);
    }
    if (a.ff && b.ff && a.ff !== b.ff) add('MAJOR', sec, label, 'font-family', a.ff, b.ff);
    const dCol = rgbDelta(a.col, b.col);
    if (dCol > TOL.color.major) add('MAJOR', sec, label, 'color', a.col, b.col);
    else if (dCol > TOL.color.minor) add('MINOR', sec, label, 'color', a.col, b.col);
    if (a.al !== b.al && (a.rows > 1 || b.rows > 1)) add('MINOR', sec, label, 'text-align', a.al, b.al);
    if ((a.tt || '') !== (b.tt || '')) add('MINOR', sec, label, 'text-transform', a.tt || 'none', b.tt || 'none');
    if (a.type === 'btn' && b.type === 'btn') {
      const ra = parseInt(a.rad) || 0, rb = parseInt(b.rad) || 0;
      const dR = Math.abs(ra - rb);
      if (dR > TOL.radius.major && Math.min(ra, rb) < 50) add('MINOR', sec, label, 'radius', a.rad || '0', b.rad || '0'); // 50+ = pill des 2 côtés
      const dBg = rgbDelta(a.bg || 'rgba(0, 0, 0, 0)', b.bg || 'rgba(0, 0, 0, 0)');
      if (dBg > TOL.color.major) add('MAJOR', sec, label, 'btn-bg', a.bg || '∅', b.bg || '∅');
    }
    if (FULL && a.rows !== b.rows && how === 'exact') add('INFO', sec, label, 'wrap', a.rows + ' lignes', b.rows + ' lignes');
  }

  // 2. headings h1-h3 non appariés = contenu/section manquant → MAJOR
  const mA = new Set(pairs.map((p) => p[0].i)), mB = new Set(pairs.map((p) => p[1].i));
  for (const e of A) if (!mA.has(e.i) && /^h[1-3]$/.test(e.type)) add('MAJOR', secLabel(e.sec), `«${e.text.slice(0, 45)}»`, 'manquant-chez-nous', e.type, '∅');
  for (const e of B) if (!mB.has(e.i) && /^h[1-3]$/.test(e.type)) add('MINOR', '?', `«${(e.text || '').slice(0, 45)}»`, 'en-trop-chez-nous', '∅', e.type);

  // 3. géométrie par paire de sections — UNIQUEMENT bijectives (1:1 des deux côtés) :
  // Webflow groupe parfois en 1 section ce que nous découpons en 2+ (ou l'inverse) →
  // hauteur/paddings n'y sont pas comparables. Sections à widget JS exclues aussi.
  const claimed = new Map(); // astroSec → nb de wfSec qui le revendiquent
  for (const { os } of secPair.values()) claimed.set(os, (claimed.get(os) || 0) + 1);
  // nb d'éléments « propres » (texte/img appariables) par section, chaque côté
  const ownWf = new Map(), ownAs = new Map();
  A.forEach((e) => ownWf.set(e.sec, (ownWf.get(e.sec) || 0) + 1));
  B.forEach((e) => ownAs.set(e.sec, (ownAs.get(e.sec) || 0) + 1));
  const bySec = new Map();
  for (const [a, b] of pairs) {
    if (!bySec.has(a.sec)) bySec.set(a.sec, []);
    if (secPair.get(a.sec)?.os === b.sec) bySec.get(a.sec).push([a, b]);
  }
  for (const [ws, list] of bySec) {
    if (list.length < 2) continue;
    const os = secPair.get(ws).os;
    const sw = wf.sections[ws], so = as.sections[os];
    if (!sw || !so) continue;
    if (claimed.get(os) > 1 || sw.widget || so.widget) continue; // non bijectif ou widget → styles seulement
    // Garde de COUVERTURE : la géométrie (hauteur/pad) n'est comparable que si les
    // éléments appariés couvrent l'essentiel des DEUX sections. Si le source groupe N
    // rangées dans une méga-section et que nous découpons une-section-par-rangée, la
    // paire ne couvre qu'une fraction → on saute la géométrie (les styles
    // élément-à-élément, eux, restent comparés plus haut).
    const cov = list.length / Math.max(ownWf.get(ws) || 1, ownAs.get(os) || 1);
    if (cov < 0.6) continue;
    const sec = secLabel(ws);
    // hauteur de section
    const dh = Math.abs(sw.rect[3] - so.rect[3]);
    const pct = dh / Math.max(sw.rect[3], 1);
    const heightDiffers = dh > TOL.secHeight.minorPx && pct > TOL.secHeight.minorPct;
    if (dh > TOL.secHeight.majorPx && pct > TOL.secHeight.majorPct) add('MAJOR', sec, '(section)', 'hauteur', sw.rect[3], so.rect[3]);
    else if (heightDiffers) add('MINOR', sec, '(section)', 'hauteur', sw.rect[3], so.rect[3]);
    // padding vertical mesuré = distance bord de section → 1er/dernier élément apparié.
    // Fiable UNIQUEMENT si la hauteur corrobore : à hauteur égale, un écart de pad-top
    // est soit compensé ailleurs (distribution interne, pas le padding de section), soit
    // un artefact de mesure (héros à contenu centré/image, éléments non appariés en tête).
    // → MAJOR seulement si la hauteur diffère aussi ; sinon MINOR informatif.
    const padTop = (els, s, pick) => Math[pick === 'top' ? 'min' : 'max'](...els.map((e) => (pick === 'top' ? e.rect[1] : e.rect[1] + e.rect[3])));
    const ptW = padTop(list.map((p) => p[0]), sw, 'top') - sw.rect[1];
    const ptO = padTop(list.map((p) => p[1]), so, 'top') - so.rect[1];
    const dpt = Math.abs(ptW - ptO);
    if (dpt > TOL.padding.major && heightDiffers) add('MAJOR', sec, '(section)', 'pad-top', ptW, ptO);
    else if (dpt > TOL.padding.minor) add('MINOR', sec, '(section)', 'pad-top', ptW, ptO);
    const pbW = sw.rect[1] + sw.rect[3] - padTop(list.map((p) => p[0]), sw, 'bot');
    const pbO = so.rect[1] + so.rect[3] - padTop(list.map((p) => p[1]), so, 'bot');
    const dpb = Math.abs(pbW - pbO);
    if (dpb > TOL.padding.major && heightDiffers) add('MAJOR', sec, '(section)', 'pad-bottom', pbW, pbO);
    else if (dpb > TOL.padding.minor) add('MINOR', sec, '(section)', 'pad-bottom', pbW, pbO);
    // fond de section
    const dBg = rgbDelta(sw.bg === 'image' ? '' : sw.bg, so.bg === 'image' ? '' : so.bg);
    if (sw.bg !== 'image' && so.bg !== 'image' && dBg > TOL.color.major) add('MAJOR', sec, '(section)', 'background', sw.bg, so.bg);
    // rythme vertical entre éléments consécutifs (hors wrap différent)
    const sorted = list.slice().sort((x, y) => x[0].rect[1] - y[0].rect[1]);
    for (let i = 1; i < sorted.length; i++) {
      const [a1, b1] = sorted[i - 1], [a2, b2] = sorted[i];
      if (a1.rows !== b1.rows || a2.rows !== b2.rows) continue;
      const gA = a2.rect[1] - (a1.rect[1] + a1.rect[3]);
      const gB = b2.rect[1] - (b1.rect[1] + b1.rect[3]);
      if (gA < -5 || gB < -5) continue; // chevauchement/colonnes → pas un gap vertical
      const dg = Math.abs(gA - gB);
      if (dg > TOL.gap.major) add('MAJOR', sec, `«${(a2.text || a2.src || '').slice(0, 35)}»`, 'gap-avant', gA, gB);
      else if (dg > TOL.gap.minor && FULL) add('MINOR', sec, `«${(a2.text || a2.src || '').slice(0, 35)}»`, 'gap-avant', gA, gB);
    }
    // colonnage : conteneurs layout de la section (multi-colonnes seulement)
    const colsOf = (d, si) => (d.layouts || []).filter((l) => l.sec === si && l.cols > 1).map((l) => l.cols).sort();
    const cW = colsOf(wf, ws), cO = colsOf(as, os);
    if (cW.length && cO.length && cW.join() !== cO.join() && !cW.every((c) => cO.includes(c)))
      add('MINOR', sec, '(layout)', 'colonnes', cW.join('/'), cO.join('/'));
  }

  // 4. sections wf de contenu sans aucun élément apparié (masque « No items found » exclu)
  wf.sections.forEach((s, i) => {
    if (s.chrome || secPair.has(i) || s.rect[3] < 60) return;
    const own = A.filter((e) => e.sec === i);
    if (!own.length) return; // vide (w-dyn-empty) → rien à comparer
    add('MAJOR', secLabel(i), `(${own.length} éléments)`, 'section-non-appariée', s.cls.split(' ')[0], '∅');
  });

  return { findings: F, matched: pairs.length, wfEls: A.length, astroEls: B.length };
}

// --- boucle sur les dumps ----------------------------------------------------
const files = existsSync(DUMPS) ? readdirSync(DUMPS) : [];
const pairsSeen = new Map();
for (const f of files) {
  const m = /^(.+)__(wf|astro)__(\d+)\.json$/.exec(f);
  if (!m) continue;
  const [, tag, side, vp] = m;
  if (ONLY && !tag.includes(ONLY)) continue;
  if (VP && vp !== VP) continue;
  const k = tag + '@' + vp;
  if (!pairsSeen.has(k)) pairsSeen.set(k, {});
  pairsSeen.get(k)[side] = f;
}

const all = [];
const pageStats = [];
for (const [k, sides] of [...pairsSeen.entries()].sort()) {
  if (!sides.wf || !sides.astro) continue;
  const wf = JSON.parse(readFileSync(join(DUMPS, sides.wf), 'utf8'));
  const as = JSON.parse(readFileSync(join(DUMPS, sides.astro), 'utf8'));
  const [tag, vp] = k.split('@');
  const page = wf.meta?.page || '/' + tag.replace(/__/g, '/');
  const r = compare(wf, as, page, +vp);
  all.push(...r.findings);
  pageStats.push({ page, vp: +vp, ...r, findings: undefined,
    major: r.findings.filter((f) => f.sev === 'MAJOR' && !f.accepted).length,
    minor: r.findings.filter((f) => f.sev === 'MINOR').length });
}

// --- rapport -----------------------------------------------------------------
mkdirSync('parity', { recursive: true });
const majors = all.filter((f) => f.sev === 'MAJOR' && !f.accepted);
const minors = all.filter((f) => f.sev === 'MINOR');
const lines = [];
lines.push(`# Rapport de parité Webflow → Astro`, '');
lines.push(`${pairsSeen.size} comparaisons · **${majors.length} MAJOR** · ${minors.length} MINOR · ${all.filter((f) => f.accepted).length} acceptés`, '');
const byPage = new Map();
for (const f of all.filter((x) => x.sev !== 'INFO' || FULL)) {
  const k = f.page;
  if (!byPage.has(k)) byPage.set(k, []);
  byPage.get(k).push(f);
}
for (const [page, fs] of [...byPage.entries()].sort((a, b) => b[1].filter((f) => f.sev === 'MAJOR' && !f.accepted).length - a[1].filter((f) => f.sev === 'MAJOR' && !f.accepted).length)) {
  const nMaj = fs.filter((f) => f.sev === 'MAJOR' && !f.accepted).length;
  lines.push(`## ${page} — ${nMaj} MAJOR / ${fs.length} findings`, '');
  for (const f of fs.sort((a, b) => (a.sev === 'MAJOR' ? 0 : 1) - (b.sev === 'MAJOR' ? 0 : 1))) {
    lines.push(`- ${f.accepted ? '~~' : ''}[${f.sev}] vp${f.vp} · ${f.sec} · ${f.el} · **${f.prop}** ${f.a} vs ${f.b}${f.note ? ' (' + f.note + ')' : ''} \`#${f.hash}\`${f.accepted ? `~~ _accepté : ${f.accepted}_` : ''}`);
  }
  lines.push('');
}
writeFileSync('parity/report.md', lines.join('\n'));
writeFileSync('parity/report.json', JSON.stringify({ findings: all, stats: pageStats }, null, 1));

console.log(`\n=== parité : ${pairsSeen.size} comparaisons ===`);
for (const s of pageStats.sort((a, b) => b.major - a.major).slice(0, 40))
  console.log(`  ${String(s.major).padStart(3)} MAJOR ${String(s.minor).padStart(4)} MINOR  ${s.page}@${s.vp}  (${s.matched}/${s.wfEls} appariés wf, ${s.astroEls} astro)`);
console.log(`\nTOTAL : ${majors.length} MAJOR non acceptés, ${minors.length} MINOR → parity/report.md`);
if (majors.length && !NO_FAIL) process.exit(1);
