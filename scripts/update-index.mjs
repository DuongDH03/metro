#!/usr/bin/env node
// Recomputes each city's `bbox` in public/data/cities.json from its data file (all stations and
// track geometry, padded by ~3 km). The app uses it to suggest switching city when you pan into
// another city's area. Run after any data change: `npm run index` (the data:* scripts do it).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = join(root, 'public/data/cities.json');
const PAD_KM = 3;

const index = JSON.parse(readFileSync(indexPath, 'utf8'));
for (const entry of index) {
  const file = join(root, 'public', entry.file);
  if (!existsSync(file)) continue;
  const data = JSON.parse(readFileSync(file, 'utf8'));
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const add = ([x, y]) => {
    w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y);
  };
  for (const st of data.stations ?? []) add(st.coord);
  for (const l of data.lines ?? []) for (const seg of l.segments ?? []) for (const c of seg.path ?? []) add(c);
  if (!Number.isFinite(w)) continue;
  const dLat = PAD_KM / 110.57;
  const dLng = PAD_KM / (111.32 * Math.cos(((s + n) / 2) * (Math.PI / 180)));
  const r = (v) => Math.round(v * 1000) / 1000;
  entry.bbox = [r(w - dLng), r(s - dLat), r(e + dLng), r(n + dLat)];
}

// One entry per line, same style as the importer writes.
const text = `[\n${index.map((c) => `  ${JSON.stringify(c, null, 1).replace(/\n\s*/g, ' ').replace(/\[ /g, '[').replace(/ \]/g, ']')}`).join(',\n')}\n]\n`;
writeFileSync(indexPath, text);
for (const c of index) console.log(`${c.id.padEnd(12)} bbox ${JSON.stringify(c.bbox ?? null)}`);
