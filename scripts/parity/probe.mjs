// PROBE_FN — injecté dans chaque page (les deux côtés) : dumpe sections + éléments
// porteurs de sens avec rects et styles calculés. Une seule implémentation pour les
// deux DOM (Webflow div-soup et Astro sémantique) → pas de drift.
export const PROBE_FN = `() => {
  const px = (v) => Math.round(parseFloat(v) || 0);
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 3 || r.height < 3) return false;
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden';
  };
  const SKIP_TAG = /^(SCRIPT|STYLE|LINK|NOSCRIPT|TEMPLATE|IFRAME)$/;
  const cls = (el) => (el.className && el.className.toString ? el.className.toString() : '').trim().slice(0, 80);

  // 1. conteneur top-level : descendre les wrappers à enfant unique (page-wrapper…)
  let node = document.body;
  for (let i = 0; i < 6; i++) {
    const kids = [...node.children].filter((e) => !SKIP_TAG.test(e.tagName) && vis(e));
    if (kids.length === 1) { node = kids[0]; continue; }
    break;
  }
  // 2. blocs top-level = enfants du conteneur, en dépliant <main>/main-wrapper
  let blocks = [];
  for (const b of [...node.children].filter((e) => !SKIP_TAG.test(e.tagName) && vis(e))) {
    if (b.tagName === 'MAIN' || /main[-_]wrapper/.test(cls(b))) {
      blocks.push(...[...b.children].filter((e) => !SKIP_TAG.test(e.tagName) && vis(e)));
    } else blocks.push(b);
  }
  // nav/footer = chrome ; ATTENTION <header> Webflow (section_header1) est un hero de CONTENU
  const isChrome = (el) => el.tagName === 'NAV' || el.tagName === 'FOOTER' || /navbar|w-nav|footer|site-header/.test(cls(el));

  const sy = window.scrollY;
  const rectOf = (el) => { const r = el.getBoundingClientRect(); return [px(r.x), px(r.top + sy), px(r.width), px(r.height)]; };
  const effBg = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const bg = getComputedStyle(n).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
      if (getComputedStyle(n).backgroundImage !== 'none') return 'image';
      n = n.parentElement;
    }
    return getComputedStyle(document.body).backgroundColor;
  };

  // sections à widget JS (slider/tabs/accordéon) : état initial CSS-only ≠ état visiteur → géométrie non comparable
  const hasWidget = (b) => !!b.querySelector('.w-slider, .w-tabs, .w-dropdown, details, [data-fs], .car');
  const sections = blocks.map((b, i) => ({ i, tag: b.tagName.toLowerCase(), cls: cls(b), rect: rectOf(b), bg: effBg(b), chrome: isChrome(b), widget: hasWidget(b) }));

  // 3. éléments porteurs de sens, par section, dédup parent/enfant par texte identique
  const els = [];
  const SEL = 'h1,h2,h3,h4,h5,h6,p,li,a,button,blockquote,img,[class*="tagline"],[class*="eyebrow"]';
  blocks.forEach((block, si) => {
    for (const el of block.querySelectorAll(SEL)) {
      if (els.length > 900) break;
      if (!vis(el)) continue;
      const tag = el.tagName.toLowerCase();
      if (tag === 'img') {
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) continue;
        els.push({ sec: si, type: 'img', src: decodeURIComponent((el.currentSrc || el.src || '').split('/').pop() || '').slice(0, 90), rect: rectOf(el) });
        continue;
      }
      const t = (el.textContent || '').replace(/\\s+/g, ' ').trim();
      if (!t || t.length > 350) continue;
      // dédup : ne garder que l'élément le plus profond portant ce texte
      if ([...el.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,a,button,blockquote')].some((c) => (c.textContent || '').replace(/\\s+/g, ' ').trim() === t)) continue;
      // styles TEXTE : descendre vers le porteur réel (wrappers div/span hors SEL qui
      // redéfinissent couleur/taille — ex. a.tarif-sub-cat-holder > div.text-block-16)
      let carrier = el;
      for (let d = 0; d < 5; d++) {
        const kid = [...carrier.children].filter((c) => (c.textContent || '').replace(/\\s+/g, ' ').trim() === t);
        if (kid.length === 1) carrier = kid[0]; else break;
      }
      const s = getComputedStyle(carrier);
      const rect = rectOf(el);
      const lh = px(s.lineHeight);
      els.push({
        sec: si, type: tag === 'a' || tag === 'button' ? 'btn' : tag, text: t.slice(0, 200),
        href: tag === 'a' ? (el.getAttribute('href') || '').slice(0, 120) : undefined,
        rect,
        fs: px(s.fontSize), lh, fw: +s.fontWeight || 400,
        ff: (s.fontFamily || '').split(',')[0].replace(/["']/g, '').trim().toLowerCase(),
        col: s.color, al: s.textAlign.replace(/^start$/, 'left').replace(/^end$/, 'right'),
        rad: s.borderRadius !== '0px' ? s.borderRadius : undefined,
        tt: s.textTransform !== 'none' ? s.textTransform : undefined,
        bg: s.backgroundColor !== 'rgba(0, 0, 0, 0)' ? s.backgroundColor : undefined,
        rows: lh > 0 ? Math.max(1, Math.round(carrier.getBoundingClientRect().height / lh)) : 1,
      });
    }
  });

  // 4. conteneurs layout (grid/flex multi-enfants) par section — colonnage et gaps
  const layouts = [];
  blocks.forEach((block, si) => {
    const cand = [block, ...block.querySelectorAll('*')];
    let n = 0;
    for (const el of cand) {
      if (n >= 12) break;
      if (!vis(el) || el.children.length < 2) continue;
      const s = getComputedStyle(el);
      if (s.display !== 'grid' && s.display !== 'flex') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 250) continue;
      const cols = s.display === 'grid'
        ? (s.gridTemplateColumns === 'none' ? 1 : s.gridTemplateColumns.split(' ').length)
        : (s.flexDirection.startsWith('column') ? 1 : [...el.children].filter(vis).length);
      layouts.push({ sec: si, cls: cls(el).slice(0, 50), disp: s.display, cols, gap: s.gap === 'normal' ? '0px 0px' : s.gap, dir: s.flexDirection });
      n++;
    }
  });

  return { vw: window.innerWidth, h: px(document.documentElement.scrollHeight), title: document.title, sections, els, layouts };
}`;

// FREEZE_FN — neutralise les sources de non-déterminisme avant mesure (repris de visual-sweep CLEAN).
export const FREEZE_FN = `() => {
  const st = document.createElement('style');
  st.textContent = '*{animation:none!important;transition:none!important;scroll-behavior:auto!important}';
  document.head.appendChild(st);
  const kill = ['axeptio', 'cookie', 'consent', 'hubspot-messages', 'chat', 'popup', 'modal', 'lightbox'];
  [...document.querySelectorAll('body *')].forEach((e) => {
    const id = (e.id || '') + ' ' + (e.className || '').toString();
    if (kill.some((k) => new RegExp(k, 'i').test(id))) e.remove();
  });
  document.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; if (i.dataset.src) i.src = i.dataset.src; });
}`;
