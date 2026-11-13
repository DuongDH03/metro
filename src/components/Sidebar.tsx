import type { CityIndexEntry, Status } from '../types';
import { STATUS_ORDER } from '../types';
import type { GeoModel, GroupNode } from '../lib/geo';
import { STATUS_HINT, STATUS_SHORT } from '../lib/text';
import GroupTree from './GroupTree';
import SearchBox from './SearchBox';
import { Icon, StatusSwatch } from './bits';

interface Props {
  open: boolean;
  onToggleOpen(): void;
  cities: CityIndexEntry[] | null;
  /** Session-only imported cities, shown as "<name> (imported)". */
  imported: CityIndexEntry[];
  cityId: string | null;
  onCity(id: string): void;
  geo: GeoModel | null;
  tree: GroupNode[];
  loading: boolean;

  hidden: ReadonlySet<string>;
  active: ReadonlySet<string>;
  statuses: ReadonlySet<Status>;
  year: number;
  yearLabel: string;
  playing: boolean;
  selectedLine: string | null;

  onSetLines(ids: string[], visible: boolean): void;
  onToggleStatus(s: Status): void;
  onYear(y: number): void;
  onTogglePlay(): void;
  onSelectLine(id: string): void;
  onSelectStation(idx: number): void;
  onHoverLine(id: string | null): void;
  onInfo(): void;
  onImport(): void;
}

export default function Sidebar(p: Props) {
  const geo = p.geo;
  const statusCounts = new Map<Status, number>();
  if (geo) {
    for (const l of geo.city.lines) {
      const seen = new Set(l.segments.map((s) => s.status));
      for (const s of seen) statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
    }
  }
  const allIds = geo?.city.lines.map((l) => l.id) ?? [];
  const tl = geo?.timeline;
  const pct = tl && tl.max > tl.min ? ((p.year - tl.min) / (tl.max - tl.min)) * 100 : 100;

  return (
    <aside className={`sidebar${p.open ? ' is-open' : ''}`} aria-label="Map controls">
      <header className="sb-head">
        <button
          type="button"
          className="icon-btn sb-toggle"
          onClick={p.onToggleOpen}
          aria-expanded={p.open}
          aria-label={p.open ? 'Collapse panel' : 'Expand panel'}
          title={p.open ? 'Collapse panel' : 'Expand panel'}
        >
          <Icon name="menu" />
        </button>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">Metro Vision</span>
        </div>
        <label className="city-picker">
          <span className="sr-only">City</span>
          <select
            value={p.cityId ?? ''}
            onChange={(e) => p.onCity(e.target.value)}
            disabled={!p.cities?.length && !p.imported.length}
          >
            {!p.cities && !p.imported.length && <option value="">Loading…</option>}
            {p.cities?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.nameLocal && c.nameLocal !== c.name ? ` · ${c.nameLocal}` : ''}
              </option>
            ))}
            {p.imported.length > 0 && (
              <optgroup label="Imported (this session)">
                {p.imported.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (imported)
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
      </header>

      <div className="sb-body">
        <SearchBox geo={geo} onPickLine={p.onSelectLine} onPickStation={p.onSelectStation} />

        {tl && (
          <section className="sb-section timeline" aria-label="Timeline">
            <div className="timeline-row">
              <button
                type="button"
                className="play-btn"
                onClick={p.onTogglePlay}
                aria-label={p.playing ? 'Pause timeline' : 'Play timeline'}
                title={p.playing ? 'Pause' : 'Play the plan year by year'}
              >
                <Icon name={p.playing ? 'pause' : 'play'} />
              </button>
              <div className="timeline-track">
                <input
                  type="range"
                  className="range"
                  min={tl.min}
                  max={tl.max}
                  step={1}
                  value={p.year}
                  style={{ ['--pct' as string]: `${pct}%` }}
                  aria-label="Year"
                  aria-valuetext={p.yearLabel}
                  onChange={(e) => p.onYear(Number(e.target.value))}
                />
                <div className="timeline-ticks" aria-hidden="true">
                  <span>{tl.min}</span>
                  <span className="timeline-current">{p.yearLabel}</span>
                  <span>
                    {tl.max}
                    {tl.hasBeyond ? '+' : ''}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="sb-section" aria-label="Status filter">
          <div className="chips">
            {STATUS_ORDER.map((s) => {
              const on = p.statuses.has(s);
              const count = statusCounts.get(s) ?? 0;
              return (
                <button
                  key={s}
                  type="button"
                  className={`chip chip-${s}${on ? ' is-on' : ''}`}
                  aria-pressed={on}
                  title={STATUS_HINT[s]}
                  onClick={() => p.onToggleStatus(s)}
                  disabled={!geo}
                >
                  <StatusSwatch status={s} color={on ? 'var(--chip-line)' : 'var(--muted)'} />
                  <span>{STATUS_SHORT[s]}</span>
                  {geo && <span className="chip-count">{count}</span>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="sb-section lines-section" aria-label="Lines">
          <div className="section-head">
            <h2>Lines</h2>
            <div className="section-actions">
              <button type="button" className="link-btn" onClick={() => p.onSetLines(allIds, true)} disabled={!geo}>
                All
              </button>
              <button type="button" className="link-btn" onClick={() => p.onSetLines(allIds, false)} disabled={!geo}>
                None
              </button>
            </div>
          </div>
          {p.loading && <p className="muted">Loading lines…</p>}
          {geo && (
            <GroupTree
              tree={p.tree}
              hidden={p.hidden}
              active={p.active}
              selectedLine={p.selectedLine}
              onSetLines={p.onSetLines}
              onSelectLine={p.onSelectLine}
              onHoverLine={p.onHoverLine}
            />
          )}
        </section>

        <footer className="sb-foot">
          <div className="sb-foot-actions">
            <button type="button" className="link-btn" onClick={p.onInfo}>
              <Icon name="info" /> About this data
            </button>
            <button
              type="button"
              className="link-btn"
              onClick={p.onImport}
              title="Open a CityData .json, or add lines from a .geojson / .kml (you can also drop files on the map)"
            >
              <Icon name="upload" /> Import file…
            </button>
          </div>
          {geo?.city.updated && <span className="muted">Updated {geo.city.updated}</span>}
        </footer>
      </div>
    </aside>
  );
}
