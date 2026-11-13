#!/usr/bin/env node
// Fetches the OpenStreetMap data used by build.mjs and caches it in scripts/hanoi/cache/osm.json.
// Usage: node scripts/hanoi/fetch-osm.mjs [--refresh]
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { overpass } from './overpass.mjs';
import { STATIONS, OSM_ROUTE_RELATIONS } from './lines.mjs';

const refresh = process.argv.includes('--refresh');
const BBOX = '20.6,105.3,21.35,106.3';
const nodeIds = [...new Set(Object.values(STATIONS).map((s) => s.osm).filter(Boolean))];

const geo = await overpass(
  'osm-ways',
  `[out:json][timeout:180];
rel(id:${OSM_ROUTE_RELATIONS.join(',')})->.r;
way(r.r)->.rw;
way["railway"~"construction|proposed"]["name"~"Đường sắt đô thị"](${BBOX})->.cw;
(.rw; .cw;);
out geom tags;`,
  { refresh },
);
const relWays = await overpass(
  'osm-relmembers',
  `[out:json][timeout:60];
rel(id:${OSM_ROUTE_RELATIONS.join(',')});
out body;`,
  { refresh },
);
const nodes = await overpass(
  'osm-nodes',
  `[out:json][timeout:60];
node(id:${nodeIds.join(',')});
out;`,
  { refresh },
);

const out = {
  fetched: new Date().toISOString().slice(0, 10),
  ways: geo.elements
    .filter((e) => e.type === 'way')
    .map((e) => ({ id: e.id, name: e.tags?.name ?? '', railway: e.tags?.railway ?? '', geometry: e.geometry.map((p) => [p.lon, p.lat]) })),
  relations: relWays.elements.map((r) => ({ id: r.id, ways: r.members.filter((m) => m.type === 'way' && m.role === '').map((m) => m.ref) })),
  nodes: Object.fromEntries(nodes.elements.map((n) => [n.id, { coord: [n.lon, n.lat], name: n.tags?.name ?? '' }])),
};
const missing = nodeIds.filter((id) => !out.nodes[id]);
if (missing.length) console.warn('missing OSM nodes:', missing.join(', '));
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), 'cache', 'osm.json'), JSON.stringify(out));
console.log(`osm.json: ${out.ways.length} ways, ${out.relations.length} relations, ${Object.keys(out.nodes).length} nodes`);
