#!/usr/bin/env node
// Validates public/data/cities.json and every city file against the contract in src/types.ts.
// Usage: node scripts/validate-data.mjs [cityId ...]
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const STATUSES = ['operating', 'construction', 'approved', 'planned', 'proposed'];
const MODES = ['metro', 'commuter', 'lrt', 'monorail', 'tram', 'agt', 'shinkansen'];
const HEX = /^#[0-9a-fA-F]{6}$/;
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const index = JSON.parse(readFileSync(join(root, 'public/data/cities.json'), 'utf8'));
const only = process.argv.slice(2);
let failed = false;

function haversineKm([lng1, lat1], [lng2, lat2]) {
  const r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r;
  const dLng = (lng2 - lng1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

for (const city of index) {
  if (only.length && !only.includes(city.id)) continue;
  const errors = [];
  const warnings = [];
  const file = join(root, 'public', city.file);
  if (!existsSync(file)) {
    console.log(`- ${city.id}: MISSING ${city.file}`);
    continue;
  }
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    console.log(`x ${city.id}: invalid JSON: ${e.message}`);
    failed = true;
    continue;
  }
  const isCoord = (c) =>
    Array.isArray(c) && c.length === 2 && c.every((n) => typeof n === 'number' && Number.isFinite(n));
  const near = (c) => haversineKm(c, city.center) < 150;

  for (const k of ['id', 'name', 'center', 'zoom', 'updated', 'groups', 'lines', 'stations', 'sources']) {
    if (data[k] === undefined) errors.push(`missing top-level "${k}"`);
  }
  if (data.id !== city.id) errors.push(`id "${data.id}" != index id "${city.id}"`);

  const groupIds = new Set();
  for (const g of data.groups ?? []) {
    if (groupIds.has(g.id)) errors.push(`duplicate group ${g.id}`);
    groupIds.add(g.id);
  }
  for (const g of data.groups ?? []) {
    if (g.parent && !groupIds.has(g.parent)) errors.push(`group ${g.id}: unknown parent ${g.parent}`);
  }

  const sourceIds = new Set((data.sources ?? []).map((s) => s.id));
  for (const s of data.sources ?? []) {
    if (!/^https?:\/\//.test(s.url ?? '')) errors.push(`source ${s.id}: bad url`);
  }

  const stations = new Map();
  for (const s of data.stations ?? []) {
    if (!ID.test(s.id ?? '')) errors.push(`station id not kebab-case: "${s.id}"`);
    if (stations.has(s.id)) errors.push(`duplicate station ${s.id}`);
    stations.set(s.id, s);
    if (!isCoord(s.coord)) errors.push(`station ${s.id}: bad coord`);
    else if (!near(s.coord)) warnings.push(`station ${s.id}: >150 km from city center (lng/lat swapped?)`);
    if (!s.name) errors.push(`station ${s.id}: missing name`);
  }

  const used = new Set();
  const lineIds = new Set();
  let segCount = 0;
  for (const l of data.lines ?? []) {
    const where = `line ${l.id}`;
    if (!ID.test(l.id ?? '')) errors.push(`${where}: id not kebab-case`);
    if (lineIds.has(l.id)) errors.push(`duplicate line ${l.id}`);
    lineIds.add(l.id);
    if (!groupIds.has(l.group)) errors.push(`${where}: unknown group ${l.group}`);
    if (!HEX.test(l.color ?? '')) errors.push(`${where}: color must be #rrggbb`);
    if (!STATUSES.includes(l.status)) errors.push(`${where}: bad status ${l.status}`);
    if (l.mode && !MODES.includes(l.mode)) errors.push(`${where}: bad mode ${l.mode}`);
    if (!l.segments?.length) errors.push(`${where}: no segments`);
    if (!l.sources?.length) warnings.push(`${where}: no sources`);
    for (const sid of l.sources ?? []) if (!sourceIds.has(sid)) errors.push(`${where}: unknown source ${sid}`);
    const segStatuses = new Set();
    (l.segments ?? []).forEach((seg, i) => {
      segCount++;
      const w = `${where} seg ${i}`;
      if (!STATUSES.includes(seg.status)) errors.push(`${w}: bad status ${seg.status}`);
      segStatuses.add(seg.status);
      if (!Array.isArray(seg.stations) || seg.stations.length < 2) errors.push(`${w}: needs >= 2 stations`);
      for (const st of seg.stations ?? []) {
        if (!stations.has(st)) errors.push(`${w}: unknown station ${st}`);
        used.add(st);
      }
      for (let j = 1; j < (seg.stations?.length ?? 0); j++) {
        const a = stations.get(seg.stations[j - 1]);
        const b = stations.get(seg.stations[j]);
        if (a && b && isCoord(a.coord) && isCoord(b.coord)) {
          const d = haversineKm(a.coord, b.coord);
          if (d > 12 && l.mode !== 'shinkansen' && l.mode !== 'commuter')
            warnings.push(`${w}: ${a.id} -> ${b.id} is ${d.toFixed(1)} km apart`);
        }
      }
      if (seg.year !== undefined && !Number.isInteger(seg.year)) errors.push(`${w}: year must be integer`);
      if (seg.path) {
        if (!seg.path.every(isCoord)) errors.push(`${w}: bad path coords`);
        else {
          const first = stations.get(seg.stations?.[0]);
          const last = stations.get(seg.stations?.at(-1));
          if (first && haversineKm(seg.path[0], first.coord) > 1.5)
            warnings.push(`${w}: path starts ${haversineKm(seg.path[0], first.coord).toFixed(2)} km from ${first.id}`);
          if (last && haversineKm(seg.path.at(-1), last.coord) > 1.5)
            warnings.push(`${w}: path ends ${haversineKm(seg.path.at(-1), last.coord).toFixed(2)} km from ${last.id}`);
        }
      }
    });
    const best = STATUSES.find((s) => segStatuses.has(s));
    if (best && best !== l.status) warnings.push(`${where}: status ${l.status} but best segment status is ${best}`);
  }
  for (const id of stations.keys()) if (!used.has(id)) warnings.push(`station ${id} not used by any line`);

  const size = (readFileSync(file).length / 1024).toFixed(0);
  const head = `${errors.length ? 'x' : 'ok'} ${city.id}: ${data.lines?.length ?? 0} lines, ${segCount} segments, ${stations.size} stations, ${size} KB`;
  console.log(head);
  for (const e of errors) console.log(`   ERROR ${e}`);
  for (const w of warnings.slice(0, 40)) console.log(`   warn  ${w}`);
  if (warnings.length > 40) console.log(`   ... ${warnings.length - 40} more warnings`);
  if (errors.length) failed = true;
}
process.exit(failed ? 1 : 0);
