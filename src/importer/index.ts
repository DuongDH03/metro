/**
 * Public, isomorphic entry points of the importer.
 * - Node CLI (scripts/import/cli.ts) builds DraftResults from a city.config.json and calls normalize().
 * - The browser (drag-and-drop) calls importFile() on a dropped file.
 */
import type { CityData } from '../types';
import { normalize, slug } from './normalize';
import type { DraftResult, LineDefaults } from './types';

export { normalize, slug };
export type * from './types';

export type ImportFileKind = 'citydata' | 'geojson' | 'kml';

export interface ImportFileResult {
  kind: ImportFileKind;
  data: CityData;
  warnings: string[];
}

export function detectKind(fileName: string, text: string): ImportFileKind | null {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'kml' || /^\s*<\?xml|<kml[\s>]/i.test(text.slice(0, 500))) return 'kml';
  if (ext === 'json' || ext === 'geojson') {
    try {
      const j = JSON.parse(text);
      if (j && Array.isArray(j.lines) && Array.isArray(j.stations)) return 'citydata';
      if (j && (j.type === 'FeatureCollection' || j.type === 'Feature')) return 'geojson';
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Convert GeoJSON (object) into drafts. Implemented in ./geojson.ts.
 * `defaults` apply to every line; `sourceName` labels warnings.
 */
export type GeoJsonToDrafts = (
  geojson: unknown,
  opts?: { defaults?: LineDefaults; sourceName?: string; snapMeters?: number },
) => DraftResult;

/**
 * Import a single dropped file in the browser.
 * - CityData JSON: returned as-is (opens as its own city).
 * - GeoJSON / KML: converted to lines and merged on top of `base` (the city on screen), so drawn
 *   lines interchange with real stations. Without a base it becomes a stand-alone city.
 */
export async function importFile(fileName: string, text: string, base?: CityData): Promise<ImportFileResult> {
  const kind = detectKind(fileName, text);
  if (!kind) throw new Error(`${fileName}: not a CityData JSON, GeoJSON or KML file`);
  if (kind === 'citydata') return { kind, data: JSON.parse(text) as CityData, warnings: [] };

  const { geojsonToDrafts } = await import('./geojson');
  let geojson: unknown;
  if (kind === 'kml') {
    const { kmlToGeoJSON } = await import('./kml');
    geojson = kmlToGeoJSON(text, new DOMParser());
  } else {
    geojson = JSON.parse(text);
  }
  const drafts = geojsonToDrafts(geojson, {
    sourceName: fileName,
    defaults: { group: base ? 'imported' : undefined },
  });
  const stem = fileName.replace(/\.[^.]+$/, '');
  const { data, warnings } = normalize({
    drafts: [drafts],
    base,
    groups: base ? [{ id: 'imported', name: `Imported: ${stem}`, description: `Lines from ${fileName}` }] : [],
    meta: base
      ? { id: base.id, name: base.name, nameLocal: base.nameLocal, center: base.center, zoom: base.zoom, timeline: base.timeline, notes: base.notes }
      : { id: slug(stem) || 'imported', name: stem, center: centerOf(drafts), zoom: 10 },
  });
  if (base && data.timeline) {
    const ys = data.lines.flatMap((l) => l.segments.map((s) => s.year ?? data.timeline!.min));
    data.timeline = { min: Math.min(data.timeline.min, ...ys), max: Math.max(data.timeline.max, ...ys) };
  }
  return { kind, data, warnings };
}

function centerOf(d: DraftResult): [number, number] {
  const pts = d.lines.flatMap((l) => l.segments.flatMap((s) => s.stations.map((st) => st.coord)));
  if (!pts.length) return [0, 0];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
}
