import { nominatim } from './lib.mjs';
for (const q of process.argv.slice(2)) {
  try { const r = await nominatim(q); console.log('##', q); for (const x of r.slice(0,3)) console.log('   ', (+x.lon).toFixed(5), (+x.lat).toFixed(5), x.type, '|', x.display_name.slice(0,110)); }
  catch (e) { console.log('##', q, 'ERR', e.message); }
}
