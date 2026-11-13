// Curated spec for Taipei (Taipei, New Taipei, Taoyuan, Keelung). Built by build.mjs.
// Operating geometry and stations come from OpenStreetMap; future stations carry approximate
// coordinates (approx) estimated from published station sites (see research/taipei.md).
// Curated stops without `coord` snap to the operating station of that name near `near`.

export const META = {
  name: 'Taipei',
  nameLocal: '臺北',
  center: [121.48, 25.04],
  zoom: 10.4,
  timeline: { min: 1996, max: 2037 },
  graphPad: 0.12,
  notes:
    'Covers Taipei, New Taipei, Taoyuan and Keelung, clipped to lng 121.10-121.85 / lat 24.85-25.30 (TRA lines are cut at the last station inside that box; THSR is shown to Hsinchu). ' +
    'Geometry and station positions © OpenStreetMap contributors, ODbL (metro and LRT from route relations; TRA, THSR and the Danhai Blue Coast branch routed on the OSM track network; simplified ~15 m). ' +
    'Interchanges are merged when stations share a name within ~450 m (臺/台 and the 車站 suffix are ignored, so Taipei Main Station joins TRA, THSR, MRT and Airport MRT). Differently named transfers (Ximen/Beimen, Wanhua/Longshan Temple) stay separate. ' +
    'Colours: Taipei Metro, Airport MRT and New Taipei Metro lines use the values published in the operators\' line diagrams as collected on Wikipedia (no official hex specification was found); TRA and THSR have no line colours (TRA navy / blues and THSR orange chosen for the map); future lines without an announced colour use the colour each city has used in plan documents. ' +
    'Segment years are first-opening years of each section. Future station names are provisional working names (most English names are unofficial romanisations) and their positions are approximate. ' +
    'Status rules applied literally: groundbreaking ceremonies without site works are not counted as construction (Sanying Bade extension, Keelung MRT), plans awaiting Executive Yuan approval are planned (Minsheng-Xizhi Taipei section, Shenkeng LRT, Wugu-Taishan LRT). ' +
    'Not included: Maokong Gondola; Airport MRT A14 Terminal 3 station (construction, end-2027, between A13 and A14a); proposed Green Line Daxi extension, Taoyuan Orange Line, Shezi/Beitou-Shilin LRT, Taishan-Banqiao LRT, Zhonghe-Guangfu line, Danhai extension to Bali, Keelung MRT phase 2 (no fixed alignment).',
};

export const BBOX = { minLng: 121.1, minLat: 24.85, maxLng: 121.85, maxLat: 25.3 };

export const GROUPS = [
  { id: 'trtc', name: 'Taipei Metro', nameLocal: '臺北捷運', color: '#0070bd', description: 'Taipei Rapid Transit (TRTC) lines, incl. the Circular Line and the Taipei-built lines under construction (Wanda-Zhonghe-Shulin, Minsheng-Xizhi).' },
  { id: 'ntmc', name: 'New Taipei Metro', nameLocal: '新北捷運', color: '#e5554f', description: 'New Taipei Metro: Danhai and Ankeng LRT, Sanying Line, and New Taipei projects (Keelung MRT, Shenkeng and Wugu-Taishan LRT).' },
  { id: 'tymc', name: 'Taoyuan Metro', nameLocal: '桃園捷運', color: '#8246af', description: 'Taoyuan Metro: Airport MRT and the Green and Brown lines under construction.' },
  { id: 'tra', name: 'Taiwan Railway (TRA)', nameLocal: '臺鐵', color: '#090980', description: 'Taiwan Railway Corporation lines inside the map area (commuter service).' },
  { id: 'thsr', name: 'Taiwan High Speed Rail', nameLocal: '台灣高鐵', color: '#c35617', description: 'THSR, Nangang - Hsinchu inside the map area, and the approved Yilan extension.' },
];

export const SOURCES = [
  { id: 'osm', title: 'OpenStreetMap contributors (route relations, stations, track), ODbL', url: 'https://www.openstreetmap.org/copyright' },
  { id: 'trtc', title: 'Taipei Metro - route map', url: 'https://english.metro.taipei/cp.aspx?n=E3BD6E9B5B0BC1E1' },
  { id: 'ntmetro', title: 'New Taipei Metro (Danhai LRT, Ankeng LRT, Sanying Line)', url: 'https://www.ntmetro.com.tw/' },
  { id: 'tymetro', title: 'Taoyuan Metro - Airport MRT', url: 'https://www.tymetro.com.tw/tymetro-new/en/' },
  { id: 'tra', title: 'Taiwan Railway Corporation (臺鐵) - route map', url: 'https://www.railway.gov.tw/tra-tip-web/tip' },
  { id: 'thsr', title: 'Taiwan High Speed Rail - stations', url: 'https://en.thsrc.com.tw/' },
  { id: 'wiki-colors', title: 'Wikipedia: Module:Adjacent stations (Taipei Metro, New Taipei Metro, Taoyuan Metro) line colours', url: 'https://en.wikipedia.org/wiki/Module:Adjacent_stations/Taipei_Metro' },
  { id: 'storm-r-east', title: 'Storm Media: 信義線東延段 2026-08-30 通車', url: 'https://www.storm.mg/lifestyle/11150602' },
  { id: 'storm-sanying', title: 'Storm Media: 三鶯線 2026-06-30 通車', url: 'https://www.storm.mg/article/11145191' },
  { id: 'cna-sanying-bade', title: 'CNA: 新北捷運三鶯線延伸八德動工 目標123年完工通車 (2026-11-13)', url: 'https://www.cna.com.tw/news/aloc/202611130177.aspx' },
  { id: 'ltn-sanying-bade', title: 'Liberty Times: 三鶯線延伸八德段動工 (2026-11-13)', url: 'https://news.ltn.com.tw/news/Taoyuan/breakingnews/5639677' },
  { id: 'newtalk-circular', title: 'Newtalk: 環狀線東環段 CF720 開工 / 南北環段進度 (2026-04-17)', url: 'https://newtalk.tw/news/view/2026-04-17/1030338' },
  { id: 'housefeel-circular', title: 'Housefeel: 捷運環狀線 overview, stations and progress (updated 2026-10)', url: 'https://www.housefeel.com.tw/article/?id=3530' },
  { id: 'wiki-circular', title: 'Wikipedia (zh): 環狀線 (臺北捷運)', url: 'https://zh.wikipedia.org/zh-tw/環狀線_(臺北捷運)' },
  { id: 'bella-circular-east', title: 'Bella: Taipei MRT Circular Line east section by 2032', url: 'https://www.bella.tw/articles/design&gadget/56193/taipei-mrt-circular-line-east-part-by-2032' },
  { id: 'udn-wanda', title: 'UDN: 土城樹林線拚提前一年完工 侯友宜要求2030年達標 (2026-07)', url: 'https://udn.com/news/story/7323/9642105' },
  { id: 'housefeel-wanda', title: 'Housefeel: 萬大樹林線 (updated 2026-10-13)', url: 'https://www.housefeel.com.tw/article/萬大樹林線-萬大線-樹林線-萬大中和樹林線/' },
  { id: 'wiki-wanda', title: 'Wikipedia (zh): 萬大線', url: 'https://zh.wikipedia.org/zh-tw/萬大線' },
  { id: 'bella-sb', title: 'Bella: Minsheng-Xizhi Line from Datong to Neihu (2026-04-21)', url: 'https://www.bella.tw/articles/design&gadget/57382/taipei-new-mrt-minsheng-xizhi-line-from-datong-to-neihu' },
  { id: 'udn-xidong', title: 'UDN: 汐東線動工 (2025-03)', url: 'https://udn.com/news/story/7323/9152323' },
  { id: 'housefeel-sb', title: 'Housefeel: 民生汐止線 / 汐東線', url: 'https://www.housefeel.com.tw/article/民生汐止線-汐止民生線-汐止捷運-汐東線-民生線/' },
  { id: 'cna-keelung', title: 'CNA: 基隆捷運經費 (2024-05-15)', url: 'https://www.cna.com.tw/news/ahel/202405150344.aspx' },
  { id: 'chinatimes-keelung', title: 'China Times: 基隆捷運先期工程動土 (2025-12-30)', url: 'https://www.chinatimes.com/realtimenews/20251230003375-260405' },
  { id: 'housefeel-keelung', title: 'Housefeel: 基隆捷運 (updated 2026-10)', url: 'https://www.housefeel.com.tw/article/%e5%9f%ba%e9%9a%86%e8%bc%95%e8%bb%8c-%e5%9f%ba%e9%9a%86%e6%8d%b7%e9%81%8b-%e5%9f%ba%e9%9a%86-%e5%8f%b0%e9%90%b5/' },
  { id: 'ntpc-danhai2', title: 'New Taipei DORTS: 淡海輕軌二期 V23-V26A 公聽會 (2026-07-31)', url: 'https://www.dorts.ntpc.gov.tw/cdn/file/20260731/80f9131e-75ef-4bec-8648-e2c75cd25d0c.pdf' },
  { id: 'bella-danhai2', title: 'Bella: Danhai LRT phase 2 (2026-11-10)', url: 'https://www.bella.tw/articles/design&gadget/61039/new-taipei-dan-hai-light-rail-phase-2' },
  { id: 'cna-ankeng', title: 'CNA: 安坑輕軌通車 (2023-02-10)', url: 'https://www.cna.com.tw/news/ahel/202302100082.aspx' },
  { id: 'ltn-shenkeng', title: 'Liberty Times: 深坑輕軌綜合規劃 (2026)', url: 'https://news.ltn.com.tw/news/life/breakingnews/5569196' },
  { id: 'bella-shenkeng', title: 'Bella: Shenkeng LRT from Taipei Zoo', url: 'https://www.bella.tw/articles/design&gadget/57627/new-taipei-mrt-shenkeng-line-from-muzha-zoo-station' },
  { id: 'udn-wutai', title: 'UDN: 五泰輕軌環評 (2026)', url: 'https://udn.com/news/story/7266/9436469' },
  { id: 'housefeel-wutai', title: 'Housefeel: 五泰輕軌', url: 'https://www.housefeel.com.tw/article/五泰輕軌-五股泰山輕軌-五泰輕軌路線/' },
  { id: 'bt-green', title: 'Business Today: 桃園捷運綠線年底通車 (2026-07-07)', url: 'https://www.businesstoday.com.tw/article/category/183030/post/202607070009/' },
  { id: 'newtalk-green', title: 'Newtalk: 綠線至今仍未初勘 (2026-10-15)', url: 'https://newtalk.tw/news/view/2026-10-15/1065600' },
  { id: 'bella-green-zhongli', title: 'Bella: Taoyuan Green Line Zhongli extension starts construction (2026-08-29)', url: 'https://www.bella.tw/articles/design&gadget/59722/taoyuan-new-mrt-green-line-extension-zhongli-starts-construction' },
  { id: 'ltn-brown', title: 'Liberty Times: 桃園捷運棕線綜合規劃核定 (2024-03)', url: 'https://news.ltn.com.tw/news/life/breakingnews/5302143' },
  { id: 'ctee-brown', title: 'Commercial Times: 棕線基本設計 (2026-01-07)', url: 'https://www.ctee.com.tw/news/20260107701167-431401' },
  { id: 'udn-brown', title: 'UDN: 棕線先期工程 (2026)', url: 'https://udn.com/news/story/7324/9618863' },
  { id: 'ey-a23', title: 'Executive Yuan: 機場捷運延伸中壢車站 (A23) target 2028-07', url: 'https://www.ey.gov.tw/Page/9277F759E41CCD91/b39c27e6-0464-440a-bf3f-f3d8b25b011b' },
  { id: 'udn-a14', title: 'UDN: 機捷A14站 2027年與第三航廈同步啟用 (2025)', url: 'https://udn.com/news/story/7266/9104990' },
  { id: 'cna-zhongyuan', title: 'CNA: 桃園鐵路地下化 中原車站動工 (2024-09-04)', url: 'https://www.cna.com.tw/news/aloc/202409040281.aspx' },
  { id: 'cna-pingzhen', title: 'CNA: 台鐵平鎮臨時站啟用通車 永久站估122年完成 (2026-10-03)', url: 'https://cna.com.tw/news/ahel/202610030094.aspx' },
  { id: 'bnext-yilan', title: 'Bnext: 高鐵宜蘭站 路線與2037年通車 (2026)', url: 'https://www.bnext.com.tw/article/92751/yilan-high-speed-rail-station-route-opening-2037' },
  { id: 'storm-yilan', title: 'Storm Media: 高鐵延伸宜蘭 綜合規劃核定 (2026-07)', url: 'https://www.storm.mg/article/11152595' },
];

const M = (o) => ({ group: 'trtc', mode: 'metro', sources: ['osm', 'trtc', 'wiki-colors'], ...o });
const N = (o) => ({ group: 'ntmc', sources: ['osm', 'ntmetro', 'wiki-colors'], ...o });
const Y = (o) => ({ group: 'tymc', mode: 'metro', sources: ['osm', 'tymetro', 'wiki-colors'], ...o });
const T = (o) => ({ group: 'tra', mode: 'commuter', sources: ['osm', 'tra'], ...o });
const s = (name, nameEn, coord, code, extra) => ({ name, nameEn, coord, approx: true, ...(code ? { code } : {}), ...extra });
const at = (name, near, code) => ({ name, near, ...(code ? { code } : {}) });

export const MERGES = [
  { id: 'taipei-main-station', names: ['台北'], near: [121.5170, 25.0478], r: 700, name: 'Taipei Main Station', nameLocal: '臺北車站' },
  { id: 'taoyuan-hsr', names: ['桃園'], near: [121.2147, 25.0130], r: 700, name: 'Taoyuan HSR Station', nameLocal: '高鐵桃園站' },
];
export const EN = { 鳳鳴: 'Fengming', 中壢: 'Zhongli', 桃園: 'Taoyuan', 板橋: 'Banqiao', 南港: 'Nangang', 松山: 'Songshan' };
export const LOCAL = { 中壢: '中壢', 桃園: '桃園', 鶯歌: '鶯歌' };

const zoo = at('動物園', [121.5795, 24.9982]);
const daping = at('大坪林', [121.5416, 24.9830]);

export const LINES = [
  // ---------------- Taipei Metro ----------------
  M({ id: 'wenhu', code: 'BR', name: 'Wenhu Line', nameLocal: '文湖線', color: '#C48C31', opened: 1996,
    description: 'Medium-capacity automated line (Muzha Line 1996, Neihu Line 2009).',
    segments: [
      { rel: 447449, to: '中山國中', year: 2009 },
      { rel: 447449, from: '中山國中', year: 1996 },
    ] }),
  M({ id: 'tamsui-xinyi', code: 'R', name: 'Tamsui-Xinyi Line', nameLocal: '淡水信義線', color: '#E3002C', opened: 1997,
    sources: ['osm', 'trtc', 'wiki-colors', 'storm-r-east'],
    description: 'Tamsui Line 1997, Xinyi Line 2013; Xiangshan - Guangci/Fengtian Temple east extension opened 2026-08-30.',
    segments: [
      { rel: 5378981, to: '中山', year: 1997 },
      { rel: 5378981, from: '中山', to: '台北車站', year: 1997 },
      { rel: 5378981, from: '台北車站', to: '中正紀念堂', year: 1998 },
      { rel: 5378981, from: '中正紀念堂', to: '象山', year: 2013 },
      { year: 2026, label: 'Xinyi Line east extension (2026-08-30)',
        stops: [at('象山', [121.5698, 25.0329]), at('廣慈/奉天宮', [121.5785, 25.0330], 'R01')] },
      { rel: 2665129, year: 1997, label: 'Xinbeitou branch' },
    ] }),
  M({ id: 'songshan-xindian', code: 'G', name: 'Songshan-Xindian Line', nameLocal: '松山新店線', color: '#008659', opened: 1998,
    segments: [
      { rel: 4250357, to: '西門', year: 2014 },
      { rel: 4250357, from: '西門', to: '中正紀念堂', year: 2000 },
      { rel: 4250357, from: '中正紀念堂', to: '古亭', year: 1998 },
      { rel: 4250357, from: '古亭', year: 1999 },
      { rel: 4250381, year: 2004, label: 'Xiaobitan branch' },
    ] }),
  M({ id: 'zhonghe-xinlu', code: 'O', name: 'Zhonghe-Xinlu Line', nameLocal: '中和新蘆線', color: '#F8B61C', opened: 1998,
    segments: [
      { rel: 4250355, to: '輔大', year: 2013 },
      { rel: 4250355, from: '輔大', to: '大橋頭', year: 2012 },
      { rel: 4250355, from: '大橋頭', to: '忠孝新生', year: 2010 },
      { rel: 4250355, from: '忠孝新生', to: '古亭', year: 2012 },
      { rel: 4250355, from: '古亭', year: 1998 },
      { rel: 4250354, to: '大橋頭', year: 2010, label: 'Luzhou branch' },
    ] }),
  M({ id: 'bannan', code: 'BL', name: 'Bannan Line', nameLocal: '板南線', color: '#0070BD', opened: 1999,
    segments: [
      { rel: 199038, to: '永寧', year: 2015 },
      { rel: 199038, from: '永寧', to: '新埔', year: 2006 },
      { rel: 199038, from: '新埔', to: '龍山寺', year: 2000 },
      { rel: 199038, from: '龍山寺', to: '市政府', year: 1999 },
      { rel: 199038, from: '市政府', to: '昆陽', year: 2000 },
      { rel: 199038, from: '昆陽', to: '南港', year: 2008 },
      { rel: 199038, from: '南港', year: 2011 },
    ] }),
  M({ id: 'circular', code: 'Y', name: 'Circular Line', nameLocal: '環狀線', color: '#FFDB00', opened: 2020,
    sources: ['osm', 'trtc', 'wiki-colors', 'newtalk-circular', 'housefeel-circular', 'wiki-circular', 'bella-circular-east'],
    description: 'Phase 1 Dapinglin - New Taipei Industrial Park opened 2020-01-31 (medium capacity, driverless). South and North sections: comprehensive plan approved 2019-05-31, all civil contracts under way (34% at end of Oct 2026), target 2031 (some reports 2028-2034). East section: approved 2023-03-29, works since late 2024, target Sept 2032. Future station names provisional; final station codes not published.',
    segments: [
      { rel: 3322093, year: 2020 },
      { status: 'construction', year: 2031, label: 'South section, Taipei Zoo - Dapinglin (construction, target 2031)',
        stops: [zoo, s('政大', 'NCCU', [121.5705, 24.9893], null, { osmRef: 'Y1A' }), s('文山區公所', 'Wenshan District Office', [121.5655, 24.9905], null, { osmRef: 'Y2A' }), s('馬明潭', 'Mamingtan', [121.5560, 24.9895], null, { osmRef: 'Y3' }),
          s('溝子口', 'Gouzikou', [121.5480, 24.9890], null, { osmRef: 'Y4' }), s('寶斗厝', 'Baodoucuo', [121.5470, 24.9840], null, { osmRef: 'Y5' }), daping] },
      { status: 'construction', year: 2031, label: 'North section, New Taipei Industrial Park - Jiannan Road (construction, target 2031)',
        stops: [at('新北產業園區', [121.4600, 25.0612]), s('工商展覽中心', 'Exhibition Center', [121.4605, 25.0660], null, { osmRef: 'Y19A' }), s('更寮', 'Gengliao', [121.4665, 25.0705]),
          s('中路', 'Zhonglu', [121.4740, 25.0760]), at('徐匯中學', [121.4806, 25.0748]), s('分子尾', 'Fenziwei', [121.4850, 25.0790]),
          s('重陽橋', 'Chongyang Bridge', [121.4945, 25.0790]), s('社子', 'Shezi', [121.5075, 25.0880], null, { osmRef: 'Y24' }), s('福德洋', 'Fudeyang', [121.5200, 25.0915]),
          at('士林', [121.5262, 25.0935]), s('林子口', 'Linzikou', [121.5335, 25.0930]), s('故宮', 'National Palace Museum', [121.5505, 25.1025], null, { osmRef: 'Y28' }),
          at('劍南路', [121.5556, 25.0847])] },
      { status: 'construction', year: 2032, label: 'East section, Jiannan Road - Taipei Zoo (construction, target 2032)',
        stops: [at('劍南路', [121.5556, 25.0847]), s('下塔悠', 'Xiatayou', [121.5640, 25.0790]), s('洲子', 'Zhouzi', [121.5700, 25.0775], null, { osmRef: 'Y31' }),
          s('大港墘公園', 'Dagangqian Park', [121.5745, 25.0780], null, { osmRef: 'Y32' }), s('瑞光公園', 'Ruiguang Park', [121.5790, 25.0760]), s('粉寮', 'Fenliao', [121.5840, 25.0685]),
          s('舊里族', 'Jiulizu', [121.5815, 25.0605], null, { osmRef: 'Y35' }), at('松山', [121.5778, 25.0498]), at('永春', [121.5763, 25.0408]), at('象山', [121.5707, 25.0328]),
          s('三張犁', 'Sanzhangli', [121.5720, 25.0270]), zoo] },
    ] }),
  M({ id: 'wanda', code: 'LG', name: 'Wanda-Zhonghe-Shulin Line', nameLocal: '萬大中和樹林線', color: '#A1D884', status: 'construction', opened: 2027,
    sources: ['trtc', 'wiki-colors', 'udn-wanda', 'housefeel-wanda', 'wiki-wanda'],
    description: 'Comprehensive plan approved 2010-02-12. Phase 1 (CKS Memorial Hall - Juguang, 9.5 km, underground) is in system testing, target 2027 (June or end of year; sources differ). Phase 2 (Juguang - Huilong, 13.3 km) under construction (45% mid-2026), target 2031 (New Taipei aims for 2030). Phase-2 station names provisional.',
    segments: [
      { status: 'construction', year: 2027, label: 'Phase 1, LG01-LG08A (system testing, target 2027)',
        stops: [at('中正紀念堂', [121.5170, 25.0325], 'LG01'), s('植物園', 'Taipei Botanical Garden', [121.5100, 25.0322], 'LG02'), s('廈安', "Xia'an", [121.5065, 25.0290], 'LG03'),
          s('加蚋', 'Jiala', [121.4995, 25.0235], 'LG04'), s('永和永平國小', 'Yonghe Yongping Elementary School', [121.5105, 25.0075], 'LG05'),
          at('中和', [121.4995, 25.0000], 'LG06'), s('連城錦和', 'Liancheng Jinhe', [121.4920, 24.9955], 'LG07'), s('中和高中', 'Zhonghe Senior High School', [121.4840, 24.9925], 'LG08'),
          s('莒光', 'Juguang', [121.4760, 24.9880], 'LG08A')] },
      { status: 'construction', year: 2031, label: 'Phase 2, LG08A-LG21 Tucheng-Shulin (construction, target 2031)',
        stops: [s('莒光', 'Juguang', [121.4760, 24.9880]), s('廷寮', 'Tingliao', [121.4680, 24.9850], 'LG09'), s('清水', 'Qingshui', [121.4580, 24.9850], 'LG10'),
          s('土城(金城)', 'Tucheng (Jincheng)', [121.4505, 24.9840], 'LG11', { id: 'tucheng-jincheng' }), s('埤塘', 'Pitang', [121.4430, 24.9820], 'LG12'), s('城林橋', 'Chenglin Bridge', [121.4320, 24.9845], 'LG13'),
          s('溪洲', 'Xizhou', [121.4280, 24.9870], 'LG14'), s('彭福', 'Pengfu', [121.4250, 24.9905], 'LG15'), s('備內', 'Beinei', [121.4210, 24.9950], 'LG16'),
          s('樹林(樹人)', 'Shulin (Shuren)', [121.4180, 24.9995], 'LG17', { id: 'shulin-shuren' }), s('潭底', 'Tandi', [121.4150, 25.0045], 'LG18'), s('監理所', 'Motor Vehicles Office', [121.4140, 25.0110], 'LG19'),
          s('三角埔', 'Sanjiaopu', [121.4130, 25.0170], 'LG20'), at('迴龍', [121.4118, 25.0221], 'LG21')] },
    ] }),
  M({ id: 'minsheng-xizhi', code: 'SB', name: 'Minsheng-Xizhi Line', nameLocal: '民生汐止線', color: '#25AAE1', status: 'construction', opened: 2032,
    sources: ['trtc', 'wiki-colors', 'bella-sb', 'udn-xidong', 'housefeel-sb'],
    description: 'Feasibility approved 2011-12. Xidong section (Donghu - Xizhi District Office, 5.56 km elevated) approved 2023-01-13, works since 2025-03-20, target 2032. Taipei section (Dadaocheng - Donghu, ~11 km underground) comprehensive plan resubmitted 2024-12, not yet approved (no target year). Station names and positions provisional.',
    segments: [
      { status: 'planned', label: 'Taipei section SB01-SB10 (comprehensive plan under review)',
        stops: [s('大稻埕', 'Dadaocheng', [121.5135, 25.0570], 'SB01'), at('雙連', [121.5207, 25.0576], 'SB02'), at('行天宮', [121.5330, 25.0596], 'SB03'),
          s('民生東路三段', 'Minsheng E. Rd Sec. 3', [121.5435, 25.0580], 'SB04'), s('民生東路四段', 'Minsheng E. Rd Sec. 4', [121.5530, 25.0590], 'SB05'), s('民生社區', 'Minsheng Community', [121.5640, 25.0595], 'SB06'),
          s('新湖一路', 'Xinhu 1st Rd', [121.5810, 25.0665], 'SB07'), s('民權東路六段', 'Minquan E. Rd Sec. 6', [121.5960, 25.0690], 'SB08'), s('葫蘆洲', 'Huluzhou', [121.6070, 25.0690], 'SB09'),
          at('東湖', [121.6157, 25.0675], 'SB10')] },
      { status: 'construction', year: 2032, label: 'Xidong section SB10-SB15 (construction since 2025-03, target 2032)',
        stops: [at('東湖', [121.6157, 25.0675]), s('下社后', 'Xia Shehou', [121.6250, 25.0690], 'SB11'), s('社后', 'Shehou', [121.6330, 25.0675], 'SB12'),
          s('樟樹灣', 'Zhangshuwan', [121.6385, 25.0640], 'SB13'), at('汐科', [121.6440, 25.0625], 'SB14'), s('汐止區公所', 'Xizhi District Office', [121.6555, 25.0650], 'SB15')] },
    ] }),

  // ---------------- New Taipei Metro ----------------
  N({ id: 'danhai', code: 'V', name: 'Danhai Light Rail', nameLocal: '淡海輕軌', color: '#E5554F', mode: 'lrt', opened: 2018,
    sources: ['osm', 'ntmetro', 'wiki-colors', 'ntpc-danhai2', 'bella-danhai2'],
    description: 'Green Mountain Line (Hongshulin - Kanding) opened 2018-12; Blue Coast Line phase 1 (Binhai Shalun - Tamsui Fisherman\'s Wharf) 2020-11. Phase 2 (Fisherman\'s Wharf - Tamsui, 3.32 km): the network plan was approved 2013-02-25, but the revised riverside alignment is still under review (sent to the National Development Council 2026-10-29); target 2030. Phase-2 stop names provisional.',
    segments: [
      { rel: 9154523, year: 2018, label: 'Green Mountain Line' },
      { graph: 'lrt', year: 2020, label: 'Blue Coast Line phase 1',
        stops: [at('濱海沙崙', [121.4339, 25.1806]), at('台北海洋大學', [121.4240, 25.1770]), at('沙崙', [121.4150, 25.1840]), at('淡水漁人碼頭', [121.4125, 25.1820])] },
      { status: 'approved', year: 2030, label: 'Blue Coast Line phase 2, Fisherman\'s Wharf - Tamsui (revised plan under review, target 2030)',
        stops: [at('淡水漁人碼頭', [121.4125, 25.1820]), s('中正路二段', 'Zhongzheng Rd Sec. 2', [121.4225, 25.1765], 'V26A'), s('中正路一段', 'Zhongzheng Rd Sec. 1', [121.4300, 25.1745], 'V25'),
          s('中正路一段6巷', 'Zhongzheng Rd Sec. 1 Ln. 6', [121.4345, 25.1730], 'V24'), s('真理街', 'Zhenli St', [121.4365, 25.1722], 'V23'), s('觀潮廣場', 'Guanchao Plaza', [121.4405, 25.1700], 'V22'),
          at('淡水', [121.4453, 25.1679], 'V21')] },
    ] }),
  N({ id: 'ankeng', code: 'K', name: 'Ankeng Light Rail', nameLocal: '安坑輕軌', color: '#C3B091', mode: 'lrt', opened: 2023,
    sources: ['osm', 'ntmetro', 'wiki-colors', 'cna-ankeng'],
    description: 'Shuangcheng - Shisizhang, opened 2023-02-10. No extension in any adopted plan.',
    segments: [{ rel: 15443526, year: 2023 }] }),
  N({ id: 'sanying', code: 'LB', name: 'Sanying Line', nameLocal: '三鶯線', color: '#79BCE8', mode: 'metro', opened: 2026,
    sources: ['osm', 'ntmetro', 'wiki-colors', 'storm-sanying', 'cna-sanying-bade', 'ltn-sanying-bade'],
    description: 'Dingpu - Yingtao Fude (14.29 km, elevated, medium capacity) opened 2026-06-30. Bade extension (4.03 km, 3 stations to Danan on the Taoyuan Green Line): comprehensive plan approved 2025-08-01; a start ceremony was held 2026-11-13 but only drilling and test pits follow (site works from 2027), so it is shown as approved; target 2034. Extension station names provisional.',
    segments: [
      { rel: 21066080, year: 2026 },
      { status: 'approved', year: 2034, label: 'Bade extension, LB12-LB14 (approved; ceremony 2026-11-13, works from 2027; target 2034)',
        stops: [at('鶯桃福德', [121.3300, 24.9590]), s('八德轉運站', 'Bade Transfer Station', [121.3190, 24.9590], 'LB12a'), s('豎啣埤', 'Shuxianpi', [121.3060, 24.9580], 'LB13'),
          s('大湳', 'Danan', [121.2945, 24.9580], 'LB14')] },
    ] }),
  N({ id: 'keelung-mrt', code: 'KL', name: 'Keelung MRT', nameLocal: '基隆捷運', color: '#1E90FF', mode: 'metro', status: 'approved', opened: 2033,
    sources: ['cna-keelung', 'chinatimes-keelung', 'housefeel-keelung', 'wiki-colors'],
    description: 'Nangang - Badu, 15.6 km medium-capacity line built by New Taipei. Comprehensive plan approved 2024-01-31; only a small advance-works site (Baifu, from 2025-12-30) so far and the main tenders are being re-run; the cost estimate (NT$126 bn) exceeds the approved NT$69.7 bn, so a revised plan is needed. Target 2033. Shares Zhangshuwan - Xizhi District Office with the Xidong section. Phase 2 Badu - Keelung (proposed, route undecided) not drawn. No official colour (map colour). Station names provisional.',
    segments: [
      { status: 'approved', year: 2033, label: 'Phase 1 Nangang - Badu (approved, target 2033)',
        stops: [at('南港', [121.6068, 25.0532]), at('南港展覽館', [121.6170, 25.0555]), s('南陽大橋', 'Nanyang Bridge', [121.6250, 25.0575], null, { osmRef: 'SB33' }),
          s('樟樹灣', 'Zhangshuwan', [121.6385, 25.0640]), at('汐科', [121.6440, 25.0625]), s('汐止區公所', 'Xizhi District Office', [121.6555, 25.0650]),
          s('保長坑', 'Baochangkeng', [121.6690, 25.0730]), s('北五堵', 'North Wudu', [121.6790, 25.0790]), at('百福', [121.6880, 25.0805]),
          s('六堵', 'Liudu', [121.7000, 25.0850]), at('七堵', [121.7140, 25.0935]), at('八堵', [121.7285, 25.1080])] },
    ] }),
  N({ id: 'shenkeng-lrt', code: 'S', name: 'Shenkeng Light Rail', nameLocal: '深坑輕軌', color: '#CC7722', mode: 'lrt', status: 'planned',
    sources: ['ltn-shenkeng', 'bella-shenkeng'],
    description: 'Taipei Zoo - Beishen Road, 5.81 km, 5 stations. Feasibility approved; the comprehensive plan is with the Executive Yuan awaiting approval (no target year; "six years after approval"). No official colour (map colour). Stops approximate.',
    segments: [
      { status: 'planned', label: 'S1-S5 (comprehensive plan awaiting approval)',
        stops: [zoo, s('木柵路', 'Muzha Rd', [121.5890, 24.9975], 'S2'), s('深坑老街', 'Shenkeng Old Street', [121.6010, 24.9990], 'S3'), s('深坑', 'Shenkeng', [121.6090, 24.9995], 'S4'),
          s('北深路', 'Beishen Rd', [121.6170, 25.0040], 'S5')] },
    ] }),
  N({ id: 'wugu-taishan-lrt', code: 'F', name: 'Wugu-Taishan Light Rail', nameLocal: '五股泰山輕軌', color: '#E5007F', mode: 'lrt', status: 'planned',
    sources: ['udn-wutai', 'housefeel-wutai'],
    description: 'Fenziwei (Circular North) - Luzhou - Wugu - Wenzaizhen, 11.64 km, 14 stations. Feasibility approved, environmental review passed 2026-03-04, comprehensive plan awaiting Executive Yuan approval (press estimates 2032-2035; no official year). No official colour (map colour). Station names provisional.',
    segments: [
      { status: 'planned', label: 'F1-F14 (comprehensive plan awaiting approval)',
        stops: [s('分子尾', 'Fenziwei', [121.4850, 25.0790], 'F1'), s('樓厝', 'Louzuo', [121.4790, 25.0880], 'F2'), s('水湳', 'Shuinan', [121.4740, 25.0920], 'F3'),
          s('和尚港', 'Heshanggang', [121.4700, 25.0950], 'F4'), at('蘆洲', [121.4655, 25.0930], 'F5'), s('成子寮', 'Chengziliao', [121.4545, 25.0920], 'F6'),
          s('西雲寺', 'Xiyun Temple', [121.4475, 25.0895], 'F7'), s('洲子洋', 'Zhouziyang', [121.4430, 25.0800], 'F8'), s('五股', 'Wugu', [121.4390, 25.0730], 'F9'),
          s('水碓', 'Shuidui', [121.4360, 25.0660], 'F10'), s('楓樹腳', 'Fengshujiao', [121.4320, 25.0590], 'F11'), s('坡雅頭', 'Poyatou', [121.4365, 25.0540], 'F12'),
          s('義學', 'Yixue', [121.4400, 25.0500], 'F13'), s('塭仔圳', 'Wenzaizhen', [121.4460, 25.0470], 'F14')] },
    ] }),

  // ---------------- Taoyuan Metro ----------------
  Y({ id: 'airport-mrt', code: 'A', name: 'Taoyuan Airport MRT', nameLocal: '桃園機場捷運', color: '#8246AF', opened: 2017,
    sources: ['osm', 'tymetro', 'wiki-colors', 'ey-a23', 'udn-a14'],
    description: 'Taipei Main Station - Huanbei opened 2017-03-02; Laojie River (A22) 2023-07-31. Extension to Zhongli Station (A23, co-built with the underground TRA station) under construction, target July 2028. A14 Airport Terminal 3 station (between A13 and A14a) is under construction for end-2027 and is not drawn.',
    segments: [
      { rel: 2108764, to: '環北', year: 2017 },
      { rel: 2108764, from: '環北', year: 2023 },
      { status: 'construction', year: 2028, label: 'A22-A23 Zhongli extension (construction, target July 2028)',
        stops: [at('老街溪', [121.2333, 24.9617]), at('中壢車站', [121.2258, 24.9535], 'A23')] },
    ] }),
  Y({ id: 'taoyuan-green', code: 'G', name: 'Taoyuan Green Line', nameLocal: '桃園捷運綠線', color: '#62A033', status: 'construction', opened: 2026,
    sources: ['wiki-colors', 'bt-green', 'newtalk-green', 'bella-green-zhongli'],
    description: 'Bade - Taoyuan Station - Luzhu - Airport City, 27.8 km. North stretch G11-G15b is complete but not open (inspections pending as of mid-Oct 2026; city target still end of 2026). G08-G10 target 2028, G01-G07 2030, Airport City section G15b-G19 end-2032 (low confidence). Zhongli extension (Zhongli Station - G01, ~7.2 km) works since 2026-08-26, target 2031. Daxi extension (proposed) not drawn. English names are unofficial.',
    segments: [
      { status: 'construction', year: 2030, label: 'G01-G07 (construction, target 2030)',
        stops: [s('建德興豐', 'Jiande Xingfeng', [121.2660, 24.9440], 'G01'), s('仁德公園', 'Rende Park', [121.2760, 24.9470], 'G02'), s('巧克力', 'Chocolate', [121.2850, 24.9530], 'G03'),
          s('大湳', 'Danan', [121.2945, 24.9580], 'G04'), s('小大湳', 'Xiao Danan', [121.2985, 24.9665], 'G05'), s('陽明運動公園', 'Yangming Sports Park', [121.3040, 24.9760], 'G06'),
          at('桃園車站', [121.3135, 24.9890], 'G07')] },
      { status: 'construction', year: 2028, label: 'G07-G11 (construction, target 2028)',
        stops: [at('桃園車站', [121.3135, 24.9890]), s('景福宮', 'Jingfu Temple', [121.3110, 24.9935], 'G08'), s('中正力行', 'Zhongzheng Lixing', [121.3070, 24.9990], 'G09'),
          s('中正大興', 'Zhongzheng Daxing', [121.3035, 25.0060], 'G10'), s('藝文特區', 'Arts District', [121.3005, 25.0145], 'G11')] },
      { status: 'construction', year: 2026, label: 'North stretch G11-G15b (complete, awaiting inspection; target end-2026)',
        stops: [s('藝文特區', 'Arts District', [121.3005, 25.0145]), s('蘆興埤', 'Luxingpi', [121.2970, 25.0225], 'G12'), s('南竹中正北', 'Nanzhu Zhongzheng North', [121.2935, 25.0330], 'G13'),
          s('蘆竹中正北', 'Luzhu Zhongzheng North', [121.2920, 25.0440], 'G14'), s('水尾', 'Shuiwei', [121.2780, 25.0530], 'G15'), s('菓林', 'Guolin', [121.2620, 25.0560], 'G15a'),
          at('坑口', [121.2665, 25.0865], 'G15b')] },
      { status: 'construction', year: 2032, label: 'Airport City section G15b-G19 (partly under construction, target end-2032)',
        stops: [at('坑口', [121.2665, 25.0865]), s('航空城G16', 'Airport City G16', [121.2350, 25.0620], 'G16', { id: 'taoyuan-green-g16' }),
          s('航空城G17', 'Airport City G17', [121.2250, 25.0560], 'G17', { id: 'taoyuan-green-g17' }), s('航空城G18', 'Airport City G18', [121.2150, 25.0500], 'G18', { id: 'taoyuan-green-g18' }),
          s('航空城G19', 'Airport City G19', [121.2045, 25.0400], 'G19', { id: 'taoyuan-green-g19' })] },
      { status: 'construction', year: 2031, label: 'Zhongli extension, Zhongli Station - G01 (construction since 2026-08, target 2031)',
        stops: [at('中壢車站', [121.2275, 24.9550]), s('中壢運動公園', 'Zhongli Sports Park', [121.2309, 24.9455], null, { osmRef: 'GE05a' }), s('中山東路二段', 'Zhongshan E. Rd Sec. 2', [121.2419, 24.9500], null, { osmRef: 'GE04a' }),
          s('富台國小', 'Futai Elementary School', [121.2521, 24.9400], null, { osmRef: 'GE03a' }), s('慈安三村', "Ci'an 3rd Village", [121.2594, 24.9346], null, { osmRef: 'GE02a' }), s('崁頂路', 'Kanding Rd', [121.2683, 24.9308], null, { osmRef: 'GE01' }),
          s('建德興豐', 'Jiande Xingfeng', [121.2660, 24.9440])] },
    ] }),
  Y({ id: 'taoyuan-brown', code: 'BR', name: 'Taoyuan Brown Line', nameLocal: '桃園捷運棕線', color: '#824729', status: 'construction', opened: 2032,
    sources: ['wiki-colors', 'ltn-brown', 'ctee-brown', 'udn-brown'],
    description: 'Taoyuan Station - Huilong, 11.38 km. Comprehensive plan approved 2024-03-01; advance works (utility relocation, overpass demolition) since ~July 2026, E&M contract awarded 2026-07-27, main civil works being tendered. Target 2032. BR03 reserved; station names provisional.',
    segments: [
      { status: 'construction', year: 2032, label: 'BR08-BR01 (advance works, target 2032)',
        stops: [at('桃園車站', [121.3135, 24.9890], 'BR08'), s('市立體育場', 'City Stadium', [121.3280, 24.9930], 'BR07'), s('萬壽路二段大同路', 'Wanshou Rd / Datong Rd', [121.3430, 24.9955], 'BR06'),
          s('萬壽路二段華美街', 'Wanshou Rd / Huamei St', [121.3560, 24.9990], 'BR05'), s('東萬壽路寶石街', 'E. Wanshou Rd / Baoshi St', [121.3720, 25.0050], 'BR04'),
          s('萬壽路一段龍華街', 'Wanshou Rd / Longhua St', [121.3990, 25.0185], 'BR02'), at('迴龍', [121.4118, 25.0221], 'BR01')] },
    ] }),

  // ---------------- TRA ----------------
  T({ id: 'tra-western', name: 'Western Line', nameLocal: '縱貫線', color: '#090980', opened: 1891,
    description: 'TRA Western Trunk Line: Keelung - Taipei 1891, Taipei - Hsinchu 1893; underground through Taipei (1989-2011). Clipped at the map edge west of Yangmei. TRA has no official line colours (TRA navy used).',
    segments: [
      { graph: 'tra', auto: true, from: '基隆', to: '台北', year: 1891 },
      { graph: 'tra', auto: true, from: '台北', to: '新竹', year: 1893 },
    ] }),
  T({ id: 'tra-taoyuan-underground', name: 'Taoyuan Railway Underground Project', nameLocal: '桃園鐵路地下化', color: '#5B6DC4', status: 'construction', opened: 2034,
    sources: ['osm', 'tra', 'cna-zhongyuan', 'cna-pingzhen'],
    description: 'Moves 17.95 km of the Western Line (Fengming - Pingzhen) underground and adds infill stations Zhonglu, Taoyuan Hospital and Zhongyuan (under construction; the railway bureau gives 2033 for the tunnel and 2034 for the new stations, one report says Zhongyuan end-2030). Temporary Fengming (2024-11-30) and Pingzhen (2026-10-03) stations are already open. New station positions approximate. Colour chosen for the map.',
    segments: [
      { status: 'construction', year: 2034, graph: 'tra', label: 'Underground with infill stations (construction, target 2033-2034)',
        stops: [at('鳳鳴', [121.3460, 24.9700]), at('桃園', [121.3135, 24.9890]), s('中路', 'Zhonglu', [121.2960, 24.9800], null, { id: 'zhonglu-tra' }),
          s('桃園醫院', 'Taoyuan Hospital', [121.2820, 24.9760]), at('內壢', [121.2580, 24.9725]), s('中原', 'Zhongyuan', [121.2420, 24.9640], null, { id: 'zhongyuan-tra' }),
          at('中壢', [121.2260, 24.9536]), s('平鎮', 'Pingzhen', [121.2090, 24.9440])] },
    ] }),
  T({ id: 'tra-yilan', name: 'Yilan Line', nameLocal: '宜蘭線', color: '#3D7CC9', opened: 1924,
    description: 'Badu - Ruifang - Sandiaoling (completed to Su\'ao 1924), clipped at the map edge. Colour chosen for the map.',
    segments: [{ graph: 'tra', auto: true, from: '八堵', to: '福隆', year: 1924 }] }),
  T({ id: 'tra-pingxi', name: 'Pingxi Line', nameLocal: '平溪線', color: '#E5A11C', opened: 1921,
    description: 'Sandiaoling - Jingtong branch (opened 1921 as a coal railway). Colour chosen for the map.',
    segments: [{ graph: 'tra', auto: true, from: '三貂嶺', to: '菁桐', year: 1921 }] }),
  T({ id: 'tra-shenao', name: "Shen'ao Line", nameLocal: '深澳線', color: '#2BA3A6', opened: 2014,
    description: "Ruifang - Badouzi branch; passenger service restored 2014 (to Haikeguan) and extended to Badouzi 2016. Colour chosen for the map.",
    segments: [{ graph: 'tra', auto: true, from: '瑞芳', to: '八斗子', year: 2014 }] }),

  // ---------------- THSR ----------------
  { id: 'thsr', name: 'Taiwan High Speed Rail', nameLocal: '台灣高鐵', group: 'thsr', mode: 'shinkansen', color: '#C35617', opened: 2007,
    sources: ['osm', 'thsr', 'bnext-yilan', 'storm-yilan'],
    description: 'Taipei/Banqiao - Zuoying opened 2007, Nangang 2016; shown to Hsinchu. Yilan extension (Nangang - Yilan, ~60.6 km, mostly tunnel, one new station): comprehensive plan approved by the Executive Yuan 2026-07-23, construction expected from 2029, opening 2036-2037 (sources differ; 2036 shown). Yilan station position approximate. Colour: THSR brand orange (no official line colour).',
    segments: [
      { graph: 'hsr', via: ['南港', '台北'], year: 2016 },
      { graph: 'hsr', via: ['台北', '板橋', '桃園', '新竹'], year: 2007 },
      { status: 'approved', year: 2036, label: 'Yilan extension (approved 2026-07, target 2036-2037)',
        stops: [at('南港', [121.6068, 25.0532]), s('高鐵宜蘭', 'Yilan HSR Station', [121.7470, 24.7270], null, { id: 'thsr-yilan' })],
        path: [[121.6068, 25.0532], [121.66, 24.98], [121.72, 24.86], [121.747, 24.727]] },
    ] },
];
