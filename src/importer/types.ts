/**
 * Importer contract. Every adapter (OSM, GeoJSON, KML, ...) produces DraftLines; `normalize()`
 * turns drafts (+ an optional base CityData) into a valid CityData. Adapters never build ids,
 * merge stations, simplify or round: normalize does that once, the same way for every source.
 *
 * Everything under src/importer/ is isomorphic: it runs in the browser (drag-and-drop) and in
 * Node (the `npm run import` CLI). Do not import node:* modules here.
 */
import type { Group, Line, LngLat, Mode, Source, Status } from '../types';

export interface DraftStation {
  /** Display name, Latin script preferred (romaji / no-diacritics OK). */
  name: string;
  nameLocal?: string;
  coord: LngLat;
  approx?: boolean;
  codes?: string[];
  /** Preferred station id. Otherwise derived from the name. */
  id?: string;
  /**
   * Adapter-local identity, e.g. "osm:node/123". Drafts with the same key are always the same
   * station. Without a key, stations merge by name + distance (options.stationMergeMeters).
   */
  key?: string;
}

export interface DraftSegment {
  /** Ordered stations. Consecutive duplicates are dropped; needs >= 2 after merging. */
  stations: DraftStation[];
  status?: Status;
  year?: number;
  label?: string;
  /** Detailed geometry. Simplified + rounded by normalize. */
  path?: LngLat[];
}

export interface DraftLine {
  /**
   * Stable key that config `lines` overrides can target (besides id / code / name),
   * e.g. "osm:relation/123" or the GeoJSON `line` property.
   */
  key: string;
  id?: string;
  code?: string;
  name: string;
  nameLocal?: string;
  group?: string;
  color?: string;
  textColor?: string;
  mode?: Mode;
  /** Line-level fallback for segments without a status. */
  status?: Status;
  /** Line-level fallback for segments without a year. */
  year?: number;
  opened?: number;
  lengthKm?: number;
  description?: string;
  segments: DraftSegment[];
  sources?: string[];
}

export interface DraftResult {
  lines: DraftLine[];
  groups?: Group[];
  sources?: Source[];
  warnings: string[];
}

/** Defaults applied to every line an import produces (line fields win). */
export interface LineDefaults {
  group?: string;
  status?: Status;
  mode?: Mode;
  year?: number;
  sources?: string[];
}

export interface OsmFilter {
  /** OSM route=* values, e.g. ["subway", "light_rail", "train", "monorail", "tram"] */
  route: string[];
  /** Match any of these network=* values (exact). */
  network?: string[];
  /** Match any of these operator=* values (exact). */
  operator?: string[];
  /** Keep only these ref=* values. */
  ref?: string[];
  /** Extra exact tag filters, e.g. { "service": "subway" } */
  tags?: Record<string, string>;
}

export type ImportSpec =
  | {
      type: 'osm';
      filter: OsmFilter;
      defaults?: LineDefaults;
      /** Drop lines whose key/name/ref/code matches. */
      exclude?: string[];
      /** One line per route_master (default) or per route relation. */
      groupBy?: 'route_master' | 'route';
    }
  | { type: 'geojson'; file: string; defaults?: LineDefaults }
  | { type: 'kml'; file: string; defaults?: LineDefaults };

export interface SegmentPatch {
  status?: Status;
  year?: number;
  label?: string;
}

/** Per-line override in city.config.json `lines`, keyed by line id, draft key, code or name. */
export interface LineOverride extends Partial<Omit<Line, 'id' | 'segments'>> {
  /** Rename the line id. */
  id?: string;
  /** Drop this line entirely. */
  skip?: boolean;
  /** Patch segments by index (null = leave as is). */
  segments?: (SegmentPatch | null)[];
}

export interface ImportOptions {
  /** Same-name stations closer than this become one shared station. Default 400. */
  stationMergeMeters?: number;
  /** GeoJSON/KML: station Points attach to drawn lines within this distance. Default 150. */
  snapMeters?: number;
  /** Douglas-Peucker tolerance for paths. Default 15. */
  simplifyMeters?: number;
  /** Coordinate decimals. Default 5 (~1 m). */
  precision?: number;
}

export interface CityConfig {
  $schema?: string;
  id: string;
  name: string;
  nameLocal?: string;
  country: string;
  center: LngLat;
  zoom: number;
  timeline?: { min: number; max: number };
  /** [minLng, minLat, maxLng, maxLat]; adapters clip / filter to it. */
  bbox?: [number, number, number, number];
  /**
   * Existing CityData to extend, relative to the project root, e.g. "public/data/hanoi.json".
   * Its lines and stations are kept; imported lines with the same id replace base lines;
   * imported stations merge into base stations by name + distance.
   */
  base?: string;
  groups?: Group[];
  sources?: Source[];
  notes?: string;
  imports: ImportSpec[];
  lines?: Record<string, LineOverride>;
  options?: ImportOptions;
}

export interface NormalizeInput {
  /** Drafts from all imports, in import order. */
  drafts: DraftResult[];
  meta: Pick<CityConfig, 'id' | 'name' | 'nameLocal' | 'center' | 'zoom' | 'timeline' | 'notes'> & {
    updated?: string;
  };
  groups?: Group[];
  sources?: Source[];
  overrides?: Record<string, LineOverride>;
  options?: ImportOptions;
  base?: import('../types').CityData;
}
