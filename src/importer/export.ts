/**
 * CityData -> GeoJSON, following the same property convention the GeoJSON importer reads, so a city can
 * be edited in geojson.io / QGIS / Google My Maps and dropped back in (round trip).
 *
 * - One LineString per segment: { line, id, name, nameLocal, code, color, stroke, group, mode, status, year,
 *   label, description, opened, lengthKm, sources: "a,b" }. Line-level fields are repeated on every segment
 *   of the line; status / year / label are the segment's own.
 *   Geometry = segment.path when present, otherwise the station coordinates in order.
 * - One Point per station: { id, name, nameLocal, codes: "A01,B02", approx, line: "l1,l2" }.
 * Undefined fields are omitted. Pure: no DOM, no Node APIs (usable from the CLI too).
 */
import type { CityData, LngLat } from '../types';

export type GeoJsonProps = Record<string, string | number | boolean>;

export interface LineStringFeature {
  type: 'Feature';
  geometry: { type: 'LineString'; coordinates: LngLat[] };
  properties: GeoJsonProps;
}

export interface PointFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: LngLat };
  properties: GeoJsonProps;
}

export interface FeatureCollection {
  type: 'FeatureCollection';
  features: (LineStringFeature | PointFeature)[];
}

/** Copies only defined, non-empty values. */
function props(entries: Record<string, string | number | boolean | undefined | null>): GeoJsonProps {
  const out: GeoJsonProps = {};
  for (const [k, v] of Object.entries(entries)) {
    if (v === undefined || v === null || v === '') continue;
    if (typeof v === 'number' && !Number.isFinite(v)) continue;
    out[k] = v;
  }
  return out;
}

/** Path ends farther than this from their end station get the station appended. */
const END_GAP_M = 60;

function meters(a: LngLat, b: LngLat): number {
  const r = Math.PI / 180;
  const x = (b[0] - a[0]) * r * Math.cos(((a[1] + b[1]) / 2) * r);
  const y = (b[1] - a[1]) * r;
  return Math.hypot(x, y) * 6371008;
}

const list = (xs: readonly string[] | undefined): string | undefined => (xs && xs.length ? xs.join(',') : undefined);

export function cityToGeoJSON(city: CityData): FeatureCollection {
  const coordOf = new Map<string, LngLat>();
  for (const s of city.stations) coordOf.set(s.id, s.coord);

  const features: (LineStringFeature | PointFeature)[] = [];
  const linesAt = new Map<string, string[]>();

  for (const line of city.lines) {
    for (const seg of line.segments) {
      for (const id of seg.stations) {
        const ls = linesAt.get(id) ?? [];
        if (!ls.includes(line.id)) ls.push(line.id);
        linesAt.set(id, ls);
      }
      const stationCoords = seg.stations
        .map((id) => coordOf.get(id))
        .filter((c): c is LngLat => !!c)
        .map((c): LngLat => [c[0], c[1]]);
      let coords: LngLat[] = stationCoords;
      if (seg.path && seg.path.length >= 2) {
        coords = seg.path.map((c): LngLat => [c[0], c[1]]);
        // The importer snaps the end stations to the line's ends; if a hand-drawn path stops short of its
        // first / last station, extend it so the station is found again on re-import.
        const first = stationCoords[0];
        const last = stationCoords[stationCoords.length - 1];
        if (first && meters(first, coords[0]) > END_GAP_M) coords.unshift(first);
        if (last && stationCoords.length > 1 && meters(last, coords[coords.length - 1]) > END_GAP_M) coords.push(last);
      }
      if (coords.length < 2) continue; // not a valid LineString
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: props({
          line: line.id,
          id: line.id,
          name: line.name,
          nameLocal: line.nameLocal,
          code: line.code,
          color: line.color,
          stroke: line.color,
          group: line.group,
          mode: line.mode,
          status: seg.status ?? line.status,
          year: seg.year,
          label: seg.label,
          description: line.description,
          opened: line.opened,
          lengthKm: line.lengthKm,
          sources: list(line.sources),
          stations: seg.stations.join(','),
        }),
      });
    }
  }

  for (const st of city.stations) {
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [st.coord[0], st.coord[1]] },
      properties: props({
        id: st.id,
        name: st.name,
        nameLocal: st.nameLocal,
        codes: list(st.codes),
        approx: st.approx ? true : undefined,
        line: list(linesAt.get(st.id)),
      }),
    });
  }

  return { type: 'FeatureCollection', features };
}
