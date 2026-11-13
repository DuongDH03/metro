import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import {
  AttributionControl,
  Map as MLMap,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
  type GeoJSONSource,
  type MapGeoJSONFeature,
  type PointLike,
} from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import type { LngLat } from '../types';
import type { BBox, GeoModel } from '../lib/geo';
import type { Visibility } from '../lib/visibility';
import {
  BASEMAP,
  F,
  LAYER,
  LINE_SOURCE,
  STATION_SOURCE,
  STATUS_DRAW_ORDER,
  lineLayers,
  stationLayers,
  statusFilter,
  type Theme,
} from '../lib/mapStyle';

// The worker must be served as its own file; let Vite emit it and tell MapLibre where it is.
setWorkerUrl(workerUrl);

export interface Padding {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface FocusOptions {
  /** Cap on how many zoom levels the camera may zoom OUT (e.g. after clicking a line on the map). */
  maxZoomOut?: number;
  /** Point that stays fixed on screen when the zoom-out is capped (the click position). */
  around?: LngLat;
  maxZoom?: number;
}

export interface MapApi {
  flyTo(center: LngLat, zoom?: number, padding?: Padding): void;
  fitBounds(b: BBox, padding: Padding, maxZoom?: number): void;
  /**
   * Bring bounds into view with as little camera movement as possible: nothing if they're already
   * comfortably visible, otherwise fit them, but never zoom out more than `maxZoomOut` levels.
   */
  focusBounds(b: BBox, padding: Padding, opts?: FocusOptions): void;
  jumpTo(center: LngLat, zoom: number): void;
}

interface Props {
  geo: GeoModel | null;
  vis: Visibility | null;
  /** Lines to emphasise (others dim); null = no focus. */
  focus: ReadonlySet<string> | null;
  selectedStation: number | null;
  theme: Theme;
  initialView: { center: LngLat; zoom: number };
  apiRef: RefObject<MapApi | null>;
  onHoverLine(lineId: string | null): void;
  /** `at` is the clicked map position (only for clicks on the map itself). */
  onSelectLine(lineId: string, at?: LngLat): void;
  onSelectStation(idx: number): void;
  onClearSelection(): void;
  /** Called after every pan / zoom (and once on load) with the visible bounds and zoom. */
  onViewChange?(view: { center: LngLat; bounds: BBox; zoom: number }): void;
}

type StateMap = Map<number, string>;

export default function MapView(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const readyRef = useRef(false);
  const propsRef = useRef(props);
  propsRef.current = props;
  // Last applied per-feature state (serialised) so updates only touch what changed.
  const segStateRef = useRef<StateMap>(new Map());
  const stStateRef = useRef<StateMap>(new Map());
  const dataGeoRef = useRef<GeoModel | null>(null);
  const themeRef = useRef<Theme>(props.theme);

  // ---- helpers (read latest props via propsRef) ----
  const applyData = (map: MLMap) => {
    const { geo } = propsRef.current;
    const lineSrc = map.getSource<GeoJSONSource>(LINE_SOURCE);
    const stSrc = map.getSource<GeoJSONSource>(STATION_SOURCE);
    if (!lineSrc || !stSrc) return;
    if (dataGeoRef.current === geo) return;
    dataGeoRef.current = geo;
    map.removeFeatureState({ source: LINE_SOURCE });
    map.removeFeatureState({ source: STATION_SOURCE });
    segStateRef.current = new Map();
    stStateRef.current = new Map();
    void lineSrc.setData(geo ? geo.lineGeo : { type: 'FeatureCollection', features: [] });
    void stSrc.setData(geo ? geo.stationGeo : { type: 'FeatureCollection', features: [] });
  };

  const applyFilters = (map: MLMap) => {
    const { vis } = propsRef.current;
    if (!vis) return;
    const segFilter = vis.allSegsVisible ? null : F(['in', ['get', 'i'], ['literal', vis.segs]]);
    const both = (f: unknown) => (segFilter ? F(['all', f, segFilter]) : F(f));
    map.setFilter(LAYER.casing, segFilter);
    map.setFilter(LAYER.hit, segFilter);
    for (const s of STATUS_DRAW_ORDER) map.setFilter(LAYER.status(s), both(statusFilter(s)));
    map.setFilter(LAYER.constructionInner, both(statusFilter('construction')));
    const stFilter = vis.allStationsVisible ? null : F(['in', ['get', 'i'], ['literal', [...vis.stations.keys()]]]);
    map.setFilter(LAYER.stations, stFilter);
    map.setFilter(LAYER.labels, stFilter);
  };

  const applyStates = (map: MLMap) => {
    const { geo, vis, focus, selectedStation } = propsRef.current;
    if (!geo || !vis || dataGeoRef.current !== geo) return;
    const segPrev = segStateRef.current;
    for (const s of geo.segments) {
      const hl = !!focus && focus.has(s.lineId);
      const dim = !!focus && !hl;
      const key = `${hl ? 1 : 0}${dim ? 1 : 0}`;
      if ((segPrev.get(s.idx) ?? '00') === key) continue;
      segPrev.set(s.idx, key);
      map.setFeatureState({ source: LINE_SOURCE, id: s.idx }, { hl, dim });
    }
    const stPrev = stStateRef.current;
    for (const st of geo.stations) {
      const v = vis.stations.get(st.idx);
      if (!v) continue; // hidden by filter; state irrelevant
      const first = geo.lineById.get(v.lines[0]);
      const sel = selectedStation === st.idx;
      const dim = !!focus && !v.lines.some((l) => focus.has(l)) && !sel;
      const state = { n: v.lines.length, c: first?.color ?? '#888888', rank: v.rank, sel, dim };
      const key = `${state.n}|${state.c}|${state.rank}|${sel ? 1 : 0}|${dim ? 1 : 0}`;
      if (stPrev.get(st.idx) === key) continue;
      stPrev.set(st.idx, key);
      map.setFeatureState({ source: STATION_SOURCE, id: st.idx }, state);
    }
  };

  const setupOverlay = (map: MLMap) => {
    const theme = themeRef.current;
    if (!map.getSource(LINE_SOURCE)) {
      map.addSource(LINE_SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, tolerance: 0.3 });
    }
    if (!map.getSource(STATION_SOURCE)) {
      map.addSource(STATION_SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    }
    // Lines go under the basemap labels; stations on top of everything.
    const firstSymbol = map.getStyle().layers?.find((l) => l.type === 'symbol')?.id;
    for (const layer of lineLayers(theme)) if (!map.getLayer(layer.id)) map.addLayer(layer, firstSymbol);
    for (const layer of stationLayers(theme)) if (!map.getLayer(layer.id)) map.addLayer(layer);
    dataGeoRef.current = null;
    readyRef.current = true;
    applyData(map);
    applyFilters(map);
    applyStates(map);
  };

  // ---- create map once ----
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const { initialView } = propsRef.current;
    const map = new MLMap({
      container,
      style: BASEMAP[themeRef.current],
      center: initialView.center,
      zoom: initialView.zoom,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      maxPitch: 0,
    });
    map.touchZoomRotate.disableRotation();
    map.keyboard.disableRotation();
    map.addControl(new AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new ScaleControl({ maxWidth: 100 }), 'bottom-right');
    mapRef.current = map;
    if (import.meta.env.DEV) (window as unknown as { __map?: MLMap }).__map = map;

    map.on('style.load', () => setupOverlay(map));
    map.on('error', (e) => console.warn('[map]', e.error?.message ?? e));
    const reportView = () => {
      const c = map.getCenter();
      const b = map.getBounds();
      propsRef.current.onViewChange?.({
        center: [c.lng, c.lat],
        bounds: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
        zoom: map.getZoom(),
      });
    };
    map.on('moveend', reportView);
    map.once('load', reportView);

    const hitLayers = () => [LAYER.stations, LAYER.hit].filter((id) => map.getLayer(id));
    const box = (p: { x: number; y: number }, r: number): [PointLike, PointLike] => [
      [p.x - r, p.y - r],
      [p.x + r, p.y + r],
    ];
    type Hit = { kind: 'station'; idx: number } | { kind: 'line'; id: string } | null;
    const pick = (features: MapGeoJSONFeature[]): Hit => {
      const st = features.find((f) => f.layer.id === LAYER.stations);
      if (st) return { kind: 'station', idx: Number(st.properties.i) };
      const ln = features.find((f) => f.layer.id === LAYER.hit);
      if (ln) return { kind: 'line', id: String(ln.properties.lineId) };
      return null;
    };

    let lastHover: string | null = null;
    let raf = 0;
    map.on('mousemove', (e) => {
      if (!readyRef.current) return;
      cancelAnimationFrame(raf);
      const point = e.point;
      raf = requestAnimationFrame(() => {
        const layers = hitLayers();
        if (!layers.length) return;
        const hit = pick(map.queryRenderedFeatures(box(point, 3), { layers }));
        map.getCanvas().style.cursor = hit ? 'pointer' : '';
        const line: string | null = hit?.kind === 'line' ? hit.id : null;
        if (line !== lastHover) {
          lastHover = line;
          propsRef.current.onHoverLine(line);
        }
      });
    });
    map.getCanvas().addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf);
      map.getCanvas().style.cursor = '';
      if (lastHover !== null) {
        lastHover = null;
        propsRef.current.onHoverLine(null);
      }
    });
    map.on('click', (e) => {
      if (!readyRef.current) return;
      const layers = hitLayers();
      if (!layers.length) return;
      // Generous tolerance for touch.
      const hit = pick(map.queryRenderedFeatures(box(e.point, 8), { layers }));
      if (!hit) propsRef.current.onClearSelection();
      else if (hit.kind === 'station') propsRef.current.onSelectStation(hit.idx);
      else propsRef.current.onSelectLine(hit.id, [e.lngLat.lng, e.lngLat.lat]);
    });

    /** Never let padding swallow the viewport. */
    const clampPadding = (padding: Padding): Padding => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const pad = {
        top: Math.min(padding.top, h * 0.4),
        bottom: Math.min(padding.bottom, h * 0.6),
        left: Math.min(padding.left, w * 0.6),
        right: Math.min(padding.right, w * 0.4),
      };
      if (w - pad.left - pad.right < 80) pad.left = pad.right = 20;
      if (h - pad.top - pad.bottom < 80) pad.top = pad.bottom = 20;
      return pad;
    };
    const api: MapApi = {
      flyTo(center, zoom, padding) {
        map.flyTo({ center, zoom: zoom ?? Math.max(map.getZoom(), 14), padding, duration: 1200, essential: true });
      },
      fitBounds(b, padding, maxZoom = 15) {
        map.fitBounds(
          [
            [b[0], b[1]],
            [b[2], b[3]],
          ],
          { padding: clampPadding(padding), maxZoom, duration: 1000, essential: true },
        );
      },
      focusBounds(b, padding, opts = {}) {
        const pad = clampPadding(padding);
        const w = container.clientWidth;
        const h = container.clientHeight;
        const tl = map.project([b[0], b[3]]);
        const br = map.project([b[2], b[1]]);
        const innerW = w - pad.left - pad.right;
        const innerH = h - pad.top - pad.bottom;
        const slack = 12; // px; a line framed by a previous fit sits right on the padding edge
        const inside =
          tl.x >= pad.left - slack && tl.y >= pad.top - slack && br.x <= w - pad.right + slack && br.y <= h - pad.bottom + slack;
        const bigEnough = br.x - tl.x >= innerW * 0.3 || br.y - tl.y >= innerH * 0.3;
        if (inside && bigEnough) return; // already well framed: don't move at all
        const bounds: [[number, number], [number, number]] = [
          [b[0], b[1]],
          [b[2], b[3]],
        ];
        const maxZoom = opts.maxZoom ?? 15;
        const target = map.cameraForBounds(bounds, { padding: pad, maxZoom });
        const cur = map.getZoom();
        if (target?.zoom !== undefined && opts.maxZoomOut !== undefined && target.zoom < cur - opts.maxZoomOut) {
          // Fitting would zoom out a lot: step back a little around the click instead.
          map.easeTo({ zoom: cur - opts.maxZoomOut, around: opts.around, duration: 700, essential: true });
          return;
        }
        map.fitBounds(bounds, { padding: pad, maxZoom, duration: 900, essential: true });
      },
      jumpTo(center, zoom) {
        map.jumpTo({ center, zoom });
      },
    };
    props.apiRef.current = api;
    if (import.meta.env.DEV) (window as unknown as { __mapApi?: MapApi }).__mapApi = api;

    return () => {
      cancelAnimationFrame(raf);
      readyRef.current = false;
      dataGeoRef.current = null;
      if (propsRef.current.apiRef.current === api) propsRef.current.apiRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- theme: swap basemap, overlay is re-added on style.load ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || themeRef.current === props.theme) return;
    themeRef.current = props.theme;
    readyRef.current = false;
    map.setStyle(BASEMAP[props.theme], { diff: false });
  }, [props.theme]);

  // ---- data / filters / states ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    applyData(map);
    applyFilters(map);
    applyStates(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.geo, props.vis]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    applyStates(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.focus, props.selectedStation]);

  return <div ref={containerRef} className="map" role="region" aria-label="Metro map" />;
}
