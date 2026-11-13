// Curated metadata for the Tokyo dataset. This is the ONLY hand-curated input:
// everything geometric (track paths, station positions, stop order) comes from
// OpenStreetMap route relations fetched by build.mjs, except the upcoming projects
// at the bottom, whose stations are not (yet) in OSM and carry approximate coords.
//
// Segment spec (OSM-backed):
//   rel      OSM route relation id (one direction)
//   from/to  optional Japanese station names to cut a sub-range of the relation's stops
//   reverse  reverse the relation's stop order and geometry
//   sort     relation members are scrambled: chain the ways geometrically starting
//            near `from` and order stops along that chain
//   year     opening year (actual for operating, target otherwise)
//   status   default 'operating'
//   codePrefix / codeMod  station-number prefix (default line.code) and loop modulus
// Segment spec (curated): { stops: [{ name, nameEn, coord, approx, id? }], path?, ... }

export const BBOX = { minLng: 139.0, minLat: 35.2, maxLng: 140.4, maxLat: 36.2 };

export const GROUPS = [
  { id: 'jr', name: 'JR', nameLocal: 'JR', color: '#008000', description: 'Japan Railways group lines (JR East conventional lines and Shinkansen).' },
  { id: 'jr-east', name: 'JR East', nameLocal: 'JR東日本', parent: 'jr', color: '#008000', description: 'JR East conventional (commuter / regional) lines and services in Greater Tokyo.' },
  { id: 'jr-shinkansen', name: 'Shinkansen', nameLocal: '新幹線', parent: 'jr', color: '#1e50a2', description: 'High-speed lines (JR East, JR Central), clipped to Greater Tokyo.' },
  { id: 'subway', name: 'Subway', nameLocal: '地下鉄', color: '#00a7db', description: 'Tokyo subway: Tokyo Metro and Toei Subway.' },
  { id: 'tokyo-metro', name: 'Tokyo Metro', nameLocal: '東京メトロ', parent: 'subway', color: '#00a7db', description: 'Tokyo Metro Co., Ltd. (9 lines).' },
  { id: 'toei', name: 'Toei Subway', nameLocal: '都営地下鉄', parent: 'subway', color: '#197a3e', description: 'Tokyo Metropolitan Bureau of Transportation (4 lines).' },
  { id: 'subway-planned', name: 'New subway projects', nameLocal: '新線計画', parent: 'subway', color: '#888888', description: 'New subway lines with no operator line yet (Tokyo Rinkai Subway).' },
];

export const SOURCES = [
  { id: 'osm', title: 'OpenStreetMap contributors (route relations, stations), ODbL', url: 'https://www.openstreetmap.org/copyright' },
  { id: 'tokyometro', title: 'Tokyo Metro - Subway map and line information', url: 'https://www.tokyometro.jp/en/subwaymap/index.html' },
  { id: 'toei', title: 'Toei Subway (Tokyo Metropolitan Bureau of Transportation)', url: 'https://www.kotsu.metro.tokyo.jp/eng/services/subway.html' },
  { id: 'jreast', title: 'JR East - Tokyo area route map', url: 'https://www.jreast.co.jp/e/routemaps/' },
  { id: 'jrcentral', title: 'JR Central - Tokaido Shinkansen', url: 'https://global.jr-central.co.jp/en/' },
  { id: 'tm-ext-2024', title: 'Tokyo Metro news release: start of construction of the Yurakucho and Namboku line extensions (2024-11-05)', url: 'https://www.tokyometro.jp/news/images_h/metroNews241105_73.pdf' },
  { id: 'impress-ext-2024', title: 'Impress Watch: 有楽町線延伸と南北線延伸 工事着手 30年代開業へ', url: 'https://www.watch.impress.co.jp/docs/news/1636837.html' },
  { id: 'tmg-yurakucho', title: 'Tokyo Metropolitan Government: Yurakucho Line extension (Toyosu-Sumiyoshi) document, 2022', url: 'https://www.spt.metro.tokyo.lg.jp/tosei/hodohappyo/press/2022/12/26/documents/05_02.pdf' },
  { id: 'koto-yurakucho', title: 'Koto City: Yurakucho Line extension panel (Toyocho)', url: 'https://www.city.koto.lg.jp/390100/line8-panel-2026-toyocho.html' },
  { id: 'jre-haneda', title: 'JR East news release: Haneda Airport Access Line (East Yamanote route) construction, 2023-04-04', url: 'https://www.jreast.co.jp/press/2023/20230404_ho03.pdf' },
  { id: 'trafficnews-haneda', title: 'Norimono News: 羽田空港アクセス線 2031年度開業へ工事着々', url: 'https://trafficnews.jp/post/670785' },
  { id: 'mynavi-rinkai', title: 'Mynavi News: Tokyo Rinkai Subway to be built by JRTT and operated by TWR (2024-02)', url: 'https://news.mynavi.jp/article/20240224-twr/' },
  { id: 'chuo-rinkai', title: 'Chuo City: 都心部・臨海地域地下鉄 (Tokyo Rinkai Subway)', url: 'https://www.city.chuo.lg.jp/a0035/machizukuri/koutsuukeikaku/rinkaichikatetsu.html' },
  { id: 'wiki-rinkai', title: 'Wikipedia: Tokyo Rinkai Subway Line', url: 'https://en.wikipedia.org/wiki/Tokyo_Rinkai_Subway_Line' },
  { id: 'impress-oedo', title: 'Impress Watch: Oedo Line extension study status (2025-10-16)', url: 'https://www.watch.impress.co.jp/docs/news/2055412.html' },
  { id: 'nerima-oedo', title: 'Nerima City: Oedo Line extension (Hikarigaoka - Oizumi-gakuenmachi)', url: 'https://www.city.nerima.tokyo.jp/kusei/koho/hodo/r4/r408/220830.files/220830-2.pdf' },
];

const M = (o) => ({ group: 'tokyo-metro', mode: 'metro', sources: ['osm', 'tokyometro'], ...o });
const T = (o) => ({ group: 'toei', mode: 'metro', sources: ['osm', 'toei'], ...o });
const J = (o) => ({ group: 'jr-east', mode: 'commuter', sources: ['osm', 'jreast'], ...o });
const S = (o) => ({ group: 'jr-shinkansen', mode: 'shinkansen', sources: ['osm', 'jreast'], ...o });

export const LINES = [
  // ---------------- Tokyo Metro ----------------
  M({ id: 'ginza', code: 'G', name: 'Ginza Line', nameLocal: '銀座線', color: '#FF9500', opened: 1927,
    description: "Japan's first subway (Ueno-Asakusa, 1927).",
    segments: [
      { rel: 8026074, from: '渋谷', to: '新橋', year: 1939 },
      { rel: 8026074, from: '新橋', to: '神田', year: 1934 },
      { rel: 8026074, from: '神田', to: '上野', year: 1931 },
      { rel: 8026074, from: '上野', to: '浅草', year: 1927 },
    ] }),
  M({ id: 'marunouchi', code: 'M', name: 'Marunouchi Line', nameLocal: '丸ノ内線', color: '#F62E36', opened: 1954,
    segments: [
      { rel: 443282, from: '荻窪', to: '新宿', year: 1961 },
      { rel: 443282, from: '新宿', to: '霞ケ関', year: 1959 },
      { rel: 443282, from: '霞ケ関', to: '東京', year: 1958 },
      { rel: 443282, from: '東京', to: '御茶ノ水', year: 1956 },
      { rel: 443282, from: '御茶ノ水', to: '池袋', year: 1954 },
      { rel: 8015930, year: 1961, codePrefix: 'Mb', codeStart: 'Mb03', codeFrom: 1, label: 'Hōnanchō branch (Mb)' },
    ] }),
  M({ id: 'hibiya', code: 'H', name: 'Hibiya Line', nameLocal: '日比谷線', color: '#B5B5AC', opened: 1961,
    segments: [
      { rel: 443272, from: '中目黒', to: '霞ケ関', year: 1964 },
      { rel: 443272, from: '霞ケ関', to: '仲御徒町', year: 1963 },
      { rel: 443272, from: '仲御徒町', to: '北千住', year: 1961 },
    ] }),
  M({ id: 'tozai', code: 'T', name: 'Tōzai Line', nameLocal: '東西線', color: '#009BBF', opened: 1964,
    segments: [
      { rel: 5371620, from: '中野', to: '高田馬場', year: 1966 },
      { rel: 5371620, from: '高田馬場', to: '九段下', year: 1964 },
      { rel: 5371620, from: '九段下', to: '東陽町', year: 1967 },
      { rel: 5371620, from: '東陽町', to: '西船橋', year: 1969 },
    ] }),
  M({ id: 'chiyoda', code: 'C', name: 'Chiyoda Line', nameLocal: '千代田線', color: '#00BB85', opened: 1969,
    segments: [
      { rel: 443284, from: '代々木上原', to: '代々木公園', year: 1978 },
      { rel: 443284, from: '代々木公園', to: '霞ケ関', year: 1972 },
      { rel: 443284, from: '霞ケ関', to: '大手町', year: 1971 },
      { rel: 443284, from: '大手町', to: '北千住', year: 1969 },
      { rel: 443284, from: '北千住', to: '綾瀬', year: 1971 },
      { rel: 8026053, year: 1979, label: 'Kita-Ayase branch' },
    ] }),
  M({ id: 'yurakucho', code: 'Y', name: 'Yūrakuchō Line', nameLocal: '有楽町線', color: '#C1A470', opened: 1974,
    sources: ['osm', 'tokyometro', 'tm-ext-2024', 'impress-ext-2024', 'tmg-yurakucho', 'koto-yurakucho'],
    segments: [
      { rel: 443269, from: '和光市', to: '地下鉄成増', year: 1987 },
      { rel: 443269, from: '地下鉄成増', to: '池袋', year: 1983 },
      { rel: 443269, from: '池袋', to: '銀座一丁目', year: 1974 },
      { rel: 443269, from: '銀座一丁目', to: '新富町', year: 1980 },
      { rel: 443269, from: '新富町', to: '新木場', year: 1988 },
      { status: 'construction', year: 2035, label: 'Toyosu – Sumiyoshi extension (under construction since Nov 2024, target mid-2030s; station names provisional)',
        stops: [
          { name: '豊洲', nameEn: 'Toyosu', coord: [139.7962, 35.6549] },
          { name: '枝川', nameEn: 'Edagawa', coord: [139.8115, 35.661], approx: true },
          { name: '東陽町', nameEn: 'Tōyōchō', coord: [139.8172, 35.6697], approx: true },
          { name: '千石', nameEn: 'Sengoku (Kōtō)', coord: [139.8162, 35.6795], approx: true, id: 'sengoku-koto' },
          { name: '住吉', nameEn: 'Sumiyoshi', coord: [139.8158, 35.6893] },
        ] },
    ] }),
  M({ id: 'hanzomon', code: 'Z', name: 'Hanzōmon Line', nameLocal: '半蔵門線', color: '#8F76D6', opened: 1978,
    segments: [
      { rel: 443279, from: '渋谷', to: '半蔵門', year: 1978 },
      { rel: 443279, from: '半蔵門', to: '三越前', year: 1989 },
      { rel: 443279, from: '三越前', to: '水天宮前', year: 1990 },
      { rel: 443279, from: '水天宮前', to: '押上', year: 2003 },
    ] }),
  M({ id: 'namboku', code: 'N', name: 'Namboku Line', nameLocal: '南北線', color: '#00AC9B', opened: 1991,
    sources: ['osm', 'tokyometro', 'tm-ext-2024', 'impress-ext-2024'],
    segments: [
      { rel: 7730199, from: '目黒', to: '溜池山王', year: 2000 },
      { rel: 7730199, from: '溜池山王', to: '四ツ谷', year: 1997 },
      { rel: 7730199, from: '四ツ谷', to: '駒込', year: 1996 },
      { rel: 7730199, from: '駒込', to: '赤羽岩淵', year: 1991 },
      { status: 'construction', year: 2035, label: 'Shirokane-takanawa – Shinagawa branch (2.5 km, under construction since Nov 2024, target mid-2030s)',
        stops: [
          { name: '白金高輪', nameEn: 'Shirokane-takanawa', coord: [139.7343, 35.6427] },
          { name: '品川', nameEn: 'Shinagawa', coord: [139.7376, 35.6292], approx: true },
        ] },
    ] }),
  M({ id: 'fukutoshin', code: 'F', name: 'Fukutoshin Line', nameLocal: '副都心線', color: '#9C5E31', opened: 1994,
    description: 'Wakōshi – Kotake-mukaihara shares tracks with the Yūrakuchō Line; Kotake-mukaihara – Ikebukuro opened 1994 as the Yūrakuchō New Line, Ikebukuro – Shibuya in 2008.',
    segments: [
      { rel: 5375678, from: '和光市', to: '池袋', year: 1994 },
      { rel: 5375678, from: '池袋', to: '渋谷', year: 2008 },
    ] }),

  // ---------------- Toei ----------------
  T({ id: 'asakusa', code: 'A', name: 'Asakusa Line', nameLocal: '浅草線', color: '#E85298', opened: 1960,
    segments: [
      { rel: 3302734, from: '西馬込', to: '新橋', year: 1968 },
      { rel: 3302734, from: '新橋', to: '浅草橋', year: 1962 },
      { rel: 3302734, from: '浅草橋', to: '押上', year: 1960 },
    ] }),
  T({ id: 'mita', code: 'I', name: 'Mita Line', nameLocal: '三田線', color: '#0079C2', opened: 1968,
    segments: [
      { rel: 443286, from: '目黒', to: '三田', year: 2000 },
      { rel: 443286, from: '三田', to: '日比谷', year: 1973 },
      { rel: 443286, from: '日比谷', to: '巣鴨', year: 1972 },
      { rel: 443286, from: '巣鴨', to: '高島平', year: 1968 },
      { rel: 443286, from: '高島平', to: '西高島平', year: 1976 },
    ] }),
  T({ id: 'shinjuku', code: 'S', name: 'Shinjuku Line', nameLocal: '新宿線', color: '#6CBB5A', opened: 1978,
    segments: [
      { rel: 8019858, from: '新宿', to: '岩本町', year: 1980 },
      { rel: 8019858, from: '岩本町', to: '東大島', year: 1978 },
      { rel: 8019858, from: '東大島', to: '篠崎', year: 1986 },
      { rel: 8019858, from: '篠崎', to: '本八幡', year: 1989 },
    ] }),
  T({ id: 'oedo', code: 'E', name: 'Ōedo Line', nameLocal: '大江戸線', color: '#B6007A', opened: 1991,
    sources: ['osm', 'toei', 'impress-oedo', 'nerima-oedo'],
    description: 'Loop (Tochōmae – Ryōgoku – Roppongi – Shinjuku – Tochōmae) plus the radial Tochōmae – Hikarigaoka.',
    segments: [
      { rel: 8019883, from: '都庁前', to: '都庁前', year: 2000, codeMod: 28, label: 'Loop (E01–E28)' },
      { rel: 8019883, from: '都庁前', fromNth: 2, to: '練馬', year: 1997 },
      { rel: 8019883, from: '練馬', to: '光が丘', year: 1991 },
      { status: 'planned', label: 'Hikarigaoka – Ōizumi-gakuenmachi extension (~4 km; Toei study published Oct 2025, no business plan/approval yet; target year not set)',
        stops: [
          { name: '光が丘', nameEn: 'Hikarigaoka', coord: [139.6282, 35.7582] },
          { name: '土支田', nameEn: 'Tsuchida', coord: [139.6125, 35.7615], approx: true },
          { name: '大泉町', nameEn: 'Ōizumi-machi', coord: [139.5985, 35.7625], approx: true },
          { name: '大泉学園町', nameEn: 'Ōizumi-gakuenmachi', coord: [139.588, 35.764], approx: true },
        ] },
    ] }),

  // ---------------- JR East ----------------
  J({ id: 'yamanote', code: 'JY', name: 'Yamanote Line', nameLocal: '山手線', color: '#9ACD32', opened: 1925,
    segments: [{ rel: 1972920, year: 1925, codeMod: 30, label: 'Loop (completed 1925)' }] }),
  J({ id: 'chuo-rapid', code: 'JC', name: 'Chūō Line (Rapid)', nameLocal: '中央線快速', color: '#F15A22', opened: 1889,
    segments: [
      { rel: 12022275, from: '東京', to: '高尾', year: 1889 },
      { rel: 12022275, from: '高尾', year: 1901, label: 'Chūō Main Line beyond Takao' },
    ] }),
  J({ id: 'chuo-sobu', code: 'JB', name: 'Chūō-Sōbu Line (Local)', nameLocal: '中央・総武線各駅停車', color: '#FFD400', opened: 1894,
    segments: [
      { rel: 10312043, from: '三鷹', to: '御茶ノ水', year: 1904 },
      { rel: 10312043, from: '御茶ノ水', to: '両国', year: 1932 },
      { rel: 10312043, from: '両国', to: '千葉', year: 1894 },
    ] }),
  J({ id: 'keihin-tohoku', code: 'JK', name: 'Keihin-Tōhoku / Negishi Line', nameLocal: '京浜東北線・根岸線', color: '#00B2E5', opened: 1914,
    segments: [
      { rel: 10257298, year: 1964, label: 'Negishi Line (Ōfuna – Yokohama, 1964–1973)' },
      { rel: 5195692, year: 1914, label: 'Keihin-Tōhoku Line (Yokohama – Ōmiya)' },
    ] }),
  J({ id: 'saikyo', code: 'JA', name: 'Saikyō / Kawagoe Line', nameLocal: '埼京線・川越線', color: '#00AC9A', opened: 1985,
    segments: [
      { rel: 21361897, from: '大崎', to: '新宿', year: 2002, label: 'Ōsaki – Shinjuku (Ebisu 1996, Ōsaki 2002)' },
      { rel: 21361897, from: '新宿', to: '大宮', year: 1985 },
      { rel: 11953294, year: 1940, label: 'Kawagoe Line (Ōmiya – Komagawa)' },
    ] }),
  J({ id: 'shonan-shinjuku', code: 'JS', name: 'Shōnan-Shinjuku Line', nameLocal: '湘南新宿ライン', color: '#E21F26', opened: 2001,
    description: 'Through service (Takasaki/Utsunomiya – Shinjuku – Yokosuka/Tōkaidō) on existing tracks.',
    segments: [{ rel: 4673470, year: 2001 }] }),
  J({ id: 'ueno-tokyo', code: 'JU', name: 'Ueno-Tokyo Line', nameLocal: '上野東京ライン', color: '#91278F', opened: 2015,
    description: 'Through link (2015) joining the Utsunomiya/Takasaki/Jōban lines with the Tōkaidō Line.',
    segments: [{ rel: 5195693, from: '上野', to: '東京', year: 2015 }] }),
  J({ id: 'tokaido', code: 'JT', name: 'Tōkaidō Line', nameLocal: '東海道線', color: '#F68B1E', opened: 1872,
    segments: [{ rel: 12014185, year: 1872 }] }),
  J({ id: 'utsunomiya', code: 'JU', name: 'Utsunomiya Line (Tōhoku Main Line)', nameLocal: '宇都宮線', color: '#F68B1E', opened: 1883,
    segments: [{ rel: 12210362, from: '上野', year: 1883 }] }),
  J({ id: 'takasaki', code: 'JU', name: 'Takasaki Line', nameLocal: '高崎線', color: '#FF7F27', opened: 1883,
    description: 'Ōmiya – Takasaki; trains run through to Ueno/Tokyo over the Utsunomiya Line tracks.',
    segments: [{ rel: 5430810, from: '大宮', year: 1883 }] }),
  J({ id: 'yokosuka-sobu', code: 'JO', name: 'Yokosuka / Sōbu Line (Rapid)', nameLocal: '横須賀線・総武快速線', color: '#0067C0', opened: 1889,
    segments: [
      { rel: 1832947, year: 1889, label: 'Yokosuka Line (Kurihama – Tokyo)' },
      { rel: 9475339, year: 1972, label: 'Sōbu Rapid Line (Tokyo – Chiba)' },
    ] }),
  J({ id: 'joban-rapid', code: 'JJ', name: 'Jōban Line (Rapid)', nameLocal: '常磐線快速', color: '#00B261', opened: 1896,
    segments: [
      { rel: 10757873, year: 1896 },
      { rel: 1872548, from: '取手', year: 1895, label: 'Jōban Line beyond Toride' },
    ] }),
  J({ id: 'joban-local', code: 'JL', name: 'Jōban Line (Local)', nameLocal: '常磐線各駅停車', color: '#868F98', opened: 1971,
    description: 'Separate local tracks since 1971, through-running with the Chiyoda Line at Ayase.',
    segments: [{ rel: 10025276, year: 1971 }] }),
  J({ id: 'keiyo', code: 'JE', name: 'Keiyō Line', nameLocal: '京葉線', color: '#C9242F', opened: 1986,
    segments: [
      { rel: 5326726, from: '東京', to: '新木場', year: 1990 },
      { rel: 5326726, from: '新木場', to: '蘇我', year: 1988 },
      { rel: 14656663, year: 1986, label: 'Nishi-Funabashi – Minami-Funabashi branch' },
    ] }),
  J({ id: 'musashino', code: 'JM', name: 'Musashino Line', nameLocal: '武蔵野線', color: '#EB5A28', opened: 1973,
    segments: [
      { rel: 9486466, to: '新松戸', year: 1973 },
      { rel: 9486466, from: '新松戸', year: 1978 },
    ] }),
  J({ id: 'nambu', code: 'JN', name: 'Nambu Line', nameLocal: '南武線', color: '#FFD400', opened: 1927,
    segments: [
      { rel: 1834403, year: 1927 },
      { rel: 14284669, year: 1930, label: 'Hama-Kawasaki branch' },
    ] }),
  J({ id: 'yokohama', code: 'JH', name: 'Yokohama Line', nameLocal: '横浜線', color: '#80C241', opened: 1908,
    segments: [{ rel: 18100867, year: 1908 }] }),
  J({ id: 'ome', code: 'JC', name: 'Ōme Line', nameLocal: '青梅線', color: '#F7931E', opened: 1894,
    segments: [{ rel: 11814887, year: 1894 }] }),
  J({ id: 'itsukaichi', code: 'JC', name: 'Itsukaichi Line', nameLocal: '五日市線', color: '#F7931E', opened: 1925,
    segments: [{ rel: 1984869, year: 1925 }] }),
  J({ id: 'hachiko', name: 'Hachikō Line', nameLocal: '八高線', color: '#A8A39D', opened: 1931,
    segments: [
      { rel: 14323630, year: 1931 },
      { rel: 21268981, reverse: true, year: 1934, label: 'Komagawa – Takasaki (non-electrified)' },
    ] }),
  J({ id: 'sagami', name: 'Sagami Line', nameLocal: '相模線', color: '#009793', opened: 1921,
    segments: [{ rel: 14302812, sort: true, from: '茅ケ崎', to: '橋本', year: 1921 }] }),
  J({ id: 'tsurumi', code: 'JI', name: 'Tsurumi Line', nameLocal: '鶴見線', color: '#FFD400', opened: 1926,
    segments: [
      { rel: 11776970, reverse: true, year: 1926 },
      { rel: 11777029, from: '浅野', year: 1932, label: 'Umi-Shibaura branch' },
      { rel: 11776971, from: '安善', year: 1926, label: 'Ōkawa branch' },
    ] }),
  J({ id: 'narita', name: 'Narita Line', nameLocal: '成田線', color: '#00B261', opened: 1897,
    segments: [
      { rel: 3139193, to: '成田', year: 1897, label: 'Sakura – Narita' },
      { rel: 10928742, year: 1901, label: 'Abiko branch' },
      { rel: 14298709, from: '酒々井', year: 1991, codePrefix: 'JO', label: 'Narita Airport branch (via Narita)' },
    ] }),
  J({ id: 'sobu-main', name: 'Sōbu Main Line (east of Chiba)', nameLocal: '総武本線', color: '#FFD400', opened: 1894, codePrefix: 'JO',
    segments: [{ rel: 14303196, sort: true, from: '千葉', year: 1894 }] }),
  J({ id: 'uchibo', name: 'Uchibō Line', nameLocal: '内房線', color: '#00B2E5', opened: 1912,
    segments: [{ rel: 17055693, year: 1912 }] }),
  J({ id: 'sotobo', name: 'Sotobō Line', nameLocal: '外房線', color: '#DB2027', opened: 1896,
    segments: [{ rel: 1949528, year: 1896 }] }),
  J({ id: 'kururi', name: 'Kururi Line', nameLocal: '久留里線', color: '#00B5AD', opened: 1912,
    segments: [{ rel: 14344304, sort: true, from: '木更津', to: '上総亀山', year: 1912 }] }),
  J({ id: 'haneda-access', name: 'Haneda Airport Access Line', nameLocal: '羽田空港アクセス線', color: '#3A5BA0', status: 'construction', opened: 2031,
    sources: ['jre-haneda', 'trafficnews-haneda'],
    description: 'No official color yet (color chosen for the map). East Yamanote route: branches from the Tōkaidō/Ueno-Tokyo tracks near Tamachi, uses upgraded freight tracks via the Tokyo Freight Terminal, then a new ~5 km tunnel to a new station between Haneda Terminals 1 and 2. Path is approximate.',
    segments: [
      { status: 'construction', year: 2031, label: 'East Yamanote route (construction since June 2023, target FY2031)',
        stops: [
          { name: '東京', nameEn: 'Tokyo', coord: [139.7671, 35.6812] },
          { name: '羽田空港新駅', nameEn: 'Haneda Airport (new station)', coord: [139.786, 35.55], approx: true, id: 'haneda-airport-jr' },
        ],
        path: [[139.7671, 35.6812], [139.7631, 35.675], [139.7584, 35.6663], [139.7571, 35.6555], [139.7475, 35.6457], [139.7448, 35.6405],
          [139.7505, 35.632], [139.7505, 35.62], [139.7535, 35.61], [139.7585, 35.596], [139.774, 35.564], [139.786, 35.55]] },
      { status: 'planned', label: 'Rinkai route via the Rinkai Line to Shin-Kiba (planned, aimed to open with the East route; coordination with TWR ongoing)',
        stops: [
          { name: '新木場', nameEn: 'Shin-Kiba', coord: [139.8270, 35.6459] },
          { name: '羽田空港新駅', nameEn: 'Haneda Airport (new station)', coord: [139.786, 35.55], approx: true, id: 'haneda-airport-jr' },
        ],
        path: [[139.827, 35.6459], [139.804, 35.641], [139.793, 35.634], [139.779, 35.627], [139.7535, 35.615], [139.7535, 35.61], [139.7585, 35.596], [139.774, 35.564], [139.786, 35.55]] },
    ] }),

  // ---------------- Shinkansen ----------------
  S({ id: 'tokaido-shinkansen', name: 'Tōkaidō Shinkansen', nameLocal: '東海道新幹線', color: '#1E50A2', opened: 1964,
    sources: ['osm', 'jrcentral'], description: 'Operated by JR Central. Clipped at the Greater Tokyo boundary.',
    segments: [{ rel: 9802525, to: '小田原', year: 1964 }] }),
  S({ id: 'tohoku-shinkansen', name: 'Tōhoku Shinkansen', nameLocal: '東北新幹線', color: '#41934C', opened: 1982,
    description: 'Also carries Jōetsu, Hokuriku, Yamagata and Akita Shinkansen trains south of Ōmiya. Clipped at the Greater Tokyo boundary.',
    segments: [
      { rel: 9326156, from: '東京', to: '上野', year: 1991 },
      { rel: 9326156, from: '上野', to: '大宮', year: 1985 },
    ] }),
  S({ id: 'joetsu-shinkansen', name: 'Jōetsu Shinkansen', nameLocal: '上越新幹線', color: '#E85298', opened: 1982,
    description: 'Ōmiya – Kumagaya within the map area; the Hokuriku Shinkansen branches off at Takasaki, outside the area.',
    segments: [{ rel: 13098206, from: '大宮', to: '熊谷', year: 1982 }] }),

  // ---------------- New subway ----------------
  {
    id: 'rinkai-subway', name: 'Tokyo Rinkai Subway', nameLocal: '都心部・臨海地域地下鉄', group: 'subway-planned', mode: 'metro',
    color: '#00A0E9', status: 'planned', sources: ['mynavi-rinkai', 'chuo-rinkai', 'wiki-rinkai'],
    description: 'No official color (color chosen for the map). 6.1 km, Tokyo – Tokyo Big Sight. TMG plan: built by JRTT, operated by Tokyo Waterfront Area Rapid Transit (TWR). No licence or city-plan decision yet; ~2040 is an unofficial aim. All stations provisional, positions approximate.',
    segments: [
      { status: 'planned', label: 'Tokyo – Ariake/Tokyo Big Sight (draft plan 2022, ~2040 unofficial aim)',
        stops: [
          { name: '東京', nameEn: 'Tokyo', coord: [139.769, 35.68], approx: true },
          { name: '新銀座', nameEn: 'Shin-Ginza', coord: [139.769, 35.671], approx: true },
          { name: '新築地', nameEn: 'Shin-Tsukiji', coord: [139.77, 35.664], approx: true },
          { name: '勝どき', nameEn: 'Kachidoki', coord: [139.7768, 35.6588], approx: true },
          { name: '晴海', nameEn: 'Harumi', coord: [139.783, 35.6555], approx: true },
          { name: '豊洲市場', nameEn: 'Toyosu-shijō', coord: [139.785, 35.6455], approx: true },
          { name: '有明・東京ビッグサイト', nameEn: 'Ariake / Tokyo Big Sight', coord: [139.793, 35.63], approx: true },
        ] },
    ],
  },
];

// OSM stop names that differ from the official station name (applied before matching/merging).
export const NAME_ALIASES = {
  '新線新宿': '新宿',
};

// English names to use instead of the OSM name:en (typos / decorated names), keyed by Japanese name.
export const EN_OVERRIDES = {
  '海浜幕張': 'Kaihin-Makuhari',
  '明治神宮前': 'Meiji-jingumae',
  '二重橋前': 'Nijubashimae',
  '押上': 'Oshiage',
};
