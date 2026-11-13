/**
 * Drafts (+ optional base CityData) -> valid CityData. The single place that assigns ids,
 * merges stations into interchanges, applies config overrides, simplifies and rounds.
 */
import type { CityData, Group, Line, LngLat, Segment, Source, Station, Status } from '../types';
import { STATUS_ORDER } from '../types';
import { distM, roundCoord, simplify } from './geo';
import type { DraftLine, DraftStation, LineOverride, NormalizeInput } from './types';

export interface NormalizeResult {
  data: CityData;
  warnings: string[];
}

const FALLBACK_COLORS = [
  '#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#9a6324',
  '#469990', '#800000', '#808000', '#000075', '#e6a700', '#6f42c1', '#2f9e44', '#c2255c',
];

/** ASCII kebab-case slug: "Cầu Giấy" -> "cau-giay", "Line 2A" -> "line-2a". */
export function slug(s: string | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Name comparison key; keeps non-Latin scripts (CJK) that slug() would erase. */
function nameKey(s: string | undefined): string {
  return (s ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[\s\-_'’.·・()（）]+/g, '')
    .replace(/(station|ga|駅|역|站)$/u, '');
}

const isStatus = (s: unknown): s is Status => typeof s === 'string' && (STATUS_ORDER as string[]).includes(s);

export function normalize(input: NormalizeInput): NormalizeResult {
  const warnings: string[] = [];
  const opt = { stationMergeMeters: 400, simplifyMeters: 15, precision: 5, ...input.options };
  const base = input.base;

  // ---------- stations ----------
  const stations = new Map<string, Station>();
  const byName = new Map<string, string[]>(); // nameKey -> station ids
  const byKey = new Map<string, string>(); // draft key -> station id
  const indexName = (st: Station) => {
    for (const k of new Set([nameKey(st.name), nameKey(st.nameLocal)])) {
      if (!k) continue;
      byName.set(k, [...(byName.get(k) ?? []), st.id]);
    }
  };
  for (const st of base?.stations ?? []) {
    stations.set(st.id, { ...st });
    indexName(st);
  }
  const uniqueId = (wanted: string, taken: (id: string) => boolean) => {
    let id = wanted || 'x';
    for (let n = 2; taken(id); n++) id = `${wanted}-${n}`;
    return id;
  };

  const mergeCodes = (s: Station, d: DraftStation) => {
    if (d.codes?.length) s.codes = [...new Set([...(s.codes ?? []), ...d.codes])];
  };
  const resolveStation = (d: DraftStation): string => {
    if (d.key && byKey.has(d.key)) {
      const id = byKey.get(d.key)!;
      mergeCodes(stations.get(id)!, d);
      return id;
    }
    const coord = roundCoord(d.coord, opt.precision);
    let found: string | undefined;
    if (d.id && stations.has(d.id)) {
      const s = stations.get(d.id)!;
      if (distM(s.coord, coord) <= opt.stationMergeMeters * 2) found = d.id;
    }
    if (!found) {
      let bestD = Infinity;
      for (const k of new Set([nameKey(d.name), nameKey(d.nameLocal)])) {
        for (const id of (k && byName.get(k)) || []) {
          const dd = distM(stations.get(id)!.coord, coord);
          if (dd <= opt.stationMergeMeters && dd < bestD) {
            bestD = dd;
            found = id;
          }
        }
      }
    }
    if (found) {
      const s = stations.get(found)!;
      // Fill gaps from the draft without overriding curated data.
      if (!s.nameLocal && d.nameLocal) s.nameLocal = d.nameLocal;
      mergeCodes(s, d);
      if (s.approx && !d.approx) {
        s.coord = coord;
        delete s.approx;
      }
    } else {
      const id = uniqueId(d.id || slug(d.name) || slug(d.nameLocal) || 'station', (x) => stations.has(x));
      const st: Station = { id, name: d.name || d.nameLocal || id, coord };
      if (d.nameLocal && d.nameLocal !== st.name) st.nameLocal = d.nameLocal;
      if (d.approx) st.approx = true;
      if (d.codes?.length) st.codes = [...new Set(d.codes)];
      stations.set(id, st);
      indexName(st);
      found = id;
    }
    if (d.key) byKey.set(d.key, found);
    return found;
  };

  // ---------- overrides ----------
  const overrides = input.overrides ?? {};
  const usedOverrides = new Set<string>();
  const findOverride = (dl: DraftLine, id: string): LineOverride | undefined => {
    const cands = [dl.key, id, dl.id, dl.code, dl.name].filter(Boolean) as string[];
    for (const c of cands) {
      for (const k of Object.keys(overrides)) {
        if (k === c || k.toLowerCase() === c.toLowerCase()) {
          usedOverrides.add(k);
          return overrides[k];
        }
      }
    }
    return undefined;
  };

  // ---------- lines ----------
  const baseLines = new Map((base?.lines ?? []).map((l) => [l.id, l] as const));
  const imported = new Map<string, Line>();
  const sourceIds = new Set<string>();
  const allSources: Source[] = [];
  const addSource = (s: Source) => {
    if (!sourceIds.has(s.id)) {
      sourceIds.add(s.id);
      allSources.push(s);
    }
  };
  for (const s of base?.sources ?? []) addSource(s);
  for (const s of input.sources ?? []) addSource(s);
  for (const d of input.drafts) for (const s of d.sources ?? []) addSource(s);

  let colorIdx = 0;
  for (const result of input.drafts) {
    warnings.push(...result.warnings);
    for (const dl of result.lines) {
      const autoId = dl.id || slug(dl.code && !/^line/i.test(dl.name) ? `line-${dl.code}` : dl.name) || 'line';
      const ov = findOverride(dl, autoId);
      if (ov?.skip) continue;
      // An explicit id (draft `id` or override `id`) that is already imported in this run means
      // "add these segments to that line" (e.g. a drawn extension of an OSM line).
      const explicit = ov?.id || dl.id;
      const id = explicit && imported.has(explicit) ? explicit : ov?.id || uniqueId(autoId, (x) => imported.has(x));
      const line: Line = {
        id,
        name: ov?.name ?? dl.name,
        group: ov?.group ?? dl.group ?? 'imported',
        color: (ov?.color ?? dl.color ?? FALLBACK_COLORS[colorIdx++ % FALLBACK_COLORS.length]).toLowerCase(),
        status: 'proposed',
        segments: [],
      };
      const opt2 = <K extends keyof Line>(k: K, v: Line[K] | undefined) => {
        if (v !== undefined && v !== null && v !== '') line[k] = v;
      };
      opt2('code', ov?.code ?? dl.code);
      opt2('nameLocal', ov?.nameLocal ?? dl.nameLocal);
      opt2('textColor', ov?.textColor ?? dl.textColor);
      opt2('mode', ov?.mode ?? dl.mode);
      opt2('lengthKm', ov?.lengthKm ?? dl.lengthKm);
      opt2('description', ov?.description ?? dl.description);
      if (!/^#[0-9a-f]{6}$/.test(line.color)) {
        warnings.push(`line ${id}: bad color "${line.color}", using a fallback`);
        line.color = FALLBACK_COLORS[colorIdx++ % FALLBACK_COLORS.length];
      }

      dl.segments.forEach((ds, i) => {
        const patch = ov?.segments?.[i] ?? undefined;
        const ids: string[] = [];
        for (const st of ds.stations) {
          const sid = resolveStation(st);
          if (ids[ids.length - 1] !== sid) ids.push(sid);
        }
        if (ids.length < 2) {
          warnings.push(`line ${id} segment ${i}: fewer than 2 distinct stations, dropped`);
          return;
        }
        let status = patch?.status ?? ds.status ?? ov?.status ?? dl.status ?? 'proposed';
        if (!isStatus(status)) {
          warnings.push(`line ${id} segment ${i}: unknown status "${status}", using "proposed"`);
          status = 'proposed';
        }
        const seg: Segment = { stations: ids, status };
        const year = patch?.year ?? ds.year ?? dl.year;
        if (year !== undefined && Number.isFinite(year)) seg.year = Math.round(year);
        const label = patch?.label ?? ds.label;
        if (label) seg.label = label;
        if (ds.path && ds.path.length >= 2) {
          const p = simplify(ds.path, opt.simplifyMeters).map((c) => roundCoord(c, opt.precision));
          if (p.length >= 2) seg.path = p as LngLat[];
        }
        line.segments.push(seg);
      });
      if (!line.segments.length) {
        warnings.push(`line ${id}: no usable segments, dropped`);
        continue;
      }
      line.status = STATUS_ORDER.find((s) => line.segments.some((g) => g.status === s))!;
      const opened = ov?.opened ?? dl.opened;
      const years = line.segments.map((s) => s.year).filter((y): y is number => y !== undefined);
      if (opened) line.opened = opened;
      else if (years.length) line.opened = Math.min(...years);
      // Operating sections with no known year date from the line's opening, so the timeline
      // doesn't show them before the line existed. Patch exact years via overrides `segments`.
      if (line.opened !== undefined)
        for (const s of line.segments) if (s.status === 'operating' && s.year === undefined) s.year = line.opened;
      const srcs = [...new Set([...(dl.sources ?? []), ...(ov?.sources ?? [])])].filter((s) => {
        if (sourceIds.has(s)) return true;
        warnings.push(`line ${id}: unknown source "${s}" ignored`);
        return false;
      });
      if (srcs.length) line.sources = srcs;
      const prev = imported.get(id);
      if (prev) {
        mergeLine(prev, line);
        continue;
      }
      if (baseLines.has(id)) warnings.push(`line ${id}: replaces the base dataset's line`);
      imported.set(id, line);
    }
  }
  for (const k of Object.keys(overrides)) {
    if (!usedOverrides.has(k)) warnings.push(`override "${k}" matched no imported line`);
  }

  const lines: Line[] = [...(base?.lines ?? []).filter((l) => !imported.has(l.id)), ...imported.values()];

  // ---------- groups ----------
  const groups: Group[] = [];
  const groupIds = new Set<string>();
  for (const g of [...(base?.groups ?? []), ...(input.groups ?? []), ...input.drafts.flatMap((d) => d.groups ?? [])]) {
    if (groupIds.has(g.id)) continue;
    groupIds.add(g.id);
    groups.push(g);
  }
  for (const l of lines) {
    if (!groupIds.has(l.group)) {
      groupIds.add(l.group);
      groups.push({ id: l.group, name: titleCase(l.group) });
    }
  }

  // ---------- prune + timeline ----------
  const used = new Set(lines.flatMap((l) => l.segments.flatMap((s) => s.stations)));
  const stationList = [...stations.values()].filter((s) => used.has(s.id));

  const years = lines.flatMap((l) => l.segments.map((s) => s.year)).filter((y): y is number => y !== undefined);
  const timeline =
    input.meta.timeline ??
    base?.timeline ??
    (years.length ? { min: Math.min(...years), max: Math.max(...years) } : undefined);

  const data: CityData = {
    id: input.meta.id,
    name: input.meta.name,
    ...(input.meta.nameLocal ? { nameLocal: input.meta.nameLocal } : {}),
    center: input.meta.center,
    zoom: input.meta.zoom,
    updated: input.meta.updated ?? new Date().toISOString().slice(0, 10),
    ...(timeline ? { timeline } : {}),
    groups,
    lines,
    stations: stationList,
    sources: allSources,
    ...(input.meta.notes ?? base?.notes ? { notes: input.meta.notes ?? base?.notes } : {}),
  };
  return { data, warnings };
}

/** Append `next`'s segments to `prev`; fill fields `prev` lacks; recompute status / opened. */
function mergeLine(prev: Line, next: Line) {
  prev.segments.push(...next.segments);
  for (const k of ['code', 'nameLocal', 'textColor', 'mode', 'lengthKm', 'description'] as const) {
    if (prev[k] === undefined && next[k] !== undefined) (prev as unknown as Record<string, unknown>)[k] = next[k];
  }
  if (next.sources) prev.sources = [...new Set([...(prev.sources ?? []), ...next.sources])];
  prev.status = STATUS_ORDER.find((s) => prev.segments.some((g) => g.status === s))!;
  if (next.opened !== undefined) prev.opened = prev.opened === undefined ? next.opened : Math.min(prev.opened, next.opened);
}

function titleCase(id: string) {
  return id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
