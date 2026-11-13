# Ho Chi Minh City urban rail: research notes (as of 13 Nov 2026)

Generated data: `public/data/hcmc.json`. Build: `node scripts/hcmc/fetch-osm.mjs` (OSM to `scripts/hcmc/cache/`), then `node scripts/hcmc/build-hcmc.mjs`. `scripts/hcmc/geoprobe.mjs "<place>"` runs a Nominatim lookup (1 req/s) that was used to check hand-placed waypoints.

## Planning framework
- **Decision 568/QĐ-TTg (2013)**: 8 metro lines + 3 tram/monorail lines. Superseded.
- **Decision 1711/QĐ-TTg (31 Dec 2024)**, HCMC master plan 2021-2030 (vision 2050): 12 lines (~582 km incl. Line 11 riverside tram/LRT and Line 12 Cần Giờ). Alignments are listed road by road in Tiền Phong / VietNamNet (Feb 2025). This is the main basis for the planned lines.
- **Đề án (Dec 2024) under Kết luận 49-KL/TW, enabled by Resolution 188/2025/QH15**: Lines 1-7, ~355 km by 2035; Lines 8-10 (+155 km) by 2045, for 510 km. This shortened the old 2060 horizon to 2045.
- **Merger (1 Jul 2025)** with Bình Dương and Bà Rịa – Vũng Tàu gives 27 lines, ~1,012 km: HCMC 12 lines/582 km, BD 12/305 km, BRVT 3/125 km (Tuổi Trẻ and VOH, Sep 2025). The Sep 2025 10-line priority list (target 2035) has Line 2 incl. extensions, Line 1 Bến Thành – An Hạ, Line 3, Line 4, Line 6, Cần Giờ, BD Line 1, BD Line 2 (Thủ Dầu Một), Thủ Thiêm – Long Thành and BRVT Line 3. Lines 5 and 7 were proposed for deferral to 2036-2045.
- **HĐND, 26 Dec 2025**: added 5 projects to the Resolution 188 list: BD Line 1, Thủ Dầu Một line, BRVT Line 3, Thủ Thiêm – Long Thành, and the Line 1 extension to Đồng Nai/Long Thành.
- **Jul-Aug 2026**: 8 lines/sections (~255 km) targeted for 2030: L2 BT–TL, L2 BT–TT, Thủ Thiêm – Long Thành, BD L1, L6 phase 1, Cần Giờ, Thủ Dầu Một – Tao Đàn, L2 Tham Lương – An Hạ – Tây Bắc. A further 7 lines (~277 km) are targeted by 2035, bringing the network to ~532 km.
- **Draft 100-year network (ARUP consultant, Dân trí 26 Oct 2026)**: ~1,555 km (745 km metro to 2050, 350 km more metro and ~460 km LRT later). It renumbers lines (new 8, 10, 11, 13) and extends Lines 3, 4 and 7 to Tây Ninh, Thủ Dầu Một and Biên Hòa. It is not approved, so only a few extensions are included, as `proposed`.

## Lines

| Line | Status (best) | Year | Length | Notes / key sources |
|---|---|---|---|---|
| 1 Bến Thành – Suối Tiên | operating | 2024 | 19.7 km, 14 st. | Opened 22 Dec 2024. OSM relation 11919223 provides stations and path. West ext. to An Hạ is planned for 2035 (waypoints from the 1711 alignment). The Suối Tiên – Đồng Nai admin centre – Long Thành airport extension (~44 km, 6 + 5 future stations, unnamed) had its investment policy approved by Đồng Nai HĐND on 28 Apr 2026, with Govt Res. 255 on urgent construction; it is set as approved/2030 with indicative waypoints. |
| 2 Thủ Thiêm – Bến Thành – Tham Lương | construction | 2030 | 62.2 km full | BT–TL is 11.3 km/11 st., construction from 15 Jan 2026. BT–TT is 6.2 km/7 st., construction from 29 Apr 2026. Stations and track come from OSM. Tham Lương – An Hạ and 2S An Hạ – Tây Bắc Củ Chi are planned/2030 (Him Lam PPP proposal, alignment unpublished, waypoints only). Thủ Thiêm – Sông Tắc is planned with no year (1711 network). |
| 3 An Hạ – Tao Đàn | planned | 2035 | 32.5 km | The old Hiệp Bình Phước – An Hạ (45.8 km) north part now belongs to the Thủ Dầu Một – Tao Đàn line. Investor proposals are under study (Oct 2026). |
| 4 Đông Thạnh – Hiệp Phước | planned | 2035 | 47.3 km | Via Tân Sơn Nhất. ST.13–ST.30 come from OSM mapping of Sovico's ~43 km study (`approx`). The north is waypoints. The proposed N ext. to Thủ Dầu Một is from the draft. |
| 5 Hưng Long – VGP / Sông Tắc | planned | 2045 | 53.9 km | Deferred to 2036-2045. **Alignment uncertain**: three different versions exist (1711; Aug 2025 "Long Trường – Bảy Hiền – Đa Phước"; draft keeps only the Hoàng Văn Thụ – Tân Cảng branch). |
| 6 inner ring | approved (ph.1) | 2030 / 2035 | 53.8 km | Ph.1 Bà Quẹo – TSN – Phú Hữu is ~23 km, ST01–ST17, from OSM; >86,500 bn VND; construction start targeted end-2026. Ph.2 via Tân Thuận – Phú Lâm is waypoints/2035. |
| 7 Tân Kiên – Long Bình | planned | 2045 | 51.2 km | Deferred to 2036-2045. The proposed Biên Hòa ext. is from the draft. |
| 8 Đa Phước – Bình Mỹ | planned | 2045 | 42.8 km | Lines 8-10 are +155 km by 2045. |
| 9 Bình Triệu – An Hạ | planned | 2045 | 28.3 km | |
| 10 outer ring | planned | 2045 | 83.9 km | Loop via Cát Lái, Linh Trung, Tham Lương, Tân Tạo, Nhà Bè. |
| 11 riverside tram/LRT | planned | – | 48.7 km | Western Bus Station – Ba Son – Saigon riverside – Củ Chi (depot Trung An). No schedule. |
| 12 Bến Thành – Cần Giờ | construction | 2028 | 54 km | VinSpeed PPP, 350 km/h. Groundbreaking 19 Dec 2025. Phase 1 has 2 stations only. OSM proposed ways provide the path. Mode is set to `commuter` (no high-speed-rail mode in the contract). |
| LT Thủ Thiêm – Long Thành | approved | 2030 | 47.7 km | 11.5 km in HCMC; 18-20 st. THACO/Đại Quang Minh PPP. FS approval expected Nov 2026, construction target end-2026 (earlier dates Jul and Sep 2026 slipped). Stations and path are from OSM. |
| B1 TP mới BD – Suối Tiên | approved | 2030 | 32.4 km | 19 elevated st. (names unpublished, codes S0B…S17); ~55,000 bn VND. |
| B2 Thủ Dầu Một – Tao Đàn | approved | 2030 | ~35 km | Extended +15.6 km to Tao Đàn; 24 st. C0–C23 (OSM). Alignment approved; ~113,000 bn VND. |
| B1B, B2B, B2C, B3, B3B, B4–B8 | planned | – | 6.5–48.2 km | Former BD provincial plan (vi-wiki network table). Only endpoints and towns are known, so all points are indicative. |
| V3 Vũng Tàu – Bà Rịa – Phú Mỹ | planned | 2035 | ~40 km | On the priority list. MAUR proposed a study of extension to Long Thành (Jul 2026), shown as proposed (~56 km total). |
| V1 Vũng Tàu loop, V2 Vũng Tàu – Bình Châu | planned | – | 20 / 65 km | The 2023 draft provincial plan proposed "two monorail lines and one metro", so V1 and V2 are assumed monorail. Line numbering differs between sources (vi-wiki swaps V1/V2). |

## Uncertainties / caveats
- Statuses: `approved` means on the Res. 188 list or investment policy approved and preparation funded. Several of these (LT, B1, B2, L6 ph.1) still await formal FS/investment approval (expected Nov–Dec 2026). L2 west is `planned` (PPP proposal only).
- Target years are city targets and have slipped repeatedly. Line 2 has said "2030" since 2025 (wiki module still says 2030-2032).
- Station coordinates: operating and construction stations are OSM. Approved-line stations come from OSM volunteer mapping of published drawings. All other points are waypoints at roads and places named in plan texts (approx). They are not official stations, and their count does not match planned station counts.
- Lengths: TT–LT 42–48 km, B1 29–32.4 km, and Thủ Dầu Một line 33.2–38.9 km vary by source.
- Colours: Line 1 `#0079b8` and Line 2 `#cc205f` (OSM + Wikipedia), and Lines 3-12 use the Wikipedia module palette. None is confirmed as official for future lines. Others were chosen for this app.
- Out of scope: national/inter-regional rail (North–South HSR, HCMC–Cần Thơ, Biên Hòa–Vũng Tàu, HCMC–Tây Ninh, Chơn Thành – Cái Mép).

## Sources
All URLs are in the `sources` array of `hcmc.json` (27 entries, accessed 13 Nov 2026). The key ones are vi/en Wikipedia; Tiền Phong 10 Feb 2025 (1711 alignments); SGGP 10 Dec 2024 (355 km); Tuổi Trẻ 23 Sep 2025 (27 lines/10 priorities); VOH 27 Dec 2025; Tuổi Trẻ 30 Jul 2026 (255 km by 2030); VTC 15 Oct 2026 (status of 5 lines); VOH 8 Dec 2025 (Cần Giờ); Dân trí 26 Oct 2026 (draft 1,555 km); and OpenStreetMap.
