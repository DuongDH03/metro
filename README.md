# Metro Vision

Interactive, data-driven map of current and future urban rail networks in **11 cities**: Hanoi, Ho Chi Minh City, Tokyo, Osaka · Kyoto,
Nagoya · Gifu, Singapore, Taipei, Taichung, Tainan, Kaohsiung and London.
See what runs today, what is being built, and what is planned, and watch the network grow year by year.

**Live: https://duongdh03.github.io/metro/** (deployed from `main` by GitHub Actions; e.g. [/#hanoi](https://duongdh03.github.io/metro/#hanoi), [/#tokyo](https://duongdh03.github.io/metro/#tokyo), [/#london](https://duongdh03.github.io/metro/#london), [/#taipei](https://duongdh03.github.io/metro/#taipei)).

React + TypeScript + Vite + MapLibre GL, on a keyless CARTO/OpenStreetMap basemap.

![Hanoi's full planned network (2045+) in dark mode: line tree on the left, network stats, legend](docs/images/hanoi-2045.webp)

## Watch the network grow

Press **Play** (or drag the timeline) and the map redraws year by year, with live line, station and km counts.
Lines that do not exist yet in the selected year fade out of the sidebar.

<p align="center">
  <img src="docs/images/timeline-hanoi.gif" alt="Hanoi timeline animation from 2021 to 2045+: the network grows from 2 lines to 18" width="900">
</p>

| Hanoi in 2030 | Hanoi in 2045+ |
|---|---|
| ![Hanoi network in 2030: 8 lines, 159 stations, 356 km](docs/images/hanoi-2030.webp) | ![Hanoi network in 2045+: 18 lines, 194 stations, 919 km](docs/images/hanoi-2045.webp) |

## Cities

| City | Lines | Stations | Covers | Timeline |
|---|---:|---:|---|---|
| Hanoi | 18 | 194 | Urban metro and satellite-town lines from the 2045 master plan | 2021–2045+ |
| Ho Chi Minh City | 28 | 240 | Metro, LRT and monorail incl. merged Bình Dương / Bà Rịa–Vũng Tàu | 2024–2050 |
| Tokyo | 122 | 1,421 | JR, Shinkansen, Tokyo Metro, Toei, Yokohama subway, private railways, monorails | 1927–2045 |
| Osaka · Kyoto | 96 | 1,023 | Osaka, Kyoto, Kobe, Nara, Ōtsu: subways, JR West, Hankyu, Hanshin, Keihan, Kintetsu, Nankai, trams; Naniwasuji Line, Hokuriku / Chūō Shinkansen | 1874–2040 |
| Nagoya · Gifu | 45 | 534 | Nagoya subway, JR Central, Meitetsu, Kintetsu, Aonami, Linimo, Gifu-area railways; Chūō Shinkansen | 1884–2040 |
| Singapore | 13 | 231 | MRT and LRT incl. Cross Island, Jurong Region and the Johor Bahru RTS Link | 1987–2040 |
| Taipei | 23 | 315 | Taipei / New Taipei / Taoyuan / Keelung: Metro, Circular, Sanying, Airport MRT, LRTs, TRA, THSR | 1996–2037 |
| Taichung | 7 | 96 | Green Line, Blue Line (construction), Orange Line (planned), TRA, THSR | 2007–2042 |
| Tainan | 5 | 25 | Blue Line (approved), TRA incl. Shalun Line and the city-centre underground project, THSR | 2007–2036 |
| Kaohsiung | 7 | 121 | Red / Orange lines, Circular LRT, Yellow Line, Gangshan–Lujhu, TRA, THSR | 2008–2040 |
| London | 60 | 677 | Underground, Elizabeth line, DLR, Overground (2024 names), trams, cable car, National Rail suburban layer; Bakerloo extension, Crossrail 2, HS2 | 1863–2043 |

Pan from one city into another (Osaka → Nagoya, Taipei → Taichung) and the app offers to switch maps.

| Tokyo (dark) | Ho Chi Minh City (light) |
|---|---|
| ![Tokyo: 45 lines and 618 stations, grouped as JR / subway operators](docs/images/tokyo.webp) | ![Ho Chi Minh City: 28 planned and operating lines on the light basemap](docs/images/hcmc-light.webp) |
| **Singapore (light)** | **Mobile** |
| ![Singapore MRT and LRT network with station names](docs/images/singapore-light.webp) | <img src="docs/images/mobile.webp" alt="Ho Chi Minh City on a phone-sized screen with the bottom sheet collapsed" width="260"> |

## Line and station details

Click a line in the sidebar or on the map, or search for any station, to open its detail card:
length, target year, sections with their own status, interchanges, and sources.

| Line card (Hanoi Line 2) | Station card (Shinjuku, Tokyo) |
|---|---|
| ![Hanoi Line 2 detail card: 67 km, target 2030, 21 stations, section-by-section status](docs/images/line-detail.webp) | ![Shinjuku station card: interchange of 8 lines with station codes](docs/images/station-detail.webp) |

## Features

- City switcher, light/dark basemap (follows your system theme, toggle in the top-right)
- Group tree with checkboxes (Tokyo: JR > JR East / Shinkansen, Subway > Tokyo Metro / Toei / Yokohama / planned, Private railways > Tokyu / Odakyu / Keio / Seibu / Tobu / Keisei / Keikyu / Sotetsu / third-sector / monorail & AGT)
- Status filters: operating / under construction / approved / planned / proposed, each drawn differently
- Timeline slider with Play that animates the network growing year by year, with live line/station/km stats
- Station & line search (diacritics-insensitive), line and station detail cards with sources
- Planned stations without official coordinates are drawn faded as "approximate location"
- Drag a `.geojson` / `.kml` / city `.json` onto the map to preview it over the current city
- Responsive: sidebar becomes a bottom sheet on phones

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173/#hanoi  (#hcmc, #tokyo, #kansai, #nagoya, #singapore,
                   #  #taipei, #taichung, #tainan, #kaohsiung, #london)
npm run validate   # check every city file against the data contract
npm run build
```

## Adding / updating cities

**Read [docs/IMPORTING.md](docs/IMPORTING.md)**: updating the existing maps, adding cities from OpenStreetMap,
drawing lines in geojson.io / Google My Maps, `base` fan versions of a city, export/round-trip, and scaling guidance.

```bash
npm run import -- --new da-nang --name "Da Nang" --center 108.21,16.06   # scaffold cities/da-nang/
npm run import -- da-nang --dry                                          # build + validate, write nothing
npm run import -- da-nang                                                # write public/data + cities.json
npm run data:hanoi                                                       # rebuild a hand-curated city
```

## Data

Nothing city-specific is in the React code. Everything comes from `public/data/*.json`
(contract: [src/types.ts](src/types.ts), rules: [DATA.md](DATA.md)). Each city is generated by scripts:

| City | Regenerate | Notes |
|---|---|---|
| Hanoi | `npm run data:hanoi` | [research/hanoi.md](research/hanoi.md) |
| HCMC | `npm run data:hcmc` | [research/hcmc.md](research/hcmc.md) |
| Tokyo | `npm run data:tokyo` (curated JR / subway core in [scripts/tokyo/](scripts/tokyo/), then the importer adds private railways from [cities/tokyo/](cities/tokyo/)) | [research/tokyo.md](research/tokyo.md) |
| Osaka · Kyoto | `npm run data:kansai` (curated, [scripts/kansai/](scripts/kansai/)) | [research/kansai.md](research/kansai.md) |
| Nagoya · Gifu | `npm run data:nagoya` (curated, [scripts/nagoya/](scripts/nagoya/)) | [research/nagoya.md](research/nagoya.md) |
| Singapore | `npm run import -- singapore` (importer, [cities/singapore/](cities/singapore/)) | [research/singapore.md](research/singapore.md) |
| Taipei, Taichung, Tainan, Kaohsiung | `npm run data:taiwan` (or `data:taipei` etc.; one shared pipeline in [scripts/taiwan/](scripts/taiwan/)) | [taipei](research/taipei.md), [taichung](research/taichung.md), [tainan](research/tainan.md), [kaohsiung](research/kaohsiung.md) |
| London | `npm run data:london` (curated TfL lines, future projects and a National Rail layer in [scripts/london/](scripts/london/)) | [research/london.md](research/london.md) |

Curated line tables live in each `scripts/<city>/` folder; operating track geometry comes from OpenStreetMap (Overpass).
Planned stations without official coordinates are marked `approx` and drawn faded.

## Project layout

```
src/            React app (map, sidebar, search, detail cards, file-drop importer)
public/data/    One JSON file per city + cities.json index (what the app renders)
scripts/        Per-city build scripts and the generic OSM importer
cities/         Importer configs for OSM-sourced cities
research/       Source notes behind each city's data
skills/         Claude skills for researching, quizzing and designing metro networks
docs/           Import guide and README screenshots
```

## Claude skills
`skills/` holds five Claude skills built from this project (sources in `skills/<name>/`, shared helpers in
`skills/_shared/`, edit those and run `python skills/build_skills.py` to rebuild `skills/dist/*.skill`):
`metro-city-research`, `fantasy-metro-designer`, `metro-plan-update`, `metro-timeline-story`, `metro-quiz`.

---

Map data © OpenStreetMap contributors (ODbL), basemap © CARTO.
