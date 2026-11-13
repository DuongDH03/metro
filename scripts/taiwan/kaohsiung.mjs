// Curated spec for Kaohsiung (KMRT, Circular LRT, TRA, THSR and projects). Built by build.mjs.
// Operating geometry and stations come from OpenStreetMap; future stations carry approximate
// coordinates (approx) estimated from the published station locations (see research/kaohsiung.md).

export const META = {
  name: 'Kaohsiung',
  nameLocal: '高雄',
  center: [120.31, 22.66],
  zoom: 10.6,
  timeline: { min: 2008, max: 2040 },
  notes:
    'Geometry and station positions © OpenStreetMap contributors, ODbL (KMRT and LRT from route relations; TRA and THSR routed on the OSM track network; simplified ~15 m). ' +
    'Covers Kaohsiung plus the Pingtung commuter corridor, clipped to lng 120.15-120.55 / lat 22.45-22.92 (THSR is shown to Tainan). ' +
    'Interchanges are merged when stations share a name within ~450 m, and official transfers with different names are merged explicitly (Zuoying / Xinzuoying, Kaisyuan / Cianjhen Star, Hamasen / Sizihwan). ' +
    'TRA and THSR have no official per-line colours: TRA lines use TRA navy and a second blue for branches, THSR uses its brand orange. ' +
    'Years of TRA sections are historic opening years. The Circular LRT opened in stages 2015-2024 (loop closed 2024-01-01). ' +
    'Projects: Red Line Gangshan-Lujhu phase 2A (construction, end-2029) and 2B (approved, 2031), Siaogang-Linyuan line (construction, 2034), Yellow Line (priority section under construction, 2032; rest approved/contracted, 2034), THSR extension to Pingtung (proposed, ~2039). ' +
    'Future station names are working names and their positions are approximate. Not included: Purple Line (feasibility study under review), Red Line extension Linyuan-Linbian to Pingtung (feasibility under review), Yellow Line Cianjhen fishing-port spur (under evaluation).',
};

export const BBOX = { minLng: 120.15, minLat: 22.45, maxLng: 120.55, maxLat: 22.92 };

export const GROUPS = [
  { id: 'krtc', name: 'Kaohsiung MRT', nameLocal: '高雄捷運', color: '#e20b65', description: 'Kaohsiung Rapid Transit (KRTC): Red and Orange lines, Circular Light Rail, and the lines under construction.' },
  { id: 'tra', name: 'Taiwan Railway (TRA)', nameLocal: '臺鐵', color: '#090980', description: 'Taiwan Railway Corporation commuter / conventional lines inside the map area.' },
  { id: 'thsr', name: 'Taiwan High Speed Rail', nameLocal: '台灣高鐵', color: '#c35617', description: 'THSR, shown from Tainan to its southern terminus Zuoying.' },
];

export const SOURCES = [
  { id: 'osm', title: 'OpenStreetMap contributors (route relations, stations, track), ODbL', url: 'https://www.openstreetmap.org/copyright' },
  { id: 'krtc', title: 'Kaohsiung Rapid Transit Corporation - route map', url: 'https://www.krtc.com.tw/eng/Guide/route_map' },
  { id: 'mtbu', title: 'Kaohsiung City Government, Mass Rapid Transit Bureau (捷運工程局)', url: 'https://mtbu.kcg.gov.tw/' },
  { id: 'tra', title: 'Taiwan Railway Corporation (臺鐵) - route map', url: 'https://www.railway.gov.tw/tra-tip-web/tip' },
  { id: 'thsr', title: 'Taiwan High Speed Rail - stations', url: 'https://en.thsrc.com.tw/' },
  { id: 'cna-lrt-loop', title: 'CNA: 高雄輕軌成圓 2024元旦全線通車 (2023-12-31)', url: 'https://www.cna.com.tw/news/ahel/202312310028.aspx' },
  { id: 'udn-rk', title: 'UDN: 高捷岡山至湖內將延後2年通車 (2025-10)', url: 'https://udn.com/news/story/7327/9059264' },
  { id: 'cna-rk', title: 'CNA: 高捷岡山路竹延伸線環差過關 (2026-10-07)', url: 'https://cna.com.tw/news/ahel/202610070170.aspx' },
  { id: 'housefeel-red', title: 'Housefeel: 高雄捷運紅線 小港林園線 岡山路竹延伸 explainer (updated 2026-11-13)', url: 'https://www.housefeel.com.tw/article/高雄捷運紅線-高捷紅線-小港林園線-岡山路竹延伸/' },
  { id: 'cna-rl', title: 'CNA: 高捷小港林園線全線發包 (2026-10-22)', url: 'https://cna.com.tw/news/aloc/202610220127.aspx' },
  { id: 'newtalk-rl', title: 'Newtalk: 小港林園線 RLC02 award (2026-05-08)', url: 'https://newtalk.tw/news/view/2026-05-08/1033937' },
  { id: 'housefeel-yellow', title: 'Housefeel: 高雄捷運黃線 explainer (updated 2026-11-04)', url: 'https://www.housefeel.com.tw/article/%E9%AB%98%E9%9B%84%E6%8D%B7%E9%81%8B%E9%BB%83%E7%B7%9A-%E9%AB%98%E6%8D%B7%E9%BB%83%E7%B7%9A-%E6%8D%B7%E9%81%8B%E9%BB%83%E7%B7%9A-%E9%AB%98%E6%8D%B7%E9%83%BD%E6%9C%83%E7%B7%9A/' },
  { id: 'wiki-yellow', title: 'Wikipedia (zh): 高雄捷運黃線', url: 'https://zh.wikipedia.org/zh-tw/高雄捷運黃線' },
  { id: 'pts-thsr-pt', title: 'PTS News: 高鐵延伸屏東 環評與期程 (2025)', url: 'https://news.pts.org.tw/article/783729' },
];

const K = (o) => ({ group: 'krtc', sources: ['osm', 'krtc'], ...o });
const T = (o) => ({ group: 'tra', mode: 'commuter', sources: ['osm', 'tra'], ...o });

export const MERGES = [
  { id: 'zuoying', names: ['左營', '新左營', '高鐵左營'], near: [120.3076, 22.6873], name: 'Zuoying / Xinzuoying', nameLocal: '左營／新左營' },
  { id: 'kaisyuan', names: ['凱旋', '前鎮之星'], near: [120.3175, 22.5969], name: 'Kaisyuan / Cianjhen Star', nameLocal: '凱旋／前鎮之星' },
  { id: 'aozihdi', names: ['凹子底', '愛河之心'], near: [120.3029, 22.6566], r: 300, name: 'Aozihdi / Heart of Love River', nameLocal: '凹子底／愛河之心' },
  { id: 'museum-of-fine-arts-tra', names: ['台鐵美術館', '美術館'], near: [120.2817, 22.6520], r: 250, name: 'Museum of Fine Arts (TRA)', nameLocal: '美術館（臺鐵）' },
  { id: 'sizihwan', names: ['西子灣', '哈瑪星'], near: [120.2737, 22.6215], name: 'Sizihwan / Hamasen', nameLocal: '西子灣／哈瑪星' },
];
// English names keyed by norm(Chinese name) where OSM has none or the official form differs.
export const EN = {
  高雄: 'Kaohsiung Main Station',
  左營: 'Zuoying (Jiucheng)',
};

export const LINES = [
  K({ id: 'red', code: 'R', name: 'Red Line', nameLocal: '紅線', color: '#E20B65', mode: 'metro', opened: 2008,
    sources: ['osm', 'krtc', 'mtbu', 'udn-rk', 'cna-rk', 'housefeel-red', 'cna-rl', 'newtalk-rl'],
    description: 'Siaogang - Gangshan (RK1 opened 2024-06-30). Gangshan-Lujhu extension phase 2A (RK2-RK6, ~8 km, works ~38% in Sept 2026, target end-2029) and 2B (RK7-RK8, comprehensive plan approved 2023, main works not started, target 2031). Siaogang-Linyuan south extension (RL1-RL7, ~11.6 km, works since 2023-11, target 2034). Future station names are working names.',
    segments: [
      { rel: 4174828, to: '岡山高醫', year: 2008 },
      { rel: 4174828, from: '岡山高醫', year: 2024, label: 'Gangshan-Lujhu extension phase 1: RK1 Gangshan (2024-06-30)' },
      { status: 'construction', year: 2029, label: 'Gangshan-Lujhu extension phase 2A, RK1-RK6 (construction, target end-2029)',
        stops: [
          { name: '岡山', near: [120.2966, 22.7907] },
          { name: '岡山農工', nameEn: 'Gangshan Vocational High School', coord: [120.2950, 22.8010], approx: true, code: 'RK2' },
          { name: '本洲產業園區', nameEn: 'Benzhou Industrial Park', coord: [120.2870, 22.8130], approx: true, code: 'RK3' },
          { name: '高雄科學園區', nameEn: 'Kaohsiung Science Park', coord: [120.2780, 22.8250], approx: true, code: 'RK4' },
          { name: '高苑科技', nameEn: 'Kao Yuan University', coord: [120.2710, 22.8380], approx: true, code: 'RK5' },
          { name: '南路竹', nameEn: 'South Lujhu', coord: [120.2660, 22.8480], approx: true, code: 'RK6' },
        ] },
      { status: 'approved', year: 2031, label: 'Gangshan-Lujhu extension phase 2B, RK6-RK8 (approved 2023, works not started, target 2031)',
        stops: [
          { name: '南路竹', nameEn: 'South Lujhu', coord: [120.2660, 22.8480], approx: true },
          { name: '路竹', nameEn: 'Lujhu', coord: [120.2620, 22.8610], approx: true, code: 'RK7' },
          { name: '大湖', nameEn: 'Dahu', coord: [120.2560, 22.8830], approx: true, code: 'RK8' },
        ] },
      { status: 'construction', year: 2034, label: 'Siaogang-Linyuan line, R3-RL7 (construction since 2023-11, target 2034)',
        stops: [
          { name: '小港', near: [120.3539, 22.5645] },
          { name: '中鋼東門', nameEn: 'CSC East Gate', coord: [120.3560, 22.5530], approx: true, code: 'RL1' },
          { name: '中林', nameEn: 'Zhonglin', coord: [120.3650, 22.5450], approx: true, code: 'RL2' },
          { name: '鳳鼻頭', nameEn: 'Fengbitou', coord: [120.3760, 22.5350], approx: true, code: 'RL3' },
          { name: '中坑門', nameEn: 'Zhongkengmen', coord: [120.3840, 22.5270], approx: true, code: 'RL4' },
          { name: '港子埔', nameEn: 'Gangzipu', coord: [120.3900, 22.5180], approx: true, code: 'RL5' },
          { name: '林園', nameEn: 'Linyuan', coord: [120.3960, 22.5080], approx: true, code: 'RL6' },
          { name: '林園工業區', nameEn: 'Linyuan Industrial Park', coord: [120.4020, 22.4970], approx: true, code: 'RL7' },
        ] },
    ] }),
  K({ id: 'orange', code: 'O', name: 'Orange Line', nameLocal: '橘線', color: '#FAA73F', mode: 'metro', opened: 2008,
    description: 'Sizihwan - Daliao, opened 2008-09-14.',
    segments: [{ rel: 4174827, year: 2008 }] }),
  K({ id: 'circular-lrt', code: 'C', name: 'Circular Light Rail', nameLocal: '環狀輕軌', color: '#7CBD52', mode: 'lrt', opened: 2015,
    sources: ['osm', 'krtc', 'cna-lrt-loop'],
    description: '22.1 km loop, 38 stations. Phase 1 (C1-C14) opened 2015-2017; phase 2 opened in stages from 2021 and closed the loop on 2024-01-01.',
    segments: [
      { rel: 6826886, label: 'Circular loop (phase 1 2015-2017, phase 2 2021-2024)', year: 2015 },
    ] }),
  K({ id: 'yellow', code: 'Y', name: 'Yellow Line', nameLocal: '黃線', color: '#FFC100', mode: 'metro', opened: 2032,
    sources: ['mtbu', 'housefeel-yellow', 'wiki-yellow'],
    description: 'Comprehensive plan approved by the Executive Yuan in March 2022 (22.9 km, 23 underground stations, a trunk Y1-Y5 that splits at Chengcing Lake into a north-west branch to the Cruise Terminal and a south branch to Cianjhen Senior High School). Civil works started 2023-12; works at Y1-Y5 and Y16-Y18 (priority section, target 2032) are underway. The other sections are contracted with no confirmed site works yet, so they are shown as approved (target 2034). Colour from the line diagram on zh.wikipedia; most English names are working translations.',
    segments: [
      { status: 'construction', year: 2032, label: 'Priority section Y1-Y5 (construction, target 2032)',
        stops: [
          { name: '坔埔', nameEn: 'Tanpu', coord: [120.3810, 22.6640], approx: true, code: 'Y1' },
          { name: '崎子腳', nameEn: 'Qizijiao', coord: [120.3720, 22.6620], approx: true, code: 'Y2' },
          { name: '鳥松', nameEn: 'Niaosong', coord: [120.3640, 22.6600], approx: true, code: 'Y3' },
          { name: '長庚醫院', nameEn: 'Chang Gung Memorial Hospital', coord: [120.3560, 22.6500], approx: true, code: 'Y4' },
          { name: '澄清湖', nameEn: 'Chengcing Lake', coord: [120.3500, 22.6440], approx: true, code: 'Y5' },
        ] },
      { status: 'construction', year: 2032, label: 'Priority section Y5-Y18 (construction, target 2032)',
        stops: [
          { name: '澄清湖', nameEn: 'Chengcing Lake', coord: [120.3500, 22.6440], approx: true },
          { name: '寶業滯洪公園', nameEn: 'Baoye Detention Park', coord: [120.3520, 22.6370], approx: true, code: 'Y16' },
          { name: '正義', nameEn: 'Zhengyi', near: [120.3427, 22.6341], code: 'Y17' },
          { name: '衛武營', nameEn: 'Weiwuying', near: [120.3402, 22.6247], code: 'Y18' },
        ] },
      { status: 'approved', year: 2034, label: 'Y5-Y15 via Jiangong, Minzu and Sanduo roads (contracted, target 2034)',
        stops: [
          { name: '澄清湖', nameEn: 'Chengcing Lake', coord: [120.3500, 22.6440], approx: true },
          { name: '大華', nameEn: 'Dahua', coord: [120.3410, 22.6450], approx: true, code: 'Y6' },
          { name: '本館', nameEn: 'Benguan', coord: [120.3330, 22.6460], approx: true, code: 'Y7' },
          { name: '高雄高工', nameEn: 'Kaohsiung Industrial High School', coord: [120.3240, 22.6440], approx: true, code: 'Y8' },
          { name: '大港', nameEn: 'Dagang', coord: [120.3140, 22.6460], approx: true, code: 'Y9' },
          { name: '民族', nameEn: 'Minzu', near: [120.3135, 22.6395], code: 'Y10' },
          { name: '信義國小', nameEn: 'Sinyi Elementary School', near: [120.3125, 22.6300], code: 'Y11' },
          { name: '四維行政中心', nameEn: 'Siwei Administration Center', coord: [120.3120, 22.6220], approx: true, code: 'Y12' },
          { name: '三多市場', nameEn: 'Sanduo Market', coord: [120.3075, 22.6155], approx: true, code: 'Y13' },
          { name: '三多商圈', nameEn: 'Sanduo Shopping District', near: [120.3047, 22.6136], code: 'Y14' },
          { name: '旅運中心', nameEn: 'Kaohsiung Port Cruise Terminal', near: [120.2985, 22.6130], code: 'Y15' },
        ] },
      { status: 'approved', year: 2034, label: 'Y18-Y23 via Wujia Road (contracted, target 2034)',
        stops: [
          { name: '衛武營', nameEn: 'Weiwuying', near: [120.3402, 22.6247] },
          { name: '新甲', nameEn: 'Xinjia', coord: [120.3420, 22.6140], approx: true, code: 'Y19' },
          { name: '七老爺', nameEn: 'Qilaoye', coord: [120.3410, 22.6060], approx: true, code: 'Y20' },
          { name: '五甲', nameEn: 'Wujia', coord: [120.3340, 22.6000], approx: true, code: 'Y21' },
          { name: '龍成宮', nameEn: 'Longcheng Temple', coord: [120.3270, 22.5955], approx: true, code: 'Y22' },
          { name: '前鎮高中', nameEn: 'Cianjhen Senior High School', near: [120.3210, 22.5890], code: 'Y23' },
        ] },
    ] }),

  // ---------------- TRA ----------------
  T({ id: 'tra-western', name: 'Western Line', nameLocal: '縱貫線', color: '#090980', opened: 1900,
    description: 'TRA Western Trunk Line (Tainan - Kaohsiung section opened 1900), clipped to the map area. Kaohsiung city section underground since 2018. TRA has no official line colours (TRA navy used).',
    segments: [{ graph: 'tra', auto: true, from: '台南', to: '高雄', year: 1900 }] }),
  T({ id: 'tra-pingtung', name: 'Pingtung Line', nameLocal: '屏東線', color: '#3D7CC9', opened: 1907,
    description: 'Kaohsiung - Pingtung - Chaozhou (clipped at Chaozhou; the line continues to Fangliao). Opened 1907-1920 in stages; double-tracked and electrified to Chaozhou by 2015. Colour chosen for the map.',
    segments: [{ graph: 'tra', auto: true, from: '高雄', to: '潮州', year: 1913 }] }),

  // ---------------- THSR ----------------
  { id: 'thsr', name: 'Taiwan High Speed Rail', nameLocal: '台灣高鐵', group: 'thsr', mode: 'shinkansen', color: '#C35617', opened: 2007,
    sources: ['osm', 'thsr', 'pts-thsr-pt'],
    description: 'Opened 2007. Shown Tainan - Zuoying. Extension to Pingtung (Zuoying - Kaohsiung - Liukuaicuo, 26.2 km): proposed, in the second-stage environmental review, comprehensive plan expected ~2028 and opening ~2039 per press; new station positions approximate. Colour: THSR brand orange (no official line colour).',
    segments: [
      { graph: 'hsr', via: ['台南', '左營'], year: 2007 },
      { status: 'proposed', year: 2039, label: 'Extension to Pingtung (proposed, EIA stage, ~2039 per press)',
        stops: [
          { name: '左營', near: [120.3076, 22.6873] },
          { name: '高雄', nameEn: 'Kaohsiung Main Station', near: [120.3025, 22.6394] },
          { name: '高鐵屏東', nameEn: 'Pingtung (Liukuaicuo)', coord: [120.5137, 22.6617], approx: true, id: 'thsr-pingtung' },
        ] },
    ] },
];
