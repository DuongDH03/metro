// Curated spec for Taichung (Taichung MRT, TRA mountain / coast lines, THSR and projects). Built by build.mjs.
// Operating geometry and stations come from OpenStreetMap; future stations carry approximate
// coordinates (approx) estimated from published station sites (see research/taichung.md).

export const META = {
  name: 'Taichung',
  nameLocal: '臺中',
  center: [120.65, 24.16],
  zoom: 10.6,
  timeline: { min: 2007, max: 2042 },
  graphPad: 0.2,
  notes:
    'Covers Taichung and Changhua, clipped to lng 120.45-120.85 / lat 23.95-24.42 (TRA lines are cut at the last station inside that box; THSR is shown Miaoli - Changhua). ' +
    'Geometry and station positions © OpenStreetMap contributors, ODbL (Green Line from its route relation; TRA and THSR routed on the OSM track network; simplified ~15 m). ' +
    'Interchanges are merged when stations share a name within ~450 m; the HSR Taichung complex (THSR Taichung, TRA Xinwuri, MRT HSR Taichung Station) is one station. ' +
    'Colours: MRT lines use the values from Taichung MRT line diagrams as collected on Wikipedia (no official hex specification found); TRA and THSR have no line colours (colours chosen for the map). ' +
    'Projects: Blue Line (comprehensive plan approved 2024-01-29; Taichung Port - Dazhuang under construction since 2026-08-12; target 2034, the underground section may slip to 2036), Green Line extensions to Dakeng and Changhua (planned: feasibility approved 2024-01-31, comprehensive plan under MOTC review), Orange (Airport) Line (planned: feasibility approved in principle 2026-08-18; media estimate ~2042), Blue Line Taiping extension (proposed). ' +
    'Future station names are working names (English names mostly unofficial) and positions approximate, some to about 1 km. Not included: Taichung Red Line (Chongde - Fengyuan, feasibility study), Orange Line coast extension, the Taichung mountain-coast rail loop (山海環線) and Changhua railway elevation (feasibility stage), Changhua LRT.',
};

export const BBOX = { minLng: 120.45, minLat: 23.95, maxLng: 120.85, maxLat: 24.42 };

export const GROUPS = [
  { id: 'tmrt', name: 'Taichung MRT', nameLocal: '臺中捷運', color: '#8ec31c', description: 'Taichung Mass Rapid Transit: Green Line and the Blue / Orange lines and extensions.' },
  { id: 'tra', name: 'Taiwan Railway (TRA)', nameLocal: '臺鐵', color: '#090980', description: 'Taiwan Railway Corporation lines inside the map area (commuter service).' },
  { id: 'thsr', name: 'Taiwan High Speed Rail', nameLocal: '台灣高鐵', color: '#c35617', description: 'THSR, shown Miaoli - Taichung - Changhua.' },
];

export const SOURCES = [
  { id: 'osm', title: 'OpenStreetMap contributors (route relations, stations, track), ODbL', url: 'https://www.openstreetmap.org/copyright' },
  { id: 'tmrt', title: 'Taichung MRT - route map', url: 'https://www.tmrt.com.tw/en' },
  { id: 'tcrt', title: 'Taichung City Government, Mass Rapid Transit Engineering Office (捷運工程局)', url: 'https://tcrt.taichung.gov.tw/' },
  { id: 'tra', title: 'Taiwan Railway Corporation (臺鐵) - route map', url: 'https://www.railway.gov.tw/tra-tip-web/tip' },
  { id: 'thsr', title: 'Taiwan High Speed Rail - stations', url: 'https://en.thsrc.com.tw/' },
  { id: 'wiki-colors', title: 'Wikipedia: Module:Adjacent stations/Taichung MRT (line colours)', url: 'https://en.wikipedia.org/wiki/Module:Adjacent_stations/Taichung_MRT' },
  { id: 'tc-green-ext', title: 'Taichung City Government: 中捷綠線延伸案送中央審議 大坑、彰化段再跨關鍵一步 (2026-02-26)', url: 'https://www.taichung.gov.tw/8868/8872/9962/3220283' },
  { id: 'ltn-green-ext', title: 'Liberty Times: 台中捷運綠線延伸 捷工局已收到交通部綜規初審意見 (2026-10-01)', url: 'https://news.ltn.com.tw/news/Taichung/breakingnews/5591434' },
  { id: 'cna-green-ext', title: 'CNA: 台中捷運綠線延伸可行性研究獲核定 (2024-01-31)', url: 'https://www.cna.com.tw/news/aloc/202401310332.aspx' },
  { id: 'bella-green-ext', title: 'Bella: Taichung MRT Green Line extension to Changhua (2026-04)', url: 'https://www.bella.tw/articles/design&gadget/57162/taichung-new-mrt-green-line-extension-to-changhua' },
  { id: 'ltn-blue', title: 'Liberty Times: 中捷藍線 BC11 開工 (2026-08)', url: 'https://news.ltn.com.tw/news/Taichung/breakingnews/5527769' },
  { id: 'udn-blue', title: 'UDN: 中捷藍線預算增1300億元 (2026)', url: 'https://udn.com/news/story/7325/9660275' },
  { id: 'housefeel-blue', title: 'Housefeel: 台中捷運藍線 stations and status (2026)', url: 'https://www.housefeel.com.tw/article?id=3662' },
  { id: 'wiki-blue', title: 'Wikipedia (zh): 臺中捷運藍線', url: 'https://zh.wikipedia.org/zh-tw/臺中捷運藍線' },
  { id: 'tcrt-orange', title: 'Taichung MRT Engineering Office: 台中機場捷運橘線獲行政院原則同意 (2026-08-24)', url: 'https://tcrt.taichung.gov.tw/latestevent/Details?Parser=9%2C4%2C160%2C%2C%2C%2C1622' },
  { id: 'ctee-orange', title: 'Commercial Times: 行政院原則同意台中機場捷運橘線可行性研究 (2026-08-24)', url: 'https://www.ctee.com.tw/news/20260824701699-431401' },
  { id: 'bella-orange', title: 'Bella: Taichung MRT Orange (Airport) Line station list (2026-08-26)', url: 'https://www.bella.tw/articles/design&gadget/59684/taichung-new-mrt-orange-airport-line-completion-2042' },
];

const T = (o) => ({ group: 'tra', mode: 'commuter', sources: ['osm', 'tra'], ...o });
const s = (name, nameEn, coord, code, extra) => ({ name, nameEn, coord, approx: true, ...(code ? { code } : {}), ...extra });
const at = (name, near, code) => ({ name, near, ...(code ? { code } : {}) });

export const MERGES = [
  { id: 'thsr-changhua', names: ['彰化'], near: [120.5747, 23.8740], r: 1500, name: 'THSR Changhua', nameLocal: '高鐵彰化' },
  { id: 'hsr-taichung', names: ['台中', '新烏日'], near: [120.6155, 24.1115], r: 800, name: 'HSR Taichung / Xinwuri', nameLocal: '高鐵臺中／新烏日' },
];
export const EN = { 台中: 'Taichung', 彰化: 'Changhua' };
export const LOCAL = { 台中: '臺中' };

const hsrTc = at('台中', [120.6155, 24.1115]);
const tcStation = at('台中', [120.6866, 24.1372]);

export const LINES = [
  { id: 'green', code: 'G', name: 'Green Line', nameLocal: '綠線', group: 'tmrt', mode: 'metro', color: '#8EC31C', opened: 2021, codePrefix: '',
    sources: ['osm', 'tmrt', 'wiki-colors', 'tc-green-ext', 'ltn-green-ext', 'cna-green-ext', 'bella-green-ext'],
    description: 'Beitun Main - HSR Taichung Station (16.95 km, 18 stations), revenue service from 2021-04-25. Extensions to Dakeng (2.47 km, 2 stations) and Changhua (7.58 km, 6 stations): feasibility approved 2024-01-31, comprehensive plan sent to MOTC 2026-02-26 and being revised after first-round comments; Changhua section waits on the Changhua East urban plan. No target year (about 9 years after approval). Extension station names are working names.',
    segments: [
      { rel: 11330355, year: 2021 },
      { status: 'planned', label: 'Dakeng extension from Jiushe (comprehensive plan under review)',
        stops: [at('舊社', [120.7020, 24.1830]), s('松竹軍功路', 'Songzhu-Jungong Rd', [120.7140, 24.1870]), s('大坑經補庫', 'Dakeng', [120.7260, 24.1930])] },
      { status: 'planned', label: 'Changhua extension from HSR Taichung (comprehensive plan under review)',
        stops: [hsrTc, s('成功嶺', 'Chenggongling', [120.6000, 24.1040]), s('中山榮泉', 'Zhongshan Rongquan', [120.5880, 24.0960]),
          s('彰興金馬東', 'Zhangxing Jinma E.', [120.5620, 24.0900]), s('中山金馬', 'Zhongshan Jinma', [120.5520, 24.0880]), s('中山台化', 'Zhongshan Taihua', [120.5460, 24.0840]),
          s('金馬', 'Jinma', [120.5420, 24.0860])] },
    ] },
  { id: 'blue', code: 'B', name: 'Blue Line', nameLocal: '藍線', group: 'tmrt', mode: 'metro', color: '#0093D8', status: 'construction', opened: 2034,
    sources: ['tcrt', 'wiki-colors', 'ltn-blue', 'udn-blue', 'housefeel-blue', 'wiki-blue'],
    description: 'Taichung Port - Shalu - Taiwan Boulevard - Taichung Station, 24.78 km, 20 stations (B01-B08 elevated, B09-B20 underground). Comprehensive plan approved 2024-01-29; depot works since 2025-06, B01-B03 (contract BC11) since 2026-08-12, B04-B08 contract signed 2026-10-06 (works not yet confirmed), underground section not yet tendered (about NT$130 bn short). City target 2034; press reports the underground section slipping to 2036. Only Shalu, City Hall and Taichung Station names are official.',
    segments: [
      { status: 'construction', year: 2034, label: 'B01-B03 (construction since 2026-08, target 2034)',
        stops: [s('台中港', 'Taichung Port', [120.5240, 24.2525], 'B01', { id: 'taichung-port-blue' }), s('梧棲', 'Wuqi', [120.5320, 24.2490], 'B02'), s('大庄', 'Dazhuang', [120.5440, 24.2440], 'B03')] },
      { status: 'approved', year: 2034, label: 'B03-B08 elevated (contract signed 2026-10, target 2034)',
        stops: [s('大庄', 'Dazhuang', [120.5440, 24.2440]), at('沙鹿', [120.5640, 24.2340], 'B04'), s('竹林', 'Zhulin', [120.5700, 24.2310], 'B05'), s('靜宜大學', 'Providence University', [120.5790, 24.2275], 'B06'),
          s('弘光科大', 'Hungkuang University', [120.5860, 24.2225], 'B07'), s('正英路', 'Zhengying Rd', [120.5900, 24.2155], 'B08')] },
      { status: 'approved', year: 2034, label: 'B08-B20 underground (approved, not yet tendered; city target 2034, press 2036)',
        stops: [s('正英路', 'Zhengying Rd', [120.5900, 24.2155]), s('東海別墅', 'Donghai Villa', [120.5960, 24.1880], 'B09'), s('東海大學', 'Tunghai University', [120.6010, 24.1820], 'B10'),
          s('澄清醫院', 'Chengching Hospital', [120.6100, 24.1780], 'B11'), s('福安', "Fu'an", [120.6185, 24.1745], 'B12'), s('朝馬', 'Chaoma', [120.6390, 24.1670], 'B13'),
          at('市政府', [120.6467, 24.1625], 'B14'), s('忠明國小', 'Zhongming Elementary School', [120.6575, 24.1565], 'B15'), s('科博館', 'National Museum of Natural Science', [120.6650, 24.1530], 'B16'),
          s('茄苳腳', 'Qiedongjiao', [120.6720, 24.1480], 'B17'), s('第二市場', 'Second Market', [120.6800, 24.1435], 'B18'), { ...tcStation, code: 'B19' },
          s('帝國製糖廠', 'Imperial Sugar Factory', [120.6950, 24.1345], 'B20')] },
      { status: 'proposed', label: 'Taiping extension (feasibility study under MOTC review)',
        stops: [s('帝國製糖廠', 'Imperial Sugar Factory', [120.6950, 24.1345]), s('旱溪', 'Hanxi', [120.7040, 24.1370]), s('太平', 'Taiping', [120.7150, 24.1320]),
          s('太平運動場', 'Taiping Sports Ground', [120.7260, 24.1290]), s('三叉', 'Sancha', [120.7380, 24.1250])] },
    ] },
  { id: 'orange', code: 'O', name: 'Orange Line (Airport Line)', nameLocal: '橘線（機場捷運）', group: 'tmrt', mode: 'metro', color: '#FCA311', status: 'planned',
    sources: ['tcrt-orange', 'ctee-orange', 'bella-orange', 'wiki-colors'],
    description: 'Taichung Airport - Shuinan - Taichung Station - Dali - Wufeng, 29.23 km, 26 stations (15 elevated, 11 underground). Feasibility study approved in principle by the Executive Yuan 2026-08-18; comprehensive planning tendered 2026-07-31. No official year (city: ~12 years after approval; media ~2042). Station names are working names; many positions rough (about 1 km).',
    segments: [
      { status: 'planned', label: 'O01-O26 (feasibility approved in principle 2026-08)',
        stops: [s('台中國際機場', 'Taichung International Airport', [120.6210, 24.2640], 'O01'), s('公明', 'Gongming', [120.6290, 24.2575], 'O02'), s('清泉', 'Qingquan', [120.6360, 24.2500], 'O03'),
          s('埔仔墘', 'Puzaiqian', [120.6420, 24.2400], 'O04'), s('科雅', 'Keya', [120.6440, 24.2300], 'O05'), s('大雅', 'Daya', [120.6480, 24.2210], 'O06'),
          s('四塊厝', 'Sikuaicuo', [120.6520, 24.2100], 'O07'), s('水湳轉運中心', 'Shuinan Transit Center', [120.6500, 24.1930], 'O08'), s('水湳經貿園區', 'Shuinan Economic and Trade Park', [120.6470, 24.1850], 'O09'),
          s('陳平', 'Chenping', [120.6560, 24.1790], 'O10'), at('文心中清', [120.6640, 24.1735], 'O11'), s('賴厝', 'Laicuo', [120.6710, 24.1640], 'O12'),
          s('中國醫藥大學', 'China Medical University', [120.6800, 24.1570], 'O13'), s('新民高中', 'Xinmin Senior High School', [120.6830, 24.1500], 'O14'), s('台中科大', 'Taichung University of Science and Technology', [120.6850, 24.1440], 'O15'),
          { ...tcStation, code: 'O16' }, s('林祖廟', 'Linzu Temple', [120.6880, 24.1280], 'O17'), s('中興大學', 'National Chung Hsing University', [120.6870, 24.1210], 'O18'),
          s('仁愛醫院', "Ren'ai Hospital", [120.6870, 24.1080], 'O19'), s('大里', 'Dali', [120.6870, 24.0990], 'O20'), s('大里運動公園', 'Dali Sports Park', [120.6880, 24.0900], 'O21'),
          s('仁化', 'Renhua', [120.6900, 24.0800], 'O22'), s('軟體園區', 'Software Park', [120.6930, 24.0690], 'O23'), s('霧峰農工', 'Wufeng Agricultural and Industrial Vocational High School', [120.6970, 24.0560], 'O24'),
          s('霧峰', 'Wufeng', [120.6990, 24.0450], 'O25'), s('民主議政園區', 'Democracy Deliberation Park', [120.6980, 24.0370], 'O26')] },
    ] },

  // ---------------- TRA ----------------
  T({ id: 'tra-mountain', name: 'Western Line (Mountain Route)', nameLocal: '縱貫線（山線）', color: '#090980', opened: 1908,
    description: 'TRA Western Trunk Line via Taichung (Taichung Line, completed 1908), clipped at the map edge north of Tai\'an and south of Yuanlin. Fengyuan - Daqing elevated in 2016-2018 with new commuter stations (Lilin, Toujiacuo, Songzhu, Taiyuan, Jingwu, Wuquan). TRA has no official line colours (TRA navy used).',
    segments: [{ graph: 'tra', auto: true, from: '銅鑼', to: '員林', year: 1908 }] }),
  T({ id: 'tra-coast', name: 'Western Line (Coast Route)', nameLocal: '縱貫線（海線）', color: '#3D7CC9', opened: 1922,
    description: 'TRA Coast Line (opened 1922), from the map edge near Rinan via Dajia, Qingshui and Shalu to Zhuifen and Changhua. Colour chosen for the map.',
    segments: [
      { graph: 'tra', auto: true, from: '苑裡', to: '追分', year: 1922 },
      { graph: 'tra', auto: true, from: '追分', to: '彰化', year: 1922 },
    ] }),
  T({ id: 'tra-chengzhui', name: 'Chengzhui Line', nameLocal: '成追線', color: '#2BA3A6', opened: 1922,
    description: 'Short TRA link between Chenggong (Mountain Route) and Zhuifen (Coast Route). Colour chosen for the map.',
    segments: [{ graph: 'tra', auto: true, from: '成功', to: '追分', year: 1922 }] }),

  // ---------------- THSR ----------------
  { id: 'thsr', name: 'Taiwan High Speed Rail', nameLocal: '台灣高鐵', group: 'thsr', mode: 'shinkansen', color: '#C35617', opened: 2007,
    sources: ['osm', 'thsr'],
    description: 'Opened 2007 (Taichung station); Miaoli and Changhua stations opened 2015. Shown Miaoli - Changhua. Colour: THSR brand orange (no official line colour).',
    segments: [{ graph: 'hsr', via: ['苗栗', '台中', '彰化'], year: 2007 }] },
];
