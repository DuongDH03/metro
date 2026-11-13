#!/usr/bin/env node
// Builds public/data/london.json: London Underground, Elizabeth line, DLR, London Overground,
// London Trams, the cable car and (optionally) National Rail suburban routes, from OpenStreetMap
// route relations (via Overpass) plus the curated metadata in ./lines.mjs (line table, opening
// years per section, future projects with approximate stations).
// Usage (from repo root): node scripts/london/build.mjs [--debug]
// Raw Overpass responses are cached in scripts/london/.cache/ (git-ignored; delete to refresh).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { overpass } from './overpass.mjs';
import { BBOX, GROUPS, SOURCES, LINES, NAME_ALIASES, NAME_OVERRIDES, ACCESSED, NOTES } from './lines.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(root, 'public', 'data', 'london.json');
const DEBUG = process.argv.includes('--debug');
const SIMPLIFY_M = 15;
const CLUSTER_M = 450; // same (normalised) name within this distance => one station
const CURATED_CLUSTER_M = 700; // curated (future) stops snap to an existing station further away

// ---------- geometry helpers ----------
const R = Math.PI / 180;
function distM([lng1, lat1], [lng2, lat2]) {
  const dLat = (lat2 - lat1) * R;
  const dLng = (lng2 - lng1) * R;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * R) * Math.cos(lat2 * R) * Math.sin(dLng / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(a));
}
const eq = (a, b) => a[0] === b[0] && a[1] === b[1];
const inBox = ([lng, lat], B = BBOX) => lng >= B.minLng && lng <= B.maxLng && lat >= B.minLat && lat <= B.maxLat;
const round5 = (n) => Math.round(n * 1e5) / 1e5;

function simplify(pts, tolM) {
  if (pts.length < 3) return pts.slice();
  const lat0 = pts[0][1] * R;
  const xy = pts.map(([lng, lat]) => [lng * R * 6371000 * Math.cos(lat0), lat * R * 6371000]);
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = xy[a];
    const [bx, by] = xy[b];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
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

// Stitch ways (coordinate arrays) in member order into one polyline.
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
  return joinPieces(pieces);
}

// Join pieces in the given order, orienting each to minimise the gap.
function joinPieces(pieces) {
  if (!pieces.length) return [];
  let out = pieces[0].slice();
  for (let i = 1; i < pieces.length; i++) {
    const p = pieces[i];
    const end = out[out.length - 1];
    const cands = [
      [distM(end, p[0]), false, false],
      [distM(end, p[p.length - 1]), false, true],
    ];
    if (i === 1) cands.push([distM(out[0], p[0]), true, false], [distM(out[0], p[p.length - 1]), true, true]);
    cands.sort((a, b) => a[0] - b[0]);
    const [, revOut, revP] = cands[0];
    if (revOut) out.reverse();
    const q = revP ? p.slice().reverse() : p;
    out.push(...(eq(out[out.length - 1], q[0]) ? q.slice(1) : q));
  }
  return out;
}

// Geometric chaining for relations whose members are scrambled.
function stitchGeometric(ways, startCoord) {
  const key = (c) => c[0].toFixed(7) + ',' + c[1].toFixed(7);
  let pieces = ways.filter((w) => w.length >= 2).map((w) => w.slice());
  let merged = true;
  while (merged) {
    merged = false;
    const deg = new Map();
    for (const p of pieces) for (const c of [p[0], p[p.length - 1]]) deg.set(key(c), (deg.get(key(c)) || 0) + 1);
    outer: for (let i = 0; i < pieces.length; i++) {
      for (let j = i + 1; j < pieces.length; j++) {
        const a = pieces[i], b = pieces[j];
        const combos = [
          [a[a.length - 1], b[0], () => a.concat(b.slice(1))],
          [a[a.length - 1], b[b.length - 1], () => a.concat(b.slice().reverse().slice(1))],
          [a[0], b[b.length - 1], () => b.concat(a.slice(1))],
          [a[0], b[0], () => b.slice().reverse().concat(a.slice(1))],
        ];
        for (const [x, y, f] of combos) {
          if (eq(x, y) && deg.get(key(x)) === 2) {
            pieces[i] = f();
            pieces.splice(j, 1);
            merged = true;
            break outer;
          }
        }
      }
    }
  }
  let best = null;
  pieces.forEach((p, i) => {
    for (const rev of [false, true]) {
      const d = distM(rev ? p[p.length - 1] : p[0], startCoord);
      if (!best || d < best.d) best = { d, i, rev };
    }
  });
  if (!best) return [];
  let out = best.rev ? pieces[best.i].slice().reverse() : pieces[best.i].slice();
  const used = new Set([best.i]);
  while (used.size < pieces.length) {
    const end = out[out.length - 1];
    let nb = null;
    pieces.forEach((p, i) => {
      if (used.has(i)) return;
      for (const rev of [false, true]) {
        const d = distM(end, rev ? p[p.length - 1] : p[0]);
        if (!nb || d < nb.d) nb = { d, i, rev };
      }
    });
    if (nb.d > 3000) break;
    used.add(nb.i);
    const q = nb.rev ? pieces[nb.i].slice().reverse() : pieces[nb.i];
    out.push(...(eq(end, q[0]) ? q.slice(1) : q));
  }
  return out;
}

// Monotone matching: each stop -> path vertex index, never going backwards.
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
// Normalised key used to merge stations across lines/modes: "Highbury & Islington" ==
// "Highbury and Islington", "King's Cross St. Pancras" == "Kings Cross St Pancras".
const clean = (n) =>
  (n || '')
    .replace(/(\s+|\s*\()platforms?\s+[0-9a-z]+(\s*(&|and|,)\s*[0-9a-z]+)*\)?$/i, '')
    .replace(/\s+(railway|tube|underground|dlr|tram|tram stop|overground)?\s*station$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
const ALIAS_LC = new Map(Object.entries(NAME_ALIASES).map(([k, v]) => [k.toLowerCase(), v]));
const alias = (n) => ALIAS_LC.get(clean(n).toLowerCase()) ?? clean(n);
const norm = (n) =>
  alias(n)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bst\b\.?/g, 'st')
    .replace(/[^a-z0-9]+/g, '');
const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---------- fetch ----------
const PAD = 0.05;
const qbox = `${BBOX.minLat - PAD},${BBOX.minLng - PAD},${BBOX.maxLat + PAD},${BBOX.maxLng + PAD}`;

async function fetchRelations(ids, name) {
  const q = `[out:json][timeout:600];
relation(id:${ids.join(',')})->.r;
.r out body;
way(r.r)(${qbox});
out geom;
node(r.r)(${qbox});
out body;`;
  return overpass(q, name, (j) => {
    const have = new Set(j.elements.filter((e) => e.type === 'relation').map((e) => e.id));
    const missing = ids.filter((id) => !have.has(id));
    return missing.length ? `missing relations ${missing.join(',')}` : null;
  });
}

async function main() {
  const batches = new Map();
  for (const l of LINES) {
    const b = l.batch || 'other';
    if (!batches.has(b)) batches.set(b, new Set());
    for (const s of l.segments) if (s.rel) batches.get(b).add(s.rel);
  }
  const els = new Map();
  for (const [name, set] of batches) {
    const ids = [...set].sort((a, b) => a - b);
    if (!ids.length) continue;
    console.log(`fetching ${name}: ${ids.length} relations`);
    const j = await fetchRelations(ids, 'rel-' + name);
    for (const e of j.elements) els.set(e.type + e.id, e);
  }
  console.log('fetching station nodes');
  const st = await overpass(
    `[out:json][timeout:300];node["railway"~"^(station|halt|tram_stop)$"](${qbox});out body;`,
    'stations',
  );
  const stationNodes = st.elements.filter((e) => e.tags?.name);
  const lookupStationNode = (coord, maxD) => {
    let best = null;
    for (const n of stationNodes) {
      const d = distM([n.lon, n.lat], coord);
      if (d < maxD && (!best || d < best.d)) best = { d, n };
    }
    return best?.n;
  };

  // ---------- per relation: stops + path ----------
  const relCache = new Map();
  function relationData(seg) {
    const k = `${seg.rel}|${seg.reverse ? 1 : 0}|${seg.sort ? seg.from : ''}`;
    if (relCache.has(k)) return relCache.get(k);
    const rel = els.get('relation' + seg.rel);
    if (!rel) throw new Error(`relation ${seg.rel} not fetched`);
    let members = rel.members.filter((m) => m.type !== 'relation' && /^stop/.test(m.role));
    if (!members.length) members = rel.members.filter((m) => /^platform/.test(m.role));
    const stops = [];
    for (const m of members) {
      const e = els.get(m.type + m.ref);
      if (!e) continue; // outside query box
      let coord;
      if (e.type === 'node') coord = [e.lon, e.lat];
      else if (e.geometry) {
        const g = e.geometry;
        coord = [g.reduce((a, p) => a + p.lon, 0) / g.length, g.reduce((a, p) => a + p.lat, 0) / g.length];
      } else continue;
      let name = e.tags?.name;
      if (!name || name === '?') {
        const sn = lookupStationNode(coord, 300);
        if (!sn) continue;
        name = sn.tags.name;
      }
      name = alias(name);
      const n = norm(name);
      const prev = stops[stops.length - 1];
      if (prev && prev.norm === n) continue;
      stops.push({ name, norm: n, coord });
    }
    const ways = rel.members
      .filter((m) => m.type === 'way' && (m.role === '' || m.role === 'forward' || m.role === 'backward'))
      .map((m) => els.get('way' + m.ref))
      .filter((w) => w?.geometry)
      .map((w) => w.geometry.map((p) => [p.lon, p.lat]));
    let path;
    let ordered = stops;
    if (seg.sort) {
      const start = stops.find((s) => s.norm === norm(seg.from)) || stops[0];
      path = stitchGeometric(ways, start.coord);
      const at = stops.map((s) => {
        let bi = 0, bd = Infinity;
        path.forEach((p, i) => { const d = distM(p, s.coord); if (d < bd) { bd = d; bi = i; } });
        return { s, bi, bd };
      });
      ordered = at.filter((a) => a.bd < 1500).sort((a, b) => a.bi - b.bi).map((a) => a.s);
    } else {
      path = stitchOrdered(ways);
    }
    if (seg.reverse) { ordered = ordered.slice().reverse(); path = path.slice().reverse(); }
    const fwd = matchStops(path, ordered);
    const revPath = path.slice().reverse();
    const bwd = matchStops(revPath, ordered);
    let match = fwd;
    if (bwd.total < fwd.total) { path = revPath; match = bwd; }
    const data = { stops: ordered, path, idx: match.idx, name: rel.tags.name };
    if (DEBUG) {
      const bad = ordered.map((s, i) => [s, distM(path[match.idx[i]] || s.coord, s.coord)]).filter(([, d]) => d > 300);
      console.log(`rel ${seg.rel} ${rel.tags.name}: ${ordered.length} stops, ${path.length} pts, avg match ${(match.total / Math.max(1, ordered.length)).toFixed(0)} m` +
        (bad.length ? `  far: ${bad.map(([s, d]) => s.name + ':' + d.toFixed(0)).join(' | ')}` : ''));
    }
    relCache.set(k, data);
    return data;
  }

  // ---------- station clusters ----------
  const clusters = [];
  function addToCluster({ name, norm: n, coord, approx, id, maxD = CLUSTER_M, lineId }) {
    let best = null;
    for (const c of clusters) {
      if (c.norm !== n) continue;
      const d = Math.min(...c.coords.map((x) => distM(x, coord)));
      if (d < maxD && (!best || d < best.d)) best = { d, c };
    }
    let c = best?.c;
    if (!c) {
      c = { norm: n, names: new Map(), coords: [], approx: !!approx, id, lines: [lineId] };
      clusters.push(c);
    } else if (!approx && c.approx) {
      c.approx = false;
      c.coords = []; // replace estimated coords with real ones
    }
    if (!approx || c.approx) c.coords.push(coord);
    c.names.set(name, (c.names.get(name) || 0) + 1);
    if (id && !c.id) c.id = id;
    if (!c.lines.includes(lineId)) c.lines.push(lineId);
    return c;
  }

  // ---------- build lines ----------
  const outLines = [];
  const STATUS_ORDER = ['operating', 'construction', 'approved', 'planned', 'proposed'];
  for (const line of LINES) {
    const segsOut = [];
    // OSM segments first so curated stops can snap onto real stations
    const order = [...line.segments.filter((s) => s.rel), ...line.segments.filter((s) => !s.rel)];
    for (const seg of order) {
      const status = seg.status || 'operating';
      let stops, path;
      if (seg.rel) {
        const rd = relationData(seg);
        const names = () => rd.stops.map((s) => s.name).join(' | ');
        let a = 0, b = rd.stops.length - 1;
        if (seg.from) {
          for (let k = 0, from = -1; k < (seg.fromNth || 1); k++) a = from = rd.stops.findIndex((s, i) => i > from && s.norm === norm(seg.from));
          if (a < 0) throw new Error(`${line.id}: '${seg.from}' not in rel ${seg.rel} (${names()})`);
        }
        let flip = false;
        if (seg.to) {
          b = rd.stops.findIndex((s, i) => i > a && s.norm === norm(seg.to));
          if (b < 0) {
            // listed against the relation's direction: take the range backwards
            b = rd.stops.findLastIndex((s, i) => i < a && s.norm === norm(seg.to));
            if (b < 0) throw new Error(`${line.id}: '${seg.to}' not found around '${seg.from}' in rel ${seg.rel} (${names()})`);
            [a, b] = [b, a];
            flip = true;
          }
        }
        // clip to bbox: longest contiguous run of in-box stops inside [a, b]
        const runs = [];
        let cur = null;
        for (let i = a; i <= b; i++) {
          if (inBox(rd.stops[i].coord, line.box)) { if (!cur) cur = [i, i]; else cur[1] = i; }
          else if (cur) { runs.push(cur); cur = null; }
        }
        if (cur) runs.push(cur);
        runs.sort((x, y) => y[1] - y[0] - (x[1] - x[0]));
        if (!runs.length || runs[0][1] === runs[0][0]) { console.warn(`  ${line.id}: segment ${seg.rel} has <2 stops in bbox, skipped`); continue; }
        [a, b] = runs[0];
        stops = rd.stops.slice(a, b + 1);
        if (seg.skip) stops = stops.filter((s) => !seg.skip.some((x) => norm(x) === s.norm));
        const i0 = rd.idx[a], i1 = rd.idx[b];
        path = i1 > i0 ? rd.path.slice(i0, i1 + 1) : null;
        if (seg.noPath) path = null;
        if (flip) { stops = stops.slice().reverse(); if (path) path = path.slice().reverse(); }
      } else {
        stops = seg.stops.map((s) => ({ name: alias(s.name), norm: norm(s.name), coord: s.coord, approx: s.approx, id: s.id }));
        path = seg.path || null;
      }
      const cl = stops.map((s) => addToCluster({ ...s, lineId: line.id, maxD: seg.rel ? CLUSTER_M : CURATED_CLUSTER_M }));
      const out = { stations: cl, status };
      if (seg.year !== undefined) out.year = seg.year;
      if (path && path.length >= 2) out.path = simplify(path, line.simplify ?? SIMPLIFY_M).map(([x, y]) => [round5(x), round5(y)]);
      if (seg.label) out.label = seg.label;
      out._order = line.segments.indexOf(seg);
      segsOut.push(out);
    }
    segsOut.sort((x, y) => x._order - y._order);
    const best = STATUS_ORDER.find((s) => segsOut.some((g) => g.status === s));
    outLines.push({
      id: line.id,
      ...(line.code ? { code: line.code } : {}),
      name: line.name,
      group: line.group,
      color: line.color,
      ...(line.textColor ? { textColor: line.textColor } : {}),
      ...(line.mode ? { mode: line.mode } : {}),
      status: line.status || best,
      ...(line.opened ? { opened: line.opened } : {}),
      ...(line.lengthKm ? { lengthKm: line.lengthKm } : {}),
      ...(line.description ? { description: line.description } : {}),
      segments: segsOut,
      sources: line.sources,
    });
  }

  // ---------- finalize stations ----------
  const usedIds = new Set();
  const top = (m) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  for (const c of clusters) c.name = NAME_OVERRIDES[c.norm] || top(c.names);
  for (const c of clusters) if (c.id) usedIds.add(c.id);
  const collisions = [];
  for (const c of clusters) {
    if (c.id) continue;
    let id = slug(c.name) || 'station';
    if (usedIds.has(id)) {
      const alt = `${id}-${c.lines[0]}`;
      collisions.push(`${id} -> ${alt}`);
      id = alt;
    }
    usedIds.add(id);
    c.id = id;
  }
  if (collisions.length) console.log('id collisions:', collisions.join(', '));
  const stations = clusters.map((c) => {
    const lng = c.coords.reduce((a, x) => a + x[0], 0) / c.coords.length;
    const lat = c.coords.reduce((a, x) => a + x[1], 0) / c.coords.length;
    const s = { id: c.id, name: c.name, coord: [round5(lng), round5(lat)] };
    if (c.approx) s.approx = true;
    return s;
  });
  for (const l of outLines) {
    for (const s of l.segments) {
      s.stations = s.stations.map((c) => c.id);
      // drop consecutive duplicates (two stops merged into one station)
      s.stations = s.stations.filter((id, i, a) => i === 0 || a[i - 1] !== id);
      delete s._order;
    }
  }
  if (DEBUG) {
    const byId = new Map(stations.map((s) => [s.id, s]));
    const linesAt = new Map();
    for (const l of outLines) for (const s of l.segments) for (const id of s.stations) {
      if (!linesAt.has(id)) linesAt.set(id, new Set());
      linesAt.get(id).add(l.id);
    }
    const hubs = [...linesAt].sort((a, b) => b[1].size - a[1].size).slice(0, 40);
    console.log('hubs:\n' + hubs.map(([id, s]) => `  ${byId.get(id).name}: ${[...s].join(', ')}`).join('\n'));
  }

  const years = outLines.flatMap((l) => l.segments.map((s) => s.year).filter(Boolean));
  const data = {
    id: 'london',
    name: 'London',
    center: [-0.118, 51.509],
    zoom: 10.5,
    updated: ACCESSED,
    timeline: { min: 1863, max: Math.max(...years) },
    groups: GROUPS,
    lines: outLines,
    stations,
    sources: SOURCES.map((s) => ({ ...s, accessed: s.accessed || ACCESSED })),
    notes: NOTES,
  };
  const json = JSON.stringify(data);
  writeFileSync(OUT, json);
  // register in cities.json (bbox is filled in by `npm run index`)
  const indexPath = join(root, 'public', 'data', 'cities.json');
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  if (!index.some((c) => c.id === 'london')) {
    index.push({ id: 'london', name: 'London', country: 'United Kingdom', file: 'data/london.json', center: data.center, zoom: data.zoom });
    writeFileSync(indexPath, `[\n${index.map((c) => `  ${JSON.stringify(c, null, 1).replace(/\n\s*/g, ' ').replace(/\[ /g, '[').replace(/ \]/g, ']')}`).join(',\n')}\n]\n`);
  }
  const segs = outLines.flatMap((l) => l.segments);
  const byStatus = Object.fromEntries(STATUS_ORDER.map((s) => [s, segs.filter((g) => g.status === s).length]));
  console.log(`wrote ${OUT}: ${outLines.length} lines, ${segs.length} segments ${JSON.stringify(byStatus)}, ${stations.length} stations, ${(json.length / 1024).toFixed(0)} KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
