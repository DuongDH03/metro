// Dev helper: dump wikitable rows from a vi.wikipedia wikitext file (cells joined by " | ").
import { readFileSync } from 'node:fs';
const txt = readFileSync(process.argv[2], 'utf8');
const clean = (c) => c.replace(/<ref[^>]*\/>/g, '').replace(/<ref[\s\S]*?<\/ref>/g, '').replace(/\{\{efn[\s\S]*?\}\}/g, '')
  .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').replace(/\{\{Số ga ĐSĐT Hà Nội\|([^|}]*)\|([^|}]*)[^}]*\}\}/g, '$1-$2')
  .replace(/\{\{[^}]*\}\}/g, '').replace(/'''?/g, '').replace(/<[^>]+>/g, ' ').replace(/^[^|]*?(style|rowspan|colspan|align)="[^"]*"\s*\|/g, '').replace(/\s+/g, ' ').trim();
let inTable = false, row = [];
for (const line of txt.split('\n')) {
  if (line.startsWith('{|')) { inTable = true; console.log('--- table'); continue; }
  if (line.startsWith('|}')) { if (row.length) console.log(row.join(' | ')); row = []; inTable = false; continue; }
  if (!inTable) { if (/^=+/.test(line)) console.log(line); continue; }
  if (line.startsWith('|-')) { if (row.length) console.log(row.join(' | ')); row = []; continue; }
  if (line.startsWith('|') || line.startsWith('!')) row.push(...line.slice(1).split(/\|\||!!/).map(clean));
}
