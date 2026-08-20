// Briques partagées du harnais de parité Webflow → Astro.
import { createHash } from 'node:crypto';
import { VIEWPORTS as CONFIG_VIEWPORTS } from '../migration/config.mjs';

// Normalisation agressive de texte (casse, accents, ponctuation) — même esprit que live-diff.mjs.
export const nk = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const hash = (...parts) => createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 12);

// Tolérances calibrées sur des pages pilotes. MINOR = à regarder, MAJOR = gate.
export const TOL = {
  fontSize: { minor: 1, major: 2 }, // px
  lineHeight: { minor: 2, major: 6 },
  fontWeight: { minor: 99, major: 250 }, // delta de graisse
  color: { minor: 12, major: 48 }, // max delta par canal RGB
  radius: { minor: 3, major: 10 },
  imgSize: { minor: 12, major: 48 }, // px sur w/h rendus
  secHeight: { minorPx: 32, minorPct: 0.08, majorPx: 140, majorPct: 0.25 },
  padding: { minor: 16, major: 40 }, // padTop/padBottom mesurés (1er/dernier élément)
  gap: { minor: 20, major: 48 }, // rythme vertical entre éléments appariés
  layoutGap: { minor: 14, major: 40 }, // gap déclaré des conteneurs grid/flex
};

export const parseRgb = (s) => {
  const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(s || '');
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : parseFloat(m[4]) };
  // Chrome émet parfois color(srgb r g b / a) avec composantes 0-1
  const c = /color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/.exec(s || '');
  if (c) return { r: +c[1] * 255, g: +c[2] * 255, b: +c[3] * 255, a: c[4] === undefined ? 1 : parseFloat(c[4]) };
  return null;
};
export const rgbDelta = (a, b) => {
  const pa = parseRgb(a), pb = parseRgb(b);
  if (!pa || !pb) return a === b ? 0 : 999;
  if (pa.a === 0 && pb.a === 0) return 0;
  return Math.max(Math.abs(pa.r - pb.r), Math.abs(pa.g - pb.g), Math.abs(pa.b - pb.b), Math.abs(pa.a - pb.a) * 255);
};

export const jaccard = (a, b) => {
  const A = new Set(nk(a).split(' ').filter(Boolean));
  const B = new Set(nk(b).split(' ').filter(Boolean));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
};

export const VIEWPORTS = CONFIG_VIEWPORTS;
export const DUMPS = 'parity/dumps';
export const tagOf = (page) => (page === '/' ? 'home' : page.replace(/^\//, '').replace(/\//g, '__'));
