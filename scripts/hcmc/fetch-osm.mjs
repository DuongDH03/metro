// Downloads OSM data used by build-hcmc.mjs into ./cache (run once; build reads cache).
import { overpass } from './lib.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync(new URL('./cache/', import.meta.url), { recursive: true });
const bb = '(10.2,106.2,11.6,107.6)';
const save = (n, j) => writeFileSync(new URL(`./cache/${n}.json`, import.meta.url), JSON.stringify(j));

// 1. Operating Line 1 route relation (Bến Thành -> Suối Tiên) with way geometry
save('line1', await overpass(`[out:json][timeout:180];relation(11919223);out body;way(r);out geom;`));
// 2. Line 2 under construction, and proposed urban rail ways
save('rail-ways', await overpass(`[out:json][timeout:180];
(
 way["railway"="construction"]["construction"="subway"]${bb};
 way["railway"="proposed"]${bb};
);
out tags geom;`));
// 3. Stations / stops (operating, construction, proposed)
save('stations', await overpass(`[out:json][timeout:180];
(
 node["railway"="station"]["station"="subway"]${bb};
 node["railway"="stop"]${bb};
 node["proposed"="station"]${bb};
);
out body;`));
console.log('ok');
