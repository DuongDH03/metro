/**
 * Pure conversion of CityData into GeoJSON + lookup indexes.
 * Built once per city (memoised by the caller); filtering happens in visibility.ts.
 */
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import type { CityData, Group, Line, LngLat, Station, Status } from '../types';
import { STATUS_ORDER } from '../types';
import { compact, hasCJK, normalize, safeColor } from './text';

export type BBox = [number, number, number, number]; // west, south, east, north

export interface SegmentInfo {
  /** Index in GeoModel.segments; also the GeoJSON feature id. */
  idx: number;
  lineId: string;
  /** Index within line.segments */
  segIndex: number;
  status: Status;
  year?: number;
  /** Timeline key: year, or -Infinity (operating, unknown) / +Infinity (other, unknown). */
  ty: number;
  coords: LngLat[];
  km: number;
  stations: string[];
  label?: string;
}

export interface StationInfo {
  /** Index in GeoModel.stations; also the GeoJSON feature id. */
  idx: number;
  station: Station;
  /** Line ids through this station, in data order. */
  lines: string[];
  /** Segment indexes touching this station. */
  segs: number[];
  bestStatus: Status;
  interchange: boolean;
  /** Pre-normalised search keys. */
  search: string[];
}

export interface GeoModel {
  city: CityData;
  lineById: Map<string, Line>;
  lineOrder: Map<string, number>;
  groupById: Map<string, Group>;
  segments: SegmentInfo[];
  segmentsByLine: Map<string, number[]>;
  stations: StationInfo[];
  stationIdx: Map<string, number>;
  lineGeo: FeatureCollection<LineString>;
  stationGeo: FeatureCollection<Point>;
  timeline: { min: number; max: number; hasBeyond: boolean };
  /** Geometry-derived length per line (sum of segment lengths). */
  lineKm: Map<string, number>;
  lineBounds: Map<string, BBox>;
  bounds: BBox | null;
}

export const STATUS_RANK: Record<Status, number> = {
  operating: 0,
  construction: 1,
  approved: 2,
  planned: 3,
  proposed: 4,
};

export function bestStatus(statuses: Iterable<Status>): Status {
  let best = 4;
  for (const s of statuses) best = Math.min(best, STATUS_RANK[s]);
  return STATUS_ORDER[best];
}

export function haversineKm(a: LngLat, b: LngLat): number {
  const r = Math.PI / 180;
  const dLat = (b[1] - a[1]) * r;
  const dLng = (b[0] - a[0]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function pathKm(coords: LngLat[]): number {
  let km = 0;
  for (let i = 1; i < coords.length; i++) km += haversineKm(coords[i - 1], coords[i]);
  return km;
}

export function extendBBox(b: BBox | null, c: LngLat): BBox {
  if (!b) return [c[0], c[1], c[0], c[1]];
  return [Math.min(b[0], c[0]), Math.min(b[1], c[1]), Math.max(b[2], c[0]), Math.max(b[3], c[1])];
}

const geoCache = new WeakMap<CityData, GeoModel>();

/** Memoised per CityData object: switching back to a city reuses its GeoJSON. */
export function buildGeo(city: CityData): GeoModel {
  let geo = geoCache.get(city);
  if (!geo) {
    geo = buildGeoUncached(city);
    geoCache.set(city, geo);
  }
  return geo;
}

function buildGeoUncached(city: CityData): GeoModel {
  const lineById = new Map<string, Line>();
  const lineOrder = new Map<string, number>();
  city.lines.forEach((l, i) => {
    lineById.set(l.id, l);
    lineOrder.set(l.id, i);
  });
  const groupById = new Map(city.groups.map((g) => [g.id, g] as const));
  const stationById = new Map(city.stations.map((s) => [s.id, s] as const));

  // Timeline range: data-provided, else derived from segment years.
  const years: number[] = [];
  for (const l of city.lines) for (const s of l.segments) if (s.year !== undefined) years.push(s.year);
  const thisYear = new Date().getFullYear();
  const tMin = city.timeline?.min ?? (years.length ? Math.min(...years) : thisYear);
  const tMax = city.timeline?.max ?? Math.max(thisYear, ...years);

  const segments: SegmentInfo[] = [];
  const segmentsByLine = new Map<string, number[]>();
  const lineKm = new Map<string, number>();
  const lineBounds = new Map<string, BBox>();
  const stationSegs = new Map<string, number[]>();
  let hasBeyond = false;
  let bounds: BBox | null = null;

  const lineFeatures: Feature<LineString>[] = [];

  for (const line of city.lines) {
    const idxs: number[] = [];
    let km = 0;
    let lb: BBox | null = null;
    line.segments.forEach((seg, segIndex) => {
      const stationCoords = seg.stations
        .map((id) => stationById.get(id)?.coord)
        .filter((c): c is LngLat => !!c);
      const coords = seg.path && seg.path.length >= 2 ? seg.path : stationCoords;
      if (coords.length < 2) return;
      const idx = segments.length;
      const segKm = pathKm(coords);
      const ty = seg.year ?? (seg.status === 'operating' ? -Infinity : Infinity);
      if (seg.status !== 'operating' && (seg.year === undefined || seg.year > tMax)) hasBeyond = true;
      const info: SegmentInfo = {
        idx,
        lineId: line.id,
        segIndex,
        status: seg.status,
        year: seg.year,
        ty,
        coords,
        km: segKm,
        stations: seg.stations,
        label: seg.label,
      };
      segments.push(info);
      idxs.push(idx);
      km += segKm;
      for (const c of coords) lb = extendBBox(lb, c);
      for (const c of stationCoords) lb = extendBBox(lb, c);
      for (const sid of new Set(seg.stations)) {
        let arr = stationSegs.get(sid);
        if (!arr) stationSegs.set(sid, (arr = []));
        arr.push(idx);
      }
      lineFeatures.push({
        type: 'Feature',
        id: idx,
        geometry: { type: 'LineString', coordinates: coords },
        properties: {
          i: idx,
          lineId: line.id,
          color: safeColor(line.color),
          status: seg.status,
          year: seg.year ?? null,
          group: line.group,
          mode: line.mode ?? 'metro',
          // lower = drawn on top within the same layer
          sort: -(lineOrder.get(line.id) ?? 0),
        },
      });
    });
    segmentsByLine.set(line.id, idxs);
    lineKm.set(line.id, km);
    if (lb) {
      lineBounds.set(line.id, lb);
      bounds = extendBBox(extendBBox(bounds, [lb[0], lb[1]]), [lb[2], lb[3]]);
    }
  }

  const stations: StationInfo[] = [];
  const stationIdx = new Map<string, number>();
  const stationFeatures: Feature<Point>[] = [];
  for (const st of city.stations) {
    const idx = stations.length;
    const segs = stationSegs.get(st.id) ?? [];
    const lineSet = new Set(segs.map((s) => segments[s].lineId));
    const lines = [...lineSet].sort((a, b) => (lineOrder.get(a) ?? 0) - (lineOrder.get(b) ?? 0));
    const best = bestStatus(segs.map((s) => segments[s].status));
    const info: StationInfo = {
      idx,
      station: st,
      lines,
      segs,
      bestStatus: segs.length ? best : 'proposed',
      interchange: lines.length >= 2,
      search: [
        normalize(st.name),
        normalize(st.nameLocal),
        compact(st.name),
        ...(st.codes ?? []).map((c) => compact(c)),
        compact(st.id),
      ].filter(Boolean),
    };
    stations.push(info);
    stationIdx.set(st.id, idx);
    const first = lines.length ? lineById.get(lines[0]) : undefined;
    const label =
      st.nameLocal && st.nameLocal !== st.name && hasCJK(st.nameLocal) ? `${st.name}\n${st.nameLocal}` : st.name;
    stationFeatures.push({
      type: 'Feature',
      id: idx,
      geometry: { type: 'Point', coordinates: st.coord },
      properties: {
        i: idx,
        id: st.id,
        name: st.name,
        label,
        n: lines.length,
        color: safeColor(first?.color),
        approx: st.approx === true,
        rank: STATUS_RANK[info.bestStatus],
      },
    });
  }

  return {
    city,
    lineById,
    lineOrder,
    groupById,
    segments,
    segmentsByLine,
    stations,
    stationIdx,
    lineGeo: { type: 'FeatureCollection', features: lineFeatures },
    stationGeo: { type: 'FeatureCollection', features: stationFeatures },
    timeline: { min: Math.min(tMin, tMax), max: tMax, hasBeyond },
    lineKm,
    lineBounds,
    bounds,
  };
}

/** Breadcrumb of group names from root to the given group, e.g. ["Subway", "Toei"]. */
export function groupPath(geo: GeoModel, groupId: string): Group[] {
  const out: Group[] = [];
  const seen = new Set<string>();
  let g = geo.groupById.get(groupId);
  while (g && !seen.has(g.id)) {
    seen.add(g.id);
    out.unshift(g);
    g = g.parent ? geo.groupById.get(g.parent) : undefined;
  }
  return out;
}

export interface GroupNode {
  id: string;
  name: string;
  nameLocal?: string;
  color?: string;
  description?: string;
  children: GroupNode[];
  lines: Line[];
  /** All line ids in this subtree. */
  allLineIds: string[];
}

export const OTHER_GROUP_ID = '__other__';

/** Builds the nested group tree; lines with unknown groups go into "Other". Empty groups are pruned. */
export function buildGroupTree(city: CityData): GroupNode[] {
  const nodes = new Map<string, GroupNode>();
  for (const g of city.groups) {
    nodes.set(g.id, {
      id: g.id,
      name: g.name,
      nameLocal: g.nameLocal,
      color: g.color,
      description: g.description,
      children: [],
      lines: [],
      allLineIds: [],
    });
  }
  for (const l of city.lines) {
    let n = nodes.get(l.group);
    if (!n) {
      n = nodes.get(OTHER_GROUP_ID);
      if (!n) {
        n = { id: OTHER_GROUP_ID, name: 'Other', children: [], lines: [], allLineIds: [] };
        nodes.set(OTHER_GROUP_ID, n);
      }
    }
    n.lines.push(l);
  }
  const roots: GroupNode[] = [];
  const byId = new Map(city.groups.map((g) => [g.id, g] as const));
  // Detect cycles: walk up the parent chain.
  const validParent = (id: string): string | undefined => {
    const p = byId.get(id)?.parent;
    if (!p || !nodes.has(p)) return undefined;
    const seen = new Set([id]);
    let cur: string | undefined = p;
    while (cur) {
      if (seen.has(cur)) return undefined;
      seen.add(cur);
      cur = byId.get(cur)?.parent;
    }
    return p;
  };
  for (const [id, node] of nodes) {
    const p = id === OTHER_GROUP_ID ? undefined : validParent(id);
    if (p) nodes.get(p)!.children.push(node);
    else roots.push(node);
  }
  const fill = (n: GroupNode): string[] => {
    n.allLineIds = [...n.lines.map((l) => l.id), ...n.children.flatMap(fill)];
    return n.allLineIds;
  };
  roots.forEach(fill);
  const prune = (list: GroupNode[]): GroupNode[] =>
    list
      .filter((n) => n.allLineIds.length > 0)
      .map((n) => {
        n.children = prune(n.children);
        return n;
      });
  return prune(roots);
}
