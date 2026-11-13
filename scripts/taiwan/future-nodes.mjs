// Dev helper: list future-station nodes (construction / proposed tagging) inside a box.
import { overpass } from './overpass.mjs';
const boxes = { taipei: '24.85,121.1,25.3,121.85', taichung: '23.95,120.45,24.42,120.85', kaohsiung: '22.45,120.15,22.92,120.55' };
const id = process.argv[2];
const b = boxes[id];
const j = await overpass(`[out:json][timeout:300];(
node["construction:railway"~"station|halt"](${b});node["railway"="construction"]["construction"~"station|halt"](${b});
node["railway:construction"~"station|halt"](${b});node["construction:public_transport"="station"](${b});
node["proposed:railway"~"station|halt"](${b});node["railway"="proposed"](${b});node["railway"~"station|halt"]["construction"](${b});
nwr["public_transport"="station"]["construction"="yes"](${b});
);out center tags;`, 'future-nodes-' + id);
for (const e of j.elements) {
  const t = e.tags || {};
  const c = e.lon != null ? [e.lon, e.lat] : [e.center?.lon, e.center?.lat];
  console.log([e.type[0] + e.id, c.map((x) => x?.toFixed(5)).join(','), t.name || '', t['name:en'] || '', t.ref || '', t.railway || '', t.construction || t['construction:railway'] || '', t.network || t.operator || ''].join(' | '));
}
