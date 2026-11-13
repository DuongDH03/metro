// Polite Overpass helper with on-disk cache (scripts/hanoi/cache/<name>.json).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CACHE = join(dirname(fileURLToPath(import.meta.url)), 'cache');
const UA = 'metro-vision-data-script';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function overpass(name, query, { refresh = false } = {}) {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, `${name}.json`);
  if (!refresh && existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
    });
    if (res.ok) {
      const json = await res.json();
      writeFileSync(file, JSON.stringify(json));
      await sleep(1500);
      return json;
    }
    const wait = (attempt + 1) * 10000;
    console.warn(`overpass ${name}: HTTP ${res.status}, retrying in ${wait / 1000}s`);
    await sleep(wait);
  }
  throw new Error(`overpass ${name}: giving up`);
}

export async function nominatim(name, q) {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, `nominatim.json`);
  const cache = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  if (cache[q] !== undefined) return cache[q];
  await sleep(1100);
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&countrycodes=vn&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const json = res.ok ? await res.json() : [];
  cache[q] = json.map((r) => ({ lat: +r.lat, lon: +r.lon, name: r.display_name, type: r.type }));
  writeFileSync(file, JSON.stringify(cache, null, 1));
  return cache[q];
}
