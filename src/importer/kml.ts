/**
 * KML (Google My Maps export, Google Earth, QGIS) -> GeoJSON FeatureCollection that follows the
 * GeoJSON importer conventions (see geojson.ts):
 * - Placemark name -> `name`; ExtendedData -> props; line style color -> `stroke` (togeojson).
 * - `key: value` / `key = value` lines in the description (plain text or HTML with <br>) become
 *   props when the key is a known prop; the remaining text stays as `description`.
 * - The enclosing Folder (a My Maps "layer") name -> `group` when the feature has none.
 * - aabbggrr colors written in ExtendedData / description are converted to #rrggbb.
 * Isomorphic: pass the browser's DOMParser or `new (await import('@xmldom/xmldom')).DOMParser()`.
 */
import { kmlWithFolders } from '@tmcw/togeojson';
import { canonicalProp, color, isEmpty, kmlColor, propKey, readProps, str } from './props';

/** Minimal DOMParser shape: the browser's DOMParser or @xmldom/xmldom's. */
export interface XmlParser {
  parseFromString(text: string, mimeType: string): unknown;
}

type Json = Record<string, unknown>;
interface Node {
  type?: string;
  meta?: Json;
  children?: Node[];
  properties?: Json | null;
  geometry?: unknown;
}

export function kmlToGeoJSON(text: string, parser: XmlParser): unknown {
  const doc = parser.parseFromString(text.replace(/^﻿/, ''), 'text/xml') as Document;
  // Browsers report parse failures as a <parsererror> element instead of throwing.
  const err = doc?.getElementsByTagName?.('parsererror')?.[0];
  if (!doc || err) throw new Error(`KML: invalid XML${err?.textContent ? `: ${err.textContent.trim().split('\n')[0]}` : ''}`);
  if (!doc.getElementsByTagName('Placemark').length) throw new Error('KML: no Placemarks found');

  const root = kmlWithFolders(doc) as unknown as Node;
  const features: Json[] = [];
  const walk = (n: Node, folder: string | undefined) => {
    for (const c of n.children ?? []) {
      if (c.type === 'folder') walk(c, str(c.meta?.name) ?? folder);
      else if (c.type === 'Feature') features.push({ type: 'Feature', geometry: c.geometry ?? null, properties: fixProps(c.properties ?? {}, folder) });
    }
  };
  walk(root, undefined);
  return { type: 'FeatureCollection', features };
}

/** Merge description key/values, folder group and KML colors into the feature properties. */
function fixProps(p: Json, folder: string | undefined): Json {
  const out: Json = { ...p };
  const desc = descriptionText(p.description);
  delete out.description;
  if (desc) {
    const rest: string[] = [];
    for (const line of desc.split('\n')) {
      const m = /^\s*([\p{L}\p{N} _.-]{1,40}?)\s*[:=]\s*(.*?)\s*$/u.exec(line);
      const key = m && canonicalProp(m[1]);
      if (key === 'description') rest.push(m![2]);
      else if (key) {
        // ExtendedData with the same name wins; description beats style-derived aliases (stroke).
        const has = Object.keys(out).some((k) => propKey(k) === propKey(key) && !isEmpty(out[k]));
        if (!has) out[key] = m![2];
      } else if (line.trim() || rest.length) rest.push(line.trimEnd());
    }
    const text = rest.join('\n').trim();
    if (text) out.description = text;
  }
  if (folder && isEmpty(readProps(out).group)) out.group = folder;
  // Colors written by hand in KML order (aabbggrr) -> #rrggbb.
  for (const [k, v] of Object.entries(out)) {
    if (canonicalProp(k) === 'color' && !color(v) && kmlColor(v)) out[k] = kmlColor(v);
  }
  return out;
}

/** togeojson gives either a string or { "@type": "html", value } for CDATA descriptions. */
function descriptionText(d: unknown): string | undefined {
  const raw = typeof d === 'string' ? d : typeof d === 'object' && d ? str((d as Json).value) : undefined;
  if (!raw) return undefined;
  if (!/<[a-z!/]/i.test(raw)) return raw.replace(/\r\n?/g, '\n');
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}
