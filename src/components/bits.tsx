import type { Line, Status } from '../types';
import { STATUS_LABEL, STATUS_SHORT, contrastText, safeColor } from '../lib/text';

export function LineBullet({ line, size = 'md' }: { line: Line; size?: 'sm' | 'md' | 'lg' }) {
  const bg = safeColor(line.color);
  const fg = line.textColor ?? contrastText(bg);
  const code = line.code ?? '';
  return (
    <span
      className={`bullet bullet-${size}${code.length > 2 ? ' bullet-wide' : ''}${code ? '' : ' bullet-empty'}`}
      style={{ background: bg, color: fg }}
      aria-hidden="true"
      title={line.name}
    >
      {code}
    </span>
  );
}

export function StatusBadge({ status, short = false }: { status: Status; short?: boolean }) {
  return (
    <span className={`badge badge-${status}`} title={STATUS_LABEL[status]}>
      {short ? STATUS_SHORT[status] : STATUS_LABEL[status]}
    </span>
  );
}

/** Small SVG sample of how a status is drawn on the map. */
export function StatusSwatch({ status, color = 'var(--swatch)' }: { status: Status; color?: string }) {
  const common = { x1: 3, y1: 7, x2: 37, y2: 7, stroke: color } as const;
  return (
    <svg className="swatch" width="40" height="14" viewBox="0 0 40 14" aria-hidden="true">
      <line x1={3} y1={7} x2={37} y2={7} stroke="var(--casing)" strokeWidth={8} strokeLinecap="round" />
      {status === 'operating' && <line {...common} strokeWidth={5} strokeLinecap="round" />}
      {status === 'construction' && (
        <>
          <line {...common} strokeWidth={4.6} strokeLinecap="round" opacity={0.85} />
          <line x1={3} y1={7} x2={37} y2={7} stroke="var(--casing)" strokeWidth={1.6} strokeLinecap="round" />
        </>
      )}
      {status === 'approved' && <line {...common} strokeWidth={4.5} strokeDasharray="13 6" />}
      {status === 'planned' && <line {...common} strokeWidth={4.2} strokeDasharray="6 5" opacity={0.9} />}
      {status === 'proposed' && (
        <line {...common} strokeWidth={4} strokeDasharray="0 8" strokeLinecap="round" opacity={0.7} />
      )}
    </svg>
  );
}

export function Icon({ name }: { name: 'play' | 'pause' | 'close' | 'info' | 'sun' | 'moon' | 'layers' | 'search' | 'chevron' | 'menu' | 'upload' | 'download' | 'alert' }) {
  const p = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
  switch (name) {
    case 'play':
      return (
        <svg {...p}>
          <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
        </svg>
      );
    case 'pause':
      return (
        <svg {...p}>
          <path d="M8 5v14M16 5v14" strokeWidth={3} />
        </svg>
      );
    case 'close':
      return (
        <svg {...p}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case 'info':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 7.5v.5" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...p}>
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
        </svg>
      );
    case 'layers':
      return (
        <svg {...p}>
          <path d="M12 3l9 5-9 5-9-5z" />
          <path d="M3 13l9 5 9-5" />
        </svg>
      );
    case 'search':
      return (
        <svg {...p}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
      );
    case 'chevron':
      return (
        <svg {...p}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...p}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case 'upload':
      return (
        <svg {...p}>
          <path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 15v4h14v-4" />
        </svg>
      );
    case 'download':
      return (
        <svg {...p}>
          <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 15v4h14v-4" />
        </svg>
      );
    case 'alert':
      return (
        <svg {...p}>
          <path d="M12 3.5l9.5 16.5h-19z" />
          <path d="M12 10v4.5M12 17.2v.3" />
        </svg>
      );
  }
}
