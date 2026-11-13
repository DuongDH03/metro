/**
 * MapLibre layer definitions for the metro overlay. Filters are applied separately
 * (see MapView) so that toggling lines / statuses / timeline never rebuilds sources.
 */
import type { AddLayerObject, ExpressionSpecification, FilterSpecification } from 'maplibre-gl';
import type { Status } from '../types';

export type Theme = 'light' | 'dark';

export const BASEMAP: Record<Theme, string> = {
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
};

export const LINE_SOURCE = 'metro-lines';
export const STATION_SOURCE = 'metro-stations';

/** Font stacks exactly as used by the CARTO styles (the glyph server only serves these combos). */
const FONT_REGULAR = ['Montserrat Medium', 'Open Sans Regular', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'];
const FONT_BOLD = ['Montserrat SemiBold', 'Open Sans Bold', 'Noto Sans Regular', 'Noto Sans CJK JP Regular'];

export const PALETTE: Record<Theme, { casing: string; ink: string; halo: string; text: string; fill: string }> = {
  light: { casing: '#ffffff', ink: '#1d2330', halo: '#ffffff', text: '#1d2330', fill: '#ffffff' },
  dark: { casing: '#15171c', ink: '#0b0c0f', halo: '#101216', text: '#e8eaee', fill: '#ffffff' },
};

interface StatusStyle {
  scale: number;
  opacity: number;
  dash?: number[];
  cap: 'butt' | 'round';
}

export const STATUS_STYLE: Record<Status, StatusStyle> = {
  operating: { scale: 1, opacity: 1, cap: 'round' },
  construction: { scale: 0.92, opacity: 0.85, cap: 'round' },
  approved: { scale: 0.95, opacity: 1, dash: [4, 1.2], cap: 'butt' },
  planned: { scale: 0.92, opacity: 0.95, dash: [2.4, 1.2], cap: 'butt' },
  proposed: { scale: 0.85, opacity: 0.75, dash: [0, 1.8], cap: 'round' },
};

/** Drawing order bottom -> top. */
export const STATUS_DRAW_ORDER: Status[] = ['proposed', 'planned', 'approved', 'construction', 'operating'];

export const LAYER = {
  casing: 'metro-casing',
  status: (s: Status) => `metro-line-${s}`,
  constructionInner: 'metro-line-construction-inner',
  hit: 'metro-hit',
  stations: 'metro-stations',
  labels: 'metro-labels',
} as const;

export const LINE_LAYER_IDS: string[] = [
  LAYER.casing,
  ...STATUS_DRAW_ORDER.map(LAYER.status),
  LAYER.constructionInner,
  LAYER.hit,
];

const E = (x: unknown) => x as ExpressionSpecification;
export const F = (x: unknown) => x as FilterSpecification;

const HL = ['case', ['boolean', ['feature-state', 'hl'], false], 1.6, 1];
const DIM = ['case', ['boolean', ['feature-state', 'dim'], false], 0.15, 1];
const MODE = ['match', ['get', 'mode'], ['tram', 'lrt', 'agt', 'monorail'], 0.75, 1];
const WIDTH_STOPS: [number, number][] = [
  [8, 1.6],
  [11, 3.2],
  [14, 5.5],
  [17, 9.5],
];

function lineWidth(scale: number, add = 0): ExpressionSpecification {
  return E([
    'interpolate',
    ['exponential', 1.3],
    ['zoom'],
    ...WIDTH_STOPS.flatMap(([z, w]) => [z, ['+', ['*', w * scale, MODE, HL], add]]),
  ]);
}

export function statusFilter(s: Status): FilterSpecification {
  return F(['==', ['get', 'status'], s]);
}

export function lineLayers(theme: Theme): AddLayerObject[] {
  const p = PALETTE[theme];
  const layers: AddLayerObject[] = [
    {
      id: LAYER.casing,
      type: 'line',
      source: LINE_SOURCE,
      layout: { 'line-cap': 'round', 'line-join': 'round', 'line-sort-key': E(['get', 'sort']) },
      paint: {
        'line-color': p.casing,
        'line-width': lineWidth(1, 3),
        'line-opacity': E(['*', ['match', ['get', 'status'], 'proposed', 0.45, 'planned', 0.75, 0.95], DIM]),
      },
    },
  ];
  for (const s of STATUS_DRAW_ORDER) {
    const st = STATUS_STYLE[s];
    layers.push({
      id: LAYER.status(s),
      type: 'line',
      source: LINE_SOURCE,
      filter: statusFilter(s),
      layout: { 'line-cap': st.cap, 'line-join': 'round', 'line-sort-key': E(['get', 'sort']) },
      paint: {
        'line-color': E(['to-color', ['get', 'color']]),
        'line-width': lineWidth(st.scale),
        'line-opacity': E(['*', st.opacity, DIM]),
        ...(st.dash ? { 'line-dasharray': st.dash } : {}),
      },
    });
    if (s === 'construction') {
      // A thin light stripe down the middle: "track being built".
      layers.push({
        id: LAYER.constructionInner,
        type: 'line',
        source: LINE_SOURCE,
        filter: statusFilter('construction'),
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': p.casing,
          'line-width': lineWidth(st.scale * 0.33),
          'line-opacity': E(['*', 0.85, DIM]),
        },
      });
    }
  }
  layers.push({
    id: LAYER.hit,
    type: 'line',
    source: LINE_SOURCE,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#000000', 'line-opacity': 0, 'line-width': 14 },
  });
  return layers;
}

export function stationLayers(theme: Theme): AddLayerObject[] {
  const p = PALETTE[theme];
  const n = ['coalesce', ['feature-state', 'n'], ['get', 'n']];
  const ic = ['>=', n, 2];
  // Layout properties cannot use feature-state: use the static line count there.
  const nStatic = ['get', 'n'];
  const icStatic = ['>=', nStatic, 2];
  const sel = ['boolean', ['feature-state', 'sel'], false];
  const dim = ['case', ['boolean', ['feature-state', 'dim'], false], 0.25, 1];
  const rank = ['coalesce', ['feature-state', 'rank'], ['get', 'rank']];
  const faint = ['case', ['>=', rank, 4], 0.7, 1];
  const approx = ['boolean', ['get', 'approx'], false];
  return [
    {
      id: LAYER.stations,
      type: 'circle',
      source: STATION_SOURCE,
      layout: { 'circle-sort-key': E(nStatic) },
      paint: {
        'circle-radius': E([
          'interpolate',
          ['linear'],
          ['zoom'],
          8,
          ['+', ['case', ic, 2.6, 1.4], ['case', sel, 3, 0]],
          12,
          ['+', ['case', ic, 5, 3.2], ['case', sel, 3, 0]],
          16,
          ['+', ['case', ic, 8.5, 6], ['case', sel, 4, 0]],
        ]),
        'circle-color': p.fill,
        'circle-opacity': E(['*', ['case', approx, 0.35, 1], faint, dim]),
        'circle-stroke-color': E([
          'case',
          sel,
          '#ff3b30',
          ic,
          p.ink,
          ['to-color', ['coalesce', ['feature-state', 'c'], ['get', 'color']]],
        ]),
        'circle-stroke-width': E([
          'interpolate',
          ['linear'],
          ['zoom'],
          8,
          ['case', ic, 1.2, 0.9],
          13,
          ['+', ['case', ic, 2, 1.8], ['case', sel, 1, 0]],
        ]),
        'circle-stroke-opacity': E(['*', ['case', approx, 0.65, 1], faint, dim]),
      },
    },
    {
      id: LAYER.labels,
      type: 'symbol',
      source: STATION_SOURCE,
      minzoom: 11,
      layout: {
        'text-field': E(['get', 'label']),
        'text-font': E(['case', icStatic, ['literal', FONT_BOLD], ['literal', FONT_REGULAR]]),
        'text-size': E(['interpolate', ['linear'], ['zoom'], 11, ['case', icStatic, 11, 10], 16, ['case', icStatic, 14, 12.5]]),
        'text-variable-anchor': ['left', 'right', 'top', 'bottom'],
        'text-radial-offset': 0.9,
        'text-justify': 'auto',
        'text-max-width': 9,
        'symbol-sort-key': E(['-', 0, nStatic]),
        'text-padding': 3,
      },
      paint: {
        'text-color': p.text,
        'text-halo-color': p.halo,
        'text-halo-width': 1.6,
        'text-opacity': E(['*', ['case', approx, 0.8, 1], dim]),
      },
    },
  ];
}
