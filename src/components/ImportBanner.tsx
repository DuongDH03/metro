import { Icon } from './bits';

export type ImportBannerState =
  | { kind: 'busy'; fileName: string }
  | {
      kind: 'done';
      fileName: string;
      lines: number;
      stations: number;
      warnings: string[];
      /** e.g. "Added to Hanoi as “Imported: lines”." */
      detail: string;
    }
  | { kind: 'error'; fileName: string; message: string };

interface Props {
  state: ImportBannerState;
  onDismiss(): void;
  onDownload(): void;
  onDiscard(): void;
}

const MAX_WARNINGS = 200;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export default function ImportBanner({ state, onDismiss, onDownload, onDiscard }: Props) {
  if (state.kind === 'busy') {
    return (
      <div className="card import-banner" role="status">
        <div className="ib-head">
          <span className="spinner" aria-hidden="true" />
          <p className="ib-title">Importing {state.fileName}…</p>
        </div>
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className="card import-banner is-error" role="alert">
        <div className="ib-head">
          <span className="ib-icon" aria-hidden="true">
            <Icon name="alert" />
          </span>
          <div className="ib-text">
            <p className="ib-title">Couldn’t import {state.fileName}</p>
            <p className="ib-detail">{state.message}</p>
          </div>
          <button type="button" className="icon-btn small" onClick={onDismiss} aria-label="Dismiss import message">
            <Icon name="close" />
          </button>
        </div>
      </div>
    );
  }

  const w = state.warnings;
  return (
    <div className="card import-banner" role="status">
      <div className="ib-head">
        <span className="ib-icon is-ok" aria-hidden="true">
          <Icon name="upload" />
        </span>
        <div className="ib-text">
          <p className="ib-title">
            Imported {state.fileName}: {plural(state.lines, 'line')}, {plural(state.stations, 'station')}
          </p>
          <p className="ib-detail">{state.detail}</p>
        </div>
        <button type="button" className="icon-btn small" onClick={onDismiss} aria-label="Dismiss import message">
          <Icon name="close" />
        </button>
      </div>
      {w.length > 0 && (
        <details className="ib-warnings">
          <summary>{plural(w.length, 'warning')}</summary>
          <ul>
            {w.slice(0, MAX_WARNINGS).map((m, i) => (
              <li key={i}>{m}</li>
            ))}
            {w.length > MAX_WARNINGS && <li className="muted">…and {w.length - MAX_WARNINGS} more</li>}
          </ul>
        </details>
      )}
      <div className="ib-actions">
        <button type="button" className="btn btn-small" onClick={onDownload}>
          <Icon name="download" /> Download JSON
        </button>
        <button type="button" className="btn btn-small btn-ghost" onClick={onDiscard}>
          Discard
        </button>
      </div>
    </div>
  );
}

export function DropOverlay() {
  return (
    <div className="drop-overlay" aria-hidden="true">
      <div className="drop-box">
        <Icon name="upload" />
        <p>Drop a CityData .json, .geojson or .kml</p>
        <span className="muted">GeoJSON / KML is added on top of the city on screen · Esc to cancel</span>
      </div>
    </div>
  );
}
