import type { CityIndexEntry } from '../types';
import { primaryName, secondaryName } from '../lib/text';
import { Icon } from './bits';

interface Props {
  city: CityIndexEntry;
  onShow(): void;
  onDismiss(): void;
}

/** "This area has a metro map" prompt shown when the user pans into another city. */
export default function CitySuggestion({ city, onShow, onDismiss }: Props) {
  const alt = secondaryName(city);
  return (
    <div className="card city-suggest" role="status">
      <button type="button" className="cs-main" onClick={onShow}>
        <span className="cs-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="3" width="14" height="14" rx="3" />
            <path d="M5 11h14M9 21l-2 -3M15 21l2 -3" />
            <circle cx="9" cy="14" r="0.6" fill="currentColor" />
            <circle cx="15" cy="14" r="0.6" fill="currentColor" />
          </svg>
        </span>
        <span className="cs-text">
          <span className="cs-title">
            {primaryName(city)}
            {alt && <span className="local"> · {alt}</span>}
          </span>
          <span className="cs-sub">has a metro map. Click to show it</span>
        </span>
        <span className="cs-go">Show map</span>
      </button>
      <button type="button" className="icon-btn cs-close" aria-label={`Dismiss ${city.name} suggestion`} onClick={onDismiss}>
        <Icon name="close" />
      </button>
    </div>
  );
}
