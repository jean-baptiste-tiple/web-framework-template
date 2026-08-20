// CAPTURE PROFONDE des landing pages hébergées à part (LP_LIVE_ORIGIN, ex. HubSpot)
// vs notre site déployé (DEPLOYED_ORIGIN).
// Pour chaque page × côté : screenshot pleine page + screenshot PAR BANDE visuelle +
// dump JSON par bande (heading, texte, bg, couleurs, fontes, images, boutons).
// Sert de base à la revue VISUELLE (humain ou agent vision — cf. vision.workflow.js) —
// là où un diff structurel grossier rate les écarts de rendu.
//
// Usage : node scripts/parity/deep-capture.mjs [--only slug] [--slugs a,b] [--ours https://...]
// Sortie : parity/lp/deep/<slug>/{live,ours}__full.png, {live,ours}__band-NN.png, deep.json
import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync } from 'node:fs';
import { CHROME_PATH, LP_LIVE_ORIGIN, DEPLOYED_ORIGIN, LP_SLUGS } from '../migration/config.mjs';

const CHROME = CHROME_PATH;
const LIVE = LP_LIVE_ORIGIN;
const argv = process.argv;
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;
const slugsArg = argv.includes('--slugs') ? argv[argv.indexOf('--slugs') + 1].split(',') : null;
const OURS = argv.includes('--ours') ? argv[argv.indexOf('--ours') + 1] : DEPLOYED_ORIGIN;

const SLUGS = only ? [only] : slugsArg ? slugsArg : LP_SLUGS;
if (!SLUGS.length) {
  console.error('Aucun slug : renseigner LP_SLUGS (config.mjs) ou passer --only/--slugs.');
  process.exit(1);
}

// Neutralise animations, bannières cookies, chat, et le sticky (sinon il pollue les shots de bande).
const FREEZE = `() => {
  const st = document.createElement('style');
  st.textContent = '*{animation:none!important;transition:none!important;scroll-behavior:auto!important}';
  document.head.appendChild(st);
  ['axeptio','cookie','consent','hubspot-messages','usercentrics','hs-eu-cookie','leadinfo','intercom']
    .forEach((k) => document.querySelectorAll('[id*=' + k + ' i],[class*=' + k + ' i]').forEach((e) => e.remove()));
  for (const el of document.querySelectorAll('body *')) {
    const p = getComputedStyle(el).position;
    // Ne dé-positionner que les éléments VISIBLES : un élément parqué hors écran
    // (skip-link a11y à top:-60) remis en flux pousserait tout le reste (~138px
    // de faux vide au-dessus du header dans les captures).
    const r = el.getBoundingClientRect();
    const offscreen = r.bottom <= 0 || r.right <= 0 || r.width === 0 || r.height === 0;
    if ((p === 'sticky' || p === 'fixed') && !offscreen) el.style.setProperty('position', 'static', 'important');
    else if ((p === 'sticky' || p === 'fixed') && offscreen) el.style.setProperty('display', 'none', 'important');
  }
}`;

// Segmentation en BANDES visuelles : DFS depuis body, on descend tant qu'un conteneur
// n'est qu'un empilement de rangées pleine largeur. Marche pour DOM HubSpot et Astro.
const BANDS_FN = `() => {
  const vw = window.innerWidth;
  const px = (v) => Math.round(parseFloat(v) || 0);
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 3 || r.height < 24) return false;
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden';
  };
  const wide = (el) => el.getBoundingClientRect().width >= vw * 0.82;
  const abs = (el) => { const r = el.getBoundingClientRect(); return { y: Math.round(r.y + window.scrollY), h: Math.round(r.height) }; };

  const out = [];
  const segment = (el, depth) => {
    if (depth > 8) { out.push(el); return; }
    const kids = [...el.children].filter((k) => vis(k) && wide(k) && !['SCRIPT','STYLE','LINK','NOSCRIPT'].includes(k.tagName));
    const ownH = el.getBoundingClientRect().height;
    const kidsH = kids.reduce((a, k) => a + k.getBoundingClientRect().height, 0);
    if (kids.length >= 2 && kidsH >= ownH * 0.66) { kids.forEach((k) => segment(k, depth + 1)); return; }
    if (kids.length === 1 && kids[0].getBoundingClientRect().height >= ownH * 0.8) { segment(kids[0], depth + 1); return; }
    out.push(el);
  };
  segment(document.body, 0);

  // bg effectif : remonte jusqu'à trouver un fond non transparent
  const effBg = (el) => {
    let e = el;
    while (e && e !== document.documentElement) {
      const b = getComputedStyle(e).backgroundColor;
      if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') return b;
      const bi = getComputedStyle(e).backgroundImage;
      if (bi && bi !== 'none' && !bi.startsWith('url')) return 'gradient:' + bi.slice(0, 60);
      e = e.parentElement;
    }
    return 'rgb(255, 255, 255)';
  };

  const bands = out.filter((el) => el.getBoundingClientRect().height >= 40).map((el, i) => {
    const r = abs(el);
    const head = el.querySelector('h1, h2, h3, h4');
    const hs = head ? getComputedStyle(head) : null;
    const text = (el.innerText || '').replace(/\\s+/g, ' ').trim();
    const imgs = [...el.querySelectorAll('img')].filter(vis).map((im) => {
      const ir = im.getBoundingClientRect();
      return { w: Math.round(ir.width), h: Math.round(ir.height), alt: (im.alt || '').slice(0, 40) };
    });
    const btns = [...el.querySelectorAll('a, button, input[type=submit]')].filter((b) => {
      if (!vis(b)) return false;
      const s = getComputedStyle(b);
      return s.backgroundColor !== 'rgba(0, 0, 0, 0)' || px(s.borderTopWidth) > 0;
    }).slice(0, 6).map((b) => {
      const s = getComputedStyle(b);
      return { t: ((b.innerText || b.value || '')).replace(/\\s+/g, ' ').trim().slice(0, 40), bg: s.backgroundColor, c: s.color, fs: px(s.fontSize), rad: s.borderRadius };
    });
    // estimation colonnes : la grille/flex la plus peuplée de rangée directe
    let cols = 0;
    for (const g of el.querySelectorAll('*')) {
      const s = getComputedStyle(g);
      if (s.display === 'grid' || s.display === 'flex') {
        const n = [...g.children].filter(vis).filter((c) => c.getBoundingClientRect().height > 40).length;
        if (n > cols && n <= 8) cols = n;
      }
    }
    return {
      i, y: r.y, h: r.h, bg: effBg(el),
      head: head ? {
        tag: head.tagName, text: (head.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 80),
        fs: px(hs.fontSize), lh: px(hs.lineHeight), color: hs.color, align: hs.textAlign,
        fam: (hs.fontFamily || '').split(',')[0].replace(/"/g, ''),
      } : null,
      text: text.slice(0, 500), textLen: text.length,
      imgs: imgs.slice(0, 12), nImgs: imgs.length, btns, cols,
      form: !!el.querySelector('form'),
    };
  });
  return { title: document.title, h: Math.round(document.documentElement.scrollHeight), bands };
}`;

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
await ctx.route('**/*', (route) => {
  const u = route.request().url();
  if (/googletagmanager|google-analytics|facebook|linkedin|doubleclick|hotjar|clarity/i.test(u)) return route.abort();
  return route.continue();
});
const page = await ctx.newPage();

async function grab(url, dir, side) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(1500);
  // lazy-load : forcer eager + parcourir toute la page lentement, puis attendre
  // que TOUTES les images soient décodées (sinon faux positifs « icône absente »)
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading=lazy]').forEach((i) => { i.loading = 'eager'; });
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 110)); }
    window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 400));
  });
  await page.waitForFunction(() => [...document.images].every((i) => i.complete), { timeout: 10000 }).catch(() => {});
  await page.evaluate(`(${FREEZE})()`);
  await page.waitForTimeout(300);
  const dump = await page.evaluate(`(${BANDS_FN})()`);
  await page.screenshot({ path: `${dir}/${side}__full.png`, fullPage: true }).catch(() => {});
  // shots par bande via clip sur la pleine page (les bandes > viewport passent aussi)
  for (const b of dump.bands) {
    const clip = { x: 0, y: Math.max(0, b.y), width: 1440, height: Math.min(b.h, 6000) };
    if (clip.height < 24) continue;
    await page.screenshot({ path: `${dir}/${side}__band-${String(b.i).padStart(2, '0')}.png`, clip, fullPage: true }).catch(() => {});
  }
  return dump;
}

const results = [];
for (const slug of SLUGS) {
  const dir = `parity/lp/deep/${slug}`;
  mkdirSync(dir, { recursive: true });
  const entry = { slug, dir };
  try {
    entry.live = await grab(`${LIVE}/${slug}`, dir, 'live');
    entry.ours = await grab(`${OURS}/${slug}`, dir, 'ours');
    writeFileSync(`${dir}/deep.json`, JSON.stringify(entry, null, 1));
    process.stderr.write(`OK  ${slug}  live:${entry.live.bands.length}b/${entry.live.h}px  ours:${entry.ours.bands.length}b/${entry.ours.h}px\n`);
  } catch (e) {
    entry.error = String(e).slice(0, 120);
    process.stderr.write(`ERR ${slug}  ${entry.error}\n`);
  }
  results.push({ slug, liveBands: entry.live?.bands.length, oursBands: entry.ours?.bands.length, liveH: entry.live?.h, oursH: entry.ours?.h, error: entry.error });
}
await browser.close();
writeFileSync('parity/lp/deep/index.json', JSON.stringify(results, null, 1));
console.log(JSON.stringify(results, null, 1));
