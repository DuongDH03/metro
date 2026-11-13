# Tainan dataset notes

Built by `npm run data:tainan` (`node scripts/taiwan/build.mjs tainan`, spec in [scripts/taiwan/tainan.mjs](../scripts/taiwan/tainan.mjs)); same pipeline as Taipei (see [taipei.md](taipei.md)). Data accessed 2026-11-14.

## Why Tainan is included (and Hsinchu is not)
Tainan's Blue Line phase 1 was approved by the Executive Yuan on 2025-10-21 and is out to tender, so it is a real, dated project (target 2033); with the shared Taiwan pipeline the city costs one small spec file. Hsinchu has nothing approved or under construction (a combined Red/Blue line feasibility study is due end-2027), so a Hsinchu map would show only TRA and THSR; it is left out.

## Coverage
- Box: lng 120.10-120.40, lat 22.88-23.20. THSR shown Chiayi - Tainan (Zuoying is on the Kaohsiung map, so the two city areas barely overlap).
- TRA Western Line (Longtian - Tainan - Zhongzhou inside the box), Shalun Line and THSR routed on the OSM track network.
- **Interchanges:** THSR Tainan / Shalun (merged explicitly), Daqiao (TRA + Blue B1), Tainan (TRA + underground infill project).

## Upcoming projects (status as of 2026-11-14)
| Project | Status | Year | Evidence |
|---|---|---|---|
| Blue Line phase 1 (Daqiao - Cultural Center, branch B6 - Rende, 8.39 km monorail) | approved | 2033 | Executive Yuan 2025-10-21 (ETtoday); NT$29.4 bn design-build tender closed 2026-09-29, no award found (CTEE) |
| Blue Line extension Rende - Guiren - THSR Tainan / Guanmiao (15 km) | planned | ~2036 | comprehensive planning; not drawn (no sites) |
| Tainan railway undergrounding (8.23 km) | operating | 2026 | opened October 2026 (The Reporter) |
| New TRA stations Linsen / South Tainan | construction | 2029 / 2030 | same |

## Uncertainties
- Blue Line station sites (B2-B10) are working locations from press graphics; positions up to ~1 km off. B6-B9-B10 branch structure follows zh.wikipedia.
- Opening date of the underground section (2026-10-16/17/18 in sources).
- No published Blue Line colour hex; #0072BC is a generic blue.
