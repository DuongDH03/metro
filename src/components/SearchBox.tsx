import { useId, useMemo, useState } from 'react';
import type { GeoModel } from '../lib/geo';
import { compact, normalize } from '../lib/text';
import { LineBullet, Icon } from './bits';

type Result = { kind: 'station'; idx: number; score: number } | { kind: 'line'; id: string; score: number };

interface Props {
  geo: GeoModel | null;
  onPickStation(idx: number): void;
  onPickLine(id: string): void;
}

function score(keys: string[], q: string, qc: string): number {
  let best = 0;
  for (const k of keys) {
    if (!k) continue;
    if (k === q || k === qc) return 100;
    if (k.startsWith(q) || k.startsWith(qc)) best = Math.max(best, 80);
    else if (k.includes(` ${q}`)) best = Math.max(best, 60);
    else if (k.includes(q) || (qc.length >= 3 && k.includes(qc))) best = Math.max(best, 40);
  }
  return best;
}

export default function SearchBox({ geo, onPickStation, onPickLine }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  const lineKeys = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const l of geo?.city.lines ?? []) {
      m.set(l.id, [normalize(l.name), normalize(l.nameLocal), compact(l.name), compact(l.code), compact(l.id)].filter(Boolean));
    }
    return m;
  }, [geo]);

  const results = useMemo<Result[]>(() => {
    const q = normalize(query);
    const qc = compact(query);
    if (!geo || !qc) return [];
    const out: Result[] = [];
    for (const [id, keys] of lineKeys) {
      const s = score(keys, q, qc);
      if (s) out.push({ kind: 'line', id, score: s + 5 });
    }
    for (const st of geo.stations) {
      if (!st.lines.length) continue;
      const s = score(st.search, q, qc);
      if (s) out.push({ kind: 'station', idx: st.idx, score: s + Math.min(st.lines.length, 4) });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, 12);
  }, [geo, lineKeys, query]);

  const pick = (r: Result) => {
    if (r.kind === 'station') onPickStation(r.idx);
    else onPickLine(r.id);
    setOpen(false);
    setQuery('');
  };

  const showList = open && results.length > 0;
  const noMatch = open && !!compact(query) && results.length === 0;

  return (
    <div className="search">
      <span className="search-icon">
        <Icon name="search" />
      </span>
      <input
        type="search"
        className="search-input"
        placeholder="Search stations or lines…"
        value={query}
        disabled={!geo}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter' && results[active]) {
            e.preventDefault();
            pick(results[active]);
          } else if (e.key === 'Escape') {
            e.stopPropagation();
            setOpen(false);
            setQuery('');
          }
        }}
      />
      {showList && geo && (
        <ul className="search-results" id={listId} role="listbox">
          {results.map((r, i) => {
            if (r.kind === 'line') {
              const line = geo.lineById.get(r.id)!;
              return (
                <li
                  key={`l-${r.id}`}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={i === active ? 'is-active' : ''}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(r)}
                >
                  <LineBullet line={line} size="sm" />
                  <span className="sr-name">{line.name}</span>
                  <span className="sr-kind">line</span>
                </li>
              );
            }
            const st = geo.stations[r.idx];
            return (
              <li
                key={`s-${r.idx}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={i === active ? 'is-active' : ''}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(r)}
              >
                <span className="sr-bullets">
                  {st.lines.slice(0, 4).map((id) => {
                    const l = geo.lineById.get(id);
                    return l ? <LineBullet key={id} line={l} size="sm" /> : null;
                  })}
                </span>
                <span className="sr-name">
                  {st.station.name}
                  {st.station.nameLocal && st.station.nameLocal !== st.station.name && (
                    <span className="local"> {st.station.nameLocal}</span>
                  )}
                </span>
                {st.station.codes?.length ? <span className="sr-kind">{st.station.codes.slice(0, 2).join(' · ')}</span> : null}
              </li>
            );
          })}
        </ul>
      )}
      {noMatch && <div className="search-results search-empty">No matches</div>}
    </div>
  );
}
