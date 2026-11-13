/**
 * Load + validate city.config.json. Validation is driven by city-config.schema.json (a small
 * draft-07 subset interpreter, so the schema stays the single source of truth), plus a few
 * semantic checks. Errors carry the JSON path of the problem, e.g. `imports[1].filter.route`.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CityConfig } from '../../src/importer/types';

const here = dirname(fileURLToPath(import.meta.url));
export const SCHEMA_PATH = join(here, 'city-config.schema.json');

export class ConfigError extends Error {
  constructor(
    public file: string,
    public problems: string[],
  ) {
    super(`${file}:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  }
}

export interface LoadedConfig {
  config: CityConfig;
  /** Absolute path of city.config.json. */
  file: string;
  /** Folder holding it (input files are relative to this). */
  dir: string;
  /** Non-fatal remarks. */
  warnings: string[];
}

export function loadConfig(file: string, root: string): LoadedConfig {
  if (!existsSync(file)) throw new ConfigError(file, ['file not found']);
  const text = readFileSync(file, 'utf8').replace(/^﻿/, '');
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new ConfigError(file, [jsonErrorWithLine(text, e as Error)]);
  }
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8')) as Schema;
  const problems = validate(json, schema, schema, '');
  if (problems.length) throw new ConfigError(file, problems);

  const config = json as CityConfig;
  const warnings: string[] = [];
  const dir = dirname(file);
  // Semantic checks the schema cannot express.
  if (config.bbox) {
    const [w, s, e, n] = config.bbox;
    if (w >= e || s >= n) problems.push(`bbox: expected [minLng, minLat, maxLng, maxLat], got [${config.bbox.join(', ')}]`);
  }
  if (config.timeline && config.timeline.min > config.timeline.max) problems.push('timeline: min is greater than max');
  const groupIds = new Set((config.groups ?? []).map((g) => g.id));
  (config.groups ?? []).forEach((g, i) => {
    if (g.parent && !groupIds.has(g.parent)) problems.push(`groups[${i}].parent: unknown group "${g.parent}"`);
  });
  const dup = (arr: { id: string }[] | undefined, what: string) => {
    const seen = new Set<string>();
    arr?.forEach((x, i) => {
      if (seen.has(x.id)) problems.push(`${what}[${i}].id: duplicate id "${x.id}"`);
      seen.add(x.id);
    });
  };
  dup(config.groups, 'groups');
  dup(config.sources, 'sources');
  if (config.base && !existsSync(join(root, config.base))) problems.push(`base: "${config.base}" not found (path is relative to the project root)`);
  config.imports.forEach((imp, i) => {
    if (imp.type !== 'osm' && !existsSync(join(dir, imp.file))) {
      problems.push(`imports[${i}].file: "${imp.file}" not found next to the config`);
    }
    if (imp.type === 'osm' && !config.bbox) warnings.push(`imports[${i}]: OSM import without "bbox"; the adapter may fetch a very large area`);
  });
  if (problems.length) throw new ConfigError(file, problems);
  return { config, file, dir, warnings };
}

/** JSON.parse error -> "line L, column C: message". */
function jsonErrorWithLine(text: string, e: Error): string {
  const m = /position (\d+)/.exec(e.message);
  if (!m) return `invalid JSON: ${e.message}`;
  const pos = Number(m[1]);
  const before = text.slice(0, pos).split('\n');
  return `invalid JSON at line ${before.length}, column ${before[before.length - 1].length + 1}: ${e.message.replace(/ in JSON at position \d+.*$/, '')} (JSON allows no comments or trailing commas)`;
}

// ---------- tiny JSON Schema (draft-07 subset) validator ----------

interface Schema {
  $ref?: string;
  type?: string | string[];
  const?: unknown;
  enum?: unknown[];
  pattern?: string;
  minLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  items?: Schema | Schema[];
  required?: string[];
  properties?: Record<string, Schema>;
  additionalProperties?: boolean | Schema;
  oneOf?: Schema[];
  definitions?: Record<string, Schema>;
}

function typeOf(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  return typeof v;
}

const fmt = (v: unknown) => JSON.stringify(v);
const at = (path: string) => path || '(root)';

function resolve(s: Schema, root: Schema): Schema {
  while (s.$ref) {
    const name = s.$ref.replace('#/definitions/', '');
    const target = root.definitions?.[name];
    if (!target) throw new Error(`schema: unresolved $ref ${s.$ref}`);
    s = { ...target, ...s, $ref: target.$ref };
  }
  return s;
}

function validate(v: unknown, schema: Schema, root: Schema, path: string): string[] {
  const s = resolve(schema, root);
  const t = typeOf(v);
  if (s.type) {
    const types = Array.isArray(s.type) ? s.type : [s.type];
    const ok = types.some((x) => x === t || (x === 'number' && t === 'integer'));
    if (!ok) return [`${at(path)}: expected ${types.join(' or ')}, got ${t === 'integer' ? 'number' : t} ${fmt(v)}`];
  }
  if (s.const !== undefined && v !== s.const) return [`${at(path)}: must be ${fmt(s.const)}`];
  if (s.enum && !s.enum.includes(v)) return [`${at(path)}: ${fmt(v)} is not one of ${s.enum.map(fmt).join(', ')}${suggest(v, s.enum)}`];

  const out: string[] = [];
  if (typeof v === 'string') {
    if (s.minLength !== undefined && v.length < s.minLength) out.push(`${at(path)}: must not be empty`);
    if (s.pattern && !new RegExp(s.pattern).test(v)) out.push(`${at(path)}: ${fmt(v)} does not match ${s.pattern}`);
  }
  if (typeof v === 'number') {
    if (s.minimum !== undefined && v < s.minimum) out.push(`${at(path)}: ${v} is below ${s.minimum}`);
    if (s.maximum !== undefined && v > s.maximum) out.push(`${at(path)}: ${v} is above ${s.maximum}`);
  }
  if (Array.isArray(v)) {
    if (s.minItems !== undefined && v.length < s.minItems) out.push(`${at(path)}: needs at least ${s.minItems} item(s)`);
    if (s.maxItems !== undefined && v.length > s.maxItems) out.push(`${at(path)}: allows at most ${s.maxItems} item(s)`);
    v.forEach((item, i) => {
      const is = Array.isArray(s.items) ? s.items[i] : s.items;
      if (is) out.push(...validate(item, is, root, `${path}[${i}]`));
    });
  }
  if (t === 'object') {
    const o = v as Record<string, unknown>;
    for (const r of s.required ?? []) if (o[r] === undefined) out.push(`${at(path)}: missing required "${r}"`);
    for (const [k, val] of Object.entries(o)) {
      const p = path ? `${path}.${k}` : k;
      const ps = s.properties?.[k];
      if (ps) out.push(...validate(val, ps, root, p));
      else if (s.additionalProperties === false) {
        out.push(`${p}: unknown property${suggest(k, Object.keys(s.properties ?? {}))}`);
      } else if (typeof s.additionalProperties === 'object') out.push(...validate(val, s.additionalProperties, root, p));
    }
  }
  if (s.oneOf && !out.length) out.push(...oneOf(v, s.oneOf, root, path));
  return out;
}

/** oneOf: pick the branch by its `type` const / enum when possible, for a precise message. */
function oneOf(v: unknown, branches: Schema[], root: Schema, path: string): string[] {
  const rs = branches.map((b) => resolve(b, root));
  const disc = (v as Record<string, unknown> | null)?.type;
  const tags = rs.map((b) => {
    const ts = b.properties?.type ? resolve(b.properties.type, root) : undefined;
    return ts?.const !== undefined ? [ts.const] : ts?.enum;
  });
  if (tags.every(Boolean) && typeOf(v) === 'object') {
    const i = tags.findIndex((t) => t!.includes(disc));
    if (i < 0) return [`${path}.type: ${fmt(disc)} is not one of ${tags.flat().map(fmt).join(', ')}${suggest(disc, tags.flat())}`];
    return validate(v, rs[i], root, path);
  }
  // Report against the branches of the right JSON type (e.g. object vs null) first.
  const t = typeOf(v);
  const sameType = rs.filter((b) => !b.type || [b.type].flat().some((x) => x === t || (x === 'number' && t === 'integer')));
  const results = (sameType.length ? sameType : rs).map((b) => validate(v, b, root, path));
  if (results.some((r) => !r.length)) return [];
  return results.sort((a, b) => a.length - b.length)[0];
}

/** " (did you mean "x"?)" for near-miss keys / enum values. */
function suggest(v: unknown, options: unknown[]): string {
  if (typeof v !== 'string') return '';
  let best: string | undefined;
  let bestD = Infinity;
  for (const o of options) {
    if (typeof o !== 'string') continue;
    const d = lev(v.toLowerCase(), o.toLowerCase());
    if (d < bestD) [best, bestD] = [o, d];
  }
  return best && bestD <= Math.max(2, best.length / 3) ? ` (did you mean "${best}"?)` : '';
}

function lev(a: string, b: string): number {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return d[b.length];
}
