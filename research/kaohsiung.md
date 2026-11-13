# Kaohsiung dataset notes

Built by `npm run data:kaohsiung` (`node scripts/taiwan/build.mjs kaohsiung`, spec in [scripts/taiwan/kaohsiung.mjs](../scripts/taiwan/kaohsiung.mjs)); same pipeline as Taipei (see [taipei.md](taipei.md) for how data is made). Data accessed 2026-11-14.

## Coverage
- Box: lng 120.15-120.55, lat 22.45-22.92 (Kaohsiung plus the Pingtung commuter corridor to Chaozhou). THSR is shown to Tainan (one station beyond).
- KMRT Red and Orange lines and the Circular LRT from OSM route relations; TRA Western Line (to the box edge at Zhongzhou) and Pingtung Line (to Chaozhou) and THSR routed on the OSM track network.
- **Interchanges:** Kaohsiung Main Station (R11 + TRA + proposed THSR extension), Formosa Boulevard (R10/O5), Zuoying / Xinzuoying (R16 + THSR + TRA Xinzuoying, merged explicitly), Kaisyuan / Cianjhen Star (R6/C3), Sizihwan / Hamasen (O1/C14), Aozihdi / Heart of Love River (R13/C24, 130 m apart), Museum of Fine Arts (TRA) / C20, Science and Technology Museum (TRA/C30), Gushan (TRA/C18), Minzu (TRA/Y10), Zhengyi (TRA/Y17), Fongshan (TRA/O12), Ciaotou (TRA/R23), Gangshan (TRA/RK1). TRA's old Zuoying (Jiucheng) station is separate from Xinzuoying.

## Upcoming projects (status as of 2026-11-14)
| Project | Status | Year | Evidence |
|---|---|---|---|
| Red Line RK1 Gangshan | operating | 2024 | opened 2024-06-30 |
| Gangshan-Lujhu phase 2A (RK1-RK6, ~8 km) | construction | 2029 | works 38.3% on 2026-09-15; target end-2029 (slipped from 2027) (UDN 2025-10, CNA 2026-10-07) |
| Gangshan-Lujhu phase 2B (RK6-RK8, 3.9 km) | approved | 2031 | plan approved 2023-04; main works not started |
| Siaogang-Linyuan line (RL1-RL7, ~11.6 km) | construction | 2034 | works since 2023-11-14; last civil contract groundbreaking 2026-10-22 (CNA) |
| Yellow Line priority section (Y1-Y5, Y5-Y16-Y18) | construction | 2032 | comprehensive plan approved 2022-03; civil works from 2023-12; site works at Y1-Y5, Y16-Y18 |
| Yellow Line rest (Y5-Y15, Y18-Y23) | approved | 2034 | contracted, but station-by-station site works not confirmed, so not counted as construction |
| Circular LRT | operating (loop) | 2015-2024 | loop closed 2024-01-01 (CNA 2023-12-31) |
| THSR extension to Pingtung (Zuoying - Kaohsiung - Liukuaicuo, 26.2 km) | proposed | ~2039 | second-stage EIA; comprehensive plan ~2028 (PTS) |

Not drawn (no fixed alignment or stations): Purple Line (feasibility under MOTC review), Red Line extension Linyuan - Linbian (Pingtung, feasibility under review), Yellow Line Cianjhen fishing-port spur (Y24-Y25, under evaluation).

## Colours
Red #E20B65, Orange #FAA73F, Circular LRT #7CBD52, Yellow #FFC100 (values from KRTC diagrams as collected in the Wikipedia station modules). TRA navy #090980 (Western Line) and a second blue for the Pingtung Line; THSR orange #C35617; TRA and THSR have no official line colours.

## Uncertainties
- Circular LRT is one segment dated 2015 (the loop opened in stages 2015-2024; phase-2 stage dates not split).
- Future station names (RK2-RK8, RL1-RL7, most Yellow Line stations) are working names with translated English; positions are estimates, some about 1 km off.
- Yellow Line length is 22.9 km (city) vs 25.4 km (Wikipedia infobox).
- Orange Line O3 does not exist (never built); OSM numbering is followed.
