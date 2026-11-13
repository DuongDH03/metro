import { useEffect, useRef } from 'react';
import type { CityData } from '../types';
import { downloadCityGeoJSON, downloadCityJson } from '../lib/download';
import { Icon } from './bits';

interface Props {
  city: CityData | null;
  onClose(): void;
  onImport(): void;
  /** Set when the city on screen was imported this session (file name). */
  importedFrom?: string | null;
  onRemoveImported?(): void;
}

export default function InfoPanel({ city, onClose, onImport, importedFrom, onRemoveImported }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="card modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} type="button" className="icon-btn card-close" onClick={onClose} aria-label="Close">
          <Icon name="close" />
        </button>
        <div className="card-scroll">
          <h2 id="info-title">About {city ? city.name : 'Metro Vision'}</h2>
          <p>
            An interactive map of urban rail networks — what runs today, what is being built, and what is only on
            paper. Drag the timeline or press play to watch the network grow year by year. Future years are official
            targets, which often slip.
          </p>
          {city?.notes && (
            <>
              <h3>Notes on this data</h3>
              <p className="pre-line">{city.notes}</p>
            </>
          )}
          {city && (
            <p className="muted">
              {city.updated ? `Data researched ${city.updated}. ` : ''}
              {city.lines.length} lines · {city.stations.length} stations.
            </p>
          )}
          {city && city.sources.length > 0 && (
            <>
              <h3>Sources</h3>
              <ul className="sources">
                {city.sources.map((s) => (
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
            </>
          )}
          <h3>Download &amp; edit</h3>
          {importedFrom && (
            <p className="muted">
              Imported from {importedFrom} — kept only until you reload the page.{' '}
              {onRemoveImported && (
                <button type="button" className="link-btn inline" onClick={onRemoveImported}>
                  Remove it
                </button>
              )}
            </p>
          )}
          <div className="data-actions">
            <button
              type="button"
              className="btn btn-small btn-ghost"
              onClick={() => city && downloadCityJson(city)}
              disabled={!city}
              aria-label={city ? `Download ${city.name} data as ${city.id}.json` : 'Download data (.json)'}
            >
              <Icon name="download" /> Download data (.json)
            </button>
            <button
              type="button"
              className="btn btn-small btn-ghost"
              onClick={() => city && downloadCityGeoJSON(city)}
              disabled={!city}
              aria-label={city ? `Download ${city.name} as GeoJSON (${city.id}.geojson)` : 'Download GeoJSON (.geojson)'}
            >
              <Icon name="download" /> Download GeoJSON (.geojson)
            </button>
            <button type="button" className="btn btn-small btn-ghost" onClick={onImport}>
              <Icon name="upload" /> Import file…
            </button>
          </div>
          <p className="muted small-print">
            The .json is the CityData format used in public/data. The .geojson has one line feature per segment and
            one point per station: edit it in geojson.io, QGIS or Google My Maps, then drop it (or a .kml) back on
            the map to see your changes on top of this city.
          </p>
          <h3>Map</h3>
          <p>
            Basemap ©{' '}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
              OpenStreetMap contributors
            </a>{' '}
            ©{' '}
            <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">
              CARTO
            </a>
            . Rendered with{' '}
            <a href="https://maplibre.org/" target="_blank" rel="noopener noreferrer">
              MapLibre GL JS
            </a>
            . Line geometry is schematic where detailed track paths are not available; stations marked as approximate
            are estimated.
          </p>
        </div>
      </section>
    </div>
  );
}
