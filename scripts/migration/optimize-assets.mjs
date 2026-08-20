// Optimise les images raster de ASSETS_DIR (in-place) : cap 1600px de large,
// recompression. Visuellement identique à l'affichage (le source servait des
// dérivés responsive plus petits que les originaux téléchargés).
// svg/gif/avif/pdf laissés intacts. Usage : node scripts/migration/optimize-assets.mjs
import { readdirSync, statSync, renameSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { ASSETS_DIR } from './config.mjs';

const ROOT = ASSETS_DIR;
const MAX_W = 1600;
const MIN_BYTES = 200 * 1024; // on ne touche pas aux petites images déjà légères

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else yield { path: p, size: st.size };
  }
}

let before = 0;
let after = 0;
let processed = 0;
let skipped = 0;

for (const { path, size } of walk(ROOT)) {
  before += size;
  const ext = (path.split('.').pop() || '').toLowerCase();
  if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
    after += size;
    skipped++;
    continue;
  }
  try {
    const img = sharp(path, { failOn: 'none' });
    const meta = await img.metadata();
    const needsResize = (meta.width ?? 0) > MAX_W;
    if (!needsResize && size < MIN_BYTES) {
      after += size;
      skipped++;
      continue;
    }
    let pipe = img.rotate(); // respecte l'EXIF orientation
    if (needsResize) pipe = pipe.resize({ width: MAX_W, withoutEnlargement: true });
    if (ext === 'png') pipe = pipe.png({ compressionLevel: 9, palette: true, quality: 85 });
    else if (ext === 'webp') pipe = pipe.webp({ quality: 80 });
    else pipe = pipe.jpeg({ quality: 80, mozjpeg: true });
    const tmp = path + '.opt';
    await pipe.toFile(tmp);
    const newSize = statSync(tmp).size;
    // On ne garde l'optimisation que si elle réduit réellement le poids.
    if (newSize < size) {
      renameSync(tmp, path);
      after += newSize;
      processed++;
    } else {
      unlinkSync(tmp);
      after += size;
      skipped++;
    }
  } catch {
    after += size;
    skipped++;
  }
}

const mb = (b) => (b / 1048576).toFixed(0);
console.log(`Optimisé ${processed} images, ${skipped} intactes.`);
console.log(`Poids : ${mb(before)} MB → ${mb(after)} MB`);
