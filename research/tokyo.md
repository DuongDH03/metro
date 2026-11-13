# Tokyo dataset notes

Two layers, rebuilt together by `npm run data:tokyo`:

1. **Curated core** (JR, Shinkansen, Tokyo Metro, Toei, JR / subway projects): `node scripts/tokyo/build.mjs` (Overpass/OSM + curated `scripts/tokyo/lines.mjs`) writes `scripts/tokyo/out/tokyo-core.json` (about 170 KB, committed). Data accessed 2026-11-13.
2. **Importer layer** (private railways, third-sector lines, monorails / AGT / trams, Yokohama subway, their projects): `npm run import -- tokyo` reads [cities/tokyo/city.config.json](../cities/tokyo/city.config.json) with the core as `base` and writes `public/data/tokyo.json` (about 470 KB). Data accessed 2026-11-14 (OSM data of 2026-11-13).

The sections up to "Private railways" describe the core.

## Coverage
- Bounding box: lng 139.0 to 140.4, lat 35.2 to 36.2. Lines are cut at the last station inside the box.
- 45 lines, 107 segments (101 operating, 3 construction, 3 planned), 618 stations (11 approximate).

| Group | Lines |
|---|---|
| tokyo-metro (9) | G, M (+ Mb Hōnanchō branch), H, T, C (+ Kita-Ayase branch), Y, Z, N, F |
| toei (4) | A, I, S, E (loop + radial) |
| jr-east (28) | JY loop, JC Chūō Rapid (to the box edge past Takao), JB, JK (+ Negishi), JA Saikyō + Kawagoe, JS, Ueno-Tokyo, JT, Utsunomiya, Takasaki, JO Yokosuka/Sōbu Rapid, JJ (+ Jōban beyond Toride), JL, JE (+ Nishi-Funabashi branch), JM, JN (+ Hama-Kawasaki branch), JH, Ōme, Itsukaichi, Hachikō, Sagami, Tsurumi (+ 2 branches), Narita (+ Abiko and Airport branches), Sōbu Main east of Chiba, Uchibō, Sotobō, Kururi, Haneda Airport Access Line |
| jr-shinkansen (3) | Tōkaidō (Tokyo–Odawara, JR Central), Tōhoku (Tokyo–Ōmiya), Jōetsu (Ōmiya–Kumagaya) |
| subway-planned (1) | Tokyo Rinkai Subway |

- **Interchanges:** stations with the same Japanese name within about 450 m are merged into one id. Checked: shinjuku has 8 lines, tokyo 12, ikebukuro 6, otemachi 5 (M/T/C/Z/I), ueno 8.
- **Yamanote:** the loop closes (Shinagawa back to Shinagawa).
- **Station codes:** taken from OSM stop `ref` tags and checked against a sequential fit for each segment, which fixes OSM typos (for example, Nerima-kasugachō is E37). Ōedo and Yamanote use a loop modulus. Marunouchi Mb is set by hand.

## Upcoming projects
| Project | Status | Year | Sources |
|---|---|---|---|
| Namboku Line Shirokane-takanawa–Shinagawa branch (2.5 km) | construction (started 2024-11) | 2035 ("mid-2030s") | Tokyo Metro release 2024-11-05; Impress Watch |
| Yūrakuchō Line Toyosu–Sumiyoshi extension (5.2 km; Edagawa, Tōyōchō, Sengoku are provisional names) | construction (started 2024-11) | 2035 ("mid-2030s") | Tokyo Metro release; TMG 2022; Koto City |
| JR Haneda Airport Access Line, East Yamanote route | construction (started 2023-06) | 2031 (FY2031) | JR East 2023-04-04; Norimono News |
| Haneda Access Line, Rinkai route (Shin-Kiba–Haneda) | planned | none (aims to open with the East route) | same |
| Tokyo Rinkai Subway (Tokyo–Ariake/Tokyo Big Sight, 7 stations) | planned (draft plan 2022; JRTT to build, TWR to operate; no licence yet) | none (~2040 is unofficial) | Mynavi 2024-02; Chuo City; Wikipedia |
| Ōedo Line Hikarigaoka–Ōizumi-gakuenmachi (about 4 km, 3 stations) | planned (Toei study Oct 2025; no business plan or approval) | none | Impress Watch 2025-10-16; Nerima City |

Stations for these projects are curated with approximate coordinates (`approx: true`). New stations that sit at existing stations (Shinagawa, Tōyōchō, Sumiyoshi, Kachidoki, Tokyo) snap to the existing station id. Paths for the two Haneda routes are hand-drawn and approximate. The other projects are drawn as straight lines between stations.

## Known gaps and caveats
- **Opening years:** each section's first opening year, rounded. Fukutoshin, Shōnan-Shinjuku and Ueno-Tokyo are services that run on older tracks. Saikyō uses 1985/2002.
- **Line colours:** JR colours are approximate JR East hex values. Utsunomiya and Tōkaidō share orange, and Takasaki has been shifted slightly to tell it apart. The Haneda Access Line and Rinkai Subway have no official colour yet.
- **Codes:** 183 stations have none. These are mostly JR lines without numbering (Sagami, Hachikō, Bōsō lines) or stations where OSM has no ref (for example, some Ōme and Chūō local stations).
- **Station names:** English names come from OSM `name:en`. Capitalisation is inconsistent ("Higashi-ikebukuro" vs "Higashi-Abiko"). A few names are fixed in `EN_OVERRIDES`.
- **Not included in the core** (private railways, TX, Rinkai Line, monorails / AGT and the Tama Monorail extension are in the importer layer, see below):
  - Hokuriku Shinkansen (it branches at Takasaki, outside the box)
  - Haneda Access West Yamanote route (proposed)
  - Musashino freight-only south section
- **Scrambled OSM relations:** Sagami, Kururi and Sōbu Main are ordered by chaining their geometry (`sort: true`). Narita airport branch stop order in OSM is partly wrong, so the segment starts at Shisui.
- **Data freshness:** the kumi.systems Overpass mirror was missing some recent relations. The fetcher checks that every requested relation is present and otherwise falls back to the other endpoint. Delete `scripts/tokyo/.cache/` to refresh.

## Private railways (importer layer, 2026-11-14)

Config: [cities/tokyo/city.config.json](../cities/tokyo/city.config.json) (one `osm` import per operator, `lines` overrides for ids, English names, colours, codes and opening years, `exclude` for limited-express-only and duplicate service masters) + [cities/tokyo/future-private.geojson](../cities/tokyo/future-private.geojson) (projects). Overpass data of 2026-11-13. Validation: 0 errors, 0 warnings.

Totals with the core: 122 lines, 197 segments (184 operating, 3 construction, 2 approved, 8 planned), 1,421 stations (22 approximate). The importer layer adds 77 lines and 803 new stations; 85 of its stations are shared with the core (interchanges).

| Group (sidebar) | Lines | Stations | Lines |
|---|---|---|---|
| Private > Tokyu | 10 | 99 | TY, DT, MG, OM, IK, TM, KD, SG (lrt), SH Shin-Yokohama, Shin-Kūkō (approved) |
| Private > Odakyu | 3 | 67 | OH, OE, OT |
| Private > Keio | 7 | 70 | Keiō Line, Sagamihara, Takao, Keibajō, Dōbutsuen, New Line (all KO), IN Inokashira |
| Private > Seibu | 12 | 92 | Ikebukuro, Chichibu, Sayama, Toshima, Yūrakuchō (SI), Shinjuku, Haijima (SS), Kokubunji, Seibuen (SK), Tamako (ST), Tamagawa (SW), Yamaguchi (SY, agt) |
| Private > Tobu | 8 | 127 | Skytree (TS), Isesaki (TI, to Hanyū), Nikkō (TN, to Shin-Koga), Urban Park (TD), Tōjō (TJ), Ogose, Kameido, Daishi |
| Private > Keisei | 8 | 91 | Main, Oshiage, Chiba, Chihara, Kanamachi, Higashi-Narita (KS), Narita Sky Access (Access Express stops), Matsudo (SL, ex-Shin-Keisei) |
| Private > Keikyu | 5 | 70 | Main, Airport, Daishi, Zushi, Kurihama (to Keikyū-Nagasawa, box edge) |
| Private > Sotetsu | 3 | 27 | Main, Izumino, Shin-Yokohama Line |
| Private > Third-sector & other | 8 | 91 | Tsukuba Express, Rinkai Line, Saitama Railway, Tōyō Rapid, Hokusō, Minatomirai, Ryūtetsu Nagareyama, Enoden |
| Private > Monorails, AGT & trams | 11 | 156 | Tokyo Monorail, Tama Monorail, Shōnan Monorail, Chiba Monorail 1 and 2 (monorail); Yurikamome, Nippori-Toneri Liner, Kanazawa Seaside Line, New Shuttle, Yamaman (agt); Tokyo Sakura Tram (tram) |
| Subway > Yokohama Municipal Subway | 2 | 43 | Blue Line, Green Line |

### Interchanges
Stations merge across the layers when the Japanese or English name matches within 400 m. Line counts at the main hubs (all operators): Tokyo 13, Shinjuku 10 (+ Odakyu, Keio), Yokohama 10 (+ Tōkyū, Keikyū, Sōtetsu x2, Minatomirai, Blue Line), Shibuya 9 (+ Tōyoko, Den-en-toshi, Inokashira), Ikebukuro 8 (+ Seibu, Tōjō), Shinagawa 7 (+ Keikyū), Shimbashi 7 (+ Yurikamome), Chiba 7 (+ Chiba Monorail 1 and 2), Nippori 6 (+ Keisei x2, Toneri Liner), Kita-Senju 5 (+ Tōbu, TX), Akihabara 5 (+ TX), Shin-Yokohama 5, Nishi-Funabashi 5 (+ Tōyō Rapid), Musashi-Kosugi 5, Ōfuna 5 (+ Shōnan Monorail), Oshiage 4 (+ Tōbu, Keisei), Ōsaki 4 (+ Rinkai), Machida 4 (+ Odakyu x2, Tama Monorail project), Kamata 4 (+ Ikegami, Tamagawa, Shin-Kūkō), Hiyoshi 4, Fujisawa 4, Ebina 3.

Kept separate on purpose (different names or more than 400 m apart, as in reality): Keisei-Ueno / Ueno, Seibu-Shinjuku / Shinjuku, Monorail Hamamatsuchō / Hamamatsuchō, Tokyo Skytree / Oshiage, TX Asakusa / Asakusa (600 m), Toden Waseda / Waseda, Keikyū Gumyōji / Blue Line Gumyōji (490 m), Haneda Airport Terminal 1·2 (Keikyū) / Monorail Terminal 1 and Terminal 2, Tōbu Kasumigaseki (Kawagoe) / Kasumigaseki.

### Upcoming private-railway projects
| Project | Status | Year | Sources |
|---|---|---|---|
| Shin-Kūkō (Kamakama) Line phase 1: Yaguchinowatashi – Kamata (underground) – Keikyū Kamata, through service from the Tōkyū Tamagawa / Tōyoko lines | approved (MLIT certified the plan 2025-10-03; surveys and design 2026; construction not started) | 2040 (target "early Reiwa 20s" = 2038–2042; works to March 2042) | Ota City (2026-03/04), Aviation Wire 2025-10-07, Norimono News 2026-03 |
| Tama Monorail Kamikitadai – Hakonegasaki (~7 km, 7 stations "No.1–No.7") | approved (track patent 2025-05, city-planning approval 2025-11, first construction approval 2026-05-22; physical works not yet started) | 2035 ("mid-2030s") | Tama Monorail 2026-05-25, Norimono News 2026-05-29, TMG 2026-10 (station design consultation) |
| Tama Monorail Tama-Center – Machida (~16 km, route B) | planned (MLIT report 198; TMG route committee chose route B) | none | TMG route committee, MLIT 198 |
| Tsukuba Express Akihabara – Tokyo (~2 km) | planned (MLIT report 198; municipalities' alliance rally 2026-04-06; no business scheme) | none | Tabiris 2026-04/06, Norimono News |
| Yokohama Blue Line Azamino – Shin-Yurigaoka (6.5 km, 2 intermediate stations) | planned (city decided 2019; 2026 budget for design and surveys toward a railway business permit) | none (the official 2030 target is being re-examined) | Norimono News 2026, Tetsudo Channel |
| Saitama Railway Urawa-Misono – Iwatsuki (7.2 km; Saitama Stadium temporary station, intermediate station near Ukiya) | planned (prefecture and city formally requested the project 2026-03-31; MLIT certification not yet applied for) | 2041 (April 2041 in the draft plan) | Impress Travel Watch 2026-03-31, Saitama Prefecture draft plan 2026-03 |
| Odakyu Tama Line Karakida – Sagamihara – Kamimizo (~8.8 km) | planned (MLIT report 198; Sagamihara / Machida studies, no business plan) | none | Sagamihara City, MLIT 198 |

All project stations except existing termini are approximate (`approx`), with provisional names. Extensions are drawn with the id of the OSM line so they append to it (TX, Tama Monorail, Blue Line, Saitama Railway, Odakyu Tama). Not added: Keikyū, Keiō, Seibu, Tōbu and Sōtetsu have no new-line projects in an official plan; Shin-Kūkō phase 2 (to Haneda over Keikyū tracks) is a study only.

### Importer fixes made for this layer
- `scripts/import/osm.ts`: stops listed out of order in OSM (Odakyu Odawara, Seibu Ikebukuro / Shinjuku, Tōkyū Ikegami / Ōimachi, Tōbu Urban Park / Ogose, Sōtetsu, Keisei) are reordered along the route's track when every stop lies on it; route variants with complete geometry are preferred as a line's main segment (Tōbu Urban Park, Skytree); within a stop_area a station named like the stop wins over a differently named station object (Nippori-Toneri Liner "西日暮里駅舎"). Singapore rebuilds byte-identical.
- `scripts/import/config.ts`: config groups may nest under a base group (`"parent": "subway"`).

### Known gaps
- **Kita-Senju (Tōbu):** missing from every OSM Skytree Line route relation; a short drawn operating segment Ushida – Kita-Senju – Kosuge in `future-private.geojson` connects the interchange (it overlaps the OSM segment).
- **Service-based routes:** OSM models some lines as services. Sōtetsu Izumino includes the Yokohama – Futamatagawa through running; Narita Sky Access shows Access Express stops from Keisei-Ueno (overlapping Keisei Main and Hokusō); Keikyū Main has a short Shinagawa – Sengakuji segment.
- **Not imported:** limited-express-only services (Romancecar, Skyliner, Koedo, Haijima Liner, TJ Liner), Seibu Abina freight branch, Sōtetsu Atsugi freight line, Kantō Railway, Shibayama Railway, Izu-Hakone, Hakone Tozan, Kominato, Isumi, Disney Resort Line.
- **Colours:** OSM `colour` where it is a hex value; Keikyū (#00a3e4), Tōbu Isesaki / Urban Park, Tōkyū SH, Shōnan Monorail, Enoden, Yamaman and the Shin-Kūkō Line are approximate or not official.
- **Opening years:** first-section year of each line, applied to all its operating segments (branches are not staged). The timeline starts at 1927, so older lines appear from the start.
- **Names and codes from OSM:** English names follow OSM `name:en` (inconsistent capitalisation; 洗足池 shows as "Senzoku" because its OSM station object has a wrong `name:en`). 311 stations in the whole city have no station code.
- **Refresh:** `npm run import -- tokyo --refresh` re-downloads (12 Overpass queries); review the diff, since OSM route edits can reorder or drop stations.
