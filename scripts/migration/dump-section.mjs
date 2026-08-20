// EXTRACTEUR COMPLET — récupère TOUTES les données exactes d'une section depuis
// le code Webflow (export servi en local), DESKTOP + MOBILE, pour ré-écrire
// proprement sans rien deviner.
//
// Pour chaque élément porteur de sens :
//   - texte ENRICHI exact (gras **, italique _, saut de ligne \n)
//   - police (px / interligne / graisse), couleur, fond, bordure, radius, padding
//   - MARGES (top/bottom) + position (x,y) → spacing exact entre label/titre/texte
//   - alignement, letter-spacing, transform, dimensions w×h
//   - images : src d'asset + dims ; SVG inline → path (forme exacte)
// + inventaire des CONTENEURS layout (grid/flex) : colonnes, gap, direction, alignement.
//
// PROCESSUS : servir l'export Webflow en local (ex. port LOCAL_PORT_EXPORT, cf. config.mjs). Pour CHAQUE viewport
// ∈ {1440, 768, 360} : browser_resize ; __dump(sel) sur export PUIS sur local ;
// comparer (texte, police, MARGES, gap, layout, icônes, dims) → ré-écrire proprement.
//
// Usage en page : __dump('.section_layout16', 0)
export const DUMP_FN = `(selector, index=0) => {
  const root = document.querySelectorAll(selector)[index];
  if (!root) return { error: 'introuvable: ' + selector + '[' + index + ']' };
  const px = (v) => Math.round(parseFloat(v) || 0);
  const dec = (s) => s.replace(/&amp;/g,'&').replace(/&#x27;|&#39;/g,"'").replace(/&quot;/g,'"').replace(/&nbsp;/g,' ');
  const rich = (el) => { let h = el.innerHTML;
    h = h.replace(/<br\\s*\\/?>(\\s*)/gi,'\\n').replace(/<(strong|b)\\b[^>]*>/gi,'**').replace(/<\\/(strong|b)>/gi,'**')
         .replace(/<(em|i)\\b[^>]*>/gi,'_').replace(/<\\/(em|i)>/gi,'_').replace(/<[^>]+>/g,'');
    return dec(h).replace(/[ \\t]+/g,' ').replace(/ *\\n */g,'\\n').trim(); };
  const base = document.querySelector(selector + '') ? root.getBoundingClientRect() : {x:0,y:0};
  const box = (el) => { const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return { w: px(r.width), h: px(r.height), x: px(r.x - base.x), y: px(r.y - base.y),
      mt: px(s.marginTop), mb: px(s.marginBottom),
      font: px(s.fontSize)+'/'+px(s.lineHeight)+' '+s.fontWeight, color: s.color,
      bg: s.backgroundColor==='rgba(0, 0, 0, 0)'?'':s.backgroundColor,
      radius: s.borderRadius==='0px'?'':s.borderRadius,
      border: s.borderStyle!=='none'?(s.borderWidth+' '+s.borderStyle+' '+s.borderColor):'',
      pad: s.padding==='0px'?'':s.padding, align: s.textAlign,
      ls: s.letterSpacing==='normal'?'':s.letterSpacing, transform: s.textTransform==='none'?'':s.textTransform }; };
  const items = [];
  for (const el of root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,a,blockquote,button,img,svg,[class*="tagline"],[class*="eyebrow"]')) {
    const tag = el.tagName.toLowerCase(), r = el.getBoundingClientRect();
    if (tag === 'img') { if (r.width < 6) continue; items.push({ type:'img', src:(el.currentSrc||el.src||'').split('/').pop(), ...box(el) }); continue; }
    if (tag === 'svg') { if (r.width < 6) continue; const p = el.querySelector('path'); items.push({ type:'svg', w:px(r.width), h:px(r.height), color:getComputedStyle(el).color, path:(p?p.getAttribute('d'):'').slice(0,500) }); continue; }
    const t = (el.textContent||'').replace(/\\s+/g,' ').trim();
    if (!t || t.length > 400) continue;
    if ([...el.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,a,blockquote,button')].some(c=>(c.textContent||'').replace(/\\s+/g,' ').trim()===t)) continue;
    items.push({ type: (tag==='a'||tag==='button')?'btn':tag, text: rich(el), ...box(el) });
  }
  // Conteneurs layout (grid/flex avec >1 enfant) : colonnes, gap, direction, alignement.
  const layouts = [];
  for (const el of [root, ...root.querySelectorAll('*')]) {
    const s = getComputedStyle(el);
    if ((s.display==='grid' || s.display==='flex') && el.children.length>1) {
      layouts.push({ cls:(el.className&&el.className.toString?el.className.toString():'').slice(0,40), display:s.display,
        cols: s.gridTemplateColumns==='none'?'':s.gridTemplateColumns, gap: s.gap==='normal'?'':s.gap,
        dir: s.flexDirection, align: s.alignItems, justify: s.justifyContent, w: px(el.getBoundingClientRect().width) });
    }
  }
  return { vw: window.innerWidth, sectionBox: box(root), items, layouts: layouts.slice(0,12) };
}`;
