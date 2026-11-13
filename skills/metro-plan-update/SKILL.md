---
name: metro-plan-update
description: Turn metro/rail project news into a precise update of a city's network data - read an article, press release, government decision or link about a line opening, groundbreaking, approval, delay, new station list, renamed or cancelled plan, then work out exactly which line/section it affects, what the status and year should become under strict definitions, and apply the change with a dated source (in a metro-vision repo: edit the right table or config, rebuild, validate, update research notes). Use it whenever someone pastes or links metro/railway news, says "line X opened / started construction / got delayed", asks "is our map still up to date?", or wants to refresh a city's metro data - even if they don't mention files.
---

# Metro plan update

News about metro projects is noisy: ceremonies get reported as construction, targets as promises, drafts
as decisions. Your job is to turn one piece of news into the *smallest correct change* to the data, with a
source, and to say clearly what you did not change and why.

Status definitions and formats are in `references/conventions.md`; apply them literally.

## 1. Extract the facts
From the article (fetch the link if given; check its publish date first), write down:
- Project, line, and *which section* (terminals); city.
- Milestone type: opened to passengers, trial run, works started, groundbreaking ceremony, contractor
  signed, investment/feasibility approved, added to/removed from a master plan, target date changed,
  station list or alignment published, renamed/renumbered.
- Dates: event date and any new target year (and the old one if mentioned).
- Who says so: government decision (number), operator / project management unit, or press quoting someone.

## 2. Decide the change
Map the milestone to a status, conservatively:
- trial runs / "technical completion" → no change to `operating`; maybe `description`.
- groundbreaking ceremony → `construction` only if works physically started; otherwise keep the status and
  record the ceremony in `description`/`label`.
- contractor signed / funding agreed / investment policy approved → `approved` (if previously planned).
- in a newly *adopted* master plan → `planned`; in a draft under consultation → `proposed` at most.
- delay → update `year`, keep the old target in `description` ("originally 2027").
If a section's status changes but the rest of the line doesn't, split the segment.
If the news conflicts with existing data, prefer the more authoritative and more recent source; if unsure,
don't change the data. Report the conflict instead.

## 3. Apply it
**In a metro-vision repo** (has `docs/IMPORTING.md`), find where that city's data is authored. Never
hand-edit `public/data/*.json`:
- Hanoi: `scripts/hanoi/lines.mjs`, rebuild with `npm run data:hanoi`
- HCMC: `scripts/hcmc/build-hcmc.mjs`, rebuild with `npm run data:hcmc`
- Tokyo: `scripts/tokyo/lines.mjs`, rebuild with `npm run data:tokyo`
- Importer cities: `cities/<id>/city.config.json` (`lines` overrides) or its drawn `.geojson`/`.kml`,
  rebuild with `npm run import -- <id>`
- Other city with no table yet: read `docs/IMPORTING.md` section 2 to choose.
Edit: segment `status`/`year`/`label`, line `status` if this is now its most advanced section,
`description`, and add a source `{id, title: "<outlet>: <headline> (YYYY-MM-DD)", url, accessed}` cited by the
line. Rebuild and fix any validator errors. Append a dated entry to `research/<city>.md`.

**Outside a repo:** output the patch as a small table (line, section, field, old → new, source) and, if the
user has a GeoJSON/CityData file, edit that file directly.

## 4. Report
Lead with one line: "Updated <line> <section>: <old> → <new> (source, date)". Then anything you deliberately
left unchanged and why (e.g. "ceremony only, works not started"), conflicts with other sources, and follow-ups
worth watching (next milestone, date). If several articles are given, handle each, then summarise.
