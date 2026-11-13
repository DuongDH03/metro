/**
 * Lenient parsing of feature properties shared by the GeoJSON and KML importers.
 * Hand-made maps (geojson.io, Google My Maps, QGIS) use any capitalisation, free-text statuses
 * and "~2035"-style years, so everything here accepts loose input and reports what it drops.
 */
import type { Mode, Status } from '../types';

/** Canonical property names understood by the importer (lines + stations). */
export const KNOWN_PROPS = [
  'line', 'name', 'nameLocal', 'code', 'color', 'group', 'mode', 'status', 'year', 'label',
  'description', 'opened', 'lengthKm', 'sources', 'id', 'from', 'to', 'codes', 'approx', 'stations',
] as const;
export type KnownProp = (typeof KNOWN_PROPS)[number];

/** Alternative spellings -> canonical prop (keys already passed through propKey()). */
const ALIASES: Record<string, KnownProp> = {
  stroke: 'color',
  colour: 'color',
  strokecolor: 'color',
  linecolor: 'color',
  localname: 'nameLocal',
  namelocal: 'nameLocal',
  lengthkm: 'lengthKm',
  source: 'sources',
  ref: 'code',
  stationcodes: 'codes',
  approximate: 'approx',
};
for (const p of KNOWN_PROPS) ALIASES[propKey(p)] ??= p;

/** Comparison key for property names: "Name Local", "name_local", "nameLocal" -> "namelocal". */
export function propKey(k: string): string {
  return k.toLowerCase().replace(/[\s_\-.]+/g, '');
}

/** Canonical prop for a raw key, or undefined when the key is not one we use. */
export function canonicalProp(rawKey: string): KnownProp | undefined {
  return ALIASES[propKey(rawKey)];
}

/**
 * Map raw feature properties onto canonical names (case / separator insensitive, aliases).
 * A key spelled like the canonical name ("Color") beats an alias ("stroke"); otherwise the
 * first non-empty value wins.
 */
export function readProps(raw: Record<string, unknown> | null | undefined): Partial<Record<KnownProp, unknown>> {
  const out: Partial<Record<KnownProp, unknown>> = {};
  const entries = Object.entries(raw ?? {});
  for (const exact of [true, false]) {
    for (const [k, v] of entries) {
      const c = canonicalProp(k);
      if (!c || isEmpty(v) || !isEmpty(out[c])) continue;
      if (exact !== (propKey(k) === propKey(c))) continue;
      out[c] = v;
    }
  }
  return out;
}

export function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
}

/** Trimmed string, or undefined for empty / non-scalar values. */
export function str(v: unknown): string | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s || undefined;
}

export function num(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  const s = str(v);
  if (!s) return undefined;
  const n = Number(s.replace(/,/g, '.').replace(/[^\d.+-]/g, ''));
  return Number.isFinite(n) && /\d/.test(s) ? n : undefined;
}

/** true / "true" / "yes" / "1" / "y" / "x" -> true. */
export function bool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  return /^(true|yes|y|1|x|on)$/i.test(str(v) ?? '');
}

/** Array or comma / semicolon separated list -> trimmed non-empty strings. */
export function list(v: unknown): string[] | undefined {
  const items = Array.isArray(v) ? v.map(str) : (str(v)?.split(/[,;]/) ?? []).map((s) => s.trim());
  const out = items.filter((s): s is string => !!s);
  return out.length ? out : undefined;
}

/** 4-digit year from 2035, "2035", "~2035", "2030s" (-> 2030), "FY2031", "2030-2035" (-> 2030). */
export function year(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) && v >= 1800 && v <= 2300 ? Math.round(v) : undefined;
  const m = /(1[89]\d\d|2[0-2]\d\d)/.exec(str(v) ?? '');
  return m ? Number(m[1]) : undefined;
}

/** "#abc" / "#aabbcc" / "aabbcc" -> "#aabbcc" (lowercase); anything else -> undefined. */
export function color(v: unknown): string | undefined {
  const s = str(v)?.replace(/^#/, '').toLowerCase();
  if (!s) return undefined;
  if (/^[0-9a-f]{6}$/.test(s)) return `#${s}`;
  if (/^[0-9a-f]{3}$/.test(s)) return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
  return undefined;
}

/** KML colors are aabbggrr; returns "#rrggbb" or undefined. */
export function kmlColor(v: unknown): string | undefined {
  const s = str(v)?.replace(/^#/, '').toLowerCase();
  if (!s || !/^[0-9a-f]{8}$/.test(s)) return undefined;
  return `#${s.slice(6, 8)}${s.slice(4, 6)}${s.slice(2, 4)}`;
}

const STATUS_ALIASES: Record<Status, string[]> = {
  operating: ['operating', 'open', 'opened', 'existing', 'in service', 'đang khai thác', 'khai thác', '営業中'],
  construction: ['construction', 'under construction', 'building', 'đang xây dựng', 'xây dựng', '工事中', '建設中'],
  approved: ['approved', 'funded', 'phê duyệt', 'đã phê duyệt'],
  planned: ['planned', 'plan', 'quy hoạch', '計画'],
  proposed: ['proposed', 'concept', 'idea', 'fantasy', 'vision', 'study', 'đề xuất', '構想'],
};
const statusKey = (s: string) => s.normalize('NFC').toLowerCase().replace(/[\s_-]+/g, ' ').trim();
const STATUS_LOOKUP = new Map<string, Status>(
  (Object.entries(STATUS_ALIASES) as [Status, string[]][]).flatMap(([st, names]) =>
    names.map((n) => [statusKey(n), st] as const),
  ),
);

/** Lenient status. `unknown` is set when a non-empty value could not be understood. */
export function status(v: unknown): { status?: Status; unknown?: string } {
  const s = str(v);
  if (!s) return {};
  const st = STATUS_LOOKUP.get(statusKey(s));
  return st ? { status: st } : { unknown: s };
}

const MODE_ALIASES: Record<string, Mode> = {
  metro: 'metro', subway: 'metro', underground: 'metro', mrt: 'metro', 'heavy rail': 'metro',
  commuter: 'commuter', train: 'commuter', rail: 'commuter', railway: 'commuter', suburban: 'commuter', regional: 'commuter',
  lrt: 'lrt', 'light rail': 'lrt', light_rail: 'lrt', lightrail: 'lrt',
  monorail: 'monorail',
  tram: 'tram', streetcar: 'tram', tramway: 'tram',
  agt: 'agt', 'people mover': 'agt', apm: 'agt',
  shinkansen: 'shinkansen', hsr: 'shinkansen', 'high speed': 'shinkansen', 'high-speed rail': 'shinkansen', 'high speed rail': 'shinkansen',
};

/** Lenient mode. `unknown` is set when a non-empty value could not be understood. */
export function mode(v: unknown): { mode?: Mode; unknown?: string } {
  const s = str(v);
  if (!s) return {};
  const m = MODE_ALIASES[s.toLowerCase()] ?? MODE_ALIASES[s.toLowerCase().replace(/[_-]+/g, ' ')];
  return m ? { mode: m } : { unknown: s };
}

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const isKebabId = (s: string) => ID_RE.test(s);
