import { STATUS_ORDER } from '../types';
import { STATUS_HINT, STATUS_LABEL } from '../lib/text';
import { Icon, StatusSwatch } from './bits';

export default function Legend({ onClose }: { onClose?: () => void }) {
  return (
    <section className="card legend" aria-label="Legend">
      <div className="legend-head">
        <h3>Legend</h3>
        {onClose && (
          <button type="button" className="icon-btn small" onClick={onClose} aria-label="Hide legend">
            <Icon name="close" />
          </button>
        )}
      </div>
      <ul>
        {STATUS_ORDER.map((s) => (
          <li key={s} title={STATUS_HINT[s]}>
            <StatusSwatch status={s} />
            <span>{STATUS_LABEL[s]}</span>
          </li>
        ))}
        <li>
          <span className="legend-stations" aria-hidden="true">
            <span className="station-glyph" />
          </span>
          <span>Station</span>
        </li>
        <li>
          <span className="legend-stations" aria-hidden="true">
            <span className="station-glyph is-ic" />
          </span>
          <span>Interchange</span>
        </li>
        <li>
          <span className="legend-stations" aria-hidden="true">
            <span className="station-glyph is-approx" />
          </span>
          <span>Approximate location</span>
        </li>
      </ul>
    </section>
  );
}
