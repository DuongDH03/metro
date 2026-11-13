/**
 * OpenStreetMap adapter: public-transport route relations (PTv2) inside config.bbox -> DraftLines.
 *
 * Pipeline (generalised from scripts/tokyo/build.mjs):
 *  1. One Overpass query: matching route relations, their route_master parents, member ways
 *     (with geometry) and nodes, the stop_area relations of those members and the station
 *     objects (railway=station|halt / public_transport=station) near the stops.
 *  2. Lines = route_masters (or ref+network, or single routes). Each member route is a stop
 *     sequence; loops / lollipops / out-and-back routes are cut into simple pieces.
 *  3. Pieces that repeat another (reverse direction, opposite loop) or are contained in one are
 *     dropped; the longest becomes the main segment, the rest only add their uncovered runs
 *     (branches), extended by one shared station on each side.
 *  4. Geometry: member ways stitched in member order; stops matched monotonically along the
 *     chain; each segment path is the chain between its first and last station.
 *
 * Ids, cross-line station merging, overrides, simplification and rounding are left to normalize().
 */
import type { LngLat, Mode, Status } from '../../src/types';
import { distM, pathLengthM, slicePath, stitch } from '../../src/importer/geo';
import type { DraftLine, DraftSegment, DraftStation, ImportSpec, OsmFilter } from '../../src/importer/types';
import type { Adapter } from './context';
import { overpass, qlExactRegex, qlString, type OsmElement, type OsmTags, type OverpassResponse } from './overpass';

type OsmSpec = Extract<ImportSpec, { type: 'osm' }>;
type BBox = [number, number, number, number];

const SOURCE = { id: 'osm', title: 'OpenStreetMap contributors (ODbL)', url: 'https://www.openstreetmap.org/copyright' };
/** Station objects are looked up within this distance of a stop. */
const STATION_RADIUS_M = 300;
/** Pad the bbox when fetching ways / nodes so lines crossing the edge keep their geometry. */
const FETCH_PAD_DEG = 0.05;

const ROUTE_MODE: Record<string, Mode> = {
  subway: 'metro',
  light_rail: 'lrt',
  monorail: 'monorail',
  tram: 'tram',
  train: 'commuter',
  railway: 'commuter',
};

const STOP_ROLE = /^stop(_entry_only|_exit_only)?$/;
const PLATFORM_ROLE = /^platform(_entry_only|_exit_only)?$/;

// ---------------------------------------------------------------------------------------------
// query

export function buildOsmQuery(filter: OsmFilter, bbox: BBox): string {
  const [w, s, e, n] = bbox;
  const box = `${s},${w},${n},${e}`;
  const p = FETCH_PAD_DEG;
  const pbox = `${s - p},${w - p},${n + p},${e + p}`;
  let sel = `relation["type"="route"]["route"~${qlExactRegex(filter.route)}]`;
  if (filter.network?.length) sel += `["network"~${qlExactRegex(filter.network)}]`;
  if (filter.operator?.length) sel += `["operator"~${qlExactRegex(filter.operator)}]`;
  if (filter.ref?.length) sel += `["ref"~${qlExactRegex(filter.ref)}]`;
  for (const [k, v] of Object.entries(filter.tags ?? {})) sel += `[${qlString(k)}=${qlString(v)}]`;
  return `[out:json][timeout:300];
${sel}(${box})->.routes;
.routes out body;
rel(br.routes)["type"="route_master"]->.masters;
.masters out body;
way(r.routes)(${pbox})->.ways;
.ways out geom;
node(r.routes)(${pbox})->.stops;
.stops out body;
(way.ways["public_transport"="platform"];way.ways["railway"="platform"];)->.pways;
(rel(bn.stops)["public_transport"="stop_area"];rel(bw.pways)["public_transport"="stop_area"];)->.areas;
.areas out body;
(
  nwr(around.stops:${STATION_RADIUS_M})["railway"~"^(station|halt)$"];
  nwr(around.stops:${STATION_RADIUS_M})["public_transport"="station"];
  nwr(around.pways:${STATION_RADIUS_M})["railway"~"^(station|halt)$"];
  nwr(around.pways:${STATION_RADIUS_M})["public_transport"="station"];
)->.stations;
.stations out center;`;
}

/** Reject truncated / partial answers (an overloaded mirror can return 200 with missing members). */
function validateResponse(res: OverpassResponse): string | null {
  const byId = new Set(res.elements.map((e) => `${e.type}/${e.id}`));
  const routes = res.elements.filter((e) => e.type === 'relation' && e.tags?.type === 'route');
  if (!routes.length) return null; // an empty filter result is legitimate; the adapter warns
  for (const e of res.elements) {
    if (e.type === 'way' && e.nodes && !e.geometry && !e.center) return `way ${e.id} has no geometry`;
  }
  let broken = 0;
  for (const r of routes) {
    const ways = (r.members ?? []).filter((m) => m.type === 'way' && !PLATFORM_ROLE.test(m.role) && !STOP_ROLE.test(m.role));
    if (ways.length && !ways.some((m) => byId.has(`way/${m.ref}`))) broken++;
  }
  return broken > Math.max(1, routes.length * 0.25) ? `${broken}/${routes.length} routes have none of their ways` : null;
}

// ---------------------------------------------------------------------------------------------
// small helpers

const coordOf = (e: OsmElement | undefined): LngLat | undefined => {
  if (!e) return undefined;
  if (e.lat !== undefined && e.lon !== undefined) return [e.lon, e.lat];
  if (e.center) return [e.center.lon, e.center.lat];
  const g = e.geometry?.filter((p): p is { lat: number; lon: number } => !!p);
  if (g?.length) return [g.reduce((a, p) => a + p.lon, 0) / g.length, g.reduce((a, p) => a + p.lat, 0) / g.length];
  return undefined;
};

const isStation = (e: OsmElement | undefined) =>
  !!e?.tags && (/^(station|halt)$/.test(e.tags.railway ?? '') || e.tags.public_transport === 'station');

/** Name comparison key (keeps non-Latin scripts). */
const nameKey = (s: string | undefined) =>
  (s ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');

/** "Dhoby Ghaut MRT Station" -> "Dhoby Ghaut"; "Foo (NS24)" -> "Foo". */
function cleanStationName(s: string | undefined): string | undefined {
  if (!s) return undefined;
  const out = s
    .replace(/\s*[([]\s*[A-Z]{1,4}\s?\d{1,3}[A-Za-z]?(\s*[/;,]\s*[A-Z]{1,4}\s?\d{1,3}[A-Za-z]?)*\s*[)\]]\s*$/, '')
    .replace(/\s+(?:[A-Z]{2,5}\s+)?(?:station|stn\.?)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return out || s.trim();
}

const latinName = (t: OsmTags | undefined) => t?.['name:en'] || t?.['name:latin'] || t?.['int_name'] || t?.name;

/** Line name without a trailing direction: "X (A → B)", "X: A => B", "X A - B" (with from/to). */
export function stripDirection(name: string, tags: OsmTags = {}): string {
  let s = name.trim();
  s = s.replace(/\s*\(([^()]*(→|->|=>|⇒|⟶|↔|<->|↻|↺|⟳|⟲|loop|clockwise|direction|towards|bound)[^()]*)\)\s*$/i, '');
  const arrow = /\s*(→|->|=>|⇒|⟶|↔|<->)\s*/;
  const m = arrow.exec(s);
  if (m) {
    const from = tags.from && s.lastIndexOf(tags.from, m.index);
    if (from !== undefined && from !== '' && from >= 0) s = s.slice(0, from);
    else {
      const colon = s.lastIndexOf(':', m.index);
      if (colon > 0) s = s.slice(0, colon);
    }
  }
  s = s.replace(/[\s:–—-]+$/, '').trim();
  return s || name.trim();
}

/** "#abc" -> "#aabbcc"; named colours -> undefined. */
export function normColor(c: string | undefined): { color?: string; bad?: string } {
  if (!c) return {};
  const s = c.trim().toLowerCase();
  const m3 = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(s);
  if (m3) return { color: `#${m3[1]}${m3[1]}${m3[2]}${m3[2]}${m3[3]}${m3[3]}` };
  const m6 = /^#?([0-9a-f]{6})$/.exec(s);
  if (m6) return { color: `#${m6[1]}` };
  return { bad: c };
}

const yearOf = (t: OsmTags | undefined): number | undefined => {
  const v = t?.opening_date || t?.start_date || t?.['opening_date:railway'];
  const m = v && /(1[89]\d\d|20\d\d)/.exec(v);
  return m ? Number(m[1]) : undefined;
};

/** OSM lifecycle -> status ('skip' for disused / abandoned). */
function lifecycle(t: OsmTags | undefined): Status | 'skip' | undefined {
  if (!t) return undefined;
  if (t.disused || t.abandoned || t.razed || /^(disused|abandoned)$/.test(t.state ?? '')) return 'skip';
  if (t.construction || t.state === 'construction' || Object.keys(t).some((k) => k.startsWith('construction:')))
    return 'construction';
  if (t.proposed || t.state === 'proposed' || Object.keys(t).some((k) => k.startsWith('proposed:'))) return 'proposed';
  if (t.planned || t.state === 'planned') return 'planned';
  return undefined;
}

const CODE_RE = /^[A-Za-z]{0,4}[ -]?\d{1,4}[A-Za-z]?$/;
/** Station codes from ref / railway:ref / ref:<network>-like tags. */
function codesOf(t: OsmTags | undefined): string[] {
  if (!t) return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(t)) {
    if (!(k === 'ref' || k === 'railway:ref' || /^ref:[^:]+$/.test(k))) continue;
    if (/^ref:(wikidata|wikipedia|gtfs|ifopt|uic|ibnr|ds100|crs|tiploc|stanox|naptan)/i.test(k)) continue;
    for (const part of v.split(/\s*[;,/]\s*/)) {
      const c = part.trim().replace(/\s+/g, '');
      if (c && CODE_RE.test(c) && /\d/.test(c)) out.push(c.toUpperCase());
    }
  }
  return [...new Set(out)];
}

const inBox = (c: LngLat, b: BBox) => c[0] >= b[0] && c[0] <= b[2] && c[1] >= b[1] && c[1] <= b[3];

// ---------------------------------------------------------------------------------------------
// geometry: stitching and monotone stop matching

const sameP = (a: LngLat, b: LngLat) => distM(a, b) < 1;

/** Join ways in member order (orienting each), splitting where consecutive ways do not touch. */
function stitchOrdered(ways: LngLat[][]): LngLat[][] {
  const pieces: LngLat[][] = [];
  let cur: LngLat[] | null = null;
  let single = false;
  for (const w of ways) {
    if (w.length < 2) continue;
    if (!cur) {
      cur = w.slice();
      single = true;
      continue;
    }
    const end = cur[cur.length - 1];
    if (sameP(end, w[0])) cur.push(...w.slice(1));
    else if (sameP(end, w[w.length - 1])) cur.push(...w.slice(0, -1).reverse());
    else if (single && sameP(cur[0], w[0])) {
      cur.reverse();
      cur.push(...w.slice(1));
    } else if (single && sameP(cur[0], w[w.length - 1])) {
      cur.reverse();
      cur.push(...w.slice(0, -1).reverse());
    } else {
      pieces.push(cur);
      cur = w.slice();
      single = true;
      continue;
    }
    single = false;
  }
  if (cur) pieces.push(cur);
  return pieces;
}

function projector(lat0: number) {
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  return (p: LngLat): [number, number] => [p[0] * kx, p[1] * 110540];
}

interface Match {
  /** Segment index (path[i]..path[i+1]) of each stop. */
  idx: number[];
  /** Position of each stop along its segment, 0..1. */
  t: number[];
  pts: LngLat[];
  off: number[];
  total: number;
}

/** Each stop -> closest point on the path, never going backwards along it. */
function matchStops(path: LngLat[], stops: LngLat[]): Match {
  const proj = projector(path[0]?.[1] ?? 0);
  const P = path.map(proj);
  const m: Match = { idx: [], t: [], pts: [], off: [], total: 0 };
  let prev = 0;
  let prevT = 0;
  for (const s of stops) {
    const q = proj(s);
    let best = { i: prev, t: prevT, d: Infinity };
    for (let i = prev; i < P.length - 1; i++) {
      const [a, b] = [P[i], P[i + 1]];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const l2 = dx * dx + dy * dy;
      let t = l2 ? ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / l2 : 0;
      t = Math.max(i === prev ? prevT : 0, Math.min(1, t));
      const d = Math.hypot(a[0] + t * dx - q[0], a[1] + t * dy - q[1]);
      if (d < best.d) best = { i, t, d };
      if (best.d < 400 && d > best.d + 400) break;
    }
    if (!Number.isFinite(best.d)) best.d = distM(path[path.length - 1], s);
    const a = path[best.i];
    const b = path[Math.min(best.i + 1, path.length - 1)];
    m.idx.push(best.i);
    m.t.push(best.t);
    m.pts.push([a[0] + best.t * (b[0] - a[0]), a[1] + best.t * (b[1] - a[1])]);
    m.off.push(best.d);
    m.total += Math.min(best.d, 3000);
    prev = best.i;
    prevT = best.t;
  }
  return m;
}

// ---------------------------------------------------------------------------------------------
// model

interface Stop {
  key: string;
  nk: string;
  station: DraftStation;
  /** Where the stop is on the track (stop_position / platform), for matching. */
  track: LngLat;
  /** Codes on the stop / platform members themselves. */
  own: string[];
  /** Codes on the station object (often lists every line's code, incl. future ones). */
  near: string[];
}

interface Route {
  rel: OsmElement;
  name: string;
  stops: Stop[];
  chain?: LngLat[];
  match?: Match;
  status?: Status;
  year?: number;
  roundtrip: boolean;
}

interface Piece {
  route: Route;
  from: number;
  to: number;
  loop: boolean;
}

// ---------------------------------------------------------------------------------------------

export const importOsm: Adapter<OsmSpec> = async (spec, ctx) => {
  const warnings: string[] = [];
  const warn = (m: string) => warnings.push(`osm: ${m}`);
  const bbox = ctx.config.bbox as BBox | undefined;
  if (!bbox || bbox.length !== 4 || bbox.some((v) => typeof v !== 'number' || !Number.isFinite(v))) {
    throw new Error('osm import needs "bbox": [minLng, minLat, maxLng, maxLat] in city.config.json');
  }
  if (!spec.filter?.route?.length) throw new Error('osm import needs filter.route, e.g. ["subway", "light_rail"]');

  const query = buildOsmQuery(spec.filter, bbox);
  const res = await overpass(query, {
    cacheDir: ctx.cacheDir,
    refresh: ctx.refresh,
    log: ctx.log,
    name: `osm-${spec.filter.route.join('-')}`.replace(/[^a-z0-9-]+/gi, '_').slice(0, 40),
    validate: validateResponse,
  });

  // ---------- index ----------
  const els = new Map<string, OsmElement>();
  for (const e of res.elements) {
    const k = `${e.type}/${e.id}`;
    els.set(k, { ...els.get(k), ...e, tags: { ...els.get(k)?.tags, ...e.tags } });
  }
  const get = (type: string, id: number) => els.get(`${type}/${id}`);
  const all = [...els.values()];
  const routes = all.filter((e) => e.type === 'relation' && e.tags?.type === 'route');
  const masters = all.filter((e) => e.type === 'relation' && e.tags?.type === 'route_master');
  const stations = all.filter(isStation);
  /** member "type/id" -> stop_area relations containing it */
  const areasOf = new Map<string, OsmElement[]>();
  for (const a of all) {
    if (a.type !== 'relation' || a.tags?.public_transport !== 'stop_area') continue;
    for (const m of a.members ?? []) {
      const k = `${m.type}/${m.ref}`;
      areasOf.set(k, [...(areasOf.get(k) ?? []), a]);
    }
  }
  ctx.log(
    `osm: ${routes.length} routes, ${masters.length} route_masters, ${stations.length} stations (data ${res.osm3s?.timestamp_osm_base ?? '?'})`,
  );
  if (!routes.length) warn(`no route relations match ${JSON.stringify(spec.filter)} in bbox`);

  // ---------- station resolution ----------
  const nearestStation = (c: LngLat, nk: string | undefined, maxM: number) => {
    let best: { e: OsmElement; d: number } | undefined;
    for (const s of stations) {
      if (nk && nameKey(cleanStationName(s.tags?.name)) !== nk && nameKey(cleanStationName(latinName(s.tags))) !== nk) continue;
      const sc = coordOf(s);
      if (!sc) continue;
      const d = distM(sc, c);
      if (d <= maxM && (!best || d < best.d)) best = { e: s, d };
    }
    return best?.e;
  };

  /** Stop / platform member -> station identity, name, coordinate and codes. */
  const resolveStop = (el: OsmElement, lineKey: string): Stop | undefined => {
    const c = coordOf(el);
    if (!c) return undefined;
    const ownName = cleanStationName(el.tags?.name);
    let st: OsmElement | undefined = isStation(el) ? el : undefined;
    let area: OsmElement | undefined;
    if (!st) {
      for (const a of areasOf.get(`${el.type}/${el.id}`) ?? []) {
        area ??= a;
        for (const m of a.members ?? []) {
          const cand = get(m.type, m.ref);
          const cc = coordOf(cand);
          if (isStation(cand) && cc && distM(cc, c) < 1000 && (!st || distM(cc, c) < distM(coordOf(st)!, c))) {
            st = cand;
            area = a;
          }
        }
      }
    }
    if (!st && ownName) st = nearestStation(c, nameKey(ownName), STATION_RADIUS_M);
    if (!st && !ownName) st = nearestStation(c, undefined, 150);
    const t = st?.tags ?? el.tags;
    const name = cleanStationName(latinName(t)) ?? cleanStationName(latinName(el.tags)) ?? (area ? cleanStationName(latinName(area.tags)) : undefined);
    if (!name) return undefined;
    const local = cleanStationName(t?.name ?? el.tags?.name);
    const stc = coordOf(st);
    const coord = stc && distM(stc, c) <= 2 * STATION_RADIUS_M ? stc : c;
    const key = st
      ? `osm:stopgroup/${st.type}/${st.id}`
      : area
        ? `osm:stopgroup/relation/${area.id}`
        : `osm:stopgroup/${lineKey}/${nameKey(name)}`;
    const station: DraftStation = { name, coord, key };
    if (local && local !== name) station.nameLocal = local;
    return { key, nk: nameKey(name), station, track: c, own: codesOf(el.tags), near: st && st !== el ? codesOf(st.tags) : [] };
  };

  // ---------- group routes into lines ----------
  const groupBy = spec.groupBy ?? 'route_master';
  const masterOf = new Map<number, OsmElement>();
  for (const m of masters) {
    for (const mem of m.members ?? []) if (mem.type === 'relation' && !masterOf.has(mem.ref)) masterOf.set(mem.ref, m);
  }
  interface LineGroup {
    key: string;
    master?: OsmElement;
    rels: OsmElement[];
  }
  const groups = new Map<string, LineGroup>();
  for (const r of routes) {
    let key: string;
    let master: OsmElement | undefined;
    if (groupBy === 'route') key = `osm:relation/${r.id}`;
    else if ((master = masterOf.get(r.id))) key = `osm:route_master/${master.id}`;
    else if (r.tags?.ref) key = `osm:ref/${r.tags.network ?? ''}/${r.tags.ref}`;
    else key = `osm:relation/${r.id}`;
    const g = groups.get(key) ?? { key, master, rels: [] };
    g.rels.push(r);
    groups.set(key, g);
  }

  const excl = new Set((spec.exclude ?? []).map((s) => s.toLowerCase()));
  const lines: DraftLine[] = [];

  for (const g of groups.values()) {
    g.rels.sort((a, b) => a.id - b.id);
    const lt: OsmTags = g.master?.tags ?? g.rels[0].tags ?? {};
    const rawName = latinName(lt) || lt.ref || `OSM ${g.key}`;
    const name = groupBy === 'route' ? rawName : stripDirection(rawName, lt);
    const code = lt.ref || g.rels.find((r) => r.tags?.ref)?.tags?.ref;
    if ([g.key, name, rawName, code, lt.ref].some((x) => x && excl.has(x.toLowerCase()))) {
      ctx.log(`osm: excluded ${name} (${g.key})`);
      continue;
    }
    const lineStatus = lifecycle(g.master?.tags);
    if (lineStatus === 'skip') {
      warn(`${name} (${g.key}): disused/abandoned, skipped`);
      continue;
    }

    // ---------- routes: stops + chain ----------
    const rts: Route[] = [];
    const lineStops = new Map<string, Stop>();
    for (const rel of g.rels) {
      const rt = rel.tags ?? {};
      const rname = rt.name ?? `relation ${rel.id}`;
      const st = lifecycle(rt);
      if (st === 'skip') {
        warn(`${rname} (relation ${rel.id}): disused/abandoned, skipped`);
        continue;
      }
      const members = rel.members ?? [];
      let stopMs = members.filter((m) => STOP_ROLE.test(m.role));
      if (!stopMs.length) stopMs = members.filter((m) => PLATFORM_ROLE.test(m.role));
      const stops: Stop[] = [];
      let unnamed = 0;
      for (const m of stopMs) {
        const el = get(m.type, m.ref);
        if (!el) continue; // outside the fetch box
        let s = resolveStop(el, g.key);
        if (!s) {
          unnamed++;
          continue;
        }
        // One station per name within a line (routes may resolve to different OSM objects).
        const canon = lineStops.get(s.nk);
        if (canon && distM(canon.station.coord, s.station.coord) < 1000) s = { ...s, key: canon.key, station: canon.station };
        else if (!canon) lineStops.set(s.nk, s);
        const last = stops[stops.length - 1];
        if (last && (last.key === s.key || last.nk === s.nk)) {
          last.own.push(...s.own);
          last.near.push(...s.near);
          continue;
        }
        stops.push(s);
      }
      if (unnamed) warn(`${rname} (relation ${rel.id}): ${unnamed} stop(s) without a name skipped`);
      if (stops.length < 2) {
        warn(`${rname} (relation ${rel.id}): fewer than 2 stops with a name in the data, skipped`);
        continue;
      }
      const ways = members
        .filter((m) => m.type === 'way' && !STOP_ROLE.test(m.role) && !PLATFORM_ROLE.test(m.role))
        .map((m) => get('way', m.ref))
        .filter((w): w is OsmElement => !!w?.geometry && !isPlatform(w))
        .map((w) => w.geometry!.filter((p): p is { lat: number; lon: number } => !!p).map((p) => [p.lon, p.lat] as LngLat));
      const route: Route = {
        rel,
        name: rname,
        stops,
        status: st,
        year: yearOf(rt),
        roundtrip: /^(yes|true)$/i.test(rt.roundtrip ?? '') || /^(yes|true)$/i.test(rt.circular ?? ''),
      };
      // Roundtrip routes listing the terminal once: close the loop.
      if (route.roundtrip && stops.length > 2 && stops[0].key !== stops[stops.length - 1].key) {
        const keys = new Set(stops.map((s) => s.key));
        if (keys.size === stops.length) stops.push({ ...stops[0] });
      }
      buildChain(route, ways, warn);
      rts.push(route);
    }
    if (!rts.length) {
      warn(`${name} (${g.key}): no usable routes, skipped`);
      continue;
    }

    // ---------- pieces, variants, branches ----------
    const pieces = rts.flatMap((r) => splitPieces(r, warn));
    const keysOf = (p: Piece) => p.route.stops.slice(p.from, p.to + 1).map((s) => s.key);
    const statusRank = (p: Piece) => (p.route.status ? 1 : 0);
    pieces.sort(
      (a, b) =>
        statusRank(a) - statusRank(b) ||
        new Set(keysOf(b)).size - new Set(keysOf(a)).size ||
        Number(b.loop) - Number(a.loop) ||
        a.route.rel.id - b.route.rel.id,
    );
    const kept: { p: Piece; set: Set<string> }[] = [];
    for (const p of pieces) {
      const set = new Set(keysOf(p));
      if (kept.some((k) => [...set].every((x) => k.set.has(x)))) continue; // duplicate / reverse / contained
      kept.push({ p, set });
    }
    const segIdx: { route: Route; idx: number[] }[] = [];
    const covered = new Set<string>();
    kept.forEach(({ p }, i) => {
      const range = Array.from({ length: p.to - p.from + 1 }, (_, k) => p.from + k);
      if (i === 0) {
        segIdx.push({ route: p.route, idx: range });
      } else {
        // A loop is walked starting from a covered station, so a branch never wraps around its end.
        let order = range;
        const c = range.findIndex((k, j) => j < range.length - 1 && covered.has(p.route.stops[k].key));
        if (p.loop && c > 0) order = [...range.slice(c), ...range.slice(1, c + 1)];
        // Uncovered runs, extended by one shared station on each side.
        let i0 = -1;
        for (let j = 0; j <= order.length; j++) {
          const unc = j < order.length && !covered.has(p.route.stops[order[j]].key);
          if (unc && i0 < 0) i0 = j;
          if (!unc && i0 >= 0) {
            const run = order.slice(Math.max(0, i0 - 1), Math.min(order.length, j + 1));
            if (run.length >= 2) segIdx.push({ route: p.route, idx: run });
            i0 = -1;
          }
        }
      }
      for (const k of keysOf(p)) covered.add(k);
    });

    // ---------- station codes (only this line's) ----------
    assignCodes(rts);

    // ---------- clip to bbox + build draft segments ----------
    const segments: DraftSegment[] = [];
    let clipped = 0;
    for (const r of segIdx) {
      let run: number[] = [];
      const flush = () => {
        if (run.length >= 2) segments.push(makeSegment(r.route, run, lineStatus));
        run = [];
      };
      for (const k of r.idx) {
        if (inBox(r.route.stops[k].station.coord, bbox)) run.push(k);
        else {
          clipped++;
          flush();
        }
      }
      flush();
    }
    if (clipped) warn(`${name}: ${clipped} station(s) outside bbox dropped`);
    if (!segments.length) {
      warn(`${name} (${g.key}): no segment with 2+ stations inside bbox, skipped`);
      continue;
    }

    // ---------- line fields ----------
    const dl: DraftLine = { key: g.key, name, segments, sources: ['osm'] };
    const local = groupBy === 'route' ? lt.name : lt.name && stripDirection(lt.name, lt);
    if (local && local !== name) dl.nameLocal = local;
    if (code) dl.code = code;
    const colourTag = lt.colour ?? lt.color ?? g.rels.find((r) => r.tags?.colour)?.tags?.colour;
    const col = normColor(colourTag);
    if (col.color) dl.color = col.color;
    else if (col.bad) warn(`${name}: colour "${col.bad}" is not a hex colour, omitted (set it in config "lines")`);
    const routeVal = g.master?.tags?.route_master ?? g.rels[0].tags?.route ?? '';
    const mode = spec.defaults?.mode ?? ROUTE_MODE[routeVal];
    if (mode) dl.mode = mode;
    dl.status = lineStatus ?? (rts.every((r) => r.status) ? rts[0].status : undefined) ?? spec.defaults?.status ?? 'operating';
    const year = yearOf(g.master?.tags) ?? (groupBy === 'route' ? yearOf(g.rels[0].tags) : undefined);
    if (year) {
      dl.year = year;
      dl.opened = year;
    }
    if (dl.status !== 'operating') warn(`${name}: tagged as ${dl.status} in OSM`);
    lines.push(dl);
  }

  // normalize() resolves a known key without merging codes, so give every draft of the same
  // station (key) the union of the codes all lines found for it.
  const codesByKey = new Map<string, Set<string>>();
  const allStations = lines.flatMap((l) => l.segments.flatMap((s) => s.stations));
  for (const s of allStations) {
    if (!s.key || !s.codes) continue;
    const set = codesByKey.get(s.key) ?? new Set<string>();
    s.codes.forEach((c) => set.add(c));
    codesByKey.set(s.key, set);
  }
  for (const s of allStations) {
    const set = s.key && codesByKey.get(s.key);
    if (set) s.codes = [...set].sort();
  }

  ctx.log(`osm: ${lines.length} line(s)`);
  return { lines, sources: [SOURCE], warnings };
};

function isPlatform(w: OsmElement) {
  return w.tags?.public_transport === 'platform' || w.tags?.railway === 'platform';
}

/** Stitch the route's track and match its stops along it (sets route.chain / route.match). */
function buildChain(route: Route, ways: LngLat[][], warn: (m: string) => void) {
  if (!ways.length) {
    warn(`${route.name} (relation ${route.rel.id}): no track ways, segments drawn as straight lines`);
    return;
  }
  const track = route.stops.map((s) => s.track);
  let chains = stitchOrdered(ways);
  if (chains.length > 1) chains = stitch(chains, 50); // members out of order or small gaps
  const near = (c: LngLat[]) => {
    let n = 0;
    for (const p of track) if (distToPath(c, p) <= 300) n++;
    return n;
  };
  let chain = chains[0];
  if (chains.length > 1) {
    const scored = chains.map((c) => ({ c, n: near(c), len: pathLengthM(c) })).sort((a, b) => b.n - a.n || b.len - a.len);
    chain = scored[0].c;
    warn(
      `${route.name} (relation ${route.rel.id}): track is ${chains.length} disconnected pieces; using the one covering ${scored[0].n}/${track.length} stops`,
    );
  }
  // Orientation: the one that matches the stop order best.
  let match = matchStops(chain, track);
  const rev = chain.slice().reverse();
  const mRev = matchStops(rev, track);
  if (mRev.total < match.total) {
    chain = rev;
    match = mRev;
  }
  // Closed ring + loop service: rotate the ring to start at the first stop.
  const loop = route.stops.length > 2 && route.stops[0].key === route.stops[route.stops.length - 1].key;
  if (loop && distM(chain[0], chain[chain.length - 1]) < 100) {
    const m0 = matchStops(chain, [track[0]]);
    const i = m0.idx[0];
    const p = m0.pts[0];
    const ring = [p, ...chain.slice(i + 1), ...chain.slice(1, i + 1), p];
    const f = matchStops(ring, track);
    const ringRev = ring.slice().reverse();
    const b = matchStops(ringRev, track);
    [chain, match] = b.total < f.total ? [ringRev, b] : [ring, f];
  }
  const bad = match.off.filter((d) => d > 1000).length;
  if (bad > track.length / 3) {
    warn(`${route.name} (relation ${route.rel.id}): track does not follow the stops (${bad} stops > 1 km away), no path`);
    return;
  }
  route.chain = chain;
  route.match = match;
}

function distToPath(path: LngLat[], p: LngLat): number {
  const proj = projector(p[1]);
  const q = proj(p);
  let best = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const a = proj(path[i]);
    const b = proj(path[i + 1]);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy;
    const t = l2 ? Math.max(0, Math.min(1, ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / l2)) : 0;
    best = Math.min(best, Math.hypot(a[0] + t * dx - q[0], a[1] + t * dy - q[1]));
  }
  return best;
}

/**
 * Cut a route's stop sequence into simple pieces: a plain run, a loop (first == last), or for
 * routes that revisit stations a lollipop (stem + loop) / out-and-back (stem only).
 */
function splitPieces(r: Route, warn: (m: string) => void): Piece[] {
  const S = r.stops.map((s) => s.key);
  const n = S.length;
  const closed = n > 3 && S[0] === S[n - 1];
  const inner = closed ? S.slice(0, -1) : S;
  if (new Set(inner).size === inner.length) return [{ route: r, from: 0, to: n - 1, loop: closed }];
  if (S[0] === S[n - 1]) {
    let i = 0;
    while (i < n - 1 - i && S[i] === S[n - 1 - i]) i++;
    if (i >= n - 1 - i) return [{ route: r, from: 0, to: Math.floor((n - 1) / 2), loop: false }]; // out-and-back
    const loop = S.slice(i - 1, n - i);
    if (loop.length > 3 && new Set(loop.slice(0, -1)).size === loop.length - 1) {
      const out: Piece[] = [{ route: r, from: i - 1, to: n - i, loop: true }];
      if (i >= 2) out.unshift({ route: r, from: 0, to: i - 1, loop: false });
      return out;
    }
  }
  // Fallback: cut wherever a station repeats inside the current piece.
  const out: Piece[] = [];
  let start = 0;
  let seen = new Set<string>();
  for (let k = 0; k < n; k++) {
    if (seen.has(S[k])) {
      if (k - 1 > start) out.push({ route: r, from: start, to: k - 1, loop: false });
      start = k - 1;
      seen = new Set([S[k - 1]]);
    }
    seen.add(S[k]);
  }
  if (n - 1 > start) out.push({ route: r, from: start, to: n - 1, loop: false });
  warn(`${r.name} (relation ${r.rel.id}): stop sequence revisits stations, split into ${out.length} pieces`);
  return out;
}

function makeSegment(route: Route, idx: number[], lineStatus: Status | undefined): DraftSegment {
  const stops = idx.map((k) => route.stops[k]);
  const seg: DraftSegment = { stations: stops.map((s) => ({ ...s.station })) };
  if (route.status && route.status !== lineStatus) seg.status = route.status;
  if (route.year) seg.year = route.year;
  const { chain, match } = route;
  if (!chain || !match) return seg;
  const n = route.stops.length;
  /** Chain between stops i and j (j < i: wrap around a loop through its closing stop). */
  const piece = (i: number, j: number): LngLat[] | undefined => {
    if (j < i) {
      const a = i < n - 1 ? piece(i, n - 1) : [match.pts[n - 1]];
      const b = piece(0, j);
      return a && b ? [...a, ...b.slice(1)] : undefined;
    }
    if (match.off[i] > 1000 || match.off[j] > 1000) return undefined;
    const fwd = match.idx[i] < match.idx[j] || (match.idx[i] === match.idx[j] && match.t[i] <= match.t[j]);
    if (!fwd) return undefined;
    return [match.pts[i], ...chain.slice(match.idx[i] + 1, match.idx[j] + 1), match.pts[j]];
  };
  const path: LngLat[] = [];
  for (let k = 1; k < idx.length; k++) {
    const p = piece(idx[k - 1], idx[k]);
    if (!p) {
      path.length = 0;
      break;
    }
    path.push(...(path.length ? p.slice(1) : p));
  }
  if (path.length >= 2) seg.path = path;
  else if (stops[0].key !== stops[stops.length - 1].key) seg.path = slicePath(chain, stops[0].track, stops[stops.length - 1].track);
  return seg;
}

const CODE_PARTS = /^([A-Z]*)[ -]?(\d+)[A-Z]?$/;
const parseCode = (c: string) => {
  const m = CODE_PARTS.exec(c);
  return m ? { p: m[1], n: Number(m[2]) } : undefined;
};

/**
 * Station objects often list every line's code (and future lines'). A code prefix belongs to
 * this line when consecutive stops carry it with consecutive-ish numbers (NS24, NS25 / CE1, CE2).
 */
function assignCodes(rts: Route[]) {
  const prefixes = new Set<string>();
  for (const r of rts) {
    for (let i = 1; i < r.stops.length; i++) {
      const a = [...r.stops[i - 1].own, ...r.stops[i - 1].near].map(parseCode);
      const b = [...r.stops[i].own, ...r.stops[i].near].map(parseCode);
      for (const x of a) for (const y of b) if (x && y && x.p === y.p && Math.abs(x.n - y.n) >= 1 && Math.abs(x.n - y.n) <= 3) prefixes.add(x.p);
    }
  }
  const codes = new Map<DraftStation, Set<string>>();
  for (const r of rts) {
    for (const s of r.stops) {
      const keep = prefixes.size
        ? [...s.own, ...s.near].filter((c) => prefixes.has(parseCode(c)?.p ?? '-'))
        : s.own.filter((c) => /[A-Z]/.test(c));
      const set = codes.get(s.station) ?? new Set<string>();
      for (const c of keep) set.add(c);
      codes.set(s.station, set);
    }
  }
  for (const [st, set] of codes) {
    if (set.size) st.codes = [...set].sort();
    else delete st.codes;
  }
}
