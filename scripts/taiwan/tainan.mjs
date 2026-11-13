// Curated spec for Tainan (TRA, Shalun Line, THSR and the approved Blue Line monorail). Built by build.mjs.
// Operating geometry and stations come from OpenStreetMap; future stations carry approximate
// coordinates (approx) estimated from published station sites (see research/tainan.md).

export const META = {
  name: 'Tainan',
  nameLocal: '臺南',
  center: [120.24, 23.0],
  zoom: 11,
  timeline: { min: 2007, max: 2036 },
  graphPad: 0.28,
  notes:
    'Tainan has no metro in service yet; the map shows TRA commuter lines, the Shalun Line and THSR, plus the approved Blue Line monorail. ' +
    'Clipped to lng 120.10-120.40 / lat 22.88-23.20 (TRA cut at the last station inside the box; THSR shown Chiayi - Tainan; Zuoying is on the Kaohsiung map). ' +
    'Geometry and station positions © OpenStreetMap contributors, ODbL (TRA and THSR routed on the OSM track network; simplified ~15 m). ' +
    'The Tainan railway undergrounding (8.23 km) opened in October 2026; its two new commuter stations Linsen (2029) and South Tainan (2030) are under construction. ' +
    'Blue Line phase 1 (8.39 km straddle monorail, B1-B10): comprehensive plan approved by the Executive Yuan 2025-10-21, design-build tender closed 2026-09-29 with no award reported, target 2033. Its Rende - Guiren - THSR Tainan / Guanmiao extension (15 km, planned) and the Green Line (proposed) are not drawn because no station sites are published. ' +
    'Future station names are working names and positions approximate (some about 1 km). TRA and THSR have no line colours (colours chosen for the map); the Blue Line has no published hex.',
};

export const BBOX = { minLng: 120.1, minLat: 22.88, maxLng: 120.4, maxLat: 23.2 };

export const GROUPS = [
  { id: 'tainan-metro', name: 'Tainan Metro', nameLocal: '臺南捷運', color: '#0072bc', description: 'Tainan Advanced Transit System (先進運輸系統), approved Blue Line.' },
  { id: 'tra', name: 'Taiwan Railway (TRA)', nameLocal: '臺鐵', color: '#090980', description: 'Taiwan Railway Corporation lines inside the map area (commuter service).' },
  { id: 'thsr', name: 'Taiwan High Speed Rail', nameLocal: '台灣高鐵', color: '#c35617', description: 'THSR, shown Chiayi - Tainan.' },
];

export const SOURCES = [
  { id: 'osm', title: 'OpenStreetMap contributors (stations, track), ODbL', url: 'https://www.openstreetmap.org/copyright' },
  { id: 'tra', title: 'Taiwan Railway Corporation (臺鐵) - route map', url: 'https://www.railway.gov.tw/tra-tip-web/tip' },
  { id: 'thsr', title: 'Taiwan High Speed Rail - stations', url: 'https://en.thsrc.com.tw/' },
  { id: 'ettoday-blue', title: 'ETtoday: 台南捷運藍線第一期 行政院核定 (2025-10-21)', url: 'https://www.ettoday.net/news/20251021/3054260.htm' },
  { id: 'ctee-blue', title: 'Commercial Times: 294億藍線正式招標 (2026-08-18)', url: 'https://www.ctee.com.tw/news/20260818701011-431401' },
  { id: 'bella-blue', title: 'Bella: Tainan MRT Blue Line from Daqiao to Rende, station sites (2026-04-24)', url: 'https://www.bella.tw/articles/design&gadget/57392/tainan-new-mrt-blue-line-from-daqiao-to-rende' },
  { id: 'twreporter-ug', title: 'The Reporter: 台南鐵路地下化 2026 通車 (2026-10)', url: 'https://www.twreporter.org/a/tainan-underground-railway-2026-open-to-traffic' },
];

const T = (o) => ({ group: 'tra', mode: 'commuter', sources: ['osm', 'tra'], ...o });
const s = (name, nameEn, coord, code, extra) => ({ name, nameEn, coord, approx: true, ...(code ? { code } : {}), ...extra });
const at = (name, near, code) => ({ name, near, ...(code ? { code } : {}) });

export const MERGES = [
  { id: 'thsr-tainan', names: ['台南', '沙崙'], near: [120.2858, 22.9248], r: 800, name: 'THSR Tainan / Shalun', nameLocal: '高鐵臺南／沙崙' },
];
export const EN = { 台南: 'Tainan' };
export const LOCAL = { 台南: '臺南' };

const b6 = s('東門路口', 'Dongmen Rd', [120.2300, 22.9830], 'B6');

export const LINES = [
  { id: 'blue', code: 'B', name: 'Blue Line', nameLocal: '藍線', group: 'tainan-metro', mode: 'monorail', color: '#0072BC', status: 'approved', opened: 2033,
    sources: ['ettoday-blue', 'ctee-blue', 'bella-blue'],
    description: 'Phase 1: Daqiao (TRA) - Zhonghua Rd - Cultural Center, with a branch from B6 to Rende transit station; 8.39 km elevated straddle monorail, 10 stations, depot at Rende. Approved by the Executive Yuan 2025-10-21; NT$29.4 bn design-build tender closed 2026-09-29, no award or groundbreaking reported by 2026-11-14. Target 2033. No published colour hex (blue chosen). Station names are working names.',
    segments: [
      { status: 'approved', year: 2033, label: 'Phase 1 trunk, B1 Daqiao - B8 Cultural Center (approved, target 2033)',
        stops: [at('大橋', [120.2245, 23.0180], 'B1'), s('中華中山路口', 'Zhonghua-Zhongshan Rd', [120.2290, 23.0120], 'B2'), s('中華二路口', 'Zhonghua 2nd Rd', [120.2320, 23.0050], 'B3'),
          s('小東路口', 'Xiaodong Rd', [120.2335, 22.9975], 'B4'), s('平實', 'Pingshi', [120.2320, 22.9905], 'B5'), b6,
          s('崇德', 'Chongde', [120.2285, 22.9750], 'B7'), s('文化中心', 'Cultural Center', [120.2270, 22.9680], 'B8')] },
      { status: 'approved', year: 2033, label: 'Phase 1 branch, B6 - B10 Rende (approved, target 2033)',
        stops: [b6, s('東門路三段', 'Dongmen Rd Sec. 3', [120.2400, 22.9810], 'B9'), s('仁德轉運站', 'Rende Transit Station', [120.2470, 22.9770], 'B10')] },
    ] },

  // ---------------- TRA ----------------
  T({ id: 'tra-western', name: 'Western Line', nameLocal: '縱貫線', color: '#090980', opened: 1900,
    description: 'TRA Western Trunk Line through Tainan (Tainan - Kaohsiung 1900, north to Chiayi 1901-1902), clipped at the map edge. The Tainan city section has run underground since October 2026. TRA has no official line colours (TRA navy used).',
    segments: [
      { graph: 'tra', auto: true, from: '新營', to: '台南', year: 1901 },
      { graph: 'tra', auto: true, from: '台南', to: '路竹', year: 1900 },
    ] }),
  T({ id: 'tra-tainan-underground', name: 'Tainan Railway Underground: new stations', nameLocal: '臺南鐵路地下化 新站', color: '#5B6DC4', status: 'construction', opened: 2029,
    sources: ['osm', 'tra', 'twreporter-ug'],
    description: 'The underground line opened in October 2026; two new commuter stations are under construction: Linsen (target 2029) and South Tainan (target 2030). Positions approximate. Colour chosen for the map.',
    segments: [
      { status: 'construction', year: 2029, graph: 'tra', label: 'Linsen station (construction, target 2029)',
        stops: [at('台南', [120.2129, 22.9972]), s('林森', 'Linsen', [120.2225, 22.9865])] },
      { status: 'construction', year: 2030, graph: 'tra', label: 'South Tainan station (construction, target 2030)',
        stops: [s('林森', 'Linsen', [120.2225, 22.9865]), s('南臺南', 'South Tainan', [120.2260, 22.9760]), at('保安', [120.2320, 22.9327])] },
    ] }),
  T({ id: 'tra-shalun', name: 'Shalun Line', nameLocal: '沙崙線', color: '#3D7CC9', opened: 2011,
    description: 'Zhongzhou - Shalun branch to THSR Tainan, opened 2011-01-02. Colour chosen for the map.',
    segments: [{ graph: 'tra', auto: true, from: '中洲', to: '沙崙', year: 2011 }] }),

  // ---------------- THSR ----------------
  { id: 'thsr', name: 'Taiwan High Speed Rail', nameLocal: '台灣高鐵', group: 'thsr', mode: 'shinkansen', color: '#C35617', opened: 2007,
    sources: ['osm', 'thsr'],
    description: 'Opened 2007. Shown Chiayi - Tainan (south of Tainan see the Kaohsiung map). Colour: THSR brand orange (no official line colour).',
    segments: [{ graph: 'hsr', via: ['嘉義', '台南'], year: 2007 }] },
];
