// Compare deux screenshots full-page (source Webflow vs migration) et émet des
// métriques pour repérer VITE les gros décalages — sans œil humain.
//
// Capturer les 2 en PNG, MÊME largeur (1440), full-page. Puis :
//   node scripts/migration/screenshot-diff.mjs <source.png> <ours.png> [diff-out.png]
//   node scripts/migration/screenshot-diff.mjs --manifest pairs.json   (lot + tableau classé)
//
// Métriques :
//   - heightRatio : hauteur(ours)/hauteur(source). ≠1 = contenu manquant/en trop (structurel).
//   - pixelDiffPct : % de pixels différents sur la région commune (haut, même largeur).
//   - divergenceBand : bande verticale (% de la page) où les diffs se concentrent → OÙ ça cloche.
//   - colorDist : distance L1 des histogrammes couleur (0-1) → palette/teintes différentes.
//   - verdict : OK / À VÉRIFIER / GROS ÉCART (seuils combinés).
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { readFileSync, writeFileSync } from 'node:fs';

function load(p) {
  return PNG.sync.read(readFileSync(p));
}

// Histogramme couleur grossier (2 bits/canal = 64 buckets), normalisé.
function histogram(img) {
  const h = new Float64Array(64);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] >> 6, g = d[i + 1] >> 6, b = d[i + 2] >> 6;
    h[r * 16 + g * 4 + b] += 1;
  }
  const n = (d.length / 4) || 1;
  for (let i = 0; i < 64; i++) h[i] /= n;
  return h;
}
function l1(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / 2; // 0 (identique) → 1 (disjoint)
}

// Recadre img sur WxH (coin haut-gauche).
function crop(img, W, H) {
  const out = new PNG({ width: W, height: H });
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * img.width + x) * 4;
      const o = (y * W + x) * 4;
      out.data[o] = img.data[i];
      out.data[o + 1] = img.data[i + 1];
      out.data[o + 2] = img.data[i + 2];
      out.data[o + 3] = img.data[i + 3];
    }
  return out;
}

function compare(srcPath, ourPath, diffOut) {
  const a = load(srcPath); // source
  const b = load(ourPath); // ours
  const heightRatio = b.height / a.height;

  // Région commune (haut, largeur min) pour pixelmatch + profil par ligne.
  const W = Math.min(a.width, b.width);
  const H = Math.min(a.height, b.height);
  const ca = crop(a, W, H);
  const cb = crop(b, W, H);
  const diff = new PNG({ width: W, height: H });
  const nDiff = pixelmatch(ca.data, cb.data, diff.data, W, H, { threshold: 0.12 });
  const pixelDiffPct = (nDiff / (W * H)) * 100;

  // Profil de diff par ligne → bande de divergence max (en % de la région commune).
  const rows = new Float64Array(H);
  for (let y = 0; y < H; y++) {
    let c = 0;
    for (let x = 0; x < W; x++) if (diff.data[(y * W + x) * 4] > 0 || diff.data[(y * W + x) * 4 + 1] > 0) c++;
    rows[y] = c / W;
  }
  // bande de 10% la plus divergente
  const band = Math.max(1, Math.floor(H / 10));
  let bestStart = 0, bestSum = -1;
  for (let s = 0; s + band <= H; s += band) {
    let sum = 0;
    for (let y = s; y < s + band; y++) sum += rows[y];
    if (sum > bestSum) { bestSum = sum; bestStart = s; }
  }
  const divergenceBand = `${Math.round((bestStart / H) * 100)}–${Math.round(((bestStart + band) / H) * 100)}%`;

  const colorDist = l1(histogram(a), histogram(b));

  // Verdict combiné.
  const flags = [];
  if (heightRatio < 0.7 || heightRatio > 1.45) flags.push('hauteur');
  if (pixelDiffPct > 18) flags.push('pixels');
  if (colorDist > 0.18) flags.push('couleurs');
  const verdict = flags.length >= 2 ? 'GROS ÉCART' : flags.length === 1 ? 'À VÉRIFIER' : 'OK';

  if (diffOut) writeFileSync(diffOut, PNG.sync.write(diff));
  return {
    src: `${a.width}×${a.height}`,
    ours: `${b.width}×${b.height}`,
    heightRatio: +heightRatio.toFixed(2),
    pixelDiffPct: +pixelDiffPct.toFixed(1),
    divergenceBand,
    colorDist: +colorDist.toFixed(3),
    verdict,
    flags,
  };
}

const args = process.argv.slice(2);
if (args[0] === '--manifest') {
  // pairs.json = [{ page, src, ours }]
  const pairs = JSON.parse(readFileSync(args[1], 'utf8'));
  const rows = pairs.map((p) => {
    try {
      return { page: p.page, ...compare(p.src, p.ours) };
    } catch (e) {
      return { page: p.page, verdict: 'ERREUR', err: String(e.message || e) };
    }
  });
  rows.sort((x, y) => (y.pixelDiffPct || 0) + (Math.abs((y.heightRatio || 1) - 1) * 50) - ((x.pixelDiffPct || 0) + Math.abs((x.heightRatio || 1) - 1) * 50));
  console.log('page'.padEnd(34), 'verdict'.padEnd(12), 'hRatio', 'diff%', 'band', 'colorDist');
  for (const r of rows) {
    console.log(
      String(r.page).padEnd(34),
      String(r.verdict).padEnd(12),
      String(r.heightRatio ?? '-').padEnd(6),
      String(r.pixelDiffPct ?? '-').padEnd(5),
      String(r.divergenceBand ?? '-').padEnd(8),
      String(r.colorDist ?? '-'),
      r.flags?.length ? `[${r.flags.join(',')}]` : '',
    );
  }
} else {
  const [src, ours, diffOut] = args;
  if (!src || !ours) {
    console.error('Usage: screenshot-diff.mjs <source.png> <ours.png> [diff-out.png]  |  --manifest pairs.json');
    process.exit(1);
  }
  console.log(JSON.stringify(compare(src, ours, diffOut), null, 2));
}
