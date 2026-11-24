// Pilotage minimal de Chrome (DevTools Protocol), sans dépendance : Node 22+
// (fetch et WebSocket natifs) et un navigateur Chromium installé (Chrome, Edge, Chromium).
// Repris de website-movinmotion (scripts/verify), éprouvé sur le poste et en session cloud.
// Chemin : variable CHROME, sinon le premier navigateur trouvé (Windows, macOS, Linux).
// Partagé par shot.mjs.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CANDIDATS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const SUR_LE_PATH = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];

/** Premier navigateur Chromium disponible, ou `null` : la session dira alors qu'elle n'a pas de capture. */
function trouverChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const fichier = CANDIDATS.find((p) => existsSync(p));
  if (fichier) return fichier;
  for (const nom of SUR_LE_PATH) {
    try {
      return execFileSync(process.platform === 'win32' ? 'where' : 'which', [nom], { encoding: 'utf8' }).split(/\r?\n/)[0].trim();
    } catch {}
  }
  return null;
}

const CHROME = trouverChrome();
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Ouvre un Chrome headless dans un profil jetable, émulé à `width` (mobile sous 768px). */
export async function open(width = 1440) {
  if (!CHROME) {
    throw new Error(
      'Aucun navigateur Chromium trouvé (Chrome, Edge, Chromium) : poser la variable CHROME, ou capturer avec l\'outil navigateur de la session et le dire en tête du rapport.',
    );
  }
  const port = 9300 + Math.floor(Math.random() * 600);
  const profile = mkdtempSync(join(tmpdir(), 'verify-'));
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], {
    stdio: 'ignore',
  });
  let tabs = [];
  for (let i = 0; i < 50 && !tabs.length; i++) {
    try {
      tabs = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).filter((t) => t.type === 'page');
    } catch {}
    if (!tabs.length) await sleep(200);
  }
  if (!tabs.length) throw new Error(`Chrome injoignable (${CHROME})`);
  const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) {
      pending.get(d.id)(d);
      pending.delete(d.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const i = ++id;
      pending.set(i, (d) => (d.error ? reject(new Error(`${method} : ${d.error.message}`)) : resolve(d.result)));
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  const mobile = width < 768;
  const height = mobile ? 844 : 900;
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  await send('Page.enable');

  /** Évalue une expression (async permise) dans la page et rend sa valeur. */
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression: `(async () => (${expression}))()`, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
    return r.result.value;
  };

  const page = {
    send,
    evaluate,
    async goto(url) {
      await send('Page.navigate', { url });
      // Page chargée, scripts compris (lents sous `pnpm dev`), puis un temps de pose.
      for (let i = 0; i < 60; i++) {
        await sleep(250);
        if ((await evaluate('document.readyState')) === 'complete') break;
      }
      await sleep(800);
      // Barre d'outils de `pnpm dev` : absente pour un visiteur, elle recouvre le bas d'écran.
      await evaluate(`document.querySelector('astro-dev-toolbar')?.remove()`);
    },
    /** Écarte le bandeau cookies comme un visiteur (« Tout refuser »), s'il est affiché. */
    async refuseCookies() {
      if (await evaluate(`!!document.querySelector('[data-consent-action="refuse"] button')?.offsetParent`)) {
        await page.click('[data-consent-action="refuse"] button');
      }
    },
    /** Clic de souris réel au centre de l'élément (défilé dans la vue) ; échoue si absent ou masqué. */
    async click(selector) {
      const box = await evaluate(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el || !el.getClientRects().length) return null;
        // Défilement instantané : un scroll-behavior smooth fausserait la position lue.
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
        const r = el.getBoundingClientRect();
        const x = r.x + r.width / 2;
        const y = r.y + r.height / 2;
        // Ce qu'un visiteur toucherait à cet endroit : l'élément, un descendant, ou son libellé.
        const hit = document.elementFromPoint(x, y);
        const reach = !!hit && (el.contains(hit) || hit.contains(el) || (el.labels && [...el.labels].some((l) => l.contains(hit))));
        return { x, y, reach, hit: hit ? hit.outerHTML.slice(0, 120) : null };
      })()`);
      if (!box) throw new Error(`Élément absent ou masqué : ${selector}`);
      if (!box.reach) throw new Error(`Élément recouvert : ${selector} (sous le doigt : ${box.hit})`);
      for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
        await send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
      }
      await sleep(400);
    },
    /** Frappe au clavier dans le champ (focus par clic), caractère par caractère. */
    async type(selector, text) {
      await page.click(selector);
      for (const ch of text) {
        await send('Input.dispatchKeyEvent', { type: 'keyDown', text: ch, unmodifiedText: ch, key: ch });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch });
      }
      await sleep(150);
    },
    /** Capture PNG : écran courant, ou page entière (`full`). */
    async shot(file, full = false) {
      const { writeFileSync } = await import('node:fs');
      if (full) {
        const h = await evaluate('Math.min(document.documentElement.scrollHeight, 16000)');
        await send('Emulation.setDeviceMetricsOverride', { width, height: h, deviceScaleFactor: 1, mobile });
        await sleep(600);
      } else {
        await evaluate('window.scrollTo(0, 0)');
      }
      const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full });
      writeFileSync(file, Buffer.from(data, 'base64'));
      if (full) await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    },
    close() {
      ws.close();
      chrome.kill();
      // Profil jetable : Chrome le tient encore un instant, le système le nettoiera sinon.
      setTimeout(() => {
        try {
          rmSync(profile, { recursive: true, force: true });
        } catch {}
      }, 500).unref();
    },
  };
  return page;
}
