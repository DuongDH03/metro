# Singapore: research notes (2026-11-14)

Built by the importer (`npm run import -- singapore`) from `cities/singapore/city.config.json`:
operating lines come from OpenStreetMap (adapter `scripts/import/osm.ts`), upcoming lines are
hand-drawn in `cities/singapore/future.geojson`.

## OSM tagging (as found)

- MRT route relations: `route=subway`, `network=Mass Rapid Transit`, operators `SMRT Trains` /
  `SBS Transit` / `SMRT`. Route masters exist for NSL, EWL, NEL, CCL, DTL, TEL (+ JRL, tagged
  `construction=subway`; one JRL route has `network=Singapore Rail`).
- LRT: `network=Singapore Rail`; Sengkang is `route=light_rail`, Punggol and Bukit Panjang are
  mapped as `route=monorail`. Sentosa Express: `network=Sentosa`, `route=monorail`.
- Changi Airport Skytrain has no network tag (not imported).
- `colour` and `ref` (NSL, EWL, ..., BPLRT) are on every route_master, so no colour/code overrides were needed; station codes come from station `ref` tags (filtered per line).
- CCL routes are already mapped as a full loop (CCL6 opened 12 Jul 2026) plus the
  Dhoby Ghaut – Promenade spur.
- JRL is excluded from the OSM import (construction; staged dates are curated in future.geojson).

## Upcoming lines (future.geojson)

| Line / stage | Status | Year | Notes |
|---|---|---|---|
| TEL Stage 5 Bayshore – Bedok South – Sungei Bedok | construction | 2026 | opening 26 Dec 2026 (AsiaOne, 4 Nov 2026) |
| TEL extension Sungei Bedok – Changi T5 (TE32) | planned | – | with T5, mid-2030s |
| DTL3e Expo – Xilin – Sungei Bedok | construction | 2026 | opens with TEL5, 26 Dec 2026 |
| DTL2e Bukit Panjang – Sungei Kadut | construction | 2035 | first civil contract Jan 2026; middle station unnamed |
| JRL Stage 1 Choa Chu Kang – Boon Lay, Bahar Jn – Tawas | construction | 2028 | delayed from end-2027 to mid-2028 (COS, Mar 2026) |
| JRL Stage 2 Tengah – Pandan Reservoir | construction | – | LTA to announce dates (earlier target 2028) |
| JRL Stage 3 Boon Lay – Jurong Pier, Tawas – Peng Kang Hill | construction | – | earlier target 2029 |
| CRL Phase 1 Aviation Park – Bright Hill | construction | 2030 | 12 stations CR2–CR13 |
| CRL Phase 2 Bright Hill – Jurong Lake District | construction | 2032 | CR14–CR19 |
| CRL Punggol Extension Pasir Ris – Punggol | construction | 2032 | CP1–CP4 |
| CRL Phase 3 JLD – Jurong Pier – Gul Circle | approved | – | alignment gazetted 31 Jul 2026, late 2030s; CR20/CR22 unnamed |
| CRL CR1 Changi T5 | planned | – | mid-2030s |
| RTS Link Woodlands North – Bukit Chagar (JB) | construction | 2027 | target moved from Dec 2026 to Feb 2027 |

Not drawn: infill stations (Founders' Memorial TE22A 2028, Brickland NS3A 2034, JRL JS2A),
unopened shells (Mount Pleasant TE10, Marina South TE21), Seletar and Tengah lines (studies only),
JRL West Coast Extension (proposed).

Station positions of unbuilt stations are approximate (`approx`), from Wikipedia station
articles / LTA maps (~200 m); CR20 and CR22 are estimates (~500 m).

## Sources

- LTA, CCL6 public preview 4 Jul 2026: https://www.lta.gov.sg/content/ltagov/en/newsroom/2026/5/news-releases/circle-line-stage-6-to-open-for-public-preview-on-4-july-2026.html
- AsiaOne, TEL5 / DTL3e opening 26 Dec 2026: https://www.asiaone.com/singapore/sungei-bedok-south-xilin-mrt-stations-tel-dtl-opening
- LTA, next phase of rail development (COS 2026): https://www.lta.gov.sg/content/ltagov/en/newsroom/2026/3/news-releases/next-phase-of-rail-development.html
- LTA/SLA, CRL Phase 3 gazette (Jul 2026): https://www.lta.gov.sg/content/ltagov/en/newsroom/2026/7/news-releases/joint-news-release-by-the-land-transport-authority--lta----sla--.html
- LTA, DTL2 extension contract (Jan 2026): https://www.lta.gov.sg/content/ltagov/en/newsroom/2026/1/news-releases/lta-awards-first-civil-contract-for-the-downtown-line-2-extensio.html
- RTS Link Feb 2027 (secondary): https://themalaysiamove.com/news-2026-10-rts-link-february-2027/
- Wikipedia: Jurong Region MRT line, Cross Island MRT line (station lists / coordinates).

Caveats: the TEL5/DTL3e date was seen via AsiaOne, not the LTA release itself; JRL Stage 2/3 years
are not official; the RTS date comes from secondary reports of an LTA/MOT Malaysia release.
