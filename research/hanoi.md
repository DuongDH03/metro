# Hanoi urban rail: research notes (as of 2026-11-14)

Generated data: `public/data/hanoi.json`. Build: `node scripts/hanoi/fetch-osm.mjs && node scripts/hanoi/build.mjs`.
The curated table is `scripts/hanoi/lines.mjs`, and OSM responses are cached in `scripts/hanoi/cache/`.

## Planning framework

| Document | Content |
|---|---|
| Decision 519/QĐ-TTg (2016) | 10 lines, ~418 km, plus 3 monorails (~44 km). Superseded. |
| Decision 1569/QĐ-TTg (Dec 2024, Capital Plan 2021–2030 / vision 2050; its rail annex was not checked separately) and Decision 1668/QĐ-TTg (27 Dec 2024, general plan to 2045 / vision 2065) | 14–15 lines, ~616.9 km. About 410.8 km by 2035 and 200.7 km in 2036–2045. Lines 1A, 10 (Cát Linh – Yên Nghĩa), 11 and 12 were added. |
| Resolution 188/2025/QH15 (19 Feb 2025) | Special mechanisms for urban rail in Hanoi and HCMC. HĐND Hanoi amended the project annex in July 2026 to add 2A Xuân Mai, 3 Nhổn – Trôi – Sơn Tây, and others. |
| **Capital Master Plan, 100-year vision** (Decision 2512/QĐ-UBND, 13 May 2026) | **18 lines, ~979 km** (~1,200 km including regional rail). Phases: 2026–2030 (8 lines, ~379 km), 2031–2035 (~177 km), 2036–2045 (~440 km). **This is the plan used in the dataset.** |

Key source: VnExpress, 21 Jul 2026, "Tiến độ 18 tuyến đường sắt đô thị ở Hà Nội". It has the full phase tables.

The 2026 plan has no monorail, LRT or tram lines, so the dataset has none. The 2016 monorails M1–M3 were dropped.

## Lines

The dataset uses these years: 2030, 2035 and 2045 are phase targets. The column abbreviations are UC (under construction) and PL (planned).

| Line | Section | Status | Year | km | Notes |
|---|---|---|---|---|---|
| 2A | Cát Linh – Yên Nghĩa | operating | 2021 | 13 | Opened 6 Nov 2021. 12 stations. OSM geometry. |
| 2A | Yên Nghĩa – Xuân Mai | PL | 2030 | 20 | Party Committee wants construction to start in 2026 and finish Dec 2030, alongside the Highway 6 widening. |
| 2A | Cát Linh – Ga HN – Gia Lâm – Cổ Loa – Yên Thường | PL | 2035 | 21 | |
| 3 | Nhổn – Cầu Giấy (elevated) | operating | 2024 | 8.5 | Opened 8 Aug 2024. |
| 3 | Cầu Giấy – Ga Hà Nội (underground, 4 stations) | UC | 2027 | 4 | Tunnel boring finished 13–14 Apr 2026. Commercial operation scheduled Dec 2027 (Tiền Phong, 9 May 2026). |
| 3 | Ga HN – Hoàng Mai (Yên Sở) | PL | 2030 | 8.8 | 7 underground stations: Hàng Bài, Trần Thánh Tông, Kim Ngưu, Mai Động, Tân Mai, Tam Trinh, Yên Sở. Investment preparation is under way, with an EU €10M grant (Oct 2026). Investment is not yet approved. |
| 3 | Nhổn – Trôi – Sơn Tây | PL | 2030 | 30.7 | |
| 3 | Yên Sở – Ngọc Hồi | PL | 2035 | 6 | |
| 1 | Hùng Vương Stadium – Ngọc Hồi – Ga HN – Yên Viên – Thư Lâm – Nội Bài | UC | 2030 | 60 (81 in other reports) | Groundbreaking 22 Jun 2026. Vinhomes–SGC turnkey contract signed Oct 2026. |
| 1 | Ngọc Hồi – second airport; Stadium – Đại Nghĩa; Nội Bài – Sóc Sơn; Thư Lâm – Sóc Sơn; Nội Bài – Phúc Yên | PL | 2045 | 26 / 25 / 19 / 14 / 5 | The second airport is placed at Trầm Lộng – Kim Đường (former Ứng Hòa), per Nhân Dân, Mar 2026. |
| 2 | Nam Thăng Long – Trần Hưng Đạo (2.1) | UC | 2030 | 11.5 | Groundbreaking 9 Oct 2025. 10 stations, C1–C10. Sources give 2029, 2030 or 2031. |
| 2 | Nội Bài – NTL; THĐ – Thượng Đình; Thượng Đình – Stadium | UC | 2030 | 5.9 / 19.7 / 20.9 | Groundbreaking 22 Jun 2026. The VnExpress lengths look swapped (Nội Bài – NTL is ~20 km). |
| 2 | Stadium – Phú Xuyên | PL | 2045 | 9 | |
| 4 | Thượng Cát – Mỹ Đình Stadium – Linh Đàm – Long Biên – Cổ Loa – Mê Linh | PL | 2035 | 60 | |
| 5 | Văn Cao – Hòa Lạc | UC | 2030 | 39.6 | Construction started 19 Dec 2025. 20 stations (Decision 4602/QĐ-UBND, 4 Sep 2025, dropped Ngọc Mỹ). Station list from vi.wikipedia. |
| 5 | Văn Cao – Cổ Loa – Dương Xá – Cổ Bi | PL | 2035 | 27 | |
| 5 | Thạch Bình – Hòa Lạc airport / Ethnic Culture Village | proposed | – | – | Only mentioned as "possible if demand". |
| 6 | South Nội Bài – Ngọc Hồi | PL | 2035 | 42 | Corridor follows earlier plans (Kim Nỗ – Thượng Cát – Phú Diễn – Hà Đông). |
| 7 | Mê Linh – Ring Road 3.5 – Hùng Vương Stadium | PL | 2045 | 51 | |
| 8 | Hòa Lạc – Sơn Đồng – Mai Dịch – Lĩnh Nam – Dương Xá (Hanoi section) | UC | 2030 | 66 | Groundbreaking 22 Jun 2026. 91 km including Bắc Ninh. |
| 8 | 8A to Gia Bình airport (Bắc Ninh), 8B to Ecopark / Hưng Yên | PL | – | ~25 / ~26 | From vi.wikipedia and OSM. Phase not stated. |
| 8 | Phúc Thọ – Phúc Lộc; Phúc Thọ – Tây Đằng | PL | 2045 | 13 / 24 | |
| 9 | Mê Linh – Cổ Loa – Dương Xá | PL | 2045 | 46 | |
| 10 | Ring: Cổ Loa – Võ Chí Công – Ring Road 3 – Ring Road 2.5 – Times City – Cổ Loa | UC | 2030 | 43 | Groundbreaking 22 Jun 2026. Replaces the 2024 Line 10 (Cát Linh – Láng Hạ – Yên Nghĩa). |
| 14 | Thăng Long Bridge – Hồng Hà – Ocean Park | UC | 2030 | 27 (32 total) | Groundbreaking 22 Jun 2026. |
| 14 | Mê Linh (Quang Minh IZ) – Thăng Long Bridge | PL | 2035 | 21 | |
| 11 | Liên Hà – West Lake – Chúc Sơn | PL | 2045 | 43 | |
| 12 | Ngọc Hồi – Thường Tín – Phú Xuyên | PL | 2045 | 29 | |
| 13 | Phúc Thọ – Chúc Sơn – Ngọc Hồi | PL | 2045 | 44 | |
| 15 | Liên Hà – Ring Road 2.5 – Yên Viên | PL | 2045 | 49 | |
| 16 | Mê Linh – Thăng Long IZ – Yên Thường | PL | 2045 | 23 | |
| 17 | Hòa Lạc urban-area link | PL | 2045 | 20 | No alignment published. Drawn as an indicative Hòa Lạc – Xuân Mai link. |

## Geometry and station sources

- **Operating lines (2A, Line 3 elevated):** OSM route relations 9684066 and 12989508. Station nodes come from OSM.
- **Line 3 underground, Line 2.1 and Line 5:** OSM construction ways. Line 2.1 stations are OSM nodes. Line 3 S9–S11 and all Line 5 stations are estimated and snapped onto the OSM alignment.
- **Lines 1, 8, 10, 14 (2030 sections) and Line 8A:** OSM contributors traced these alignments and stations from published plan maps. They have no official station list. The names are provisional, and all of these stations are marked `approx`.
- **All other planned segments:** stations are indicative waypoints at the places named in the plan (geocoded with Nominatim where possible). They have no `path`.
- **Interchanges are merged into one station when they are within ~400 m:**
  - Line 3 "Hàng Bài" is merged with Line 2 Trần Hưng Đạo.
  - Line 8 Kiều Mai is merged with Line 3 Minh Khai.
  - Line 14 Lương Yên is merged with Line 3 Trần Thánh Tông.
  - Line 14 Thạch Cầu is merged with Line 10 Tư Đình.
  - Line 14 Phú Xá is merged with Line 10 Nhật Tân.
  - Line 1 Ngọc Lâm is merged with Gia Lâm.
  - Line 10 Vĩnh Hoàng is merged with Line 3 Tân Mai.
  - Line 8 Phú Thị is merged with Dương Xá.
  - Line 8 Thành Công is merged with Line 5 Vành đai 1.

## Colors

- **Official signage colors:** only 2A (#00C000) and 3 (#A5B635). Both come from OSM and Wikipedia.
- **Planning-map palette** (vi.wikipedia template `Hn-metro-color`): 1, 4 (changed to orange for contrast), 5, 6, 7, 8, 10 (darkened) and 14.
- **Chosen for contrast:** 2 (the planning map reuses 2A green), 9, 11–13 and 15–17.

## Open uncertainties

- **Line 8 inner alignment:** official texts say "Mai Dịch – Ring Road 3 – Lĩnh Nam". The provisional station list (vi.wikipedia, OSM) runs Cầu Giấy – Thái Hà – Kim Liên – Times City instead. The dataset follows the latter.
- **Construction status of the Vinhomes lines:** lines 1, 2 (outer sections), 8, 10 and 14 had ceremonial groundbreaking on 22 Jun 2026, and the EPC contracts were signed on 15 Oct 2026. Physical works are likely limited so far. They are marked "construction" because they officially started.
- **Lengths:** many lengths conflict between sources. Line 1 is given as 60 or 81 km. Line 8 is given as 64, 66 or 91 km. Line 2 is given as 56.5 or 58 km.
- **Line 2 southern section:** OSM places it via Tam Hưng (S2.32) to the stadium. The official waypoint list ("Thường Tín – Tam Hưng – Thượng Phúc – Dân Hòa") is geographically ambiguous.
- **"Hùng Vương Stadium" / "VinFast Trống Đồng" stadium:** the location is approximate (south of Hà Đông, near the Tam Hưng – Thượng Phúc area).
- **Second airport and branch phases:** the second airport is not approved yet. The phases of the 8A and 8B branches are not stated.
- **Line 3 Ga HN – Hoàng Mai:** listed for 2026–2030, but in Oct 2026 it was still in the preparation stage. The 2030 target looks optimistic.
