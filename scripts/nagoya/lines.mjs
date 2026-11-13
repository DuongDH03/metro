// Curated metadata for the Nagoya - Gifu (Chukyo) dataset. This is the ONLY hand-curated input:
// track paths, station positions and stop order come from OpenStreetMap relations fetched by
// build.mjs, except the future projects at the bottom, whose stations carry approximate coords.
// Research notes and sources: research/nagoya.md.
//
// Segment spec (OSM-backed):
//   rel        OSM relation id (one direction of a route, or a route=railway track relation)
//   from/to    optional Japanese station names cutting a sub-range of the relation's stops
//   reverse    reverse stop order and geometry
//   stationOp  regex: for track-only relations (no stop members), take station nodes within 150 m
//              of the track whose operator / network / KSJ2:LIN tag matches
//   derive     ignore the relation's stop members and derive stops with stationOp (incomplete stops)
//   extra      station names to add along a derived relation (interchanges tagged for another line)
//   start      station the track chaining starts from (derived relations)
//   year, status ('operating' default), label, codePrefix / codeMod (station numbers)
// Segment spec (curated): { stops: [{ name, nameEn, coord, approx, id? }], path?, status, year?, label }

export const BBOX = { minLng: 136.5, minLat: 34.68, maxLng: 137.26, maxLat: 35.65 };

export const CITY = {
  id: 'nagoya',
  name: 'Nagoya · Gifu',
  nameLocal: '名古屋・岐阜',
  country: 'Japan',
  center: [136.9, 35.2],
  zoom: 10,
  timeline: { min: 1884, max: 2040 },
  notes:
    'Chūkyō region: Nagoya, Gifu, Ōgaki, Inuyama, Toyota, Okazaki and the Chita peninsula (Chūbu Centrair airport). ' +
    'Geometry and station positions © OpenStreetMap contributors, ODbL (route relations fetched via Overpass, simplified ~15 m), clipped to lng 136.5-137.26 / lat 34.68-35.65; ' +
    'lines are cut at the last station inside that box (Kintetsu and the JR Kansai Line at Kuwana, the Chūō Line at Tajimi, the Takayama Line at Mino-Ōta). ' +
    'Interchanges are merged when stations share a Japanese name within ~450 m; differently named transfer stations stay separate (Nagoya / Meitetsu Nagoya / Kintetsu Nagoya, Gifu / Meitetsu Gifu, Sakae / Sakaemachi, Owari-Ichinomiya / Meitetsu Ichinomiya). ' +
    'Segment years are first-opening years of each section; years for Meitetsu, Kintetsu and the older JR and third-sector lines are rounded to the first opening of the predecessor company line. ' +
    'JR Central and Meitetsu publish no per-line colours: JR colours are chosen for the map, Meitetsu colours follow its route-map direction groups (shades distinguish lines in one group). ' +
    'Future: Chūō Shinkansen (maglev) Shinagawa-Nagoya is under construction with no official opening year (JR Central: "2034 or later", a new date is due by end-2026); Nagoya-Osaka is planned (government: 2037 at the earliest). ' +
    'Nagoya City has no live subway extension: the unbuilt lines of the 1992 Transport Policy Council report No. 12 (target 2008) are shown as proposed (frozen), and the Aonami Line extension to Centrair as proposed (2018-19 study). ' +
    'The Meitetsu Hiromi Line Shin-Kani-Mitake section is due to close on 2029-04-01. ' +
    'Not included: Yutorito Line (Nagoya Guideway Bus, a guided bus), the SRT and BRT bus schemes, the Gifu LRT study (mode undecided), freight lines, and lines in Mie beyond Kuwana.',
};

export const GROUPS = [
  { id: 'jr', name: 'JR', nameLocal: 'JR', color: '#f68b1e', description: 'Central Japan Railway Company (JR Central / JR東海).' },
  { id: 'jr-central', name: 'JR Central lines', nameLocal: 'JR東海 在来線', parent: 'jr', color: '#f68b1e', description: 'JR Central conventional lines around Nagoya (station numbers CA, CF, CJ, CE, CG, CI). Colours chosen for the map.' },
  { id: 'jr-shinkansen', name: 'Shinkansen', nameLocal: '新幹線', parent: 'jr', color: '#1e50a2', description: 'Tōkaidō Shinkansen and the Chūō Shinkansen (maglev) under construction.' },
  { id: 'subway', name: 'Nagoya Subway', nameLocal: '名古屋市営地下鉄', color: '#fab123', description: 'Transportation Bureau, City of Nagoya.' },
  { id: 'nagoya-subway', name: 'Subway lines', nameLocal: '地下鉄', parent: 'subway', color: '#fab123', description: 'The six Nagoya Municipal Subway lines (H, M, E, T, S, K).' },
  { id: 'subway-plans', name: 'Unbuilt 1992 plan lines', nameLocal: '答申第12号 未着手路線', parent: 'subway', color: '#9e9e9e', description: 'New subway lines from the 1992 Transport Policy Council report No. 12 (target year 2008). Frozen: Nagoya City has no plan to build them. Alignments and stations are approximate.' },
  { id: 'private', name: 'Private railways', nameLocal: '私鉄', color: '#d12027', description: 'Private and third-sector railways.' },
  { id: 'meitetsu', name: 'Meitetsu', nameLocal: '名古屋鉄道', parent: 'private', color: '#d12027', description: 'Nagoya Railroad (名鉄), all lines in the map area (the Toyokawa Line is outside it).' },
  { id: 'kintetsu', name: 'Kintetsu', nameLocal: '近畿日本鉄道', parent: 'private', color: '#1b3db0', description: 'Kintetsu Railway, Nagoya Line (Kintetsu Nagoya - Kuwana inside the map area).' },
  { id: 'third-sector', name: 'Third-sector & other railways', nameLocal: '第三セクター・その他', parent: 'private', color: '#2536a1', description: 'Aonami Line, Linimo, Aichi Loop Railway, Jōhoku Line, Yōrō Railway, Tarumi Railway, Nagaragawa Railway.' },
];

const A = '2026-11-14';
export const SOURCES = [
  { id: 'osm', title: 'OpenStreetMap contributors (route relations, stations), ODbL', url: 'https://www.openstreetmap.org/copyright' },
  { id: 'kotsu', title: 'Transportation Bureau City of Nagoya - subway route map', url: 'https://www.kotsu.city.nagoya.jp/en/pc/subway/' },
  { id: 'wiki-nagoya-subway', title: 'Wikipedia (ja): 名古屋市営地下鉄 (line histories)', url: 'https://ja.wikipedia.org/wiki/名古屋市営地下鉄' },
  { id: 'jrcentral', title: 'JR Central - Nagoya area route map', url: 'https://railway.jr-central.co.jp/route-map/' },
  { id: 'meitetsu', title: 'Meitetsu - route map (路線図)', url: 'https://www.meitetsu.co.jp/train/map/' },
  { id: 'wiki-meitetsu', title: 'Wikipedia (ja): 名古屋鉄道 (line list and histories)', url: 'https://ja.wikipedia.org/wiki/名古屋鉄道' },
  { id: 'kintetsu', title: 'Kintetsu Railway - route map', url: 'https://www.kintetsu.co.jp/railway/rosen/' },
  { id: 'aonami', title: 'Nagoya Rinkai Rapid Railway (Aonami Line)', url: 'https://www.aonamiline.co.jp/' },
  { id: 'linimo', title: 'Aichi Rapid Transit (Linimo)', url: 'https://www.linimo.jp/' },
  { id: 'aikan', title: 'Aichi Loop Railway', url: 'https://www.aikanrailway.co.jp/' },
  { id: 'johoku', title: 'Wikipedia (ja): 東海交通事業城北線', url: 'https://ja.wikipedia.org/wiki/東海交通事業城北線' },
  { id: 'yoro', title: 'Yōrō Railway', url: 'https://www.yoro-railway.co.jp/' },
  { id: 'tarumi', title: 'Tarumi Railway', url: 'https://www.tarumi-railway.jp/' },
  { id: 'nagaragawa', title: 'Nagaragawa Railway', url: 'https://www.nagatetsu.co.jp/' },
  // future projects
  { id: 'jrc-chuo-progress', title: 'JR Central: 中央新幹線 都市部トンネル (第一中京圏トンネル) 工事の進捗 (updated 2026-11-09)', url: 'https://company.jr-central.co.jp/chuoshinkansen/urban_shield-tunnel/progress/' },
  { id: 'chunichi-2026-10', title: 'Chunichi Shimbun: リニア 静岡工区 着工は2027年3月以降 / 開業時期 年内に示す (2026-10-28)', url: 'https://www.chunichi.co.jp/article/1331646' },
  { id: 'nikkei-2026-07', title: 'Nikkei: リニア開業「2036年以降」の見方 (2026-07)', url: 'https://www.nikkei.com/article/DGXZQOCC026Q00S6A700C2000000/' },
  { id: 'sakigake-2025-10', title: 'Sakigake (Kyodo): リニア総工事費 11兆円に 4兆円増 (2025-10-29)', url: 'https://www.sakigake.jp/news/article/20251029CO0101/' },
  { id: 'nara-2026-07', title: 'Mie, Nara and Osaka prefectures: リニア中央新幹線 名古屋・大阪間 早期整備の要望 (2026-07-22)', url: 'https://www.pref.nara.lg.jp/documents/1104/20260722123233.pdf' },
  { id: 'kameyama-mie-station', title: 'Kameyama City: リニア中央新幹線 三重県駅 候補地 資料 (2025-12)', url: 'https://cms.city.kameyama.mie.jp/docs/2014112300444/file_contents/file_202512184111636_3.pdf' },
  { id: 'kotsu-2024-03', title: 'Nagoya Transportation Bureau: 経営計画2028(案) 市民意見と交通局の考え方 (2024-03)', url: 'https://www.city.nagoya.jp/_res/projects/default_project/_page_/001/028/366/060325.pdf' },
  { id: 'nagoya-plan-2030', title: 'City of Nagoya: 名古屋交通計画2030 (adopted 2023-03)', url: 'https://www.city.nagoya.jp/shisei/keikaku/1009818/1010247/1010248/1010249.html' },
  { id: 'trafficnews-2024-11', title: 'Norimono News: 「日本一短い地下鉄」なぜ誕生? 上飯田線 延伸は (2024-11-17)', url: 'https://trafficnews.jp/post/136154/2' },
  { id: 'report-12-1992', title: '運輸政策審議会答申第12号 名古屋圏における高速鉄道を中心とする交通網の整備に関する基本計画 (1992-01; secondary line list)', url: 'https://ja.wikid.org/名古屋圏における高速鉄道を中心とする交通網の整備に関する基本計画について' },
  { id: 'trafficnews-aonami', title: 'Norimono News: あおなみ線 中部空港延伸 名古屋市が調査へ (2019)', url: 'https://trafficnews.jp/post/83871' },
  { id: 'tabiris-aonami', title: 'Tabiris: あおなみ線を中部国際空港へ延伸検討 (2018-09)', url: 'https://tabiris.com/archives/aonamisen201809/' },
  { id: 'chubu-hiromi-2026', title: 'Chubu District Transport Bureau: 名鉄広見線 新可児～御嵩 鉄道事業廃止届出 (2026-08-04)', url: 'https://wwwtb.mlit.go.jp/chubu/press/pdf/tethudo2026080401.pdf' },
  { id: 'meitetsu-2025-12', title: 'Meitetsu news release: 名鉄名古屋駅地区再開発 計画見直し (2025-12-12)', url: 'https://prtimes.jp/main/html/rd/p/000000430.000089084.html' },
  { id: 'nagoya-guideway', title: 'City of Nagoya: ガイドウェイバス (Yutorito Line) 今後のあり方 (updated 2025-10-17)', url: 'https://www.city.nagoya.jp/shisei/keikaku/1009818/1010052/1034212/1010090.html' },
].map((s) => ({ ...s, accessed: A }));

const SUB = (o) => ({ group: 'nagoya-subway', mode: 'metro', sources: ['osm', 'kotsu', 'wiki-nagoya-subway'], ...o });
const J = (o) => ({ group: 'jr-central', mode: 'commuter', sources: ['osm', 'jrcentral'], ...o });
const MT = (o) => ({ group: 'meitetsu', mode: 'commuter', sources: ['osm', 'meitetsu', 'wiki-meitetsu'], ...o });
const TS = (o) => ({ group: 'third-sector', mode: 'commuter', ...o });
const PLAN = (o) => ({ group: 'subway-plans', mode: 'metro', status: 'proposed', sources: ['report-12-1992', 'kotsu-2024-03', 'nagoya-plan-2030'], ...o });

// approximate coordinates of places used by proposed lines
const P = {
  marutamachi: { name: '丸田町', nameEn: 'Marutamachi', coord: [136.9128, 35.1615], approx: true },
  shinSakae: { name: '新栄町', nameEn: 'Shinsakae-machi', coord: [136.9257, 35.1705], approx: true },
};

export const LINES = [
  // ---------------- Nagoya Municipal Subway ----------------
  SUB({ id: 'higashiyama', code: 'H', name: 'Higashiyama Line', nameLocal: '東山線', color: '#FAB123', opened: 1957,
    description: "Nagoya's first subway (Nagoya - Sakae, 1957) and its busiest line.",
    segments: [
      { rel: 421984, from: '高畑', to: '中村公園', year: 1982 },
      { rel: 421984, from: '中村公園', to: '名古屋', year: 1969 },
      { rel: 421984, from: '名古屋', to: '栄', year: 1957 },
      { rel: 421984, from: '栄', to: '池下', year: 1960 },
      { rel: 421984, from: '池下', to: '東山公園', year: 1963 },
      { rel: 421984, from: '東山公園', to: '星ヶ丘', year: 1967 },
      { rel: 421984, from: '星ヶ丘', to: '藤が丘', year: 1969 },
    ] }),
  SUB({ id: 'meijo', code: 'M', name: 'Meijō Line', nameLocal: '名城線', color: '#B074D6', opened: 1965,
    description: "Loop line, completed in 2004 (Japan's first subway loop). Shiyakusho station was renamed Nagoyajō in 2023.",
    segments: [
      { rel: 1905460, from: '金山', to: '栄', year: 1967, codeMod: 28 },
      { rel: 1905460, from: '栄', to: '名古屋城', year: 1965, codeMod: 28 },
      { rel: 1905460, from: '名古屋城', to: '大曽根', year: 1971, codeMod: 28 },
      { rel: 1905460, from: '大曽根', to: '砂田橋', year: 2000, codeMod: 28 },
      { rel: 1905460, from: '砂田橋', to: '名古屋大学', year: 2003, codeMod: 28 },
      { rel: 1905460, from: '名古屋大学', to: '新瑞橋', year: 2004, label: 'Loop completed (2004)', codeMod: 28 },
      { rel: 1905460, from: '新瑞橋', to: '金山', year: 1974, codeMod: 28 },
    ] }),
  SUB({ id: 'meiko', code: 'E', name: 'Meikō Line', nameLocal: '名港線', color: '#7E57C2', opened: 1971,
    description: 'Kanayama - Nagoyakō. Part of the Meijō Line until 2004; trains run through from the Meijō Line. Officially shares the Meijō purple; drawn in a darker purple to tell them apart.',
    segments: [{ rel: 7712570, year: 1971 }] }),
  SUB({ id: 'tsurumai', code: 'T', name: 'Tsurumai Line', nameLocal: '鶴舞線', color: '#009BBF', opened: 1977,
    description: 'Through service with the Meitetsu Inuyama Line at Kami-Otai (1993) and the Meitetsu Toyota Line at Akaike (1979).',
    segments: [
      { rel: 1920724, from: '上小田井', to: '庄内緑地公園', year: 1993 },
      { rel: 1920724, from: '庄内緑地公園', to: '浄心', year: 1984 },
      { rel: 1920724, from: '浄心', to: '伏見', year: 1981 },
      { rel: 1920724, from: '伏見', to: '八事', year: 1977 },
      { rel: 1920724, from: '八事', to: '赤池', year: 1978 },
    ] }),
  SUB({ id: 'sakura-dori', code: 'S', name: 'Sakura-dōri Line', nameLocal: '桜通線', color: '#C92F44', opened: 1989,
    description: 'Western terminus Nakamura-kuyakusho was renamed Taikō-dōri in 2023. The extensions shown as proposed come from the 1992 council report and are frozen (see research notes).',
    sources: ['osm', 'kotsu', 'wiki-nagoya-subway', 'report-12-1992', 'kotsu-2024-03'],
    segments: [
      { rel: 6566407, from: '太閤通', to: '今池', year: 1989 },
      { rel: 6566407, from: '今池', to: '野並', year: 1994 },
      { rel: 6566407, from: '野並', to: '徳重', year: 2011 },
      { status: 'proposed', label: 'West extension Taikō-dōri - Shippō (1992 report No. 12, frozen; approximate)',
        stops: [
          { name: '太閤通', nameEn: 'Taiko-dori', coord: [136.8795, 35.1712] },
          { name: '稲葉地', nameEn: 'Inabaji', coord: [136.838, 35.1745], approx: true },
          { name: '七宝', nameEn: 'Shippō', coord: [136.8067, 35.1958] },
        ] },
      { status: 'proposed', label: 'East extension Tokushige - Toyoake-kita (1992 report No. 12, frozen; approximate)',
        stops: [
          { name: '徳重', nameEn: 'Tokushige', coord: [136.9938, 35.0848] },
          { name: '豊明北', nameEn: 'Toyoake-kita (provisional)', coord: [137.012, 35.068], approx: true },
        ] },
    ] }),
  SUB({ id: 'kamiiida', code: 'K', name: 'Kamiiida Line', nameLocal: '上飯田線', color: '#FC78B4', opened: 2003,
    description: '0.8 km link to the Meitetsu Komaki Line (through service). The extension south to Shinsakae-machi and Marutamachi (1992 report No. 12) is frozen; Nagoya City has no plan to build it (2024).',
    sources: ['osm', 'kotsu', 'report-12-1992', 'kotsu-2024-03', 'trafficnews-2024-11'],
    segments: [
      { rel: 7712571, year: 2003 },
      { status: 'proposed', label: 'Extension Heian-dōri - Marutamachi (1992 report No. 12, frozen; approximate)',
        stops: [{ name: '平安通', nameEn: 'Heian-dōri', coord: [136.9283, 35.1985] }, P.shinSakae, P.marutamachi] },
    ] }),

  // ---------------- JR Central ----------------
  J({ id: 'tokaido', code: 'CA', name: 'Tōkaidō Line', nameLocal: '東海道本線', color: '#F68B1E', opened: 1884,
    description: 'Gamagōri - Nagoya - Gifu - Ōgaki - Tarui within the map area. Colour chosen for the map (JR Central uses one corporate orange).',
    segments: [
      { rel: 12015474, to: '大府', year: 1888 },
      { rel: 12015474, from: '大府', to: '熱田', year: 1886 },
      { rel: 12015474, from: '熱田', to: '木曽川', year: 1886 },
      { rel: 12015474, from: '木曽川', to: '大垣', year: 1887 },
      { rel: 12015474, from: '大垣', year: 1884 },
    ] }),
  J({ id: 'mino-akasaka', name: 'Tōkaidō Line (Mino-Akasaka branch)', nameLocal: '東海道本線 美濃赤坂支線', color: '#F6A85E', opened: 1919,
    description: 'Ōgaki - Mino-Akasaka branch (3 stations, unnumbered).',
    segments: [{ year: 1919, stops: [
      { name: '大垣', nameEn: 'Ōgaki', coord: [136.6127, 35.3672] },
      { name: '荒尾', nameEn: 'Arao', coord: [136.5835, 35.3734] },
      { name: '美濃赤坂', nameEn: 'Mino-Akasaka', coord: [136.582, 35.3869] },
    ], path: [[136.6127, 35.3672], [136.6, 35.3665], [136.5895, 35.3672], [136.5848, 35.3705], [136.5835, 35.3734], [136.5822, 35.3800], [136.582, 35.3869]] }] }),
  J({ id: 'chuo', code: 'CF', name: 'Chūō Line', nameLocal: '中央本線', color: '#2F6DB5', opened: 1900,
    description: 'Nagoya - Tajimi (cut at Tajimi; the line continues to Nakatsugawa and Shiojiri). Colour chosen for the map.',
    segments: [{ rel: 12018482, from: '名古屋', to: '多治見', year: 1900 }] }),
  J({ id: 'kansai', code: 'CJ', name: 'Kansai Line', nameLocal: '関西本線', color: '#16A085', opened: 1895,
    description: 'Nagoya - Kuwana (cut at Kuwana; continues to Kameyama). Colour chosen for the map.',
    segments: [{ rel: 1860848, stationOp: '(^|;)関西線($|;)', derive: true, extra: ['名古屋', '桑名'], start: '名古屋', to: '桑名', year: 1895 }] }),
  J({ id: 'taketoyo', code: 'CE', name: 'Taketoyo Line', nameLocal: '武豊線', color: '#9D7A63', opened: 1886,
    description: "Ōbu - Taketoyo. Aichi's first railway (1886), built to carry materials for the Tōkaidō Line. Colour chosen for the map.",
    segments: [{ rel: 12018372, year: 1886 }] }),
  J({ id: 'takayama', code: 'CG', name: 'Takayama Line', nameLocal: '高山本線', color: '#B2473E', opened: 1920,
    description: 'Gifu - Mino-Ōta (cut at Mino-Ōta; continues to Takayama and Toyama). Colour chosen for the map.',
    segments: [
      { rel: 12018529, from: '岐阜', to: '各務ケ原', year: 1920 },
      { rel: 12018529, from: '各務ケ原', to: '美濃太田', year: 1921 },
    ] }),
  J({ id: 'taita', code: 'CI', name: 'Taita Line', nameLocal: '太多線', color: '#C7B944', opened: 1918,
    description: 'Tajimi - Mino-Ōta. Colour chosen for the map.',
    segments: [
      { rel: 12018587, from: '多治見', to: '可児', year: 1918 },
      { rel: 12018587, from: '可児', to: '美濃太田', year: 1928 },
    ] }),
  {
    id: 'tokaido-shinkansen', name: 'Tōkaidō Shinkansen', nameLocal: '東海道新幹線', group: 'jr-shinkansen', mode: 'shinkansen', color: '#1E50A2', opened: 1964,
    sources: ['osm', 'jrcentral'], description: 'Operated by JR Central. Mikawa-Anjō station opened in 1988. Clipped at the map area.',
    segments: [{ rel: 9802525, year: 1964 }],
  },
  {
    id: 'chuo-shinkansen', name: 'Chūō Shinkansen (maglev)', nameLocal: 'リニア中央新幹線', group: 'jr-shinkansen', mode: 'shinkansen', color: '#00838F', status: 'construction',
    sources: ['jrc-chuo-progress', 'chunichi-2026-10', 'nikkei-2026-07', 'sakigake-2025-10', 'nara-2026-07', 'kameyama-mie-station'],
    description: 'SCMaglev by JR Central; no official colour (chosen for the map). Shinagawa - Nagoya (285.6 km, construction plan approved 2014): the underground Nagoya station is being dug under JR Nagoya and the ~34 km Daiichi Chūkyōken Tunnel (Nagoya - Kasugai - Kani) is being bored; Gifu Prefecture station is at Nakatsugawa, east of the map area. No official opening year: JR Central\'s last formal statement (2024-03) is "2034 or later"; it said in 2026 a new date would be given within the year (press expects 2036 or later). Total cost ~¥11 trillion (2025-10). Nagoya - Shin-Osaka (~152 km, via Nara) is in the 2011 development plan, environmental assessment started 2023-12; route and Mie station (Kameyama, three candidate sites) not fixed; government target "2037 at the earliest". Paths are approximate.',
    segments: [
      { status: 'construction', label: 'Nagoya - Gifu Prefecture station (part of Shinagawa - Nagoya; construction, opening "2034 or later")',
        stops: [
          { name: '名古屋', nameEn: 'Nagoya', coord: [136.8817, 35.1706] },
          { name: '岐阜県駅（仮称）', nameEn: 'Gifu Prefecture Station (provisional, Nakatsugawa)', coord: [137.457, 35.452], approx: true, id: 'chuo-shinkansen-gifu' },
        ],
        path: [[136.8817, 35.1706], [136.905, 35.195], [136.94, 35.232], [136.975, 35.262], [137.02, 35.3], [137.06, 35.35], [137.1, 35.39], [137.18, 35.415], [137.3, 35.43], [137.457, 35.452]] },
      { status: 'planned', label: 'Nagoya - Shin-Osaka section (planned; route and Mie station not fixed, government target 2037 at the earliest)',
        stops: [
          { name: '名古屋', nameEn: 'Nagoya', coord: [136.8817, 35.1706] },
          { name: '三重県駅（仮称）', nameEn: 'Mie Prefecture Station (provisional, Kameyama)', coord: [136.45, 34.86], approx: true, id: 'chuo-shinkansen-mie' },
        ] },
    ],
  },

  // ---------------- Meitetsu ----------------
  MT({ id: 'meitetsu-nagoya-main', code: 'NH', name: 'Meitetsu Nagoya Main Line', nameLocal: '名古屋本線', color: '#D12027', opened: 1914,
    description: 'Meitetsu Gifu - Meitetsu Nagoya - Toyohashi (cut east of Higashi-Okazaki at the map edge). The east and west halves (Aichi Electric Railway and Nagoya Railroad) were joined through Meitetsu Nagoya in 1941-44.',
    segments: [
      { rel: 11851820, from: '名鉄岐阜', to: '笠松', year: 1914 },
      { rel: 11851820, from: '笠松', to: '名鉄一宮', year: 1935 },
      { rel: 11851820, from: '名鉄一宮', to: '東枇杷島', year: 1914 },
      { rel: 11851820, from: '東枇杷島', to: '名鉄名古屋', year: 1941 },
      { rel: 11851820, from: '名鉄名古屋', to: '神宮前', year: 1944 },
      { rel: 11851820, from: '神宮前', to: '有松', year: 1917 },
      { rel: 11851820, from: '有松', to: '東岡崎', year: 1923 },
      { rel: 11851820, from: '東岡崎', year: 1926 },
    ] }),
  MT({ id: 'meitetsu-inuyama', code: 'IY', name: 'Meitetsu Inuyama Line', nameLocal: '犬山線', color: '#018B44', opened: 1912,
    description: 'Through service with the Tsurumai Line at Kami-Otai.',
    segments: [
      { rel: 11725280, from: '下小田井', to: '犬山', year: 1912 },
      { rel: 11725280, from: '犬山', to: '新鵜沼', year: 1926 },
    ] }),
  MT({ id: 'meitetsu-kakamigahara', code: 'KG', name: 'Meitetsu Kakamigahara Line', nameLocal: '各務原線', color: '#52B36B', opened: 1926,
    segments: [{ rel: 1952743, year: 1926 }] }),
  MT({ id: 'meitetsu-hiromi', code: 'HM', name: 'Meitetsu Hiromi Line', nameLocal: '広見線', color: '#7FC79B', opened: 1920,
    description: 'Inuyama - Shin-Kani - Mitake. Meitetsu filed to abolish Shin-Kani - Mitake (7.4 km) on 2026-08-04, with closure set for 2029-04-01.',
    sources: ['osm', 'meitetsu', 'wiki-meitetsu', 'chubu-hiromi-2026'],
    segments: [
      { rel: 11865970, from: '犬山', to: '日本ライン今渡', year: 1925 },
      { rel: 11865970, from: '日本ライン今渡', to: '新可児', year: 1929 },
      { rel: 11881657, from: '新可児', to: '御嵩口', year: 1920, label: 'Shin-Kani - Mitake: closure filed, due 2029-04-01' },
      { rel: 11881657, from: '御嵩口', to: '御嵩', year: 1952, label: 'Shin-Kani - Mitake: closure filed, due 2029-04-01' },
    ] }),
  MT({ id: 'meitetsu-komaki', code: 'KM', name: 'Meitetsu Komaki Line', nameLocal: '小牧線', color: '#DA5290', opened: 1931,
    description: 'Kami-Iida - Inuyama; underground south of Ajima since 2003 with through service onto the Kamiiida Line.',
    segments: [{ rel: 11852431, year: 1931 }] }),
  MT({ id: 'meitetsu-seto', code: 'ST', name: 'Meitetsu Seto Line', nameLocal: '瀬戸線', color: '#7C2982', opened: 1905,
    description: 'Sakaemachi - Owari Seto. Not connected to the rest of Meitetsu; the underground Sakaemachi terminal opened in 1978.',
    segments: [
      { rel: 11712441, from: '栄町', to: '東大手', year: 1978 },
      { rel: 11712441, from: '東大手', to: '大曽根', year: 1911 },
      { rel: 11712441, from: '大曽根', to: '尾張瀬戸', year: 1905 },
    ] }),
  MT({ id: 'meitetsu-tokoname', code: 'TA', name: 'Meitetsu Tokoname Line', nameLocal: '常滑線', color: '#1065AB', opened: 1912,
    segments: [
      { rel: 11862706, from: '神宮前', to: '大野町', year: 1912 },
      { rel: 11862706, from: '大野町', to: '常滑', year: 1913 },
    ] }),
  MT({ id: 'meitetsu-airport', code: 'TA', name: 'Meitetsu Airport Line', nameLocal: '空港線', color: '#1065AB', opened: 2005,
    description: 'Tokoname - Central Japan International Airport (Centrair), opened with the airport. μSKY limited expresses run from Meitetsu Nagoya.',
    segments: [{ rel: 11852485, year: 2005 }] }),
  MT({ id: 'meitetsu-kowa', code: 'KC', name: 'Meitetsu Kōwa Line', nameLocal: '河和線', color: '#2A9DD8', opened: 1931,
    segments: [
      { rel: 11862795, from: '太田川', to: '成岩', year: 1931 },
      { rel: 11862795, from: '成岩', to: '河和', year: 1935 },
    ] }),
  MT({ id: 'meitetsu-chita-new', code: 'KC', name: 'Meitetsu Chita New Line', nameLocal: '知多新線', color: '#6CC0E8', opened: 1974,
    segments: [
      { rel: 11862819, from: '富貴', to: '上野間', year: 1974 },
      { rel: 11862819, from: '上野間', to: '知多奥田', year: 1975 },
      { rel: 11862819, from: '知多奥田', to: '野間', year: 1976 },
      { rel: 11862819, from: '野間', to: '内海', year: 1980 },
    ] }),
  MT({ id: 'meitetsu-chikko', code: 'CH', name: 'Meitetsu Chikkō Line', nameLocal: '築港線', color: '#727171', opened: 1924,
    description: 'Ōe - Higashi Nagoyakō (1.5 km), mainly peak-hour commuter service.',
    segments: [{ rel: 10420920, year: 1924 }] }),
  MT({ id: 'meitetsu-tsushima', code: 'TB', name: 'Meitetsu Tsushima Line', nameLocal: '津島線', color: '#E85624', opened: 1914,
    segments: [{ rel: 11875682, year: 1914 }] }),
  MT({ id: 'meitetsu-bisai', code: 'BS', name: 'Meitetsu Bisai Line', nameLocal: '尾西線', color: '#F28C5B', opened: 1898,
    description: 'Yatomi - Tsushima - Meitetsu Ichinomiya - Tamanoi.',
    segments: [{ rel: 11865838, year: 1898 }] }),
  MT({ id: 'meitetsu-takehana', code: 'TH', name: 'Meitetsu Takehana Line', nameLocal: '竹鼻線', color: '#D7A629', opened: 1921,
    description: 'Kasamatsu - Egira (Egira - Ōsu closed 2001); trains continue on the Hashima Line to Shin-Hashima.',
    segments: [{ rel: 11865859, from: '笠松', to: '江吉良', year: 1921 }] }),
  MT({ id: 'meitetsu-hashima', code: 'TH', name: 'Meitetsu Hashima Line', nameLocal: '羽島線', color: '#E8C46A', opened: 1982,
    description: 'Egira - Shin-Hashima (1.3 km), next to Gifu-Hashima Shinkansen station.',
    segments: [{ rel: 11865859, from: '江吉良', to: '新羽島', year: 1982 }] }),
  MT({ id: 'meitetsu-mikawa', name: 'Meitetsu Mikawa Line', nameLocal: '三河線', color: '#8E6BBF', opened: 1914,
    description: 'Sanage - Toyotashi - Chiryū ("mountain line", MY) and Chiryū - Kariya - Hekinan ("sea line", MU). The ends beyond Sanage and Hekinan closed in 2004.',
    segments: [
      { rel: 11864807, sort: true, from: '猿投', to: '知立', year: 1920, codePrefix: 'MY' },
      { rel: 11862863, from: '知立', to: '碧南', year: 1914, codePrefix: 'MU' },
    ] }),
  MT({ id: 'meitetsu-toyota', code: 'TT', name: 'Meitetsu Toyota Line', nameLocal: '豊田線', color: '#9EB03A', opened: 1979,
    description: 'Akaike - Umetsubo, through service with the Tsurumai Line and on to Toyotashi.',
    segments: [{ rel: 11865470, to: '梅坪', year: 1979 }] }),
  MT({ id: 'meitetsu-nishio', code: 'GN', name: 'Meitetsu Nishio Line', nameLocal: '西尾線', color: '#654E9E', opened: 1911,
    segments: [
      { rel: 11856123, from: '新安城', to: '西尾', year: 1926 },
      { rel: 11856123, from: '西尾', to: '吉良吉田', year: 1911 },
    ] }),
  MT({ id: 'meitetsu-gamagori', code: 'GN', name: 'Meitetsu Gamagōri Line', nameLocal: '蒲郡線', color: '#A08FCB', opened: 1929,
    description: 'Kira-Yoshida - Gamagōri. Kept with local councils covering track costs for 15 years from FY2027.',
    segments: [
      { rel: 11862177, reverse: true, from: '吉良吉田', to: '三河鳥羽', year: 1929 },
      { rel: 11862177, reverse: true, from: '三河鳥羽', to: '蒲郡', year: 1936 },
    ] }),

  // ---------------- Kintetsu ----------------
  { id: 'kintetsu-nagoya', code: 'E', name: 'Kintetsu Nagoya Line', nameLocal: '近鉄名古屋線', group: 'kintetsu', mode: 'commuter', color: '#1B3DB0', opened: 1938,
    sources: ['osm', 'kintetsu'], description: 'Kintetsu Nagoya - Kuwana (cut at Kuwana; continues to Yokkaichi, Tsu and Ise-Nakagawa). Limited expresses to Osaka-Namba and Ise-Shima.',
    segments: [{ rel: 11949878, stationOp: '近畿日本鉄道|(^|;)名古屋線($|;)', derive: true, extra: ['近鉄名古屋', '桑名'], start: '近鉄名古屋', to: '桑名', year: 1938 }] },

  // ---------------- Third sector & others ----------------
  TS({ id: 'aonami', code: 'AN', name: 'Aonami Line', nameLocal: 'あおなみ線', color: '#334FA0', opened: 2004,
    sources: ['osm', 'aonami', 'trafficnews-aonami', 'tabiris-aonami'],
    description: 'Nagoya Rinkai Rapid Railway, Nagoya - Kinjō-futō (on a 1950 freight line). An extension to Centrair under the bay was studied by Nagoya City from FY2019 (proposed only; cost ~¥80-200 billion depending on option).',
    segments: [
      { rel: 9892401, year: 2004 },
      { status: 'proposed', label: 'Extension Kinjō-futō - Centrair (2018-19 study, not adopted; approximate)',
        stops: [
          { name: '金城ふ頭', nameEn: 'Kinjō-futō', coord: [136.8485, 35.0395] },
          { name: '中部国際空港', nameEn: 'Central Japan International Airport', coord: [136.8146, 34.8586] },
        ],
        path: [[136.8485, 35.0395], [136.835, 34.98], [136.822, 34.91], [136.8146, 34.8586]] },
    ] }),
  TS({ id: 'linimo', code: 'L', name: 'Linimo (Tōbu Kyūryō Line)', nameLocal: 'リニモ（東部丘陵線）', mode: 'agt', color: '#0067C0', opened: 2005,
    sources: ['osm', 'linimo'],
    description: "Aichi Rapid Transit. Japan's first commercial urban maglev (HSST), built for Expo 2005; fully automated.",
    segments: [{ rel: 9171166, year: 2005 }] }),
  TS({ id: 'aichi-loop', name: 'Aichi Loop Railway', nameLocal: '愛知環状鉄道線', color: '#3D5AFE', opened: 1976,
    sources: ['osm', 'aikan'],
    description: 'Okazaki - Toyota - Kōzōji (not a loop: the name refers to the planned JNR Okata line ring). Passenger service Okazaki - Shin-Toyota from 1976, to Kōzōji from 1988.',
    segments: [
      { rel: 12012560, from: '高蔵寺', to: '新豊田', year: 1988 },
      { rel: 12012560, from: '新豊田', to: '岡崎', year: 1976 },
    ] }),
  TS({ id: 'johoku', name: 'Jōhoku Line', nameLocal: '城北線', color: '#78909C', opened: 1991,
    sources: ['osm', 'johoku'],
    description: 'Tokai Transport Service (JR Central subsidiary), Biwajima - Kachigawa, elevated, non-electrified. No official colour. The Kachigawa and Ajiyoshi stations are separate from the JR / Meitetsu stations of the same name.',
    segments: [
      { rel: 11728676, from: '枇杷島', to: '尾張星の宮', year: 1993 },
      { rel: 11728676, from: '尾張星の宮', to: '勝川', year: 1991 },
    ] }),
  TS({ id: 'yoro', name: 'Yōrō Railway', nameLocal: '養老鉄道養老線', color: '#8D6E63', opened: 1913,
    sources: ['osm', 'yoro'],
    description: 'Kuwana - Ōgaki - Ibi. No official colour.',
    segments: [
      { rel: 1952744, stationOp: '養老', derive: true, extra: ['桑名', '大垣'], start: '桑名', from: '桑名', to: '養老', year: 1919 },
      { rel: 1952744, stationOp: '養老', derive: true, extra: ['桑名', '大垣'], start: '桑名', from: '養老', to: '池野', year: 1913 },
      { rel: 1952744, stationOp: '養老', derive: true, extra: ['桑名', '大垣'], start: '桑名', from: '池野', year: 1919 },
    ] }),
  TS({ id: 'tarumi', name: 'Tarumi Railway', nameLocal: '樽見鉄道樽見線', color: '#E57373', opened: 1956,
    sources: ['osm', 'tarumi'],
    description: 'Ōgaki - Tarumi. Built by JNR (1956-58), third-sector since 1984, extended to Tarumi in 1989. No official colour.',
    segments: [
      { rel: 1864491, stationOp: '樽見', extra: ['大垣'], start: '大垣', from: '大垣', to: '谷汲口', year: 1956 },
      { rel: 1864491, stationOp: '樽見', extra: ['大垣'], start: '大垣', from: '谷汲口', to: '神海', year: 1958 },
      { rel: 1864491, stationOp: '樽見', extra: ['大垣'], start: '大垣', from: '神海', to: '樽見', year: 1989 },
    ] }),
  TS({ id: 'nagaragawa', name: 'Nagaragawa Railway', nameLocal: '長良川鉄道越美南線', color: '#26A69A', opened: 1923,
    sources: ['osm', 'nagaragawa'],
    description: 'Mino-Ōta - Seki - Mino (cut at the map edge; continues to Gujō-Hachiman and Hokunō). Ex-JNR Etsumi-Nan Line, third-sector since 1986. No official colour.',
    segments: [
      { rel: 10030192, stationOp: '長良川|越美南線', derive: true, extra: ['美濃太田'], start: '美濃太田', from: '美濃太田', to: '美濃市', year: 1923 },
      { rel: 10030192, stationOp: '長良川|越美南線', derive: true, extra: ['美濃太田'], start: '美濃太田', from: '美濃市', year: 1927 },
    ] }),

  // ---------------- Unbuilt 1992 plan subway lines (proposed, frozen) ----------------
  PLAN({ id: 'plan-east-line', name: 'East Line (unbuilt)', nameLocal: '市交東部線（構想）', color: '#A1887F',
    description: '1992 report No. 12: Sasashima - Marutamachi - Fukiage - Hoshigaoka - Takabaribashi (onward to Iwasaki in Nisshin as a lower-priority section). A city committee recommended freezing it in 2009; Nagoya City has no plan to build new subways (2024). Stations and alignment approximate; straight lines between places.',
    segments: [{ status: 'proposed', label: 'Sasashima - Takabaribashi (1992 report No. 12, frozen)',
      stops: [
        { name: '笹島', nameEn: 'Sasashima', coord: [136.8845, 35.1652], approx: true },
        P.marutamachi,
        { name: '吹上', nameEn: 'Fukiage', coord: [136.9378, 35.1612] },
        { name: '星ヶ丘', nameEn: 'Hoshigaoka', coord: [137.0007, 35.1626] },
        { name: '高針橋', nameEn: 'Takabaribashi', coord: [137.026, 35.1565], approx: true },
      ] }] }),
  PLAN({ id: 'plan-kanayama-line', name: 'Kanayama Line (unbuilt)', nameLocal: '市交金山線（構想）', color: '#90A4AE',
    description: '1992 report No. 12: Toda - Kanayama - Marutamachi - Kurokawa (onward to Kusunoki-chō as a lower-priority section). About 7.3 km around Yaguma has had a city-planning decision since 1967 but no funding. Frozen. Stations and alignment approximate.',
    segments: [{ status: 'proposed', label: 'Toda - Kurokawa (1992 report No. 12, frozen)',
      stops: [
        { name: '戸田', nameEn: 'Toda', coord: [136.8153, 35.1385] },
        { name: '金山', nameEn: 'Kanayama', coord: [136.9006, 35.1431] },
        P.marutamachi,
        { name: '黒川', nameEn: 'Kurokawa', coord: [136.9117, 35.1975] },
      ] }] }),
  PLAN({ id: 'plan-south-line', name: 'South Line (unbuilt)', nameLocal: '南部線（構想）', color: '#BCAAA4',
    description: '1992 report No. 12 (lower-priority "B" route): Sakura-hommachi - Ōe - Nagoyakō - Inaei, linking the subway to the port and the Aonami Line. Frozen. Alignment approximate.',
    segments: [{ status: 'proposed', label: 'Sakura-hommachi - Inaei (1992 report No. 12, frozen)',
      stops: [
        { name: '桜本町', nameEn: 'Sakura-hommachi', coord: [136.9295, 35.1158] },
        { name: '大江', nameEn: 'Ōe', coord: [136.9078, 35.1078] },
        { name: '名古屋港', nameEn: 'Nagoyakō', coord: [136.8838, 35.0928] },
        { name: '稲永', nameEn: 'Inaei', coord: [136.8608, 35.0957] },
      ] }] }),
];

// OSM stop names that differ from the official station name (applied before matching/merging).
export const NAME_ALIASES = {};

// English names to use instead of the OSM name:en (typos / stale names), keyed by Japanese name.
export const EN_OVERRIDES = {
  '名古屋城': 'Nagoyajō',
  '太閤通': 'Taikō-dōri',
  '西尾口': 'Nishio-guchi',
  '知立': 'Chiryū',
  'ささしまライブ': 'Sasashima-raibu',
  '日本ライン今渡': 'Nihon Rain Imawatari',
  '定光寺': 'Jōkōji',
  '名鉄名古屋': 'Meitetsu Nagoya',
  '名鉄岐阜': 'Meitetsu Gifu',
  '名鉄一宮': 'Meitetsu Ichinomiya',
  '近鉄名古屋': 'Kintetsu Nagoya',
  '中部国際空港': 'Central Japan Int\'l Airport',
  '金山': 'Kanayama',
  '大曽根': 'Ōzone',
  '新栄町': 'Shinsakae-machi',
  '国際センター': 'Kokusai Center',
  '東山公園': 'Higashiyama Kōen',
  '新日鉄前': 'Shin-Nittetsu-mae',
};
