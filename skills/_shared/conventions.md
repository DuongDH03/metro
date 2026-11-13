# Metro data conventions (metro-vision format)

Read this before writing any network file. These conventions make files open in geojson.io / Google My
Maps *and* import losslessly into a metro-vision map app (`npm run import`, or drag-and-drop onto the app).

## Contents
1. Statuses (be honest)
2. GeoJSON drawing format (the default deliverable)
3. CityData JSON (what the app renders)
4. city.config.json (importer recipe, only inside a metro-vision repo)
5. Coordinates & stations
6. Sources

## 1. Statuses

| status | Use when | Common mistake |
|---|---|---|
| `operating` | In revenue service today | Test runs or a "technical opening" don't count |
| `construction` | Physical works have started on that section | A groundbreaking ceremony with no works yet: say so in `description` |
| `approved` | Investment/feasibility approved or funded, works not started | "Investment policy approved" in Vietnam = approved |
| `planned` | In an adopted official master plan, not yet approved for investment | Drafts under consultation are `proposed` |
| `proposed` | Studies, drafts, concepts, extensions floated, fan/fantasy lines | Never upgrade a fan line |

`year` = actual opening year for operating sections, otherwise the latest *official* target. Omit when
unknown rather than guessing. Split a line into segments wherever status, year or branch differs.

## 2. GeoJSON drawing format

A FeatureCollection. **LineString / MultiLineString = a line or one segment of a line. Point = a station.**

Line feature properties:

| prop | notes |
|---|---|
| `line` | identity; features with the same `line` are segments of one line (default: `name`) |
| `name`, `nameLocal`, `code`, `description`, `mode` | mode: metro, commuter, lrt, monorail, tram, agt, shinkansen |
| `color` (+ `stroke` same value for geojson.io) | `#rrggbb` |
| `group` | subdivision shown as a toggle (operator, network, phase…) |
| `status`, `year`, `label` | per segment |
| `opened`, `lengthKm`, `sources` | `sources` = comma list of source ids |
| `stations` | optional explicit ordered list of station `id`s or names; disables snapping |
| `from`, `to` | names for automatic end stations when no Point is at an end |
| `id` | force the line id; same id as an existing line in the same import = append segments to it |

Station (Point) properties: `name` (required), `nameLocal`, `codes` (comma list), `approx` (true when the
location is estimated), `id` (kebab-case ascii), `line` (comma list: attach only to these lines).

Attachment rules: a Point attaches to every line drawn within 150 m and is ordered along the drawing,
so **draw lines through station points**. Same name within 400 m = one shared interchange station, also
across files and with a base city. Line ends without a Point get an approximate auto station.

Minimal example:

```json
{"type": "FeatureCollection", "features": [
  {"type": "Feature", "properties": {"line": "L1", "name": "Line 1", "code": "1", "color": "#e3002c", "stroke": "#e3002c",
    "group": "metro", "status": "construction", "year": 2030, "label": "Phase 1"},
   "geometry": {"type": "LineString", "coordinates": [[105.80, 21.03], [105.83, 21.02], [105.85, 21.03]]}},
  {"type": "Feature", "properties": {"name": "Cau Giay", "nameLocal": "Cầu Giấy"},
   "geometry": {"type": "Point", "coordinates": [105.80, 21.03]}},
  {"type": "Feature", "properties": {"name": "Hanoi Station", "nameLocal": "Ga Hà Nội", "approx": true},
   "geometry": {"type": "Point", "coordinates": [105.85, 21.03]}}
]}
```

KML (Google My Maps): same properties as `key: value` lines in the placemark description; folder
(layer) name becomes `group`; line style colour becomes `color`.

## 3. CityData JSON

`{id, name, nameLocal?, center:[lng,lat], zoom, updated:"YYYY-MM-DD", timeline?:{min,max}, groups:[{id,name,parent?}],
lines:[{id, code?, name, nameLocal?, group, color, mode?, status, opened?, lengthKm?, description?,
segments:[{stations:[ids], status, year?, label?, path?:[[lng,lat]…]}], sources?:[ids]}],
stations:[{id, name, nameLocal?, coord:[lng,lat], approx?, codes?}], sources:[{id,title,url,accessed?}], notes?}`

Ids are kebab-case ASCII (`cau-giay`). A loop repeats its first station at the end. Interchanges are one
station shared by several lines.

## 4. city.config.json (inside a metro-vision repo)

Lives in `cities/<id>/` next to its drawn files. Scaffold with `npm run import -- --new <id> --name "X" --center lng,lat`.
Key fields: `id, name, nameLocal, country, center, zoom, timeline, bbox, base, groups, sources, notes,
imports:[{type:"osm"|"geojson"|"kml", file|filter, defaults:{group,status,mode,year,sources}}], lines:{<key>: override}, options`.
`base: "public/data/<city>.json"` extends an existing city. Build: `npm run import -- <id> --dry`, then without `--dry`.
The repo's `docs/IMPORTING.md` is the full reference: read it when working in the repo.

## 5. Coordinates & stations

- `[lng, lat]` order (GeoJSON). Vietnam ≈ [102–110, 8–23]; Tokyo ≈ [139.7, 35.7]. A lng/lat swap puts you in the ocean.
- Real stations: take coordinates from OpenStreetMap (Nominatim `https://nominatim.openstreetmap.org/search?q=…&format=json`,
  ≤1 request/s, generic User-Agent) or official maps. Planned stations: place at the named intersection/landmark and set `approx: true`.
- Station spacing sanity: urban metro 0.8–1.5 km, suburban 2–4 km, regional rail can be more.
- Use the exact local name of an existing station when a new line meets it, so it merges into an interchange.

## 6. Sources

Every line cites at least one source: `{id, title, url, accessed}`. Prefer, in order: government decisions
(decision/resolution number + date in the title), operator / project-management-unit sites, reputable press
with a date, then Wikipedia. Plans change every few years: always search for the newest plan before writing.
