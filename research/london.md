# London dataset notes

One pipeline, rebuilt by `npm run data:london`: `node scripts/london/build.mjs` reads OpenStreetMap route relations via Overpass (cached in `scripts/london/.cache/`, git-ignored; delete it to refresh) and the curated tables, writes `public/data/london.json` (about 205 KB), then runs the validator and refreshes `cities.json`. Data accessed 2026-11-14.

| File | Contents |
|---|---|
| [scripts/london/lines.mjs](../scripts/london/lines.mjs) | TfL lines: OSM relation per branch, section cut points (`from` / `to`), opening year per section, colours, descriptions, name aliases |
| [scripts/london/future.mjs](../scripts/london/future.mjs) | Future projects: extensions appended to existing lines, and new lines (Crossrail 2, West London Orbital, HS2) |
| [scripts/london/national-rail.mjs](../scripts/london/national-rail.mjs) | National Rail layer: Thameslink and 35 suburban corridors, one OSM relation each, clipped to Greater London |

Why not the importer (as Tokyo's private railways use): in OSM, National Rail termini are named "London Waterloo", "London St Pancras" and so on, while the Tube stations are named "Waterloo" and "King's Cross St Pancras". The importer merges only identical names, so the termini would not become interchanges. The London build applies an alias table first (`NAME_ALIASES`), so they do.

## Coverage
- **Bounding box:** lng -1.05 to 0.42, lat 51.25 to 51.76. This includes the whole Elizabeth line to Reading, the Metropolitan line to Amersham / Chesham, and the Central line to Epping. The National Rail layer is clipped tighter, to lng -0.53 to 0.33, lat 51.28 to 51.71; lines are cut at the last station inside the box.
- **Totals:** 60 lines (57 operating, 1 construction, 1 planned, 1 proposed) and 201 segments (189 operating, 1 construction, 3 planned, 8 proposed). There are 677 stations: 495 on TfL lines and projects, the rest on National Rail only. 16 stations are approximate.

| Group | Lines |
|---|---|
| underground (11) | Bakerloo, Central, Circle, District, Hammersmith & City, Jubilee, Metropolitan, Northern, Piccadilly, Victoria, Waterloo & City |
| elizabeth (2) | Elizabeth line; Crossrail 2 (proposed) |
| dlr (1) | DLR, all branches, as one line |
| overground (7) | Liberty, Lioness, Mildmay, Suffragette, Weaver, Windrush (2024 names); West London Orbital (planned) |
| trams (1) | London Trams, all branches, as one line |
| cable-car (1) | London Cable Car |
| hs2 (1) | High Speed 2, Euston – Old Oak Common (construction) |
| national-rail (36) | Thameslink, Great Northern (Moorgate), Southern (9), Southeastern (7), South Western (9), Greater Anglia (2), c2c (2), Chiltern (2), GWR Greenford branch, London Northwestern (2), Heathrow Express |

- **Circle line:** two segments. The loop runs Edgware Road – Baker Street – … – Paddington (Praed Street) – Edgware Road (1884) and repeats its first station. The tail runs Edgware Road – Paddington (H&C platforms) – Hammersmith (2009). Together they draw the 2009 "tea cup".
- **Branches** are separate segments that share their junction station: Central (Hainault loop, Ealing / West Ruislip), District (Richmond, Ealing, Wimbledon, Edgware Road, Olympia), Metropolitan (Amersham, Chesham, Uxbridge, Watford), Northern (Bank / Charing Cross / Battersea, Edgware / High Barnet / Mill Hill East), Piccadilly (Uxbridge, Heathrow T5 and the one-way T4 loop), Elizabeth, DLR, Weaver, Windrush, Mildmay, trams. The Croydon tram loop is a closed loop segment.

## Opening years
Every operating segment has a year. The rule is the **service year**: the year this line's trains, or its direct predecessor in today's Underground / TfL network, first carried passengers over the section. Predecessors include the Metropolitan Railway (1863), the District Railway (1868), the City & South London Railway (1890), the Bakerloo Stanmore branch and TfL Rail. When a line took over an older main-line railway, the segment carries the takeover year, and the track's own year is in the segment label. Examples:
- Central line Loughton – Epping: 1949 (railway 1865).
- Northern line High Barnet branch: 1940 (railway 1872).
- Elizabeth line Shenfield: 2015 (railway 1839-1843).
- Overground: 2007-2015.

The timeline starts at 1863. Sources: Wikipedia line and station articles (one table per line, compiled 2026-11-14).

Judgement calls (sources disagree, or the rule is ambiguous):
- **District to Upminster and East Ham:** 1902. District trains ran there from 1902, were cut back in 1905, and served Barking from 1908 and Upminster from 1932.
- **District Edgware Road branch:** 1871, on the Inner Circle tracks. A dedicated District service started in 1925. Olympia is 1872.
- **Circle loop:** 1884, when the Inner Circle was completed. The line was named in 1949. The tracks open from 1863 under the Metropolitan, H&C and District lines.
- **Jubilee north of Baker Street:** Stanmore – Wembley Park is 1932 (Metropolitan) and Wembley Park – Baker Street is 1939 (Bakerloo). The Jubilee line itself started in 1979.
- **Windrush, East London core:**
  - Shadwell – New Cross / New Cross Gate: 1884 (Metropolitan / District trains; railway 1869).
  - Whitechapel – Shadwell: 1913.
  - North of Whitechapel and south of New Cross Gate: 2010-2012, the Overground.
- **Elizabeth line Terminal 5:** 2022. One Wikipedia article says TfL Rail served it from 2020.
- **National Rail:** one year per corridor, the first railway opening to London (approximate). Thameslink is 1988, its cross-London service, and 2018 for the Greenwich and Great Northern branches.

## Interchanges
- **Merge rule:** stations merge when the normalised name is the same within 450 m. Normalising treats "&" as "and", ignores punctuation and drops platform suffixes such as "Platform 2" or "Platforms 1 & 2". The `NAME_ALIASES` table maps "London X" termini to the Tube name. "London King's Cross" and "London St Pancras (International)" both map to **King's Cross St. Pancras**, and "West Hampstead Thameslink" maps to West Hampstead.
- **Same name, so one station** (TfL counts two stations each, but the DATA.md rule merges them): Paddington (H&C / Circle and Bakerloo / Circle / District / Elizabeth), Edgware Road (Bakerloo vs Circle / District / H&C), Hammersmith (H&C / Circle vs District / Piccadilly), and West Hampstead (Jubilee, Overground, Thameslink).
- **Kept separate:** out-of-station interchanges with different names, and Bethnal Green (Central line vs Weaver line, about 460 m apart, not a TfL interchange; its id is `bethnal-green-weaver`). The pairs with different names are:
  - Bank / Monument (DLR, Central, Northern and W&C at Bank; District and Circle at Monument)
  - Canary Wharf / Heron Quays
  - Euston / Euston Square
  - Shepherd's Bush / Shepherd's Bush Market
  - Woolwich / Woolwich Arsenal
  - Stratford / Stratford International
  - Tower Hill / Tower Gateway / Fenchurch Street
  - Southwark / Waterloo East
  - Royal Victoria / Royal Docks (cable car)
- **Hub check:**

| Station | Lines |
|---|---|
| King's Cross St. Pancras | Circle, H&C, Metropolitan, Northern, Piccadilly, Victoria, Thameslink |
| Bank | Central, Northern, Waterloo & City, DLR |
| Stratford | Central, Jubilee, Elizabeth, DLR, Mildmay, Greater Anglia |
| Liverpool Street | Central, Circle, H&C, Metropolitan, Elizabeth, Weaver, Greater Anglia |
| Paddington | Bakerloo, Circle, District, H&C, Elizabeth, Heathrow Express |
| Waterloo | Bakerloo, Jubilee, Northern, Waterloo & City, plus 8 SWR corridors |
| London Bridge | Jubilee, Northern, Thameslink, plus 9 Southern / Southeastern corridors |
| Clapham Junction | Mildmay, Windrush, Crossrail 2, plus 14 Southern / SWR corridors |

## Future projects (status 2026-11-14, applying DATA.md literally)
| Project | Status | Year | Sources |
|---|---|---|---|
| Bakerloo line extension, Elephant & Castle – Lewisham | planned | 2040 | ianVisits 2026-10-28; LDRS 2026-05-20 |
| Bakerloo phase 2, Lewisham – Hayes / Beckenham Junction | proposed | none | ianVisits 2026-10-28 |
| DLR Gallions Reach – Beckton Riverside – Thamesmead | planned | none ("early 2030s") | TfL PN-134 2025-12-15; ianVisits 2026-10-08 |
| Crossrail 2 (Wimbledon – Seven Sisters, Tottenham Hale and New Southgate branches) | proposed | none | Wikipedia; Time Out 2025-08-22 |
| West London Orbital, Hendon – Hounslow | planned | none ("mid-2030s") | Time Out 2026-09-23; Wikipedia |
| Elizabeth line Abbey Wood – Ebbsfleet (C2E) | proposed | none | London Now, autumn 2026 (TfL FOI) |
| HS2 Euston – Old Oak Common | construction | 2043 | GOV.UK 2026-05-19; HS2 Ltd; Construction Enquirer 2026-06-29 |
| Metropolitan line extension (Croxley – Watford Junction) | proposed | none | Wikipedia |
| Sutton Link tram, Colliers Wood – Sutton | proposed | none | Wikipedia |

Notes on the calls:
- **Bakerloo phase 1:** safeguarded in 2021 and in the Mayor's Transport Strategy and London Plan. There is no TWAO and no funding. Budget 2026 gave borrowing powers, but that is not funding, so it stays planned. The target slipped from 2028/29, through the early 2030s, to 2040. Consultation runs Dec 2026 – Feb 2027.
- **DLR Thamesmead:** borderline. Government "confirmed support" in the November 2025 Budget, but there is no funding agreement and the TWAO is due in early 2027, so I kept it at planned rather than approved. It has no year, so the app shows it at the end of the timeline.
- **Crossrail 2:** paused in 2020 but still safeguarded. "Paused" wins, so it is proposed. A shaft inside the British Library extension (about 2026–2032) is passive provision and does not count as construction.
- **HS2:** Old Oak Common station, the Euston tunnels and the route west are under construction; Euston station has enabling works only. The 19 May 2026 reset gives first services Old Oak Common – Birmingham in May 2036 – October 2039, and Euston in 2040 – 2043. The map uses the end of each window. Only Euston – Old Oak Common is drawn, because the line has no further London stations, so Old Oak Common's own 2036-2039 opening is described rather than drawn. The new Elizabeth line / GWR platforms at Old Oak Common are under construction, tied to HS2. They are described in the Elizabeth line text and not drawn as a segment.
- **Northern line split:** proposed, an unfunded aspiration. It adds no track, so it is described in the Northern line text and not drawn.
- **Not drawn (infill stations on operating lines):** Surrey Canal Road on the Windrush line (planned and part-funded; the press says 2028), Old Oak Common Lane and Hythe Road on the Overground (proposed; Old Oak Common Lane is drawn as part of the WLO), and Beam Park on c2c (planned, 2028 at the earliest).
- **Already open, checked:** Barking Riverside (2022), the Battersea extension (2021), Brent Cross West (Thameslink, 2023).
- **Positions:** new stations are approximate (`approx`) and drawn with straight lines. HS2 has a rough hand-drawn path. Existing stations named in a project snap to the real station.

## Colours
- **Underground:** TfL line colours (Bakerloo #B36305, Central #E32017, Circle #FFD300, District #00782A, H&C #F3A9BB, Jubilee #A0A5A9, Metropolitan #9B0056, Piccadilly #003688, Victoria #0098D4, W&C #95CDBA).
- **Northern line:** officially black, but drawn **#5A5A5A** because black is invisible on the app's default dark basemap. It is noted in the line description.
- **Elizabeth line:** #6950A1.
- **DLR, trams, cable car:** DLR #00A4A7, trams #84B817, cable car #E21836.
- **Overground (2024):** taken from the swatches in TfL's line-names PDF: Liberty #5D6061, Lioness #FAA61A, Mildmay #0077AD, Suffragette #5BBD72, Weaver #823A62, Windrush #ED1B00. TfL's screen values differ slightly (for example Weaver #9B0058), and the TfL Colour Standard issue 9/10 PDFs could not be opened.
- **Chosen, not official:** Crossrail 2 grey, West London Orbital Overground orange, HS2 navy. National Rail colours are approximate operator brand colours.

## Cable car
Included because TfL runs it, sells it on Oyster / contactless, and draws it on its rail maps. It was named IFS Cloud Cable Car from 2022 and renamed **London Cable Car** in 2026 when the sponsorship ended (Time Out, 2026-04-30). The data format has no cable-car mode, so `mode` is left unset.

## Known gaps and caveats
- **Limited-stop OSM relations:** the Elizabeth line Hayes & Harlington – Reading segment uses one, so **Iver** is missing. Some National Rail corridors also use semi-fast relations, so a few stopping-only stations are missing. For example, the SWR Reading line runs Clapham Junction – Richmond with no stops at Wandsworth Town, Putney, Barnes, Mortlake or North Sheen.
- **National Rail:** one relation per corridor, so overlapping services are drawn on top of each other and the routes are not complete.
  - Not drawn: Hampton Court branch (its OSM relation has no stops), Greater Anglia main line, Gatwick Express, Southeastern high-speed and Kent main lines.
  - Most corridors are clipped at the Greater London edge.
- **Tram terminal:** the OSM tram routes stop at Beckenham Road. Beckenham Road – Beckenham Junction is added by hand without a path, and the station position comes from the National Rail station.
- **Terminal 4 loop:** the return leg Terminal 4 – Terminals 2 & 3 is drawn straight.
- **Overpass mirror:** one response came back stale (Woolwich Arsenal missing from the DLR relation) and was refetched. If a stop is "not found" after a refresh, delete that cache file and rebuild.
- **Station names:** they are OSM `name`s; DLR and Overground platform suffixes are stripped.
- **No station codes:** London has no station numbering.
