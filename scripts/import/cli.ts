/**
 * City-data importer CLI: city.config.json -> public/data/<id>.json (+ cities.json entry).
 * Run `npm run import -- --help` for usage.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { CityData, CityIndexEntry, LngLat } from '../../src/types';
import { applyDefaults, geojsonToDrafts } from '../../src/importer/geojson';
import { kmlToGeoJSON } from '../../src/importer/kml';
import { normalize } from '../../src/importer/normalize';
import type { CityConfig, DraftResult, ImportSpec } from '../../src/importer/types';
import { ConfigError, loadConfig } from './config';
import type { Adapter, ImportContext } from './context';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '../..');
/** Where the user typed the command (npm run changes cwd to the project root). */
const CWD = process.env.INIT_CWD ?? process.cwd();
const VALIDATOR = join(ROOT, 'scripts/validate-data.mjs');

const USAGE = `Usage: npm run import -- <city> [options]

  <city>          city id (cities/<id>/city.config.json), a folder holding
                  city.config.json, or a path to a config file. Several allowed.

Options:
  --dry           build and validate, write nothing
  --out <file>    write the CityData to <file> instead of public/data
                  (cities.json is not touched)
  --refresh       ignore download caches (OSM)
  --all           import every cities/*/city.config.json
  --new <id>      scaffold cities/<id>/ (config + starter lines.geojson)
      --name <name>        city name for --new (default: from the id)
      --center <lng,lat>   map center for --new (default: 0,0)
  -h, --help      show this help

Examples:
  npm run import -- singapore
  npm run import -- examples/drawn-city --out ./drawn.json
  npm run import -- --new da-nang --name "Da Nang" --center 108.21,16.06`;

interface Flags {
  targets: string[];
  dry: boolean;
  out?: string;
  refresh: boolean;
  all: boolean;
  newId?: string;
  name?: string;
  center?: string;
  help: boolean;
}

function parseArgs(argv: string[]): Flags {
  const f: Flags = { targets: [], dry: false, refresh: false, all: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new UsageError(`${a} needs a value`);
      return v;
    };
    if (a === '--dry' || a === '--dry-run') f.dry = true;
    else if (a === '--out') f.out = value();
    else if (a === '--refresh') f.refresh = true;
    else if (a === '--all') f.all = true;
    else if (a === '--new') f.newId = value();
    else if (a === '--name') f.name = value();
    else if (a === '--center') f.center = value();
    else if (a === '-h' || a === '--help') f.help = true;
    else if (a.startsWith('-')) throw new UsageError(`unknown option ${a}`);
    else f.targets.push(a);
  }
  return f;
}

class UsageError extends Error {}

// ---------- target resolution ----------

function resolveTarget(t: string): string {
  const byId = join(ROOT, 'cities', t, 'city.config.json');
  if (/^[a-z0-9-]+$/.test(t) && existsSync(byId)) return byId;
  const p = resolve(CWD, t);
  if (existsSync(p)) return statSync(p).isDirectory() ? join(p, 'city.config.json') : p;
  if (/^[a-z0-9-]+$/.test(t)) {
    // Hanoi / HCMC / Tokyo predate the importer and keep their own curated pipelines.
    if (existsSync(join(ROOT, 'scripts', t)))
      throw new UsageError(
        `"${t}" is built by its own pipeline in scripts/${t}/, not by the importer: run \`npm run data:${t}\` (see docs/IMPORTING.md, "Updating Hanoi, HCMC and Tokyo")`,
      );
    throw new UsageError(`no city "${t}": expected ${rel(byId)} (create it with --new ${t})`);
  }
  throw new UsageError(`not found: ${t}`);
}

function allConfigs(): string[] {
  const dir = join(ROOT, 'cities');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map((d) => join(dir, d, 'city.config.json'))
    .filter((f) => existsSync(f));
}

const rel = (p: string) => relative(CWD, p) || '.';

// ---------- import ----------

type OsmSpec = Extract<ImportSpec, { type: 'osm' }>;

async function loadOsmAdapter(): Promise<Adapter<OsmSpec>> {
  const file = join(here, 'osm.ts');
  if (!existsSync(file)) throw new Error('OSM adapter not available (scripts/import/osm.ts is missing)');
  // Variable specifier: osm.ts is optional at type-check time.
  const mod = (await import(pathToFileURL(file).href)) as { importOsm?: Adapter<OsmSpec> };
  if (typeof mod.importOsm !== 'function') throw new Error('OSM adapter not available (osm.ts does not export importOsm)');
  return mod.importOsm;
}

async function runImport(spec: ImportSpec, ctx: ImportContext): Promise<DraftResult> {
  if (spec.type === 'osm') {
    mkdirSync(ctx.cacheDir, { recursive: true });
    const res = await (await loadOsmAdapter())(spec, ctx);
    for (const l of res.lines) applyDefaults(l, spec.defaults);
    return res;
  }
  const file = join(ctx.cityDir, spec.file);
  const text = readFileSync(file, 'utf8').replace(/^﻿/, '');
  let geojson: unknown;
  if (spec.type === 'kml') {
    const { DOMParser } = await import('@xmldom/xmldom');
    // Collect XML errors quietly (xmldom logs them by default) and report the first one.
    let xmlError: string | undefined;
    const parser = new DOMParser({
      onError: (level, msg) => {
        if (level !== 'warning') xmlError ??= msg.trim();
      },
    });
    try {
      geojson = kmlToGeoJSON(text, parser);
    } catch (e) {
      throw new Error(`${spec.file}: ${xmlError ? `invalid XML: ${xmlError}` : (e as Error).message}`);
    }
    if (xmlError) throw new Error(`${spec.file}: invalid XML: ${xmlError}`);
  } else {
    try {
      geojson = JSON.parse(text);
    } catch (e) {
      throw new Error(`${spec.file}: invalid JSON (${(e as Error).message})`);
    }
  }
  return geojsonToDrafts(geojson, {
    defaults: spec.defaults,
    sourceName: spec.file,
    snapMeters: ctx.config.options?.snapMeters,
  });
}

interface RunResult {
  ok: boolean;
}

async function runCity(configFile: string, flags: Flags): Promise<RunResult> {
  const { config, dir, warnings: cfgWarnings } = loadConfig(configFile, ROOT);
  console.log(`\n== ${config.id} (${rel(configFile)})`);
  for (const w of cfgWarnings) console.log(`  warn  ${w}`);

  const ctx: ImportContext = {
    root: ROOT,
    cityDir: dir,
    cacheDir: join(dir, '.cache'),
    config,
    refresh: flags.refresh,
    log: (m) => console.log(`  ${m}`),
  };
  const drafts: DraftResult[] = [];
  for (const [i, spec] of config.imports.entries()) {
    const what = spec.type === 'osm' ? 'osm' : `${spec.type} ${spec.file}`;
    const res = await runImport(spec, ctx);
    console.log(`  imports[${i}] ${what}: ${res.lines.length} line(s), ${res.lines.reduce((n, l) => n + l.segments.length, 0)} segment(s)`);
    drafts.push(res);
  }

  const base = config.base ? (JSON.parse(readFileSync(join(ROOT, config.base), 'utf8')) as CityData) : undefined;
  const { data, warnings } = normalize({
    drafts,
    base,
    meta: {
      id: config.id,
      name: config.name,
      nameLocal: config.nameLocal,
      center: config.center,
      zoom: config.zoom,
      timeline: config.timeline,
      notes: config.notes,
      updated: localDate(),
    },
    groups: config.groups,
    sources: config.sources,
    overrides: config.lines,
    options: config.options,
  });
  // Without an explicit timeline, widen the base's range so imported years stay reachable.
  if (!config.timeline && data.timeline) {
    const ys = data.lines.flatMap((l) => l.segments.map((s) => s.year)).filter((y): y is number => y !== undefined);
    data.timeline = { min: Math.min(data.timeline.min, ...ys), max: Math.max(data.timeline.max, ...ys) };
  }

  for (const w of warnings) console.log(`  warn  ${w}`);
  const json = formatCityData(data);
  const entry = indexEntry(config);
  const baseLines = base?.lines.length ?? 0;
  console.log(
    `  => ${data.lines.length} lines${base ? ` (${baseLines} from base)` : ''}, ` +
      `${data.lines.reduce((n, l) => n + l.segments.length, 0)} segments, ${data.stations.length} stations, ` +
      `${(Buffer.byteLength(json) / 1024).toFixed(1)} KB, ${warnings.length} warning(s)`,
  );

  let status: number;
  if (flags.dry || flags.out) {
    if (flags.out) {
      const out = resolve(CWD, flags.out);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, json);
      console.log(`  wrote ${rel(out)}`);
    } else console.log('  dry run: nothing written');
    status = validateDetached(entry, json);
  } else {
    const out = join(ROOT, 'public/data', `${config.id}.json`);
    writeFileSync(out, json);
    upsertIndex(entry);
    // Refresh every city's bbox (used for "switch to this city" suggestions when panning).
    spawnSync(process.execPath, [join(ROOT, 'scripts/update-index.mjs')], { stdio: 'ignore' });
    console.log(`  wrote ${rel(out)} and updated ${rel(join(ROOT, 'public/data/cities.json'))}`);
    status = spawnSync(process.execPath, [VALIDATOR, config.id], { stdio: 'inherit' }).status ?? 1;
  }
  return { ok: status === 0 };
}

// ---------- output ----------

/** Today as YYYY-MM-DD in local time (toISOString would give the UTC date). */
function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Indented JSON with every scalar array (coordinates, station id lists) on one line. */
export function formatCityData(data: CityData): string {
  // Newlines never occur inside JSON strings, so removing "\n + indent" keeps the JSON valid.
  return JSON.stringify(data, null, 1).replace(/\[[^[\]{}]*\]/g, (m) => m.replace(/\n\s*/g, '')) + '\n';
}

function indexEntry(c: CityConfig): CityIndexEntry {
  return {
    id: c.id,
    name: c.name,
    ...(c.nameLocal ? { nameLocal: c.nameLocal } : {}),
    country: c.country,
    file: `data/${c.id}.json`,
    center: c.center,
    zoom: c.zoom,
  };
}

function formatEntry(e: CityIndexEntry): string {
  const parts = Object.entries(e).map(([k, v]) => `"${k}": ${Array.isArray(v) ? `[${v.join(', ')}]` : JSON.stringify(v)}`);
  return `  { ${parts.join(', ')} }`;
}

/** Replace or append the entry; untouched entries keep their exact original line. */
function upsertIndex(entry: CityIndexEntry) {
  const file = join(ROOT, 'public/data/cities.json');
  const text = existsSync(file) ? readFileSync(file, 'utf8') : '[]';
  const list = JSON.parse(text) as CityIndexEntry[];
  const original = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim().replace(/,$/, '');
    if (!t.startsWith('{') || !t.endsWith('}')) continue;
    try {
      original.set((JSON.parse(t) as CityIndexEntry).id, line.replace(/,\s*$/, ''));
    } catch {
      /* multi-line entry: reformatted below */
    }
  }
  const i = list.findIndex((e) => e.id === entry.id);
  if (i >= 0) list[i] = entry;
  else list.push(entry);
  const lines = list.map((e) => (e === entry ? formatEntry(e) : (original.get(e.id) ?? formatEntry(e))));
  writeFileSync(file, `[\n${lines.join(',\n')}\n]\n`);
}

/** Run the real validator on output that is not registered in cities.json, in a temp sandbox. */
function validateDetached(entry: CityIndexEntry, json: string): number {
  const box = mkdtempSync(join(tmpdir(), 'metro-validate-'));
  try {
    mkdirSync(join(box, 'scripts'));
    mkdirSync(join(box, 'public/data'), { recursive: true });
    copyFileSync(VALIDATOR, join(box, 'scripts/validate-data.mjs'));
    writeFileSync(join(box, 'public/data/cities.json'), JSON.stringify([entry]));
    writeFileSync(join(box, 'public', entry.file), json);
    return spawnSync(process.execPath, [join(box, 'scripts/validate-data.mjs'), entry.id], { stdio: 'inherit' }).status ?? 1;
  } finally {
    rmSync(box, { recursive: true, force: true });
  }
}

// ---------- --new ----------

function scaffold(id: string, flags: Flags) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) throw new UsageError(`--new: "${id}" is not a kebab-case id (e.g. "da-nang")`);
  const dir = join(ROOT, 'cities', id);
  if (existsSync(dir)) throw new UsageError(`${rel(dir)} already exists`);
  let center: LngLat = [0, 0];
  if (flags.center) {
    const c = flags.center.split(',').map(Number);
    if (c.length !== 2 || c.some((n) => !Number.isFinite(n)) || Math.abs(c[0]) > 180 || Math.abs(c[1]) > 90) {
      throw new UsageError(`--center: expected "lng,lat", got "${flags.center}"`);
    }
    center = [c[0], c[1]];
  }
  const tpl = join(here, 'template');
  const cfg = JSON.parse(readFileSync(join(tpl, 'city.config.json'), 'utf8')) as CityConfig;
  cfg.id = id;
  cfg.name = flags.name ?? id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  cfg.center = center;
  // Starter geometry is drawn around [0, 0]; move it to the city center.
  const lines = readFileSync(join(tpl, 'lines.geojson'), 'utf8').replace(
    /\[(-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?)\]/g,
    (_, x, y) => `[${(Number(x) + center[0]).toFixed(5)}, ${(Number(y) + center[1]).toFixed(5)}]`,
  );
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'city.config.json'), JSON.stringify(cfg, null, 2).replace(/\[[^[\]{}]*\]/g, (m) => m.replace(/\n\s*/g, ' ').replace(/\[ /, '[').replace(/ \]/, ']')) + '\n');
  writeFileSync(join(dir, 'lines.geojson'), lines);
  console.log(`Created ${rel(join(dir, 'city.config.json'))} and lines.geojson
Next steps:
  1. Edit ${rel(join(dir, 'city.config.json'))} (VS Code explains every field via "$schema")${flags.center ? '' : ', set "center"'}.
  2. Draw lines at https://geojson.io (LineStrings = lines, Points = stations) and save over
     lines.geojson, or add a Google My Maps KML export as { "type": "kml", "file": "map.kml" }.
  3. npm run import -- ${id} --dry     (check warnings)
  4. npm run import -- ${id}           (writes public/data/${id}.json and registers it)
  5. npm run dev`);
}

// ---------- main ----------

async function main(): Promise<number> {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    console.log(USAGE);
    return 0;
  }
  if (flags.newId) {
    scaffold(flags.newId, flags);
    return 0;
  }
  const files = flags.all ? allConfigs() : flags.targets.map(resolveTarget);
  if (flags.all && flags.targets.length) throw new UsageError('--all takes no city arguments');
  if (!files.length) throw new UsageError(flags.all ? 'no cities/*/city.config.json found' : 'missing <city>');
  if (flags.out && files.length > 1) throw new UsageError('--out works with a single city');
  let failed = 0;
  for (const f of files) {
    try {
      if (!(await runCity(f, flags)).ok) failed++;
    } catch (e) {
      failed++;
      if (e instanceof ConfigError) console.error(`\nconfig error in ${rel(e.file)}:\n${e.problems.map((p) => `  - ${p}`).join('\n')}`);
      else console.error(`\nerror (${rel(f)}): ${process.env.DEBUG ? (e as Error).stack : (e as Error).message}`);
    }
  }
  if (files.length > 1) console.log(`\n${files.length - failed}/${files.length} cities OK`);
  return failed ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (e) => {
    if (e instanceof UsageError) console.error(`error: ${e.message}\n\n${USAGE}`);
    else console.error(e);
    process.exit(1);
  },
);
