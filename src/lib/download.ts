import type { CityData } from '../types';
import { cityToGeoJSON } from '../importer/export';

/** Saves `text` as a file via a Blob object URL (revoked afterwards). */
export function downloadText(fileName: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Some browsers read the URL asynchronously after click(); revoke on the next tick.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function fileStem(city: CityData): string {
  return (city.id || 'city').replace(/[^\w.-]+/g, '-');
}

/** The CityData as-is: the format that goes into public/data/<id>.json. */
export function downloadCityJson(city: CityData): void {
  downloadText(`${fileStem(city)}.json`, JSON.stringify(city, null, 1) + '\n', 'application/json');
}

/** GeoJSON that round-trips through the importer (edit in geojson.io / QGIS / My Maps, drop it back). */
export function downloadCityGeoJSON(city: CityData): void {
  downloadText(`${fileStem(city)}.geojson`, JSON.stringify(cityToGeoJSON(city)) + '\n', 'application/geo+json');
}
