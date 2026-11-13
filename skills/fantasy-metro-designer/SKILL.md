---
name: fantasy-metro-designer
description: Design a fantasy / fan-made / "what if" metro network for any real city - the kind of 50-year vision maps people make on YouTube and Reddit - with believable alignments on real streets, interchanges with the real network, line names, colours, phases by year, and a pitch for each line, delivered as GeoJSON and KML that open in Google My Maps, geojson.io or a metro-vision map app with a timeline. Use it whenever someone wants to dream up, sketch, propose or "fix" a city's metro, asks "what would a perfect metro for X look like", wants fan lines over an existing map, a fictional city's transit, or a network for a game/worldbuilding - even if they just say "make me a cool metro map for Hanoi".
---

# Fantasy metro designer

You're a transit planner with a fan's enthusiasm: the network should be fun *and* defensible, the
kind of map that makes locals say "yes, that's exactly where a line should go". Fantasy means unofficial,
not careless: real streets, real places, sensible station spacing, honest labelling.

Read `references/conventions.md` for the file format (the same format real plans use, so fan lines can sit
on top of the real network).

## 1. Brief (one quick question if needed, otherwise pick defaults and say so)
City; horizon (default 2075 / "50-year vision"); size (default 8–12 lines); vibe: *realistic*
(budget-aware, phased), *ambitious* (Tokyo-scale), or *chaotic fun*; build on the real network
(default yes) or from scratch; modes allowed (metro, LRT, monorail, tram, regional rail).

## 2. Understand the city (10 minutes of research beats guessing)
Look up: the real network today and in the official plan (so you extend it, not duplicate it); centres
of gravity (CBD, old town, universities, hospitals, stadiums, airports, intercity rail stations, ports,
new urban areas); main radial roads, ring roads and rivers/bridges; where people live densely. Note 10–20
"must serve" anchors with coordinates.

## 3. Design principles (explain your choices against these)
- **Radials + rings + crosstown:** radials into the core from every major direction; a ring that hits
  every radial (the ring is what makes a network, not a star); a couple of crosstown lines that avoid the
  centre to take load off it.
- **Interchanges are the product:** every line meets ≥2 others; key hubs have 3–4 lines; avoid two lines
  running parallel within ~800 m for long stretches; avoid lines that cross without a shared station.
- **Follow corridors:** align elevated/surface lines along wide arterials and rivers; tunnels can cut
  under the old town. Bridges/river crossings are expensive: use them deliberately.
- **Spacing:** 0.8–1.2 km in the core, 1.5–3 km in suburbs; express/regional lines further apart.
- **Phasing that tells a story:** phase 1 = the obvious trunk lines, then the ring, then suburbs and
  airport links, then the crazy stuff. Give each segment a `year` so a timeline animates growth.
- **Identity:** a consistent naming scheme (numbers, letters, colours or themed names), distinct
  colours (no two similar hues sharing a hub), one-line pitch per line.

## 4. Build the file
Write a convention GeoJSON (`<city>-fantasy.geojson`):
- One LineString per segment, drawn along real streets with enough vertices to follow curves
  (look up coordinates of intersections; don't draw straight across a river or a lake).
- Props: `line`, `name`, `code`, `color` + `stroke`, `group` (e.g. "Fan vision" or one group per phase), `mode`,
  `status: "proposed"` (always: it's fantasy), `year`, `label` (phase name), `description` (the pitch).
- Station Points with real place names; where you meet a real station, use its exact official name so
  it becomes a shared interchange with the real network. Mark guessed positions `approx: true`.
- Then convert for Google My Maps: `python scripts/geojson_to_kml.py <in.geojson> <out.kml> --folder-by group`.

**Inside a metro-vision repo:** put both files in `cities/<city>-fan-vision/` with a config that uses
`"base": "public/data/<city>.json"` (keeps the real network underneath) and a `geojson` import with
`defaults: {"status": "proposed", "group": "fan"}`, then `npm run import -- <city>-fan-vision --dry`. Or
just drag the GeoJSON onto the running app to preview it over the real city.

## 5. Check
Run `python scripts/network_stats.py <file>`: total km, stations, interchanges, and problems (lines
without interchanges, stations that didn't attach, odd spacing). Fix, then report.

## 6. Present
A short "fan map" write-up: the network at a glance (lines, km, stations, phases), a table of lines with
colour, route and pitch, the 3–5 biggest hubs, and honest caveats ("unofficial fan concept; alignments
approximate"). Offer next steps: a timeline video script (metro-timeline-story) or a quiz.
