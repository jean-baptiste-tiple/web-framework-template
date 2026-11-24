// Capture d'une page à une largeur donnée, après des actions de visiteur.
//   node scripts/verify/shot.mjs <url> <sortie.png> [largeur=1440] [--full] [--cookies] [--click <sélecteur>]… [--type <sélecteur> <texte>]…
// --full : page entière (sinon l'écran). Un bandeau cookies (`data-consent-action`) est
// écarté (« Tout refuser ») sauf avec --cookies ; sans bandeau, rien ne se passe. Les
// --click / --type s'enchaînent dans l'ordre donné, en vrais clics et vraie frappe : un
// élément masqué fait échouer.
// Exemples (ordinateur puis téléphone, page entière) :
//   node scripts/verify/shot.mjs http://localhost:4321/ .captures/accueil-1440.png 1440 --full
//   node scripts/verify/shot.mjs http://localhost:4321/ .captures/accueil-390.png 390 --full
// Sur le site de test ou un aperçu : remplacer l'adresse locale par la sienne (CLAUDE.md § Projet).
import { open } from './cdp.mjs';

const args = process.argv.slice(2);
const [url, out] = args;
if (!url || !out) {
  console.error('Usage : node scripts/verify/shot.mjs <url> <sortie.png> [largeur] [--full] [--cookies] [--click <sél>] [--type <sél> <texte>]');
  process.exit(2);
}
const width = Number(args[2]) || 1440;
const page = await open(width);
try {
  await page.goto(url);
  if (!args.includes('--cookies')) await page.refuseCookies();
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--click') await page.click(args[++i]);
    else if (args[i] === '--type') {
      await page.type(args[i + 1], args[i + 2]);
      i += 2;
    }
  }
  await page.shot(out, args.includes('--full'));
  console.log(`ok ${out} (${width}px)`);
} finally {
  page.close();
}
process.exit(0);
