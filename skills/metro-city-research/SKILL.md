---
name: metro-city-research
description: Research a city's urban rail network today and in the future (operating, under construction, approved, planned and proposed metro/LRT/monorail lines from the newest official master plan) and turn it into map-ready data with sources - a GeoJSON file that opens in geojson.io / Google My Maps and imports into a metro-vision map app, plus research notes. Use this whenever someone wants to map, visualise, list or compare a city's metro plans or "future metro map", asks which lines are planned/under construction in a city and when they open, wants to add a new city to a metro map project, or mentions master plans, urban railway decisions, or metro vision 2030/2045/2050 - even if they don't say "research" or "GeoJSON".
---

# Metro city research

Goal: a trustworthy, sourced picture of one city's rail network over time, delivered as data people can
see on a map. The hard part is not drawing; it's getting the *current* official plan right, because
plans are revised every few years and news sites keep stale numbers alive for years.

Read `references/conventions.md` first: it defines statuses, the GeoJSON format and source rules.

## Workflow

### 1. Scope (ask only if genuinely unclear)
City and boundary (cities merge: e.g. HCMC absorbed Bình Dương and Bà Rịa–Vũng Tàu in July 2025), which modes
(metro / LRT / monorail / tram / suburban rail), and horizon (2030, 2045, 2050…). Default: all urban rail
in the official plan, to its final horizon.

### 2. Find the newest official plan before anything else
Search in English *and* the local language (Vietnamese: "quy hoạch đường sắt đô thị <city> mới nhất",
"quyết định … đường sắt đô thị"; Japanese: "<city> 鉄道 計画 答申"; Thai, Indonesian, etc.).
Identify the governing document (decision/resolution number and date) and check nothing newer superseded
it: search for "<city> metro plan <current year>" and read the dates on articles. Note conflicting numbers
(lengths, line counts) instead of silently picking one.

### 3. Per line, establish
Official number/code, name, alignment (terminals + key places), length, station list if published, status per
section (operating / construction / approved / planned / proposed, applying the definitions literally), opening
or target year per section, official colour, and 1–3 sources with dates. Groundbreaking ≠ construction unless
works are physically underway; say which in `description`.

Use parallel subagents (one per few lines) if the network is large and you have them; give each the plan
document and the conventions file.

### 4. Locate stations
- Use `python scripts/geocode.py --city "<City>, <Country>" "<place>" "<street A> & <street B>" ...` (or
  `--file list.txt`): OpenStreetMap lookup, accent-insensitive, intersections via `A & B`, cached and rate
  limited. Pass native paths (on Windows `D:\...`). If lookups fail (no network in the sandbox), estimate
  from what you know and mark the station `approx: true`.
- Operating lines: OpenStreetMap station coordinates (query "<name> station") or the operator's map.
- Planned lines with published station lists: place each at its named intersection/landmark, `approx: true`.
- Lines described only by places ("via Ring Road 3 to Linh Dam"): add waypoint stations at those places,
  `approx: true`, and say so in the line's `description`.
- Interchanges: one Point with the exact same name for all lines through it.

### 5. Write the deliverables
- `<city>-metro.geojson`: lines as LineStrings drawn through their station Points (follow the real
  roads/rivers the alignment follows when you know them; straight lines between stations are acceptable
  otherwise), one feature per segment with `status`/`year`/`label`; stations as Points. Set both `color`
  and `stroke`.
- `<city>-research.md`: a table (line, status, year, length, stations, sources) + the governing plan +
  "Uncertainties" (conflicting figures, unverified items, approximate alignments). Date everything.
- **Inside a metro-vision repo** (has `scripts/import/cli.ts`): put the GeoJSON in `cities/<id>/`,
  scaffold the config with `npm run import -- --new <id> --name "<City>" --center <lng>,<lat>`, wire the
  file as a `geojson` import with sources/groups, and run `npm run import -- <id> --dry` until there are 0
  errors, then without `--dry`. Put notes in `research/<id>.md`. Read the repo's `docs/IMPORTING.md` if anything is unclear.

### 6. Check before handing over
Run `python scripts/network_stats.py <file>` (works on GeoJSON or CityData). Fix what it flags: segments
with <2 stations, unattached stations, 300 m duplicates, unexplained >6 km gaps, lines with no interchange
that should have one, crossings with no shared station (often a missing interchange in your data, sometimes
true in the plan: then say so). Paste its summary table in your reply.

## Reply format
Short summary first (number of lines/km by status, the plan you followed), then the files, then
uncertainties. Tell the user how to look at it: drag the GeoJSON onto geojson.io, import into Google My Maps,
or drop it onto the metro-vision app.
