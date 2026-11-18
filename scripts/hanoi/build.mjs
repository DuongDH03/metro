#!/usr/bin/env node
// Builds public/data/hanoi.json from the curated table (lines.mjs) and cached OSM data (cache/osm.json).
// Usage: node scripts/hanoi/fetch-osm.mjs && node scripts/hanoi/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATIONS, LINES, GROUPS, SOURCES, GEOMETRY } from './lines.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const osm = JSON.parse(readFileSync(join(here, 'cache', 'osm.json'), 'utf8'));
const UPDATED = '2026-11-14';
const SIMPLIFY_M = 15;

// ---------- geometry helpers ----------
const R = 6371008.8;
const rad = Math.PI / 180;
function distM([lng1, lat1], [lng2, lat2]) {
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
// Local equirectangular projection around Hanoi (good enough at this scale).
const K = Math.cos(21 * rad);
const toXY = ([lng, lat]) => [lng * rad * R * K, lat * rad * R];
const fromXY = ([x, y]) => [x / (rad * R * K), y / (rad * R)];

function projectOnSegment(p, a, b) {
  const [px, py] = toXY(p);
  const [ax, ay] = toXY(a);
  const [bx, by] = toXY(b);
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  const q = [ax + t * dx, ay + t * dy];
  return { point: fromXY(q), t, d: Math.hypot(px - q[0], py - q[1]) };
}

function douglasPeucker(points, tol) {
  if (points.length < 3) return points;
  const xy = points.map(toXY);
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let maxD = 0;
    let idx = -1;
    const [ax, ay] = xy[s];
    const [bx, by] = xy[e];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    for (let i = s + 1; i < e; i++) {
      const [px, py] = xy[i];
      const d = len ? Math.abs(dy * px - dx * py + bx * ay - by * ax) / len : Math.hypot(px - ax, py - ay);
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tol && idx > 0) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

// ---------- OSM geometry per line ----------
const wayById = new Map(osm.ways.map((w) => [w.id, w]));
function waysFor(key) {
  const spec = GEOMETRY[key];
  const ids = new Set();
  for (const rid of spec.relations ?? []) for (const wid of osm.relations.find((r) => r.id === rid)?.ways ?? []) ids.add(wid);
  for (const re of spec.names ?? []) for (const w of osm.ways) if (re.test(w.name)) ids.add(w.id);
  return [...ids].map((id) => wayById.get(id)).filter((w) => w && w.geometry.length >= (spec.minPoints ?? 2));
}

// Inserts vertices so that no edge is longer than `step` metres (accurate nearest-node snapping).
function densify(coords, step) {
  const out = [coords[0]];
  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1];
    const b = coords[i];
    const n = Math.ceil(distM(a, b) / step);
    for (let j = 1; j <= n; j++) out.push([a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n]);
  }
  return out;
}

function buildGraph(ways) {
  const keyOf = (c) => `${c[0].toFixed(6)},${c[1].toFixed(6)}`;
  const nodes = new Map(); // key -> {coord, edges: Map<key, m>}
  const add = (c) => {
    const k = keyOf(c);
    if (!nodes.has(k)) nodes.set(k, { coord: c, edges: new Map() });
    return k;
  };
  const link = (a, b) => {
    const d = distM(nodes.get(a).coord, nodes.get(b).coord);
    nodes.get(a).edges.set(b, d);
    nodes.get(b).edges.set(a, d);
  };
  const owner = new Map();
  for (const w of ways) {
    let prev = null;
    for (const c of densify(w.geometry, 50)) {
      const k = add(c);
      if (!owner.has(k)) owner.set(k, w.id);
      if (prev && prev !== k) link(prev, k);
      prev = k;
    }
  }
  // Bridge small gaps: connect each way end to the nearest node of another way within 250 m.
  for (const w of ways) {
    for (const c of [w.geometry[0], w.geometry.at(-1)]) {
      const k = keyOf(c);
      let best = null;
      let bestD = 250;
      for (const [k2, n] of nodes) {
        if (owner.get(k2) === w.id) continue;
        const d = distM(c, n.coord);
        if (d < bestD) { bestD = d; best = k2; }
      }
      if (best) link(k, best);
    }
  }
  // Cross-link parallel tracks (twin single-track ways) so paths never U-turn at a way end.
  const entries = [...nodes];
  for (const [k, n] of entries) {
    let best = null;
    let bestD = 50;
    for (const [k2, n2] of entries) {
      if (owner.get(k2) === owner.get(k)) continue;
      const d = distM(n.coord, n2.coord);
      if (d < bestD) { bestD = d; best = k2; }
    }
    if (best) link(k, best);
  }
  return nodes;
}

function nearestNode(graph, c) {
  let best = null;
  let bestD = Infinity;
  for (const [k, n] of graph) {
    const d = distM(c, n.coord);
    if (d < bestD) { bestD = d; best = k; }
  }
  return { key: best, d: bestD };
}

function shortestPath(graph, from, to) {
  const dist = new Map([[from, 0]]);
  const prev = new Map();
  const done = new Set();
  // Simple binary heap.
  const heap = [[0, from]];
  const push = (item) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  while (heap.length) {
    const [d, k] = pop();
    if (done.has(k)) continue;
    done.add(k);
    if (k === to) break;
    for (const [k2, w] of graph.get(k).edges) {
      const nd = d + w;
      if (nd < (dist.get(k2) ?? Infinity)) {
        dist.set(k2, nd);
        prev.set(k2, k);
        push([nd, k2]);
      }
    }
  }
  if (!dist.has(to)) return null;
  const keys = [to];
  while (keys[0] !== from) keys.unshift(prev.get(keys[0]));
  return { length: dist.get(to), coords: keys.map((k) => graph.get(k).coord) };
}

// ---------- stations ----------
const geomCache = new Map();
function geometry(key) {
  if (!geomCache.has(key)) {
    const ways = waysFor(key);
    geomCache.set(key, { ways, graph: buildGraph(ways) });
  }
  return geomCache.get(key);
}

const round = (c) => [Math.round(c[0] * 1e5) / 1e5, Math.round(c[1] * 1e5) / 1e5];
const stationCoord = new Map();
const stationsOut = [];
for (const [id, s] of Object.entries(STATIONS)) {
  let coord = s.coord;
  if (s.osm) {
    const n = osm.nodes[s.osm];
    if (!n) throw new Error(`station ${id}: OSM node ${s.osm} missing from cache (run fetch-osm.mjs)`);
    coord = n.coord;
  }
  if (s.snap) {
    let best = { d: Infinity };
    for (const w of geometry(s.snap).ways)
      for (let i = 1; i < w.geometry.length; i++) {
        const p = projectOnSegment(coord, w.geometry[i - 1], w.geometry[i]);
        if (p.d < best.d) best = p;
      }
    if (best.d < 1000) coord = best.point;
    else console.warn(`station ${id}: no ${s.snap} geometry within 1 km, not snapped`);
  }
  stationCoord.set(id, coord);
  const out = { id, name: s.name, nameLocal: s.nameLocal, coord: round(coord) };
  if (s.approx || (!s.osm && !s.approx && s.coord)) out.approx = true;
  if (s.codes) out.codes = s.codes;
  stationsOut.push(out);
}

// Removes short back-and-forth spikes (snapping to the "wrong" parallel track near a station).
function removeSpikes(points) {
  let pts = points.slice();
  let changed = true;
  while (changed) {
    changed = false;
    for (let j = 1; j < pts.length - 1; j++) {
      const [ax, ay] = toXY(pts[j - 1]);
      const [bx, by] = toXY(pts[j]);
      const [cx, cy] = toXY(pts[j + 1]);
      const u = [bx - ax, by - ay];
      const v = [cx - bx, cy - by];
      const lu = Math.hypot(...u);
      const lv = Math.hypot(...v);
      if (!lu || !lv) { pts.splice(j, 1); changed = true; break; }
      const cos = (u[0] * v[0] + u[1] * v[1]) / (lu * lv);
      if (cos < -0.7 && Math.min(lu, lv) < 500) { pts.splice(j, 1); changed = true; break; }
    }
  }
  return pts;
}

// ---------- lines ----------
function segmentPath(seg, key) {
  const { graph } = geometry(key);
  const out = [];
  let usedGraph = false;
  for (let i = 1; i < seg.stations.length; i++) {
    const a = stationCoord.get(seg.stations[i - 1]);
    const b = stationCoord.get(seg.stations[i]);
    const straight = distM(a, b);
    const na = nearestNode(graph, a);
    const nb = nearestNode(graph, b);
    let piece = null;
    if (na.d < 600 && nb.d < 600 && na.key !== nb.key) {
      const sp = shortestPath(graph, na.key, nb.key);
      if (sp && sp.length < 1.8 * straight + 600) piece = sp.coords;
    }
    if (piece) usedGraph = true;
    else piece = [a, b];
    if (out.length && distM(out.at(-1), piece[0]) < 1) piece = piece.slice(1);
    out.push(...piece);
  }
  if (!usedGraph) return undefined;
  return passThroughStations(douglasPeucker(removeSpikes(out), SIMPLIFY_M), seg.stations).map(round);
}

// The traced alignment is sometimes sparse or offset from the (OSM / snapped) station position. A path that misses
// its own station reads as a line cutting through an interchange it does not serve, so bend the path through any
// station more than 25 m from it by inserting the station coordinate at the nearest point of the polyline.
function passThroughStations(path, ids) {
  const pts = path.slice();
  // Two rounds: bending the path for one station can move it away from a neighbour that was already within tolerance.
  for (const id of [...ids, ...ids]) {
    const c = stationCoord.get(id);
    let best = { d: Infinity, i: 0 };
    for (let i = 1; i < pts.length; i++) {
      const p = projectOnSegment(c, pts[i - 1], pts[i]);
      if (p.d < best.d) best = { d: p.d, i, t: p.t };
    }
    if (best.d <= 25) continue;
    // Nearest point is a path end: extend the path to the station; otherwise insert it mid-polyline.
    if (best.i === 1 && distM(c, pts[0]) <= distM(c, pts[1]) && best.t <= 0) pts.unshift(c);
    else if (best.i === pts.length - 1 && best.t >= 1) pts.push(c);
    else pts.splice(best.i, 0, c);
  }
  return pts;
}

const linesOut = LINES.map((l) => {
  const { geometry: key, segments, ...rest } = l;
  return {
    ...rest,
    segments: segments.map(({ path, ...seg }) => {
      for (const st of seg.stations) if (!STATIONS[st]) throw new Error(`line ${l.id}: unknown station ${st}`);
      const p = path && key ? segmentPath(seg, key) : undefined;
      return p ? { ...seg, path: p } : seg;
    }),
  };
});

const used = new Set(LINES.flatMap((l) => l.segments.flatMap((s) => s.stations)));
const data = {
  id: 'hanoi',
  name: 'Hanoi',
  nameLocal: 'Hà Nội',
  center: [105.84, 21.02],
  zoom: 10.5,
  updated: UPDATED,
  timeline: { min: 2021, max: 2045 },
  groups: GROUPS,
  lines: linesOut,
  stations: stationsOut.filter((s) => used.has(s.id)),
  sources: SOURCES.map((s) => ({ ...s, accessed: UPDATED })),
  notes: [
    'Network per the Capital Master Plan with a 100-year vision (Decision 2512/QĐ-UBND, 13 May 2026): 18 urban rail lines, about 979 km, building on Resolution 188/2025/QH15 and the 2024 general plan (Decision 1668/QĐ-TTg, 14-15 lines, about 617 km).',
    'Years are official phase targets: 2030 for the 2026–2030 list, 2035 for 2031–2035 and 2045 for 2036–2045; branches without a stated phase appear only at the end of the timeline.',
    'Lines 1, 2 (outer sections), 8, 10 and 14 broke ground on 22 Jun 2026 under a Vinhomes–SGC turnkey contract; their station names and positions are provisional (traced in OpenStreetMap from published plan maps) and may change.',
    'Planned-line stations are indicative waypoints placed at the named places, not designed stations; all estimated locations are flagged approx. Paths are drawn only where OpenStreetMap has an alignment; elsewhere stations are joined by straight lines.',
    'Only lines 2A and 3 have official line colors on signage; other colors follow the vi.wikipedia planning-map palette or were chosen for contrast. No monorail, LRT or tram lines appear in the 2026 plan (the 2016 plan had three monorail lines).',
  ].join(' '),
};

for (const s of data.stations) if (!s.approx) delete s.approx;
const file = join(root, 'public', 'data', 'hanoi.json');
writeFileSync(file, JSON.stringify(data, null, 1) + '\n');
console.log(`wrote ${file}: ${data.lines.length} lines, ${data.stations.length} stations, ${(readFileSync(file).length / 1024).toFixed(0)} KB`);
const unused = Object.keys(STATIONS).filter((id) => !used.has(id));
if (unused.length) console.warn('unused stations:', unused.join(', '));
