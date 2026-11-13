# Taichung dataset notes

Built by `npm run data:taichung` (`node scripts/taiwan/build.mjs taichung`, spec in [scripts/taiwan/taichung.mjs](../scripts/taiwan/taichung.mjs)); same pipeline as Taipei (see [taipei.md](taipei.md)). Data accessed 2026-11-14.

## Coverage
- Box: lng 120.45-120.85, lat 23.95-24.42 (Taichung, Changhua, Yuanlin). THSR shown Miaoli - Taichung - Changhua.
- Taichung MRT Green Line from its OSM route relation; TRA Mountain Route (Tongluo edge - Taichung - Changhua - Yuanlin), Coast Route (Yuanli edge - Dajia - Shalu - Zhuifen - Changhua), Chengzhui link and THSR routed on the OSM track network.
- **Interchanges:** HSR Taichung / Xinwuri (THSR + TRA Xinwuri + Green Line terminus, merged explicitly), Taichung station (TRA + future Blue B19 / Orange O16), Songzhu and Daqing (TRA + Green Line), Taichung City Hall (Green + Blue B14), Wenxin Zhongqing (Green + Orange O11), Jiushe (Green + Dakeng extension), Shalu (TRA + Blue B04), Changhua (TRA, THSR is a separate station).

## Upcoming projects (status as of 2026-11-14)
| Project | Status | Year | Evidence |
|---|---|---|---|
| Blue Line B01-B03 (Taichung Port - Dazhuang) | construction | 2034 | comprehensive plan approved 2024-01-29; BC11 works started 2026-08-12 (LTN) |
| Blue Line B03-B08 (elevated) | approved | 2034 | BC12 signed 2026-10-06, works not confirmed |
| Blue Line B08-B20 (underground) | approved | 2034 (press: 2036) | not tendered; ~NT$130 bn budget gap (UDN 2026) |
| Blue Line Taiping extension | proposed | - | feasibility resubmitted 2026-03-20 |
| Green Line extension to Dakeng (2.47 km, 2 stations) | planned | - | feasibility approved 2024-01-31; comprehensive plan sent 2026-02-26, MOTC first-round comments Sept 2026 |
| Green Line extension to Changhua (7.58 km, 6 stations) | planned | - | same; waits on the Changhua East urban plan |
| Orange (Airport) Line (29.23 km, 26 stations) | planned | - (media ~2042) | feasibility approved in principle 2026-08-18 |

Not drawn: Taichung Red Line (Chongde - Fengyuan, feasibility study), Orange Line coast extension (study), Taichung mountain-coast rail loop 山海環線 and Changhua railway elevation (feasibility stage), Changhua LRT, Taiping-Dali-Wufeng lines (concepts).

## Colours
Green #8EC31C, Blue #0093D8, Orange #FCA311 (values from Taichung MRT diagrams as collected in the Wikipedia station modules). TRA Mountain Route navy #090980, Coast Route blue, Chengzhui teal (chosen); THSR orange #C35617.

## Uncertainties
- Green Line extension station counts differ between the 2024 feasibility study (2 + 5 stations) and the 2026 comprehensive plan (8 stations, possibly with a new G20a); the media list (6 Changhua stations) is drawn.
- Most Blue and Orange station names are working names; Orange Line positions are rough (about 1 km).
- Green Line station codes are the numeric ones in OSM (103a-119); 2026 city releases use G-codes again.
