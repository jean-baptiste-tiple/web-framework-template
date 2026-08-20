// Fonction d'extraction de spec d'une section (à injecter via Playwright browser_evaluate).
// Exporte le code source de la fonction pour réutilisation/documentation. L'extraction
// réelle se fait en page (la fonction reçoit un sélecteur CSS et renvoie la spec JSON).
//
// Usage en page : extractSection('.section_home-benefits')
export const EXTRACT_FN = `(selector) => {
  const root = document.querySelector(selector);
  if (!root) return { error: 'not found: ' + selector };
  const base = root.getBoundingClientRect();
  const cs = getComputedStyle;
  const pick = (s) => ({
    fontFamily: s.fontFamily, fontSize: s.fontSize, fontWeight: s.fontWeight,
    lineHeight: s.lineHeight, color: s.color, backgroundColor: s.backgroundColor,
    margin: s.margin, padding: s.padding, borderRadius: s.borderRadius,
    display: s.display, gridTemplateColumns: s.gridTemplateColumns, gap: s.gap,
    flexDirection: s.flexDirection, textAlign: s.textAlign, objectFit: s.objectFit,
    maxWidth: s.maxWidth, width: s.width,
  });
  const node = (el, depth) => {
    const r = el.getBoundingClientRect();
    const s = cs(el);
    const o = {
      tag: el.tagName.toLowerCase(),
      cls: (el.className && el.className.toString ? el.className.toString() : '').slice(0, 80),
      rect: { x: Math.round(r.x - base.x), y: Math.round(r.y - base.y), w: Math.round(r.width), h: Math.round(r.height) },
      style: pick(s),
    };
    if (el.children.length === 0) o.text = (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 120);
    if (el.tagName === 'IMG') o.img = { src: el.currentSrc || el.src, naturalW: el.naturalWidth, naturalH: el.naturalHeight, renderW: Math.round(r.width), renderH: Math.round(r.height) };
    if (s.backgroundImage && s.backgroundImage !== 'none') o.bg = s.backgroundImage.slice(0, 200);
    if (depth > 0 && el.children.length) o.children = [...el.children].slice(0, 40).map((c) => node(c, depth - 1));
    return o;
  };
  return { section: { w: Math.round(base.width), h: Math.round(base.height), bg: cs(root).backgroundColor, padding: cs(root).padding }, tree: node(root, 4) };
}`;
