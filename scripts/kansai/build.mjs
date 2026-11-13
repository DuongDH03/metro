#!/usr/bin/env node
// Builds public/data/kansai.json (Osaka · Kyoto · Kobe) from OpenStreetMap route relations
// (via Overpass) plus the curated metadata in ./lines.mjs. Adapted from scripts/tokyo/build.mjs.
// Kansai has almost no OSM route_masters (services are separate relations per stopping pattern),
// so every line is curated here, picking one all-stations relation per line, instead of the
// generic importer. Usage (from repo root): node scripts/kansai/build.mjs [--debug] [--stops]
//   --debug  per-relation match quality      --stops  print every relation's stop list
// Raw Overpass responses are cached in scripts/kansai/.cache/ (delete to refresh).
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { overpass, MIRROR_FIRST, CACHE_DIR } from './overpass.mjs';
import { BBOX, GROUPS, SOURCES, LINES, STALE_RELS, NAME_ALIASES, MERGE_PREFIX, EN_OVERRIDES, HUBS, CITY } from './lines.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(root, 'public', 'data', 'kansai.json');
const DEBUG = process.argv.includes('--debug');
const STOPS = process.argv.includes('--stops');
const SIMPLIFY_M = 18;
const CLUSTER_M = 450; // same (normalised) Japanese name within this distance => one station
const CURATED_CLUSTER_M = 700;
const CHUNK = 6; // relations per Overpass request (small: the public servers time out on big geometry queries)

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
const baseNorm = (n) =>
  (n || '')
    .replace(/[（(〈<［\[].*?[）)〉>］\]]/g, '')
    .replace(/駅$/, '')
    .replace(/ヶ/g, 'ケ')
    .replace(/\s+/g, '')
    .trim();
// Merge key: aliases (大阪梅田 -> 大阪) and operator prefixes (山陽明石 -> 明石) removed, so that
// adjacent stations of different operators become one interchange when they are within CLUSTER_M.
function norm(n) {
  let k = baseNorm(n);
  if (NAME_ALIASES[k]) k = NAME_ALIASES[k];
  const stripped = k.replace(MERGE_PREFIX, '');
  if (stripped.length >= 2) k = stripped;
  return NAME_ALIASES[k] || k;
}
const cleanEn = (s) =>
  s ? s.replace(/\s+Station$/i, '').replace(/\s+/g, ' ').trim() : undefined;
const slug = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---------- fetch ----------
const PAD = 0.1;
const qbox = `${BBOX.minLat - PAD},${BBOX.minLng - PAD},${BBOX.maxLat + PAD},${BBOX.maxLng + PAD}`;

async function fetchRelations(ids, name, endpoints) {
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
  }, endpoints);
}

async function main() {
  const ids = [...new Set(LINES.flatMap((l) => l.segments.filter((s) => s.rel).map((s) => s.rel)))].sort((a, b) => a - b);
  const els = new Map();
  // reuse every relation already in the on-disk cache (whatever batch it was fetched in)
  if (existsSync(CACHE_DIR)) {
    for (const f of readdirSync(CACHE_DIR).filter((f) => f.startsWith('rel-')).sort()) {
      for (const e of JSON.parse(readFileSync(join(CACHE_DIR, f), 'utf8')).elements) els.set(e.type + e.id, e);
    }
  }
  const todo = ids.filter((id) => !els.has('relation' + id));
  console.log(`${ids.length - todo.length} relations cached, ${todo.length} to fetch`);
  // relations deleted from live OSM come from the (older) mirror, a few per request
  const stale = todo.filter((id) => STALE_RELS.includes(id));
  const live = todo.filter((id) => !STALE_RELS.includes(id));
  const batches = [];
  for (let i = 0; i < live.length; i += CHUNK) batches.push([live.slice(i, i + CHUNK), undefined]);
  for (let i = 0; i < stale.length; i += 3) batches.push([stale.slice(i, i + 3), MIRROR_FIRST]);
  for (const [k, [part, endpoints]] of batches.entries()) {
    console.log(`fetching batch ${k + 1}/${batches.length} (${part.length} relations${endpoints ? ', mirror' : ''})`);
    const j = await fetchRelations(part, `rel-${part[0]}-${part.length}`, endpoints);
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
      const d = coord ? distM([n.lon, n.lat], coord) : 0;
      if (d < maxD && (!best || d < best.d)) best = { d, n };
    }
    return best?.n;
  };

  // ---------- per relation: stops + path ----------
  const relCache = new Map();
  function relationData(seg) {
    const k = `${seg.rel}|${seg.reverse ? 1 : 0}|${seg.sort ? seg.from : ''}|${seg.stopNames ? seg.stopNames.join() : ''}`;
    if (relCache.has(k)) return relCache.get(k);
    const rel = els.get('relation' + seg.rel);
    if (!rel) throw new Error(`relation ${seg.rel} not fetched`);
    let members = rel.members.filter((m) => m.type === 'node' && /^stop/.test(m.role));
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
      const t = e.tags || {};
      let ja = t.name || t['name:ja'];
      let en = cleanEn(t['name:en'] || t['name:ja-Latn'] || t['name:ja_rm']);
      // platform-style names ("元田中駅八瀬比叡山口・…方面のりば", "谷上駅4･5番線"): cut at 駅, or use the station node
      if (ja) ja = ja.replace(/駅(?!前$).+$/, '');
      if (!ja || ja === '?' || /のりば|方面/.test(ja)) {
        if (ja) en = undefined;
        const sn = lookupStationNode(null, coord, 300);
        if (!sn) continue;
        ja = sn.tags.name;
        en = cleanEn(sn.tags['name:en'] || sn.tags['name:ja-Latn'] || sn.tags['name:ja_rm']);
      }
      ja = ja.replace(/駅?\s*\d+番(のりば|線)?$/, '').replace(/駅?\d+$/, '').replace(/駅$/, ''); // 草津駅5番のりば, 甲南2
      const n = norm(ja);
      if (!en) {
        const sn = lookupStationNode(n, coord);
        if (sn) en = cleanEn(sn.tags['name:en'] || sn.tags['name:ja-Latn'] || sn.tags['name:ja_rm']);
      }
      const refs = String(t.ref || '').split(/[;,\s]+/).map((r) => r.replace(/-/g, '')).filter(Boolean);
      const prev = stops[stops.length - 1];
      if (prev && prev.norm === n) { prev.refs.push(...refs); continue; }
      stops.push({ ja, norm: n, en, coord, refs });
    }
    const ways = rel.members
      .filter((m) => m.type === 'way' && (m.role === '' || m.role === 'forward' || m.role === 'backward'))
      .map((m) => els.get('way' + m.ref))
      .filter((w) => w?.geometry && !w.tags?.public_transport && w.tags?.railway !== 'platform')
      .map((w) => w.geometry.map((p) => [p.lon, p.lat]));
    // track-only (route=railway) relation: stations come from a curated name list, each matched to
    // the same-named OSM station node closest to the relation's track
    if (seg.stopNames) {
      const pts = ways.flat().filter((_, i) => i % 3 === 0);
      stops.length = 0;
      for (const name of seg.stopNames) {
        const n = norm(name);
        let best = null;
        for (const sn of stationNodes) {
          if (norm(sn.tags.name) !== n) continue;
          const c = [sn.lon, sn.lat];
          let d = Infinity;
          for (const p of pts) { d = Math.min(d, distM(p, c)); if (d < 60) break; }
          if (!best || d < best.d) best = { d, sn };
        }
        if (!best || best.d > 800) { console.warn(`  stopNames: no OSM station ${name} near rel ${seg.rel}, skipped`); continue; }
        const t = best.sn.tags;
        stops.push({ ja: t.name.replace(/駅$/, ''), norm: n, en: cleanEn(t['name:en'] || t['name:ja-Latn']), coord: [best.sn.lon, best.sn.lat],
          refs: String(t.ref || '').split(/[;,\s]+/).map((r) => r.replace(/-/g, '')).filter(Boolean) });
      }
    }
    let path;
    let ordered = stops;
    if (seg.stopNames) {
      path = stitchGeometric(ways, stops[0].coord);
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
    const fwd = matchStops(path, ordered);
    const revPath = path.slice().reverse();
    const bwd = matchStops(revPath, ordered);
    let match = fwd;
    if (bwd.total < fwd.total) { path = revPath; match = bwd; }
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
    if (STOPS) console.log(`rel ${seg.rel} ${rel.tags.name}: ${ordered.map((s) => s.ja + (s.refs.length ? '[' + s.refs.join(',') + ']' : '')).join(' ')}`);
    if (DEBUG) {
      const bad = ordered.map((s, i) => [s, distM(path[match.idx[i]] || s.coord, s.coord)]).filter(([, d]) => d > 500);
      console.log(`rel ${seg.rel} ${rel.tags.name}: ${ordered.length} stops, ${path.length} pts, avg match ${(match.total / Math.max(1, ordered.length)).toFixed(0)} m` +
        (bad.length ? `  far: ${bad.map(([s, d]) => s.ja + ':' + d.toFixed(0)).join(' ')}` : ''));
    }
    relCache.set(k, data);
    return data;
  }

  // ---------- station clusters ----------
  const clusters = [];
  function addToCluster({ ja, norm: n, en, coord, approx, id, maxD = CLUSTER_M, lineId }) {
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
      c.coords = [];
    }
    if (!approx || c.approx) c.coords.push(coord);
    c.ja.set(ja, (c.ja.get(ja) || 0) + 1);
    if (en) c.en.set(en, (c.en.get(en) || 0) + 1);
    if (id && !c.id) c.id = id;
    if (!c.lines.includes(lineId)) c.lines.push(lineId);
    return c;
  }

  // ---------- station codes ----------
  // prefix is the display form ("M", "JR-A", "HK"); OSM refs are compared without hyphens.
  function assignCodes(stops, clusterRefs, prefix, seg) {
    if (!prefix) return;
    const P = prefix.replace(/-/g, '');
    const fmt = (v) => prefix + String(v).padStart(2, '0');
    if (seg.codeStart) {
      const dir = seg.codeDir ?? 1;
      const k0 = seg.codeFrom || 0;
      stops.forEach((s, i) => i >= k0 && clusterRefs[i].codes.add(fmt(seg.codeStart + dir * (i - k0))));
      return;
    }
    const nums = stops.map((s) => {
      for (const r of s.refs) {
        const m = /^([A-Za-z]+)(\d+)$/.exec(r);
        if (m && m[1].toUpperCase() === P.toUpperCase()) return +m[2];
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
    if (best && best.c >= 3) {
      const agree = nums.map((n, i) => n != null && (M ? wrap(n - best.d * i) : n - best.d * i) === best.k);
      const lo = agree.indexOf(true), hi = agree.lastIndexOf(true);
      for (let i = 0; i < stops.length; i++) {
        if (i >= lo && i <= hi) {
          const v = M ? wrap(best.k + best.d * i) : best.k + best.d * i;
          if (v > 0) clusterRefs[i].codes.add(fmt(v));
        } else if (nums[i] != null) clusterRefs[i].codes.add(fmt(nums[i]));
      }
    } else {
      nums.forEach((n, i) => n != null && clusterRefs[i].codes.add(fmt(n)));
    }
  }

  // ---------- build lines ----------
  const outLines = [];
  const STATUS_ORDER = ['operating', 'construction', 'approved', 'planned', 'proposed'];
  for (const line of LINES) {
    const segsOut = [];
    const order = [...line.segments.filter((s) => s.rel), ...line.segments.filter((s) => !s.rel)];
    for (const seg of order) {
      const status = seg.status || 'operating';
      let stops, path;
      if (seg.rel) {
        let rd = relationData(seg);
        // cuts may be written in either direction: flip the relation when `to` comes before `from`
        if (seg.from || seg.to) {
          const ia = seg.from ? rd.stops.findIndex((s) => s.norm === norm(seg.from)) : 0;
          const ib = seg.to ? rd.stops.findLastIndex((s) => s.norm === norm(seg.to)) : rd.stops.length - 1;
          const ok = ia >= 0 && ib >= 0 && (ib > ia || (seg.from && seg.to && norm(seg.from) === norm(seg.to)));
          if (!ok) {
            const alt = relationData({ ...seg, reverse: !seg.reverse });
            const ja = seg.from ? alt.stops.findIndex((s) => s.norm === norm(seg.from)) : 0;
            const jb = seg.to ? alt.stops.findLastIndex((s) => s.norm === norm(seg.to)) : alt.stops.length - 1;
            if (ja >= 0 && jb > ja) rd = alt;
          }
        }
        let a = 0, b = rd.stops.length - 1;
        if (seg.from) {
          for (let k = 0, from = -1; k < (seg.fromNth || 1); k++) a = from = rd.stops.findIndex((s, i) => i > from && s.norm === norm(seg.from));
          if (a < 0) { console.warn(`  CUT ${line.id}: '${seg.from}' not in rel ${seg.rel} (${rd.stops.map((s) => s.ja).join(' ')})`); continue; }
        }
        if (seg.to) {
          b = rd.stops.findIndex((s, i) => i > a && s.norm === norm(seg.to));
          if (b < 0) { console.warn(`  CUT ${line.id}: '${seg.to}' not after '${seg.from}' in rel ${seg.rel} (${rd.stops.map((s) => s.ja).join(' ')})`); continue; }
        }
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
        if (seg.skipStops) stops = stops.filter((s) => !seg.skipStops.some((x) => norm(x) === s.norm));
        const i0 = rd.idx[a], i1 = rd.idx[b];
        path = i1 > i0 ? rd.path.slice(i0, i1 + 1) : null;
      } else {
        stops = seg.stops.map((s) => {
          let coord = s.coord, approx = s.approx, en = s.nameEn;
          if (!coord) {
            const sn = lookupStationNode(norm(s.name), s.near, s.near ? 3000 : Infinity);
            if (!sn) throw new Error(`${line.id}: no station node named ${s.name}`);
            coord = [sn.lon, sn.lat];
            en = en || cleanEn(sn.tags['name:en']);
          }
          return { ja: s.name, norm: norm(s.name), en, coord, approx, id: s.id, refs: [] };
        });
        path = seg.path || null;
      }
      const cl = stops.map((s) =>
        addToCluster({ ...s, lineId: line.id, maxD: seg.rel ? CLUSTER_M : CURATED_CLUSTER_M }),
      );
      if (seg.rel) assignCodes(stops, cl, seg.codePrefix ?? line.codePrefix ?? line.code, seg);
      const out = { stations: cl, status };
      if (seg.year !== undefined) out.year = seg.year;
      if (path && path.length >= 2) out.path = simplify(path, SIMPLIFY_M).map(([x, y]) => [round5(x), round5(y)]);
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
      nameLocal: line.nameLocal,
      group: line.group,
      color: line.color,
      ...(line.textColor ? { textColor: line.textColor } : {}),
      mode: line.mode,
      status: line.status || best,
      ...(line.opened ? { opened: line.opened } : {}),
      ...(line.description ? { description: line.description } : {}),
      segments: segsOut,
      sources: line.sources,
    });
  }

  // ---------- finalize stations ----------
  const usedIds = new Set();
  const top = (m) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const lineGroup = new Map(LINES.map((l) => [l.id, l.group]));
  const groupName = new Map(GROUPS.map((g) => [g.id, g.name]));
  for (const c of clusters) {
    c.nameJa = top(c.ja);
    c.nameEn = EN_OVERRIDES[c.nameJa] || EN_OVERRIDES[c.norm] || top(c.en) || null;
    const hub = HUBS[c.norm];
    if (hub && (!hub.near || distM(c.coords[0], hub.near) < 1500)) {
      c.id = c.id || hub.id;
      c.nameEn = hub.name;
      c.nameJa = hub.nameLocal;
    }
  }
  for (const c of clusters) if (c.id) usedIds.add(c.id);
  // ids: slug of the English name; same-name stations far apart get the operator appended
  const byBase = new Map();
  for (const c of clusters) {
    if (c.id) continue;
    if (!c.nameEn) console.warn(`  no English name for ${c.nameJa} (${c.coords[0]})`);
    const base = slug(c.nameEn || c.norm) || 'station';
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base).push(c);
  }
  const collisions = [];
  for (const [base, cs] of byBase) {
    if (cs.length === 1 && !usedIds.has(base)) { cs[0].id = base; usedIds.add(base); continue; }
    for (const c of cs) {
      const g = lineGroup.get(c.lines[0]);
      let id = `${base}-${g}`;
      let k = 2;
      while (usedIds.has(id)) id = `${base}-${g}-${k++}`;
      usedIds.add(id);
      c.id = id;
      if (c.nameEn && !/\(/.test(c.nameEn)) c.nameEn = `${c.nameEn} (${groupName.get(g) || g})`;
      collisions.push(id);
    }
  }
  if (collisions.length) console.log('same-name stations kept apart:', collisions.join(', '));
  const stations = clusters.map((c) => {
    const lng = c.coords.reduce((a, x) => a + x[0], 0) / c.coords.length;
    const lat = c.coords.reduce((a, x) => a + x[1], 0) / c.coords.length;
    const s = { id: c.id, name: c.nameEn || c.nameJa, nameLocal: c.nameJa, coord: [round5(lng), round5(lat)] };
    if (c.approx) s.approx = true;
    if (c.codes.size) s.codes = [...c.codes].sort();
    return s;
  });
  for (const l of outLines) {
    for (const s of l.segments) {
      s.stations = s.stations.map((c) => c.id);
      delete s._order;
    }
  }

  const data = {
    ...CITY,
    groups: GROUPS,
    lines: outLines,
    stations,
    sources: SOURCES.map((s) => ({ ...s, accessed: CITY.updated })),
    notes: CITY.notes,
  };
  const json = JSON.stringify(data);
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, json);
  const segs = outLines.flatMap((l) => l.segments);
  const byStatus = {};
  for (const s of segs) byStatus[s.status] = (byStatus[s.status] || 0) + 1;
  console.log(`wrote ${OUT}: ${outLines.length} lines, ${segs.length} segments ${JSON.stringify(byStatus)}, ${stations.length} stations (${stations.filter((s) => s.approx).length} approx), ${(json.length / 1024).toFixed(0)} KB`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
