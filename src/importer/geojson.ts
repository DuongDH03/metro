/**
 * GeoJSON -> DraftResult. Conventions (also used for KML, which is converted to GeoJSON first):
 *
 * - LineString / MultiLineString = a line or one segment of it. Features sharing the `line`
 *   property (default: `name`) are segments of the same line, in file order; each part of a
 *   MultiLineString is its own segment. Line-level props: first non-empty value wins.
 *   `status`, `year`, `label`, `from`, `to` are per segment.
 * - Point = station. Attaches to the lines listed in `line` (comma list), otherwise to every
 *   segment drawn within `snapMeters`. Stations are ordered along the drawn geometry.
 *   A Point with `line` attaches only to those lines: their segments within snap distance, else
 *   the nearest segment up to 1 km.
 * - A LineString with `stations` ("a,b,c" or an array of Point ids / names) uses exactly that
 *   ordered list and its drawn geometry as is (no snapping, no trimming).
 * - Segment ends without a station get an approximate auto station (named by `from` / `to`).
 */
import type { Group, LngLat } from '../types';
import { distM, pathLengthM, projectOnPath, slicePath } from './geo';
import type { GeoJsonToDrafts } from './index';
import * as P from './props';
import type { DraftLine, DraftSegment, DraftStation, LineDefaults } from './types';
import { slug } from './normalize';

type Json = Record<string, unknown>;

/** A Point that names its line attaches to it up to this far from the drawn geometry. */
const MAX_ASSIGN_M = 1000;

interface RawLine {
  props: ReturnType<typeof P.readProps>;
  path: LngLat[];
  where: string;
}

interface RawPoint {
  station: DraftStation;
  /** The Point's `id` as written (matched by `stations` lists). */
  rawId?: string;
  /** Restrict to these line keys / names / codes (lowercased). */
  only?: string[];
  attached: boolean;
  /** A specific "not attached" warning was already given. */
  reported?: boolean;
  where: string;
}

export const geojsonToDrafts: GeoJsonToDrafts = (geojson, opts = {}) => {
  const warnings: string[] = [];
  const prefix = opts.sourceName ? `${opts.sourceName}: ` : '';
  const warn = (msg: string) => warnings.push(prefix + msg);
  const snap = opts.snapMeters ?? 150;

  // ---------- collect features ----------
  const lineFeatures: RawLine[] = [];
  const points: RawPoint[] = [];
  const features = asFeatures(geojson);
  features.forEach((f, i) => {
    const props = P.readProps(isObj(f.properties) ? (f.properties as Json) : {});
    const label = P.str(props.name) ?? P.str(props.line);
    const where = `feature #${i + 1}${label ? ` "${label}"` : ''}`;
    for (const g of flattenGeometry(f.geometry)) {
      const c = g.coordinates;
      switch (g.type) {
        case 'LineString':
          addLine(c, props, where);
          break;
        case 'MultiLineString':
          if (Array.isArray(c)) for (const part of c) addLine(part, props, where);
          break;
        case 'Point':
          addPoint(c, props, where);
          break;
        case 'MultiPoint':
          if (Array.isArray(c)) for (const p of c) addPoint(p, props, where);
          break;
        default:
          warn(`${where}: ${g.type ?? 'missing'} geometry skipped (use LineString for lines, Point for stations)`);
      }
    }
    if (!f.geometry) warn(`${where}: no geometry, skipped`);
  });

  function addLine(coords: unknown, props: RawLine['props'], where: string) {
    const path = toPath(coords);
    if (path.length < 2 || pathLengthM(path) < 1) warn(`${where}: line with fewer than 2 distinct points skipped`);
    else lineFeatures.push({ props, path, where });
  }
  function addPoint(coords: unknown, props: RawLine['props'], where: string) {
    const coord = toCoord(coords);
    const name = P.str(props.name) ?? P.str(props.nameLocal);
    if (!coord) return warn(`${where}: bad point coordinates, skipped`);
    if (!name) return warn(`${where}: station without a name, skipped`);
    const st: DraftStation = { name, coord, key: `geojson-pt:${points.length}` };
    const nameLocal = P.str(props.nameLocal);
    if (nameLocal && nameLocal !== name) st.nameLocal = nameLocal;
    if (P.bool(props.approx)) st.approx = true;
    const codes = P.list(props.codes);
    if (codes) st.codes = codes;
    const id = P.str(props.id);
    if (id) st.id = slug(id) || undefined;
    points.push({ station: st, rawId: id, only: P.list(props.line)?.map((s) => s.toLowerCase()), attached: false, where });
  }

  // ---------- group line features into lines ----------
  const groups: Group[] = [];
  const groupIds = new Set<string>();
  const lines = new Map<string, { draft: DraftLine; parts: RawLine[] }>();
  let unnamed = 0;
  for (const lf of lineFeatures) {
    const key = P.str(lf.props.line) ?? P.str(lf.props.name) ?? `Line ${++unnamed}`;
    let entry = lines.get(key);
    if (!entry) {
      entry = { draft: { key, name: '', segments: [] }, parts: [] };
      lines.set(key, entry);
    }
    entry.parts.push(lf);
    fillLineProps(entry.draft, lf);
  }

  /** Line-level props: first non-empty value wins. */
  function fillLineProps(d: DraftLine, lf: RawLine) {
    const p = lf.props;
    const set = <K extends keyof DraftLine>(k: K, v: DraftLine[K] | undefined) => {
      if (v !== undefined && (d[k] === undefined || d[k] === '')) d[k] = v;
    };
    set('name', P.str(p.name));
    set('nameLocal', P.str(p.nameLocal));
    set('code', P.str(p.code));
    set('description', P.str(p.description));
    set('opened', P.year(p.opened));
    set('lengthKm', P.num(p.lengthKm));
    set('sources', P.list(p.sources));
    if (!d.id && P.str(p.id)) d.id = slug(P.str(p.id)) || undefined;
    if (!d.color && !P.isEmpty(p.color)) {
      const c = P.color(p.color);
      if (c) d.color = c;
      else warn(`${lf.where}: color "${P.str(p.color)}" is not #rgb / #rrggbb, ignored`);
    }
    if (!d.mode && !P.isEmpty(p.mode)) {
      const m = P.mode(p.mode);
      if (m.mode) d.mode = m.mode;
      else warn(`${lf.where}: unknown mode "${m.unknown}", ignored`);
    }
    const g = P.str(p.group);
    if (!d.group && g) d.group = groupId(g);
  }

  /** Group values that are not ids (e.g. a My Maps layer "Fan lines") become slug ids + a Group. */
  function groupId(g: string): string {
    if (P.isKebabId(g)) return g;
    const id = slug(g) || 'imported';
    if (!groupIds.has(id)) {
      groupIds.add(id);
      groups.push({ id, name: g });
    }
    return id;
  }

  // ---------- build segments ----------
  const autoStations: DraftStation[] = [];
  let autoN = 0;
  const autoStation = (coord: LngLat, name: string, end: 'start' | 'end', where: string): DraftStation => {
    // Reuse an auto station already made here (segment boundaries, lines meeting at their ends).
    const near = autoStations.find((s) => distM(s.coord, coord) <= snap);
    if (near) return near;
    const st: DraftStation = { name, coord, approx: true, key: `geojson-auto:${autoN++}` };
    autoStations.push(st);
    warn(`${where}: no station within ${snap} m of the ${end}, added approximate station "${name}"`);
    return st;
  };

  // Line identities a Point's `line` list may use: key, name, code, id (lowercased).
  const lineList = [...lines.values()];
  for (const { draft } of lineList) if (!draft.name) draft.name = draft.key;
  const lineIds = (d: DraftLine) => [d.key, d.name, d.code, d.id].filter(Boolean).map((x) => x!.toLowerCase());
  // Segments with an explicit `stations` list skip snapping entirely.
  const explicit = (part: RawLine) => P.list(part.props.stations);

  // Points naming their lines: every segment of those lines within snap distance, else the
  // nearest one up to MAX_ASSIGN_M. They never snap to other lines.
  const assigned = new Map<RawLine, RawPoint[]>();
  for (const pt of points) {
    for (const k of pt.only ?? []) {
      const entry = lineList.find(({ draft }) => lineIds(draft).includes(k));
      if (!entry) {
        warn(`${pt.where}: line "${k}" not found in this file`);
        continue;
      }
      const cands = entry.parts.filter((part) => !explicit(part));
      const offs = cands.map((part) => projectOnPath(part.path, pt.station.coord).offset);
      let hit = cands.filter((_, i) => offs[i] <= snap);
      if (!hit.length && cands.length) {
        const i = offs.indexOf(Math.min(...offs));
        if (offs[i] <= MAX_ASSIGN_M) hit = [cands[i]];
        else {
          warn(`${pt.where}: station "${pt.station.name}" is ${Math.round(offs[i])} m from line "${k}" (max ${MAX_ASSIGN_M} m), not attached`);
          pt.reported = true;
        }
      }
      for (const part of hit) assigned.set(part, [...(assigned.get(part) ?? []), pt]);
    }
  }

  for (const { draft, parts } of lineList) {
    const multi = parts.length > 1;
    parts.forEach((part, i) => {
      const seg: DraftSegment = { stations: [] };
      const st = P.status(part.props.status);
      if (st.status) seg.status = st.status;
      else if (st.unknown) warn(`${part.where}: unknown status "${st.unknown}" (expected operating / construction / approved / planned / proposed)`);
      const y = P.year(part.props.year);
      if (y !== undefined) seg.year = y;
      else if (!P.isEmpty(part.props.year)) warn(`${part.where}: cannot read year "${P.str(part.props.year)}"`);
      const label = P.str(part.props.label);
      if (label) seg.label = label;
      const path = part.path;

      // Explicit station list: exactly these stations, in this order; geometry kept as drawn.
      const refs = explicit(part);
      if (refs) {
        const stations: DraftStation[] = [];
        for (const ref of refs) {
          const pt = findPoint(ref, path);
          if (!pt) warn(`${part.where}: "${ref}" in \`stations\` matches no Point id or name, skipped`);
          else {
            pt.attached = true;
            stations.push(pt.station);
          }
        }
        if (stations.length < 2) return warn(`${part.where}: \`stations\` resolves to fewer than 2 stations, segment skipped`);
        seg.stations = stations;
        seg.path = path;
        draft.segments.push(seg);
        return;
      }

      // Otherwise: unrestricted Points within snap distance of THIS segment + Points assigned to
      // it by their `line` list, ordered along the drawn geometry.
      const hits: { st: DraftStation; along: number }[] = [];
      for (const pt of points) {
        if (pt.only) continue;
        const pr = projectOnPath(path, pt.station.coord);
        if (pr.offset > snap) continue;
        pt.attached = true;
        hits.push({ st: pt.station, along: pr.along });
      }
      for (const pt of assigned.get(part) ?? []) {
        pt.attached = true;
        hits.push({ st: pt.station, along: projectOnPath(path, pt.station.coord).along });
      }
      hits.sort((a, b) => a.along - b.along);
      const stations = hits.map((h) => h.st);

      const tag = multi ? ` segment ${i + 1}` : '';
      const closed = stations.length >= 2 && distM(path[0], path[path.length - 1]) <= snap;
      if (closed) {
        // Loop line: rotate the ring to start at the first station and repeat it at the end.
        const pr = projectOnPath(path, stations[0].coord);
        seg.path = [pr.point, ...path.slice(pr.index + 1), ...path.slice(1, pr.index + 1), pr.point];
        stations.push(stations[0]);
      } else {
        // Auto stations at ends no station projects onto, then trim the geometry to first..last.
        const alongOf = (x: DraftStation) => projectOnPath(path, x.coord).along;
        if (!stations.length || alongOf(stations[0]) > snap) {
          stations.unshift(autoStation(path[0], P.str(part.props.from) ?? `${draft.name}${tag} (start)`, 'start', part.where));
        }
        if (pathLengthM(path) - alongOf(stations[stations.length - 1]) > snap) {
          stations.push(autoStation(path[path.length - 1], P.str(part.props.to) ?? `${draft.name}${tag} (end)`, 'end', part.where));
        }
        if (stations.length < 2 || stations[0] === stations[stations.length - 1]) {
          warn(`${part.where}: segment has fewer than 2 stations, skipped`);
          return;
        }
        seg.path = slicePath(path, stations[0].coord, stations[stations.length - 1].coord);
      }
      seg.stations = stations;
      draft.segments.push(seg);
    });
    applyDefaults(draft, opts.defaults);
  }

  /** Resolve a `stations` entry: Point id first, then name / nameLocal; ties -> nearest the path. */
  function findPoint(ref: string, path: LngLat[]): RawPoint | undefined {
    const byId = points.filter((p) => p.rawId && (p.rawId === ref || p.station.id === slug(ref)));
    const k = matchKey(ref);
    const cands = byId.length
      ? byId
      : points.filter((p) => matchKey(p.station.name) === k || (p.station.nameLocal && matchKey(p.station.nameLocal) === k));
    if (cands.length <= 1) return cands[0];
    const off = (p: RawPoint) => projectOnPath(path, p.station.coord).offset;
    return cands.reduce((a, b) => (off(b) < off(a) ? b : a));
  }

  for (const pt of points) {
    if (pt.attached || pt.reported) continue;
    const why = pt.only ? `its \`line\` is ${pt.only.join(', ')}` : `within ${snap} m`;
    warn(`station "${pt.station.name}" is not near any line (${why}), skipped`);
  }

  const out = [...lines.values()].map((l) => l.draft).filter((d) => d.segments.length);
  if (!out.length && features.length) warn('no lines found (draw LineString features for lines, Points for stations)');
  // Line-level warnings repeat once per segment feature; report each once.
  return { lines: out, groups, warnings: [...new Set(warnings)] };
};

/** Fill unset line fields from import defaults. Shared with the CLI. */
export function applyDefaults(d: DraftLine, defaults: LineDefaults | undefined): void {
  if (!defaults) return;
  d.group ??= defaults.group;
  d.status ??= defaults.status;
  d.mode ??= defaults.mode;
  d.year ??= defaults.year;
  if (!d.sources?.length && defaults.sources?.length) d.sources = [...defaults.sources];
  for (const k of ['group', 'status', 'mode', 'year', 'sources'] as const) if (d[k] === undefined) delete d[k];
}

// ---------- helpers ----------

const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

function asFeatures(g: unknown): Json[] {
  if (Array.isArray(g)) return g.filter(isObj);
  if (!isObj(g)) throw new Error('GeoJSON: expected a FeatureCollection or Feature object');
  if (g.type === 'FeatureCollection') return Array.isArray(g.features) ? g.features.filter(isObj) : [];
  if (g.type === 'Feature') return [g];
  if (typeof g.type === 'string' && 'coordinates' in g) return [{ type: 'Feature', properties: {}, geometry: g }];
  throw new Error(`GeoJSON: unsupported top-level type "${String(g.type)}"`);
}

/** Case / diacritics / punctuation-insensitive name key (keeps CJK). */
function matchKey(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[\s\-_'’.·・()（）]+/g, '');
}

function flattenGeometry(g: unknown): { type?: string; coordinates?: unknown }[] {
  if (!isObj(g)) return [];
  if (g.type === 'GeometryCollection') return (Array.isArray(g.geometries) ? g.geometries : []).flatMap(flattenGeometry);
  return [{ type: typeof g.type === 'string' ? g.type : undefined, coordinates: g.coordinates }];
}

/** [lng, lat(, alt)] -> [lng, lat] when valid. */
function toCoord(c: unknown): LngLat | undefined {
  if (!Array.isArray(c) || c.length < 2) return undefined;
  const [x, y] = [Number(c[0]), Number(c[1])];
  if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 180 || Math.abs(y) > 90) return undefined;
  return [x, y];
}

function toPath(c: unknown): LngLat[] {
  if (!Array.isArray(c)) return [];
  const out: LngLat[] = [];
  for (const p of c) {
    const q = toCoord(p);
    if (q && !(out.length && out[out.length - 1][0] === q[0] && out[out.length - 1][1] === q[1])) out.push(q);
  }
  return out;
}
