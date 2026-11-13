// Curated metadata for the Osaka · Kyoto · Kobe (Keihanshin) dataset, read by ./build.mjs.
// Everything geometric for operating lines (track paths, station positions, stop order) comes from
// OpenStreetMap route relations; the upcoming projects at the bottom of each operator carry curated
// stops (approximate coordinates unless the station already exists, which is looked up by name).
//
// Segment spec (OSM-backed):
//   rel        OSM route relation id (one direction; an all-stations service where possible)
//   from/to    optional Japanese station names cutting a sub-range of the relation's stops (relation order)
//   reverse / sort / fromNth   as in scripts/tokyo/lines.mjs
//   year       opening year (actual for operating, target otherwise); status default 'operating'
//   codePrefix / codeMod / codeStart   station-number prefix in display form ('M', 'JR-A', 'HK-'), loop modulus
// Segment spec (curated): { stops: [{ name, nameEn?, coord?, approx?, near? }], status, year?, label }
//   a stop without `coord` is an existing station, looked up by name in OSM station nodes (near `near`).

export const BBOX = { minLng: 134.9, minLat: 34.3, maxLng: 136.1, maxLat: 35.15 };

// Route relations deleted from live OSM in Nov 2026 (Keihan Nakanoshima / Keishin / Ishiyama-Sakamoto, JR
// Kusatsu, Kintetsu Kashihara): fetched from the older kumi.systems mirror instead (build.mjs). Keihan Main
// and the JR Wakayama Line were gone from both servers: they use their route=railway (track) relations
// with a curated station list (`stopNames`). The Kintetsu Yoshino Line is not included.
export const STALE_RELS = [11981534, 10238009, 9495945, 11203157, 11959219];

// Merge keys. Applied to the normalised Japanese name before clustering (same key within ~450 m =>
// one station). Operator prefixes (山陽明石, 京阪山科, 近鉄丹波橋, JR淡路…) are stripped by MERGE_PREFIX.
export const NAME_ALIASES = {
  大阪梅田: '大阪', 梅田: '大阪',
  大阪難波: 'なんば',
  大阪阿部野橋: '天王寺', 天王寺駅前: '天王寺',
  三ノ宮: '三宮', 神戸三宮: '三宮',
  なかもず: '中百舌鳥',
};
export const MERGE_PREFIX = /^(JR|阪急|阪神|京阪|近鉄|南海|山陽|神鉄|地下鉄)/;
// Display names for merged hub stations (keyed by merge key).
export const HUBS = {
  大阪: { id: 'osaka-umeda', name: 'Osaka / Umeda', nameLocal: '大阪・梅田', near: [135.4977, 34.7025] },
  なんば: { id: 'namba', name: 'Namba', nameLocal: 'なんば・大阪難波', near: [135.5013, 34.6646] },
  天王寺: { id: 'tennoji', name: 'Tennōji / Abenobashi', nameLocal: '天王寺・大阪阿部野橋', near: [135.5143, 34.6466] },
  三宮: { id: 'sannomiya', name: 'Sannomiya', nameLocal: '三宮・三ノ宮', near: [135.1955, 34.6946] },
};
export const EN_OVERRIDES = { 新今宮: 'Shin-Imamiya' };

export const GROUPS = [
  { id: 'jr', name: 'JR', nameLocal: 'JR', color: '#0072bc', description: 'Japan Railways group: JR West conventional lines and the Shinkansen.' },
  { id: 'jr-west', name: 'JR West', nameLocal: 'JR西日本', parent: 'jr', color: '#0072bc', description: 'JR West "Urban Network" lines in Keihanshin, plus the Naniwasuji Line project (Kansai Rapid Railway, JR West + Nankai).' },
  { id: 'jr-shinkansen', name: 'Shinkansen', nameLocal: '新幹線', parent: 'jr', color: '#1e50a2', description: 'Tōkaidō (JR Central) and San\'yō (JR West) Shinkansen within the map box, plus the Hokuriku and Chūō Shinkansen projects to Shin-Osaka.' },
  { id: 'subway', name: 'Subway', nameLocal: '地下鉄', color: '#e5171f', description: 'Municipal subways of Osaka, Kyoto and Kobe.' },
  { id: 'osaka-metro', name: 'Osaka Metro', nameLocal: 'Osaka Metro', parent: 'subway', color: '#e5171f', description: 'Osaka Metro Co. (8 subway lines and the New Tram), with Kita-Osaka Kyuko (through-running with the Midōsuji Line).' },
  { id: 'kyoto-subway', name: 'Kyoto Municipal Subway', nameLocal: '京都市営地下鉄', parent: 'subway', color: '#00a353', description: 'Kyoto City Transportation Bureau (Karasuma and Tōzai lines).' },
  { id: 'kobe-subway', name: 'Kobe Municipal Subway', nameLocal: '神戸市営地下鉄', parent: 'subway', color: '#009944', description: 'Kobe City Transportation Bureau (Seishin-Yamate incl. Hokushin, Kaigan).' },
  { id: 'private', name: 'Private railways', nameLocal: '私鉄', color: '#8c2a2a', description: 'Major private railways (大手私鉄), their branches and third-sector lines.' },
  { id: 'hankyu', name: 'Hankyu', nameLocal: '阪急電鉄', parent: 'private', color: '#8c2a2a', description: 'Hankyu Corporation.' },
  { id: 'hanshin', name: 'Hanshin', nameLocal: '阪神電気鉄道', parent: 'private', color: '#0f64b4', description: 'Hanshin Electric Railway.' },
  { id: 'keihan', name: 'Keihan', nameLocal: '京阪電気鉄道', parent: 'private', color: '#1c6c3b', description: 'Keihan Electric Railway (Keihan lines and the Ōtsu lines).' },
  { id: 'kintetsu', name: 'Kintetsu', nameLocal: '近畿日本鉄道', parent: 'private', color: '#d52031', description: 'Kintetsu Railway, lines inside the map box.' },
  { id: 'nankai', name: 'Nankai', nameLocal: '南海電気鉄道', parent: 'private', color: '#f08300', description: 'Nankai Electric Railway, incl. the Semboku Line (Semboku Rapid Railway merged into Nankai on 2025-04-01).' },
  { id: 'hyogo-private', name: 'Sanyo, Shintetsu & Nose', nameLocal: '山陽・神鉄・能勢電', parent: 'private', color: '#5a3d91', description: 'Sanyo Electric Railway, Kobe Electric Railway (Shintetsu) and Nose Electric Railway.' },
  { id: 'trams-local', name: 'Trams & local lines', nameLocal: '路面電車・その他', parent: 'private', color: '#6d6e71', description: 'Randen (Keifuku), Eizan, Hankai tramway and Mizuma Railway.' },
  { id: 'monorail-agt', name: 'Monorail & AGT', nameLocal: 'モノレール・新交通', parent: 'private', color: '#f39700', description: 'Osaka Monorail and Kobe New Transit (Port Liner, Rokko Liner).' },
];

export const SOURCES = [
  { id: 'osm', title: 'OpenStreetMap contributors: route relations and stations (Overpass), ODbL', url: 'https://www.openstreetmap.org/copyright' },
  { id: 'jrwest', title: 'JR West: Kinki area route map (アーバンネットワーク路線図)', url: 'https://www.westjr.co.jp/global/en/' },
  { id: 'jrcentral', title: 'JR Central: Tōkaidō Shinkansen', url: 'https://global.jr-central.co.jp/en/' },
  { id: 'osakametro', title: 'Osaka Metro: route map', url: 'https://subway.osakametro.co.jp/en/guide/routemap.php' },
  { id: 'kitakyu', title: 'Kita-Osaka Kyuko Railway', url: 'https://www.kita-kyu.co.jp/' },
  { id: 'kyoto-subway', title: 'Kyoto City Transportation Bureau: subway', url: 'https://www2.city.kyoto.lg.jp/kotsu/webguide/en/subway/' },
  { id: 'kobe-subway', title: 'Kobe City Transportation Bureau: subway', url: 'https://kotsu.city.kobe.lg.jp/' },
  { id: 'hankyu', title: 'Hankyu Railway: route map', url: 'https://www.hankyu.co.jp/global/en/' },
  { id: 'hanshin', title: 'Hanshin Electric Railway: route map', url: 'https://rail.hanshin.co.jp/global/en/' },
  { id: 'keihan', title: 'Keihan Electric Railway: route map', url: 'https://www.keihan.co.jp/travel/en/' },
  { id: 'kintetsu', title: 'Kintetsu Railway: route map', url: 'https://www.kintetsu.co.jp/foreign/english/' },
  { id: 'nankai', title: 'Nankai Electric Railway: route map', url: 'https://www.nankai.co.jp/en/' },
  { id: 'sanyo', title: 'Sanyo Electric Railway', url: 'https://www.sanyo-railway.co.jp/' },
  { id: 'shintetsu', title: 'Kobe Electric Railway (Shintetsu)', url: 'https://www.shintetsu.co.jp/' },
  { id: 'nosedenkitetsudo', title: 'Nose Electric Railway', url: 'https://noseden.hankyu.co.jp/' },
  { id: 'keifuku', title: 'Keifuku Electric Railroad (Randen)', url: 'https://randen.keifuku.co.jp/en/' },
  { id: 'eizan', title: 'Eizan Electric Railway', url: 'https://eizandensha.co.jp/' },
  { id: 'hankai', title: 'Hankai Tramway', url: 'https://www.hankai.co.jp/' },
  { id: 'mizuma', title: 'Mizuma Railway', url: 'https://www.suitetsu.co.jp/' },
  { id: 'osaka-monorail', title: 'Osaka Monorail', url: 'https://www.osaka-monorail.co.jp/' },
  { id: 'knt', title: 'Kobe New Transit (Port Liner, Rokko Liner)', url: 'https://www.knt-liner.co.jp/' },
  // projects
  { id: 'jrw-naniwasuji', title: 'JR West: なにわ筋線 project page', url: 'https://www.westjr.co.jp/railroad/project/project16/' },
  { id: 'osaka-pref-naniwasuji', title: 'Osaka Prefecture: なにわ筋線の整備 (provisional station names, opening spring 2031 / end of FY2030)', url: 'https://www.pref.osaka.lg.jp/toshikotsu/naniwasuzisen/index.html' },
  { id: 'tabiris-naniwasuji-2026', title: 'Tabiris: なにわ筋線 事業費6425億円に (2026-08-21; target kept)', url: 'https://tabiris.com/archives/naniwasujisen-jigyouhi/' },
  { id: 'kumanichi-hokuriku-2026', title: 'Kyodo / Kumamoto Nichinichi: 北陸新幹線小浜ルート決定 京都新駅は「桂川案」 (2026-07-15)', url: 'https://www.kumanichi.com/articles/2013771' },
  { id: 'trafficnews-hokuriku-2024', title: 'Norimono News: 北陸新幹線の詳細ルート明らかに (JRTT Kyoto options, construction period) (2024-08-07)', url: 'https://trafficnews.jp/post/134228' },
  { id: 'osaka-pref-linear-2026', title: 'Mie, Nara and Osaka prefectures: リニア中央新幹線の早期全線開業に関する要望書 (2026-07)', url: 'https://www.pref.osaka.lg.jp/documents/3317/linear_youbou.pdf' },
  { id: 'cas-linear', title: 'Cabinet Secretariat: リニア中央新幹線 関係資料 (Osaka opening brought forward up to 8 years from 2045)', url: 'https://www.cas.go.jp/jp/seisaku/linear/dai1/siryou2.pdf' },
  { id: 'osaka-pref-monorail-2025', title: 'Osaka Prefecture: 大阪モノレール延伸事業 コストマネジメント資料 (2025-08-21)', url: 'https://www.pref.osaka.lg.jp/documents/95635/4_oosakamonore-ruenshinzigyou_kadomashieki~_kashou_uriudoueki_.pdf' },
  { id: 'osaka-pref-monorail-2024', title: 'Osaka Prefecture: 建設事業評価 説明資料 R6 (opening moved to FY2033) (2024)', url: 'https://www.pref.osaka.lg.jp/documents/83188/r6-1_6_monorail-setsumei.pdf' },
  { id: 'trafficnews-monorail-2023', title: 'Norimono News: 大阪モノレール東大阪延伸 (station list) (2023-08-04)', url: 'https://trafficnews.jp/post/127276' },
  { id: 'tabiris-hankyu-2026', title: 'Tabiris: 阪急新大阪連絡線、北陸新幹線ルート次第 (2026-05-23)', url: 'https://tabiris.com/archives/hankyu-shinosaka202605/' },
  { id: 'trafficnews-hankyu-2018', title: 'Norimono News: 大阪空港線は採算性要検討 なにわ筋連絡線・新大阪連絡線は概ね良好 国交省が試算 (2018)', url: 'https://trafficnews.jp/post/80203' },
  { id: 'osaka-pref-yumeshima-2025', title: 'Osaka Prefecture: 夢洲アクセス鉄道 検討結果 (2025-08-06)', url: 'https://www.pref.osaka.lg.jp/o140030/kitarutokentoukekka.html' },
  { id: 'impress-yumeshima-2025', title: 'Impress Travel Watch: 夢洲北側の鉄道アクセス、JRゆめ咲線・京阪中之島線の延伸が優位 (2025-08-07)', url: 'https://travel.watch.impress.co.jp/docs/news/2037711.html' },
  { id: 'kyodo-keihan-2026', title: 'Kyodo: 京阪の夢洲延伸、30年にも着工 (2026-05-12)', url: 'https://www.oanda.jp/lab-education/market_news/kn_2026051201001836/' },
  { id: 'sakigake-jrw-yumeshima-2026', title: 'Kyodo / Akita Sakigake: JR西日本、夢洲延伸へ検討会 (2026-05-15)', url: 'https://www.sakigake.jp/news/article/20260515CO0133/' },
  { id: 'osaka-city-toshin8', title: 'Osaka City: 近畿地方交通審議会答申第8号 (2004) の路線 (Imazatosuji, Yotsubashi extensions etc.)', url: 'https://www.city.osaka.lg.jp/toshikeikaku/cmsfiles/contents/0000479/479729/05_1.pdf' },
  { id: 'osaka-city-imazato-brt', title: 'Osaka City: いまざとライナー効果検証 R7 (2026-02)', url: 'https://www.city.osaka.lg.jp/toshikotsu/cmsfiles/contents/0000672/672899/R7gaiyou.pdf' },
  { id: 'kyoto-city-tozai-ext', title: 'Kyoto City: 地下鉄東西線延伸 資料 (2007-04-18)', url: 'https://www.city.kyoto.lg.jp/sogo/cmsfiles/contents/0000014/14270/20070418-01.pdf' },
  { id: 'tabiris-keihanna', title: 'Tabiris: 近鉄けいはんな線延伸 (答申第8号)', url: 'https://tabiris.com/railproject/archives/keihanna' },
  { id: 'trafficnews-hankyu-airport', title: 'Norimono News: 梅田と直結「阪急大阪空港線」実現の可能性は?', url: 'https://trafficnews.jp/post/87494' },
  { id: 'minoh-kitakyu', title: 'Minoh City: 北大阪急行線延伸 開業日 (2024-03-23)', url: 'https://www.city.minoh.lg.jp/kitakyu/releaseday.html' },
  { id: 'kenbiya-yumeshima', title: 'Kenbiya: 夢洲駅 開業 (2025-01-19)', url: 'https://www.kenbiya.com/ar/ns/region/osaka/8647.html' },
  { id: 'trafficnews-umekita', title: 'Norimono News: うめきた地下ホーム開業 (2023-03-18)', url: 'https://trafficnews.jp/post/124955' },
];

const mk = (defaults) => (o) => ({ ...defaults, ...o, sources: [...defaults.sources, ...(o.sources || [])] });
const J = mk({ group: 'jr-west', mode: 'commuter', sources: ['osm', 'jrwest'] });
const SH = mk({ group: 'jr-shinkansen', mode: 'shinkansen', sources: ['osm'] });
const OM = mk({ group: 'osaka-metro', mode: 'metro', sources: ['osm', 'osakametro'] });
const KY = mk({ group: 'kyoto-subway', mode: 'metro', sources: ['osm', 'kyoto-subway'] });
const KO = mk({ group: 'kobe-subway', mode: 'metro', sources: ['osm', 'kobe-subway'] });
const HK = mk({ group: 'hankyu', mode: 'commuter', codePrefix: 'HK-', sources: ['osm', 'hankyu'] });
const HS = mk({ group: 'hanshin', mode: 'commuter', codePrefix: 'HS', sources: ['osm', 'hanshin'] });
const KH = mk({ group: 'keihan', mode: 'commuter', sources: ['osm', 'keihan'] });
const KT = mk({ group: 'kintetsu', mode: 'commuter', sources: ['osm', 'kintetsu'] });
const NK = mk({ group: 'nankai', mode: 'commuter', codePrefix: 'NK', sources: ['osm', 'nankai'] });
const HY = mk({ group: 'hyogo-private', mode: 'commuter', sources: ['osm'] });
const TL = mk({ group: 'trams-local', mode: 'tram', sources: ['osm'] });
const MA = mk({ group: 'monorail-agt', mode: 'monorail', sources: ['osm'] });

// existing station looked up in OSM by name (near a point); estimated new station
const at = (name, near) => ({ name, near });
const est = (name, nameEn, coord) => ({ name, nameEn, coord, approx: true });

// Station lists for lines built from track relations (OSM route relations deleted, Nov 2026)
const KEIHAN_TRACK = 1921059; // 京阪電気鉄道京阪本線・鴨東線 (route=railway)
const KEIHAN_MAIN = ['淀屋橋', '北浜', '天満橋', '京橋', '野江', '関目', '森小路', '千林', '滝井', '土居', '守口市', '西三荘', '門真市', '古川橋', '大和田', '萱島',
  '寝屋川市', '香里園', '光善寺', '枚方公園', '枚方市', '御殿山', '牧野', '樟葉', '橋本', '石清水八幡宮', '淀', '中書島', '伏見桃山', '丹波橋', '墨染', '藤森',
  '龍谷大前深草', '伏見稲荷', '鳥羽街道', '東福寺', '七条', '清水五条', '祇園四条', '三条', '神宮丸太町', '出町柳'];
const WAKAYAMA_TRACK = 1864761; // JR和歌山線 (route=railway)
const WAKAYAMA = ['王寺', '畠田', '志都美', '香芝', 'JR五位堂', '高田', '大和新庄', '掖上', '吉野口', '北宇智', '五条', '大和二見', '隅田', '下兵庫', '橋本'];

export const LINES = [
  // ================= JR West =================
  J({ id: 'jr-osaka-loop', code: 'O', codePrefix: 'JR-O', name: 'Osaka Loop Line', nameLocal: '大阪環状線', color: '#f15a24', opened: 1895,
    description: 'Loop through Osaka/Umeda, Kyōbashi, Tsuruhashi, Tennōji and Nishikujō. Closed into a loop in 1961, fully elevated 1964.',
    segments: [{ rel: 10073682, year: 1961, label: 'Loop (closed 1961)' }] }),
  J({ id: 'jr-kyoto', code: 'A', codePrefix: 'JR-A', name: 'JR Kyoto Line', nameLocal: 'JR京都線', color: '#0072bc', opened: 1876,
    description: 'Tōkaidō Main Line, Kyoto – Osaka.',
    segments: [
      { rel: 11808753, from: '大阪', to: '向日町', year: 1876 },
      { rel: 11808753, from: '向日町', to: '京都', year: 1877 },
    ] }),
  J({ id: 'jr-biwako', code: 'A', codePrefix: 'JR-A', name: 'Biwako Line', nameLocal: 'JR琵琶湖線', color: '#0b8bd0', opened: 1880,
    description: 'Tōkaidō Main Line, Kyoto – Ōtsu – Kusatsu – Maibara, clipped at the map box (east of Yasu/Ōmi-Hachiman).',
    segments: [
      { rel: 11789435, from: '京都', to: '大津', year: 1880, label: 'Kyoto – Ōtsu (present route via the Higashiyama Tunnel since 1921)' },
      { rel: 11789435, from: '大津', to: '稲枝', year: 1889 },
    ] }),
  J({ id: 'jr-kobe', code: 'A', codePrefix: 'JR-A', name: 'JR Kobe Line', nameLocal: 'JR神戸線', color: '#0072bc', opened: 1874,
    description: 'Tōkaidō Main Line Osaka – Kobe (1874) and San\'yō Main Line beyond Kobe (1888), clipped at the map box west of Nishi-Akashi.',
    segments: [
      { rel: 11808751, from: '大阪', to: '神戸', year: 1874 },
      { rel: 11808751, from: '神戸', to: '加古川', year: 1888, label: 'San\'yō Main Line (Kobe – Akashi 1888)' },
    ] }),
  J({ id: 'jr-wadamisaki', name: 'Wadamisaki Line', nameLocal: '和田岬線', color: '#5b9bd5', opened: 1890,
    description: 'San\'yō Main Line branch Hyōgo – Wadamisaki (2.7 km, trains at peak hours only). No OSM route relation: drawn as a straight line between the two stations.',
    segments: [{ year: 1890, stops: [at('兵庫', [135.1678, 34.6706]), at('和田岬', [135.1764, 34.6588])] }] }),
  J({ id: 'jr-takarazuka', code: 'G', codePrefix: 'JR-G', name: 'JR Takarazuka Line', nameLocal: 'JR宝塚線', color: '#ffd400', textColor: '#000000', opened: 1891,
    description: 'Fukuchiyama Line Amagasaki – Sasayamaguchi (trains start at Osaka over the JR Kobe Line).',
    segments: [
      { rel: 11808856, from: '大阪', to: '尼崎', year: 1874, label: 'Osaka – Amagasaki (JR Kobe Line tracks)' },
      { rel: 11808856, from: '尼崎', to: '宝塚', year: 1897, label: 'Amagasaki – Takarazuka (1891–1897)' },
      { rel: 11808856, from: '宝塚', to: '篠山口', year: 1899 },
    ] }),
  J({ id: 'jr-tozai', code: 'H', codePrefix: 'JR-H', name: 'JR Tōzai Line', nameLocal: 'JR東西線', color: '#e4007f', opened: 1997,
    description: 'Underground link Kyōbashi – Kitashinchi – Amagasaki, through-running with the Gakkentoshi and Takarazuka/Kobe lines.',
    segments: [{ rel: 11816511, year: 1997 }] }),
  J({ id: 'jr-gakkentoshi', code: 'H', codePrefix: 'JR-H', name: 'Gakkentoshi Line', nameLocal: '学研都市線（片町線）', color: '#e4007f', opened: 1895,
    segments: [
      { rel: 11815533, from: '京橋', to: '長尾', year: 1895 },
      { rel: 11815533, from: '長尾', to: '木津', year: 1898 },
    ] }),
  J({ id: 'jr-osaka-higashi', code: 'F', codePrefix: 'JR-F', name: 'Osaka Higashi Line', nameLocal: 'おおさか東線', color: '#5c6fc0', opened: 2008,
    sources: ['trafficnews-umekita'],
    segments: [
      { rel: 3344075, from: '大阪', to: '新大阪', year: 2023, label: 'Shin-Osaka – Osaka (Umekita underground platforms), opened 2023-03-18' },
      { rel: 3344075, from: '新大阪', to: '放出', year: 2019 },
      { rel: 3344075, from: '放出', to: '久宝寺', year: 2008 },
    ] }),
  J({ id: 'jr-yamatoji', code: 'Q', codePrefix: 'JR-Q', name: 'Yamatoji Line', nameLocal: '大和路線（関西本線）', color: '#00a651', opened: 1889,
    segments: [
      { rel: 11810048, from: 'JR難波', to: '王寺', year: 1889 },
      { rel: 11821213, from: '王寺', to: '奈良', year: 1890 },
      { rel: 11821213, from: '奈良', to: '加茂', year: 1898 },
    ] }),
  J({ id: 'jr-hanwa', code: 'R', codePrefix: 'JR-R', name: 'Hanwa Line', nameLocal: '阪和線', color: '#f39800', opened: 1929,
    description: 'Tennōji – Wakayama (Hanwa Electric Railway 1929–1930), clipped at the map box.',
    segments: [
      { rel: 11000345, from: '天王寺', to: '和歌山', year: 1929 },
      { rel: 10956742, year: 1929, label: 'Higashi-Hagoromo branch' },
    ] }),
  J({ id: 'jr-kansai-airport', code: 'S', codePrefix: 'JR-S', name: 'Kansai Airport Line', nameLocal: '関西空港線', color: '#1d2088', opened: 1994,
    segments: [{ rel: 11232176, year: 1994 }] }),
  J({ id: 'jr-sakurajima', code: 'P', codePrefix: 'JR-P', name: 'JR Yumesaki Line (Sakurajima Line)', nameLocal: 'JRゆめ咲線（桜島線）', color: '#26489c', opened: 1898,
    sources: ['osaka-pref-yumeshima-2025', 'impress-yumeshima-2025', 'sakigake-jrw-yumeshima-2026'],
    description: 'Nishikujō – Universal City – Sakurajima. Extension to Yumeshima via Maishima: proposed (Osaka study 2025-08 favoured it; JR West, Osaka Prefecture and City formed a study group in 2026-03; no decision and no official year, the study assumed ~2037).',
    segments: [
      { rel: 6088924, from: '西九条', to: '安治川口', year: 1898 },
      { rel: 6088924, from: '安治川口', to: '桜島', year: 1910 },
      { status: 'proposed', label: 'Sakurajima – Maishima – Yumeshima extension (~6 km, joint study since 2026-03; stations provisional)',
        stops: [at('桜島', [135.4322, 34.6619]), est('舞洲', 'Maishima', [135.405, 34.663]), at('夢洲', [135.3896, 34.652])] },
    ] }),
  J({ id: 'jr-nara', code: 'D', codePrefix: 'JR-D', name: 'Nara Line', nameLocal: '奈良線', color: '#b5893c', opened: 1896,
    segments: [{ rel: 11370090, year: 1896 }] }),
  J({ id: 'jr-sagano', code: 'E', codePrefix: 'JR-E', name: 'Sagano Line', nameLocal: '嵯峨野線（山陰本線）', color: '#8c2d8a', opened: 1897,
    segments: [
      { rel: 10154357, from: '京都', to: '嵯峨嵐山', year: 1897 },
      { rel: 10154357, from: '嵯峨嵐山', to: '園部', year: 1899 },
    ] }),
  J({ id: 'jr-kosei', code: 'B', codePrefix: 'JR-B', name: 'Kosei Line', nameLocal: '湖西線', color: '#00a7db', opened: 1974,
    description: 'Yamashina – Ōmi-Shiotsu along the west shore of Lake Biwa (trains start at Kyoto), clipped at the map box.',
    segments: [{ rel: 11809992, from: '山科', to: '近江舞子', year: 1974 }] }),
  J({ id: 'jr-kusatsu', code: 'C', codePrefix: 'JR-C', name: 'Kusatsu Line', nameLocal: '草津線', color: '#7cbf3f', opened: 1889,
    description: 'Kusatsu – Tsuge, clipped at the map box.',
    segments: [{ rel: 11203157, from: '貴生川', to: '草津', year: 1889 }] }),
  J({ id: 'jr-sakurai', code: 'U', codePrefix: 'JR-U', name: 'Man\'yō Mahoroba Line (Sakurai Line)', nameLocal: '万葉まほろば線（桜井線）', color: '#a6192e', opened: 1893,
    segments: [
      { rel: 11533186, from: '奈良', to: '桜井', year: 1899 },
      { rel: 11533186, from: '桜井', to: '高田', year: 1893 },
    ] }),
  J({ id: 'jr-wakayama', code: 'T', codePrefix: 'JR-T', name: 'Wakayama Line', nameLocal: '和歌山線', color: '#8a8f94', opened: 1891,
    description: 'Ōji – Wakayama, clipped at the map box.',
    segments: [
      { rel: WAKAYAMA_TRACK, stopNames: WAKAYAMA, from: '王寺', to: '高田', year: 1891 },
      { rel: WAKAYAMA_TRACK, stopNames: WAKAYAMA, from: '高田', to: '橋本', year: 1896, label: 'Takada – Gojō 1896, Hashimoto 1898; clipped at the map box' },
    ] }),
  J({ id: 'naniwasuji', name: 'Naniwasuji Line', nameLocal: 'なにわ筋線', color: '#7b3f98', status: 'construction', opened: 2031,
    sources: ['jrw-naniwasuji', 'osaka-pref-naniwasuji', 'tabiris-naniwasuji-2026'],
    description: 'New 7.2 km underground line built by Kansai Rapid Railway (third sector) and run by JR West and Nankai: Osaka (Umekita) – Nakanoshima – Nishi-Honmachi, then a JR branch to JR Namba and a Nankai branch to Shin-Imamiya via a new Nankai Shin-Namba station. Under construction since 2021; official opening spring 2031 (end of FY2030), kept at the 2026-08 cost review (¥642.5 bn). Intermediate station names are provisional and their positions approximate. No line colour yet (colour chosen for the map).',
    segments: [
      { status: 'construction', year: 2031, label: 'JR branch: Osaka – JR Namba (target spring 2031)',
        stops: [at('大阪', [135.4931, 34.7056]), est('中之島', 'Nakanoshima', [135.4876, 34.6919]), est('西本町', 'Nishi-Honmachi (provisional)', [135.4883, 34.6818]), at('JR難波', [135.4945, 34.6683])] },
      { status: 'construction', year: 2031, label: 'Nankai branch: Nishi-Honmachi – Nankai Shin-Namba – Shin-Imamiya (target spring 2031)',
        stops: [est('西本町', 'Nishi-Honmachi (provisional)', [135.4883, 34.6818]), est('南海新難波', 'Nankai Shin-Namba (provisional)', [135.4925, 34.6662]), at('新今宮', [135.5013, 34.6499])] },
    ] }),

  // ================= Shinkansen =================
  SH({ id: 'tokaido-shinkansen', name: 'Tōkaidō Shinkansen', nameLocal: '東海道新幹線', color: '#1e50a2', opened: 1964, sources: ['jrcentral'],
    description: 'JR Central, Tokyo – Shin-Osaka; only Kyoto – Shin-Osaka is inside the map box.',
    segments: [{ rel: 9802525, year: 1964 }] }),
  SH({ id: 'sanyo-shinkansen', name: 'San\'yō Shinkansen', nameLocal: '山陽新幹線', color: '#2b7bc4', opened: 1972, sources: ['jrwest'],
    description: 'JR West, Shin-Osaka – Hakata; Shin-Osaka – Nishi-Akashi inside the map box.',
    segments: [{ rel: 16792811, year: 1972 }] }),
  SH({ id: 'hokuriku-shinkansen', name: 'Hokuriku Shinkansen (Tsuruga – Shin-Osaka)', nameLocal: '北陸新幹線（敦賀・新大阪間）', color: '#8e6fb5', status: 'planned',
    sources: ['kumanichi-hokuriku-2026', 'trafficnews-hokuriku-2024'],
    description: 'Planned extension from Tsuruga via Obama and Kyoto to Shin-Osaka, almost all in tunnel. In the 1973 整備計画, route fixed 2016–17; on 2026-07-15 the ruling parties chose the "Katsuragawa plan": a deep underground Kyoto station near JR Katsuragawa, ~5 km southwest of Kyoto Station. Construction not approved, environmental assessment unfinished; no official year (about 26 years of works, press expects the 2050s). Station sites approximate; the line continues north of the map toward Obama.',
    segments: [{ status: 'planned', label: 'Kyoto (Katsuragawa) – Matsuiyamate – Shin-Osaka (planned; no official year)',
      stops: [at('桂川', [135.7104, 34.9645]), at('松井山手', [135.7275, 34.8331]), at('新大阪', [135.5002, 34.7334])] }] }),
  SH({ id: 'chuo-shinkansen', name: 'Chūō Shinkansen (Nagoya – Osaka)', nameLocal: 'リニア中央新幹線（名古屋・大阪間）', color: '#666699', status: 'planned',
    sources: ['osaka-pref-linear-2026', 'cas-linear'],
    description: 'SCMaglev, Nagoya – Nara area – Shin-Osaka. 整備計画 2011; environmental assessment started 2023-12, first assessment document not yet published (2026-07). The government\'s official aim is full opening "as early as 2037" (Cabinet policy 2025); JR Central has no Osaka date and Shinagawa – Nagoya itself is delayed past 2034, so the year is nominal. The Nara station site is undetermined (shown approximately) and the Osaka terminal position is not fixed.',
    segments: [{ status: 'planned', year: 2037, label: 'Nara area – Shin-Osaka (planned; government target "as early as 2037", nominal)',
      stops: [est('奈良市附近', 'Nara (site undetermined)', [135.79, 34.655]), at('新大阪', [135.5002, 34.7334])] }] }),

  // ================= Osaka Metro =================
  OM({ id: 'midosuji', code: 'M', name: 'Midōsuji Line', nameLocal: '御堂筋線', color: '#e5171f', opened: 1933,
    description: 'Osaka\'s first subway (Umeda – Shinsaibashi, 1933). Through-running north of Esaka onto Kita-Osaka Kyuko to Minoh-Kayano.',
    segments: [
      { rel: 8028808, from: 'なかもず', to: 'あびこ', year: 1987 },
      { rel: 8028808, from: 'あびこ', to: '西田辺', year: 1960 },
      { rel: 8028808, from: '西田辺', to: '昭和町', year: 1952 },
      { rel: 8028808, from: '昭和町', to: '天王寺', year: 1951 },
      { rel: 8028808, from: '天王寺', to: 'なんば', year: 1938 },
      { rel: 8028808, from: 'なんば', to: '心斎橋', year: 1935 },
      { rel: 8028808, from: '心斎橋', to: '梅田', year: 1933 },
      { rel: 8028808, from: '梅田', to: '新大阪', year: 1964 },
      { rel: 8028808, from: '新大阪', to: '江坂', year: 1970 },
    ] }),
  OM({ id: 'kita-osaka-kyuko', code: 'M', name: 'Kita-Osaka Kyuko (Namboku Line)', nameLocal: '北大阪急行電鉄南北線', color: '#d7003a', opened: 1970,
    sources: ['kitakyu', 'minoh-kitakyu'],
    description: 'Separate company, through-running with the Midōsuji Line. Senri-Chūō – Minoh-Kayano extension opened 2024-03-23.',
    segments: [
      { rel: 8028808, from: '江坂', to: '千里中央', year: 1970 },
      { rel: 8028808, from: '千里中央', to: '箕面萱野', year: 2024 },
    ] }),
  OM({ id: 'tanimachi', code: 'T', name: 'Tanimachi Line', nameLocal: '谷町線', color: '#522886', opened: 1967,
    segments: [
      { rel: 444907, from: '大日', to: '守口', year: 1983 },
      { rel: 444907, from: '守口', to: '都島', year: 1977 },
      { rel: 444907, from: '都島', to: '東梅田', year: 1974 },
      { rel: 444907, from: '東梅田', to: '谷町四丁目', year: 1967 },
      { rel: 444907, from: '谷町四丁目', to: '天王寺', year: 1968 },
      { rel: 444907, from: '天王寺', to: '八尾南', year: 1980 },
    ] }),
  OM({ id: 'yotsubashi', code: 'Y', name: 'Yotsubashi Line', nameLocal: '四つ橋線', color: '#0078ba', opened: 1942,
    segments: [
      { rel: 444899, from: '西梅田', to: '大国町', year: 1965 },
      { rel: 444899, from: '大国町', to: '花園町', year: 1942 },
      { rel: 444899, from: '花園町', to: '玉出', year: 1958, label: 'Hanazonochō – Tamade (1956–1958)' },
      { rel: 444899, from: '玉出', to: '住之江公園', year: 1972 },
    ] }),
  OM({ id: 'chuo', code: 'C', name: 'Chūō Line', nameLocal: '中央線', color: '#019a66', opened: 1961, sources: ['kenbiya-yumeshima'],
    description: 'Nagata – Yumeshima; through-running with the Kintetsu Keihanna Line. Cosmosquare – Yumeshima opened 2025-01-19 for Expo 2025.',
    segments: [
      { rel: 8028818, from: '長田', to: '深江橋', year: 1985 },
      { rel: 8028818, from: '深江橋', to: '森ノ宮', year: 1968 },
      { rel: 8028818, from: '森ノ宮', to: '本町', year: 1967 },
      { rel: 8028818, from: '本町', to: '弁天町', year: 1964 },
      { rel: 8028818, from: '弁天町', to: '大阪港', year: 1961 },
      { rel: 8028818, from: '大阪港', to: 'コスモスクエア', year: 1997 },
      { rel: 8028818, from: 'コスモスクエア', to: '夢洲', year: 2025 },
    ] }),
  OM({ id: 'sennichimae', code: 'S', name: 'Sennichimae Line', nameLocal: '千日前線', color: '#e44d93', opened: 1969,
    segments: [
      { rel: 444891, from: '野田阪神', to: '桜川', year: 1969 },
      { rel: 444891, from: '桜川', to: '谷町九丁目', year: 1970 },
      { rel: 444891, from: '谷町九丁目', to: '新深江', year: 1969 },
      { rel: 444891, from: '新深江', to: '南巽', year: 1981 },
    ] }),
  OM({ id: 'sakaisuji', code: 'K', name: 'Sakaisuji Line', nameLocal: '堺筋線', color: '#814721', opened: 1969,
    description: 'Tenjimbashisuji 6-chōme – Tengachaya; through-running with the Hankyu Senri and Kyoto lines.',
    segments: [
      { rel: 444905, from: '天神橋筋六丁目', to: '動物園前', year: 1969 },
      { rel: 444905, from: '動物園前', to: '天下茶屋', year: 1993 },
    ] }),
  OM({ id: 'nagahori-tsurumi-ryokuchi', code: 'N', name: 'Nagahori Tsurumi-ryokuchi Line', nameLocal: '長堀鶴見緑地線', color: '#a9cc51', textColor: '#000000', opened: 1990,
    segments: [
      { rel: 444878, from: '大正', to: '心斎橋', year: 1997 },
      { rel: 444878, from: '心斎橋', to: '京橋', year: 1996 },
      { rel: 444878, from: '京橋', to: '鶴見緑地', year: 1990 },
      { rel: 444878, from: '鶴見緑地', to: '門真南', year: 1997 },
    ] }),
  OM({ id: 'imazatosuji', code: 'I', name: 'Imazatosuji Line', nameLocal: '今里筋線', color: '#ee7b1a', opened: 2006,
    sources: ['osaka-city-toshin8', 'osaka-city-imazato-brt'],
    description: 'Itakano – Imazato (2006). The southern extension to Yuzato-rokuchōme (6.7 km) is listed in the Kinki Regional Transport Council report No. 8 (2004) but has no business plan; Osaka City has run the "Imazato Liner" BRT trial on the corridor since 2019 (extended again from 2026-04).',
    segments: [
      { rel: 444889, from: '井高野', to: '今里', year: 2006 },
      { status: 'planned', label: 'Imazato – Yuzato-rokuchōme extension (答申第8号 2004; BRT trial instead; no year; intermediate stations not published)',
        stops: [at('今里', [135.5364, 34.6659]), est('湯里六丁目', 'Yuzato-rokuchōme', [135.538, 34.6106])] },
    ] }),
  OM({ id: 'new-tram', code: 'P', name: 'Nankō Port Town Line (New Tram)', nameLocal: '南港ポートタウン線（ニュートラム）', color: '#00b2e5', mode: 'agt', opened: 1981,
    segments: [
      { rel: 444913, from: 'コスモスクエア', to: '中ふ頭', year: 1997 },
      { rel: 444913, from: '中ふ頭', to: '住之江公園', year: 1981 },
    ] }),

  // ================= Kyoto Municipal Subway =================
  KY({ id: 'karasuma', code: 'K', name: 'Karasuma Line', nameLocal: '烏丸線', color: '#3eb34f', opened: 1981,
    description: 'Kokusaikaikan – Takeda; through-running with the Kintetsu Kyoto Line.',
    segments: [
      { rel: 8030560, from: '竹田', to: '京都', year: 1988 },
      { rel: 8030560, from: '京都', to: '北大路', year: 1981 },
      { rel: 8030560, from: '北大路', to: '北山', year: 1990 },
      { rel: 8030560, from: '北山', to: '国際会館', year: 1997 },
    ] }),
  KY({ id: 'kyoto-tozai', code: 'T', name: 'Tōzai Line', nameLocal: '東西線', color: '#e95413', opened: 1997, sources: ['kyoto-city-tozai-ext'],
    description: 'Rokujizō – Uzumasa-Tenjingawa; Keihan Keishin Line trains run in from Misasagi. The western extension to Rakusai New Town (7.7 km) is in council report No. 8 (2004) and was a city "planned line" in 2006–07, frozen since for financial reasons.',
    segments: [
      { rel: 536803, from: '六地蔵', to: '醍醐', year: 2004 },
      { rel: 536803, from: '醍醐', to: '二条', year: 1997 },
      { rel: 536803, from: '二条', to: '太秦天神川', year: 2008 },
      { status: 'planned', label: 'Uzumasa-Tenjingawa – Rakusai extension (答申第8号 2004; frozen; no year; intermediate stations not shown)',
        stops: [at('太秦天神川', [135.7176, 35.0155]), est('洛西', 'Rakusai (New Town)', [135.6622, 34.9642])] },
    ] }),

  // ================= Kobe Municipal Subway =================
  KO({ id: 'seishin-yamate', code: 'S', name: 'Seishin-Yamate Line', nameLocal: '西神・山手線', color: '#009944', opened: 1977,
    description: 'Seishin-chūō – Shin-Kōbe, through-running north onto the Hokushin Line (ex-Hokushin Kyuko, municipal since 2020-06-01) to Tanigami.',
    segments: [
      { rel: 7720717, from: '谷上', to: '新神戸', year: 1988, label: 'Hokushin Line (Hokushin Kyuko 1988; Kobe City since 2020-06-01)' },
      { rel: 7720717, from: '新神戸', to: '大倉山', year: 1985 },
      { rel: 7720717, from: '大倉山', to: '新長田', year: 1983 },
      { rel: 7720717, from: '新長田', to: '名谷', year: 1977 },
      { rel: 7720717, from: '名谷', to: '学園都市', year: 1985 },
      { rel: 7720717, from: '学園都市', to: '西神中央', year: 1987 },
    ] }),
  KO({ id: 'kaigan', code: 'K', name: 'Kaigan Line', nameLocal: '海岸線', color: '#0099d9', opened: 2001,
    segments: [{ rel: 7712959, year: 2001 }] }),

  // ================= Hankyu =================
  HK({ id: 'hankyu-kobe', code: 'HK', name: 'Hankyu Kobe Line', nameLocal: '阪急神戸線', color: '#0068b7', opened: 1920,
    description: 'Osaka-umeda – Kobe-sannomiya, continuing over the Kobe Kōsoku Line to Shinkaichi.',
    segments: [
      { rel: 11966252, from: '大阪梅田', to: '王子公園', year: 1920 },
      { rel: 11966252, from: '王子公園', to: '神戸三宮', year: 1936 },
      { rel: 11981765, from: '神戸三宮', to: '新開地', year: 1968, label: 'Kobe Kōsoku Line' },
    ] }),
  HK({ id: 'hankyu-takarazuka', code: 'HK', name: 'Hankyu Takarazuka Line', nameLocal: '阪急宝塚線', color: '#e60033', opened: 1910,
    segments: [{ rel: 11982563, from: '大阪梅田', to: '宝塚', year: 1910 }] }),
  HK({ id: 'hankyu-kyoto', code: 'HK', name: 'Hankyu Kyoto Line', nameLocal: '阪急京都線', color: '#00915a', opened: 1921,
    segments: [
      { rel: 10255877, from: '大阪梅田', to: '十三', year: 1959, label: 'Osaka-umeda – Jūsō (own tracks since 1959)' },
      { rel: 10255877, from: '十三', to: '淡路', year: 1921 },
      { rel: 10255877, from: '淡路', to: '大宮', year: 1928, label: 'Awaji – Ōmiya (Shin-Keihan, 1928–1931)' },
      { rel: 10255877, from: '大宮', to: '京都河原町', year: 1963 },
    ] }),
  HK({ id: 'hankyu-senri', code: 'HK', name: 'Hankyu Senri Line', nameLocal: '阪急千里線', color: '#00915a', opened: 1921,
    segments: [
      { rel: 11824439, from: '天神橋筋六丁目', to: '千里山', year: 1921 },
      { rel: 11824439, from: '千里山', to: '北千里', year: 1963, label: 'Senriyama – Kita-Senri (1963–1967)' },
    ] }),
  HK({ id: 'hankyu-imazu', code: 'HK', name: 'Hankyu Imazu Line', nameLocal: '阪急今津線', color: '#0068b7', opened: 1921,
    segments: [
      { rel: 11982170, year: 1921, label: 'Takarazuka – Nishinomiya-kitaguchi' },
      { rel: 11982163, year: 1926, label: 'Nishinomiya-kitaguchi – Imazu' },
    ] }),
  HK({ id: 'hankyu-itami', code: 'HK', name: 'Hankyu Itami Line', nameLocal: '阪急伊丹線', color: '#0068b7', opened: 1920,
    segments: [{ rel: 6024245, year: 1920 }] }),
  HK({ id: 'hankyu-koyo', code: 'HK', name: 'Hankyu Kōyō Line', nameLocal: '阪急甲陽線', color: '#0068b7', opened: 1924,
    segments: [{ rel: 11984991, year: 1924 }] }),
  HK({ id: 'hankyu-minoo', code: 'HK', name: 'Hankyu Minoo Line', nameLocal: '阪急箕面線', color: '#e60033', opened: 1910,
    segments: [{ rel: 11985115, year: 1910 }] }),
  HK({ id: 'hankyu-arashiyama', code: 'HK', name: 'Hankyu Arashiyama Line', nameLocal: '阪急嵐山線', color: '#00915a', opened: 1928,
    segments: [{ rel: 11985598, year: 1928 }] }),
  HK({ id: 'hankyu-osaka-links', name: 'Hankyu Naniwasuji / Shin-Osaka links', nameLocal: '阪急なにわ筋連絡線・新大阪連絡線', color: '#8c2a2a', status: 'planned',
    sources: ['tabiris-hankyu-2026', 'trafficnews-hankyu-2018'],
    description: 'Underground standard-gauge links planned by Hankyu: Osaka (Umekita, Naniwasuji Line) – Jūsō – Shin-Osaka, for through running to Kansai Airport. In council report No. 8 (2004) and the 2017 five-party agreement; MLIT\'s 2018 study rated them viable. No permit application or environmental assessment; Hankyu said in 2026-05 that nothing can proceed until the Hokuriku Shinkansen\'s Shin-Osaka station is fixed. No official year. (Hankyu still holds a dormant 1961 licence for an older elevated Jūsō – Shin-Osaka scheme.)',
    segments: [
      { status: 'planned', label: 'Naniwasuji link: Osaka (Umekita) – Jūsō (~2.5 km; no year)', stops: [at('大阪', [135.4931, 34.7056]), at('十三', [135.483, 34.72])] },
      { status: 'planned', label: 'Shin-Osaka link: Jūsō – Shin-Osaka (~2.3 km; no year)', stops: [at('十三', [135.483, 34.72]), at('新大阪', [135.498, 34.7335])] },
    ] }),
  HK({ id: 'hankyu-osaka-airport', name: 'Hankyu Osaka Airport Line', nameLocal: '阪急大阪空港線', color: '#b0556a', status: 'planned',
    sources: ['trafficnews-hankyu-airport', 'trafficnews-hankyu-2018'],
    description: 'Concept for a ~3–4 km underground branch from Sone (Takarazuka Line) to Osaka (Itami) Airport. Listed among medium/long-term lines in council report No. 8 (2004); MLIT\'s 2018 study judged it unprofitable and nothing has moved since (dormant). No year.',
    segments: [{ status: 'planned', label: 'Sone – Osaka Airport (答申第8号; dormant; no year)', stops: [at('曽根', [135.473, 34.766]), at('大阪空港', [135.4417, 34.7956])] }] }),

  // ================= Hanshin =================
  HS({ id: 'hanshin-main', code: 'HS', name: 'Hanshin Main Line', nameLocal: '阪神本線', color: '#0f64b4', opened: 1905,
    description: 'Osaka-umeda – Motomachi, continuing over the Kobe Kōsoku Line to Nishidai (through-running onto the Sanyo Main Line).',
    segments: [
      { rel: 11658109, from: '大阪梅田', to: '三宮', year: 1905 },
      { rel: 11658109, from: '三宮', to: '元町', year: 1936 },
      { rel: 11974981, from: '元町', to: '西代', year: 1968, label: 'Kobe Kōsoku Line' },
    ] }),
  HS({ id: 'hanshin-namba', code: 'HS', name: 'Hanshin Namba Line', nameLocal: '阪神なんば線', color: '#f08300', opened: 1924,
    segments: [
      { rel: 11923501, from: '大阪難波', to: '西九条', year: 2009 },
      { rel: 11923501, from: '西九条', to: '尼崎', year: 1964, label: 'Ex-Nishi-Osaka Line (Amagasaki – Dempō 1924, Nishikujō 1964)' },
    ] }),
  HS({ id: 'hanshin-mukogawa', code: 'HS', name: 'Hanshin Mukogawa Line', nameLocal: '阪神武庫川線', color: '#2fa84f', opened: 1943,
    segments: [{ rel: 11970484, year: 1943 }] }),

  // ================= Keihan =================
  KH({ id: 'keihan-main', code: 'KH', codePrefix: 'KH', name: 'Keihan Main Line', nameLocal: '京阪本線・鴨東線', color: '#1c6c3b', opened: 1910,
    description: 'Yodoyabashi – Sanjō (Main Line) – Demachiyanagi (Ōtō Line, 1989).',
    segments: [
      { rel: KEIHAN_TRACK, stopNames: KEIHAN_MAIN, from: '淀屋橋', to: '天満橋', year: 1963 },
      { rel: KEIHAN_TRACK, stopNames: KEIHAN_MAIN, from: '天満橋', to: '三条', year: 1910, label: 'Temmabashi – Gojō (1910), Sanjō (1915)' },
      { rel: KEIHAN_TRACK, stopNames: KEIHAN_MAIN, from: '三条', to: '出町柳', year: 1989, label: 'Ōtō Line' },
    ] }),
  KH({ id: 'keihan-nakanoshima', code: 'KH', codePrefix: 'KH', name: 'Keihan Nakanoshima Line', nameLocal: '京阪中之島線', color: '#1c6c3b', opened: 2008,
    sources: ['osaka-pref-yumeshima-2025', 'impress-yumeshima-2025', 'kyodo-keihan-2026'],
    description: 'Nakanoshima – Temmabashi (2008). Westward extension to Kujō (~2.1 km, toward Yumeshima): proposed. Osaka\'s 2025-08 study rated it the best option together with the JR Yumesaki Line extension; Keihan\'s 2026-05 plan still lists it as under study (construction from 2030 at the earliest). No official year.',
    segments: [
      { rel: 11981534, from: '中之島', to: '天満橋', year: 2008 },
      { status: 'proposed', label: 'Nakanoshima – Kujō extension (~2.1 km; under study, no year)', stops: [at('中之島', [135.4846, 34.6907]), at('九条', [135.4738, 34.6756])] },
    ] }),
  KH({ id: 'keihan-uji', code: 'KH', codePrefix: 'KH', name: 'Keihan Uji Line', nameLocal: '京阪宇治線', color: '#1c6c3b', opened: 1913,
    segments: [{ rel: 11102876, year: 1913 }] }),
  KH({ id: 'keihan-katano', code: 'KH', codePrefix: 'KH', name: 'Keihan Katano Line', nameLocal: '京阪交野線', color: '#1c6c3b', opened: 1929,
    segments: [{ rel: 11981442, year: 1929 }] }),
  KH({ id: 'keihan-keishin', code: 'OT', codePrefix: 'OT', name: 'Keihan Keishin Line', nameLocal: '京阪京津線', color: '#3fae49', mode: 'lrt', opened: 1912,
    description: 'Misasagi – Biwako-hamaōtsu (partly street-running); trains continue over the Kyoto Tōzai Line to Uzumasa-Tenjingawa.',
    segments: [{ rel: 10238009, from: '御陵', to: 'びわ湖浜大津', year: 1912 }] }),
  KH({ id: 'keihan-ishiyama-sakamoto', code: 'OT', codePrefix: 'OT', name: 'Keihan Ishiyama-Sakamoto Line', nameLocal: '京阪石山坂本線', color: '#e8749c', mode: 'lrt', opened: 1913,
    segments: [{ rel: 9495945, year: 1927, label: 'Ishiyamadera – Sakamoto-hieizanguchi (1913–1927)' }] }),

  // ================= Kintetsu =================
  KT({ id: 'kintetsu-nara', code: 'A', codePrefix: 'A', name: 'Kintetsu Nara Line', nameLocal: '近鉄奈良線', color: '#d52031', opened: 1914,
    description: 'Osaka-Namba – Ōsaka-Uehommachi (Namba Line, 1970) – Fuse (Ōsaka Line tracks) – Kintetsu-Nara (1914). Through-running with the Hanshin Namba Line.',
    segments: [
      { rel: 11955751, from: '大阪難波', to: '大阪上本町', year: 1970, label: 'Namba Line' },
      { rel: 11962196, from: '大阪上本町', to: '布施', year: 1914 },
      { rel: 11958106, from: '布施', to: '近鉄奈良', year: 1914 },
    ] }),
  KT({ id: 'kintetsu-osaka', code: 'D', codePrefix: 'D', name: 'Kintetsu Ōsaka Line', nameLocal: '近鉄大阪線', color: '#e67e22', opened: 1914,
    description: 'Ōsaka-Uehommachi – Ise-Nakagawa, clipped at the map box.',
    segments: [
      { rel: 11962196, from: '大阪上本町', to: '布施', year: 1914 },
      { rel: 11962196, from: '布施', to: '大和八木', year: 1925, label: 'Fuse – Yamato-Yagi (1924–1925)' },
      { rel: 11962196, from: '大和八木', to: '青山町', year: 1930, label: 'Yamato-Yagi – Nabari (1929–1930), clipped at the map box' },
    ] }),
  KT({ id: 'kintetsu-kyoto', code: 'B', codePrefix: 'B', name: 'Kintetsu Kyoto Line', nameLocal: '近鉄京都線', color: '#00a0af', opened: 1928,
    description: 'Kyoto – Yamato-Saidaiji (Nara Electric Railway 1928); through-running with the Karasuma Line.',
    segments: [{ rel: 11958414, year: 1928 }] }),
  KT({ id: 'kintetsu-kashihara', code: 'B', codePrefix: 'B', name: 'Kintetsu Kashihara Line', nameLocal: '近鉄橿原線', color: '#00a0af', opened: 1921,
    segments: [{ rel: 11959219, year: 1923, label: 'Yamato-Saidaiji – Kashiharajingū-mae (1921–1923)' }] }),
  KT({ id: 'kintetsu-tenri', code: 'H', codePrefix: 'H', name: 'Kintetsu Tenri Line', nameLocal: '近鉄天理線', color: '#00a0af', opened: 1915,
    segments: [{ rel: 11965678, year: 1915 }] }),
  KT({ id: 'kintetsu-ikoma', code: 'G', codePrefix: 'G', name: 'Kintetsu Ikoma Line', nameLocal: '近鉄生駒線', color: '#d52031', opened: 1922,
    segments: [{ rel: 11962099, year: 1927, label: 'Ikoma – Ōji (1922–1927)' }] }),
  KT({ id: 'kintetsu-tawaramoto', code: 'I', codePrefix: 'I', name: 'Kintetsu Tawaramoto Line', nameLocal: '近鉄田原本線', color: '#d52031', opened: 1918,
    segments: [{ rel: 11965804, year: 1918 }] }),
  KT({ id: 'kintetsu-shigi', code: 'J', codePrefix: 'J', name: 'Kintetsu Shigi Line', nameLocal: '近鉄信貴線', color: '#e67e22', opened: 1930,
    segments: [{ rel: 11955065, year: 1930 }] }),
  KT({ id: 'kintetsu-keihanna', code: 'C', codePrefix: 'C', name: 'Kintetsu Keihanna Line', nameLocal: '近鉄けいはんな線', color: '#2b9a6b', mode: 'metro', opened: 1986,
    sources: ['tabiris-keihanna'],
    description: 'Nagata – Gakken-Nara-Tomigaoka, third-rail, through-running with the Osaka Metro Chūō Line to Yumeshima. Extension to Takanohara (3.8 km; alternative to Shin-Hōsono) is in council report No. 8 (2004) but frozen.',
    segments: [
      { rel: 1864803, from: '長田', to: '生駒', year: 1986 },
      { rel: 1864803, from: '生駒', to: '学研奈良登美ヶ丘', year: 2006 },
      { status: 'planned', label: 'Gakken-Nara-Tomigaoka – Takanohara extension (答申第8号 2004; frozen; no year)', stops: [at('学研奈良登美ヶ丘', [135.754, 34.726]), at('高の原', [135.793, 34.728])] },
    ] }),
  KT({ id: 'kintetsu-minami-osaka', code: 'F', codePrefix: 'F', name: 'Kintetsu Minami-Ōsaka Line', nameLocal: '近鉄南大阪線', color: '#8a5a2b', opened: 1898,
    segments: [
      { rel: 11942103, from: '大阪阿部野橋', to: '古市', year: 1923, label: 'Ōsaka-Abenobashi – Furuichi (Dōmyōji – Furuichi 1898; Abenobashi 1923)' },
      { rel: 11942103, from: '古市', to: '橿原神宮前', year: 1929 },
    ] }),
  KT({ id: 'kintetsu-nagano', code: 'O', codePrefix: 'O', name: 'Kintetsu Nagano Line', nameLocal: '近鉄長野線', color: '#8a5a2b', opened: 1898,
    segments: [{ rel: 11944238, year: 1898 }] }),
  KT({ id: 'kintetsu-domyoji', code: 'N', codePrefix: 'N', name: 'Kintetsu Dōmyōji Line', nameLocal: '近鉄道明寺線', color: '#8a5a2b', opened: 1898,
    segments: [{ rel: 11942338, year: 1898 }] }),
  KT({ id: 'kintetsu-gose', code: 'P', codePrefix: 'P', name: 'Kintetsu Gose Line', nameLocal: '近鉄御所線', color: '#8a5a2b', opened: 1930,
    segments: [{ rel: 11949787, year: 1930 }] }),

  // ================= Nankai =================
  NK({ id: 'nankai-main', code: 'NK', name: 'Nankai Main Line', nameLocal: '南海本線', color: '#f08300', opened: 1885,
    description: 'Namba – Wakayamashi (Hankai Railway 1885), clipped at the map box.',
    segments: [{ rel: 11930463, from: 'なんば', to: '和歌山市', year: 1885 }] }),
  NK({ id: 'nankai-airport', code: 'NK', name: 'Nankai Airport Line', nameLocal: '南海空港線', color: '#4a2c87', opened: 1994,
    segments: [{ rel: 9583743, from: '泉佐野', to: '関西空港', year: 1994 }] }),
  NK({ id: 'nankai-koya', code: 'NK', name: 'Nankai Kōya Line', nameLocal: '南海高野線', color: '#009a44', opened: 1898,
    description: 'Trains start at Namba over the Main Line; the Kōya Line proper starts at Shiomibashi/Kishinosato-Tamade. Clipped at the map box.',
    segments: [{ rel: 11940316, year: 1898, label: 'Kōya Railway (Sakai-higashi – Nagano 1898); Namba trains via the Main Line' }] }),
  NK({ id: 'nankai-shiomibashi', code: 'NK', name: 'Nankai Shiomibashi Line', nameLocal: '南海汐見橋線', color: '#009a44', opened: 1900,
    segments: [{ rel: 11999471, year: 1900 }] }),
  NK({ id: 'nankai-takashinohama', code: 'NK', name: 'Nankai Takashinohama Line', nameLocal: '南海高師浜線', color: '#f08300', opened: 1918,
    segments: [{ rel: 11984576, year: 1918 }] }),
  NK({ id: 'nankai-tanagawa', code: 'NK', name: 'Nankai Tanagawa Line', nameLocal: '南海多奈川線', color: '#f08300', opened: 1944,
    segments: [{ rel: 11984568, year: 1944 }] }),
  NK({ id: 'nankai-semboku', code: 'SB', codePrefix: 'SB', name: 'Semboku Line', nameLocal: '泉北線', color: '#1b6fb5', opened: 1971,
    description: 'Nakamozu – Izumi-Chūō (Semboku Rapid Railway 1971–1995; merged into Nankai 2025-04-01).',
    segments: [{ rel: 9583674, year: 1971, label: 'Nakamozu – Izumi-Chūō (1971–1995)' }] }),

  // ================= Sanyo, Shintetsu, Nose =================
  HY({ id: 'sanyo-main', code: 'SY', codePrefix: 'SY', name: 'Sanyo Main Line', nameLocal: '山陽電鉄本線', color: '#d7282f', opened: 1910, sources: ['sanyo'],
    description: 'Nishidai – Sanyo-Himeji (Hyōgo – Suma 1910), clipped at the map box.',
    segments: [{ rel: 11970931, from: '西代', to: '高砂', year: 1910 }] }),
  HY({ id: 'shintetsu-arima', code: 'KB', codePrefix: 'KB', name: 'Shintetsu Arima Line', nameLocal: '神戸電鉄有馬線', color: '#f08200', opened: 1928, sources: ['shintetsu'],
    segments: [
      { rel: 9407547, from: '新開地', to: '湊川', year: 1968, label: 'Kobe Kōsoku Line' },
      { rel: 9407547, from: '湊川', to: '有馬温泉', year: 1928 },
    ] }),
  HY({ id: 'shintetsu-sanda', code: 'KB', codePrefix: 'KB', name: 'Shintetsu Sanda Line', nameLocal: '神戸電鉄三田線', color: '#f08200', opened: 1928, sources: ['shintetsu'],
    segments: [{ rel: 11978786, year: 1928 }] }),
  HY({ id: 'shintetsu-ao', code: 'KB', codePrefix: 'KB', name: 'Shintetsu Ao Line', nameLocal: '神戸電鉄粟生線', color: '#f08200', opened: 1936, sources: ['shintetsu'],
    segments: [{ rel: 11984389, from: '鈴蘭台', to: '粟生', year: 1936, label: 'Suzurandai – Ao (1936–1952)' }] }),
  HY({ id: 'shintetsu-koen-toshi', code: 'KB', codePrefix: 'KB', name: 'Shintetsu Kōen-toshi Line', nameLocal: '神戸電鉄公園都市線', color: '#f08200', opened: 1991, sources: ['shintetsu'],
    segments: [{ rel: 9407558, from: '横山', to: 'ウッディタウン中央', year: 1991, label: 'Yokoyama – Woody Town-chūō (1991–1996)' }] }),
  HY({ id: 'nose-myoken', code: 'NS', codePrefix: 'NS', name: 'Nose Electric Myōken Line', nameLocal: '能勢電鉄妙見線', color: '#7f1734', opened: 1913, sources: ['nosedenkitetsudo'],
    segments: [{ rel: 11981613, year: 1913 }] }),
  HY({ id: 'nose-nissei', code: 'NS', codePrefix: 'NS', name: 'Nose Electric Nissei Line', nameLocal: '能勢電鉄日生線', color: '#7f1734', opened: 1978, sources: ['nosedenkitetsudo'],
    segments: [{ rel: 11981650, year: 1978 }] }),

  // ================= Trams & local lines =================
  TL({ id: 'randen-arashiyama', code: 'A', codePrefix: 'A', name: 'Randen Arashiyama Line', nameLocal: '嵐電嵐山本線', color: '#8b1a2b', opened: 1910, sources: ['keifuku'],
    segments: [{ rel: 17580263, year: 1910 }] }),
  TL({ id: 'randen-kitano', code: 'B', codePrefix: 'B', name: 'Randen Kitano Line', nameLocal: '嵐電北野線', color: '#8b1a2b', opened: 1925, sources: ['keifuku'],
    segments: [{ rel: 11727428, year: 1925 }] }),
  TL({ id: 'eizan-main', code: 'E', codePrefix: 'E', name: 'Eizan Main Line', nameLocal: '叡山電鉄叡山本線', color: '#c9171e', mode: 'lrt', opened: 1925, sources: ['eizan'],
    segments: [{ rel: 11961440, year: 1925 }] }),
  TL({ id: 'eizan-kurama', code: 'E', codePrefix: 'E', name: 'Eizan Kurama Line', nameLocal: '叡山電鉄鞍馬線', color: '#c9171e', mode: 'lrt', opened: 1928, sources: ['eizan'],
    segments: [{ rel: 11594590, year: 1928 }] }),
  TL({ id: 'hankai-line', code: 'HN', codePrefix: 'HN', name: 'Hankai Tramway Hankai Line', nameLocal: '阪堺電気軌道阪堺線', color: '#2a7a3b', opened: 1911, sources: ['hankai'],
    segments: [{ rel: 6028430, year: 1911 }] }),
  TL({ id: 'hankai-uemachi', code: 'HN', codePrefix: 'HN', name: 'Hankai Tramway Uemachi Line', nameLocal: '阪堺電気軌道上町線', color: '#2a7a3b', opened: 1900, sources: ['hankai'],
    segments: [{ rel: 3969572, year: 1900 }] }),
  TL({ id: 'mizuma', name: 'Mizuma Railway', nameLocal: '水間鉄道水間線', color: '#3a75c4', mode: 'commuter', opened: 1925, sources: ['mizuma'],
    segments: [{ rel: 10996103, year: 1925 }] }),

  // ================= Monorail & AGT =================
  MA({ id: 'osaka-monorail', name: 'Osaka Monorail Main Line', nameLocal: '大阪モノレール本線', color: '#004ea2', opened: 1990,
    sources: ['osaka-monorail', 'osaka-pref-monorail-2025', 'osaka-pref-monorail-2024', 'trafficnews-monorail-2023'],
    description: 'Osaka Airport – Kadoma-shi (1990–1997). Southern extension Kadoma-shi – Uryūdō (~8.9 km, 5 new stations, provisional names): under construction since 2020, opening moved from 2029 to FY2033 (soft ground at Uryūdō). New station positions approximate.',
    segments: [
      { rel: 6011645, from: '門真市', to: '南茨木', year: 1997 },
      { rel: 6011645, from: '南茨木', to: '千里中央', year: 1990 },
      { rel: 6011645, from: '千里中央', to: '柴原阪大前', year: 1994 },
      { rel: 6011645, from: '柴原阪大前', to: '大阪空港', year: 1997 },
      { status: 'construction', year: 2033, label: 'Kadoma-shi – Uryūdō extension (under construction; target FY2033)',
        stops: [at('門真市', [135.5833, 34.7382]), est('松生町', 'Matsuochō (provisional)', [135.587, 34.732]), at('門真南', [135.5925, 34.7169]), at('鴻池新田', [135.5975, 34.6987]), at('荒本', [135.6049, 34.6786]), est('瓜生堂', 'Uryūdō (provisional)', [135.601, 34.6595])] },
    ] }),
  MA({ id: 'osaka-monorail-saito', name: 'Osaka Monorail Saito Line', nameLocal: '大阪モノレール彩都線', color: '#3d7cc9', opened: 1998, sources: ['osaka-monorail'],
    segments: [
      { rel: 7709848, from: '万博記念公園', to: '阪大病院前', year: 1998 },
      { rel: 7709848, from: '阪大病院前', to: '彩都西', year: 2007 },
    ] }),
  MA({ id: 'port-liner', code: 'P', codePrefix: 'P', name: 'Port Liner', nameLocal: 'ポートライナー', color: '#00a0e9', mode: 'agt', opened: 1981, sources: ['knt'],
    segments: [
      { rel: 2431076, year: 1981, label: 'Sannomiya – Port Island loop' },
      { rel: 6031863, from: '市民広場', to: '神戸空港', year: 2006, label: 'Kobe Airport branch' },
    ] }),
  MA({ id: 'rokko-liner', code: 'R', codePrefix: 'R', name: 'Rokkō Liner', nameLocal: '六甲ライナー', color: '#00a54f', mode: 'agt', opened: 1990, sources: ['knt'],
    segments: [{ rel: 6015207, year: 1990 }] }),
];

export const CITY = {
  id: 'kansai',
  name: 'Osaka · Kyoto',
  nameLocal: '大阪・京都',
  center: [135.5, 34.7],
  zoom: 10,
  updated: '2026-11-14',
  timeline: { min: 1874, max: 2040 },
  notes:
    "Geometry and station positions © OpenStreetMap contributors, ODbL (route relations fetched via Overpass, simplified ~18 m), clipped to lng 134.9-136.1 / lat 34.3-35.15 (Akashi to Ōmi-Hachiman, Kansai Airport to Kurama; lines are truncated at that box). All lines are curated in scripts/kansai/lines.mjs (one all-stations OSM relation per line). Interchanges are merged when stations share a Japanese name within ~450 m, ignoring operator prefixes (山陽明石 = 明石, 京阪山科 = 山科); Osaka/Umeda (JR Osaka, Hankyu/Hanshin Osaka-umeda, Midōsuji Umeda), Namba (Nankai and Osaka Metro Namba, Kintetsu/Hanshin Osaka-Namba), Tennōji (with Kintetsu Ōsaka-Abenobashi and Hankai Tennōji-ekimae) and Sannomiya are one station each. Differently named transfer stations stay separate (Higashi-Umeda, Nishi-Umeda, Kitashinchi; JR Namba; Sannomiya-Hanadokeimae; Karasuma / Shijō; Kawaramachi / Gion-shijō). Segment years are first-opening years of each section, rounded; line colours are official where known, otherwise approximate (JR West, Hankyu, Hanshin, Keihan, Kintetsu, Nankai and the smaller operators). Station codes come from OSM refs (about a third of stations have none). Projects: Naniwasuji Line (construction, spring 2031), Osaka Monorail Kadoma-shi – Uryūdō (construction, FY2033), Hokuriku Shinkansen Kyoto (Katsuragawa) – Shin-Osaka (planned, no year) and Chūō Shinkansen Nara – Shin-Osaka (planned, nominal 2037); Hankyu Naniwasuji / Shin-Osaka links, Hankyu Osaka Airport Line, Imazatosuji, Kyoto Tōzai and Keihanna extensions (planned: listed in council report No. 8 of 2004, mostly dormant); JR Yumesaki Line to Yumeshima and Keihan Nakanoshima – Kujō (proposed). Their new stations are approximate (approx) and names provisional. OSM caveat (Nov 2026): several Keihan, JR and Kintetsu route relations were deleted from live OSM; they come from an older mirror snapshot or are rebuilt from track relations (see research/kansai.md). Not included: Kintetsu Yoshino Line, JR Kansai Main Line east of Kamo, Sagano Scenic Railway, cable cars and ropeways, limited-express-only services.",
};
