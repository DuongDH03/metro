import type { CityData, CityIndexEntry, Group, Line, LngLat, Segment, Source, Station, Status } from '../types';
import { STATUS_ORDER } from '../types';

const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

export function dataUrl(file: string): string {
  return BASE + file.replace(/^\/+/, '');
}

/** Dev/test-only city, added to the list when the page URL has `?fixture`. */
export const FIXTURE_ENTRY: CityIndexEntry = {
  id: 'fixture',
  name: 'Fixtureville (test data)',
  nameLocal: 'Test',
  country: 'Nowhere',
  file: 'data/_fixture.json',
  center: [100.5, 15.0],
  zoom: 11.5,
};

export function wantsFixture(): boolean {
  try {
    return new URLSearchParams(window.location.search).has('fixture');
  } catch {
    return false;
  }
}

export class DataError extends Error {
  readonly kind: 'missing' | 'broken' | 'network';
  constructor(kind: 'missing' | 'broken' | 'network', message: string) {
    super(message);
    this.kind = kind;
  }
}

async function fetchJson(url: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new DataError('network', `Network error while loading ${url}: ${(e as Error).message}`);
  }
  if (res.status === 404) throw new DataError('missing', `${url} was not found (404).`);
  if (!res.ok) throw new DataError('network', `${url} returned HTTP ${res.status}.`);
  const text = await res.text();
  // Dev servers / SPA hosts return index.html for missing files.
  if (/^\s*</.test(text)) throw new DataError('missing', `${url} does not exist yet.`);
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new DataError('broken', `${url} is not valid JSON: ${(e as Error).message}`);
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isCoord = (v: unknown): v is LngLat =>
  Array.isArray(v) && v.length >= 2 && isNum(v[0]) && isNum(v[1]) && Math.abs(v[1]) <= 90 && Math.abs(v[0]) <= 180;
const isStatus = (v: unknown): v is Status => typeof v === 'string' && (STATUS_ORDER as string[]).includes(v);
const optStr = (v: unknown): string | undefined => (isStr(v) ? v : undefined);

export async function loadCityIndex(): Promise<CityIndexEntry[]> {
  const raw = await fetchJson(dataUrl('data/cities.json'));
  if (!Array.isArray(raw)) throw new DataError('broken', 'cities.json must be an array.');
  const list: CityIndexEntry[] = [];
  for (const c of raw) {
    if (!isObj(c) || !isStr(c.id) || !isStr(c.file)) continue;
    list.push({
      id: c.id,
      name: isStr(c.name) ? c.name : c.id,
      nameLocal: optStr(c.nameLocal),
      country: isStr(c.country) ? c.country : '',
      file: c.file,
      center: isCoord(c.center) ? [c.center[0], c.center[1]] : [0, 0],
      zoom: isNum(c.zoom) ? c.zoom : 10,
    });
  }
  if (wantsFixture() && !list.some((c) => c.id === FIXTURE_ENTRY.id)) list.push(FIXTURE_ENTRY);
  return list;
}

/**
 * Fetches and sanitises a city file. Invalid pieces are dropped (with console warnings)
 * instead of crashing the UI, so a half-finished data file still renders.
 */
export async function loadCity(entry: CityIndexEntry): Promise<CityData> {
  const raw = await fetchJson(dataUrl(entry.file));
  const { data, warnings } = sanitizeCity(raw, entry, entry.file);
  if (warnings.length) {
    console.warn(`[metro] ${entry.id}: ${warnings.length} data issue(s)`, warnings.slice(0, 50));
  }
  return data;
}

/** Fallback metadata used when the raw city lacks id / name / center / zoom. */
export type CityFallback = Pick<CityIndexEntry, 'id' | 'name' | 'nameLocal' | 'center' | 'zoom'>;

/**
 * Validates untrusted CityData (fetched or user-imported). Invalid pieces are dropped and reported in
 * `warnings`; throws DataError('broken') only when nothing usable is left.
 */
export function sanitizeCity(raw: unknown, entry: CityFallback, label = entry.id): { data: CityData; warnings: string[] } {
  if (!isObj(raw)) throw new DataError('broken', `${label} is not a JSON object.`);
  const warnings: string[] = [];
  const warn = (m: string) => warnings.push(m);

  const stations: Station[] = [];
  const stationIds = new Set<string>();
  for (const s of Array.isArray(raw.stations) ? raw.stations : []) {
    if (!isObj(s) || !isStr(s.id)) {
      warn('station without id');
      continue;
    }
    if (!isCoord(s.coord)) {
      warn(`station ${s.id}: bad coord`);
      continue;
    }
    if (stationIds.has(s.id)) {
      warn(`duplicate station ${s.id}`);
      continue;
    }
    stationIds.add(s.id);
    stations.push({
      id: s.id,
      name: isStr(s.name) ? s.name : s.id,
      nameLocal: optStr(s.nameLocal),
      coord: [s.coord[0], s.coord[1]],
      ...(s.approx === true ? { approx: true } : {}),
      codes: Array.isArray(s.codes) ? s.codes.filter(isStr) : undefined,
    });
  }

  const groups: Group[] = [];
  for (const g of Array.isArray(raw.groups) ? raw.groups : []) {
    if (!isObj(g) || !isStr(g.id)) continue;
    groups.push({
      id: g.id,
      name: isStr(g.name) ? g.name : g.id,
      nameLocal: optStr(g.nameLocal),
      parent: optStr(g.parent),
      color: optStr(g.color),
      description: optStr(g.description),
    });
  }

  const lines: Line[] = [];
  const lineIds = new Set<string>();
  for (const l of Array.isArray(raw.lines) ? raw.lines : []) {
    if (!isObj(l) || !isStr(l.id)) {
      warn('line without id');
      continue;
    }
    if (lineIds.has(l.id)) {
      warn(`duplicate line ${l.id}`);
      continue;
    }
    const segments: Segment[] = [];
    for (const sg of Array.isArray(l.segments) ? l.segments : []) {
      if (!isObj(sg) || !Array.isArray(sg.stations)) continue;
      const ids = sg.stations.filter((x): x is string => isStr(x) && stationIds.has(x));
      if (ids.length !== sg.stations.length) warn(`line ${l.id}: segment references unknown stations`);
      const path = Array.isArray(sg.path) ? sg.path.filter(isCoord).map((c): LngLat => [c[0], c[1]]) : undefined;
      if (ids.length < 2 && !(path && path.length >= 2)) continue;
      segments.push({
        stations: ids,
        status: isStatus(sg.status) ? sg.status : isStatus(l.status) ? l.status : 'proposed',
        year: isNum(sg.year) ? Math.round(sg.year) : undefined,
        path: path && path.length >= 2 ? path : undefined,
        label: optStr(sg.label),
      });
    }
    if (!segments.length) {
      warn(`line ${l.id}: no drawable segments`);
    }
    const bestSeg = STATUS_ORDER.find((s) => segments.some((sg) => sg.status === s));
    lineIds.add(l.id);
    lines.push({
      id: l.id,
      code: isStr(l.code) || isNum(l.code) ? String(l.code) : undefined,
      name: isStr(l.name) ? l.name : l.id,
      nameLocal: optStr(l.nameLocal),
      group: isStr(l.group) ? l.group : '',
      color: isStr(l.color) ? l.color : '#888888',
      textColor: optStr(l.textColor),
      mode: optStr(l.mode) as Line['mode'],
      status: isStatus(l.status) ? l.status : (bestSeg ?? 'proposed'),
      opened: isNum(l.opened) ? l.opened : undefined,
      lengthKm: isNum(l.lengthKm) ? l.lengthKm : undefined,
      description: optStr(l.description),
      segments,
      sources: Array.isArray(l.sources) ? l.sources.filter(isStr) : undefined,
    });
  }

  const sources: Source[] = [];
  for (const s of Array.isArray(raw.sources) ? raw.sources : []) {
    if (!isObj(s) || !isStr(s.id)) continue;
    sources.push({
      id: s.id,
      title: isStr(s.title) ? s.title : s.id,
      url: isStr(s.url) && /^https?:\/\//i.test(s.url) ? s.url : '',
      accessed: optStr(s.accessed),
    });
  }

  let timeline: CityData['timeline'];
  if (isObj(raw.timeline) && isNum(raw.timeline.min) && isNum(raw.timeline.max) && raw.timeline.max >= raw.timeline.min) {
    timeline = { min: Math.round(raw.timeline.min), max: Math.round(raw.timeline.max) };
  }

  if (!lines.length && !stations.length) {
    throw new DataError('broken', `${label} contains no usable lines or stations.`);
  }

  const data: CityData = {
    id: isStr(raw.id) ? raw.id : entry.id,
    name: isStr(raw.name) ? raw.name : entry.name,
    nameLocal: optStr(raw.nameLocal) ?? entry.nameLocal,
    center: isCoord(raw.center) ? [raw.center[0], raw.center[1]] : entry.center,
    zoom: isNum(raw.zoom) ? raw.zoom : entry.zoom,
    updated: isStr(raw.updated) ? raw.updated : '',
    timeline,
    groups,
    lines,
    stations,
    sources,
    notes: optStr(raw.notes),
  };
  return { data, warnings };
}
