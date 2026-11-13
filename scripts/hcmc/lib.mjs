// Shared helpers for HCMC data scripts (no deps).
const UA = 'metro-vision-data-script';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function overpass(query, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
      });
      const t = await r.text();
      if (r.ok && t.trim().startsWith('{')) return JSON.parse(t);
      console.error(`overpass HTTP ${r.status}, retry ${i + 1}`);
    } catch (e) {
      console.error(`overpass error ${e.message}, retry ${i + 1}`);
    }
    await sleep(5000 * (i + 1));
  }
  throw new Error('overpass failed');
}

let lastNom = 0;
export async function nominatim(q) {
  const wait = 1100 - (Date.now() - lastNom);
  if (wait > 0) await sleep(wait);
  lastNom = Date.now();
  const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&countrycodes=vn&q=' + encodeURIComponent(q);
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('nominatim ' + r.status);
  return r.json();
}

export function haversineKm([lng1, lat1], [lng2, lat2]) {
  const r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r, dLng = (lng2 - lng1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

// Douglas-Peucker on [lng,lat] using a local equirectangular projection (metres).
export function simplify(pts, tolM = 15) {
  if (pts.length < 3) return pts;
  const lat0 = (pts[0][1] * Math.PI) / 180;
  const P = pts.map(([x, y]) => [x * 111320 * Math.cos(lat0), y * 110540]);
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let max = 0, idx = -1;
    const [ax, ay] = P[a], [bx, by] = P[b];
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = P[i];
      let t = L2 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
      t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      if (d > max) { max = d; idx = i; }
    }
    if (max > tolM) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

export const round5 = (c) => [Math.round(c[0] * 1e5) / 1e5, Math.round(c[1] * 1e5) / 1e5];
