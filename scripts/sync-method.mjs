#!/usr/bin/env node
/**
 * sync-method — porte la méthode du socle vers un site dérivé.
 *
 * Repris de dev-framework (même logique, mêmes statuts) ; ici la méthode vit sous `.claude/`.
 * Les sites dérivés ont pour la plupart été copiés sans historique git : ils ne peuvent pas
 * « tirer » le socle. Ce script compare la part du socle (`.claude/sync-manifest.json`) au dépôt cible :
 * - `owned` : le socle fait foi. Un fichier que le site n'a pas touché depuis la dernière
 *   synchro (empreinte notée dans `.claude/sync-state.json`) se remplace sans risque ; un fichier
 *   modifié par le site ne s'écrase qu'avec `--take <chemin>` explicite. Une entrée `!glob`
 *   retire des chemins de la part du socle (`projet.md` : surcouche du site, jamais livrée).
 * - `merge` : contenu mixte (CLAUDE.md, _index.md…), jamais écrit, sauf s'il est « sans part
 *   projet » (aucune ligne propre au site) et cité par `--take`. Le rapport dit ce que le
 *   template a ajouté ; la fusion reste manuelle.
 *
 *   node scripts/sync-method.mjs <dépôt-cible>                  rapport seul, rien n'est écrit
 *   node scripts/sync-method.mjs <dépôt-cible> --apply [--take <chemin>]... [--exclude <chemin>]...
 *     (`--take` et `--exclude` impliquent `--apply`)
 *   node scripts/sync-method.mjs <dépôt-cible> --diff <chemin>...  diff template → cible, rien n'est écrit
 *
 * Aucune dépendance : il voyage avec la méthode (il est lui-même `owned`).
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const MANIFESTE = '.claude/sync-manifest.json'
export const TAMPON = '.claude/sync-state.json'
const IGNORES = new Set(['node_modules', '.git', '.next'])

export const STATUTS = {
  nouveau: 'nouveau',
  identique: 'identique',
  sur: 'à jour sûr',
  modifie: 'modifié par le projet',
  retire: 'retiré du template',
  propre: 'propre au projet',
  exclu: 'exclu par le projet',
  doublon: 'doublon à supprimer à la main',
}

export const MERGE_SANS_PART = 'merge sans part projet'

// ------------------------------------------------------------------ globs (sans dépendance)
/** `a/{x,y}/b` → [`a/x/b`, `a/y/b`] (accolades non imbriquées : seul usage du manifeste). */
export function developperAccolades(glob) {
  const m = /\{([^{}]*)\}/.exec(glob)
  if (!m) return [glob]
  const avant = glob.slice(0, m.index)
  const apres = glob.slice(m.index + m[0].length)
  return m[1].split(',').flatMap((alt) => developperAccolades(avant + alt + apres))
}

const JOKERS = { '**/': '(?:.*/)?', '**': '.*', '*': '[^/]*', '?': '[^/]' }
const versRegex = (glob) =>
  new RegExp(`^${glob.replace(/\*\*\/|\*\*|\*|\?|[.+^$()|[\]\\]/g, (t) => JOKERS[t] ?? `\\${t}`)}$`)

/** Dossier littéral d'un glob, `/` final compris : `docs/decisions/ADR-*.md` → `docs/decisions/`. */
function base(glob) {
  const avant = glob.split(/[*?{]/)[0]
  return avant.slice(0, avant.lastIndexOf('/') + 1)
}

function lister(root, dir, out = []) {
  const abs = join(root, dir)
  if (!existsSync(abs) || !statSync(abs).isDirectory()) return out
  for (const e of readdirSync(abs)) {
    if (IGNORES.has(e)) continue
    const rel = dir + e
    if (statSync(join(root, rel)).isDirectory()) lister(root, `${rel}/`, out)
    else out.push(rel)
  }
  return out
}

/** Chemins relatifs (POSIX) de `root` qui matchent `glob`. */
export function fichiersDuGlob(root, glob) {
  return developperAccolades(glob).flatMap((g) => {
    const re = versRegex(g)
    return lister(root, base(g)).filter((p) => re.test(p))
  })
}

// ------------------------------------------------------------------ manifeste et contenus
const estSauf = (e) => typeof e === 'string' && e.startsWith('!')

/** `sauf` : regex des entrées `!glob`, testées sur le chemin tel quel (sans `dest`), des deux côtés. */
export function lireManifeste(root) {
  const brut = JSON.parse(readFileSync(join(root, MANIFESTE), 'utf8'))
  const entrees = brut.owned ?? []
  const owned = entrees.filter((e) => !estSauf(e)).map((e) => (typeof e === 'string' ? { glob: e, dest: null } : e))
  const sauf = entrees.filter(estSauf).flatMap((e) => developperAccolades(e.slice(1))).map(versRegex)
  return { owned, merge: brut.merge ?? [], sauf }
}

const horsSauf = (manifeste, p) => !manifeste.sauf.some((re) => re.test(p))

/**
 * Manifeste mort : un glob `owned` qui ne matche plus rien ne synchronise plus rien, en silence ;
 * une convention du socle absente du manifeste n'atteint jamais un dérivé.
 * Chaque alternative d'accolades est contrôlée seule : `{a,b}` avec `b` supprimé reste mort pour `b`.
 * Les entrées `!glob` ne sont pas contrôlées : ne rien matcher dans le socle est leur état normal.
 */
export function verifierManifeste(root, err) {
  if (!existsSync(join(root, MANIFESTE))) return
  const manifeste = lireManifeste(root)
  const { owned, merge } = manifeste
  for (const { glob } of owned) {
    for (const g of developperAccolades(glob)) {
      if (fichiersDuGlob(root, g).length === 0) err(`${MANIFESTE} : le glob owned \`${g}\` ne matche aucun fichier du template.`)
    }
  }
  for (const p of merge) {
    if (!existsSync(join(root, p))) err(`${MANIFESTE} : le fichier merge \`${p}\` n'existe pas dans le template.`)
  }
  const couverts = new Set([...owned.flatMap(({ glob }) => fichiersDuGlob(root, glob)).filter((p) => horsSauf(manifeste, p)), ...merge])
  for (const p of fichiersDuGlob(root, '.claude/conventions/*.md')) {
    if (!couverts.has(p)) err(`${MANIFESTE} : \`${p}\` n'est ni owned ni merge — il n'atteindra aucun projet dérivé.`)
  }
  verifierCitations(root, owned, couverts, err)
}

/**
 * Un document qui voyage (owned ou merge) ne cite pas un chemin qui n'existe que dans le
 * socle : le manifeste n'est pas copié, et un fichier owned à `dest` (ADR) change de dossier.
 * Le site y lirait un chemin mort.
 */
function verifierCitations(root, owned, couverts, err) {
  const seuls = [MANIFESTE, ...owned.filter(({ dest }) => dest).flatMap(({ glob }) => fichiersDuGlob(root, glob))]
  for (const p of [...couverts].filter((f) => f.endsWith('.md') && existsSync(join(root, f)))) {
    const src = readFileSync(join(root, p), 'utf8')
    for (const s of seuls) {
      if (src.includes(s)) err(`${p} : cite \`${s}\`, absent des sites dérivés — citer le nom seul (ADR socle 0006, « le manifeste du socle »).`)
    }
  }
  // Un fichier qui voyage cite un ADR du socle « ADR socle 0003 » : dans un site, le numéro nu
  // désigne souvent un autre ADR, celui du site (site-open-kairos, casalino-site, 2026-11-24).
  for (const p of [...couverts].filter((f) => existsSync(join(root, f)) && !f.startsWith('docs/'))) {
    const lignes = readFileSync(join(root, p), 'utf8').split('\n')
    lignes.forEach((l, i) => {
      if (/ADR (?!socle )0\d{3}/.test(l)) err(`${p}:${i + 1} : ADR cité sans « socle » — écrire « ADR socle 000N », le numéro seul désigne un ADR du site dans un dérivé.`)
    })
  }
}

/** Chemin dans le dérivé : `dest` remplace le dossier littéral du glob (ADR → `docs/decisions/socle/`). */
const versCible = ({ glob, dest }, chemin) => (dest ? dest + chemin.slice(base(glob).length) : chemin)
const globCible = ({ glob, dest }) => (dest ? dest + glob.slice(base(glob).length) : glob)

// Dépôts sous Windows (autocrlf) : un fichier identique au CRLF près est identique.
function normalise(buf) {
  return buf.includes(0) ? buf : Buffer.from(buf.toString('utf8').replace(/\r\n/g, '\n'))
}
export const empreinte = (buf) => createHash('sha256').update(normalise(buf)).digest('hex')
const texte = (root, p) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n')

function lireTampon(cible) {
  const p = join(cible, TAMPON)
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : { files: {}, exclude: [] }
}

// ------------------------------------------------------------------ analyse des fichiers owned
function statutOwned(srcHash, cible, dest, tampon) {
  const abs = join(cible, dest)
  if (!existsSync(abs)) return { statut: STATUTS.nouveau }
  const h = empreinte(readFileSync(abs))
  if (h === srcHash) return { statut: STATUTS.identique }
  return { statut: tampon.files?.[dest] === h ? STATUTS.sur : STATUTS.modifie }
}

/**
 * Un fichier exclu (`--exclude`, noté dans le tampon) n'est plus jamais écrit. Un fichier de la
 * cible sous un glob owned sans équivalent dans le template n'est « retiré du template » que si
 * une synchro précédente l'a noté : sinon c'est le projet qui l'a ajouté (checklist, starter).
 */
export function analyserOwned(template, cible, manifeste, { tampon, exclus }) {
  const lignes = []
  for (const entree of manifeste.owned) {
    const attendus = new Set()
    for (const src of fichiersDuGlob(template, entree.glob).filter((p) => horsSauf(manifeste, p))) {
      const dest = versCible(entree, src)
      attendus.add(dest)
      const hash = empreinte(readFileSync(join(template, src)))
      const statut = exclus.has(dest) ? { statut: STATUTS.exclu } : statutOwned(hash, cible, dest, tampon)
      lignes.push({ src, dest, hash, ...statut })
    }
    for (const dest of fichiersDuGlob(cible, globCible(entree))) {
      if (attendus.has(dest) || !horsSauf(manifeste, dest)) continue
      lignes.push({ src: null, dest, statut: tampon.files?.[dest] ? STATUTS.retire : STATUTS.propre })
    }
    if (entree.dest) lignes.push(...doublons(template, cible, entree))
  }
  return lignes
}

/**
 * Copie d'origine laissée à l'ancien chemin d'un fichier owned à `dest` (ADR directement sous
 * `docs/decisions/` alors que le socle l'écrit sous `socle/`) : même contenu, CRLF normalisé.
 * Jamais supprimée par le script ; un contenu différent est une part du site, non signalée.
 */
function doublons(template, cible, entree) {
  const memeContenu = (src) => empreinte(readFileSync(join(cible, src))) === empreinte(readFileSync(join(template, src)))
  return fichiersDuGlob(template, entree.glob)
    .filter((src) => existsSync(join(cible, src)) && memeContenu(src))
    .map((src) => ({ src: null, dest: src, copieDe: versCible(entree, src), statut: STATUTS.doublon }))
}

// ------------------------------------------------------------------ analyse des fichiers merge
const titres = (src) => [...src.matchAll(/^#{2,3}\s+(.+)$/gm)].map((m) => m[1].trim())
const estLigneDeTableau = (l) => l.startsWith('|') && !/^\|[\s|:-]+\|?$/.test(l)
const clesDeTableau = (src) => src.split('\n').filter(estLigneDeTableau).map((l) => l.split('|')[1].trim()).filter(Boolean)
const absents = (dansTemplate, dansCible) => {
  const cible = new Set(dansCible)
  return [...new Set(dansTemplate)].filter((x) => !cible.has(x))
}
const commandesDeHooks = (src) =>
  Object.values(JSON.parse(src).hooks ?? {}).flatMap((liste) => liste.flatMap((h) => (h.hooks ?? []).map((x) => x.command)))

/** Ce que le template a et que la cible n'a pas, selon la nature du fichier. */
function ajoutsDuTemplate(chemin, tpl, cib) {
  if (chemin === 'CLAUDE.md' || chemin.endsWith('_index.md')) {
    return [
      ...absents(titres(tpl), titres(cib)).map((t) => `section « ${t} »`),
      ...absents(clesDeTableau(tpl), clesDeTableau(cib)).map((k) => `ligne de tableau « ${k} »`),
    ]
  }
  if (chemin === 'package.json') {
    const [a, b] = [JSON.parse(tpl).scripts ?? {}, JSON.parse(cib).scripts ?? {}]
    return Object.keys(a)
      .filter((k) => a[k] !== b[k])
      .map((k) => (k in b ? `script \`${k}\` différent : « ${a[k]} »` : `script \`${k}\` : « ${a[k]} »`))
  }
  if (chemin === '.claude/settings.json') {
    // allow / ask / deny portent le garde-fou de mise en ligne (ADR socle 0006) : une règle absente se nomme.
    const regles = (src, cle) => JSON.parse(src).permissions?.[cle] ?? []
    return [
      ...absents(commandesDeHooks(tpl), commandesDeHooks(cib)).map((c) => `hook « ${c} »`),
      ...['allow', 'ask', 'deny'].flatMap((cle) => absents(regles(tpl, cle), regles(cib, cle)).map((r) => `permission ${cle} « ${r} »`)),
    ]
  }
  if (chemin === '.gitignore') {
    const lignes = (s) => s.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    return absents(lignes(tpl), lignes(cib)).map((l) => `ligne « ${l} »`)
  }
  return []
}

function stat(template, cible, chemin) {
  try {
    execFileSync('git', ['diff', '--no-index', '--ignore-cr-at-eol', '--numstat', join(template, chemin), join(cible, chemin)], { stdio: 'pipe' })
    return null
  } catch (e) {
    const [plus, moins] = String(e.stdout ?? '').split(/\s+/)
    return plus ? `cible : +${plus} / −${moins} lignes par rapport au template` : null
  }
}

/**
 * Version antérieure ou égale du socle, sans ligne propre au site : toutes les lignes non vides
 * de la cible existent dans le socle. Heuristique (une ligne du site identique à une ligne du
 * socle passe inaperçue) : d'où `--take` explicite, jamais d'écriture automatique.
 */
function sansPartProjet(tpl, cib) {
  const duTemplate = new Set(tpl.split('\n').map((l) => l.trimEnd()))
  return cib.split('\n').every((l) => !l.trim() || duTemplate.has(l.trimEnd()))
}

export function analyserMerge(template, cible, manifeste) {
  return manifeste.merge
    .filter((chemin) => existsSync(join(template, chemin)))
    .map((chemin) => {
      if (!existsSync(join(cible, chemin))) return { chemin, statut: 'absent de la cible', ajouts: [] }
      const [tpl, cib] = [texte(template, chemin), texte(cible, chemin)]
      if (chemin === 'package.json') {
        const ajouts = ajoutsDuTemplate(chemin, tpl, cib)
        return { chemin, statut: ajouts.length ? 'différent (scripts)' : 'identique (scripts)', ajouts }
      }
      if (tpl === cib) return { chemin, statut: 'identique', ajouts: [] }
      const statut = sansPartProjet(tpl, cib) ? MERGE_SANS_PART : 'différent'
      return { chemin, statut, ajouts: ajoutsDuTemplate(chemin, tpl, cib), stat: stat(template, cible, chemin) }
    })
}

/**
 * Diff unifié template → cible d'un fichier owned ou merge, CRLF normalisé : les deux côtés sont
 * recopiés normalisés dans un dossier temporaire, sinon chaque ligne d'un dépôt autocrlf diffère.
 */
export function diffUnifie(template, cible, src, dest) {
  const tmp = mkdtempSync(join(tmpdir(), 'sync-method-diff-'))
  const cote = (nom, root, p) => {
    mkdirSync(dirname(join(tmp, nom, dest)), { recursive: true })
    writeFileSync(join(tmp, nom, dest), existsSync(join(root, p)) ? texte(root, p) : '')
  }
  try {
    cote('template', template, src)
    cote('cible', cible, dest)
    const args = ['diff', '--no-index', '--no-color', '--no-prefix', `template/${dest}`, `cible/${dest}`]
    execFileSync('git', args, { cwd: tmp, stdio: 'pipe' })
    return `${dest} : identique au template (CRLF normalisé)`
  } catch (e) {
    return String(e.stdout ?? '') || `${dest} : diff impossible (${e.message})`
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }
}

// ------------------------------------------------------------------ écriture
function commitDuTemplate(template) {
  try {
    return execFileSync('git', ['-C', template, 'rev-parse', 'HEAD'], { stdio: 'pipe' }).toString().trim()
  } catch {
    return 'inconnu (template hors git)'
  }
}

/**
 * Écrit `nouveau`, `à jour sûr`, les `modifié par le projet` et les `merge sans part projet`
 * cités par `--take` ; jamais un autre fichier merge. Le tampon note l'empreinte de chaque fichier owned désormais égal au template ;
 * un fichier modifié laissé en place garde son empreinte précédente, pour qu'un retour du projet
 * à l'état synchronisé redevienne « à jour sûr ».
 */
export function appliquer(template, cible, lignes, { takes, exclus, merge = [] }) {
  const ancien = lireTampon(cible)
  const files = {}
  const ecrits = []
  for (const l of lignes) {
    if (!l.src || l.statut === STATUTS.exclu) continue
    const ecrire = l.statut === STATUTS.nouveau || l.statut === STATUTS.sur || (l.statut === STATUTS.modifie && takes.has(l.dest))
    if (ecrire) {
      mkdirSync(dirname(join(cible, l.dest)), { recursive: true })
      writeFileSync(join(cible, l.dest), readFileSync(join(template, l.src)))
      ecrits.push(l.dest)
    }
    if (ecrire || l.statut === STATUTS.identique) files[l.dest] = l.hash
    else if (ancien.files?.[l.dest]) files[l.dest] = ancien.files[l.dest]
  }
  for (const m of merge) {
    if (m.statut !== MERGE_SANS_PART || !takes.has(m.chemin)) continue
    writeFileSync(join(cible, m.chemin), readFileSync(join(template, m.chemin)))
    ecrits.push(m.chemin)
  }
  const nom = JSON.parse(readFileSync(join(template, 'package.json'), 'utf8')).name
  const meta = { template: nom, commit: commitDuTemplate(template), date: new Date().toISOString() }
  const tampon = { ...meta, exclude: [...exclus].sort(), files }
  writeFileSync(join(cible, TAMPON), `${JSON.stringify(tampon, null, 2)}\n`)
  return ecrits
}

// ------------------------------------------------------------------ CLI
function lireArgs(argv) {
  const args = { cible: null, apply: false, takes: new Set(), excludes: new Set(), diffs: new Set() }
  const listes = { '--take': args.takes, '--exclude': args.excludes, '--diff': args.diffs }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--apply') args.apply = true
    else if (listes[argv[i]] && argv[i + 1]) listes[argv[i]].add(argv[++i].replaceAll('\\', '/'))
    else if (argv[i].startsWith('-') || args.cible) return { erreur: `argument inattendu : ${argv[i]}` }
    else args.cible = resolve(argv[i])
  }
  if (!args.cible) return { erreur: 'dépôt cible manquant' }
  if (args.takes.size || args.excludes.size) args.apply = true
  if (args.diffs.size && args.apply) return { erreur: '--diff n’écrit rien : il ne se combine ni avec --apply, ni avec --take, ni avec --exclude' }
  const lesDeux = [...args.takes].filter((t) => args.excludes.has(t))
  if (lesDeux.length) return { erreur: `--take et --exclude sur le même fichier : ${lesDeux.join(', ')}` }
  return args
}

function imprimer(cible, owned, merge) {
  const ordre = [STATUTS.nouveau, STATUTS.sur, STATUTS.modifie, STATUTS.exclu, STATUTS.retire, STATUTS.propre, STATUTS.doublon]
  for (const statut of ordre) {
    const liste = owned.filter((l) => l.statut === statut)
    if (!liste.length) continue
    console.log(`\n## ${statut} (${liste.length})`)
    for (const l of liste) {
      const origine = l.copieDe ? `  (même contenu que ${l.copieDe})` : l.src && l.src !== l.dest ? `  ← ${l.src}` : ''
      console.log(`  ${l.dest}${origine}`)
    }
  }
  console.log(`\n## identique (${owned.filter((l) => l.statut === STATUTS.identique).length}) : non listés`)
  console.log('\n## fichiers merge (jamais écrits : fusion manuelle)')
  for (const m of merge) {
    console.log(`  ${m.chemin} : ${m.statut}${m.stat ? ` (${m.stat})` : ''}`)
    for (const a of m.ajouts) console.log(`      + ${a}`)
    if (m.stat) console.log(`      diff : node scripts/sync-method.mjs "${cible}" --diff ${m.chemin}`)
    if (m.statut === MERGE_SANS_PART) console.log(`      aucune ligne propre au site : --take ${m.chemin} écrit la version du socle`)
  }
}

function resume(owned, merge) {
  const n = (s) => owned.filter((l) => l.statut === s).length
  const differents = merge.filter((m) => m.statut.startsWith('différent') || m.statut.startsWith('absent')).length
  return (
    `owned : ${owned.length - n(STATUTS.doublon)} — nouveau ${n(STATUTS.nouveau)}, identique ${n(STATUTS.identique)}, ` +
    `à jour sûr ${n(STATUTS.sur)}, modifié par le projet ${n(STATUTS.modifie)}, exclu ${n(STATUTS.exclu)}, ` +
    `retiré du template ${n(STATUTS.retire)}, propre au projet ${n(STATUTS.propre)}, doublon à supprimer ${n(STATUTS.doublon)} · ` +
    `merge : ${merge.length} — à fusionner ${differents}, sans part projet ${merge.filter((m) => m.statut === MERGE_SANS_PART).length}`
  )
}

function main() {
  const template = join(dirname(fileURLToPath(import.meta.url)), '..')
  const args = lireArgs(process.argv.slice(2))
  const usage = 'Usage : node scripts/sync-method.mjs <dépôt-cible> [--apply] [--take <chemin>]... [--exclude <chemin>]... | --diff <chemin>...'
  if (args.erreur) return sortir(`✖  ${args.erreur}\n${usage}`)
  if (!existsSync(join(template, MANIFESTE))) return sortir(`✖  ${MANIFESTE} absent : ce script se lance depuis le socle.`)
  if (!existsSync(join(args.cible, '.claude/conventions/_index.md'))) return sortir(`✖  ${args.cible} n'est pas un site de la méthode (pas de .claude/conventions/_index.md).`)
  if (resolve(args.cible) === resolve(template)) return sortir('✖  la cible est le template lui-même.')

  const manifeste = lireManifeste(template)
  const tampon = lireTampon(args.cible)
  const exclus = new Set([...(tampon.exclude ?? []), ...args.excludes])
  const owned = analyserOwned(template, args.cible, manifeste, { tampon, exclus })
  const merge = analyserMerge(template, args.cible, manifeste)
  const erreur = controlerChemins(args, owned, manifeste, merge)
  if (erreur) return sortir(`✖  ${erreur}`)
  if (args.diffs.size) return afficherDiffs(template, args, owned)
  const modifies = new Set(owned.filter((l) => l.statut === STATUTS.modifie).map((l) => l.dest))

  console.log(`Synchro de la méthode : ${template} → ${args.cible}${args.apply ? '' : ' (rapport seul, rien n’est écrit)'}`)
  imprimer(args.cible, owned, merge)
  console.log(`\nRésumé : ${resume(owned, merge)}`)
  if (args.apply) {
    const ecrits = appliquer(template, args.cible, owned, { takes: args.takes, exclus, merge })
    const laisses = [...modifies].filter((d) => !args.takes.has(d)).length
    console.log(`Appliqué : ${ecrits.length} fichier(s) écrit(s), ${laisses} modifié(s) par le projet laissé(s) en place, tampon ${TAMPON} écrit.`)
  }
}

/** `--take`, `--exclude` et `--diff` ne visent que des fichiers que le script connaît. */
function controlerChemins(args, owned, manifeste, merge) {
  const parStatut = (s) => new Set(owned.filter((l) => l.statut === s).map((l) => l.dest))
  const duTemplate = new Set(owned.filter((l) => l.src).map((l) => l.dest))
  const sansPart = merge.filter((m) => m.statut === MERGE_SANS_PART).map((m) => m.chemin)
  const regles = [
    [args.takes, new Set([...parStatut(STATUTS.modifie), ...sansPart]), '--take sur un fichier ni « modifié par le projet » ni « merge sans part projet »'],
    [args.excludes, duTemplate, '--exclude sur un fichier que le template ne fournit pas'],
    [args.diffs, new Set([...duTemplate, ...manifeste.merge]), '--diff sur un fichier ni owned ni merge'],
  ]
  for (const [demandes, admis, message] of regles) {
    const hors = [...demandes].filter((p) => !admis.has(p))
    if (hors.length) return `${message} : ${hors.join(', ')}`
  }
  return null
}

function afficherDiffs(template, args, owned) {
  for (const dest of args.diffs) {
    const src = owned.find((l) => l.dest === dest && l.src)?.src ?? dest
    console.log(diffUnifie(template, args.cible, src, dest))
  }
}

function sortir(message) {
  console.error(message)
  process.exitCode = 1
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) main()
