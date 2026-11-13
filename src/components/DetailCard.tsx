import type { ReactNode } from 'react';
import type { Line, Source } from '../types';
import type { GeoModel } from '../lib/geo';
import { groupPath, STATUS_RANK } from '../lib/geo';
import { formatKm } from '../lib/text';
import { Icon, LineBullet, StatusBadge } from './bits';

export type Selection = { kind: 'line'; id: string } | { kind: 'station'; idx: number } | null;

interface Props {
  geo: GeoModel;
  selection: NonNullable<Selection>;
  onClose(): void;
  onSelectLine(id: string): void;
  onSelectStation(idx: number): void;
  onHoverLine(id: string | null): void;
}

const MODE_LABEL: Record<string, string> = {
  metro: 'Metro',
  commuter: 'Commuter rail',
  lrt: 'Light rail',
  monorail: 'Monorail',
  tram: 'Tram',
  agt: 'Automated guideway',
  shinkansen: 'Shinkansen',
};

function SourceList({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <ul className="sources">
      {sources.map((s) => (
        <li key={s.id}>
          {s.url ? (
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.title}
            </a>
          ) : (
            s.title
          )}
          {s.accessed && <span className="muted"> · accessed {s.accessed}</span>}
        </li>
      ))}
    </ul>
  );
}

function LineDetail({ geo, line, onSelectStation }: { geo: GeoModel; line: Line; onSelectStation(idx: number): void }) {
  const path = groupPath(geo, line.group);
  const computedKm = geo.lineKm.get(line.id) ?? 0;
  const years = line.segments.map((s) => s.year).filter((y): y is number => y !== undefined);
  const opened = line.opened ?? (years.length ? Math.min(...years) : undefined);
  const sourceById = new Map(geo.city.sources.map((s) => [s.id, s] as const));
  const sources = (line.sources ?? []).map((id) => sourceById.get(id)).filter((s): s is Source => !!s);
  // Unique ordered station list across segments
  const stationIds: string[] = [];
  for (const seg of line.segments) for (const id of seg.stations) if (!stationIds.includes(id)) stationIds.push(id);
  const stationName = (id: string) => {
    const idx = geo.stationIdx.get(id);
    return idx === undefined ? id : geo.stations[idx].station.name;
  };

  return (
    <>
      <div className="card-title">
        <LineBullet line={line} size="lg" />
        <div>
          <h2>{line.name}</h2>
          {line.nameLocal && line.nameLocal !== line.name && <div className="local">{line.nameLocal}</div>}
        </div>
      </div>
      <div className="card-tags">
        <StatusBadge status={line.status} />
        {path.length > 0 && <span className="tag">{path.map((g) => g.name).join(' › ')}</span>}
        {line.mode && <span className="tag">{MODE_LABEL[line.mode] ?? line.mode}</span>}
      </div>
      <dl className="facts">
        <div>
          <dt>Length</dt>
          <dd>
            {line.lengthKm !== undefined ? `${formatKm(line.lengthKm)} km` : `≈ ${formatKm(computedKm)} km`}
            {line.lengthKm === undefined && <span className="muted"> (map)</span>}
          </dd>
        </div>
        <div>
          <dt>{line.status === 'operating' ? 'Opened' : 'Target'}</dt>
          <dd>{opened ?? '—'}</dd>
        </div>
        <div>
          <dt>Stations</dt>
          <dd>{stationIds.length}</dd>
        </div>
      </dl>
      {line.description && <p className="desc">{line.description}</p>}

      <h3>Sections</h3>
      <ol className="segments">
        {line.segments.map((seg, i) => (
          <li key={i}>
            <div className="seg-main">
              <span className="seg-label">
                {seg.label ??
                  (seg.stations.length
                    ? `${stationName(seg.stations[0])} – ${stationName(seg.stations[seg.stations.length - 1])}`
                    : `Section ${i + 1}`)}
              </span>
              <span className="seg-meta">
                <StatusBadge status={seg.status} short />
                {seg.year !== undefined && <span className="line-year">{seg.year}</span>}
              </span>
            </div>
          </li>
        ))}
      </ol>

      {stationIds.length > 0 && (
        <details className="station-list">
          <summary>Stations ({stationIds.length})</summary>
          <ol>
            {stationIds.map((id) => {
              const idx = geo.stationIdx.get(id);
              if (idx === undefined) return null;
              const st = geo.stations[idx];
              return (
                <li key={id}>
                  <button type="button" className="link-btn" onClick={() => onSelectStation(idx)}>
                    {st.station.name}
                  </button>
                  {st.interchange && (
                    <span className="mini-bullets">
                      {st.lines
                        .filter((l) => l !== line.id)
                        .map((l) => {
                          const ln = geo.lineById.get(l);
                          return ln ? <LineBullet key={l} line={ln} size="sm" /> : null;
                        })}
                    </span>
                  )}
                  {st.station.approx && <span className="approx-dot" title="Approximate location" />}
                </li>
              );
            })}
          </ol>
        </details>
      )}

      {sources.length > 0 && (
        <>
          <h3>Sources</h3>
          <SourceList sources={sources} />
        </>
      )}
    </>
  );
}

function StationDetail({
  geo,
  idx,
  onSelectLine,
  onHoverLine,
}: {
  geo: GeoModel;
  idx: number;
  onSelectLine(id: string): void;
  onHoverLine(id: string | null): void;
}) {
  const st = geo.stations[idx];
  const s = st.station;
  const lineInfo = st.lines.map((id) => {
    const line = geo.lineById.get(id)!;
    const segs = st.segs.map((i) => geo.segments[i]).filter((sg) => sg.lineId === id);
    const best = segs.reduce((a, b) => (STATUS_RANK[b.status] < STATUS_RANK[a.status] ? b : a), segs[0]);
    const years = segs.filter((sg) => sg.status === best.status && sg.year !== undefined).map((sg) => sg.year!);
    return { line, status: best.status, year: years.length ? Math.min(...years) : undefined };
  });
  return (
    <>
      <div className="card-title">
        <span className={`station-glyph${st.interchange ? ' is-ic' : ''}${s.approx ? ' is-approx' : ''}`} />
        <div>
          <h2>{s.name}</h2>
          {s.nameLocal && s.nameLocal !== s.name && <div className="local">{s.nameLocal}</div>}
        </div>
      </div>
      <div className="card-tags">
        {st.interchange && <span className="tag">Interchange · {st.lines.length} lines</span>}
        {s.codes?.map((c) => (
          <span key={c} className="tag code">
            {c}
          </span>
        ))}
      </div>
      {s.approx && (
        <p className="note">Approximate location: estimated from plans, not from an official map or OpenStreetMap.</p>
      )}
      <h3>Lines</h3>
      <ul className="station-lines">
        {lineInfo.map(({ line, status, year }) => (
          <li key={line.id}>
            <button
              type="button"
              className="line-btn"
              onClick={() => onSelectLine(line.id)}
              onMouseEnter={() => onHoverLine(line.id)}
              onMouseLeave={() => onHoverLine(null)}
            >
              <LineBullet line={line} />
              <span className="line-text">
                <span className="line-name">{line.name}</span>
                <span className="line-meta">
                  <StatusBadge status={status} short />
                  {year !== undefined && <span className="line-year">{year}</span>}
                </span>
              </span>
            </button>
          </li>
        ))}
        {!lineInfo.length && <li className="muted">No line serves this station in the data.</li>}
      </ul>
    </>
  );
}

export default function DetailCard({ geo, selection, onClose, onSelectLine, onSelectStation, onHoverLine }: Props) {
  let body: ReactNode = null;
  if (selection.kind === 'line') {
    const line = geo.lineById.get(selection.id);
    if (line) body = <LineDetail geo={geo} line={line} onSelectStation={onSelectStation} />;
  } else if (geo.stations[selection.idx]) {
    body = <StationDetail geo={geo} idx={selection.idx} onSelectLine={onSelectLine} onHoverLine={onHoverLine} />;
  }
  if (!body) return null;
  return (
    <section className="card detail-card" aria-label="Details">
      <button type="button" className="icon-btn card-close" onClick={onClose} aria-label="Close details" title="Close (Esc)">
        <Icon name="close" />
      </button>
      <div className="card-scroll">{body}</div>
    </section>
  );
}
