# Nagoya · Gifu (Chūkyō) dataset notes

One curated build, `npm run data:nagoya`: `node scripts/nagoya/build.mjs` (Overpass/OSM + curated
[scripts/nagoya/lines.mjs](../scripts/nagoya/lines.mjs)) writes `public/data/nagoya.json` (about 126 KB),
then validates and refreshes `cities.json`. Data accessed 2026-11-14.

Unlike Tokyo there is **no importer layer**. Every operator (JR Central, the Nagoya subway, Meitetsu, Kintetsu
and the third-sector railways) is curated in `lines.mjs`, so interchange merging works the same way across all
of them, and Meitetsu sections get staged opening years. The build script is `scripts/tokyo/build.mjs` with
three additions:
- **Track-only relations.** Some lines exist in OSM only as `route=railway` track relations with no stop members:
  the JR Kansai Line, Yōrō Railway, Tarumi Railway and Nagaragawa Railway. For these, stations are taken from
  `railway=station` nodes within 150 m of the chained track whose `operator`, `network` or `KSJ2:LIN` tag
  matches `stationOp`. `extra` adds named interchange stations that are tagged for another line. `derive`
  does the same for relations whose stop list is incomplete (Kintetsu: Kintetsu Nagoya and most stops missing).
- **Two passes.** OSM segments of every line are built first, then the curated (future) segments. Curated stops
  that are not `approx` snap by name to an existing station within 3 km and keep its OSM position, so a proposed
  extension ending at, say, Meitetsu Shippō joins that station.
- **Registry entry.** The `cities.json` entry is upserted directly; `npm run index` then recomputes its bbox.

## Coverage
- Bounding box: lng 136.5 to 137.26, lat 34.68 to 35.65. Lines are cut at the last station inside the box,
  or by explicit cut points: Kintetsu and the JR Kansai Line at Kuwana, the Chūō Line at Tajimi, the Takayama Line
  at Mino-Ōta. The Tōkaidō Line runs Mikawa-Miya to Tarui, and the Meitetsu Main Line Meitetsu Gifu to Motojuku.
- 45 lines, 102 segments (93 operating, 1 construction, 1 planned, 7 proposed), 534 stations (7 approximate),
  60 interchange stations.

| Group | Lines |
|---|---|
| nagoya-subway (6) | H Higashiyama, M Meijō (loop), E Meikō, T Tsurumai, S Sakura-dōri, K Kamiiida |
| subway-plans (3) | East Line, Kanayama Line, South Line: unbuilt 1992 plan lines, proposed |
| jr-central (8) | CA Tōkaidō, Mino-Akasaka branch, CF Chūō, CJ Kansai, CE Taketoyo, CG Takayama, CI Taita |
| jr-shinkansen (2) | Tōkaidō Shinkansen (Mikawa-Anjō, Nagoya, Gifu-Hashima), Chūō Shinkansen (maglev) |
| meitetsu (19) | NH Main, IY Inuyama, KG Kakamigahara, HM Hiromi, KM Komaki, ST Seto, TA Tokoname + Airport, KC Kōwa + Chita New, CH Chikkō, TB Tsushima, BS Bisai, TH Takehana + Hashima, Mikawa (MY/MU), TT Toyota, GN Nishio + Gamagōri |
| kintetsu (1) | E Nagoya Line (Kintetsu Nagoya – Kuwana) |
| third-sector (7) | AN Aonami, L Linimo, Aichi Loop, Jōhoku, Yōrō, Tarumi, Nagaragawa |

(The jr-central row lists 7 codes; the Mino-Akasaka branch is a separate line without a code.)

- **Interchanges:** stations with the same Japanese name within about 450 m are merged into one id. Checked:
  - Nagoya: H, S, CA, CF, CJ, Tōkaidō Shinkansen, Chūō Shinkansen, AN.
  - Kanayama: M, E, CA, CF, NH, plus the proposed Kanayama Line.
  - Sakae: H, M.
  - Ōzone: M, CF, ST.
  - Kuwana: CJ, Kintetsu, Yōrō.
  - Ōgaki: CA, Mino-Akasaka, Yōrō, Tarumi.
  - Mino-Ōta: CG, CI, Nagaragawa.
  - Inuyama: IY, HM, KM.
  - Gifu: CA, CG.
  - Meitetsu Gifu: NH, KG.
- **Kept separate on purpose** (different station names, as in the Tokyo dataset):
  - Nagoya / Meitetsu Nagoya / Kintetsu Nagoya
  - Gifu / Meitetsu Gifu
  - Sakae / Sakaemachi (Seto Line)
  - Owari-Ichinomiya / Meitetsu Ichinomiya
  - Hatta / Kintetsu Hatta
  - Unuma / Shin-Unuma
  - Kani / Shin-Kani
  - Toyotashi / Shin-Toyota
  - Gifu-Hashima / Shin-Hashima
  - Mikawa-Shiotsu / Gamagōri-Kyōteijō-mae
- **Same name but more than 450 m apart, so separate:** Jōhoku Line Kachigawa (~560 m from JR Kachigawa)
  and Ajiyoshi (~790 m from the Meitetsu station). Their ids are `kachigawa-johoku` and `ajiyoshi-johoku`.
- **Station codes:** taken from OSM stop `ref` tags with the sequential fit from the Tokyo build; the Meijō loop
  uses modulus 28. Many JR stops carry no ref in OSM, so JR codes are sparse.
- **Names:** the 2023 renames are applied: 市役所 → 名古屋城 (Nagoyajō), 中村区役所 → 太閤通 (Taikō-dōri).

## Upcoming projects

Status rules from DATA.md, applied literally.

| Project | Status | Year | Sources |
|---|---|---|---|
| Chūō Shinkansen Shinagawa–Nagoya (285.6 km); in the map: Nagoya → Gifu Prefecture station (Nakatsugawa, outside the box) | construction: the plan was approved in 2014. Nagoya's underground station is being dug, and two shield drives in the 34 km Daiichi Chūkyōken Tunnel are under way (full boring since 2026-01-13) | none. JR Central's last formal statement (2024-03) was "2034 or later". It promised a new date within 2026, which had not been given as of 2026-11-14. The press expects 2036 or later; 2035 is only a cost-calculation assumption | JR Central tunnel progress (2026-11-09); Chunichi 2026-10-28; Nikkei 2026-07; Sakigake 2025-10-29 (cost ¥11 trillion) |
| Chūō Shinkansen Nagoya–Shin-Osaka (~152 km, via Nara) | planned: in the 2011 development plan, environmental assessment since 2023-12. The route is not fixed; the Mie station has three candidate sites in Kameyama | segment has no year. The government's "2037 at the earliest" (June 2025 policy) is mentioned in the label | Mie/Nara/Osaka petition 2026-07-22; Kameyama City 2025-12 |
| Kamiiida Line Heian-dōri – Shinsakae-machi – Marutamachi | proposed (frozen) | none | 1992 report No. 12; Transportation Bureau 2024-03; Norimono News 2024-11-17 |
| Sakura-dōri Line west: Taikō-dōri – Inabaji – Shippō | proposed (frozen) | none | same |
| Sakura-dōri Line east: Tokushige – Toyoake-kita | proposed (frozen) | none | same |
| East Line: Sasashima – Marutamachi – Fukiage – Hoshigaoka – Takabaribashi | proposed (frozen) | none | same |
| Kanayama Line: Toda – Kanayama – Marutamachi – Kurokawa | proposed (frozen). About 7.3 km has had a city-planning decision since 1967, but it is unfunded, so it is not "approved" | none | same |
| South Line: Sakura-hommachi – Ōe – Nagoyakō – Inaei | proposed (frozen) | none | same |
| Aonami Line Kinjō-futō – Centrair (under the bay) | proposed: a Nagoya City study from FY2019, not adopted. Cost about ¥80–200 billion depending on the option | none | Tabiris 2018-09; Norimono News 2019 |

**Why the 1992 lines are "proposed", not "planned".** They come from 運輸政策審議会答申第12号 (1992, target
year 2008), which is still the latest national council report for the Nagoya area. Read literally, that would
make them "planned". However, the plans in force exclude them:
- 名古屋交通計画2030 (adopted 2023-03) contains no rail extension.
- The Transportation Bureau's 経営計画2028 (FY2024–28) contains no new line, and in 2024-03 the bureau said
  any future subway building would need careful judgement given its finances.
- A city committee recommended freezing these lines in 2009.

So they are shown faded as `proposed`, with no year. Their stations and alignments are approximate: straight
lines between the places the report names. Where a place is an existing station (Kanayama, Fukiage,
Hoshigaoka, Kurokawa, Toda, Ōe, Nagoyakō, Inaei, Sakura-hommachi, Shippō, Tokushige, Taikō-dōri,
Heian-dōri), the stop snaps to it.

**Other changes recorded but not drawn:**
- **Meitetsu Hiromi Line, Shin-Kani – Mitake (7.4 km):** the abolition notice was filed on 2026-08-04 and the
  section closes on 2029-04-01 (Chubu District Transport Bureau). It stays `operating`, with the closure in its
  segment labels: the data model has no "closing" status.
- **Meitetsu Nagoya station rebuild:** the contractor withdrew on 2025-12-12 and every date is undecided. The
  president said on 2026-11-11 that a new direction would come within FY2026. This is not a network change.
- **Meitetsu Gamagōri Line:** kept, with local councils paying track costs for 15 years from FY2027.
- **No live projects** were found for:
  - a Linimo extension
  - Aichi Loop double-tracking (sections were done in 2001, 2004 and 2008; none under way now)
  - a JR Kansai Line upgrade
  - a Centrair JR line
  - Toyota or Okazaki LRT

## Not included, and why
- **Yutorito Line (Nagoya Guideway Bus, Ōzone – Obata-ryokuchi):** a guided bus, not rail. Its elevated
  6.5 km section is legally a 軌道 under the Tramway Act. But the vehicles are buses that continue on public
  roads, and the city's BRT plan (page updated 2025-10-17) would remove the guide rails and the Tramway Act
  status. The app has no bus mode.
- **SRT** (Meieki–Sakae, from 2026-02) and **BRT schemes:** buses.
- **Gifu LRT study:** Gifu Prefecture's interim report of 2026-08-24 lists four candidate axes, but the mode is
  still open (LRT, BRT or AGT), with no cost or year. Revisit when a mode is chosen.
- **Outside the area:** Mie lines beyond Kuwana (Kintetsu south of Kuwana, Yokkaichi Asunarou, Sangi, Hokusei,
  Ise Railway), the Meitetsu Toyokawa Line and Toyohashi, freight lines (Nagoya Rinkai Railway, the Meitetsu
  Chikkō freight siding), and the closed Tōkadai Line (2006) and Gifu tram lines (2005).

## Known gaps and caveats
- **Opening years:** each section's first opening year. Years for Meitetsu, Kintetsu, Yōrō, Nagaragawa and the
  older JR lines are those of the predecessor company line, and some are rounded. The Meitetsu Main Line
  staging, the Mikawa mountain section (1920) and the Nishio Line split (1911/1926) are the least certain.
  Subway, Aonami, Linimo, Aichi Loop, Jōhoku, Chita New Line and Airport Line years were checked against ja
  Wikipedia.
- **Colours:** official only for the subway (Higashiyama #FAB123 confirmed; the others approximate), Linimo
  and Aonami.
  - **JR Central:** has no per-line colours (all signs use the corporate orange), so its colours are chosen for
    the map.
  - **Meitetsu:** colours follow its route-map direction groups (Wikipedia approximations), with lighter shades
    to tell lines in one group apart (Kakamigahara and Hiromi vs Inuyama, Chita New vs Kōwa, Bisai vs
    Tsushima, Hashima vs Takehana, Gamagōri vs Nishio).
  - **Meikō Line:** officially shares the Meijō purple; it is drawn darker.
  - **Chūō Shinkansen:** has no colour (teal chosen).
- **Geometry gaps:**
  - The Mino-Akasaka branch path is hand-drawn, because OSM's track relation starts at the Minami-Arao
    junction, not at Ōgaki.
  - The Nagaragawa path is extended about 1.7 km along the shared track to Mino-Ōta.
  - Chūō Shinkansen paths are approximate: the Nagoya → Kasugai → Kani → Nakatsugawa line is hand-drawn,
    and Nagoya → Mie is a straight line.
- **Station positions:** the Chūō Shinkansen Gifu and Mie stations are outside the box and approximate, so the
  `cities.json` bbox is widened to 136.42–137.49.
- **Revisit soon:** JR Central's new maglev opening date (due by the end of 2026) and Meitetsu's Nagoya station
  decision (FY2026).
