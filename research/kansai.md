# Osaka · Kyoto (Keihanshin) dataset notes

City id `kansai` ("Osaka · Kyoto", 大阪・京都): one map for Osaka, Kyoto, Kobe, Nara and Ōtsu and the lines between them.
Researched and built 2026-11-14 (OSM data of 2026-11-13; the four route relations noted below come from an older mirror snapshot).

## How it is built

One curated pipeline, like Tokyo's core: `node scripts/kansai/build.mjs` (alias `npm run data:kansai`) reads
[scripts/kansai/lines.mjs](../scripts/kansai/lines.mjs) (lines, segments, years, colours, sources, projects), fetches the
OSM route relations through Overpass (cached in `scripts/kansai/.cache/`, git-ignored), and writes
`public/data/kansai.json` directly. There is no importer layer (`cities/kansai/` does not exist), because Kansai's OSM data
has almost no `route_master` relations: every stopping pattern (local, rapid, express, limited express…) is a separate route
relation, so the generic importer would turn each line into a pile of overlapping services. Instead `lines.mjs` names one
all-stations relation per line and cuts it into dated sections with `from` / `to`.

Builder features added on top of the Tokyo builder (`scripts/kansai/build.mjs`):
- **Merge keys:** stations merge into one interchange when their normalised Japanese names match within 450 m. Before
  matching, operator prefixes are stripped (山陽明石 → 明石, 京阪山科 → 山科, 近鉄丹波橋 → 丹波橋, JR淡路 → 淡路) and aliases
  applied (`NAME_ALIASES`): 大阪梅田 / 梅田 → 大阪, 大阪難波 → なんば, 大阪阿部野橋 / 天王寺駅前 → 天王寺, 三ノ宮 / 神戸三宮 → 三宮,
  なかもず → 中百舌鳥. The four big hubs get fixed ids and names (`HUBS`): `osaka-umeda`, `namba`, `tennoji`, `sannomiya`.
- **Same name, far apart** (JR / Hanshin Amagasaki, JR / Hanshin Nishinomiya, JR / Kintetsu Nara…): kept separate, with the
  operator appended to the id and English name ("Amagasaki (Hanshin)").
- **Cuts in either direction:** a segment's `from` / `to` may be written against the relation's direction; the builder flips it.
- **Curated stops** without coordinates are looked up by name among OSM station nodes (`at(name, near)`), so project lines
  snap to real stations; new stations use `est(...)` and are `approx`.
- **Track relations:** `stopNames` builds a line from a `route=railway` (track) relation plus a curated station list.
- **Fetching:** relations are requested 6 at a time (the public Overpass servers time out on bigger geometry queries),
  every cached relation is reused whatever batch it came in, and `STALE_RELS` are fetched from the kumi.systems mirror first.

## OSM data problem (Nov 2026)
Between the mirror's snapshot and 2026-11-13, the route=train relations of the Keihan lines, the JR Kusatsu and Wakayama
lines and the Kintetsu Kashihara / Yoshino lines were deleted from live OSM (probably a re-mapping in progress). The builder
handles it as follows:
- Keihan Nakanoshima, Keishin, Ishiyama-Sakamoto, JR Kusatsu, Kintetsu Kashihara: the deleted relations, fetched from the
  older kumi.systems mirror (`STALE_RELS`). Once the mirror catches up they will disappear there too: switch these lines to
  their new relations (or to `stopNames` over the track relation) when that happens.
- Keihan Main Line and JR Wakayama Line: gone from both servers, so built from their track relations (1921059, 1864761)
  with the station lists in `lines.mjs`.
- Kintetsu Yoshino Line: not included (mostly south of the map box).

## Coverage
Bounding box lng 134.9 – 136.1, lat 34.3 – 35.15 (Akashi to Ōmi-Hachiman, Kansai Airport to Kurama). Lines are cut at the
last station inside the box.

- 96 lines (91 operating, 1 under construction, 4 planned), 184 segments (171 operating, 3 construction, 8 planned,
  2 proposed), 1,023 stations (8 approximate), `public/data/kansai.json` about 236 KB. Validation: 0 errors, 0 warnings.

| Group (sidebar) | Lines | Stations | Lines |
|---|---|---|---|
| JR > JR West | 20 | 261 | O Loop, A Kyoto / Biwako / Kobe, Wadamisaki, G Takarazuka, H Tōzai and Gakkentoshi, F Osaka Higashi, Q Yamatoji, R Hanwa (+ Higashi-Hagoromo), S Kansai Airport, P Yumesaki (+ Yumeshima, proposed), D Nara, E Sagano, B Kosei, C Kusatsu, U Sakurai, T Wakayama, Naniwasuji Line (construction) |
| JR > Shinkansen | 4 | 7 | Tōkaidō, San'yō, Hokuriku (planned), Chūō (planned) |
| Subway > Osaka Metro | 10 | 115 | M, T, Y, C, S, K, N, I (+ extension, planned), P New Tram, Kita-Osaka Kyuko |
| Subway > Kyoto Municipal Subway | 2 | 32 | K Karasuma, T Tōzai (+ Rakusai extension, planned) |
| Subway > Kobe Municipal Subway | 2 | 26 | S Seishin-Yamate incl. Hokushin, K Kaigan |
| Private > Hankyu | 11 | 92 | Kobe (+ Kobe Kōsoku), Takarazuka, Kyoto, Senri, Imazu, Itami, Kōyō, Minoo, Arashiyama; Naniwasuji / Shin-Osaka links and Osaka Airport Line (planned) |
| Private > Hanshin | 3 | 51 | Main (+ Kobe Kōsoku), Namba, Mukogawa |
| Private > Keihan | 6 | 88 | Main + Ōtō, Nakanoshima (+ Kujō, proposed), Uji, Katano, Keishin, Ishiyama-Sakamoto |
| Private > Kintetsu | 13 | 166 | Nara (+ Namba Line), Ōsaka, Kyoto, Kashihara, Tenri, Ikoma, Tawaramoto, Shigi, Keihanna (+ Takanohara, planned), Minami-Ōsaka, Nagano, Dōmyōji, Gose |
| Private > Nankai | 7 | 84 | Main, Airport, Kōya, Shiomibashi, Takashinohama, Tanagawa, Semboku |
| Private > Sanyo, Shintetsu & Nose | 7 | 86 | Sanyo Main; Shintetsu Arima, Sanda, Ao, Kōen-toshi; Nose Myōken, Nissei |
| Private > Trams & local lines | 7 | 86 | Randen Arashiyama, Kitano; Eizan Main, Kurama; Hankai Hankai, Uemachi; Mizuma |
| Private > Monorail & AGT | 4 | 41 | Osaka Monorail Main (+ Uryūdō extension, construction), Saito; Port Liner, Rokkō Liner |

### Interchanges (lines per station, all operators)
Osaka / Umeda 12 (JR Loop, Kyoto, Kobe, Takarazuka, Osaka Higashi; Midōsuji; Hankyu Kobe, Takarazuka, Kyoto; Hanshin Main;
Naniwasuji and the Hankyu links as projects), Shin-Osaka 8 (JR Kyoto, Osaka Higashi, Tōkaidō and San'yō Shinkansen, Midōsuji;
Hokuriku / Chūō Shinkansen and the Hankyu link as projects), Tennōji / Abenobashi 7, Kyoto 7 (JR Kyoto, Biwako, Nara, Sagano,
Tōkaidō Shinkansen, Karasuma, Kintetsu Kyoto), Namba 7 (Midōsuji, Yotsubashi, Sennichimae, Hanshin Namba, Kintetsu Nara, Nankai
Main and Kōya), Shin-Imamiya 5, Kyōbashi 5, Sannomiya 5 (JR Kobe, Hankyu, Hanshin, Seishin-Yamate, Port Liner), Tsuruhashi 4,
Yamashina 4, Jūsō 4.

Kept separate on purpose (different names, as Tokyo does): Higashi-Umeda (Tanimachi), Nishi-Umeda (Yotsubashi), Kitashinchi
(JR Tōzai) next to Osaka / Umeda; JR Namba and the future Nankai Shin-Namba next to Namba; Sannomiya-Hanadokeimae (Kaigan Line)
next to Sannomiya; Karasuma (Hankyu) / Shijō (Karasuma Line); Kyoto-kawaramachi / Gion-shijō; Kōbe (JR) / Kōsoku-Kōbe.
Same-name stations far apart get the operator in the id and name: Amagasaki, Nishinomiya, Ashiya, Itami, Tsukaguchi, Suita,
Noda, Sumiyoshi (3), Mikage, Uji, Arashiyama, Nagata (3), Kujō (3), Imazato and others.

## Upcoming projects

Status rules applied literally (DATA.md). Items listed in the Kinki Regional Transport Council report No. 8 (2004), the
region's latest official rail plan, are `planned` (as Tokyo treats MLIT report No. 198), even when dormant; the description
says so. Anything only studied or floated is `proposed`.

| Project | Status | Year | Notes | Sources |
|---|---|---|---|---|
| Naniwasuji Line (なにわ筋線): Osaka (Umekita) – Nakanoshima – Nishi-Honmachi – JR Namba / Nankai Shin-Namba – Shin-Imamiya, 7.2 km | construction (since 2021) | 2031 (spring 2031 = end FY2030, kept at the 2026-08-18 cost review, ¥642.5 bn) | JR West + Nankai; intermediate names provisional, positions approx | JR West project page; Osaka Pref.; Tabiris 2026-08-21 |
| Osaka Monorail Kadoma-shi – Uryūdō, 8.9 km, 5 stations | construction (permit 2020-04, works on all sections) | 2033 (FY2033; moved from 2029 in 2024-04, soft ground) | stations provisional (松生町, 門真南, 鴻池新田, 荒本, 瓜生堂); new ones approx | Osaka Pref. 2025-08-21 and R6 evaluation; Norimono News 2023-08-04 |
| Hokuriku Shinkansen Tsuruga – Shin-Osaka | planned (整備計画 1973; Obama–Kyoto route; "Katsuragawa plan" chosen 2026-07-15; no construction approval, EIA unfinished) | none (press: 2050s) | Kyoto station near JR Katsuragawa (~5 km SW of Kyoto Sta.); Matsuiyamate; Shin-Osaka; drawn from Katsuragawa south | Kyodo 2026-07-15; Norimono News 2024-08-07 |
| Chūō Shinkansen Nagoya – Osaka | planned (整備計画 2011; EIA started 2023-12, first document unpublished) | 2037 (government "as early as" target, Cabinet policy 2025; nominal, JR Central has no date) | Nara station site undetermined (approx), Osaka terminal not fixed | Mie/Nara/Osaka request 2026-07; Cabinet Secretariat |
| Hankyu Naniwasuji link (Osaka – Jūsō) and Shin-Osaka link (Jūsō – Shin-Osaka) | planned (report No. 8; 2017 five-party agreement; MLIT 2018 study viable; no permit / EIA) | none (Hankyu 2026-05: waits for the Hokuriku Shinkansen station) | Hankyu also holds a dormant 1961 licence for an older Jūsō – Shin-Osaka scheme; not treated as `approved` | Tabiris 2026-05-23; Norimono News 2018 |
| Hankyu Osaka Airport Line (Sone – Itami Airport) | planned (report No. 8), dormant (MLIT 2018: unprofitable) | none | | Norimono News |
| Imazatosuji Line Imazato – Yuzato-rokuchōme, 6.7 km | planned (report No. 8), BRT trial instead since 2019 | none | no intermediate stations published (straight line) | Osaka City report No. 8 list; BRT evaluation 2026-02 |
| Kyoto Tōzai Line Uzumasa-Tenjingawa – Rakusai, 7.7 km | planned (report No. 8; city "planned line" 2006–07), frozen | none | straight line, terminus approx | Kyoto City 2007 |
| Kintetsu Keihanna Line Gakken-Nara-Tomigaoka – Takanohara, 3.8 km | planned (report No. 8), frozen | none | alternative route to Shin-Hōsono not drawn | Tabiris |
| JR Yumesaki (Sakurajima) Line to Yumeshima via Maishima, ~6 km | proposed (Osaka study 2025-08; JR West / prefecture / city study group since 2026-03) | none (study assumed ~2037) | Maishima station provisional | Osaka Pref. 2025-08-06; Travel Watch 2025-08-07; Kyodo 2026-05-15 |
| Keihan Nakanoshima Line Nakanoshima – Kujō, 2.1 km | proposed (best option in Osaka's 2025 study; Keihan "under study" 2026-05) | none (construction 2030 at the earliest) | | Travel Watch 2025-08-07; Kyodo 2026-05-12 |

Recently opened (operating): Kita-Osaka Kyuko Senri-Chūō – Minoh-Kayano 2024-03-23; Osaka Metro Chūō Line Cosmosquare –
Yumeshima 2025-01-19; JR Osaka Higashi Line Shin-Osaka – Osaka (Umekita underground) 2023-03-18; Kobe Hokushin Line taken
over by the city 2020-06-01; Semboku Rapid Railway merged into Nankai 2025-04-01.

Not drawn (and why): Yotsubashi Line Nishi-Umeda – Jūsō (report No. 8, superseded by the Hankyu Naniwasuji link concept);
Keihan Nakanoshima – Nishikujō – Shin-Sakurajima (report No. 8, superseded by the Kujō option); Kintetsu Nara Line relocation
at the Heijō Palace site (stalled, governor reversed it 2023); Kintetsu Yumeshima through trains (a service over existing
track); Kobe waterfront LRT/BRT (city will "study" it, no route); Kyoto LRT (2005 study only); no extension plans exist for
the Karasuma, Kobe Seishin-Yamate / Kaigan, Port Liner / Rokkō Liner, Sanyo, Shintetsu, Hanshin, Randen, Eizan or Keihan
Ōtsu lines.

## Known gaps and caveats
- **Opening years:** first opening of each section, rounded (several sections were opened in stages over 2–5 years; the
  label says so). Shared-track sections (Osaka – Amagasaki on the Takarazuka Line, Uehommachi – Fuse on the Kintetsu Nara Line,
  Namba – Kishinosato-Tamade on the Kōya Line) carry the year of the track. The Kōya, Semboku, Kashihara, Ikoma, Ishiyama-Sakamoto
  and Ao lines are single segments dated by their first section or completion (see labels).
- **Colours:** Osaka Metro, Kyoto and Kobe subway colours are official; JR West line colours and all private-railway colours
  are approximate. Naniwasuji, Hokuriku / Chūō Shinkansen and Hankyu project colours are chosen for the map.
- **Station codes:** from OSM stop refs, checked against a sequential fit per segment; 332 of 1,023 stations have none (mostly
  where OSM stop nodes lack refs, e.g. JR Kyoto Station, Keihan Main and JR Wakayama stations built from track relations).
  Hanshin codes print as "HS01" (official style "HS 01").
- **Clipped lines:** JR Biwako (to Shinohara), Kusatsu (to Kōsei), Kosei (to Ono), Takarazuka (to Sasayamaguchi), Sagano (to
  Sonobe), Wakayama (to Hashimoto), Hanwa (to the box edge), Nankai Main (to Misaki-kōen), Kōya (to Kii-Shimizu), Kintetsu Ōsaka
  (to Nabari), Sanyo (to Sanyo-Uozumi), JR Kobe (to Uozumi).
- **Missing stations:** 大和新庄 (JR Wakayama Line) has no OSM station node, so the Wakayama Line skips it.
- **Wadamisaki Line** has no OSM route relation and is a straight line between its two stations.
- **Hankai Line:** two stops (Takasu-jinja, Shimmeichō) match the OSM track poorly (stop order in the relation); geometry is fine.
- **English names** follow OSM `name:en` (inconsistent macrons and capitalisation); 新今宮 is fixed in `EN_OVERRIDES`.
- **Not included:** Kintetsu Yoshino Line, JR Kansai Main Line east of Kamo, Kintetsu lines east of Nabari, JR Fukuchiyama Line
  beyond Sasayamaguchi, Hōjō Railway, Sagano Scenic Railway, cable cars and ropeways, limited-express-only services.
- **Refresh:** delete `scripts/kansai/.cache/` and run `npm run data:kansai` (about 20 Overpass requests; the public servers
  were overloaded on 2026-11-14 and needed many retries). Review the diff: OSM route edits can reorder or drop stations, and the
  `STALE_RELS` will eventually disappear from the mirror too.
