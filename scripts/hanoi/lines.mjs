// Hand-curated source table for the Hanoi dataset (researched 2026-11).
// build.mjs turns this + the cached OSM data (fetch-osm.mjs) into public/data/hanoi.json.
// See research/hanoi.md for the reasoning behind every status / year / alignment.
//
// Station fields:
//   osm:    OSM node id; coordinates are taken from OpenStreetMap
//   coord:  [lng, lat] when not taken from OSM (always estimated -> approx)
//   approx: estimated location (planned station, unofficial name or position)
//   snap:   geometry key; the coordinate is snapped onto that line's OSM alignment

export const OSM_ROUTE_RELATIONS = [9684066, 12989508]; // 2A Cát Linh→Yên Nghĩa, 3 Nhổn→Cầu Giấy

// OSM way selectors per geometry key (route relation ids and/or way-name regexes).
export const GEOMETRY = {
  l2a: { relations: [9684066] },
  l3: { relations: [12989508], names: [/Đường sắt đô thị 3 Hà Nội/] },
  l2: { names: [/Số 2 Hà Nội \(Phân đoạn Nam Thăng Long/] },
  l5: { names: [/[Ss]ố 5/] },
  l1: { names: [/s[ốô] 1 Hà Nội/], minPoints: 5 },
  l8: { names: [/s[ốô] 8 Hà Nội/], minPoints: 5 },
  l10: { names: [/s[ốô] 10 Hà Nội/], minPoints: 5 },
  l14: { names: [/s[ốô] 14 Hà Nội/], minPoints: 5 },
};

const A = { approx: true };

export const STATIONS = {
  // ---- Line 2A (operating, OSM) ----
  'cat-linh': { name: 'Cat Linh', nameLocal: 'Cát Linh', osm: 11176220549, codes: ['2A-01', '3-S10'] },
  'la-thanh': { name: 'La Thanh', nameLocal: 'La Thành', osm: 11176220550 },
  'thai-ha': { name: 'Thai Ha', nameLocal: 'Thái Hà', osm: 11176220551 },
  lang: { name: 'Lang', nameLocal: 'Láng', osm: 11176220552 },
  'thuong-dinh': { name: 'Thuong Dinh', nameLocal: 'Thượng Đình', osm: 11176220553 },
  'vanh-dai-3': { name: 'Vanh Dai 3', nameLocal: 'Vành Đai 3', osm: 11176220554 },
  'phung-khoang': { name: 'Phung Khoang', nameLocal: 'Phùng Khoang', osm: 11176220555 },
  'van-quan': { name: 'Van Quan', nameLocal: 'Văn Quán', osm: 11176220556 },
  'ha-dong': { name: 'Ha Dong', nameLocal: 'Hà Đông', osm: 11176220557 },
  'la-khe': { name: 'La Khe', nameLocal: 'La Khê', osm: 11176220558 },
  'van-khe': { name: 'Van Khe', nameLocal: 'Văn Khê', osm: 11176220559 },
  'yen-nghia': { name: 'Yen Nghia', nameLocal: 'Yên Nghĩa', osm: 11176220560 },

  // ---- Line 3 (elevated: operating, OSM; underground: under construction) ----
  nhon: { name: 'Nhon', nameLocal: 'Nhổn', osm: 11079400285, codes: ['3-S01'] },
  'minh-khai': { name: 'Minh Khai', nameLocal: 'Minh Khai', osm: 11079400284, codes: ['3-S02'] },
  'phu-dien': { name: 'Phu Dien', nameLocal: 'Phú Diễn', osm: 11079400283, codes: ['3-S03'] },
  'cau-dien': { name: 'Cau Dien', nameLocal: 'Cầu Diễn', osm: 11079400282, codes: ['3-S04'] },
  'le-duc-tho': { name: 'Le Duc Tho', nameLocal: 'Lê Đức Thọ', osm: 11079400281, codes: ['3-S05'] },
  'dai-hoc-quoc-gia': { name: 'National University', nameLocal: 'Đại học Quốc gia', osm: 11079400280, codes: ['3-S06'] },
  'chua-ha': { name: 'Chua Ha', nameLocal: 'Chùa Hà', osm: 11079400279, codes: ['3-S07'] },
  'cau-giay': { name: 'Cau Giay', nameLocal: 'Cầu Giấy', osm: 11079400278, codes: ['3-S08'] },
  'kim-ma': { name: 'Kim Ma', nameLocal: 'Kim Mã', coord: [105.8137, 21.0313], snap: 'l3', codes: ['3-S09', '5-S2'] },
  'van-mieu': { name: 'Van Mieu', nameLocal: 'Văn Miếu', coord: [105.8355, 21.0273], snap: 'l3', codes: ['3-S11'] },
  'ga-ha-noi': { name: 'Hanoi Station', nameLocal: 'Ga Hà Nội', osm: 14366413381, codes: ['3-S12'] },
  // Line 3 extension Ga Hà Nội – Hoàng Mai (7 underground stations, MRB design 2024)
  'tran-thanh-tong': { name: 'Tran Thanh Tong', nameLocal: 'Trần Thánh Tông', coord: [105.8577, 21.0182], ...A },
  'kim-nguu': { name: 'Kim Nguu', nameLocal: 'Kim Ngưu', coord: [105.8620, 21.0032], ...A },
  'mai-dong': { name: 'Mai Dong', nameLocal: 'Mai Động', coord: [105.8625, 20.9952], ...A },
  'tan-mai': { name: 'Tan Mai', nameLocal: 'Tân Mai', osm: 14369199421, ...A },
  'tam-trinh': { name: 'Tam Trinh', nameLocal: 'Tam Trinh', coord: [105.8652, 20.9775], ...A },
  'yen-so': { name: 'Yen So', nameLocal: 'Yên Sở', coord: [105.8665, 20.9690], ...A },
  // Line 3 western extension (waypoints only)
  troi: { name: 'Troi', nameLocal: 'Trôi', coord: [105.7099, 21.0682], ...A },
  phung: { name: 'Phung', nameLocal: 'Phùng', coord: [105.6650, 21.0880], ...A },
  'phuc-tho': { name: 'Phuc Tho', nameLocal: 'Phúc Thọ', coord: [105.5395, 21.1096], ...A },
  'son-tay': { name: 'Son Tay', nameLocal: 'Sơn Tây', coord: [105.5045, 21.1392], ...A },

  // ---- Line 2 section 2.1 Nam Thăng Long – Trần Hưng Đạo (under construction) ----
  'xuan-dinh': { name: 'Xuan Dinh', nameLocal: 'Xuân Đỉnh', coord: [105.7888, 21.0768], snap: 'l2', ...A, codes: ['2-C1'] },
  'ngoai-giao-doan': { name: 'Ngoai Giao Doan', nameLocal: 'Ngoại Giao Đoàn', osm: 14366421046, codes: ['2-C2'] },
  'tay-ho-tay': { name: 'Tay Ho Tay', nameLocal: 'Tây Hồ Tây', osm: 14366421045, codes: ['2-C3'] },
  buoi: { name: 'Buoi', nameLocal: 'Bưởi', osm: 14366421044, codes: ['2-C4'] },
  'quan-ngua': { name: 'Quan Ngua', nameLocal: 'Quần Ngựa', osm: 14366421043, codes: ['2-C5', '5-S1'] },
  'bach-thao': { name: 'Bach Thao', nameLocal: 'Bách Thảo', osm: 14366421042, codes: ['2-C6'] },
  'ho-tay': { name: 'Ho Tay', nameLocal: 'Hồ Tây', osm: 14366421041, codes: ['2-C7'] },
  'hang-dau': { name: 'Hang Dau', nameLocal: 'Hàng Đậu', osm: 14361491131, codes: ['2-C8'] },
  'ho-hoan-kiem': { name: 'Hoan Kiem Lake', nameLocal: 'Hồ Hoàn Kiếm', osm: 14366421040, codes: ['2-C9'] },
  'tran-hung-dao': { name: 'Tran Hung Dao', nameLocal: 'Trần Hưng Đạo', osm: 14366421039, codes: ['2-C10'] },
  // Line 2 Trần Hưng Đạo – Thượng Đình (station names from the earlier approved design)
  'cau-den': { name: 'Cau Den', nameLocal: 'Cầu Dền', coord: [105.8510, 21.0080], ...A },
  'bach-khoa': { name: 'Bach Khoa', nameLocal: 'Bách Khoa', osm: 14369647422, ...A },
  'kim-lien': { name: 'Kim Lien', nameLocal: 'Kim Liên', osm: 14366383476, ...A },
  'chua-boc': { name: 'Chua Boc', nameLocal: 'Chùa Bộc', coord: [105.8265, 21.0070], ...A },
  'nga-tu-so': { name: 'Nga Tu So', nameLocal: 'Ngã Tư Sở', coord: [105.8206, 21.0030], ...A },
  // Line 2 outer sections (OSM placeholders S2.01 / S2.07 / S2.32, named after the commune)
  'noi-bai-south': { name: 'Noi Bai South (Phu Minh)', nameLocal: 'Phía Nam sân bay Nội Bài (Phú Minh)', osm: 14125862760, ...A },
  'vinh-ngoc': { name: 'Vinh Ngoc', nameLocal: 'Vĩnh Ngọc', osm: 14125862761, ...A },
  'tam-hung': { name: 'Tam Hung', nameLocal: 'Tam Hưng', osm: 14125862762, ...A },
  'hung-vuong-stadium': { name: 'Hung Vuong Stadium', nameLocal: 'Sân vận động Hùng Vương', coord: [105.8260, 20.8410], ...A },
  'phu-xuyen': { name: 'Phu Xuyen', nameLocal: 'Phú Xuyên', coord: [105.8950, 20.7650], ...A },

  // ---- Line 5 Văn Cao – Hòa Lạc (20 stations, Decision 4602/QĐ-UBND 2025) ----
  'vanh-dai-1': { name: 'Vanh Dai 1 (Thanh Cong)', nameLocal: 'Vành đai 1 (Thành Công)', coord: [105.8098, 21.0238], snap: 'l5', ...A, codes: ['5-S3'] },
  'vanh-dai-2': { name: 'Vanh Dai 2', nameLocal: 'Vành đai 2', coord: [105.8040, 21.0150], snap: 'l5', ...A, codes: ['5-S4'] },
  'hoang-dao-thuy': { name: 'Hoang Dao Thuy', nameLocal: 'Hoàng Đạo Thúy', osm: 14369198337, ...A, codes: ['5-S5'] },
  'vanh-dai-3-pham-hung': { name: 'Vanh Dai 3 (Pham Hung)', nameLocal: 'Vành đai 3 (Phạm Hùng)', coord: [105.7885, 21.0050], snap: 'l5', ...A, codes: ['5-S6'] },
  'le-duc-tho-thang-long': { name: 'Le Duc Tho (Thang Long Ave)', nameLocal: 'Lê Đức Thọ (Đại lộ Thăng Long)', coord: [105.7740, 21.0042], snap: 'l5', ...A, codes: ['5-S7'] },
  'me-tri': { name: 'Me Tri', nameLocal: 'Mễ Trì', coord: [105.7600, 21.0070], snap: 'l5', ...A, codes: ['5-S8'] },
  'tay-mo': { name: 'Tay Mo', nameLocal: 'Tây Mỗ', coord: [105.7430, 21.0098], snap: 'l5', ...A, codes: ['5-S9'] },
  'an-khanh-1': { name: 'An Khanh 1', nameLocal: 'An Khánh 1', coord: [105.7300, 21.0100], snap: 'l5', ...A, codes: ['5-S10'] },
  'an-khanh-2': { name: 'An Khanh 2', nameLocal: 'An Khánh 2', coord: [105.7150, 21.0095], snap: 'l5', ...A, codes: ['5-S11'] },
  'song-phuong': { name: 'Song Phuong', nameLocal: 'Song Phương', coord: [105.7010, 21.0078], snap: 'l5', ...A, codes: ['5-S12'] },
  'sai-son': { name: 'Sai Son', nameLocal: 'Sài Sơn', coord: [105.6531, 21.0032], snap: 'l5', ...A, codes: ['5-S13'] },
  'quoc-oai': { name: 'Quoc Oai', nameLocal: 'Quốc Oai', coord: [105.6117, 21.0013], snap: 'l5', ...A, codes: ['5-S14'] },
  'dong-but': { name: 'Dong But', nameLocal: 'Đồng Bụt', coord: [105.5906, 20.9957], snap: 'l5', ...A, codes: ['5-S15'] },
  'dong-truc': { name: 'Dong Truc', nameLocal: 'Đồng Trúc', coord: [105.5618, 20.9896], snap: 'l5', ...A, codes: ['5-S16'] },
  'dong-bai': { name: 'Dong Bai', nameLocal: 'Đồng Bãi', coord: [105.5340, 20.9903], snap: 'l5', ...A, codes: ['5-S17'] },
  'tien-xuan': { name: 'Tien Xuan', nameLocal: 'Tiến Xuân', coord: [105.5214, 20.9902], snap: 'l5', ...A, codes: ['5-S18'] },
  'trai-moi': { name: 'Trai Moi', nameLocal: 'Trại Mới', coord: [105.4995, 20.9985], snap: 'l5', ...A, codes: ['5-S19'] },
  'thach-binh': { name: 'Thach Binh', nameLocal: 'Thạch Bình', coord: [105.4787, 21.0112], snap: 'l5', ...A, codes: ['5-S20'] },
  'lang-van-hoa': { name: 'Ethnic Culture Village', nameLocal: 'Làng Văn hóa các dân tộc Việt Nam', coord: [105.4627, 21.0416], ...A },
  'nghi-tam': { name: 'Nghi Tam', nameLocal: 'Nghi Tàm', osm: 14361491128, ...A },
  'co-bi': { name: 'Co Bi', nameLocal: 'Cổ Bi', coord: [105.9409, 21.0319], ...A },

  // ---- Line 1 (OSM placeholders traced from published plans; names are provisional) ----
  'yen-phu': { name: 'Yen Phu', nameLocal: 'Yên Phú', osm: 14369647486, ...A },
  'thuong-phuc': { name: 'Thuong Phuc', nameLocal: 'Thượng Phúc', osm: 14369647491, ...A },
  'thuong-tin': { name: 'Thuong Tin', nameLocal: 'Thường Tín', osm: 14369647492, ...A },
  'quoc-lo-1a': { name: 'National Highway 1A', nameLocal: 'Quốc lộ 1A', osm: 14369647493, ...A },
  'ngoc-hoi': { name: 'Ngoc Hoi', nameLocal: 'Ngọc Hồi', osm: 14369647494, ...A },
  'thanh-tri': { name: 'Thanh Tri', nameLocal: 'Thanh Trì', osm: 14369647495, ...A },
  'hoang-liet': { name: 'Hoang Liet', nameLocal: 'Hoàng Liệt', osm: 14369647496, ...A },
  'giai-phong': { name: 'Giai Phong', nameLocal: 'Giải Phóng', osm: 14369647439, ...A },
  'giap-bat': { name: 'Giap Bat', nameLocal: 'Giáp Bát', osm: 14369647440, ...A },
  'phuong-liet': { name: 'Phuong Liet', nameLocal: 'Phương Liệt', osm: 14369647423, ...A },
  'gia-lam': { name: 'Gia Lam', nameLocal: 'Gia Lâm', osm: 14366413336, ...A },
  'truong-lam': { name: 'Truong Lam', nameLocal: 'Trường Lâm', osm: 14366413337, ...A },
  'ngo-gia-tu': { name: 'Ngo Gia Tu', nameLocal: 'Ngô Gia Tự', osm: 14366413338, ...A },
  'to-ga': { name: 'To Ga', nameLocal: 'Tổ Ga', osm: 14366413339, ...A },
  'ha-huy-tap': { name: 'Ha Huy Tap', nameLocal: 'Hà Huy Tập', osm: 14366413348, ...A },
  'yen-vien': { name: 'Yen Vien', nameLocal: 'Yên Viên', osm: 14369647469, ...A },
  'phu-dong': { name: 'Phu Dong', nameLocal: 'Phù Đổng', osm: 14369647470, ...A },
  'global-gate': { name: 'Global Gate', nameLocal: 'Global Gate', osm: 14369647497, ...A },
  'viet-hung': { name: 'Viet Hung', nameLocal: 'Việt Hùng', osm: 14369647498, ...A },
  'lien-ha': { name: 'Lien Ha', nameLocal: 'Liên Hà', osm: 14369647499, ...A },
  'ha-lam': { name: 'Ha Lam', nameLocal: 'Hà Lâm', osm: 14369647500, ...A },
  'thu-lam': { name: 'Thu Lam', nameLocal: 'Thư Lâm', osm: 14369647501, ...A },
  'nguyen-khe': { name: 'Nguyen Khe', nameLocal: 'Nguyên Khê', osm: 14369647502, ...A },
  'phu-cuong': { name: 'Phu Cuong', nameLocal: 'Phú Cường', osm: 14369647481, ...A },
  'mai-dinh': { name: 'Mai Dinh', nameLocal: 'Mai Đình', osm: 14369647482, ...A },
  'noi-bai-airport': { name: 'Noi Bai Airport', nameLocal: 'Sân bay Nội Bài', osm: 14369647483, ...A },
  'soc-son': { name: 'Soc Son', nameLocal: 'Sóc Sơn', coord: [105.8508, 21.2597], ...A },
  'phuc-yen': { name: 'Phuc Yen', nameLocal: 'Phúc Yên', coord: [105.7123, 21.2400], ...A },
  'second-airport': { name: 'Second Airport (Ung Hoa)', nameLocal: 'Sân bay thứ hai (Ứng Hòa)', coord: [105.8000, 20.6550], ...A },
  'kim-bai': { name: 'Kim Bai', nameLocal: 'Kim Bài', coord: [105.7627, 20.8334], ...A },
  'dai-nghia': { name: 'Dai Nghia', nameLocal: 'Đại Nghĩa', coord: [105.7450, 20.6870], ...A },

  // ---- Line 8 (Hanoi main line; OSM placeholders + vi.wikipedia provisional list) ----
  'thach-hoa': { name: 'Thach Hoa (Hoa Lac)', nameLocal: 'Thạch Hòa (Hòa Lạc)', osm: 14125862766, ...A },
  'ha-bang': { name: 'Ha Bang', nameLocal: 'Hạ Bằng', coord: [105.5450, 21.0200], ...A },
  'huong-ngai': { name: 'Huong Ngai', nameLocal: 'Hương Ngải', osm: 14369647462, ...A },
  'tay-phuong': { name: 'Tay Phuong', nameLocal: 'Tây Phương', coord: [105.6350, 21.0460], ...A },
  'son-dong': { name: 'Son Dong', nameLocal: 'Sơn Đồng', coord: [105.7000, 21.0450], ...A },
  'di-trach': { name: 'Di Trach', nameLocal: 'Di Trạch', coord: [105.7220, 21.0460], ...A },
  'tu-hoang': { name: 'Tu Hoang', nameLocal: 'Tu Hoàng', osm: 14366383588, ...A },
  'phu-dien-bac': { name: 'Phu Dien North', nameLocal: 'Phú Diễn (tuyến 8)', osm: 14366383586, ...A },
  'mai-dich': { name: 'Mai Dich', nameLocal: 'Mai Dịch', osm: 14125862767, ...A },
  'hoang-quoc-viet': { name: 'Hoang Quoc Viet', nameLocal: 'Hoàng Quốc Việt', osm: 14366383589, ...A },
  'hoang-mai': { name: 'Hoang Mai', nameLocal: 'Hoàng Mai', osm: 14308333500, ...A },
  'times-city': { name: 'Times City', nameLocal: 'Times City', osm: 14350822455, ...A },
  'vinh-hung': { name: 'Vinh Hung', nameLocal: 'Vĩnh Hưng', osm: 14366383483, ...A },
  'linh-nam': { name: 'Linh Nam', nameLocal: 'Lĩnh Nam', osm: 14125862768, ...A },
  'thuan-ton': { name: 'Thuan Ton', nameLocal: 'Thuận Tốn', osm: 14361491159, ...A },
  'an-dao': { name: 'An Dao', nameLocal: 'An Đào', osm: 14361508617, ...A },
  'kien-thanh': { name: 'Kien Thanh', nameLocal: 'Kiên Thành', osm: 14361508616, ...A },
  'duong-xa': { name: 'Duong Xa', nameLocal: 'Dương Xá', osm: 14361508613, ...A },
  'linh-quy': { name: 'Linh Quy', nameLocal: 'Linh Quy', osm: 14125862772, ...A },
  'toan-thang': { name: 'Toan Thang', nameLocal: 'Toàn Thắng', osm: 14350822452, ...A },
  // 8A towards Gia Bình airport (Bắc Ninh)
  'xuan-le': { name: 'Xuan Le', nameLocal: 'Xuân Lê', osm: 14308333488, ...A },
  'cuu-yen': { name: 'Cuu Yen', nameLocal: 'Cửu Yên', osm: 14308333491, ...A },
  'tam-a': { name: 'Tam A', nameLocal: 'Tam Á', osm: 14308333494, ...A },
  'thien-du': { name: 'Thien Du', nameLocal: 'Thiện Dũ', osm: 14308384922, ...A },
  'dao-xa': { name: 'Dao Xa', nameLocal: 'Đạo Xá', osm: 14308384919, ...A },
  'nghia-dao': { name: 'Nghia Dao', nameLocal: 'Nghĩa Đạo', osm: 14125862773, ...A },
  'lam-thao': { name: 'Lam Thao', nameLocal: 'Lâm Thao', osm: 14308384916, ...A },
  'binh-dinh': { name: 'Binh Dinh', nameLocal: 'Bình Định', osm: 14308384913, ...A },
  'quang-bo': { name: 'Quang Bo', nameLocal: 'Quảng Bố', osm: 14350822445, ...A },
  'phu-du': { name: 'Phu Du', nameLocal: 'Phú Dư', osm: 14350822449, ...A },
  'ngoc-cuc': { name: 'Ngoc Cuc', nameLocal: 'Ngọc Cục', osm: 14308384910, ...A },
  'gia-binh': { name: 'Gia Binh Airport', nameLocal: 'Gia Bình', osm: 14308384907, ...A },
  'phu-duoi': { name: 'Phu Duoi', nameLocal: 'Phú Dưới', osm: 14308384904, ...A },
  // 8B towards Hưng Yên
  'da-ton': { name: 'Da Ton', nameLocal: 'Đa Tốn', osm: 14361491170, ...A },
  ecopark: { name: 'Ecopark', nameLocal: 'Ecopark', osm: 14125862769, ...A },
  'le-cao': { name: 'Le Cao', nameLocal: 'Lê Cao', osm: 14125862770, ...A },
  // 8 Phúc Thọ branches (2036-2045)
  'phuc-loc': { name: 'Phuc Loc', nameLocal: 'Phúc Lộc', coord: [105.5720, 21.1493], ...A },
  'tay-dang': { name: 'Tay Dang', nameLocal: 'Tây Đằng', coord: [105.4218, 21.1987], ...A },

  // ---- Line 10 ring (OSM placeholders) ----
  'nhat-tan': { name: 'Nhat Tan', nameLocal: 'Nhật Tân', osm: 14350822461, ...A },
  'vo-chi-cong': { name: 'Vo Chi Cong', nameLocal: 'Võ Chí Công', osm: 14350822465, ...A },
  'xuan-la': { name: 'Xuan La', nameLocal: 'Xuân La', osm: 14350822468, ...A },
  'xuan-phuong': { name: 'Xuan Phuong', nameLocal: 'Xuân Phương', osm: 14366383546, ...A },
  'le-quang-dao': { name: 'Le Quang Dao (My Dinh Stadium)', nameLocal: 'Lê Quang Đạo (SVĐ Mỹ Đình)', osm: 14125862775, ...A },
  'duong-dinh-nghe': { name: 'Duong Dinh Nghe', nameLocal: 'Dương Đình Nghệ', osm: 14369198308, ...A },
  'trung-kinh': { name: 'Trung Kinh', nameLocal: 'Trung Kính', osm: 14369198313, ...A },
  'chinh-kinh': { name: 'Chinh Kinh', nameLocal: 'Chính Kinh', osm: 14369198336, ...A },
  'kim-giang': { name: 'Kim Giang', nameLocal: 'Kim Giang', osm: 14125862776, ...A },
  'dinh-cong': { name: 'Dinh Cong', nameLocal: 'Định Công', osm: 14369199418, ...A },
  'tan-mai-west': { name: 'Tan Mai West', nameLocal: 'Tân Mai (phía Tây)', osm: 14369199420, ...A },
  'vinh-tuy': { name: 'Vinh Tuy', nameLocal: 'Vĩnh Tuy', osm: 14353878658, ...A },
  'tu-dinh': { name: 'Tu Dinh', nameLocal: 'Tư Đình', osm: 14353878654, ...A },
  'long-bien': { name: 'Long Bien', nameLocal: 'Long Biên', osm: 14353878634, ...A },
  'lam-ha': { name: 'Lam Ha', nameLocal: 'Lâm Hạ', osm: 14353878637, ...A },
  'gia-thuy': { name: 'Gia Thuy', nameLocal: 'Gia Thụy', osm: 14353878640, ...A },
  'gia-quat': { name: 'Gia Quat', nameLocal: 'Gia Quất', osm: 14353878643, ...A },
  'thuong-thanh': { name: 'Thuong Thanh', nameLocal: 'Thượng Thanh', osm: 14353878646, ...A },
  'nam-duong': { name: 'Nam Duong', nameLocal: 'Nam Đuống', osm: 14353878649, ...A },
  'mai-lam': { name: 'Mai Lam', nameLocal: 'Mai Lâm', osm: 14369630280, ...A },
  'co-loa': { name: 'Co Loa (Global Gate)', nameLocal: 'Cổ Loa (Global Gate)', osm: 14369630279, ...A },

  // ---- Line 14 (OSM placeholders) ----
  'tan-xuan': { name: 'Tan Xuan', nameLocal: 'Tân Xuân', osm: 14353929544, ...A },
  'thuong-thuy': { name: 'Thuong Thuy', nameLocal: 'Thượng Thụy', osm: 14125862777, ...A },
  'ke-ga': { name: 'Ke Ga', nameLocal: 'Kẻ Gạ', osm: 14353929545, ...A },
  'au-co': { name: 'Au Co', nameLocal: 'Âu Cơ', osm: 14361491126, ...A },
  'tu-lien': { name: 'Tu Lien', nameLocal: 'Tứ Liên', osm: 14361491127, ...A },
  'nghia-dung': { name: 'Nghia Dung', nameLocal: 'Nghĩa Dũng', osm: 14361491129, ...A },
  'tran-quang-khai': { name: 'Tran Quang Khai', nameLocal: 'Trần Quang Khải', osm: 14361430921, ...A },
  'le-thanh-tong': { name: 'Le Thanh Tong', nameLocal: 'Lê Thánh Tông', osm: 14361430920, ...A },
  'tran-khat-chan': { name: 'Tran Khat Chan', nameLocal: 'Trần Khát Chân', osm: 14353878661, ...A },
  'long-bien-dong': { name: 'Long Bien East', nameLocal: 'Long Biên (phía Đông)', osm: 14361491135, ...A },
  'co-linh': { name: 'Co Linh', nameLocal: 'Cổ Linh', osm: 14361491138, ...A },
  'xuan-do': { name: 'Xuan Do', nameLocal: 'Xuân Đỗ', osm: 14361491146, ...A },
  'dong-du': { name: 'Dong Du', nameLocal: 'Đông Dư', osm: 14361491154, ...A },
  'giap-hai': { name: 'Giap Hai', nameLocal: 'Giáp Hải', osm: 14125862778, ...A },
  'vinhomes-ocean-park': { name: 'Vinhomes Ocean Park', nameLocal: 'Vinhomes Ocean Park', osm: 14361491188, ...A },
  'ocean-park-dong': { name: 'Ocean Park East', nameLocal: 'Ocean Park Đông', osm: 14361491187, ...A },
  'duong-5': { name: 'Route 5', nameLocal: 'Đường 5', osm: 14125862779, ...A },
  'kcn-thang-long': { name: 'Thang Long Industrial Park', nameLocal: 'KCN Thăng Long', coord: [105.7730, 21.1166], ...A },
  'quang-minh': { name: 'Quang Minh', nameLocal: 'Quang Minh', coord: [105.7655, 21.1926], ...A },
  'me-linh': { name: 'Me Linh', nameLocal: 'Mê Linh', coord: [105.7250, 21.1780], ...A },

  // ---- Other planned-line waypoints ----
  'chuc-son': { name: 'Chuc Son', nameLocal: 'Chúc Sơn', coord: [105.7128, 20.9194], ...A },
  'phu-nghia': { name: 'Phu Nghia', nameLocal: 'Phú Nghĩa', coord: [105.6400, 20.9120], ...A },
  'xuan-mai': { name: 'Xuan Mai', nameLocal: 'Xuân Mai', coord: [105.5750, 20.8980], ...A },
  'yen-thuong': { name: 'Yen Thuong', nameLocal: 'Yên Thường', coord: [105.9156, 21.1035], ...A },
  'thuong-cat': { name: 'Thuong Cat', nameLocal: 'Thượng Cát', coord: [105.7489, 21.0862], ...A },
  'linh-dam': { name: 'Linh Dam', nameLocal: 'Linh Đàm', coord: [105.8325, 20.9672], ...A },
  'dong-anh': { name: 'Dong Anh', nameLocal: 'Đông Anh', coord: [105.8517, 21.1538], ...A },
  'kim-no': { name: 'Kim No', nameLocal: 'Kim Nỗ', coord: [105.7902, 21.1427], ...A },
  'ha-dong-railway': { name: 'Ha Dong (railway)', nameLocal: 'Ga Hà Đông', coord: [105.7605, 20.9531], ...A },
  'duong-noi': { name: 'Duong Noi', nameLocal: 'Dương Nội', coord: [105.7510, 20.9753], ...A },
};

// Shorthands for statuses/years used below.
const OP = 'operating';
const UC = 'construction';
const PL = 'planned';
const PR = 'proposed';

export const LINES = [
  {
    id: 'line-2a', code: '2A', name: 'Line 2A: Cat Linh – Ha Dong', nameLocal: 'Tuyến 2A: Cát Linh – Hà Đông',
    group: 'urban-metro', color: '#00C000', mode: 'metro', status: OP, opened: 2021, lengthKm: 54,
    description: 'Hanoi\'s first metro line (elevated, 13 km, 12 stations), opened 6 Nov 2021. The 100-year master plan extends it south-west along Highway 6 to Xuân Mai (~20 km, construction targeted 2026–Dec 2030) and north-east from Cát Linh via Hanoi Station, Gia Lâm and Cổ Loa to Yên Thường (~21 km, 2031–2035). Extension alignments are indicative. Color as used by OpenStreetMap/Wikipedia (green).',
    sources: ['osm', 'vnx-18-lines', 'vi-wiki-network', 'en-wiki'],
    geometry: 'l2a',
    segments: [
      { stations: ['cat-linh', 'la-thanh', 'thai-ha', 'lang', 'thuong-dinh', 'vanh-dai-3', 'phung-khoang', 'van-quan', 'ha-dong', 'la-khe', 'van-khe', 'yen-nghia'], status: OP, year: 2021, label: 'Cát Linh – Yên Nghĩa (elevated)', path: true },
      { stations: ['yen-nghia', 'chuc-son', 'phu-nghia', 'xuan-mai'], status: PL, year: 2030, label: 'Extension Hà Đông – Xuân Mai (~20 km, target Dec 2030)' },
      { stations: ['cat-linh', 'ga-ha-noi', 'gia-lam', 'co-loa', 'yen-thuong'], status: PL, year: 2035, label: 'Extension Cát Linh – Gia Lâm – Cổ Loa – Yên Thường (~21 km)' },
    ],
  },
  {
    id: 'line-3', code: '3', name: 'Line 3: Nhon – Hanoi Station', nameLocal: 'Tuyến 3: Nhổn – Ga Hà Nội',
    group: 'urban-metro', color: '#A5B635', mode: 'metro', status: OP, opened: 2024, lengthKm: 58,
    description: 'Elevated section Nhổn – Cầu Giấy (8.5 km, 8 stations) opened 8 Aug 2024. The 4 km underground section Cầu Giấy – Hanoi Station (4 stations) finished tunnel boring in Apr 2026 and is scheduled for commercial operation at the end of 2027. Planned extensions: Hanoi Station – Hoàng Mai/Yên Sở (8.8 km underground, 7 stations, in project preparation with EU/AFD support; listed for 2026–2030), Nhổn – Trôi – Sơn Tây (30.7 km, 2026–2030 list) and Yên Sở – Ngọc Hồi (6 km, 2031–2035). Line color (olive green) is the one used on station signage per Wikipedia/OSM.',
    sources: ['osm', 'tienphong-line3-2027', 'vneconomy-line3-ext', 'vietnamnews-line3-eu', 'vnx-18-lines', 'vi-wiki-network'],
    geometry: 'l3',
    segments: [
      { stations: ['nhon', 'minh-khai', 'phu-dien', 'cau-dien', 'le-duc-tho', 'dai-hoc-quoc-gia', 'chua-ha', 'cau-giay'], status: OP, year: 2024, label: 'Nhổn – Cầu Giấy (elevated)', path: true },
      { stations: ['cau-giay', 'kim-ma', 'cat-linh', 'van-mieu', 'ga-ha-noi'], status: UC, year: 2027, label: 'Cầu Giấy – Ga Hà Nội (underground, target end-2027)', path: true },
      { stations: ['ga-ha-noi', 'tran-hung-dao', 'tran-thanh-tong', 'kim-nguu', 'mai-dong', 'tan-mai', 'tam-trinh', 'yen-so'], status: PL, year: 2030, label: 'Extension Ga Hà Nội – Hoàng Mai (Yên Sở), 8.8 km underground' },
      { stations: ['yen-so', 'ngoc-hoi'], status: PL, year: 2035, label: 'Extension Yên Sở – Ngọc Hồi complex (~6 km)' },
      { stations: ['nhon', 'troi', 'phung', 'phuc-tho', 'son-tay'], status: PL, year: 2030, label: 'Extension Nhổn – Trôi – Sơn Tây (~30.7 km)' },
    ],
  },
  {
    id: 'line-1', code: '1', name: 'Line 1: Noi Bai – Hanoi Station – Ngoc Hoi', nameLocal: 'Tuyến 1: Nội Bài – Yên Viên – Ga Hà Nội – Ngọc Hồi',
    group: 'urban-metro', color: '#0D04D6', mode: 'metro', status: UC, opened: 2030, lengthKm: 149,
    description: 'North–south trunk line from Nội Bài airport via Yên Viên, Gia Lâm and Hanoi Station to Ngọc Hồi and the Hùng Vương (Trống Đồng) stadium area. Groundbreaking 22 Jun 2026 (Vinhomes–SGC EPC/turnkey contract signed Oct 2026), target 2030; ~60 km in the 2026–2030 list (81 km in other reports). Further branches to the second airport, Đại Nghĩa, Sóc Sơn and Phúc Yên are in the 2036–2045 phase. Stations and alignment are provisional (OpenStreetMap tracing of published plan maps). Color from the vi.wikipedia planning-map palette.',
    sources: ['vnx-18-lines', 'baoxaydung-5-lines', 'vtc-5-lines', 'vnn-contracts', 'osm', 'nhandan-second-airport'],
    geometry: 'l1',
    segments: [
      { stations: ['hung-vuong-stadium', 'yen-phu', 'thuong-phuc', 'thuong-tin', 'quoc-lo-1a', 'ngoc-hoi', 'thanh-tri', 'hoang-liet', 'giai-phong', 'giap-bat', 'phuong-liet', 'bach-khoa', 'ga-ha-noi', 'hang-dau', 'gia-lam', 'truong-lam', 'ngo-gia-tu', 'to-ga', 'ha-huy-tap', 'yen-vien', 'phu-dong', 'global-gate', 'viet-hung', 'lien-ha', 'ha-lam', 'thu-lam', 'nguyen-khe', 'phu-cuong', 'mai-dinh', 'noi-bai-airport'], status: UC, year: 2030, label: 'Hùng Vương Stadium – Ngọc Hồi – Ga Hà Nội – Yên Viên – Thư Lâm – Nội Bài (groundbreaking 22 Jun 2026)', path: true },
      { stations: ['thuong-phuc', 'second-airport'], status: PL, year: 2045, label: 'Branch Ngọc Hồi – second airport (~26 km)' },
      { stations: ['hung-vuong-stadium', 'kim-bai', 'dai-nghia'], status: PL, year: 2045, label: 'Extension Hùng Vương Stadium – Đại Nghĩa (~25 km)' },
      { stations: ['noi-bai-airport', 'soc-son'], status: PL, year: 2045, label: 'Branch Nội Bài – Sóc Sơn (~19 km)' },
      { stations: ['thu-lam', 'soc-son'], status: PL, year: 2045, label: 'Branch north Thư Lâm – Sóc Sơn (~14 km)' },
      { stations: ['noi-bai-airport', 'phuc-yen'], status: PL, year: 2045, label: 'Extension Nội Bài – Phúc Yên (~5 km)' },
    ],
  },
  {
    id: 'line-2', code: '2', name: 'Line 2: Noi Bai – Tran Hung Dao – Thuong Dinh', nameLocal: 'Tuyến 2: Nội Bài – Trần Hưng Đạo – Thượng Đình',
    group: 'urban-metro', color: '#00838F', mode: 'metro', status: UC, opened: 2030, lengthKm: 67,
    description: 'Section 2.1 Nam Thăng Long – Trần Hưng Đạo (11.5 km, 10 stations C1–C10, mostly underground) broke ground 9 Oct 2025 (ODA project, target 2030; some reports say 2029 or 2031). The Nội Bài – Nam Thăng Long, Trần Hưng Đạo – Thượng Đình and Thượng Đình – Hùng Vương Stadium sections broke ground 22 Jun 2026 under the Vinhomes–SGC turnkey contract (target 2030); an extension to Phú Xuyên is in the 2036–2045 phase. Outer-section stations are placeholders; Trần Hưng Đạo – Thượng Đình uses station names from the earlier approved design. Color chosen (planning maps reuse 2A green).',
    sources: ['vnx-18-lines', 'vi-wiki-line2', 'en-wiki', 'baoxaydung-5-lines', 'vtc-5-lines', 'osm'],
    geometry: 'l2',
    segments: [
      { stations: ['noi-bai-south', 'vinh-ngoc', 'xuan-dinh'], status: UC, year: 2030, label: 'Nội Bài – Nam Thăng Long (groundbreaking 22 Jun 2026)' },
      { stations: ['xuan-dinh', 'ngoai-giao-doan', 'tay-ho-tay', 'buoi', 'quan-ngua', 'bach-thao', 'ho-tay', 'hang-dau', 'ho-hoan-kiem', 'tran-hung-dao'], status: UC, year: 2030, label: 'Section 2.1 Nam Thăng Long – Trần Hưng Đạo (groundbreaking 9 Oct 2025)', path: true },
      { stations: ['tran-hung-dao', 'cau-den', 'bach-khoa', 'kim-lien', 'chua-boc', 'nga-tu-so', 'thuong-dinh'], status: UC, year: 2030, label: 'Trần Hưng Đạo – Thượng Đình (groundbreaking 22 Jun 2026)' },
      { stations: ['thuong-dinh', 'tam-hung', 'hung-vuong-stadium'], status: UC, year: 2030, label: 'Thượng Đình – Hùng Vương Stadium (groundbreaking 22 Jun 2026)' },
      { stations: ['hung-vuong-stadium', 'phu-xuyen'], status: PL, year: 2045, label: 'Extension Hùng Vương Stadium – Phú Xuyên (~9 km)' },
    ],
  },
  {
    id: 'line-4', code: '4', name: 'Line 4: Thuong Cat – My Dinh – Linh Dam – Long Bien – Me Linh', nameLocal: 'Tuyến 4: Thượng Cát – SVĐ Mỹ Đình – Linh Đàm – Long Biên – Cổ Loa – Mê Linh',
    group: 'urban-metro', color: '#FF8C00', mode: 'metro', status: PL, lengthKm: 60,
    description: 'Semi-circular line in the 2031–2035 phase of the 100-year master plan (~60 km). Only waypoints are published; stations shown are indicative interchange points. Color chosen.',
    sources: ['vnx-18-lines', 'vietnamnet-15-lines'],
    segments: [
      { stations: ['thuong-cat', 'cau-dien', 'le-quang-dao', 'vanh-dai-3', 'linh-dam', 'linh-nam', 'long-bien', 'co-loa', 'dong-anh', 'quang-minh', 'me-linh'], status: PL, year: 2035, label: 'Thượng Cát – Mê Linh (indicative alignment)' },
    ],
  },
  {
    id: 'line-5', code: '5', name: 'Line 5: Van Cao – Hoa Lac', nameLocal: 'Tuyến 5: Văn Cao – Hòa Lạc',
    group: 'urban-metro', color: '#C71310', mode: 'metro', status: UC, opened: 2030, lengthKm: 67,
    description: '39.6 km, 20 stations (6 underground under Văn Cao – Liễu Giai – Nguyễn Chí Thanh – Trần Duy Hưng, then elevated/at-grade along Thăng Long Avenue to Thạch Bình). Alignment approved by Decision 4602/QĐ-UBND (4 Sep 2025); construction started 19 Dec 2025, target 2030. Extension Văn Cao – Cổ Loa – Dương Xá – Cổ Bi (~27 km) is in the 2031–2035 phase; a further extension to Hòa Lạc airport / the Ethnic Culture Village is only mentioned as possible. Station positions are estimated along the OSM-traced alignment. Color from the vi.wikipedia planning-map palette.',
    sources: ['vi-wiki-line5', 'vnx-18-lines', 'osm'],
    geometry: 'l5',
    segments: [
      { stations: ['quan-ngua', 'kim-ma', 'vanh-dai-1', 'vanh-dai-2', 'hoang-dao-thuy', 'vanh-dai-3-pham-hung', 'le-duc-tho-thang-long', 'me-tri', 'tay-mo', 'an-khanh-1', 'an-khanh-2', 'song-phuong', 'sai-son', 'quoc-oai', 'dong-but', 'dong-truc', 'dong-bai', 'tien-xuan', 'trai-moi', 'thach-binh'], status: UC, year: 2030, label: 'Văn Cao (Quần Ngựa) – Hòa Lạc (Thạch Bình), construction since 19 Dec 2025', path: true },
      { stations: ['quan-ngua', 'nghi-tam', 'co-loa', 'yen-vien', 'duong-xa', 'co-bi'], status: PL, year: 2035, label: 'Extension Văn Cao – Cổ Loa – Dương Xá – Cổ Bi (~27 km)' },
      { stations: ['thach-binh', 'lang-van-hoa'], status: PR, label: 'Possible extension to Hòa Lạc airport / Ethnic Culture Village (mentioned, not adopted)' },
    ],
  },
  {
    id: 'line-6', code: '6', name: 'Line 6: Noi Bai South – Ngoc Hoi', nameLocal: 'Tuyến 6: Phía Nam sân bay Nội Bài – Tổ hợp ga Ngọc Hồi',
    group: 'urban-metro', color: '#510882', mode: 'metro', status: PL, lengthKm: 42,
    description: 'Western semi-ring from south of Nội Bài airport to the Ngọc Hồi rail complex (~42 km), priority for 2031–2035. Drawn along the corridor of earlier plans (Kim Nỗ – Thượng Cát – Phú Diễn – Hà Đông); stations are indicative. Color from the vi.wikipedia planning-map palette.',
    sources: ['vnx-18-lines', 'daidoanket-18-lines', 'en-wiki'],
    segments: [
      { stations: ['noi-bai-south', 'kim-no', 'thuong-cat', 'phu-dien-bac', 'tay-mo', 'ha-dong-railway', 'ngoc-hoi'], status: PL, year: 2035, label: 'Nội Bài (south) – Ngọc Hồi (indicative alignment)' },
    ],
  },
  {
    id: 'line-7', code: '7', name: 'Line 7: Me Linh – Ring Road 3.5 – Hung Vuong Stadium', nameLocal: 'Tuyến 7: Mê Linh – Vành đai 3,5 – SVĐ Hùng Vương',
    group: 'urban-metro', color: '#88773D', mode: 'metro', status: PL, lengthKm: 51,
    description: 'North–south line along the Ring Road 3.5 corridor (~51 km), 2036–2045 phase. Stations are indicative. Color from the vi.wikipedia planning-map palette.',
    sources: ['vnx-18-lines'],
    segments: [
      { stations: ['me-linh', 'troi', 'an-khanh-1', 'duong-noi', 'yen-nghia', 'tam-hung', 'hung-vuong-stadium'], status: PL, year: 2045, label: 'Mê Linh – Hùng Vương Stadium (indicative alignment)' },
    ],
  },
  {
    id: 'line-8', code: '8', name: 'Line 8: Hoa Lac – Mai Dich – Linh Nam – Duong Xa', nameLocal: 'Tuyến 8: Hòa Lạc – Sơn Đồng – Mai Dịch – Lĩnh Nam – Dương Xá – Gia Bình',
    group: 'urban-metro', color: '#B111AC', mode: 'metro', status: UC, opened: 2030, lengthKm: 103,
    description: 'East–west line. The Hanoi section (~66 km) broke ground 22 Jun 2026 under the Vinhomes–SGC turnkey contract, target 2030 (91 km including the Bắc Ninh section to Gia Bình airport). Branches 8A (to Gia Bình) and 8B (to Ecopark / Hưng Yên) and the Phúc Thọ – Phúc Lộc / Phúc Thọ – Tây Đằng sections (2036–2045) are also shown. Official descriptions say "via Ring Road 3"; the provisional station list (vi.wikipedia, OSM) runs through Cầu Giấy, Thái Hà and Kim Liên instead, so the inner alignment is uncertain. Color from the vi.wikipedia planning-map palette.',
    sources: ['vnx-18-lines', 'baoxaydung-5-lines', 'vtc-5-lines', 'vnn-contracts', 'vi-wiki-line8', 'osm'],
    geometry: 'l8',
    segments: [
      { stations: ['thach-hoa', 'ha-bang', 'huong-ngai', 'tay-phuong', 'son-dong', 'di-trach', 'tu-hoang', 'minh-khai', 'phu-dien-bac', 'mai-dich', 'hoang-quoc-viet', 'buoi', 'cau-giay', 'vanh-dai-1', 'thai-ha', 'kim-lien', 'phuong-liet', 'hoang-mai', 'mai-dong', 'times-city', 'vinh-hung', 'linh-nam', 'thuan-ton', 'an-dao', 'kien-thanh', 'duong-xa', 'linh-quy', 'toan-thang'], status: UC, year: 2030, label: 'Hòa Lạc – Mai Dịch – Lĩnh Nam – Dương Xá – Toàn Thắng (Hanoi section, groundbreaking 22 Jun 2026)', path: true },
      { stations: ['toan-thang', 'xuan-le', 'cuu-yen', 'tam-a', 'thien-du', 'dao-xa', 'nghia-dao', 'lam-thao', 'binh-dinh', 'quang-bo', 'phu-du', 'ngoc-cuc', 'gia-binh', 'phu-duoi'], status: PL, label: 'Branch 8A to Gia Bình airport (Bắc Ninh)', path: true },
      { stations: ['thuan-ton', 'da-ton', 'ecopark', 'le-cao'], status: PL, label: 'Branch 8B to Ecopark / Hưng Yên' },
      { stations: ['phuc-loc', 'phuc-tho', 'son-tay', 'tay-dang'], status: PL, year: 2045, label: 'Phúc Lộc – Phúc Thọ – Tây Đằng (13 + 24 km; link to main line not specified)' },
    ],
  },
  {
    id: 'line-9', code: '9', name: 'Line 9: Me Linh – Co Loa – Duong Xa', nameLocal: 'Tuyến 9: Mê Linh – Cổ Loa – Dương Xá',
    group: 'urban-metro', color: '#8B4513', mode: 'metro', status: PL, lengthKm: 46,
    description: 'Northern/eastern line (~46 km), 2036–2045 phase. Stations are indicative. Color chosen.',
    sources: ['vnx-18-lines', 'vietnamnet-15-lines'],
    segments: [
      { stations: ['me-linh', 'quang-minh', 'dong-anh', 'co-loa', 'yen-thuong', 'duong-xa'], status: PL, year: 2045, label: 'Mê Linh – Cổ Loa – Dương Xá (indicative alignment)' },
    ],
  },
  {
    id: 'line-10', code: '10', name: 'Line 10: Co Loa – Vo Chi Cong – Times City ring', nameLocal: 'Tuyến 10: Cổ Loa – Võ Chí Công – Vành đai 3 – Vành đai 2,5 – Times City – Cổ Loa',
    group: 'urban-metro', color: '#E6C700', textColor: '#000000', mode: 'metro', status: UC, opened: 2030, lengthKm: 43,
    description: 'Loop line (~43 km) linking Cổ Loa/Đông Anh, Võ Chí Công, Ring Road 3, Ring Road 2.5, Times City and back across the Red River. Groundbreaking 22 Jun 2026 (Vinhomes–SGC turnkey contract), target 2030. Replaces the former Line 10 (Cát Linh – Láng Hạ – Lê Văn Lương – Yên Nghĩa) of the 2024 general plan. Stations are provisional (OSM); the Cổ Loa – Nhật Tân closing arc is drawn straight. Color from the vi.wikipedia planning-map palette (darkened yellow).',
    sources: ['vnx-18-lines', 'baoxaydung-5-lines', 'vtc-5-lines', 'vnn-contracts', 'osm'],
    geometry: 'l10',
    segments: [
      { stations: ['nhat-tan', 'vo-chi-cong', 'xuan-la', 'mai-dich', 'le-duc-tho', 'xuan-phuong', 'le-quang-dao', 'duong-dinh-nghe', 'trung-kinh', 'hoang-dao-thuy', 'chinh-kinh', 'thuong-dinh', 'kim-giang', 'dinh-cong', 'giap-bat', 'tan-mai-west', 'tan-mai', 'times-city', 'vinh-tuy', 'tu-dinh', 'long-bien', 'lam-ha', 'gia-thuy', 'gia-quat', 'thuong-thanh', 'nam-duong', 'mai-lam', 'co-loa', 'nhat-tan'], status: UC, year: 2030, label: 'Ring Cổ Loa – Võ Chí Công – Times City – Cổ Loa (groundbreaking 22 Jun 2026)', path: true },
    ],
  },
  {
    id: 'line-14', code: '14', name: 'Line 14: Thang Long Bridge – Hong Ha – Ocean Park', nameLocal: 'Tuyến 14: Cầu Thăng Long – Hồng Hà – Ocean Park',
    group: 'urban-metro', color: '#F5617B', mode: 'metro', status: UC, opened: 2030, lengthKm: 48,
    description: 'Riverside line from the Thăng Long Bridge along the Hồng Hà corridor through the old quarter edge, across the Red River to Long Biên and Vinhomes Ocean Park (~27 km in Hanoi, ~32 km total). Groundbreaking 22 Jun 2026, target 2030. Extension Mê Linh (Quang Minh IZ) – Thăng Long Bridge (~21 km) is in the 2031–2035 phase. Stations are provisional (OSM). Color from the vi.wikipedia planning-map palette.',
    sources: ['vnx-18-lines', 'baoxaydung-5-lines', 'vtc-5-lines', 'vnn-contracts', 'osm'],
    geometry: 'l14',
    segments: [
      { stations: ['tan-xuan', 'thuong-thuy', 'ke-ga', 'nhat-tan', 'au-co', 'tu-lien', 'nghi-tam', 'nghia-dung', 'hang-dau', 'tran-quang-khai', 'le-thanh-tong', 'tran-thanh-tong', 'tran-khat-chan', 'tu-dinh', 'long-bien-dong', 'co-linh', 'xuan-do', 'dong-du', 'giap-hai', 'thuan-ton', 'da-ton', 'vinhomes-ocean-park', 'ocean-park-dong', 'duong-5', 'duong-xa'], status: UC, year: 2030, label: 'Thăng Long Bridge – Hồng Hà – Ocean Park (groundbreaking 22 Jun 2026)', path: true },
      { stations: ['me-linh', 'quang-minh', 'kcn-thang-long', 'tan-xuan'], status: PL, year: 2035, label: 'Extension Mê Linh (Quang Minh IZ) – Thăng Long Bridge (~21 km)' },
    ],
  },
  {
    id: 'line-11', code: '11', name: 'Line 11: Lien Ha – West Lake – Chuc Son', nameLocal: 'Tuyến 11: Liên Hà – Hồ Tây – Đô thị Chúc Sơn',
    group: 'suburban', color: '#4FC3F7', textColor: '#000000', mode: 'metro', status: PL, lengthKm: 43,
    description: 'New line in the 100-year master plan (~43 km), 2036–2045 phase. Only endpoints and West Lake are published; intermediate stations are indicative. Color chosen.',
    sources: ['vnx-18-lines'],
    segments: [
      { stations: ['lien-ha', 'nhat-tan', 'ho-tay', 'cau-giay', 'trung-kinh', 'duong-noi', 'chuc-son'], status: PL, year: 2045, label: 'Liên Hà – Hồ Tây – Chúc Sơn (indicative alignment)' },
    ],
  },
  {
    id: 'line-12', code: '12', name: 'Line 12: Ngoc Hoi – Thuong Tin – Phu Xuyen', nameLocal: 'Tuyến 12: Ga Ngọc Hồi – Thường Tín – Đô thị Phú Xuyên',
    group: 'suburban', color: '#78909C', mode: 'metro', status: PL, lengthKm: 29,
    description: 'New line (~29 km) to the Phú Xuyên satellite town, 2036–2045 phase. Stations are indicative. Color chosen.',
    sources: ['vnx-18-lines'],
    segments: [
      { stations: ['ngoc-hoi', 'thuong-tin', 'thuong-phuc', 'phu-xuyen'], status: PL, year: 2045, label: 'Ngọc Hồi – Thường Tín – Phú Xuyên (indicative alignment)' },
    ],
  },
  {
    id: 'line-13', code: '13', name: 'Line 13: Phuc Tho – Chuc Son – Ngoc Hoi', nameLocal: 'Tuyến 13: Đô thị Phúc Thọ – Đô thị Chúc Sơn – Tổ hợp Ngọc Hồi',
    group: 'suburban', color: '#9575CD', mode: 'metro', status: PL, lengthKm: 44,
    description: 'New outer line (~44 km), 2036–2045 phase. Stations are indicative. Color chosen.',
    sources: ['vnx-18-lines'],
    segments: [
      { stations: ['phuc-tho', 'huong-ngai', 'quoc-oai', 'chuc-son', 'tam-hung', 'ngoc-hoi'], status: PL, year: 2045, label: 'Phúc Thọ – Chúc Sơn – Ngọc Hồi (indicative alignment)' },
    ],
  },
  {
    id: 'line-15', code: '15', name: 'Line 15: Lien Ha – Ring Road 2.5 – Yen Vien', nameLocal: 'Tuyến 15: Liên Hà – Vành đai 2,5 – Yên Viên',
    group: 'suburban', color: '#00BFA5', textColor: '#000000', mode: 'metro', status: PL, lengthKm: 49,
    description: 'New line (~49 km), 2036–2045 phase. Only "Liên Hà – Ring Road 2.5 – Yên Viên" is published; the drawn route is a rough indication. Color chosen.',
    sources: ['vnx-18-lines'],
    segments: [
      { stations: ['lien-ha', 'nhat-tan', 'hoang-quoc-viet', 'chinh-kinh', 'dinh-cong', 'linh-nam', 'gia-lam', 'yen-vien'], status: PL, year: 2045, label: 'Liên Hà – Vành đai 2,5 – Yên Viên (indicative alignment)' },
    ],
  },
  {
    id: 'line-16', code: '16', name: 'Line 16: Me Linh – Thang Long IP – Yen Thuong', nameLocal: 'Tuyến 16: Mê Linh – KCN Thăng Long – Yên Thường',
    group: 'suburban', color: '#455A64', mode: 'metro', status: PL, lengthKm: 23,
    description: 'New line (~23 km) north of the Red River, 2036–2045 phase. Stations are indicative. Color chosen.',
    sources: ['vnx-18-lines'],
    segments: [
      { stations: ['me-linh', 'kcn-thang-long', 'dong-anh', 'yen-thuong'], status: PL, year: 2045, label: 'Mê Linh – KCN Thăng Long – Yên Thường (indicative alignment)' },
    ],
  },
  {
    id: 'line-17', code: '17', name: 'Line 17: Hoa Lac urban area link', nameLocal: 'Tuyến 17: Tuyến kết nối vùng đô thị Hòa Lạc',
    group: 'suburban', color: '#80DEEA', textColor: '#000000', mode: 'metro', status: PL, lengthKm: 20,
    description: 'Connector within the Hòa Lạc – Xuân Mai urban area (~20 km), 2036–2045 phase. No alignment published; drawn as an indicative Hòa Lạc – Xuân Mai link. Color chosen.',
    sources: ['vnx-18-lines'],
    segments: [
      { stations: ['thach-hoa', 'dong-truc', 'xuan-mai'], status: PL, year: 2045, label: 'Hòa Lạc – Xuân Mai (indicative only)' },
    ],
  },
];

export const GROUPS = [
  { id: 'urban-metro', name: 'Urban metro (lines 1–10, 2A, 14)', nameLocal: 'Đường sắt đô thị', color: '#0D04D6', description: 'Hanoi urban railway network: operating lines 2A and 3, lines under construction (1, 2, 3, 5, 8, 10, 14) and planned lines of the Capital master plan with a 100-year vision.' },
  { id: 'suburban', name: 'Satellite-town lines (11–17)', nameLocal: 'Tuyến kết nối đô thị vệ tinh', color: '#78909C', description: 'Lines added by the 2026 master plan, mostly linking satellite towns and new development areas; 2036–2045 phase.' },
];

export const SOURCES = [
  { id: 'vnx-18-lines', title: 'VnExpress (21 Jul 2026): Tiến độ 18 tuyến đường sắt đô thị ở Hà Nội (phasing tables 2026–2030 / 2031–2035 / 2036–2045)', url: 'https://vnexpress.net/tien-do-18-tuyen-duong-sat-do-thi-o-ha-noi-5099807.html' },
  { id: 'vnx-979km', title: 'VnExpress (4 Jul 2026): Hà Nội quy hoạch 18 tuyến metro dài gần 1.000 km', url: 'https://vnexpress.net/ha-noi-quy-hoach-18-tuyen-metro-dai-gan-1-000-km-5093207.html' },
  { id: 'plan-2512', title: 'Báo Pháp luật: Phê duyệt Quy hoạch tổng thể Thủ đô Hà Nội tầm nhìn 100 năm (Decision 2512/QĐ-UBND, 13 May 2026)', url: 'https://doanhnhan.baophapluat.vn/phe-duyet-quy-hoach-tong-the-thu-do-ha-noi-tam-nhin-100-nam-a2911bf1.md' },
  { id: 'daidoanket-18-lines', title: 'Đại Đoàn Kết (22 Apr 2026): Hà Nội định hướng 18 tuyến metro gần 1.000 km', url: 'https://daidoanket.vn/ha-noi-dinh-huong-18-tuyen-metro-gan-1-000-km-dat-nen-mong-giao-thong-cho-tam-nhin-100-nam.html' },
  { id: 'nguoiquansat-plan', title: 'Người Quan Sát (22 Jul 2026): Quy hoạch Thủ đô tầm nhìn 100 năm – mạng lưới metro gần 1.200 km', url: 'https://nguoiquansat.vn/quy-hoach-thu-do-tam-nhin-100-nam-ha-noi-huong-toi-mang-luoi-metro-gan-1-200km-305615.html' },
  { id: 'vov-18-lines', title: 'VOV (30 Jun 2026): Hà Nội phát triển 18 tuyến đường sắt đô thị dài gần 1.000 km như thế nào?', url: 'https://vov.vn/xa-hoi/ha-noi-phat-trien-18-tuyen-duong-sat-do-thi-dai-gan-1000-km-nhu-the-nao-post1310879.vov' },
  { id: 'vietnamnet-15-lines', title: 'VietNamNet (31 Dec 2024): Hà Nội sẽ làm 15 tuyến đường sắt đô thị (Decision 1668/QĐ-TTg general plan, 616.9 km)', url: 'https://vietnamnet.vn/ha-noi-se-lam-15-tuyen-duong-sat-do-thi-2358561.html' },
  { id: 'baoxaydung-5-lines', title: 'Báo Xây dựng (22 Jun 2026): Chi tiết 5 tuyến đường sắt đô thị hơn 1,3 triệu tỷ đồng vừa khởi công tại Hà Nội', url: 'https://baoxaydung.vn/chi-tiet-5-tuyen-duong-sat-do-thi-hon-13-trieu-ty-dong-vua-khoi-cong-tai-ha-noi-192260622163314712.htm' },
  { id: 'baoxaydung-alignments', title: 'Báo Xây dựng (7 Nov 2026): Hé lộ hướng tuyến 5 metro mới', url: 'https://baoxaydung.vn/he-lo-huong-tuyen-5-metro-moi-ket-noi-cac-cuc-phat-trien-cua-ha-noi-192261107093153639.htm' },
  { id: 'vtc-5-lines', title: 'VTC News (22 Jun 2026): Sơ đồ 5 tuyến metro mới ở Hà Nội do Vinhomes–VinSpeed làm tổng thầu EPC', url: 'https://vtcnews.vn/so-do-5-tuyen-metro-moi-o-ha-noi-do-vinhomes-vinspeed-lam-tong-thau-epc-ar1024955.html' },
  { id: 'vnn-contracts', title: 'VietNamNet (16 Oct 2026): Hanoi plans 253.5 km of driverless metro lines under five new contracts', url: 'https://vietnamnet.vn/en/hanoi-plans-253-5km-of-driverless-metro-lines-under-five-new-contracts-2565293.html' },
  { id: 'cafebiz-5-lines', title: 'CafeBiz (15 Jul 2026): 5 tuyến metro do Vinhomes – VinSpeed làm tổng thầu EPC có diễn biến mới', url: 'https://cafebiz.vn/5-tuyen-metro-do-vinhomes-vinspeed-lam-tong-thau-epc-co-dien-bien-moi-176260715142054739.chn' },
  { id: 'tienphong-line3-2027', title: 'Tiền Phong (9 May 2026): Bí thư Hà Nội yêu cầu tuyến metro ngầm đầu tiên hoàn thành cuối năm 2027', url: 'https://tienphong.vn/bi-thu-ha-noi-yeu-cau-tuyen-metro-ngam-dau-tien-cua-thu-do-hoan-thanh-cuoi-nam-2027-post1842009.tpo' },
  { id: 'vneconomy-line3-ext', title: 'VnEconomy (16 May 2024): Chuẩn bị đầu tư metro tuyến số 3 đoạn ga Hà Nội – Hoàng Mai (7 underground stations)', url: 'https://vneconomy.vn/chuan-bi-dau-tu-metro-di-ngam-gan-nhu-hoan-toan-tuyen-so-3-doan-ga-ha-noi-hoang-mai.htm' },
  { id: 'vietnamnews-line3-eu', title: 'Việt Nam News (20 Oct 2026): EU provides 10 million EUR to prepare Hà Nội\'s Metro Line 3 extension', url: 'https://vietnamnews.vn/society/1802424/eu-provides-10-million-eur-to-prepare-ha-noi-s-metro-line-3-extension.html' },
  { id: 'nhandan-second-airport', title: 'Nhân Dân (14 Mar 2026): Vị trí dự tính để Hà Nội xây dựng sân bay thứ hai', url: 'https://nhandan.vn/vi-tri-du-tinh-de-ha-noi-xay-dung-san-bay-thu-hai-nam-o-dau-post948307.html' },
  { id: 'vi-wiki-network', title: 'Wikipedia (vi): Đường sắt đô thị Hà Nội', url: 'https://vi.wikipedia.org/wiki/%C4%90%C6%B0%E1%BB%9Dng_s%E1%BA%AFt_%C4%91%C3%B4_th%E1%BB%8B_H%C3%A0_N%E1%BB%99i' },
  { id: 'vi-wiki-line2', title: 'Wikipedia (vi): Tuyến 2 (Đường sắt đô thị Hà Nội)', url: 'https://vi.wikipedia.org/wiki/Tuy%E1%BA%BFn_2_(%C4%90%C6%B0%E1%BB%9Dng_s%E1%BA%AFt_%C4%91%C3%B4_th%E1%BB%8B_H%C3%A0_N%E1%BB%99i)' },
  { id: 'vi-wiki-line5', title: 'Wikipedia (vi): Tuyến 5 (Đường sắt đô thị Hà Nội)', url: 'https://vi.wikipedia.org/wiki/Tuy%E1%BA%BFn_5_(%C4%90%C6%B0%E1%BB%9Dng_s%E1%BA%AFt_%C4%91%C3%B4_th%E1%BB%8B_H%C3%A0_N%E1%BB%99i)' },
  { id: 'vi-wiki-line8', title: 'Wikipedia (vi): Tuyến 8 (Đường sắt đô thị Hà Nội) – provisional station list', url: 'https://vi.wikipedia.org/wiki/Tuy%E1%BA%BFn_8_(%C4%90%C6%B0%E1%BB%9Dng_s%E1%BA%AFt_%C4%91%C3%B4_th%E1%BB%8B_H%C3%A0_N%E1%BB%99i)' },
  { id: 'en-wiki', title: 'Wikipedia (en): Hanoi Metro', url: 'https://en.wikipedia.org/wiki/Hanoi_Metro' },
  { id: 'osm', title: 'OpenStreetMap (route relations 9684066, 12989508; construction ways and stations of lines 1, 2, 3, 5, 8, 10, 14) via Overpass API', url: 'https://www.openstreetmap.org/relation/9684066' },
];
