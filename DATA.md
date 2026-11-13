# Data authoring guide

The app renders whatever is in `public/data/`. Nothing city-specific is in the React code.

- `public/data/cities.json`: list of cities (`CityIndexEntry[]`)
- `public/data/<city>.json`: one `CityData` document per city

To import or maintain cities, see [docs/IMPORTING.md](docs/IMPORTING.md).

The TypeScript contract is in [src/types.ts](src/types.ts). Run `npm run validate` after any data change.

## Rules

1. **Coordinates are `[lng, lat]`** (GeoJSON order), WGS84, 5 decimal places is plenty.
2. **Station ids** are unique within a city, lowercase kebab-case ASCII (`cau-giay`, `ben-thanh`, `shinjuku`).
   Interchanges are **one station shared by several lines**. Do not duplicate a station per line
   unless the platforms are really far apart (>400 m) and have different names.
3. **Segments** split a line wherever status, opening year, or branch differs.
   Adjacent segments share their boundary station id so the line is drawn continuously.
   A loop (Yamanote) repeats the first station id at the end.
4. **Status** (see `Status` in types.ts): be honest. Only use `operating` for revenue service,
   `construction` when work is physically underway, `approved` when investment is approved,
   `planned` for official master plans, `proposed` for anything else (studies, concepts, long-range vision).
5. **Year**: actual opening year for operating segments; official target year otherwise. Omit if unknown.
6. **approx: true** on any station whose location is estimated rather than taken from an official
   map or OpenStreetMap.
7. **path** (optional): detailed geometry for a segment. Must start near the first station and end near
   the last. Simplify it (~10-20 m tolerance) to keep files small.
8. **Sources**: every line should cite at least one `Source` id. Prefer official documents
   (government decisions, operator sites), then reputable press, then Wikipedia.
9. Line colors: use the official color when one exists; otherwise pick a distinct color and say so in
   `description`.
