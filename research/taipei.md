# Taipei dataset notes

Built by `npm run data:taipei`: `node scripts/taiwan/build.mjs taipei` reads the curated spec [scripts/taiwan/taipei.mjs](../scripts/taiwan/taipei.mjs), fetches OpenStreetMap data through Overpass (cached in `scripts/taiwan/.cache/`, git-ignored) and writes `public/data/taipei.json` plus its `cities.json` entry. The pipeline is shared with Taichung, Tainan and Kaohsiung. Data accessed 2026-11-14.

## Why one "Taipei" map for four cities
Taipei, New Taipei, Keelung and Taoyuan form one commuter region: the Airport MRT, the Circular Line, the Sanying Line (now reaching Taoyuan's Bade) and the Keelung MRT all cross city borders, so they are one map, like Tokyo includes Yokohama. Taichung, Tainan and Kaohsiung are separate maps 100-300 km away; the app offers the switch when you pan between them.

## How the data is made
- **Metro / LRT (operating):** OSM route relations (one direction each), cut into sections by station name to carry opening years. Station codes come from the stop `ref` tags.
- **TRA:** shortest path on the OSM 1067 mm track network between two named stations; every TRA station node on that path becomes a stop; the run is clipped to the map box (lng 121.10-121.85, lat 24.85-25.30).
- **THSR:** listed stations, path routed on the high-speed track. Shown to Hsinchu (one station beyond the box).
- **Danhai Blue Coast branch:** the OSM relations only hold one stop, so the four stops are listed and the path is routed on the light-rail track.
- **Future lines:** curated stops. Where OSM already maps the construction / planned station (by code, e.g. `LG08A`, `SB13/SB34`, `G15a`, or by name), that position is used (48 stops); the rest are estimates from the published station sites and are marked `approx`.
- **Interchanges:** same name within ~450 m is one station; names are matched ignoring 臺/台, the 車站/站 suffix and a 捷運/高鐵 prefix, so 臺北 (TRA), 台北 (THSR), 台北車站 (MRT, Airport MRT) are one `taipei-main-station`; 高鐵桃園站 (A18) joins THSR Taoyuan. Checked hubs: Taipei Main Station (R, BL, A, TRA, THSR), Banqiao (BL, Y, TRA, THSR), Nangang (BL, TRA, THSR, Keelung MRT), Taoyuan (TRA, Green G07, Brown BR08, Taoyuan underground project), Zhongli (TRA, A23, Green extension), Huilong (O, LG21, BR01), Dapinglin (G, Y), Taipei Zoo (BR, Y, Shenkeng LRT).

## Upcoming projects (status as of 2026-11-14)
| Project | Status | Year | Evidence |
|---|---|---|---|
| Xinyi Line east extension (Xiangshan - Guangci/Fengtian Temple) | operating | 2026 | opened 2026-08-30 (Storm Media) |
| Sanying Line LB01-LB12 | operating | 2026 | opened 2026-06-30 |
| Sanying Bade extension LB12-LB14 (4.03 km) | approved | 2034 | comprehensive plan approved 2025-08-01; start ceremony 2026-11-13 but only drilling/test pits, site works from 2027 (CNA, LTN 2026-11-13) |
| Circular Line South (Zoo - Dapinglin) and North (New Taipei Industrial Park - Jiannan Rd) | construction | 2031 | approved 2019-05-31; all civil contracts under way, 34.4% end Oct 2026 (Housefeel, Newtalk) |
| Circular Line East (Jiannan Rd - Zoo, 13.25 km) | construction | 2032 | approved 2023-03-29; CF763 since late 2024, CF710/CF720 2026 |
| Wanda-Zhonghe-Shulin phase 1 (CKS Memorial Hall - Juguang) | construction (system testing) | 2027 | DORTS / press; June vs end-2027 conflict |
| Wanda-Zhonghe-Shulin phase 2 (Juguang - Huilong, 13.3 km) | construction | 2031 | ~45% mid-2026; New Taipei asks for 2030 |
| Minsheng-Xizhi: Xidong section (Donghu - Xizhi District Office) | construction | 2032 | approved 2023-01-13, works since 2025-03-20 |
| Minsheng-Xizhi: Taipei section (Dadaocheng - Donghu) | planned | - | comprehensive plan resubmitted 2024-12-27, not approved |
| Keelung MRT phase 1 (Nangang - Badu, 15.6 km) | approved | 2033 | approved 2024-01-31; only a small advance-works site (Baifu, 2025-12-30); cost overrun needs a revised plan |
| Danhai LRT phase 2 (Fisherman's Wharf - Tamsui, 3.32 km) | approved | 2030 | 2013 network approval; revised riverside alignment with the National Development Council since 2026-10-29 ("planned" also defensible) |
| Shenkeng LRT (Zoo - Beishen Rd, 5.81 km) | planned | - | comprehensive plan awaiting Executive Yuan approval |
| Wugu-Taishan LRT (Fenziwei - Wenzaizhen, 11.64 km) | planned | - | EIA passed 2026-03-04, comprehensive plan awaiting approval |
| Airport MRT A23 Zhongli Station | construction | 2028 | Executive Yuan target July 2028 |
| Airport MRT A14 Terminal 3 | construction | 2027 | not drawn (infill between A13 and A14a); in notes |
| Taoyuan Green Line north stretch G11-G15b | construction (complete, not open) | 2026 | inspections pending mid-Oct 2026; city target end-2026 |
| Taoyuan Green Line G08-G10 / G01-G07 / G15b-G19 | construction | 2028 / 2030 / 2032 | city schedule; Airport City section low confidence |
| Taoyuan Green Line Zhongli extension (6 stations) | construction | 2031 | works since 2026-08-26 |
| Taoyuan Brown Line (Taoyuan - Huilong, 11.38 km) | construction | 2032 | approved 2024-03-01; advance works since ~July 2026 |
| Taoyuan railway undergrounding with new Zhonglu, Taoyuan Hospital, Zhongyuan stations | construction | 2034 | Railway Bureau: tunnel 2033, new stations 2034 (CNA said Zhongyuan end-2030) |
| THSR Yilan extension (Nangang - Yilan) | approved | 2036 | Executive Yuan 2026-07-23; opening reported 2036 or end-2037 |

Proposed and not drawn: Green Line Daxi extension, Taoyuan Orange Line, Shezi / Beitou-Shilin LRT, Taishan-Banqiao LRT, Zhonghe-Guangfu line, Danhai extension to Bali, Keelung MRT phase 2 (Badu - Keelung, route undecided).

## Colours
Taipei Metro BR #C48C31, R #E3002C, G #008659 (Xiaobitan branch drawn in the line colour), O #F8B61C, BL #0070BD, Y #FFDB00, LG #A1D884, SB #25AAE1; Danhai V #E5554F, Ankeng K #C3B091, Sanying LB #79BCE8; Airport MRT #8246AF; Taoyuan Green #62A033, Brown #824729. These are the values in the operators' diagrams as collected in the Wikipedia station modules; no official hex specification was found. Keelung MRT (#1E90FF), Shenkeng (#CC7722) and Wugu-Taishan (#E5007F) have no official colour. TRA and THSR have no line colours: TRA Western Line navy #090980 with other blues/teal for branches, THSR orange #C35617.

## Uncertainties
- Future station positions: those placed from OSM construction nodes are as good as OSM; the others are estimates (some "approx-low", possibly >500 m off: Wanda phase 2, Keelung MRT east of Xizhi, Taoyuan Airport City G16-G19, Brown Line, Shenkeng and Wugu-Taishan LRT).
- Circular Line future station codes: two numbering schemes circulate (engineering Y1A... vs sequential Y01...), so none are shown.
- English names of future stations are mostly unofficial romanisations of working names.
- Opening years of early Taipei Metro sections are from memory of the opening history and rounded to the year.
- Wanda LG11 "Tucheng" (Jincheng Park) sits ~230 m from Bannan Haishan in this data but is kept as its own station (site not fixed).
