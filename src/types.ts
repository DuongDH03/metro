/**
 * Shared data contract for every city dataset in public/data/*.json.
 * The app is fully data-driven: nothing city-specific lives in the components.
 * See DATA.md for authoring rules.
 */

/** Lifecycle of a line or segment, from most to least certain. */
export type Status =
  | 'operating' // in revenue service today
  | 'construction' // physically under construction
  | 'approved' // investment / feasibility approved or funded, not yet under construction
  | 'planned' // in an official master plan, not yet approved for investment
  | 'proposed'; // studies, concepts, long-range vision, extensions floated but not adopted

export const STATUS_ORDER: Status[] = ['operating', 'construction', 'approved', 'planned', 'proposed'];

export type Mode =
  | 'metro'
  | 'commuter' // JR-style suburban / regional rail
  | 'lrt'
  | 'monorail'
  | 'tram'
  | 'agt' // automated guideway (Yurikamome, Nippori-Toneri Liner)
  | 'shinkansen';

export type LngLat = [number, number];

/** Entry in public/data/cities.json */
export interface CityIndexEntry {
  id: string;
  name: string;
  nameLocal?: string;
  country: string;
  /** Path relative to the site root, e.g. "data/hanoi.json" */
  file: string;
  center: LngLat;
  zoom: number;
}

export interface CityData {
  id: string;
  name: string;
  nameLocal?: string;
  center: LngLat;
  zoom: number;
  /** ISO date the data was researched / generated */
  updated: string;
  /** Year range for the timeline slider. */
  timeline?: { min: number; max: number };
  /**
   * Subdivisions (operator / network / mode). May be nested via `parent`,
   * e.g. Tokyo: "jr" > "jr-east"; "subway" > "tokyo-metro", "toei".
   */
  groups: Group[];
  lines: Line[];
  stations: Station[];
  sources: Source[];
  /** Free-text caveats shown in the info panel (Markdown-free plain text). */
  notes?: string;
}

export interface Group {
  id: string;
  name: string;
  nameLocal?: string;
  parent?: string;
  color?: string;
  description?: string;
}

export interface Line {
  id: string;
  /** Short code / bullet, e.g. "2A", "3", "JY", "G" */
  code?: string;
  name: string;
  nameLocal?: string;
  /** Group id (leaf group) */
  group: string;
  /** CSS hex color, e.g. "#0f9d58" */
  color: string;
  /** Text color on top of `color` for bullets; defaults to auto-contrast */
  textColor?: string;
  mode?: Mode;
  /** Overall (most advanced) status of the line */
  status: Status;
  /** Year the first section opened or is expected to open */
  opened?: number;
  lengthKm?: number;
  description?: string;
  /** One or more runs of stations. Branches / extensions / phases are separate segments. */
  segments: Segment[];
  /** Source ids from CityData.sources */
  sources?: string[];
}

export interface Segment {
  /** Ordered station ids. A loop repeats the first id at the end. */
  stations: string[];
  status: Status;
  /**
   * Opening year (actual for operating, target for others). Used by the timeline:
   * the segment is drawn when timelineYear >= year. Omit when unknown; unknown
   * non-operating segments are shown only at the end of the timeline.
   */
  year?: number;
  /** Optional detailed track geometry [lng, lat][]; otherwise straight lines between stations. */
  path?: LngLat[];
  /** e.g. "Phase 1: Nhổn – Cầu Giấy (elevated)" */
  label?: string;
}

export interface Station {
  id: string;
  name: string;
  nameLocal?: string;
  coord: LngLat;
  /** True when the location is estimated (planned stations without published coordinates). */
  approx?: boolean;
  /** Station numbers, e.g. ["JY01", "M17"] */
  codes?: string[];
}

export interface Source {
  id: string;
  title: string;
  url: string;
  accessed?: string;
}
