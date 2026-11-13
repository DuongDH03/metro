// Overpass fetch helper with endpoint fallback, retry and on-disk cache.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const CACHE_DIR = join(here, '.cache');
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const UA = 'metro-vision-data-script';

// validate(json) may return an error string to reject a (stale) response and try the next endpoint.
export async function overpass(query, name, validate) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const key = (name ? name + '-' : '') + createHash('sha1').update(query).digest('hex').slice(0, 12);
  const file = join(CACHE_DIR, key + '.json');
  if (existsSync(file)) {
    const cached = JSON.parse(readFileSync(file, 'utf8'));
    if (!validate || !validate(cached)) return cached;
  }
  let lastErr;
  for (let attempt = 0; attempt < 6; attempt++) {
    const url = ENDPOINTS[attempt % ENDPOINTS.length];
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
      });
      if (res.status === 429 || res.status === 504 || res.status === 503 || res.status === 502) {
        lastErr = new Error(`${url}: HTTP ${res.status}`);
        console.warn(`  ${lastErr.message}, retrying...`);
        await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`${url}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
      const text = await res.text();
      const json = JSON.parse(text);
      if (json.remark && /runtime error|timed out/i.test(json.remark)) throw new Error(`${url}: ${json.remark}`);
      const problem = validate && validate(json);
      if (problem) throw new Error(`${url}: ${problem}`);
      writeFileSync(file, text);
      return json;
    } catch (e) {
      lastErr = e;
      console.warn(`  ${e.message}, retrying...`);
      await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
    }
  }
  throw lastErr;
}
