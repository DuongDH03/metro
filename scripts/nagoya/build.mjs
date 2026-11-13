#!/usr/bin/env node
// Builds the Nagoya - Gifu (Chukyo) dataset into public/data/nagoya.json from OpenStreetMap
// route relations (via Overpass) plus the curated metadata in ./lines.mjs (line names, colours,
// opening years, cut points, and the future projects with approximate stations).
// Adapted from scripts/tokyo/build.mjs. Unlike Tokyo there is no importer layer: every operator
// (JR Central, Nagoya subway, Meitetsu, Kintetsu, third-sector railways) is curated here, so
// interchange merging (same Japanese name within ~450 m) is consistent across all of them.
// Usage (from repo root): node scripts/nagoya/build.mjs [--debug]   (npm run data:nagoya)
// Raw Overpass responses are cached in scripts/nagoya/.cache/ (delete to refresh).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { overpass } from './overpass.mjs';
import { BBOX, CITY, GROUPS, SOURCES, LINES, NAME_ALIASES, EN_OVERRIDES } from './lines.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(root, 'public', 'data', 'nagoya.json');
const INDEX = join(root, 'public', 'data', 'cities.json');
const DEBUG = process.argv.includes('--debug');
const UPDATED = '2026-11-14';
const SIMPLIFY_M = 15;
const CLUSTER_M = 450; // same Japanese name within this distance => one station
const CURATED_CLUSTER_M = 700;

// ---------- geometry helpers ----------
const R = Math.PI / 180;
function distM([lng1, lat1], [lng2, lat2]) {
  const dLat = (lat2 - lat1) * R;
  const dLng = (lng2 - lng1) * R;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * R) * Math.cos(lat2 * R) * Math.sin(dLng / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(a));
}
const eq = (a, b) => a[0] === b[0] && a[1] === b[1];
const inBox = ([lng, lat]) => lng >= BBOX.minLng && lng <= BBOX.maxLng && lat >= BBOX.minLat && lat <= BBOX.maxLat;
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
    if (i === 1) {
      cands.push([distM(out[0], p[0]), true, false], [distM(out[0], p[p.length - 1]), true, true]);
    }
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
  // merge ways sharing endpoints where the junction is degree 2
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
  // chain greedily from the piece end nearest startCoord
  let best = null;
  pieces.forEach((p, i) => {
    for (const rev of [false, true]) {
      const s = rev ? p[p.length - 1] : p[0];
      const d = distM(s, startCoord);
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
        const s = rev ? p[p.length - 1] : p[0];
        const d = distM(end, s);
        if (!nb || d < nb.d) nb = { d, i, rev };
      }
    });
    if (nb.d > 3000) break; // remaining pieces are sidings / far away
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
const norm = (n) =>
  (n || '')
    .replace(/[（(〈<［\[].*?[）)〉>］\]]/g, '')
    .replace(/駅$/, '')
    .replace(/ヶ/g, 'ケ')
    .replace(/\s+/g, '')
    .trim();
const cleanEn = (s) =>
  s ? s.replace(/\s+Station$/i, '').replace(/\s+/g, ' ').trim() : undefined;
const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---------- fetch ----------
const PAD = 0.1;
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
  const osmSegs = LINES.flatMap((l) => l.segments.filter((s) => s.rel));
  // all relations in two sequential batches (one Overpass request at a time)
  const allIds = [...new Set(LINES.flatMap((l) => l.segments.filter((s) => s.rel).map((s) => s.rel)))].sort((a, b) => a - b);
  const half = Math.ceil(allIds.length / 2);
  const chunks = { a: allIds.slice(0, half), b: allIds.slice(half) };
  const els = new Map();
  for (const [name, ids] of Object.entries(chunks)) {
    if (!ids.length) continue;
    console.log(`fetching relations (${name}): ${ids.length}`);
    const j = await fetchRelations(ids, 'rel-' + name);
    for (const e of j.elements) els.set(e.type + e.id, e);
  }
  console.log('fetching station nodes');
  const st = await overpass(
    `[out:json][timeout:300];node["railway"~"^(station|halt)$"](${qbox});out body;`,
    'stations',
  );
  const stationNodes = st.elements.filter((e) => e.tags?.name);
  const lookupStationNode = (normName, coord, maxD = 600) => {
    let best = null;
    for (const n of stationNodes) {
      if (normName && norm(n.tags.name) !== normName) continue;
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
    const stopRole = /^stop/;
    let members = rel.members.filter((m) => m.type === 'node' && stopRole.test(m.role));
    let usePlatforms = false;
    if (!members.length) {
      members = rel.members.filter((m) => /^platform/.test(m.role));
      usePlatforms = true;
    }
    const stops = [];
    for (const m of members) {
      const e = els.get(m.type + m.ref);
      if (!e || !e.tags) continue; // outside query box (or untagged)
      let coord;
      if (e.type === 'node') coord = [e.lon, e.lat];
      else if (e.geometry) {
        const g = e.geometry;
        coord = [g.reduce((a, p) => a + p.lon, 0) / g.length, g.reduce((a, p) => a + p.lat, 0) / g.length];
      } else continue;
      const t = e.tags || {};
      let ja = t.name || t['name:ja'];
      if (ja && NAME_ALIASES[ja.replace(/駅$/, '')]) ja = NAME_ALIASES[ja.replace(/駅$/, '')];
      let en = cleanEn(t['name:en'] || t['name:ja-Latn'] || t['name:ja_rm']);
      if (!ja || ja === '?') {
        const sn = lookupStationNode(null, coord, 300);
        if (!sn) continue;
        ja = sn.tags.name;
        en = cleanEn(sn.tags['name:en'] || sn.tags['name:ja-Latn'] || sn.tags['name:ja_rm']);
      }
      const n = norm(ja);
      if (!en) {
        const sn = lookupStationNode(n, coord);
        if (sn) en = cleanEn(sn.tags['name:en'] || sn.tags['name:ja-Latn'] || sn.tags['name:ja_rm']);
      }
      const refs = String(t.ref || '').split(/[;,\s]+/).map((r) => r.replace(/-/g, '')).filter(Boolean);
      const prev = stops[stops.length - 1];
      if (prev && prev.norm === n) { prev.refs.push(...refs); continue; }
      stops.push({ ja: ja.replace(/駅$/, ''), norm: n, en, coord, refs });
    }
    const ways = rel.members
      .filter((m) => m.type === 'way' && (m.role === '' || m.role === 'forward' || m.role === 'backward'))
      .map((m) => els.get('way' + m.ref))
      .filter((w) => w?.geometry)
      .map((w) => w.geometry.map((p) => [p.lon, p.lat]));
    let path;
    let derived = false;
    if (seg.derive) stops.length = 0;
    if (!stops.length && seg.stationOp) {
      // Track-only relation (route=railway, no stop members): chain the ways, then take station
      // nodes of the given operator lying within 150 m of the track, ordered along it.
      derived = true;
      const startNode = lookupStationNode(norm(seg.start || seg.from), CITY.center, 200000);
      path = stitchGeometric(ways, startNode ? [startNode.lon, startNode.lat] : CITY.center);
      const op = new RegExp(seg.stationOp);
      const cand = [];
      for (const n of stationNodes) {
        const t = n.tags;
        if (!op.test([t.operator, t.network, t['railway:operator'], t['KSJ2:LIN']].filter(Boolean).join(';'))) continue;
        const c = [n.lon, n.lat];
        let bi = -1, bd = Infinity;
        for (let i = 0; i < path.length; i++) { const d = distM(path[i], c); if (d < bd) { bd = d; bi = i; } }
        if (bd > 150) continue;
        let ja = t.name.replace(/駅$/, '');
        if (NAME_ALIASES[ja]) ja = NAME_ALIASES[ja];
        cand.push({ bi, s: { ja, norm: norm(ja), en: cleanEn(t['name:en'] || t['name:ja-Latn'] || t['name:ja_rm']), coord: c, refs: String(t.ref || '').split(/[;,\s]+/).filter(Boolean) } });
      }
      // named extra stations (interchanges whose node is tagged for another line)
      for (const name of seg.extra || []) {
        let best = null;
        for (const n of stationNodes) {
          if (norm(n.tags.name) !== norm(name)) continue;
          const c = [n.lon, n.lat];
          let bi = -1, bd = Infinity;
          for (let i = 0; i < path.length; i++) { const d = distM(path[i], c); if (d < bd) { bd = d; bi = i; } }
          if (bd < 2500 && (!best || bd < best.bd)) best = { bi, bd, n, c };
        }
        if (!best) { console.warn(`  extra station ${name} not found near rel ${seg.rel}`); continue; }
        if (best.bd > 400) {
          // the track relation stops short of this (shared) station: extend the path to it
          if (best.bi < path.length / 2) { path.unshift(best.c); for (const x of cand) x.bi++; best.bi = 0; }
          else { path.push(best.c); best.bi = path.length - 1; }
        }
        const t = best.n.tags;
        cand.push({ bi: best.bi, s: { ja: name, norm: norm(name), en: cleanEn(t['name:en'] || t['name:ja-Latn']), coord: best.c, refs: [] } });
      }
      cand.sort((a, b) => a.bi - b.bi);
      for (const { s } of cand) if (!stops.length || stops[stops.length - 1].norm !== s.norm) stops.push(s);
    }
    let ordered = stops;
    if (derived) {
      // already ordered along the chained track
    } else if (seg.sort) {
      const start = stops.find((s) => s.norm === norm(seg.from));
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
    // choose path orientation that matches the stop order best
    const fwd = matchStops(path, ordered);
    const revPath = path.slice().reverse();
    const bwd = matchStops(revPath, ordered);
    let match = fwd;
    if (bwd.total < fwd.total) { path = revPath; match = bwd; }
    // loops: rotate path to start at the first stop when path is closed
    if (ordered.length > 2 && ordered[0].norm === ordered[ordered.length - 1].norm && distM(path[0], path[path.length - 1]) < 300) {
      let bi = 0, bd = Infinity;
      path.forEach((p, i) => { const d = distM(p, ordered[0].coord); if (d < bd) { bd = d; bi = i; } });
      path = path.slice(bi).concat(path.slice(1, bi + 1));
      const f2 = matchStops(path, ordered);
      const p2 = path.slice().reverse();
      const b2 = matchStops(p2, ordered);
      if (b2.total < f2.total) { path = p2; match = b2; } else match = f2;
    }
    const data = { stops: ordered, path, idx: match.idx, name: rel.tags.name };
    if (DEBUG) console.log(`  [${seg.rel}] ${ordered.map((s) => s.ja + (s.en ? '/' + s.en : '')).join(' ')}`);
    if (DEBUG) {
      const bad = ordered.map((s, i) => [s, distM(path[match.idx[i]] || s.coord, s.coord)]).filter(([, d]) => d > 500);
      console.log(`rel ${seg.rel} ${rel.tags.name}: ${ordered.length} stops, ${path.length} pts, avg match ${(match.total / ordered.length).toFixed(0)} m` +
        (bad.length ? `  far: ${bad.map(([s, d]) => s.ja + ':' + d.toFixed(0)).join(' ')}` : ''));
    }
    relCache.set(k, data);
    return data;
  }

  // ---------- station clusters ----------
  const clusters = [];
  function addToCluster({ ja, norm: n, en, coord, approx, id, maxD = CLUSTER_M, lineId, snap = false }) {
    let best = null;
    for (const c of clusters) {
      if (c.norm !== n) continue;
      const d = Math.min(...c.coords.map((x) => distM(x, coord)));
      if (d < maxD && (!best || d < best.d)) best = { d, c };
    }
    let c = best?.c;
    if (!c) {
      c = { norm: n, ja: new Map(), en: new Map(), coords: [], codes: new Set(), approx: !!approx, id, lines: [lineId] };
      clusters.push(c);
    } else if (!approx && c.approx) {
      c.approx = false;
      c.coords = []; // replace estimated coords with real ones
    }
    if (!(snap && best) && (!approx || c.approx)) c.coords.push(coord); // snapped curated stops keep the OSM position
    c.ja.set(ja, (c.ja.get(ja) || 0) + 1);
    if (en) c.en.set(en, (c.en.get(en) || 0) + 1);
    if (id && !c.id) c.id = id;
    if (!c.lines.includes(lineId)) c.lines.push(lineId);
    return c;
  }

  // ---------- station codes ----------
  function assignCodes(stops, clusterRefs, prefix, seg) {
    if (!prefix) return;
    const pad = (v) => prefix + String(v).padStart(2, '0');
    if (seg.codeStart) {
      const m = /^([A-Za-z]+)(\d+)$/.exec(seg.codeStart);
      const dir = seg.codeDir ?? 1;
      const k0 = seg.codeFrom || 0;
      stops.forEach((s, i) => i >= k0 && clusterRefs[i].codes.add(m[1] + String(+m[2] + dir * (i - k0)).padStart(2, '0')));
      return;
    }
    const nums = stops.map((s) => {
      for (const r of s.refs) {
        const m = /^([A-Za-z]+)(\d+)$/.exec(r);
        if (m && m[1] === prefix) return +m[2];
      }
      return null;
    });
    const M = seg.codeMod;
    const wrap = (v) => (M ? ((((v - 1) % M) + M) % M) + 1 : v);
    let best = null;
    for (const d of [1, -1]) {
      const cnt = new Map();
      nums.forEach((n, i) => {
        if (n == null) return;
        const k = M ? wrap(n - d * i) : n - d * i;
        cnt.set(k, (cnt.get(k) || 0) + 1);
      });
      for (const [k, c] of cnt) if (!best || c > best.c) best = { d, k, c };
    }
    if (best && best.c >= 2) {
      const agree = nums.map((n, i) => n != null && (M ? wrap(n - best.d * i) : n - best.d * i) === best.k);
      const lo = agree.indexOf(true), hi = agree.lastIndexOf(true);
      for (let i = 0; i < stops.length; i++) {
        if (i >= lo && i <= hi) {
          const v = M ? wrap(best.k + best.d * i) : best.k + best.d * i;
          if (v > 0) clusterRefs[i].codes.add(pad(v));
        } else if (nums[i] != null) clusterRefs[i].codes.add(pad(nums[i]));
      }
    } else {
      nums.forEach((n, i) => n != null && clusterRefs[i].codes.add(pad(n)));
    }
  }

  // ---------- build lines ----------
  const outLines = [];
  const STATUS_ORDER = ['operating', 'construction', 'approved', 'planned', 'proposed'];
  const pending = []; // segments referencing clusters, resolved to ids at the end
  const segsByLine = new Map(LINES.map((l) => [l.id, []]));
  // Pass 1: OSM segments of every line; pass 2: curated segments, so curated stops can snap onto
  // real stations of any operator (e.g. a proposed subway extension ending at a Meitetsu station).
  for (const osmPass of [true, false]) for (const line of LINES) {
    const segsOut = segsByLine.get(line.id);
    for (const seg of line.segments.filter((s) => !!s.rel === osmPass)) {
      const status = seg.status || 'operating';
      let stops, path;
      if (seg.rel) {
        const rd = relationData(seg);
        let a = 0, b = rd.stops.length - 1;
        if (seg.from) {
          for (let k = 0, from = -1; k < (seg.fromNth || 1); k++) a = from = rd.stops.findIndex((s, i) => i > from && s.norm === norm(seg.from));
          if (a < 0) throw new Error(`${line.id}: '${seg.from}' not in rel ${seg.rel} (${rd.stops.map((s) => s.ja).join(' ')})`);
        }
        if (seg.to) {
          b = rd.stops.findIndex((s, i) => i > a && s.norm === norm(seg.to));
          if (b < 0) throw new Error(`${line.id}: '${seg.to}' not after '${seg.from}' in rel ${seg.rel} (${rd.stops.map((s) => s.ja).join(' ')})`);
        }
        // clip to bbox: longest contiguous run of in-box stops inside [a, b]
        let runs = [], cur = null;
        for (let i = a; i <= b; i++) {
          if (inBox(rd.stops[i].coord)) { if (!cur) cur = [i, i]; else cur[1] = i; }
          else if (cur) { runs.push(cur); cur = null; }
        }
        if (cur) runs.push(cur);
        runs.sort((x, y) => y[1] - y[0] - (x[1] - x[0]));
        if (!runs.length || runs[0][1] === runs[0][0]) { console.warn(`  ${line.id}: segment ${seg.rel} has <2 stops in bbox, skipped`); continue; }
        [a, b] = runs[0];
        stops = rd.stops.slice(a, b + 1);
        const i0 = rd.idx[a], i1 = rd.idx[b];
        path = i1 > i0 ? rd.path.slice(i0, i1 + 1) : null;
      } else {
        stops = seg.stops.map((s) => ({ ja: s.name, norm: norm(s.name), en: s.nameEn, coord: s.coord, approx: s.approx, id: s.id, refs: [] }));
        path = seg.path || null;
      }
      const cl = stops.map((s) =>
        addToCluster({ ...s, lineId: line.id, maxD: seg.rel ? CLUSTER_M : s.approx ? CURATED_CLUSTER_M : 3000, snap: !seg.rel && !s.approx }),
      );
      assignCodes(stops, cl, seg.codePrefix || line.codePrefix || line.code, seg);
      const out = { stations: cl, status };
      if (seg.year !== undefined) out.year = seg.year;
      if (path && path.length >= 2) out.path = simplify(path, SIMPLIFY_M).map(([x, y]) => [round5(x), round5(y)]);
      if (seg.label) out.label = seg.label;
      out._order = line.segments.indexOf(seg);
      segsOut.push(out);
    }
  }
  for (const line of LINES) {
    const segsOut = segsByLine.get(line.id);
    segsOut.sort((x, y) => x._order - y._order);
    const best = STATUS_ORDER.find((s) => segsOut.some((g) => g.status === s));
    const l = {
      id: line.id,
      ...(line.code ? { code: line.code } : {}),
      name: line.name,
      nameLocal: line.nameLocal,
      group: line.group,
      color: line.color,
      mode: line.mode,
      status: line.status || best,
      ...(line.opened ? { opened: line.opened } : {}),
      ...(line.description ? { description: line.description } : {}),
      segments: segsOut,
      sources: line.sources,
    };
    outLines.push(l);
    pending.push(l);
  }

  // ---------- finalize stations ----------
  const usedIds = new Set();
  const top = (m) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  for (const c of clusters) {
    c.nameJa = top(c.ja);
    c.nameEn = EN_OVERRIDES[norm(c.nameJa)] || top(c.en) || null;
    c.nameJa = top(c.ja);
  }
  // fixed ids first
  for (const c of clusters) if (c.id) usedIds.add(c.id);
  const collisions = [];
  for (const c of clusters) {
    if (c.id) continue;
    if (!c.nameEn) console.warn(`  no English name for ${c.nameJa} (${c.coords[0]})`);
    let id = slug(c.nameEn || c.norm) || 'station';
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
    const s = { id: c.id, name: c.nameEn || c.nameJa, nameLocal: c.nameJa, coord: [round5(lng), round5(lat)] };
    if (c.approx) s.approx = true;
    if (c.codes.size) s.codes = [...c.codes].sort();
    return s;
  });
  for (const l of pending) {
    for (const s of l.segments) {
      s.stations = s.stations.map((c) => c.id);
      delete s._order;
    }
  }

  const data = {
    id: CITY.id,
    name: CITY.name,
    nameLocal: CITY.nameLocal,
    center: CITY.center,
    zoom: CITY.zoom,
    updated: UPDATED,
    timeline: CITY.timeline,
    groups: GROUPS,
    lines: outLines,
    stations,
    sources: SOURCES.map((s) => ({ ...s, accessed: UPDATED })),
    notes: CITY.notes,
  };
  const json = JSON.stringify(data);
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, json);
  // upsert the registry entry (its bbox is recomputed by `npm run index`)
  const index = JSON.parse(readFileSync(INDEX, 'utf8'));
  const entry = { id: CITY.id, name: CITY.name, nameLocal: CITY.nameLocal, country: CITY.country, file: `data/${CITY.id}.json`, center: CITY.center, zoom: CITY.zoom };
  const at = index.findIndex((c) => c.id === CITY.id);
  if (at >= 0) index[at] = { ...index[at], ...entry }; else index.push(entry);
  writeFileSync(INDEX, JSON.stringify(index, null, 2) + '\n');
  console.log(`wrote ${OUT}: ${outLines.length} lines, ${stations.length} stations, ${(json.length / 1024).toFixed(0)} KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
