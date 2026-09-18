import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import TurndownService from 'turndown';

// Jumeaux Markdown : chaque page HTML indexable sort aussi en .md, pour les
// agents IA qui lisent du texte plutôt que du markup. On part du HTML RENDU
// (et non de `entry.body`) parce que les landings à sections et les pages
// bespoke n'ont pas de corps Markdown source.

/** Décode les entités qu'Astro échappe dans les attributs et le <title>. */
function decodeEntities(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/g, "'")
    .replace(/&amp;/g, '&');
}

function firstMatch(html, regex) {
  const m = html.match(regex);
  return m ? decodeEntities(m[1]).trim() : undefined;
}

/** Parcourt récursivement un dossier et rend les chemins de fichiers .html. */
async function listHtml(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listHtml(full)));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

export default function markdownTwins() {
  // `site` n'est connu qu'après résolution de la config : on le capture ici
  // pour absolutiser les liens du corps (un agent lit le .md hors contexte).
  let site = '';

  const turndown = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '_',
  }).remove(['script', 'style', 'svg', 'noscript', 'template', 'form', 'button']);

  // Sans règle, le <summary> d'un <details> (accordéon, FAQ) sort en paragraphe
  // nu : la question devient indistincte de sa réponse. En gras, la paire
  // question/réponse reste lisible et citable hors contexte.
  turndown.addRule('summary', {
    filter: 'summary',
    replacement: (content) => `\n\n**${content.trim()}**\n\n`,
  });

  return {
    name: 'markdown-twins',
    hooks: {
      'astro:config:done': ({ config }) => {
        site = String(config.site ?? '').replace(/\/$/, '');
      },

      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const all = await listHtml(root);
        // Une page = un index.html (build format "directory") ; 404.html est le
        // seul fichier plat qui porte du contenu.
        const pages = all.filter((f) => {
          const name = f.slice(f.lastIndexOf(sep) + 1);
          return name === 'index.html' || name === '404.html';
        });

        const twins = [];

        for (const file of pages) {
          const html = await readFile(file, 'utf8');
          const is404 = file.endsWith(`${sep}404.html`);

          // Les stubs meta-refresh générés par `redirects` n'ont pas de contenu.
          if (/<meta\s+http-equiv="refresh"/i.test(html)) continue;
          // Une page noindex n'a pas de jumeau (BaseHead n'y annonce pas d'alternate).
          // Exception : le 404, qui doit répondre en Markdown aux agents.
          if (!is404 && /<meta\s+name="robots"\s+content="noindex/i.test(html))
            continue;

          const relPath = relative(root, file).split(sep).join('/');

          const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
          if (!main) {
            logger.warn(`${relPath} : aucun <main>, jumeau Markdown ignoré.`);
            continue;
          }

          // Liens et images en absolu (on ne touche pas au protocol-relative //).
          const body = main[1].replace(
            /(\s(?:href|src)=")\/(?!\/)/g,
            `$1${site}/`,
          );

          const front = {
            title: firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
            description: firstMatch(
              html,
              /<meta\s+name="description"\s+content="([^"]*)"/i,
            ),
            url: firstMatch(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i),
            lang: firstMatch(html, /<html[^>]*\slang="([^"]*)"/i),
            // Fraîcheur : reprise du dateModified déjà émis en JSON-LD.
            last_updated: firstMatch(
              html,
              /"dateModified"\s*:\s*"([^"]{10})/i,
            ),
          };

          const yaml = Object.entries(front)
            .filter(([, v]) => v)
            // JSON.stringify produit un scalaire double-quoted valide en YAML.
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join('\n');

          // Le corps commence par le H1 de la page : pas de titre redondant.
          const markdown = turndown
            .turndown(body)
            .replace(/\n{3,}/g, '\n\n')
            .trim();

          // Un titre vide veut dire que son texte vivait dans un élément retiré
          // (un <button> d'accordéon posé dans un <h3> : constaté sur un site
          // dérivé le 2026-09-18, huit titres vides que rien ne signalait).
          // Erreur et non avertissement : le jumeau perdrait sans bruit ce que la
          // page affiche. Remède : une règle turndown pour cet élément.
          const emptyHeading = markdown.match(/^#{1,6}[ \t]*$/m);
          if (emptyHeading) {
            throw new Error(
              `${relPath} : titre vide dans le jumeau Markdown (« ${emptyHeading[0].trim()} ») ; son texte vit dans un élément retiré par le convertisseur, lui donner une règle.`,
            );
          }

          // Jumeau FRÈRE du dossier : blog/slug/index.html -> blog/slug.md.
          const outRel = is404
            ? '404.md'
            : relPath === 'index.html'
              ? 'index.md'
              : `${posix.dirname(relPath)}.md`;
          const outPath = join(root, outRel);

          await mkdir(dirname(outPath), { recursive: true });
          await writeFile(outPath, `---\n${yaml}\n---\n\n${markdown}\n`, 'utf8');
          twins.push({ path: outRel, content: `---\n${yaml}\n---\n\n${markdown}` });
        }

        // llms-full.txt : tout le site en un fichier. Home d'abord (point
        // d'entrée), puis ordre alphabétique ; le 404 n'est pas du contenu.
        const full = twins
          .filter((t) => t.path !== '404.md')
          .sort((a, b) =>
            a.path === 'index.md'
              ? -1
              : b.path === 'index.md'
                ? 1
                : a.path.localeCompare(b.path),
          );
        await writeFile(
          join(root, 'llms-full.txt'),
          `${full.map((t) => t.content).join('\n\n---\n\n')}\n`,
          'utf8',
        );

        logger.info(`${twins.length} jumeaux Markdown + llms-full.txt`);
      },
    },
  };
}
