import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CityData, CityIndexEntry, Status } from './types';
import { STATUS_ORDER } from './types';
import { DataError, loadCity, loadCityIndex } from './lib/data';
import { buildGeo, buildGroupTree, type GeoModel } from './lib/geo';
import { computeVisibility, lineActiveAt } from './lib/visibility';
import { formatKm } from './lib/text';
import type { Theme } from './lib/mapStyle';
import MapView, { type MapApi, type Padding } from './components/MapView';
import Sidebar from './components/Sidebar';
import DetailCard, { type Selection } from './components/DetailCard';
import Legend from './components/Legend';
import InfoPanel from './components/InfoPanel';
import { Icon } from './components/bits';
import ImportBanner, { DropOverlay, type ImportBannerState } from './components/ImportBanner';
import { MAX_IMPORT_BYTES, importErrorMessage, runImport, stem, type ImportedCity } from './lib/importCity';
import { downloadCityJson } from './lib/download';
import { useFileDrop } from './lib/useFileDrop';
import type { BBox } from './lib/geo';
import { pruneDismissed, suggestCity, type MapView as CameraView } from './lib/nearbyCity';
import CitySuggestion from './components/CitySuggestion';
import './App.css';

type CityState =
  | { id: string; status: 'loading' }
  | { id: string; status: 'ready'; data: CityData }
  | { id: string; status: 'error'; message: string; kind: DataError['kind'] | 'unknown' };

const THEME_KEY = 'metro-vision-theme';
const DEFAULT_VIEW = { center: [105.84, 21.02] as [number, number], zoom: 10.5 };

function readHash(): string | null {
  const h = decodeURIComponent(window.location.hash.replace(/^#\/?/, '')).trim();
  return h || null;
}

function storedTheme(): Theme | null {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function useMediaQuery(q: string): boolean {
  const [m, setM] = useState(() => window.matchMedia?.(q).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.(q);
    if (!mq) return;
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return m;
}

const ALL_STATUSES: ReadonlySet<Status> = new Set(STATUS_ORDER);
const EMPTY: ReadonlySet<string> = new Set();

export default function App() {
  const isMobile = useMediaQuery('(max-width: 767px)');

  // ---- theme ----
  const [themeChoice, setThemeChoice] = useState<Theme | null>(storedTheme);
  const [sysTheme, setSysTheme] = useState<Theme>(systemTheme);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const on = () => setSysTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const theme: Theme = themeChoice ?? sysTheme;
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setThemeChoice(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
  };

  // ---- city index + hash ----
  const [cities, setCities] = useState<CityIndexEntry[] | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [requestedId, setRequestedId] = useState<string | null>(readHash);
  useEffect(() => {
    let alive = true;
    loadCityIndex()
      .then((list) => alive && setCities(list))
      .catch((e: unknown) => alive && setIndexError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    const on = () => setRequestedId(readHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  // Session-only imported cities (never written to public/data; gone on reload).
  const [imported, setImported] = useState<ImportedCity[]>([]);
  const importedEntries = useMemo(() => imported.map((c) => c.entry), [imported]);
  const entry = useMemo(() => {
    const all = cities || importedEntries.length ? [...(cities ?? []), ...importedEntries] : null;
    // Unknown ids (e.g. #imported-x after a reload) fall back to the first city.
    return all ? (all.find((c) => c.id === requestedId) ?? all[0] ?? null) : null;
  }, [cities, importedEntries, requestedId]);
  const importedCity = useMemo(() => imported.find((c) => c.entry.id === entry?.id) ?? null, [imported, entry]);
  const cityId = entry?.id ?? null;
  useEffect(() => {
    if (!cityId) return;
    if (readHash() !== cityId) {
      const url = `${window.location.pathname}${window.location.search}#${encodeURIComponent(cityId)}`;
      window.history.replaceState(null, '', url);
    }
  }, [cityId]);
  // City switched from the "this area has a metro map" prompt: keep the camera where the user is.
  const keepCameraFor = useRef<string | null>(null);
  const selectCity = useCallback((id: string, keepCamera = false) => {
    keepCameraFor.current = keepCamera ? id : null;
    if (id !== readHash()) {
      const url = `${window.location.pathname}${window.location.search}#${encodeURIComponent(id)}`;
      window.history.pushState(null, '', url);
    }
    setRequestedId(id);
  }, []);

  // ---- city data (lazy, cached) ----
  const cacheRef = useRef(new Map<string, CityData>());
  const [cityState, setCityState] = useState<CityState | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    if (!entry || importedCity) return;
    const cached = cacheRef.current.get(entry.id);
    if (cached) {
      setCityState({ id: entry.id, status: 'ready', data: cached });
      return;
    }
    let alive = true;
    setCityState({ id: entry.id, status: 'loading' });
    loadCity(entry)
      .then((data) => {
        cacheRef.current.set(entry.id, data);
        if (alive) setCityState({ id: entry.id, status: 'ready', data });
      })
      .catch((e: unknown) => {
        console.warn('[metro] failed to load', entry.file, e);
        if (alive)
          setCityState({
            id: entry.id,
            status: 'error',
            message: e instanceof Error ? e.message : String(e),
            kind: e instanceof DataError ? e.kind : 'unknown',
          });
      });
    return () => {
      alive = false;
    };
  }, [entry, importedCity, reloadKey]);

  const data = importedCity
    ? importedCity.data
    : cityState?.status === 'ready' && cityState.id === cityId
      ? cityState.data
      : null;
  const geo = useMemo<GeoModel | null>(() => (data ? buildGeo(data) : null), [data]);
  const tree = useMemo(() => (data ? buildGroupTree(data) : []), [data]);

  // ---- per-city view state (reset when the city changes) ----
  const [viewGeo, setViewGeo] = useState<GeoModel | null>(null);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(EMPTY);
  const [statuses, setStatuses] = useState<ReadonlySet<Status>>(ALL_STATUSES);
  const [year, setYear] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selection, setSelection] = useState<Selection>(null);
  const [hoverLine, setHoverLine] = useState<string | null>(null);
  if (geo !== viewGeo) {
    setViewGeo(geo);
    setHidden(EMPTY);
    setStatuses(ALL_STATUSES);
    setYear(geo ? geo.timeline.max : 0);
    setPlaying(false);
    setSelection(null);
    setHoverLine(null);
  }

  const vis = useMemo(
    () => (geo && geo === viewGeo ? computeVisibility(geo, { hiddenLines: hidden, statuses, year }) : null),
    [geo, viewGeo, hidden, statuses, year],
  );
  const activeLines = useMemo(() => {
    const s = new Set<string>();
    if (geo) for (const l of geo.city.lines) if (lineActiveAt(geo, l.id, statuses, year)) s.add(l.id);
    return s;
  }, [geo, statuses, year]);

  const focus = useMemo<ReadonlySet<string> | null>(() => {
    if (!geo) return null;
    if (hoverLine && geo.lineById.has(hoverLine)) return new Set([hoverLine]);
    if (selection?.kind === 'line') return new Set([selection.id]);
    if (selection?.kind === 'station') {
      const st = geo.stations[selection.idx];
      return st && st.lines.length ? new Set(st.lines) : null;
    }
    return null;
  }, [geo, hoverLine, selection]);

  // ---- timeline playback ----
  const tl = geo?.timeline;
  useEffect(() => {
    if (!playing || !tl) return;
    if (year >= tl.max) {
      setPlaying(false);
      return;
    }
    const steps = Math.max(1, tl.max - tl.min);
    const delay = Math.min(700, Math.max(140, 24000 / steps));
    const t = window.setTimeout(() => setYear((y) => Math.min(tl.max, y + 1)), delay);
    return () => window.clearTimeout(t);
  }, [playing, year, tl]);
  const togglePlay = () => {
    if (!tl) return;
    if (playing) {
      setPlaying(false);
      return;
    }
    if (year >= tl.max) setYear(tl.min);
    setPlaying(true);
  };

  // ---- layout ----
  const [sidebarOpen, setSidebarOpen] = useState(() => !window.matchMedia?.('(max-width: 767px)').matches);
  const [legendOpen, setLegendOpen] = useState(() => !window.matchMedia?.('(max-width: 767px)').matches);
  const [infoOpen, setInfoOpen] = useState(false);

  const mapApi = useRef<MapApi | null>(null);
  const padding = useCallback(
    (withCard: boolean): Padding => {
      const h = window.innerHeight;
      if (isMobile) {
        return { top: 70, left: 24, right: 24, bottom: withCard ? Math.round(h * 0.5) : sidebarOpen ? Math.round(h * 0.6) : 90 };
      }
      return { top: 110, bottom: 50, left: sidebarOpen ? 380 : 50, right: withCard ? 400 : 70 };
    },
    [isMobile, sidebarOpen],
  );

  // Move the camera when a city is chosen / loaded.
  useEffect(() => {
    if (entry && keepCameraFor.current !== entry.id) mapApi.current?.jumpTo(entry.center, entry.zoom);
  }, [entry]);
  // Line ids to frame once the next city model is built (lines merged in from a GeoJSON / KML import).
  const pendingFit = useRef<string[] | null>(null);
  const paddingRef = useRef(padding);
  useEffect(() => {
    paddingRef.current = padding;
  }, [padding]);
  useEffect(() => {
    if (!geo) return;
    const fit = pendingFit.current;
    pendingFit.current = null;
    if (fit?.length) {
      let b: BBox | null = null;
      for (const id of fit) {
        const lb = geo.lineBounds.get(id);
        if (lb) b = b ? [Math.min(b[0], lb[0]), Math.min(b[1], lb[1]), Math.max(b[2], lb[2]), Math.max(b[3], lb[3])] : lb;
      }
      if (b) {
        mapApi.current?.fitBounds(b, paddingRef.current(false));
        return;
      }
    }
    if (keepCameraFor.current === geo.city.id) {
      keepCameraFor.current = null;
      return;
    }
    mapApi.current?.jumpTo(geo.city.center, geo.city.zoom);
  }, [geo]);

  // ---- "this area has a metro map" suggestion while panning ----
  const [camera, setCamera] = useState<CameraView | null>(null);
  const [dismissedCities, setDismissedCities] = useState<ReadonlySet<string>>(EMPTY);
  const onViewChange = useCallback(
    (v: CameraView) => {
      setCamera(v);
      if (cities) setDismissedCities((d) => pruneDismissed(d, cities, v));
    },
    [cities],
  );
  const suggestion = useMemo(
    () => (cities && entry ? suggestCity(cities, entry, camera, dismissedCities) : null),
    [cities, entry, camera, dismissedCities],
  );

  const selectLine = useCallback(
    (id: string) => {
      if (!geo) return;
      setSelection({ kind: 'line', id });
      setHoverLine(null);
      // Make sure the selected line is actually shown.
      setHidden((h) => {
        if (!h.has(id)) return h;
        const n = new Set(h);
        n.delete(id);
        return n;
      });
      const b = geo.lineBounds.get(id);
      if (b) mapApi.current?.fitBounds(b, padding(true));
    },
    [geo, padding],
  );
  const selectStation = useCallback(
    (idx: number) => {
      if (!geo) return;
      const st = geo.stations[idx];
      if (!st) return;
      setSelection({ kind: 'station', idx });
      setHoverLine(null);
      mapApi.current?.flyTo(st.station.coord, undefined, padding(true));
    },
    [geo, padding],
  );
  const clearSelection = useCallback(() => setSelection(null), []);

  // ---- import / export ----
  const fileInput = useRef<HTMLInputElement>(null);
  const [banner, setBanner] = useState<ImportBannerState | null>(null);
  /** Undo info for the import the banner is about. */
  const lastImport = useRef<{ id: string; replaces: ImportedCity | null; returnTo: string | null; data: CityData } | null>(
    null,
  );
  const importBusy = useRef(false);
  // Latest values for the async import handler.
  const ctxRef = useRef({ data, cityId, imported, cities });
  useEffect(() => {
    ctxRef.current = { data, cityId, imported, cities };
  });

  const importFiles = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file || importBusy.current) return;
      importBusy.current = true;
      setBanner({ kind: 'busy', fileName: file.name });
      try {
        if (!/\.(json|geojson|kml)$/i.test(file.name)) {
          throw new Error('Only CityData .json, .geojson and .kml files can be imported.');
        }
        if (file.size > MAX_IMPORT_BYTES) {
          throw new Error(`The file is too large (${Math.round(file.size / 1048576)} MB).`);
        }
        const text = await file.text();
        const ctx = ctxRef.current;
        const out = await runImport(file.name, text, {
          base: ctx.data,
          baseId: ctx.cityId,
          imported: ctx.imported,
          takenIds: new Set((ctx.cities ?? []).map((c) => c.id)),
        });
        const warnings = [...out.warnings];
        if (files.length > 1) warnings.unshift(`Only ${file.name} was imported; drop one file at a time.`);
        setImported((list) => {
          const i = list.findIndex((c) => c.entry.id === out.city.entry.id);
          if (i < 0) return [...list, out.city];
          const next = list.slice();
          next[i] = out.city;
          return next;
        });
        lastImport.current = { id: out.city.entry.id, replaces: out.replaces, returnTo: out.returnTo, data: out.city.data };
        pendingFit.current = out.merged ? out.lineIds : null;
        selectCity(out.city.entry.id);
        setBanner({
          kind: 'done',
          fileName: file.name,
          lines: out.lineIds.length,
          stations: out.stationCount,
          warnings,
          detail: out.merged
            ? `Added on top of ${ctx.data?.name ?? 'this city'} in group “Imported: ${stem(file.name)}”. Kept until you reload.`
            : `Opened as “${out.city.entry.name} (imported)”. Kept until you reload.`,
        });
      } catch (e) {
        console.warn('[metro] import failed', e);
        lastImport.current = null;
        setBanner({ kind: 'error', fileName: file.name, message: importErrorMessage(e) });
      } finally {
        importBusy.current = false;
      }
    },
    [selectCity],
  );
  const drop = useFileDrop(importFiles);
  const openFilePicker = useCallback(() => {
    setInfoOpen(false);
    fileInput.current?.click();
  }, []);

  /** Removes (or reverts to `revertTo`) an imported city; goes to `fallback` when it was on screen. */
  const removeImported = useCallback(
    (id: string, revertTo: ImportedCity | null, fallback: string | null) => {
      setImported((list) =>
        revertTo ? list.map((c) => (c.entry.id === id ? revertTo : c)) : list.filter((c) => c.entry.id !== id),
      );
      if (!revertTo && ctxRef.current.cityId === id) {
        const target = fallback && fallback !== id ? fallback : (ctxRef.current.cities?.[0]?.id ?? null);
        if (target) selectCity(target);
        else {
          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
          setRequestedId(null);
        }
      }
    },
    [selectCity],
  );
  const discardLastImport = () => {
    const li = lastImport.current;
    lastImport.current = null;
    setBanner(null);
    if (li) removeImported(li.id, li.replaces, li.returnTo);
  };

  const { active: dropActive, cancel: cancelDrop } = drop;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (dropActive) cancelDrop();
      else if (infoOpen) setInfoOpen(false);
      else setSelection(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [infoOpen, dropActive, cancelDrop]);

  const setLines = useCallback((ids: string[], visible: boolean) => {
    setHidden((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (visible) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }, []);
  const toggleStatus = (s: Status) =>
    setStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

  // ---- status message (loading / errors) ----
  let message: { title: string; body: string; retry?: boolean } | null = null;
  if (indexError && !importedCity) message = { title: 'Could not load the city list', body: indexError, retry: true };
  else if (cities && cities.length === 0) message = { title: 'No cities yet', body: 'public/data/cities.json is empty.' };
  else if (cityState?.status === 'error' && cityState.id === cityId) {
    const name = entry?.name ?? cityState.id;
    message =
      cityState.kind === 'missing'
        ? { title: `${name} isn't available yet`, body: 'The data for this city has not been published yet. Try another city.', retry: true }
        : { title: `Couldn't load ${name}`, body: cityState.message, retry: true };
  }
  const loading = !message && (!cities || cityState?.status === 'loading' || (!!entry && !data));

  const showCard = !!(geo && selection);
  const yearBig = vis?.yearLabel ?? '';

  return (
    <div className={`app${sidebarOpen ? ' sidebar-open' : ''}${showCard ? ' card-open' : ''}${isMobile ? ' is-mobile' : ''}`}>
      <MapView
        geo={geo}
        vis={vis}
        focus={focus}
        selectedStation={selection?.kind === 'station' ? selection.idx : null}
        theme={theme}
        initialView={entry ?? DEFAULT_VIEW}
        apiRef={mapApi}
        onHoverLine={setHoverLine}
        onSelectLine={selectLine}
        onSelectStation={selectStation}
        onClearSelection={clearSelection}
        onViewChange={onViewChange}
      />

      {suggestion && !banner && (
        <CitySuggestion
          key={suggestion.id}
          city={suggestion}
          onShow={() => selectCity(suggestion.id, true)}
          onDismiss={() => setDismissedCities((d) => new Set(d).add(suggestion.id))}
        />
      )}

      <Sidebar
        open={sidebarOpen}
        onToggleOpen={() => setSidebarOpen((o) => !o)}
        cities={cities}
        imported={importedEntries}
        cityId={cityId}
        onCity={selectCity}
        geo={geo}
        tree={tree}
        loading={loading}
        hidden={hidden}
        active={activeLines}
        statuses={statuses}
        year={year}
        yearLabel={yearBig}
        playing={playing}
        selectedLine={selection?.kind === 'line' ? selection.id : null}
        onSetLines={setLines}
        onToggleStatus={toggleStatus}
        onYear={(y) => {
          setPlaying(false);
          setYear(y);
        }}
        onTogglePlay={togglePlay}
        onSelectLine={(id) => {
          selectLine(id);
          if (isMobile) setSidebarOpen(false);
        }}
        onSelectStation={(idx) => {
          selectStation(idx);
          if (isMobile) setSidebarOpen(false);
        }}
        onHoverLine={setHoverLine}
        onInfo={() => setInfoOpen(true)}
        onImport={openFilePicker}
      />

      {geo && vis && (
        <div className="year-badge" aria-live="polite">
          <div className="year-city">{geo.city.name}</div>
          <div className="year-big">{yearBig}</div>
          <div className="year-stats">
            <span>
              <b>{vis.lines.size}</b> lines
            </span>
            <span>
              <b>{vis.stations.size}</b> stations
            </span>
            <span>
              <b>{formatKm(vis.km)}</b> km
            </span>
          </div>
        </div>
      )}

      <div className="toolbar">
        <button type="button" className="icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Light map' : 'Dark map'} aria-label="Toggle light/dark map">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
        <button type="button" className="icon-btn" onClick={() => setLegendOpen((o) => !o)} aria-pressed={legendOpen} title="Legend" aria-label="Toggle legend">
          <Icon name="layers" />
        </button>
        <button type="button" className="icon-btn" onClick={() => setInfoOpen(true)} title="About this data" aria-label="About this data">
          <Icon name="info" />
        </button>
      </div>

      {legendOpen && <Legend onClose={() => setLegendOpen(false)} />}

      {showCard && geo && selection && (
        <DetailCard
          geo={geo}
          selection={selection}
          onClose={clearSelection}
          onSelectLine={selectLine}
          onSelectStation={selectStation}
          onHoverLine={setHoverLine}
        />
      )}

      {loading && (
        <div className="toast" role="status">
          <span className="spinner" aria-hidden="true" /> Loading {entry?.name ?? 'cities'}…
        </div>
      )}

      {message && (
        <div className="card message" role="alert">
          <h2>{message.title}</h2>
          <p>{message.body}</p>
          {message.retry && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (indexError) window.location.reload();
                else setReloadKey((k) => k + 1);
              }}
            >
              Try again
            </button>
          )}
        </div>
      )}

      {infoOpen && (
        <InfoPanel
          city={data}
          onClose={() => setInfoOpen(false)}
          onImport={openFilePicker}
          importedFrom={importedCity?.fileName ?? null}
          onRemoveImported={
            importedCity
              ? () => {
                  const id = importedCity.entry.id;
                  if (lastImport.current?.id === id) {
                    lastImport.current = null;
                    setBanner(null);
                  }
                  setInfoOpen(false);
                  removeImported(id, null, null);
                }
              : undefined
          }
        />
      )}

      {banner && (
        <ImportBanner
          state={banner}
          onDismiss={() => setBanner(null)}
          onDownload={() => {
            const d = lastImport.current?.data;
            if (d) downloadCityJson(d);
          }}
          onDiscard={discardLastImport}
        />
      )}

      {dropActive && <DropOverlay />}

      <input
        ref={fileInput}
        type="file"
        accept=".json,.geojson,.kml"
        hidden
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (files.length) void importFiles(files);
        }}
      />
    </div>
  );
}
