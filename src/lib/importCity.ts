/**
 * Session-only city imports (drag-and-drop / "Import file…"). Nothing here touches public/data:
 * imported cities live in App state until the page is reloaded.
 */
import type { CityData, CityIndexEntry, LngLat } from '../types';
import { importFile, slug, type ImportFileKind } from '../importer';
import { sanitizeCity } from './data';

/** Prefix for imported city ids in the switcher and the URL hash (#imported-<id>). */
export const IMPORTED_PREFIX = 'imported-';

export interface ImportedCity {
  /** Switcher entry; `entry.id` starts with IMPORTED_PREFIX, `entry.name` is the display label. */
  entry: CityIndexEntry;
  data: CityData;
  /** Source file(s), comma-separated when several files were merged onto the same city. */
  fileName: string;
  kind: ImportFileKind;
}

export interface ImportOutcome {
  city: ImportedCity;
  /** Previous version of the same imported city when the file was merged onto it in place. */
  replaces: ImportedCity | null;
  /** City to return to on Discard (the city that was on screen before). */
  returnTo: string | null;
  /** True when GeoJSON / KML was merged onto the city on screen. */
  merged: boolean;
  /** Lines / stations the file contributed. */
  lineIds: string[];
  stationCount: number;
  warnings: string[];
}

export interface ImportContext {
  /** City on screen (merge target for GeoJSON / KML). */
  base: CityData | null;
  /** Switcher id of the city on screen. */
  baseId: string | null;
  imported: readonly ImportedCity[];
  /** Ids already used by public/data cities. */
  takenIds: ReadonlySet<string>;
}

export const MAX_IMPORT_BYTES = 80 * 1024 * 1024;

export function stem(fileName: string): string {
  return fileName.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '') || fileName;
}

function centerOfStations(raw: unknown): LngLat | null {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as { stations?: unknown }).stations)) return null;
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const st of (raw as { stations: unknown[] }).stations) {
    const c = (st as { coord?: unknown } | null)?.coord;
    if (!Array.isArray(c) || typeof c[0] !== 'number' || typeof c[1] !== 'number') continue;
    w = Math.min(w, c[0]);
    e = Math.max(e, c[0]);
    s = Math.min(s, c[1]);
    n = Math.max(n, c[1]);
  }
  return Number.isFinite(w) ? [(w + e) / 2, (s + n) / 2] : null;
}

function uniqueId(want: string, taken: ReadonlySet<string>): string {
  if (!taken.has(want)) return want;
  for (let i = 2; ; i++) if (!taken.has(`${want}-${i}`)) return `${want}-${i}`;
}

/**
 * importFile() puts merged lines in group "imported". When the base already has that group (a second file
 * dropped on an imported city), rename the existing one so each file keeps its own "Imported: <file>" group.
 */
function freeImportedGroup(base: CityData): CityData {
  if (!base.groups.some((g) => g.id === 'imported')) return base;
  const taken = new Set(base.groups.map((g) => g.id));
  let n = 1;
  while (taken.has(`imported-${n}`)) n++;
  const id = `imported-${n}`;
  return {
    ...base,
    groups: base.groups.map((g) => (g.id === 'imported' ? { ...g, id } : g.parent === 'imported' ? { ...g, parent: id } : g)),
    lines: base.lines.map((l) => (l.group === 'imported' ? { ...l, group: id } : l)),
  };
}

/** Reads, converts and validates one file. Throws Error with a user-facing message on failure. */
export async function runImport(fileName: string, text: string, ctx: ImportContext): Promise<ImportOutcome> {
  if (!text.trim()) throw new Error('The file is empty.');
  if (/\.(geo)?json$/i.test(fileName)) {
    try {
      JSON.parse(text);
    } catch (e) {
      throw new Error(`The file is not valid JSON (${(e as Error).message}).`);
    }
  }
  const res = await importFile(fileName, text, ctx.base ? freeImportedGroup(ctx.base) : undefined);
  const merged = res.kind !== 'citydata' && !!ctx.base;
  const fileStem = stem(fileName);

  const { data, warnings: dataWarnings } = sanitizeCity(
    res.data,
    {
      id: slug(fileStem) || 'imported',
      name: fileStem,
      center: centerOfStations(res.data) ?? ctx.base?.center ?? [0, 0],
      zoom: 10,
    },
    fileName,
  );

  const prev = merged ? (ctx.imported.find((c) => c.entry.id === ctx.baseId) ?? null) : null;
  let id: string;
  let label: string;
  if (prev) {
    id = prev.entry.id;
    label = `${prev.entry.name} + ${fileStem}`;
  } else {
    const taken = new Set<string>([...ctx.takenIds, ...ctx.imported.map((c) => c.entry.id)]);
    id = uniqueId(IMPORTED_PREFIX + (slug(data.id) || 'city'), taken);
    label = merged && ctx.base ? `${ctx.base.name} + ${fileStem}` : data.name;
  }

  // What did the file contribute?
  let lines = data.lines;
  if (merged && ctx.base) {
    const baseLines = new Map(ctx.base.lines.map((l) => [l.id, l]));
    lines = data.lines.filter((l) => {
      const b = baseLines.get(l.id);
      return !b || JSON.stringify(b.segments) !== JSON.stringify(l.segments);
    });
  }
  const stationIds = new Set<string>();
  for (const l of lines) for (const sg of l.segments) for (const s of sg.stations) stationIds.add(s);
  const stationCount = merged ? stationIds.size : data.stations.length;

  return {
    city: {
      entry: { id, name: label, country: '', file: fileName, center: data.center, zoom: data.zoom },
      data,
      fileName: prev ? `${prev.fileName}, ${fileName}` : fileName,
      kind: res.kind,
    },
    replaces: prev,
    returnTo: ctx.baseId,
    merged,
    lineIds: lines.map((l) => l.id),
    stationCount,
    warnings: [...res.warnings, ...dataWarnings],
  };
}

/** Turns anything thrown during import into one readable sentence. */
export function importErrorMessage(e: unknown): string {
  if (e instanceof SyntaxError) return `The file is not valid JSON (${e.message}).`;
  if (e instanceof Error) return e.message || e.name;
  return String(e);
}
