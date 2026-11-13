#!/usr/bin/env node
// Builds a Taiwan city (taipei | taichung | tainan | kaohsiung) into public/data/<city>.json from
// OpenStreetMap (via Overpass, cached in scripts/taiwan/.cache/) plus the curated city spec in
// scripts/taiwan/<city>.mjs. Shared by the three cities; `npm run data:<city>` runs it.
// Usage (from repo root): node scripts/taiwan/build.mjs <city> [--debug]
//
// Segment kinds in a city spec (see the header of taipei.mjs):
//   { rel, from?, to?, reverse? }        stops + track of an OSM route relation (metro / LRT)
//   { graph, from, to, auto: true }      shortest path on the OSM track graph (TRA); stations = every
//                                        station node on that path, clipped to the city box
//   { graph, via: [names] }              explicit stations (THSR), path routed on the track graph
//   { stops: [{name, nameEn, coord, approx?, id?, code?}], path?, graph? }   curated (future lines)
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { overpass } from './overpass.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const CITY = process.argv[2];
const DEBUG = process.argv.includes('--debug');
if (!CITY) { console.error('usage: node scripts/taiwan/build.mjs <taipei|taichung|tainan|kaohsiung>'); process.exit(1); }
const spec = await import(pathToFileURL(join(here, `${CITY}.mjs`)).href);
const { META, BBOX, GROUPS, SOURCES, LINES } = spec;
const MERGES = spec.MERGES || [];
const EN = spec.EN || {};
const LOCAL = spec.LOCAL || {};
const ACCESSED = '2026-11-14';
const SIMPLIFY_M = 15;
const CLUSTER_M = 450;
const CURATED_CLUSTER_M = 700;

// ---------- geometry ----------
const R = Math.PI / 180;
function distM([lng1, lat1], [lng2, lat2]) {
  const dLat = (lat2 - lat1) * R, dLng = (lng2 - lng1) * R;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * R) * Math.cos(lat2 * R) * Math.sin(dLng / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(a));
}
const eq = (a, b) => a[0] === b[0] && a[1] === b[1];
const inBox = ([lng, lat]) => lng >= BBOX.minLng && lng <= BBOX.maxLng && lat >= BBOX.minLat && lat <= BBOX.maxLat;
const round5 = (n) => Math.round(n * 1e5) / 1e5;
const KX = 111320 * Math.cos(((BBOX.minLat + BBOX.maxLat) / 2) * R), KY = 110540;

function simplify(pts, tolM) {
  if (pts.length < 3) return pts.slice();
  const xy = pts.map(([lng, lat]) => [lng * KX, lat * KY]);
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = xy[a], [bx, by] = xy[b];
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
    let maxD = -1, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = xy[i];
      let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
      t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tolM) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

// distance from p to polyline: { d, i (segment index), t, along (m) }
function project(path, p) {
  const px = p[0] * KX, py = p[1] * KY;
  let best = { d: Infinity, i: 0, t: 0 };
  for (let i = 0; i < path.length - 1; i++) {
    const ax = path[i][0] * KX, ay = path[i][1] * KY, bx = path[i + 1][0] * KX, by = path[i + 1][1] * KY;
    const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
    let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    if (d < best.d) best = { d, i, t };
  }
  return best;
}

function stitchOrdered(ways) {
  const pieces = [];
  let cur = null, single = false;
  for (const w of ways) {
    if (w.length < 2) continue;
    if (!cur) { cur = w.slice(); single = true; continue; }
    const end = cur[cur.length - 1];
    if (eq(end, w[0])) cur.push(...w.slice(1));
    else if (eq(end, w[w.length - 1])) cur.push(...w.slice().reverse().slice(1));
    else if (single && eq(cur[0], w[0])) { cur.reverse(); cur.push(...w.slice(1)); }
    else if (single && eq(cur[0], w[w.length - 1])) { cur.reverse(); cur.push(...w.slice().reverse().slice(1)); }
    else { pieces.push(cur); cur = w.slice(); single = true; continue; }
    single = false;
  }
  if (cur) pieces.push(cur);
  if (!pieces.length) return [];
  let out = pieces[0].slice();
  for (let i = 1; i < pieces.length; i++) {
    const p = pieces[i], end = out[out.length - 1];
    const c = [[distM(end, p[0]), false, false], [distM(end, p[p.length - 1]), false, true]];
    if (i === 1) c.push([distM(out[0], p[0]), true, false], [distM(out[0], p[p.length - 1]), true, true]);
    c.sort((a, b) => a[0] - b[0]);
    const [, revOut, revP] = c[0];
    if (revOut) out.reverse();
    const q = revP ? p.slice().reverse() : p;
    out.push(...(eq(out[out.length - 1], q[0]) ? q.slice(1) : q));
  }
  return out;
}

function matchStops(path, stops) {
  const idx = [];
  let prev = 0, total = 0;
  for (const s of stops) {
    let best = -1, bestD = Infinity;
    for (let j = prev; j < path.length; j++) {
      const d = distM(path[j], s.coord);
      if (d < bestD) { bestD = d; best = j; }
      if (bestD < 400 && d > bestD + 300) break;
    }
    if (best < 0) { best = prev; bestD = distM(path[prev], s.coord); }
    idx.push(best);
    total += Math.min(bestD, 3000);
    prev = best;
  }
  return { idx, total };
}

// ---------- names ----------
// Matching key: drop brackets, unify 臺/台, drop 捷運/高鐵 prefixes and 車站/站 suffixes.
const norm = (n) =>
  (n || '')
    .replace(/[（(〈<［\[].*?[）)〉>］\]]/g, '')
    .replace(/臺/g, '台')
    .replace(/\s+/g, '')
    .replace(/^(捷運|高鐵|台鐵)/, '')
    .replace(/(火車站|車站|站)$/, '')
    .trim();
const cleanZh = (n) => (n || '').replace(/[（(].*?[）)]/g, '').replace(/^捷運/, '').trim();
const cleanEn = (s) => {
  if (!s) return undefined;
  s = s.replace(/\s*\(.*?\)\s*/g, ' ').replace(/^(MRT|TRA|THSR|LRT)\s+/i, '').replace(/\s+/g, ' ').trim();
  if (!/Main Station$/i.test(s)) s = s.replace(/\s+(Station|Stop)$/i, '');
  return s || undefined;
};
const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---------- fetch ----------
const pad = (p) => `${BBOX.minLat - p},${BBOX.minLng - p},${BBOX.maxLat + p},${BBOX.maxLng + p}`;
const PAD = META.pad ?? 0.12;
const relIds = [...new Set(LINES.flatMap((l) => l.segments.filter((s) => s.rel).map((s) => s.rel)))];
const els = new Map();
if (relIds.length) {
  console.log(`fetching ${relIds.length} relations`);
  const j = await overpass(
    `[out:json][timeout:600];relation(id:${relIds.join(',')})->.r;.r out body;way(r.r)(${pad(PAD)});out geom;node(r.r)(${pad(PAD)});out body;`,
    `rel-${CITY}`,
    (j) => {
      const have = new Set(j.elements.filter((e) => e.type === 'relation').map((e) => e.id));
      const missing = relIds.filter((id) => !have.has(id));
      return missing.length ? `missing relations ${missing.join(',')}` : null;
    },
  );
  for (const e of j.elements) els.set(e.type + e.id, e);
}
const SPAD = Math.max(PAD, META.graphPad ?? 0);
console.log('fetching station nodes');
const stJ = await overpass(
  `[out:json][timeout:300];(node["railway"~"^(station|halt)$"](${pad(SPAD)});node["public_transport"="station"]["name"](${pad(SPAD)}););out body;`,
  `stations-${CITY}`,
);
const stationNodes = stJ.elements.filter((e) => e.tags?.name).map((e) => ({ ...e, coord: [e.lon, e.lat], norm: norm(e.tags.name) }));
const isMetroNode = (t) => /^(subway|light_rail|monorail|tram)$/.test(t.station || '') || (t.subway === 'yes' && t.train !== 'yes') || (t.light_rail === 'yes' && t.train !== 'yes') || /捷運|輕軌/.test(t.operator || '') || /捷運|輕軌/.test(t.network || '');
const lookupStation = (n, coord, maxD = 600, filter) => {
  let best = null;
  for (const s of stationNodes) {
    if (n && s.norm !== n) continue;
    if (filter && !filter(s.tags)) continue;
    const d = distM(s.coord, coord);
    if (d < maxD && (!best || d < best.d)) best = { d, s };
  }
  return best?.s;
};
const enOf = (t) => cleanEn(t?.['name:en'] || t?.['name:zh-Latn-pinyin']);

// future stations already mapped in OSM (construction / proposed tagging): used to place curated
// approximate stops by station code (`osmRef` or `code`) or by name.
console.log('fetching future station nodes');
const fb = pad(0.02);
const futJ = await overpass(
  `[out:json][timeout:300];(node["construction:railway"~"station|halt"](${fb});node["railway"="construction"]["construction"~"station|halt"](${fb});` +
    `node["railway:construction"~"station|halt"](${fb});node["construction:public_transport"="station"](${fb});node["proposed:railway"~"station|halt"](${fb});` +
    `node["railway"="proposed"](${fb});node["railway"~"station|halt"]["construction"](${fb});nwr["public_transport"="station"]["construction"="yes"](${fb}););out center tags;`,
  `future-nodes-${CITY}`,
);
const futureNodes = futJ.elements
  .map((e) => ({ tags: e.tags || {}, coord: e.lon != null ? [e.lon, e.lat] : e.center ? [e.center.lon, e.center.lat] : null }))
  .filter((e) => e.coord);
function futurePlace(st) {
  if (!st.approx || !st.coord) return null;
  const ref = st.osmRef || st.code;
  if (ref) {
    const hit = futureNodes.find((n) => String(n.tags.ref || '').split(/[\/;]/).includes(ref) && distM(n.coord, st.coord) < 3000);
    if (hit) return hit.coord;
  }
  const n = norm(st.name);
  const hit = futureNodes.find((f) => f.tags.name && norm(f.tags.name) === n && distM(f.coord, st.coord) < 2500);
  return hit?.coord || null;
}

// track graph (only when some segment routes on it)
let graphWays = null;
if (LINES.some((l) => l.segments.some((s) => s.graph))) {
  console.log('fetching track ways');
  const gp = META.graphPad ?? PAD;
  const j = await overpass(
    `[out:json][timeout:600];way["railway"~"^(rail|construction|light_rail|subway|proposed)$"](${pad(gp)});out tags geom;`,
    `ways-${CITY}`,
  );
  graphWays = j.elements.filter((e) => e.geometry);
}
const GRAPH_FILTERS = {
  tra: (t) => t.railway === 'rail' && t.highspeed !== 'yes' && t.gauge !== '1435' && t.gauge !== '1880',
  lrt: (t) => t.railway === 'light_rail',
  hsr: (t) => t.railway === 'rail' && (t.highspeed === 'yes' || t.gauge === '1435' || /高鐵|高速鐵路/.test(t.name || '')),
};
const graphs = new Map();
function getGraph(kind) {
  if (graphs.has(kind)) return graphs.get(kind);
  let f = GRAPH_FILTERS[kind];
  if (!f && kind.startsWith('name:')) {
    const re = new RegExp(kind.slice(5));
    f = (t) => re.test(t.name || '') || re.test(t['name:en'] || '');
  }
  if (!f) throw new Error(`unknown graph ${kind}`);
  const key = (c) => c[0].toFixed(7) + ',' + c[1].toFixed(7);
  const verts = new Map(); // key -> {c, adj: [[key, w]]}
  for (const w of graphWays) {
    if (!f(w.tags || {})) continue;
    const g = w.geometry.map((p) => [p.lon, p.lat]);
    for (let i = 0; i < g.length; i++) {
      const k = key(g[i]);
      if (!verts.has(k)) verts.set(k, { c: g[i], adj: [] });
      if (i) {
        const kp = key(g[i - 1]);
        const d = distM(g[i - 1], g[i]);
        verts.get(k).adj.push([kp, d]);
        verts.get(kp).adj.push([k, d]);
      }
    }
  }
  const G = { verts, keys: [...verts.keys()] };
  graphs.set(kind, G);
  return G;
}
function nearestVertex(G, c) {
  let best = null, bd = Infinity;
  for (const [k, v] of G.verts) {
    const d = Math.abs(v.c[0] - c[0]) * KX + Math.abs(v.c[1] - c[1]) * KY;
    if (d < bd) { bd = d; best = k; }
  }
  return { k: best, d: bd };
}
function route(G, a, b) {
  const s = nearestVertex(G, a), t = nearestVertex(G, b);
  if (!s.k || !t.k || s.d > 800 || t.d > 800) return null;
  const dist = new Map([[s.k, 0]]), prev = new Map();
  const heap = [[0, s.k]];
  const push = (x) => { heap.push(x); let i = heap.length - 1; while (i) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  while (heap.length) {
    const [d, k] = pop();
    if (k === t.k) break;
    if (d > dist.get(k)) continue;
    for (const [n, w] of G.verts.get(k).adj) {
      const nd = d + w;
      if (nd < (dist.get(n) ?? Infinity)) { dist.set(n, nd); prev.set(n, k); push([nd, n]); }
    }
  }
  if (!dist.has(t.k)) return null;
  const out = [];
  for (let k = t.k; k; k = prev.get(k)) out.push(G.verts.get(k).c);
  return out.reverse();
}
// station node for a name, preferring the one closest to the given graph
function graphStation(name, G, near) {
  const n = norm(name);
  const cands = stationNodes.filter((s) => s.norm === n && (!near || distM(s.coord, near) < 90000));
  if (!cands.length) throw new Error(`no OSM station node named ${name}`);
  let best = null;
  for (const s of cands) {
    const d = G ? nearestVertex(G, s.coord).d : 0;
    if (!best || d < best.d) best = { d, s };
  }
  return best.s;
}

// ---------- relation stops + path ----------
const relCache = new Map();
function relationData(seg) {
  const k = `${seg.rel}|${seg.reverse ? 1 : 0}`;
  if (relCache.has(k)) return relCache.get(k);
  const rel = els.get('relation' + seg.rel);
  if (!rel) throw new Error(`relation ${seg.rel} not fetched`);
  let members = rel.members.filter((m) => m.type === 'node' && /^stop/.test(m.role));
  if (!members.length) members = rel.members.filter((m) => /^platform/.test(m.role));
  const stops = [];
  for (const m of members) {
    const e = els.get(m.type + m.ref);
    if (!e) continue;
    let coord;
    if (e.type === 'node') coord = [e.lon, e.lat];
    else if (e.geometry) coord = [e.geometry.reduce((a, p) => a + p.lon, 0) / e.geometry.length, e.geometry.reduce((a, p) => a + p.lat, 0) / e.geometry.length];
    else continue;
    const t = e.tags || {};
    let zh = t.name || t['name:zh'];
    if (zh === '?') zh = undefined;
    let en = enOf(t);
    let st = zh ? lookupStation(norm(zh), coord) : lookupStation(null, coord, 300);
    if (!zh) { if (!st) continue; zh = st.tags.name; }
    if (!en && st) en = enOf(st.tags);
    const n = norm(zh);
    const refs = [t.ref, st?.tags.ref, t['ref:station']].filter(Boolean).join(';').split(/[;,\s/]+/).filter(Boolean);
    const prev = stops[stops.length - 1];
    if (prev && prev.norm === n) { prev.refs.push(...refs); continue; }
    stops.push({ zh: cleanZh(zh), norm: n, en, coord, refs });
  }
  const ways = rel.members
    .filter((m) => m.type === 'way' && !/platform|stop/.test(m.role))
    .map((m) => els.get('way' + m.ref))
    .filter((w) => w?.geometry)
    .map((w) => w.geometry.map((p) => [p.lon, p.lat]));
  let path = stitchOrdered(ways);
  let ordered = seg.reverse ? stops.slice().reverse() : stops;
  const fwd = matchStops(path, ordered), rp = path.slice().reverse(), bwd = matchStops(rp, ordered);
  let match = fwd;
  if (bwd.total < fwd.total) { path = rp; match = bwd; }
  if (ordered.length > 2 && ordered[0].norm === ordered.at(-1).norm && distM(path[0], path.at(-1)) < 300) {
    let bi = 0, bd = Infinity;
    path.forEach((p, i) => { const d = distM(p, ordered[0].coord); if (d < bd) { bd = d; bi = i; } });
    path = path.slice(bi).concat(path.slice(1, bi + 1));
    const f2 = matchStops(path, ordered), p2 = path.slice().reverse(), b2 = matchStops(p2, ordered);
    if (b2.total < f2.total) { path = p2; match = b2; } else match = f2;
  }
  const data = { stops: ordered, path, idx: match.idx };
  const bad = ordered.map((s, i) => [s, distM(path[match.idx[i]] || s.coord, s.coord)]).filter(([, d]) => d > 400);
  if (DEBUG || bad.length)
    console.log(`  rel ${seg.rel} ${rel.tags.name}: ${ordered.length} stops, ${path.length} pts` + (bad.length ? `  FAR: ${bad.map(([s, d]) => s.zh + ':' + d.toFixed(0)).join(' ')}` : ''));
  relCache.set(k, data);
  return data;
}

// ---------- clusters ----------
const merges = MERGES.map((m) => ({ ...m, keys: new Set(m.names.map(norm)) }));
const clusters = [];
function mergeKey(n0, coord) {
  for (const m of merges) if (m.keys.has(n0) && distM(coord, m.near) < (m.r ?? 900)) return { n: 'merge:' + m.id, fixed: m };
  return { n: n0, fixed: null };
}
function addToCluster({ zh, norm: n0, en, coord, approx, id, code, maxD = CLUSTER_M, lineId }) {
  const { n, fixed } = mergeKey(n0, coord);
  let best = null;
  for (const c of clusters) {
    if (c.norm !== n) continue;
    const d = Math.min(...c.coords.map((x) => distM(x, coord)));
    if (d < (fixed ? 5000 : maxD) && (!best || d < best.d)) best = { d, c };
  }
  let c = best?.c;
  if (!c) {
    c = { norm: n, zh: new Map(), en: new Map(), coords: [], codes: new Set(), approx: !!approx, id: fixed?.id || id, merge: fixed, lines: [] };
    clusters.push(c);
  } else if (!approx && c.approx) { c.approx = false; c.coords = []; }
  if (!approx || c.approx) c.coords.push(coord);
  c.zh.set(zh, (c.zh.get(zh) || 0) + 1);
  if (en) c.en.set(en, (c.en.get(en) || 0) + 1);
  if (id && !c.id) c.id = id;
  if (code) c.codes.add(code);
  if (!c.lines.includes(lineId)) c.lines.push(lineId);
  return c;
}

function addCodes(stops, cl, prefix) {
  if (prefix == null) return;
  const re = prefix === '' ? /^\d{2,3}[a-z]?$/ : new RegExp(`^${prefix}\\d{1,2}[A-Za-z]?$`);
  stops.forEach((s, i) => {
    for (const r of s.refs || []) if (re.test(r)) cl[i].codes.add(r);
  });
}

// Clip a stop run to its longest in-box run, extended by `beyond` stops on each side.
function clipRun(stops, beyond = 0) {
  const runs = [];
  let cur = null;
  stops.forEach((s, i) => {
    if (inBox(s.coord)) { if (!cur) cur = [i, i]; else cur[1] = i; }
    else if (cur) { runs.push(cur); cur = null; }
  });
  if (cur) runs.push(cur);
  if (!runs.length) return null;
  runs.sort((x, y) => y[1] - y[0] - (x[1] - x[0]));
  let [a, b] = runs[0];
  a = Math.max(0, a - beyond); b = Math.min(stops.length - 1, b + beyond);
  return b > a ? [a, b] : null;
}

// ---------- build ----------
const STATUS_ORDER = ['operating', 'construction', 'approved', 'planned', 'proposed'];
const outLines = [];
let placedCount = 0;
for (const line of LINES) {
  const segsOut = [];
  const order = [...line.segments.filter((s) => s.rel || s.graph && !s.stops), ...line.segments.filter((s) => !(s.rel || s.graph && !s.stops))];
  for (const seg of order) {
    const status = seg.status || 'operating';
    let stops, path;
    if (seg.rel) {
      const rd = relationData(seg);
      let a = 0, b = rd.stops.length - 1;
      if (seg.from) {
        a = rd.stops.findIndex((s) => s.norm === norm(seg.from));
        if (a < 0) throw new Error(`${line.id}: '${seg.from}' not in rel ${seg.rel} (${rd.stops.map((s) => s.zh).join(' ')})`);
      }
      if (seg.to) {
        b = rd.stops.findIndex((s, i) => i > a && s.norm === norm(seg.to));
        if (b < 0) throw new Error(`${line.id}: '${seg.to}' not after '${seg.from}' in rel ${seg.rel} (${rd.stops.map((s) => s.zh).join(' ')})`);
      }
      const sub = rd.stops.slice(a, b + 1);
      const cr = seg.noClip ? [0, sub.length - 1] : clipRun(sub, seg.beyond || 0);
      if (!cr) { console.warn(`  ${line.id}: rel ${seg.rel} has <2 stops in box, skipped`); continue; }
      stops = sub.slice(cr[0], cr[1] + 1);
      const i0 = rd.idx[a + cr[0]], i1 = rd.idx[a + cr[1]];
      path = i1 > i0 ? rd.path.slice(i0, i1 + 1) : null;
    } else if (seg.graph && !seg.stops) {
      const G = getGraph(seg.graph);
      if (seg.via) {
        const nodes = [];
        for (const nm of seg.via) nodes.push(graphStation(nm, G, nodes.at(-1)?.coord));
        path = [];
        for (let i = 1; i < nodes.length; i++) {
          const r = route(G, nodes[i - 1].coord, nodes[i].coord) || [nodes[i - 1].coord, nodes[i].coord];
          if (r.length === 2) console.warn(`  ${line.id}: no track route ${seg.via[i - 1]} -> ${seg.via[i]}, straight line`);
          path.push(...(path.length ? r.slice(1) : r));
        }
        stops = nodes.map((s) => ({ zh: cleanZh(s.tags.name), norm: s.norm, en: enOf(s.tags), coord: s.coord, refs: [] }));
      } else {
        const A = graphStation(seg.from, G), B = graphStation(seg.to, G);
        const full = route(G, A.coord, B.coord);
        if (!full) throw new Error(`${line.id}: no track route ${seg.from} -> ${seg.to}`);
        const L = [0];
        for (let i = 1; i < full.length; i++) L.push(L[i - 1] + distM(full[i - 1], full[i]));
        const skip = new Set((seg.skip || []).map(norm));
        const found = [];
        const lo = [Math.min(...full.map((p) => p[0])) - 0.01, Math.min(...full.map((p) => p[1])) - 0.01];
        const hi = [Math.max(...full.map((p) => p[0])) + 0.01, Math.max(...full.map((p) => p[1])) + 0.01];
        for (const s of stationNodes) {
          if (s.coord[0] < lo[0] || s.coord[0] > hi[0] || s.coord[1] < lo[1] || s.coord[1] > hi[1]) continue;
          if (/轉運|客運|巴士/.test(s.tags.name) || (s.tags.bus === 'yes' && s.tags.train !== 'yes')) continue;
          if (isMetroNode(s.tags) || skip.has(s.norm) || /高鐵|高速鐵路/.test(s.tags.operator || '')) continue;
          if (s.tags.disused === 'yes' || s.tags['railway:status'] === 'disused' || /^(disused|abandoned)/.test(s.tags.railway)) continue;
          const pr = project(full, s.coord);
          if (pr.d > (seg.snap ?? 90)) continue;
          const along = L[pr.i] + pr.t * (L[pr.i + 1] - L[pr.i]);
          found.push({ s, along, pi: pr.i });
        }
        found.sort((x, y) => x.along - y.along);
        const uniq = [];
        for (const f of found) if (!uniq.some((u) => u.s.norm === f.s.norm)) uniq.push(f);
        if (seg.debugStops || DEBUG) console.log(`  ${line.id} auto: ${uniq.map((u) => u.s.tags.name).join(' ')}`);
        const all = uniq.map((u) => ({ zh: cleanZh(u.s.tags.name), norm: u.s.norm, en: enOf(u.s.tags), coord: u.s.coord, refs: [], pi: u.pi }));
        const cr = clipRun(all, seg.beyond || 0);
        if (!cr) { console.warn(`  ${line.id}: graph run has <2 stops in box, skipped`); continue; }
        stops = all.slice(cr[0], cr[1] + 1);
        path = full.slice(stops[0].pi, stops.at(-1).pi + 2);
      }
    } else {
      stops = seg.stops.map((s) => {
        let real = null, coord = s.coord;
        if (!coord) {
          const near = s.near || [0, 0], maxD = s.near ? 2000 : 1e9;
          const key = mergeKey(norm(s.name), near).n;
          const c = clusters.find((c) => c.norm === key && distM(c.coords[0], near) < maxD);
          if (c) coord = c.coords[0];
          else { real = lookupStation(norm(s.name), near, maxD); coord = real?.coord; }
        }
        if (!coord) throw new Error(`${line.id}: stop ${s.name} has no coord`);
        const placed = futurePlace({ ...s, coord });
        if (placed) placedCount++;
        return { zh: s.name, norm: norm(s.name), en: s.nameEn || enOf(real?.tags), coord: placed || coord, approx: placed ? false : s.approx, id: s.id, code: s.code, refs: [] };
      });
      path = seg.path || null;
      if (!path && seg.graph) {
        const G = getGraph(seg.graph);
        const p = [];
        for (let i = 1; i < stops.length; i++) {
          const r = route(G, stops[i - 1].coord, stops[i].coord);
          const piece = r && r.length > 1 ? [stops[i - 1].coord, ...r, stops[i].coord] : [stops[i - 1].coord, stops[i].coord];
          p.push(...(p.length ? piece.slice(1) : piece));
        }
        path = p;
      }
    }
    const cl = stops.map((s) => addToCluster({ ...s, lineId: line.id, maxD: seg.rel ? CLUSTER_M : CURATED_CLUSTER_M }));
    addCodes(stops, cl, seg.codePrefix ?? line.codePrefix ?? line.code);
    const out = { stations: cl, status };
    if (seg.year !== undefined) out.year = seg.year;
    if (path && path.length >= 2) out.path = simplify(path, SIMPLIFY_M).map(([x, y]) => [round5(x), round5(y)]);
    if (seg.label) out.label = seg.label;
    out._order = line.segments.indexOf(seg);
    segsOut.push(out);
  }
  segsOut.sort((x, y) => x._order - y._order);
  if (!segsOut.length) { console.warn(`  ${line.id}: no segments, dropped`); continue; }
  const best = STATUS_ORDER.find((s) => segsOut.some((g) => g.status === s));
  const { segments, codePrefix, ...rest } = line;
  outLines.push({ ...rest, status: best, segments: segsOut });
}

// ---------- finalize stations ----------
const top = (m) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
const usedIds = new Set(clusters.filter((c) => c.id).map((c) => c.id));
const collisions = [];
for (const c of clusters) {
  const zh = top(c.zh);
  c.nameZh = c.merge?.nameLocal || LOCAL[norm(zh)] || zh;
  c.nameEn = c.merge?.name || EN[norm(zh)] || top(c.en) || null;
  if (c.id) continue;
  if (!c.nameEn) console.warn(`  no English name for ${zh} (${c.coords[0]})`);
  let id = slug(c.nameEn || 'station');
  if (usedIds.has(id)) { const alt = `${id}-${c.lines[0]}`; collisions.push(`${id} -> ${alt}`); id = alt; }
  usedIds.add(id);
  c.id = id;
}
console.log(`future stops placed on OSM construction/proposed nodes: ${placedCount}`);
if (collisions.length) console.log('id collisions:', collisions.join(', '));
const stations = clusters.map((c) => {
  const coord = c.merge?.coord || [c.coords.reduce((a, x) => a + x[0], 0) / c.coords.length, c.coords.reduce((a, x) => a + x[1], 0) / c.coords.length];
  const s = { id: c.id, name: c.nameEn || c.nameZh, nameLocal: c.nameZh, coord: [round5(coord[0]), round5(coord[1])] };
  if (c.approx) s.approx = true;
  if (c.codes.size) s.codes = [...c.codes].sort();
  return s;
});
for (const l of outLines) for (const s of l.segments) {
  // drop consecutive duplicates (two stops merged into one station)
  s.stations = s.stations.map((c) => c.id).filter((id, i, a) => i === 0 || a[i - 1] !== id);
  delete s._order;
}

// Report: different-named stations of different lines within 250 m (possible missed interchanges)
const near = [];
for (let i = 0; i < clusters.length; i++) for (let j = i + 1; j < clusters.length; j++) {
  const a = stations[i], b = stations[j];
  if (distM(a.coord, b.coord) < 300 && !clusters[i].lines.some((x) => clusters[j].lines.includes(x)))
    near.push(`${a.nameLocal}/${b.nameLocal} ${distM(a.coord, b.coord).toFixed(0)}m`);
}
if (near.length) console.log('close but separate:', near.join(', '));

const data = {
  id: CITY,
  name: META.name,
  nameLocal: META.nameLocal,
  center: META.center,
  zoom: META.zoom,
  updated: ACCESSED,
  timeline: META.timeline,
  groups: GROUPS,
  lines: outLines,
  stations,
  sources: SOURCES.map((s) => ({ ...s, accessed: ACCESSED })),
  notes: META.notes,
};
const json = JSON.stringify(data);
const OUT = join(root, 'public', 'data', `${CITY}.json`);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, json);
console.log(`wrote ${OUT}: ${outLines.length} lines, ${stations.length} stations, ${(json.length / 1024).toFixed(0)} KB`);

// upsert the index entry, then let update-index recompute bboxes
const idxPath = join(root, 'public', 'data', 'cities.json');
const index = JSON.parse(readFileSync(idxPath, 'utf8'));
const entry = { id: CITY, name: META.name, nameLocal: META.nameLocal, country: 'Taiwan', file: `data/${CITY}.json`, center: META.center, zoom: META.zoom };
const at = index.findIndex((c) => c.id === CITY);
if (at >= 0) index[at] = { ...index[at], ...entry }; else index.push(entry);
writeFileSync(idxPath, JSON.stringify(index, null, 2));
execFileSync(process.execPath, [join(root, 'scripts', 'update-index.mjs')], { stdio: 'inherit' });
