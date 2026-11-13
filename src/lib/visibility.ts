import type { Status } from '../types';
import type { GeoModel } from './geo';
import { STATUS_RANK } from './geo';

export interface ViewFilter {
  hiddenLines: ReadonlySet<string>;
  statuses: ReadonlySet<Status>;
  year: number;
}

export interface StationVis {
  /** Visible line ids at this station, data order. */
  lines: string[];
  /** Best visible status rank */
  rank: number;
}

export interface Visibility {
  /** Visible segment indexes (sorted). */
  segs: number[];
  allSegsVisible: boolean;
  /** Visible station idx -> info */
  stations: Map<number, StationVis>;
  allStationsVisible: boolean;
  lines: Set<string>;
  km: number;
  /** Year label for display, e.g. "2045+" at the end of the timeline. */
  yearLabel: string;
}

/** Effective year used for comparisons: the end of the timeline shows everything. */
export function effectiveYear(geo: GeoModel, year: number): number {
  return year >= geo.timeline.max ? Infinity : year;
}

export function computeVisibility(geo: GeoModel, f: ViewFilter): Visibility {
  const y = effectiveYear(geo, f.year);
  const segs: number[] = [];
  const lines = new Set<string>();
  const stations = new Map<number, StationVis>();
  let km = 0;
  for (const s of geo.segments) {
    if (f.hiddenLines.has(s.lineId)) continue;
    if (!f.statuses.has(s.status)) continue;
    if (s.ty > y) continue;
    segs.push(s.idx);
    lines.add(s.lineId);
    km += s.km;
  }
  const segSet = new Set(segs);
  for (const st of geo.stations) {
    let rank = 99;
    const vl: string[] = [];
    for (const si of st.segs) {
      if (!segSet.has(si)) continue;
      const seg = geo.segments[si];
      rank = Math.min(rank, STATUS_RANK[seg.status]);
      if (!vl.includes(seg.lineId)) vl.push(seg.lineId);
    }
    if (vl.length) {
      vl.sort((a, b) => (geo.lineOrder.get(a) ?? 0) - (geo.lineOrder.get(b) ?? 0));
      stations.set(st.idx, { lines: vl, rank });
    }
  }
  const atEnd = f.year >= geo.timeline.max;
  return {
    segs,
    allSegsVisible: segs.length === geo.segments.length,
    stations,
    allStationsVisible: stations.size === geo.stations.length,
    lines,
    km,
    yearLabel: atEnd && geo.timeline.hasBeyond ? `${geo.timeline.max}+` : String(f.year),
  };
}

/** Whether a given line is (at least partly) visible in the current timeline/status, ignoring hidden lines. */
export function lineActiveAt(geo: GeoModel, lineId: string, statuses: ReadonlySet<Status>, year: number): boolean {
  const y = effectiveYear(geo, year);
  return (geo.segmentsByLine.get(lineId) ?? []).some((i) => {
    const s = geo.segments[i];
    return statuses.has(s.status) && s.ty <= y;
  });
}
