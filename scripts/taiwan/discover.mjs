// Dev helper: list OSM rail route relations inside each Taiwan city box (used to pick relation ids for lines.mjs).
import { overpass } from './overpass.mjs';
const BOXES = {
  taipei: [24.85, 121.1, 25.3, 121.85],
  taichung: [23.95, 120.45, 24.4, 120.85],
  kaohsiung: [22.45, 120.15, 22.95, 120.55],
};
for (const [id, b] of Object.entries(BOXES)) {
  const q = `[out:json][timeout:300];relation[type=route][route~"^(subway|light_rail|train|monorail|tram|railway)$"](${b.join(',')});out tags;`;
  const j = await overpass(q, 'discover-' + id);
  console.log(`\n=== ${id}: ${j.elements.length}`);
  for (const e of j.elements.sort((a, b) => (a.tags.route + a.tags.name).localeCompare(b.tags.route + b.tags.name))) {
    const t = e.tags;
    console.log([e.id, t.route, t.ref || '', t.name, t['name:en'] || '', t.operator || '', t.network || '', t.colour || '', t.from || '', t.to || ''].join(' | '));
  }
}
