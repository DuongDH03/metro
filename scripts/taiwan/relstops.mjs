// Dev helper: print the stop names of OSM route relations. Usage: node relstops.mjs <name> id id ...
import { overpass } from './overpass.mjs';
const [name, ...ids] = process.argv.slice(2);
const j = await overpass(`[out:json][timeout:300];relation(id:${ids.join(',')})->.r;.r out body;node(r.r);out body;`, 'relstops-' + name);
const nodes = new Map(j.elements.filter((e) => e.type === 'node').map((e) => [e.id, e]));
for (const r of j.elements.filter((e) => e.type === 'relation')) {
  const st = r.members.filter((m) => m.type === 'node' && /^stop/.test(m.role)).map((m) => nodes.get(m.ref)?.tags?.name || '?');
  console.log(r.id, r.tags.name, '|', st.join(' '));
}
