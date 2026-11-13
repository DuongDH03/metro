/** Geometry helpers shared by importer adapters (isomorphic, no deps). */
import type { LngLat } from '../types';

const R = 6371008.8;
const RAD = Math.PI / 180;

export function distM(a: LngLat, b: LngLat): number {
  const dLat = (b[1] - a[1]) * RAD;
  const dLng = (b[0] - a[0]) * RAD;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function pathLengthM(path: LngLat[]): number {
  let m = 0;
  for (let i = 1; i < path.length; i++) m += distM(path[i - 1], path[i]);
  return m;
}

/** Local equirectangular projection to metres around a reference latitude. */
function projector(lat0: number) {
  const kx = R * RAD * Math.cos(lat0 * RAD);
  const ky = R * RAD;
  return (p: LngLat): [number, number] => [p[0] * kx, p[1] * ky];
}

/** Douglas-Peucker simplification with a tolerance in metres. Keeps endpoints. */
export function simplify(path: LngLat[], toleranceM: number): LngLat[] {
  if (path.length <= 2 || toleranceM <= 0) return path.slice();
  const proj = projector(path[0][1]);
  const pts = path.map(proj);
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  const tol2 = toleranceM * toleranceM;
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let maxD = -1;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = segDist2(pts[i], pts[a], pts[b]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (idx > 0 && maxD > tol2) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return path.filter((_, i) => keep[i]);
}

function segDist2(p: [number, number], a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const x = a[0] + t * dx - p[0];
  const y = a[1] + t * dy - p[1];
  return x * x + y * y;
}

export function roundCoord(c: LngLat, precision = 5): LngLat {
  const f = 10 ** precision;
  return [Math.round(c[0] * f) / f, Math.round(c[1] * f) / f];
}

export interface Projection {
  /** Distance along the path to the closest point, metres. */
  along: number;
  /** Distance from the point to the path, metres. */
  offset: number;
  /** Index of the path vertex starting the closest segment. */
  index: number;
  /** Closest point on the path. */
  point: LngLat;
}

/** Project a point onto a polyline. */
export function projectOnPath(path: LngLat[], p: LngLat): Projection {
  const proj = projector(p[1]);
  const q = proj(p);
  let best: Projection = { along: 0, offset: Infinity, index: 0, point: path[0] };
  let acc = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = proj(path[i]);
    const b = proj(path[i + 1]);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / l2 : 0;
    t = Math.max(0, Math.min(1, t));
    const x = a[0] + t * dx;
    const y = a[1] + t * dy;
    const off = Math.hypot(x - q[0], y - q[1]);
    const segLen = Math.sqrt(l2);
    if (off < best.offset) {
      best = {
        along: acc + t * segLen,
        offset: off,
        index: i,
        point: [path[i][0] + t * (path[i + 1][0] - path[i][0]), path[i][1] + t * (path[i + 1][1] - path[i][1])],
      };
    }
    acc += segLen;
  }
  if (path.length === 1) best.offset = distM(path[0], p);
  return best;
}

/** Sub-path between the projections of `from` and `to` (in path order of from -> to). */
export function slicePath(path: LngLat[], from: LngLat, to: LngLat): LngLat[] {
  if (path.length < 2) return [from, to];
  const a = projectOnPath(path, from);
  const b = projectOnPath(path, to);
  const forward = a.along <= b.along;
  const [s, e] = forward ? [a, b] : [b, a];
  const out: LngLat[] = [s.point, ...path.slice(s.index + 1, e.index + 1), e.point];
  return forward ? out : out.reverse();
}

/**
 * Chain unordered polylines (e.g. OSM ways) into as few polylines as possible by joining
 * shared / nearby endpoints (within joinM). Returns the chains, longest first.
 */
export function stitch(parts: LngLat[][], joinM = 30): LngLat[][] {
  const pool = parts.filter((p) => p.length >= 2).map((p) => p.slice());
  const chains: LngLat[][] = [];
  while (pool.length) {
    let chain = pool.shift()!;
    let grown = true;
    while (grown) {
      grown = false;
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        const head = chain[0];
        const tail = chain[chain.length - 1];
        if (distM(tail, p[0]) <= joinM) chain = chain.concat(p.slice(1));
        else if (distM(tail, p[p.length - 1]) <= joinM) chain = chain.concat(p.slice(0, -1).reverse());
        else if (distM(head, p[p.length - 1]) <= joinM) chain = p.slice(0, -1).concat(chain);
        else if (distM(head, p[0]) <= joinM) chain = p.slice(1).reverse().concat(chain);
        else continue;
        pool.splice(i, 1);
        grown = true;
        break;
      }
    }
    chains.push(chain);
  }
  return chains.sort((x, y) => pathLengthM(y) - pathLengthM(x));
}
