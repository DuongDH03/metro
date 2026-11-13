/**
 * Which other city (if any) to suggest when the user pans the map away from the current one.
 * Pure: takes the city index, the current city and the camera; no React, no map.
 */
import type { CityIndexEntry, LngLat } from '../types';
import type { BBox } from './geo';

export interface MapView {
  center: LngLat;
  bounds: BBox;
  zoom: number;
}

/** Below this zoom the view covers whole countries; suggesting one city there is noise. */
export const MIN_SUGGEST_ZOOM = 7;
const FALLBACK_RADIUS_KM = 25;

/** A city's area: its bbox from cities.json, or a box around its center when it has none. */
export function cityExtent(c: CityIndexEntry): BBox {
  if (c.bbox) return c.bbox;
  const dLat = FALLBACK_RADIUS_KM / 110.57;
  const dLng = FALLBACK_RADIUS_KM / (111.32 * Math.cos((c.center[1] * Math.PI) / 180));
  return [c.center[0] - dLng, c.center[1] - dLat, c.center[0] + dLng, c.center[1] + dLat];
}

const contains = (b: BBox, p: LngLat) => p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3];
const intersects = (a: BBox, b: BBox) => a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];
const within = (inner: BBox, outer: BBox) =>
  inner[0] >= outer[0] && inner[1] >= outer[1] && inner[2] <= outer[2] && inner[3] <= outer[3];
const area = (b: BBox) => (b[2] - b[0]) * (b[3] - b[1]);

/**
 * Suggest another city when the camera has left the current city's area and either
 * - the view is centred inside that city's area, or
 * - the whole city fits in the view (zoomed out over it) while the current city is out of sight.
 * The smallest matching area wins (most specific city).
 */
export function suggestCity(
  cities: readonly CityIndexEntry[],
  current: CityIndexEntry | null,
  view: MapView | null,
  dismissed: ReadonlySet<string> = new Set(),
): CityIndexEntry | null {
  if (!view || view.zoom < MIN_SUGGEST_ZOOM) return null;
  const cur = current ? cityExtent(current) : null;
  if (cur && contains(cur, view.center)) return null;
  const currentVisible = cur ? intersects(cur, view.bounds) : false;
  let best: CityIndexEntry | null = null;
  for (const c of cities) {
    if (c.id === current?.id || dismissed.has(c.id)) continue;
    const ext = cityExtent(c);
    const hit = contains(ext, view.center) || (!currentVisible && within(ext, view.bounds));
    if (hit && (!best || area(ext) < area(cityExtent(best)))) best = c;
  }
  return best;
}

/** Dismissals expire once the camera is no longer over that city, so it can be suggested again later. */
export function pruneDismissed(
  dismissed: ReadonlySet<string>,
  cities: readonly CityIndexEntry[],
  view: MapView,
): ReadonlySet<string> {
  let changed = false;
  const next = new Set(dismissed);
  for (const id of dismissed) {
    const c = cities.find((x) => x.id === id);
    if (!c || !intersects(cityExtent(c), view.bounds)) {
      next.delete(id);
      changed = true;
    }
  }
  return changed ? next : dismissed;
}
