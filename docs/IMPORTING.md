# Importing & maintaining city maps

This guide covers how to keep the existing maps current, add new cities, draw your own lines,
and what to watch as the project grows. The data contract itself (fields, statuses, id rules) is in
[DATA.md](../DATA.md) and [src/types.ts](../src/types.ts).

- [1. How the pieces fit](#1-how-the-pieces-fit)
- [2. Pick your path](#2-pick-your-path)
- [3. Updating Hanoi, HCMC and Tokyo](#3-updating-hanoi-hcmc-and-tokyo)
- [4. Adding a new city with the importer](#4-adding-a-new-city-with-the-importer)
- [5. Drawing lines (GeoJSON / KML / Google My Maps)](#5-drawing-lines-geojson--kml--google-my-maps)
- [6. Importing real networks from OpenStreetMap](#6-importing-real-networks-from-openstreetmap)
- [7. city.config.json reference](#7-cityconfigjson-reference)
- [8. Preview, export and round-trip in the app](#8-preview-export-and-round-trip-in-the-app)
- [9. Scaling guidance](#9-scaling-guidance)
- [10. Troubleshooting](#10-troubleshooting)

---

## 1. How the pieces fit

```
 inputs                       adapters                    one shared step         output
 ───────────────────────      ───────────────────────     ──────────────────     ──────────────────────
 OpenStreetMap (Overpass) ─▶  scripts/import/osm.ts   ─┐
 lines.geojson            ─▶  src/importer/geojson.ts ─┼─▶ DraftLines ─▶ normalize() ─▶ public/data/<id>.json
 my-map.kml (My Maps)     ─▶  src/importer/kml.ts     ─┘                 │                + cities.json entry
 base: existing city json ───────────────────────────────────────────────┘                + validator run
```

- **Adapters** only translate a source into *draft lines* (names, colours, ordered stations, geometry).
- **`normalize()`** ([src/importer/normalize.ts](../src/importer/normalize.ts)) does everything else in one place:
  station ids, merging same-name stations into interchanges, config overrides, simplifying and rounding paths,
  groups, timeline. That is why every city comes out consistent whatever the source.
- `src/importer/*` runs both in Node (the CLI) and in the browser (drag-and-drop), so a file previews in the
  app exactly as the CLI would build it.

Hanoi, HCMC and Tokyo predate the importer and keep their own hand-tuned pipelines in `scripts/<city>/`
(see section 3). Tokyo is a hybrid: its curated core (JR, Shinkansen, Tokyo Metro, Toei) is built by
`scripts/tokyo/`, and the importer layers the private railways on top of it (`cities/tokyo/`, `base`).
Everything new should go through the importer.

## 2. Pick your path

| I want to… | Do this | Section |
|---|---|---|
| Change a status, year, station or colour in Hanoi / HCMC / Tokyo | Edit that city's line table, `npm run data:<city>` | [3](#3-updating-hanoi-hcmc-and-tokyo) |
| Add a real city whose metro is mapped in OpenStreetMap | `npm run import -- --new <id>`, add an `osm` import | [4](#4-adding-a-new-city-with-the-importer), [6](#6-importing-real-networks-from-openstreetmap) |
| Add future / planned lines that aren't in OSM | Draw them, add a `geojson` or `kml` import to the same config | [5](#5-drawing-lines-geojson--kml--google-my-maps) |
| Make a fan / "what if" version of an existing city | New config with `"base": "public/data/<city>.json"` + a drawn file | [4](#extending-an-existing-city-base) |
| Just look at a file on the map, nothing saved | Drag it onto the app | [8](#8-preview-export-and-round-trip-in-the-app) |
| Edit an existing map in geojson.io / QGIS | About → Download GeoJSON, edit, re-import | [8](#8-preview-export-and-round-trip-in-the-app) |

---

## 3. Updating Hanoi, HCMC and Tokyo

These three are curated by hand from research (official plans, operator sites, press). Each has one
**line table**: the only place you edit. Geometry for operating lines is re-derived from OpenStreetMap
(cached, so rebuilds are offline and reproducible).

| City | Edit | Rebuild | Research notes |
|---|---|---|---|
| Hanoi | [scripts/hanoi/lines.mjs](../scripts/hanoi/lines.mjs) (`STATIONS`, `LINES`, `SOURCES`) | `npm run data:hanoi` | [research/hanoi.md](../research/hanoi.md) |
| HCMC | [scripts/hcmc/build-hcmc.mjs](../scripts/hcmc/build-hcmc.mjs) (`S(...)` station calls, `LINES`, `SOURCES`) | `npm run data:hcmc` | [research/hcmc.md](../research/hcmc.md) |
| Tokyo (curated core + importer layer) | JR / Shinkansen / Tokyo Metro / Toei: [scripts/tokyo/lines.mjs](../scripts/tokyo/lines.mjs) (`LINES`, `GROUPS`, `SOURCES`). Private railways, third-sector lines, monorails/AGT/trams, Yokohama subway and their future projects: [cities/tokyo/city.config.json](../cities/tokyo/city.config.json) + [cities/tokyo/future-private.geojson](../cities/tokyo/future-private.geojson) | `npm run data:tokyo` | [research/tokyo.md](../research/tokyo.md) |

Each `data:*` command rebuilds the JSON and runs the validator. Rebuilding with no edits produces a
byte-identical file, so any diff you see is your change (for Tokyo, only the `updated` date changes when
the importer layer is rebuilt on another day).

**Tokyo's two layers.** `node scripts/tokyo/build.mjs` writes the curated core to
`scripts/tokyo/out/tokyo-core.json` (committed, so the importer step needs no network). `npm run import -- tokyo`
then reads it as `base`, adds the OSM private-railway imports and the drawn projects, merges stations into
shared interchanges by name, and writes `public/data/tokyo.json`. `npm run data:tokyo` runs both. Edit JR /
subway data in `lines.mjs`, everything else in `cities/tokyo/`. To pull newer OSM data for the private
railways use `npm run import -- tokyo --refresh` (or delete `cities/tokyo/.cache/`).

### Common edits

**A section opens / starts construction / gets approved.** Change the segment's `status`, and its `year`
to the actual year. Add a source for the news. Example (Hanoi, Line 3 underground opens):

```js
// scripts/hanoi/lines.mjs
{ stations: ['cau-giay', 'kim-ma', 'cat-linh', 'van-mieu', 'ga-ha-noi'], status: OP, year: 2027,
  label: 'Cầu Giấy – Ga Hà Nội (underground)', path: true },
```

Also bump the line's `status` if this is now its most advanced section (the validator warns if you forget),
and update `description`.

**A target year slips.** Change `year`. Keep the old date in `description` if it's informative
("originally 2030, delayed to 2032 per …").

**A new station list is published for a planned line.** Replace the approximate waypoints with real
stations: add them to the station table with real coordinates (drop `approx`), then list them in the segment.
Keep ids stable for stations that already exist; other lines may reference them.

**A new line or extension is announced.** Add a segment (extension) or a whole line entry. Split segments
wherever status, year or branch differs; adjacent segments share their boundary station.

**A plan is cancelled or replaced.** Delete the segment or line, or downgrade to `proposed` with a
description saying it was dropped from the official plan. Don't leave stale `planned` lines.

**Re-fetch OSM geometry** (an operating line changed shape): delete the city's cache folder
(`scripts/hanoi/cache`, `scripts/hcmc/cache`, `scripts/tokyo/.cache`) and rerun `data:<city>`.

### Checklist for every update
1. Status matches [DATA.md](../DATA.md) definitions: groundbreaking counts as `construction` only when works started.
2. `year` is the actual opening year or the latest official target.
3. Every changed line cites a source you actually read, with the date in its title.
4. `npm run data:<city>` passes (0 errors). Read the warnings it prints.
5. Note the change and source in `research/<city>.md`.
6. Look at it: `npm run dev`, drag the timeline across the changed year.

---

## 4. Adding a new city with the importer

```bash
npm run import -- --new da-nang --name "Da Nang" --center 108.21,16.06
```

This creates `cities/da-nang/` with:
- `city.config.json`: the recipe. Its `"$schema"` line gives autocomplete and hover docs in VS Code.
- `lines.geojson`: a starter file with one example line and two stations.

Edit the config, add your inputs, then build:

```bash
npm run import -- da-nang --dry    # build + validate, write nothing; read the warnings
npm run import -- da-nang          # writes public/data/da-nang.json and adds it to cities.json
npm run import -- --all            # rebuild every importer city
```

A city folder is everything needed to rebuild it, so commit the whole folder (except `.cache/`):

```
cities/da-nang/
  city.config.json      the recipe (what to import, groups, overrides, sources)
  lines.geojson         hand-drawn lines (optional)
  future.kml            more drawn lines (optional)
  .cache/               downloaded OSM data (git-ignored; delete or use --refresh to re-download)
```

### What to write: a minimal config

```jsonc
{
  "$schema": "../../scripts/import/city-config.schema.json",
  "id": "da-nang",                 // kebab-case, = folder name, = URL hash (#da-nang)
  "name": "Da Nang",
  "nameLocal": "Đà Nẵng",
  "country": "Vietnam",
  "center": [108.21, 16.06],       // [lng, lat]
  "zoom": 11,
  "timeline": { "min": 2025, "max": 2050 },
  "groups": [ { "id": "metro", "name": "Urban rail" } ],
  "sources": [ { "id": "plan-2025", "title": "Da Nang master plan 2021-2030 (Decision …)", "url": "https://…" } ],
  "notes": "Planned alignments are approximate.",
  "imports": [
    { "type": "geojson", "file": "lines.geojson",
      "defaults": { "group": "metro", "mode": "metro", "status": "planned", "sources": ["plan-2025"] } }
  ]
}
```

`imports` run in order and their lines are combined. Mix and match: OSM for what exists today, a drawn
file for what's planned. Stations with the same name within 400 m become one interchange automatically,
across imports.

### Extending an existing city (`base`)

To add your own lines on top of a finished map without touching its pipeline (the "50-year fan vision"
idea), point `base` at it:

```jsonc
{
  "id": "hanoi-fan-vision",
  "name": "Hanoi (fan vision)",
  "country": "Vietnam", "center": [105.84, 21.02], "zoom": 10.5,
  "base": "public/data/hanoi.json",
  "imports": [ { "type": "kml", "file": "fan-lines.kml", "defaults": { "status": "proposed" } } ]
}
```

- Base lines and stations are kept. Your stations named like base stations (e.g. "Cầu Giấy") merge into them,
  so your lines interchange with the real network.
- An imported line with the **same id** as a base line **replaces** it (useful to redraw one line). Give new
  lines new names/ids to add them.
- Working example: [examples/hanoi-fan-vision/](../examples/hanoi-fan-vision/) (`npm run import -- examples/hanoi-fan-vision --dry`).

Rebuild the derived city whenever the base changes (`npm run import -- --all` after `data:hanoi`).

---

## 5. Drawing lines (GeoJSON / KML / Google My Maps)

Draw in any tool that saves GeoJSON or KML:
- **geojson.io** (simplest): draw lines and points, edit properties in the table, Save → GeoJSON.
- **Google My Maps**: one *layer* per group, draw lines and add pins, put properties in the description
  (`status: planned`, one per line), then ⋮ → Export to KML/KMZ → *KML* (not KMZ).
- **QGIS / Google Earth**: export GeoJSON or KML.

### Lines: LineString / MultiLineString features

| Property | Meaning |
|---|---|
| `line` | Identity. Features with the same `line` become segments of one line (in file order). Default: `name`. |
| `name` | Line name (e.g. `Line 4: Thuong Cat – Linh Dam`). |
| `nameLocal`, `code`, `description`, `mode`, `group` | As in [DATA.md](../DATA.md). `group` may be any text; it's turned into an id. |
| `color` (or `stroke`, `colour`) | `#rrggbb` or `#rgb`. My Maps/KML line colours are picked up automatically. |
| `status`, `year`, `label` | **Per segment.** Draw a line in pieces to give pieces different statuses/years. |
| `opened`, `lengthKm`, `sources` | Line-level; `sources` is a comma list of source ids from the config. |
| `stations` | Optional explicit ordered station list (`id` or name, comma-separated). Turns off snapping for that segment. |
| `from` / `to` | Names for auto-created end stations when no station Point is near an end. |
| `id` | Force a line id. |

- **Status** accepts friendly words in English, Vietnamese and Japanese: *open/existing/đang khai thác/営業中* →
  `operating`, *under construction/đang xây dựng/工事中* → `construction`, *funded/phê duyệt* → `approved`,
  *plan/quy hoạch/計画* → `planned`, *concept/idea/fantasy/vision/đề xuất/構想* → `proposed`.
  Anything else (or missing) falls back to the import's `defaults.status`, then `proposed`.
- **Year** accepts `2035`, `"~2035"`, `"2030s"` (→ 2030), `"FY2031"`.
- A MultiLineString's parts are separate segments. A closed ring becomes a loop line.

### Stations: Point features

| Property | Meaning |
|---|---|
| `name` | Required. Use the real name for interchanges so they merge with other lines / the base city. |
| `nameLocal`, `codes` (comma list), `approx`, `id` | As in DATA.md. Mark guessed positions `approx: true`. |
| `line` | Optional comma list of `line` values: attach only to these lines (up to 1 km away). |

**How stations attach.** A Point attaches to every line drawn within **150 m** (config `options.snapMeters`)
and is ordered along the drawing. So draw lines *through* station points. A point at a junction serves every
line passing it, and a point at a segment boundary belongs to both segments. Line ends with no point
nearby get an automatic approximate station and a warning. A point near no line is skipped with a warning.

Working example with interchanges, two-phase lines, Vietnamese statuses and a bare line:
[examples/drawn-city/lines.geojson](../examples/drawn-city/lines.geojson).

---

## 6. Importing real networks from OpenStreetMap

OSM has most of the world's operating metros as *route relations*. The `osm` import fetches them through
the Overpass API, turns each route master into one line (branches become extra segments), stitches the track
geometry and finds the stations in order. Results are cached in `cities/<id>/.cache/`. `--refresh` re-downloads.

```jsonc
// cities/singapore/city.config.json (abridged)
"bbox": [103.59, 1.2, 104.08, 1.475],          // required for osm imports: [minLng, minLat, maxLng, maxLat]
"imports": [
  { "type": "osm",
    "filter": { "route": ["subway"], "network": ["Mass Rapid Transit"] },
    "defaults": { "group": "mrt", "mode": "metro", "sources": ["osm"] },
    "exclude": ["JRL"] },                                   // tagged in OSM, but not open yet
  { "type": "osm",
    "filter": { "route": ["light_rail", "monorail"], "network": ["Singapore Rail", "Sentosa"] },
    "defaults": { "group": "lrt", "mode": "lrt", "sources": ["osm"] } },
  { "type": "geojson", "file": "future.geojson",           // lines under construction / planned
    "defaults": { "group": "mrt", "mode": "metro", "status": "planned" } }
],
"lines": {
  "osm:route_master/9627860": { "id": "tel", "name": "Thomson–East Coast Line", "opened": 2020 },
  "tel5": { "id": "tel" }                                  // drawn TEL Stage 5 -> appended to the OSM TEL line
}
```

**Extending a real line with drawn sections.** Give the drawn line the same final id as the OSM line, either
with `"id": "tel"` on the GeoJSON feature or with an override like `"tel5": { "id": "tel" }` above. A line whose
explicit id already exists in the same import run gets its segments **appended** to that line, instead of
becoming a second line. Draw the extension starting at the existing terminus, with a station Point of the
same name, so the line joins up.

**Opening years.** OSM rarely says when each section opened. Operating segments without a year take the line's
`opened` year. For exact staging, patch segments by index: `"ewl": { "segments": [null, { "year": 2002 }] }`.

**Finding the right filter.** Open a station on openstreetmap.org → its route relations → look at the tags
`route`, `network`, `operator`, `ref`. Or run this in overpass-turbo.eu for the visible area:
`rel[type=route][route~"subway|light_rail|train|monorail|tram"]({{bbox}}); out tags;`.
Use one import per group (e.g. one per operator) so the line list is subdivided the way you want, as Tokyo does
with JR / Tokyo Metro / Toei.

**Fixing what OSM gets wrong** without editing OSM: use `lines` overrides (section 7). Missing or wrong colours,
codes, names and opening years are the usual ones. `exclude` drops unwanted routes (shuttles, depot links).
For future lines, which OSM rarely has as routes, add a drawn `geojson` import to the same config.

Full working example: [cities/singapore/](../cities/singapore/).

---

## 7. city.config.json reference

The schema ([scripts/import/city-config.schema.json](../scripts/import/city-config.schema.json)) is the
authoritative list, with a description on every field (VS Code shows them on hover). Summary:

| Field | Required | Notes |
|---|---|---|
| `id`, `name`, `country`, `center`, `zoom` | yes | `id` kebab-case; `center` is `[lng, lat]`. |
| `nameLocal`, `notes` | | Local name; caveats shown in the About panel. |
| `timeline` | | `{min, max}` for the slider. Default: from segment years. |
| `bbox` | for `osm` | `[minLng, minLat, maxLng, maxLat]`. |
| `base` | | Existing CityData to extend (path from project root). |
| `groups` | | `{id, name, nameLocal?, parent?, color?, description?}`. Use `parent` for subdivision (JR > JR East). Unknown group ids used by lines are auto-created. |
| `sources` | | `{id, title, url, accessed?}`. Lines reference them by id. |
| `imports` | yes | List of `{type: "osm" \| "geojson" \| "kml", …, defaults?}`. `defaults` = `{group, status, mode, year, sources}` for lines that don't set them. |
| `lines` | | Overrides, keyed by line id, OSM key, `code` or name (see below). |
| `options` | | `stationMergeMeters` (400), `snapMeters` (150), `simplifyMeters` (15), `precision` (5). |

### Overrides (`lines`)

Patch imported lines without editing the source data. Keys can be the final line id, the source key
(`osm:route_master/123`), the line `code`, or its name.

```jsonc
"lines": {
  "CCL": { "color": "#fa9e0d", "name": "Circle Line", "opened": 2009 },
  "osm:route_master/445566": { "skip": true },
  "line-4": { "status": "planned", "segments": [ null, { "year": 2040, "label": "Phase 2" } ] }
}
```

Fields: anything on a Line (`name`, `nameLocal`, `code`, `color`, `textColor`, `group`, `mode`, `status`,
`opened`, `lengthKm`, `description`, `sources`), plus `id` (rename), `skip` (drop) and `segments`
(patch `status` / `year` / `label` per segment index; `null` = unchanged). Unused override keys are reported
as warnings, so typos don't fail silently.

---

## 8. Preview, export and round-trip in the app

- **Drag a file onto the map** (or *Import file…* in the sidebar footer / About panel):
  - CityData `.json` → opens as its own city, *"<name> (imported)"*.
  - `.geojson` / `.kml` → **merged onto the city on screen** in a group *"Imported: <file>"*, using the same
    code as the CLI. Great for checking a drawing against the real network before committing it.
  - Session-only: nothing is written; reload to discard, or press *Discard* on the banner. *Download JSON*
    saves the result in the format `public/data/` expects.
- **Export** (About → Download & edit): the current city as `.json` (CityData) or `.geojson` that follows the
  conventions in section 5, including `stations` lists, so **export → edit → import is lossless**. This is the
  easiest way to bring an existing map into the importer: export Hanoi as GeoJSON, put it in
  `cities/<new-id>/`, and from then on maintain it with a config.

---

## 9. Scaling guidance

### What to keep in git, and what to rebuild
- **Source of truth = inputs**, not outputs: `cities/<id>/` (config + drawn files) and `scripts/<city>/` tables.
  `public/data/*.json` is generated, but commit it too so the site deploys without network access.
- Never hand-edit `public/data/<id>.json` for importer cities; the next import overwrites it. Fix the
  config or drawn file instead.
- Caches (`.cache/`) are git-ignored. Use `--refresh` / delete them to pull newer OSM data, and review the diff.

### Size budgets (per city file)
| Size | Status | Action |
|---|---|---|
| < 1 MB | Good (Tokyo with private railways is the largest, see research/tokyo.md) | none |
| 1–4 MB | OK; slower first load on mobile | raise `simplifyMeters` to 25–40 |
| > 4 MB | Too big | raise simplification, split into two cities (e.g. "Tokyo – private railways"), or trim the bbox |

Roughly 100 lines and 1,500 stations per city render smoothly. Only the selected city is downloaded,
so the number of cities doesn't affect load time.

### Big networks
- **Subdivide with groups.** One import per operator/network, nested via `parent` (JR > JR East, Subway >
  Tokyo Metro / Toei). The sidebar becomes a tree you can toggle by operator.
- **Prefer `groupBy: "route_master"`** (default) so services sharing a line (express/local) collapse into one
  line; switch to `"route"` only when services really are separate lines.
- **Clip with `bbox`** to keep regional lines from running 200 km into the countryside.
- **Layer a curated core and an importer config.** Tokyo does this: `scripts/tokyo/build.mjs` writes the
  hand-curated JR / subway core to `scripts/tokyo/out/tokyo-core.json`, and `cities/tokyo/city.config.json`
  uses it as `base` with one `osm` import per private operator (Tokyu, Odakyu, Keio, Seibu, Tobu, Keisei,
  Keikyu, Sotetsu, third-sector, monorail/AGT), nested under a `private` group. Station names match across the
  layers, so Shibuya, Shinjuku, Yokohama etc. become one interchange. Groups may nest under a base group
  (`"parent": "subway"`).

### Many cities
- `public/data/cities.json` is the registry; the importer upserts entries and keeps the order. Reorder by hand.
  Each entry carries a `bbox` for the "switch to this city" prompt when panning; `npm run index` refreshes
  all of them after you edit data by hand.
- Past ~12 cities the switcher should group by `country` (small UI change in `Sidebar.tsx`; not done yet).
- Keep one research note per city (`research/<id>.md`): what's official vs approximate, open questions, the
  date researched. Future you needs this when a plan changes.

### Keeping vision maps honest
- Official plans change every few years (Hanoi's went from ~10 to 18 lines between 2016 and 2026). Record
  the decision number and date in `sources`, and the plan horizon in `timeline.max`.
- Use `proposed` for anything that isn't in an official plan, including your own fan lines, and put fan
  maps in their own city (`base` + drawn file) rather than mixing them into the researched one.
- Mark every guessed position `approx: true`; the map draws those faded, so viewers can tell.

### When to migrate Hanoi / HCMC / Tokyo to the importer
Not needed. Their pipelines encode research that a generic importer can't (station-by-station curation,
OSM cut points). Migrate one only if you want a single workflow. The path is: export it as GeoJSON from the
app, create `cities/<id>/` with that file as a `geojson` import, then delete `scripts/<id>/` and its
`data:<id>` script.

---

## 10. Troubleshooting

| Message | Meaning / fix |
|---|---|
| `"hanoi" is built by its own pipeline` | Use `npm run data:hanoi` (section 3). (Tokyo has a `cities/tokyo/` config, so `npm run import -- tokyo` works; it rebuilds only the private-railway layer on top of the committed core.) |
| `no station within 150 m of the start, added approximate station` | Line end has no Point; add one there, or set `from`/`to`. |
| `station "X" is not near any line` | The point is >150 m from every drawing: move it, set `line`, or raise `options.snapMeters`. |
| `fewer than 2 distinct stations, dropped` | All stations of a segment merged into one; usually two points with the same name close together. |
| `override "X" matched no imported line` | Typo in a `lines` key; keys are matched against id, source key, code and name. |
| `unknown source "X" ignored` | Add `X` to the config's `sources`. |
| `line X: replaces the base dataset's line` | Your drawn line got the same id as a base line. Rename it if that wasn't intended. |
| Validator `A -> B is 14 km apart` | Missing intermediate stations, or a coordinate typo (swapped lng/lat). |
| Validator `path starts 2 km from …` | Drawing direction or extent doesn't match the station list. |
| Overpass `429` / timeouts | Retries and fallback servers are automatic; rerun later. Cached data is reused. |
| Two different stations merged | Same name within 400 m (rare). Give one an explicit `id`, or lower `stationMergeMeters`. |
