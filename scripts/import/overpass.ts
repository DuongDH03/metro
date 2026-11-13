/**
 * Overpass API client for the importer: endpoint fallback, retry with backoff, staleness /
 * completeness checks and an on-disk cache keyed by a hash of the query.
 *
 * Lessons from scripts/tokyo/overpass.mjs: mirrors can be minutes or weeks behind the main
 * server (newly created relations are then simply missing), and an overloaded server answers
 * with HTTP 200 + a "runtime error" remark and truncated data. Both must be rejected, not cached.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const USER_AGENT = 'metro-vision-importer';

export type OsmTags = Record<string, string>;

export interface OsmMember {
  type: 'node' | 'way' | 'relation';
  ref: number;
  role: string;
}

export interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  tags?: OsmTags;
  /** node */
  lat?: number;
  lon?: number;
  /** way (out geom) */
  geometry?: ({ lat: number; lon: number } | null)[];
  nodes?: number[];
  /** relation */
  members?: OsmMember[];
  /** way / relation with `out center` */
  center?: { lat: number; lon: number };
}

export interface OverpassResponse {
  version?: number;
  osm3s?: { timestamp_osm_base?: string };
  remark?: string;
  elements: OsmElement[];
}

export interface OverpassOptions {
  cacheDir: string;
  /** Ignore the cache (still writes it). */
  refresh?: boolean;
  log?: (msg: string) => void;
  /** Human-readable prefix of the cache file name, e.g. "osm-routes". */
  name?: string;
  /** Return an error string to reject a response (e.g. incomplete data); the next server is tried. */
  validate?: (res: OverpassResponse) => string | null | undefined;
  /** Responses whose data is older than this are treated as stale mirrors. Default 30 days. */
  maxAgeDays?: number;
  /** Total attempts across all endpoints. Default 7. */
  attempts?: number;
  /** Per-request timeout. Default 240 s. */
  timeoutMs?: number;
  endpoints?: string[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function queryHash(query: string): string {
  return createHash('sha1').update(query.replace(/\s+/g, ' ').trim()).digest('hex').slice(0, 16);
}

/** Run an Overpass QL query (must request [out:json]) with retries, fallback servers and caching. */
export async function overpass(query: string, opts: OverpassOptions): Promise<OverpassResponse> {
  const log = opts.log ?? (() => {});
  const endpoints = opts.endpoints ?? OVERPASS_ENDPOINTS;
  const maxAgeMs = (opts.maxAgeDays ?? 30) * 86400e3;
  const attempts = opts.attempts ?? 7;
  const timeoutMs = opts.timeoutMs ?? 240e3;

  mkdirSync(opts.cacheDir, { recursive: true });
  const file = join(opts.cacheDir, `${opts.name ? opts.name + '-' : ''}${queryHash(query)}.json`);
  if (!opts.refresh && existsSync(file)) {
    try {
      const cached = JSON.parse(readFileSync(file, 'utf8')) as OverpassResponse;
      const problem = check(cached, opts.validate);
      if (!problem) {
        log(`overpass: using cache ${file} (data from ${cached.osm3s?.timestamp_osm_base ?? 'unknown date'})`);
        return cached;
      }
      log(`overpass: ignoring cache (${problem})`);
    } catch {
      log('overpass: unreadable cache, downloading again');
    }
  }

  let lastErr: Error | undefined;
  let stale: { text: string; res: OverpassResponse; age: number; url: string } | undefined;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const url = endpoints[attempt % endpoints.length];
    const host = new URL(url).host;
    const backoff = Math.min(60e3, 3000 * 2 ** Math.floor(attempt / endpoints.length)) + Math.random() * 1000;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      log(`overpass: querying ${host}${attempt ? ` (attempt ${attempt + 1}/${attempts})` : ''}...`);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'data=' + encodeURIComponent(query),
        signal: ctrl.signal,
      });
      if (res.status === 429 || res.status >= 500) {
        throw new RetryableError(`${host}: HTTP ${res.status}`);
      }
      const text = await res.text();
      if (!res.ok) {
        // 400 = query syntax error: retrying elsewhere will not help.
        throw new Error(`${host}: HTTP ${res.status}: ${text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 400)}`);
      }
      let json: OverpassResponse;
      try {
        json = JSON.parse(text) as OverpassResponse;
      } catch {
        throw new RetryableError(`${host}: response is not JSON (${text.slice(0, 120).replace(/\s+/g, ' ')})`);
      }
      const problem = check(json, opts.validate);
      if (problem) throw new RetryableError(`${host}: ${problem}`);
      const ts = Date.parse(json.osm3s?.timestamp_osm_base ?? '');
      const age = Number.isFinite(ts) ? Date.now() - ts : 0;
      if (age > maxAgeMs) {
        if (!stale || age < stale.age) stale = { text, res: json, age, url: host };
        throw new RetryableError(`${host}: stale data (${json.osm3s?.timestamp_osm_base})`);
      }
      writeFileSync(file, text);
      return json;
    } catch (e) {
      const err = e as Error;
      const msg = err.name === 'AbortError' ? `${host}: timed out after ${timeoutMs / 1000} s` : err.message;
      lastErr = new Error(msg);
      if (!(e instanceof RetryableError) && err.name !== 'AbortError' && !(err instanceof TypeError)) {
        // Non-retryable (bad query); TypeError = network failure from fetch, which is retryable.
        throw lastErr;
      }
      if (attempt < attempts - 1) {
        log(`overpass: ${msg}; retrying in ${(backoff / 1000).toFixed(0)} s`);
        await sleep(backoff);
      }
    } finally {
      clearTimeout(timer);
    }
  }
  if (stale) {
    log(`overpass: WARNING only stale data available, using ${stale.url} (${stale.res.osm3s?.timestamp_osm_base})`);
    writeFileSync(file, stale.text);
    return stale.res;
  }
  throw new Error(`Overpass failed after ${attempts} attempts: ${lastErr?.message ?? 'unknown error'}`);
}

class RetryableError extends Error {}

function check(res: OverpassResponse, validate: OverpassOptions['validate']): string | null {
  if (!res || !Array.isArray(res.elements)) return 'no elements array';
  // Overloaded servers return 200 with a remark and partial data.
  if (res.remark && /runtime error|timed out|out of memory|too many/i.test(res.remark)) return `server remark: ${res.remark}`;
  return validate?.(res) || null;
}

/** Overpass QL string literal. */
export function qlString(s: string): string {
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

/** Overpass regex alternation matching any of the values exactly: ^(a|b)$ */
export function qlExactRegex(values: string[]): string {
  const esc = values.map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return qlString(`^(${esc.join('|')})$`);
}
