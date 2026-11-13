#!/usr/bin/env node
// Builds public/data/hcmc.json from the hand-curated tables below plus cached OSM data.
// 1. node scripts/hcmc/fetch-osm.mjs   (downloads OSM data into scripts/hcmc/cache/)
// 2. node scripts/hcmc/build-hcmc.mjs  (writes public/data/hcmc.json)
// Research notes and sources: research/hcmc.md
import { readFileSync, writeFileSync } from 'node:fs';
import { haversineKm, simplify, round5 } from './lib.mjs';

const cache = (n) => JSON.parse(readFileSync(new URL(`./cache/${n}.json`, import.meta.url), 'utf8'));
const ACCESSED = '2026-11-13';

// ---------------------------------------------------------------------------
// Sources (all visited during research)
// ---------------------------------------------------------------------------
const SOURCES = [
  ['vi-wiki', 'Đường sắt đô thị Thành phố Hồ Chí Minh (Vietnamese Wikipedia)', 'https://vi.wikipedia.org/wiki/%C4%90%C6%B0%E1%BB%9Dng_s%E1%BA%AFt_%C4%91%C3%B4_th%E1%BB%8B_Th%C3%A0nh_ph%E1%BB%91_H%E1%BB%93_Ch%C3%AD_Minh'],
  ['en-wiki', 'Ho Chi Minh City Metro (English Wikipedia)', 'https://en.wikipedia.org/wiki/Ho_Chi_Minh_City_Metro'],
  ['wiki-colors', 'Module:Adjacent stations/Ho Chi Minh City Metro (line colours used on Wikipedia)', 'https://en.wikipedia.org/wiki/Module:Adjacent_stations/Ho_Chi_Minh_City_Metro'],
  ['vi-wiki-bd', 'Đường sắt đô thị Bình Dương (Vietnamese Wikipedia)', 'https://vi.wikipedia.org/wiki/%C4%90%C6%B0%E1%BB%9Dng_s%E1%BA%AFt_%C4%91%C3%B4_th%E1%BB%8B_B%C3%ACnh_D%C6%B0%C6%A1ng'],
  ['osm-l1', 'OpenStreetMap: HCMC Metro Line 1 route relation (stations and track geometry)', 'https://www.openstreetmap.org/relation/11919223'],
  ['osm-l2', 'OpenStreetMap: HCMC Metro Line 2 route master and planned-station mapping', 'https://www.openstreetmap.org/relation/17508062'],
  ['tienphong-12', 'Tiền Phong (10 Feb 2025): Chi tiết 12 tuyến metro dài hơn 600km (alignments under Decision 1711/QĐ-TTg)', 'https://tienphong.vn/chi-tiet-12-tuyen-metro-dai-hon-600km-ket-noi-cac-khu-do-thi-o-tphcm-post1715790.tpo'],
  ['vietnamnet-12', 'VietNamNet (4 Feb 2025): Chi tiết 12 tuyến metro của TPHCM, kết nối Cần Giờ và Củ Chi', 'https://vietnamnet.vn/chi-tiet-12-tuyen-metro-cua-tphcm-se-ket-noi-den-can-gio-va-cu-chi-2368214.html'],
  ['sggp-355', 'SGGP (10 Dec 2024): TPHCM trình đề án hoàn thành 7 tuyến metro vào năm 2035 (355 km; 510 km by 2045)', 'https://www.sggp.org.vn/tphcm-trinh-de-an-hoan-thanh-7-tuyen-metro-vao-nam-2035-tong-muc-dau-tu-402-ty-usd-post772338.html'],
  ['dbnd-7', 'Đại biểu Nhân dân (13 Aug 2025): TP.HCM đẩy nhanh triển khai 7 tuyến đường sắt đô thị', 'https://daibieunhandan.vn/tp-ho-chi-minh-day-nhanh-trien-khai-7-tuyen-duong-sat-do-thi-10383148.html'],
  ['tuoitre-10', 'Tuổi Trẻ (23 Sep 2025): Chi tiết 10 tuyến metro được đề xuất ưu tiên đầu tư trước (27 lines, ~1,012 km after merger)', 'https://tuoitre.vn/chi-tiet-10-tuyen-metro-duong-sat-tai-tp-hcm-duoc-de-xuat-uu-tien-dau-tu-truoc-20250923115810111.htm'],
  ['voh-10', 'VOH (23 Sep 2025): Hệ thống metro TPHCM đến 2035: 10 tuyến trọng điểm', 'https://voh.com.vn/xa-hoi/he-thong-metro-tphcm-den-2035-10-tuyen-trong-diem-3-tuyen-moi-ket-noi-vung-622213.html'],
  ['voh-5', 'VOH (27 Dec 2025): TPHCM bổ sung 5 tuyến metro, tăng kết nối Long Thành (Resolution 188 list)', 'https://voh.com.vn/xa-hoi/tphcm-bo-sung-5-tuyen-metro-tang-ket-noi-long-thanh-642256.html'],
  ['tuoitre-255', 'Tuổi Trẻ (30 Jul 2026): TP.HCM nâng mục tiêu metro lên 255 km vào năm 2030', 'https://tuoitre.vn/tphcm-nang-muc-tieu-metro-len-255km-vao-nam-2030-vuot-yeu-cau-cua-bo-chinh-tri-100260730144843859.htm'],
  ['hdnd-gantt', 'HĐND TP.HCM (12 Aug 2026): Sơ đồ Gantt làm 8 tuyến metro xong trước 2030', 'https://hdnd.hochiminhcity.gov.vn/tin-tuc/ban-do-thi/tp-hcm-xay-dung-so-do-gantt-lam-8-tuyen-metro-xong-truoc-2030'],
  ['tuoitre-140', 'Tuổi Trẻ (5 Jul 2026): TP.HCM khởi công thêm gần 140 km metro trong năm 2026', 'https://tuoitre.vn/tphcm-khoi-cong-them-gan-140km-metro-trong-nam-2026-100260705184728752.htm'],
  ['vtc-5', 'VTC News (15 Oct 2026): TP.HCM dự kiến khởi công 5 tuyến metro hơn 167 km cuối năm 2026', 'https://vtcnews.vn/tp-hcm-du-kien-khoi-cong-5-tuyen-metro-hon-167km-cuoi-nam-2026-ar1044863.html'],
  ['vtc-ttlt', 'VTC News (28 Jun 2026): Metro 175.000 tỷ đồng nối TP.HCM – sân bay Long Thành', 'https://vtcnews.vn/metro-175-000-ty-dong-noi-tp-hcm-san-bay-long-thanh-du-kien-khoi-cong-thang-9-ar1026041.html'],
  ['voh-cangio', 'VOH (8 Dec 2025): TPHCM chấp thuận triển khai đường sắt Bến Thành – Cần Giờ', 'https://voh.com.vn/xa-hoi/tphcm-chap-thuan-trien-khai-duong-sat-ben-thanh-can-gio-khoi-cong-ngay-1912-640408.html'],
  ['dantri-draft', 'Dân trí (26 Oct 2026): Mạng lưới metro TPHCM thay đổi ra sao trong tầm nhìn 100 năm (draft ~1,555 km network)', 'https://dantri.com.vn/thoi-su/mang-luoi-metro-tphcm-thay-doi-ra-sao-trong-tam-nhin-100-nam-20261026115234595.htm'],
  ['thanhnien-bd', 'Thanh Niên (17 Nov 2025): Đường đi của 2 tuyến metro kết nối trung tâm TP.HCM đến Bình Dương (cũ)', 'https://thanhnien.vn/duong-di-cua-2-tuyen-metro-ket-noi-khu-trung-tam-tphcm-den-binh-duong-cu-185251117095354911.htm'],
  ['tuoitre-l2w', 'Tuổi Trẻ (8 Mar 2026): Liên danh đề xuất làm metro 2 đoạn Tham Lương – An Hạ – khu đô thị Tây Bắc', 'https://tuoitre.vn/mot-lien-danh-de-xuat-lam-metro-2-doan-tham-luong-an-ha-khu-do-thi-tay-bac-20260308110158453.htm'],
  ['index-l1ext', 'index.vn (29 Apr 2026): Đồng Nai approves investment policy for extending the Bến Thành – Suối Tiên metro to Long Thành airport', 'https://index.vn/en/news/dong-nai-approves-investment-plan-for-extending-the-ben-thanh-suoi-tien-metro-to-long-thanh-airport-with-a-total-investment-of-65573-trillion-vnd-about-dollar25-billion-to-be-implemented-in-2026-2030'],
  ['cafeland-l1ext', 'CafeLand (28 Aug 2026): Tuyến metro gần 44 km đến sân bay Long Thành sẽ được xây dựng cấp bách', 'https://cafeland.vn/tin-tuc/tuyen-metro-gan-44km-den-san-bay-long-thanh-se-duoc-xay-dung-cap-bach-154564.html'],
  ['baophapluat-l1ext', 'Báo Pháp luật (3 Jun 2025): Đồng Nai chốt chủ trương kéo dài tuyến metro số 1 đến sân bay Long Thành', 'https://doanhnhan.baophapluat.vn/dong-nai-chot-chu-truong-keo-dai-tuyen-metro-so-1-ket-noi-tp-hcm-voi-san-bay-long-thanh-83411.html'],
  ['cafeland-vt', 'CafeLand (7 Jul 2026): Vũng Tàu có thể đi sân bay Long Thành bằng metro (Line 3 extension study)', 'https://cafeland.vn/tin-tuc/vung-tau-co-the-di-san-bay-long-thanh-bang-metro-153075.html'],
  ['fsea-brvt', 'Future Southeast Asia (31 May 2023): Ba Ria – Vung Tau planning three urban railway lines', 'https://futuresoutheastasia.com/ba-ria-vung-tau-planning-three-urban-railway-lines/'],
];

// ---------------------------------------------------------------------------
// Stations. coord: OSM node id (number) or [lng, lat] estimate (approx unless approx:false).
// Hand estimates were checked against Nominatim lookups of the named place / intersection.
// ---------------------------------------------------------------------------
const ST = {};
function S(id, name, nameLocal, coord, opts = {}) {
  if (ST[id]) throw new Error('dup station ' + id);
  ST[id] = { id, name, nameLocal, coord, ...opts };
}

// Line 1 (operating) – OSM
S('ben-thanh', 'Ben Thanh', 'Bến Thành', 11586280308);
S('nha-hat-thanh-pho', 'Opera House', 'Nhà hát Thành phố', 11586280310);
S('ba-son', 'Ba Son', 'Ba Son', 11586280312);
S('van-thanh', 'Van Thanh Park', 'Công viên Văn Thánh', 11586280298);
S('tan-cang', 'Tan Cang', 'Tân Cảng', 11586280299);
S('thao-dien', 'Thao Dien', 'Thảo Điền', 11586280300);
S('an-phu', 'An Phu', 'An Phú', 11586280301);
S('rach-chiec', 'Rach Chiec', 'Rạch Chiếc', 11586280302);
S('phuoc-long', 'Phuoc Long', 'Phước Long', 11586280303);
S('binh-thai', 'Binh Thai', 'Bình Thái', 11586280304);
S('thu-duc', 'Thu Duc', 'Thủ Đức', 11586280327);
S('khu-cong-nghe-cao', 'High Tech Park', 'Khu Công nghệ cao', 11586280305);
S('dai-hoc-quoc-gia', 'National University', 'Đại học Quốc gia', 11586280306);
S('ben-xe-suoi-tien', 'Suoi Tien Terminal', 'Bến xe Suối Tiên', 11586280307);

// Line 2 Bến Thành – Tham Lương / Bến Thành – Thủ Thiêm (construction) – OSM
S('tao-dan', 'Tao Dan', 'Tao Đàn', 14101047903);
S('dan-chu', 'Dan Chu', 'Dân Chủ', 14101047901);
S('hoa-hung', 'Hoa Hung (Saigon Station)', 'Hòa Hưng (Ga Sài Gòn)', 14101046698);
S('le-thi-rieng', 'Le Thi Rieng', 'Lê Thị Riêng', 14101046688);
S('pham-van-hai', 'Pham Van Hai', 'Phạm Văn Hai', 14101046685);
S('bay-hien', 'Bay Hien', 'Bảy Hiền', 14101046677);
S('nguyen-hong-dao', 'Nguyen Hong Dao', 'Nguyễn Hồng Đào', 14101046667);
S('ba-queo', 'Ba Queo', 'Bà Quẹo', 14101046662, { codes: ['ST01'] });
S('pham-van-bach', 'Pham Van Bach', 'Phạm Văn Bạch', 14101046653);
S('tan-binh', 'Tan Binh (Tham Luong)', 'Tân Bình (Tham Lương)', 14101046647);
S('ham-nghi', 'Ham Nghi', 'Hàm Nghi', 14101047913);
S('to-huu', 'To Huu', 'Tố Hữu', 14101047919);
S('cung-thieu-nhi', "Children's Palace", 'Cung Thiếu nhi', 14101047928);
S('benh-vien-quoc-te', 'International Hospital', 'Bệnh viện Quốc tế', 14101047933);
S('binh-khanh', 'Binh Khanh', 'Bình Khánh', 14101047935);
S('thu-thiem', 'Thu Thiem', 'Thủ Thiêm', 14101047943);
// Line 2 west (planned; PPP proposal, alignment not published)
S('an-suong', 'An Suong', 'An Sương', [106.6134, 10.8437]);
S('an-ha', 'An Ha', 'An Hạ', [106.519, 10.802]);
S('kenh-an-ha', 'An Ha Canal (Hoc Mon)', 'Kênh An Hạ (Hóc Môn)', [106.5306, 10.8548]);
S('tay-bac-cu-chi', 'Cu Chi Northwest Urban Area', 'Khu đô thị Tây Bắc Củ Chi', [106.555, 10.925]);
S('ben-xe-song-tac', 'Song Tac Bus Terminal', 'Bến xe Sông Tắc', [106.838, 10.792]);

// Line 1 west (Bến Thành – An Hạ) – plan waypoints
S('cong-quynh', 'Cong Quynh', 'Cống Quỳnh', [106.6912, 10.7676]);
S('nga-sau-cong-hoa', 'Cong Hoa Roundabout', 'Ngã sáu Cộng Hòa', [106.6817, 10.7654]);
S('ly-thai-to', 'Ly Thai To', 'Lý Thái Tổ (Ngã bảy)', [106.6765, 10.7665]);
S('lanh-binh-thang', 'Lanh Binh Thang', 'Lãnh Binh Thăng', [106.6505, 10.7625]);
S('dam-sen', 'Dam Sen', 'Đầm Sen', [106.6390, 10.7682]);
S('hoa-binh', 'Hoa Binh (Tan Phu)', 'Hòa Bình (Tân Phú)', [106.6215, 10.7745]);
// Line 1 extension Suối Tiên – Long Thành airport (Đồng Nai project)
S('dong-nai-admin', 'Dong Nai Administrative Center', 'Trung tâm hành chính Đồng Nai', [106.8600, 10.9180]);
S('phuoc-tan', 'Phuoc Tan', 'Phước Tân', [106.9100, 10.8850]);
S('an-phuoc', 'An Phuoc', 'An Phước', [106.9500, 10.8150]);

// Thủ Thiêm – Long Thành (approved) – OSM proposed stations
S('binh-trung', 'Binh Trung', 'Bình Trưng', 13316616965);
S('do-xuan-hop', 'Do Xuan Hop', 'Đỗ Xuân Hợp', 13606960018);
S('phu-huu', 'Phu Huu', 'Phú Hữu', 14163030054, { codes: ['ST17'] });
S('ong-nhieu', 'Ong Nhieu', 'Ông Nhiêu', 13606960021);
S('long-truong', 'Long Truong', 'Long Trường', 13606960025);
S('thiec-dua', 'Thiec Dua', 'Thiếc Dừa', 10965671552);
S('long-tan', 'Long Tan', 'Long Tân', 13606960027);
S('phu-thanh', 'Phu Thanh', 'Phú Thạnh', 13606960029);
S('tuy-ha', 'Tuy Ha', 'Tuy Hạ', 13316655709);
S('nhon-trach', 'Nhon Trach', 'Nhơn Trạch', 13316655712);
S('phu-hoi', 'Phu Hoi', 'Phú Hội', 13606960036);
S('phuoc-thien', 'Phuoc Thien', 'Phước Thiền', 13606960035);
S('hiep-phuoc-nhon-trach', 'Hiep Phuoc (Nhon Trach)', 'Hiệp Phước (Nhơn Trạch)', 13606960037);
S('lt-s16', 'S16 (Long Thanh)', 'Ga S16 (Long Thành)', 13316655720, { codes: ['S16'] });
S('lt-s17', 'S17 (Long Thanh)', 'Ga S17 (Long Thành)', 13316655723, { codes: ['S17'] });
S('lt-s19', 'S19 (Long Thanh)', 'Ga S19 (Long Thành)', 13316655727, { codes: ['S19'] });
S('long-thanh-airport', 'Long Thanh Airport', 'Sân bay quốc tế Long Thành', 13811202171);

// Line 6 phase 1 (approved) – OSM
S('t3', 'Tan Son Nhat T3', 'Tân Sơn Nhất T3', 14162885270, { codes: ['ST02'] });
S('tan-son-nhat', 'Tan Son Nhat Airport', 'Sân bay Tân Sơn Nhất', 14162885276, { codes: ['ST03'] });
S('cong-vien-gia-dinh', 'Gia Dinh Park', 'Công viên Gia Định', 14162885284, { codes: ['ST04'] });
S('go-vap', 'Go Vap', 'Gò Vấp', 14162885295, { codes: ['ST05'] });
S('phan-van-tri', 'Phan Van Tri', 'Phan Văn Trị', 14162896804, { codes: ['ST06'] });
S('nguyen-xi', 'Nguyen Xi', 'Nguyễn Xí', 14162896809, { codes: ['ST07'] });
S('cau-binh-loi', 'Binh Loi – Binh Trieu Bridge', 'Cầu Bình Lợi / Cầu Bình Triệu', 14162896827, { codes: ['ST08', 'C17'] });
S('binh-trieu', 'Binh Trieu', 'Bình Triệu', 14162896842, { codes: ['ST09'] });
S('cau-go-dua', 'Go Dua Bridge', 'Cầu Gò Dưa', 14162896853, { codes: ['ST10'] });
S('linh-dong', 'Linh Dong', 'Linh Đông', 14162896862, { codes: ['ST11'] });
S('tang-nhon-phu', 'Tang Nhon Phu', 'Tăng Nhơn Phú', 14163030029, { codes: ['ST13'] });
S('khu-cnc-nam', 'High Tech Park South', 'Khu Công nghệ cao (Nam)', 14163030035, { codes: ['ST14'] });
S('cau-phu-huu', 'Phu Huu Bridge', 'Cầu Phú Hữu', 14163030045, { codes: ['ST15'] });
S('lien-phuong', 'Lien Phuong', 'Liên Phường', 14163030053, { codes: ['ST16'] });
// Line 6 phase 2 – plan waypoints
S('cat-lai', 'Cat Lai', 'Cát Lái', [106.7747, 10.7699]);
S('tan-thuan', 'Tan Thuan', 'Tân Thuận', [106.7245, 10.7242]);
S('ta-quang-buu', 'Ta Quang Buu', 'Tạ Quang Bửu', [106.6640, 10.7395]);
S('nguyen-van-luong', 'Nguyen Van Luong', 'Nguyễn Văn Luông', [106.6355, 10.7420]);
S('phu-lam', 'Phu Lam', 'Vòng xoay Phú Lâm', [106.6336, 10.7533]);
S('luy-ban-bich', 'Luy Ban Bich', 'Lũy Bán Bích', [106.6335, 10.7760]);
S('au-co', 'Au Co', 'Âu Cơ', [106.6420, 10.7900]);

// Bình Dương Line 1 (approved) – OSM (station names not yet published; codes only)
const B1 = ['S0B', 'S0A', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17'];
const B1_OSM = {
  S0B: 14160167537, S0A: 14180656480, S1: 14160167524, S2: 14160167518, S3: 14160167500, S4: 14160167452,
  S6: 14160167435, S7: 14160167431, S8: 14160167415, S9: 14160167413, S10: 13607028365, S11: 14160167402,
  S12: 14160153593, S13: 13607028346, S14: 13607028337, S15: 13607028312, S16: 13607028304, S17: 14160153572,
};
for (const c of B1) if (c !== 'S5') S('b1-' + c.toLowerCase(), `B1 ${c}`, `Ga ${c}`, B1_OSM[c], { codes: [c] });
// Thủ Dầu Một – Tao Đàn line (approved) – OSM, codes C0..C23
S('dong-cay-viet', 'Dong Cay Viet', 'Đồng Cây Viết', 13610982001, { codes: ['C0', 'S5'] });
const B2 = [
  ['C1', 'dinh-hoa', 'Dinh Hoa', 'Định Hòa', 14161840609],
  ['C2', 'hiep-thanh', 'Hiep Thanh', 'Hiệp Thành', 14161840643],
  ['C3', 'go-dau', 'Go Dau', 'Gò Đậu', 14161949343],
  ['C4', 'phu-hoa', 'Phu Hoa', 'Phú Hòa', 14161949356],
  ['C5', 'an-thanh', 'An Thanh', 'An Thạnh', 14161949365],
  ['C6', 'hung-dinh', 'Hung Dinh', 'Hưng Định', 14161949377],
  ['C7', 'thuan-giao', 'Thuan Giao', 'Thuận Giao', 14161949384],
  ['C8', 'thuan-an-hoa', 'Thuan An Hoa', 'Thuận An Hòa', 14161949388],
  ['C9', 'binh-hoa', 'Binh Hoa', 'Bình Hòa', 14161970303],
  ['C10', 'cau-ong-bo', 'Ong Bo Bridge', 'Cầu Ông Bố', 14161972562],
  ['C11', 'vinh-phu', 'Vinh Phu', 'Vĩnh Phú', 14161972575],
  ['C12', 'nga-tu-binh-phuoc', 'Binh Phuoc Junction', 'Ngã tư Bình Phước', 14162052627],
  ['C13', 'tam-binh', 'Tam Binh', 'Tam Bình', 14162052629],
  ['C14', 'hiep-binh-phuoc', 'Hiep Binh Phuoc', 'Hiệp Bình Phước', 14162052631],
  ['C15', 'hiep-binh', 'Hiep Binh', 'Hiệp Bình', 14162052652],
  ['C16', 'binh-trieu-ql13', 'Binh Trieu (QL13)', 'Bình Triệu (Quốc lộ 13)', 14162052664],
  ['C18', 'ben-xe-mien-dong', 'Old Eastern Bus Station', 'Bến xe Miền Đông', 14162147041],
  ['C19', 'hang-xanh', 'Hang Xanh', 'Hàng Xanh', 14162147069],
  ['C20', 'thi-nghe', 'Thi Nghe', 'Thị Nghè', 14162147081],
  ['C21', 'thao-cam-vien', 'Saigon Zoo', 'Thảo Cầm Viên', 14162147093],
  ['C22', 'nha-tho-duc-ba', 'Notre-Dame Cathedral', 'Nhà thờ Đức Bà / Nhà Văn hóa Thanh niên', 14162147095],
];
const B2IDS = B2.map((r) => r[1]);
B2IDS.splice(B2IDS.indexOf('binh-trieu-ql13') + 1, 0, 'cau-binh-loi');
for (const [code, id, n, nl, osm] of B2) S(id, n, nl, osm, { codes: id === 'nha-tho-duc-ba' ? [code, 'ST.14'] : [code] });

// Line 4 south (Sovico study; OSM-mapped, positions from an investor proposal => approx)
const L4S = [
  ['ST.13', 'cong-vien-le-van-tam', 'Le Van Tam Park', 'Công viên Lê Văn Tám', 14303060640],
  ['ST.16', 'cong-vien-khanh-hoi', 'Khanh Hoi Park', 'Công viên Khánh Hội', 14299510804],
  ['ST.17', 'nguyen-thi-thap', 'Nguyen Thi Thap', 'Nguyễn Thị Thập', 14263704495],
  ['ST.18', 'nguyen-van-linh', 'Nguyen Van Linh', 'Nguyễn Văn Linh', 14263704487],
  ['ST.19', 'rach-dia', 'Rach Dia', 'Rạch Đĩa', 14263704460],
  ['ST.20', 'cau-so-1', 'Bridge No. 1', 'Cầu Số 1', 14259013900],
  ['ST.21', 'vinh-phuoc', 'Vinh Phuoc', 'Vĩnh Phước', 14259013880],
  ['ST.22', 'kho-b', 'Kho B', 'Kho B', 14258930069],
  ['ST.23', 'phuoc-kien', 'Phuoc Kien', 'Phước Kiển', 14258930055],
  ['ST.24', 'ba-chiem', 'Ba Chiem', 'Bà Chiêm', 14258930034],
  ['ST.25', 'long-thoi', 'Long Thoi', 'Long Thới', 14258930030],
  ['ST.26', 'phan-van-bay', 'Phan Van Bay', 'Phan Văn Bảy', 14258910892],
  ['ST.27', 'cong-vien-the-thao', 'Sports Park', 'Công viên Thể thao', 14258910895],
  ['ST.28', 'trung-tam-hiep-phuoc', 'Hiep Phuoc Center', 'Trung tâm Hiệp Phước', 14258910889],
  ['ST.29', 'bau-le', 'Bau Le', 'Bàu Le', 14258910877],
  ['ST.30', 'hiep-phuoc', 'Hiep Phuoc', 'Hiệp Phước', 14258910875],
];
for (const [code, id, n, nl, osm] of L4S) S(id, n, nl, osm, { codes: [code], approx: true });
// Line 4 north – plan waypoints
S('dong-thanh', 'Dong Thanh', 'Đông Thạnh', [106.6361, 10.8982]);
S('ha-huy-giap', 'Ha Huy Giap (Thoi An)', 'Hà Huy Giáp (Thới An)', [106.6830, 10.8800]);
S('nguyen-oanh', 'Nguyen Oanh', 'Nguyễn Oanh', [106.6780, 10.8450]);
S('nguyen-van-troi', 'Nguyen Van Troi', 'Nguyễn Văn Trỗi', [106.6790, 10.7960]);

// Line 3 – plan waypoints (An Hạ – Tao Đàn)
S('le-minh-xuan', 'Le Minh Xuan', 'Lê Minh Xuân', [106.5300, 10.7600]);
S('tan-kien', 'Tan Kien', 'Tân Kiên', [106.5740, 10.7140]);
S('an-lac', 'An Lac (Ho Hoc Lam)', 'An Lạc (Hồ Học Lãm)', [106.6090, 10.7260]);
S('ben-xe-mien-tay', 'Western Bus Station', 'Bến xe Miền Tây', [106.6194, 10.7401]);
S('phu-dong-thien-vuong', 'Phu Dong Thien Vuong', 'Phù Đổng Thiên Vương (Hồng Bàng)', [106.6570, 10.7540]);
S('hung-vuong', 'Hung Vuong – Ngo Gia Tu', 'Hùng Vương – Ngô Gia Tự', [106.6680, 10.7590]);

// Line 5 – plan waypoints
S('hung-long', 'Hung Long University Town', 'Đô thị Đại học Hưng Long', [106.6280, 10.6600]);
S('ben-xe-can-giuoc', 'New Can Giuoc Bus Station', 'Bến xe Cần Giuộc mới', [106.6555, 10.6870]);
S('binh-hung', 'Binh Hung (QL50)', 'Bình Hưng (Quốc lộ 50)', [106.6560, 10.7190]);
S('cao-xuan-duc', 'Cao Xuan Duc', 'Cao Xuân Dục', [106.6495, 10.7425]);
S('phu-tho', 'Phu Tho', 'Phú Thọ', [106.6600, 10.7675]);
S('hoang-van-thu', 'Hoang Van Thu Park', 'Công viên Hoàng Văn Thụ', [106.6668, 10.7995]);
S('phan-dang-luu', 'Phan Dang Luu', 'Phan Đăng Lưu', [106.6870, 10.8030]);
S('long-thuan', 'Long Thuan', 'Long Thuận', [106.8509, 10.8114]);
S('vinhomes-grand-park', 'Vinhomes Grand Park', 'Vinhomes Grand Park', [106.8421, 10.8396]);

// Line 7 – plan waypoints
S('phong-phu', 'Phong Phu', 'Phong Phú', [106.6460, 10.6914]);
S('binh-hung-nam', 'Binh Hung South', 'Khu dân cư Bình Hưng Nam', [106.6720, 10.7080]);
S('dao-su-tich', 'Dao Su Tich', 'Đào Sư Tích', [106.7000, 10.7120]);
S('phu-my-hung', 'Phu My Hung', 'Phú Mỹ Hưng (Tôn Dật Tiên)', [106.7205, 10.7290]);
S('tran-bach-dang', 'Tran Bach Dang', 'Trần Bạch Đằng (Thủ Thiêm)', [106.7280, 10.7690]);
S('tran-nao', 'Tran Nao', 'Trần Não', [106.7330, 10.7930]);
S('thanh-da', 'Thanh Da', 'Thanh Đa', [106.7194, 10.8180]);
S('d2-cnc', 'High Tech Park D2', 'Đường D2 Khu Công nghệ cao', [106.8000, 10.8420]);
S('long-binh', 'Long Binh Depot', 'Depot Long Bình', [106.8224, 10.8791]);

// Line 8 – plan waypoints
S('da-phuoc', 'Da Phuoc', 'Đa Phước', [106.6650, 10.6650]);
S('pham-hung', 'Pham Hung', 'Phạm Hùng', [106.6735, 10.7245]);
S('chanh-hung', 'Chanh Hung', 'Chánh Hưng', [106.6765, 10.7430]);
S('quang-trung', 'Quang Trung', 'Quang Trung', [106.6640, 10.8360]);
S('cv-phan-mem-quang-trung', 'Quang Trung Software Park', 'Công viên phần mềm Quang Trung', [106.6285, 10.8545]);
S('to-ky', 'To Ky', 'Tô Ký', [106.6180, 10.8640]);
S('tan-chanh-hiep', 'Tan Chanh Hiep', 'Tân Chánh Hiệp', [106.6300, 10.8720]);
S('hoc-mon', 'Hoc Mon', 'Hóc Môn', [106.5927, 10.8861]);
S('binh-my', 'Binh My', 'Bình Mỹ', [106.6420, 10.9530]);

// Line 9 – plan waypoints
S('no-trang-long', 'No Trang Long', 'Nơ Trang Long', [106.6990, 10.8180]);
S('le-van-duyet', 'Le Van Duyet', 'Lê Văn Duyệt', [106.6970, 10.8040]);
S('to-hien-thanh', 'To Hien Thanh', 'Tô Hiến Thành', [106.6655, 10.7770]);
S('tan-ky-tan-quy', 'Tan Ky Tan Quy', 'Tân Kỳ Tân Quý', [106.6260, 10.8000]);
S('huong-lo-3', 'Huong Lo 3', 'Hương Lộ 3', [106.6050, 10.7950]);
S('vinh-loc-a', 'Vinh Loc A', 'Vĩnh Lộc A', [106.5700, 10.8150]);

// Line 10 – plan waypoints
S('truong-van-bang', 'Truong Van Bang', 'Trương Văn Bang', [106.7570, 10.7830]);
S('tam-da', 'Tam Da', 'Tam Đa', [106.8200, 10.8250]);
S('d1-cnc', 'High Tech Park D1', 'Đường D1 Khu Công nghệ cao', [106.8000, 10.8600]);
S('linh-trung', 'Linh Trung', 'Linh Trung', [106.7784, 10.8588]);
S('linh-xuan', 'Linh Xuan (QL1)', 'Linh Xuân (Quốc lộ 1)', [106.7650, 10.8780]);
S('an-phu-dong', 'An Phu Dong', 'An Phú Đông', [106.6918, 10.8610]);
S('kenh-tham-luong', 'Tham Luong Canal', 'Kênh Tham Lương', [106.6100, 10.8030]);
S('ma-lo', 'Ma Lo', 'Mã Lò', [106.6009, 10.7764]);
S('kcn-tan-tao', 'Tan Tao Industrial Park', 'Khu công nghiệp Tân Tạo', [106.5925, 10.7528]);
S('trinh-quang-nghi', 'Trinh Quang Nghi', 'Trịnh Quang Nghị', [106.6260, 10.7160]);
S('nhon-duc', 'Nhon Duc', 'Nhơn Đức', [106.6941, 10.6685]);
S('dao-tri', 'Dao Tri', 'Đào Trí', [106.7413, 10.7300]);

// Line 11 riverside tram – plan waypoints
S('ly-chieu-hoang', 'Ly Chieu Hoang', 'Lý Chiêu Hoàng', [106.6300, 10.7350]);
S('vo-van-kiet-cho-lon', 'Vo Van Kiet (Cho Lon)', 'Võ Văn Kiệt (Chợ Lớn)', [106.6600, 10.7490]);
S('cau-ong-lanh', 'Ong Lanh Bridge', 'Cầu Ông Lãnh (Võ Văn Kiệt)', [106.6975, 10.7640]);
S('me-linh', 'Me Linh Square', 'Công trường Mê Linh', [106.7063, 10.7753]);
S('binh-quoi', 'Binh Quoi', 'Bình Quới', [106.7350, 10.8200]);
S('thanh-loc', 'Thanh Loc', 'Thạnh Lộc', [106.6900, 10.8750]);
S('trung-an', 'Trung An (Cu Chi)', 'Trung An (Củ Chi)', [106.5950, 10.9950]);

// Cần Giờ railway (construction)
S('can-gio', 'Can Gio', 'Cần Giờ', [106.9327, 10.3939]);

// Former Bình Dương plan – plan waypoints
S('tan-dong-hiep', 'Tan Dong Hiep', 'Tân Đông Hiệp', [106.7656, 10.9365]);
S('nga-tu-go-dua', 'Go Dua Junction', 'Ngã tư Gò Dưa', [106.7420, 10.8570]);
S('thoi-hoa', 'Thoi Hoa', 'Thới Hòa', [106.6257, 11.0974]);
S('bac-tan-uyen', 'Bac Tan Uyen', 'Bắc Tân Uyên', [106.8400, 11.1250]);
S('tan-uyen', 'Tan Uyen', 'Tân Uyên', [106.7975, 11.0601]);
S('tan-hiep-bd', 'Tan Hiep', 'Tân Hiệp', [106.7576, 11.0496]);
S('an-binh-di-an', 'An Binh (Di An)', 'An Bình (Dĩ An)', [106.7700, 10.8950]);
S('tan-phuoc-khanh', 'Tan Phuoc Khanh', 'Tân Phước Khánh', [106.7350, 10.9950]);
S('bien-hoa', 'Bien Hoa', 'Biên Hòa', [106.8221, 10.9508]);
S('tay-nam', 'Tay Nam', 'Tây Nam', [106.5238, 11.1292]);
S('cau-thu-bien', 'Thu Bien Bridge', 'Cầu Thủ Biên', [106.9117, 11.0312]);
S('bach-dang-tu', 'Bach Dang (Tan Uyen)', 'Bạch Đằng (Tân Uyên)', [106.8550, 11.0400]);
S('phu-an', 'Phu An', 'Phú An', [106.6188, 11.0437]);
S('cau-phu-thuan', 'Phu Thuan Bridge', 'Cầu Phú Thuận', [106.5325, 11.0575]);
S('ben-cat', 'Ben Cat (My Phuoc)', 'Bến Cát (Mỹ Phước)', [106.5987, 11.1514]);
S('bau-bang', 'Bau Bang', 'Bàu Bàng', [106.6250, 11.2450]);
S('long-nguyen', 'Long Nguyen', 'Long Nguyên', [106.5500, 11.2200]);
S('thanh-tuyen', 'Thanh Tuyen', 'Thanh Tuyền', [106.4700, 11.2800]);
S('dau-tieng', 'Dau Tieng', 'Dầu Tiếng', [106.4030, 11.3308]);
S('phuoc-hoa', 'Phuoc Hoa', 'Phước Hòa', [106.7735, 11.2535]);
S('phu-giao', 'Phu Giao', 'Phú Giáo', [106.7950, 11.2950]);
S('vinh-tan', 'Vinh Tan', 'Vĩnh Tân', [106.7850, 11.1800]);

// Former Bà Rịa – Vũng Tàu plan – plan waypoints
S('le-hong-phong', 'Vung Tau (Le Hong Phong)', 'Vũng Tàu (Lê Hồng Phong)', [107.0858, 10.3528]);
S('bai-truoc', 'Front Beach', 'Bãi Trước', [107.0725, 10.3460]);
S('ha-long-vt', 'Ha Long Road', 'Đường Hạ Long', [107.0720, 10.3320]);
S('bai-sau', 'Back Beach', 'Bãi Sau (Thùy Vân)', [107.0960, 10.3427]);
S('chi-linh', 'Chi Linh', 'Chí Linh', [107.1196, 10.3711]);
S('rach-dua', 'Rach Dua', 'Rạch Dừa', [107.1050, 10.3920]);
S('phuoc-thang', 'Phuoc Thang (Cua Lap)', 'Phước Thắng (Cửa Lấp)', [107.1569, 10.4112]);
S('long-hai', 'Long Hai', 'Long Hải', [107.2320, 10.3850]);
S('phuoc-hai', 'Phuoc Hai', 'Phước Hải', [107.2820, 10.4050]);
S('loc-an', 'Loc An', 'Lộc An', [107.3400, 10.4450]);
S('ho-tram', 'Ho Tram', 'Hồ Tràm', [107.4000, 10.4850]);
S('ho-coc', 'Ho Coc', 'Hồ Cốc', [107.4700, 10.5100]);
S('binh-chau', 'Binh Chau', 'Bình Châu', [107.5400, 10.5650]);
S('ba-ria', 'Ba Ria', 'Bà Rịa', [107.1789, 10.4934]);
S('tan-hai', 'Tan Hai', 'Tân Hải', [107.1100, 10.5400]);
S('phu-my', 'Phu My', 'Phú Mỹ', [107.0546, 10.6235]);
S('phuoc-binh', 'Phuoc Binh (Long Thanh)', 'Phước Bình (Long Thành)', [107.0600, 10.7000]);

// ---------------------------------------------------------------------------
// Groups and lines
// ---------------------------------------------------------------------------
const GROUPS = [
  { id: 'metro', name: 'Urban metro', nameLocal: 'Đường sắt đô thị (metro)', color: '#0079b8',
    description: 'Lines 1-10 of the former HCMC network (Decision 1711/QĐ-TTg, 2024) plus the Thủ Dầu Một – Tao Đàn line, which now absorbs the old Line 3 north section.' },
  { id: 'regional', name: 'Regional & airport links', nameLocal: 'Tuyến kết nối vùng, sân bay', color: '#2e3192',
    description: 'Lines into the former Bình Dương and Bà Rịa – Vũng Tàu provinces (merged into HCMC on 1 July 2025), Đồng Nai and the airports.' },
  { id: 'lrt-tram', name: 'Tram, LRT & monorail', nameLocal: 'Xe điện, LRT, monorail', color: '#53c5e0',
    description: 'Lower-capacity lines: the Line 11 riverside tram/LRT and the two Vũng Tàu lines the provincial plan proposed as monorail.' },
];

const seg = (stations, status, year, label, opts = {}) => ({ stations, status, year, label, ...opts });
const L6P1 = ['ba-queo', 't3', 'tan-son-nhat', 'cong-vien-gia-dinh', 'go-vap', 'phan-van-tri', 'nguyen-xi', 'cau-binh-loi', 'binh-trieu', 'cau-go-dua', 'linh-dong', 'binh-thai', 'tang-nhon-phu', 'khu-cnc-nam', 'cau-phu-huu', 'lien-phuong', 'phu-huu'];

const LINES = [
  {
    id: 'line-1', code: '1', name: 'Line 1', nameLocal: 'Tuyến số 1 (Bến Thành – Suối Tiên)', group: 'metro', color: '#0079b8', mode: 'metro',
    opened: 2024, lengthKm: 19.7,
    description: 'First HCMC metro line, Bến Thành – Suối Tiên (19.7 km, 14 stations, 3 underground), in commercial service since 22 Dec 2024. Planned western extension Bến Thành – An Hạ (Line 1 reaches 40.8 km in Decision 1711; the Oct 2026 draft plan would re-label it part of a new east–west Line 8). Eastern extension Suối Tiên – Đồng Nai administrative centre – Long Thành airport (~44 km, Đồng Nai investment policy approved Apr 2026, PPP, 2026-2030; intermediate stations not published, shown as indicative waypoints). Colour as used on OSM and Wikipedia.',
    sources: ['osm-l1', 'en-wiki', 'vi-wiki', 'tienphong-12', 'dbnd-7', 'index-l1ext', 'cafeland-l1ext', 'baophapluat-l1ext', 'wiki-colors'],
    segments: [
      seg(['ben-thanh', 'nha-hat-thanh-pho', 'ba-son', 'van-thanh', 'tan-cang', 'thao-dien', 'an-phu', 'rach-chiec', 'phuoc-long', 'binh-thai', 'thu-duc', 'khu-cong-nghe-cao', 'dai-hoc-quoc-gia', 'ben-xe-suoi-tien'], 'operating', 2024, 'Bến Thành – Suối Tiên (opened 22 Dec 2024)', { pathFrom: 'line1' }),
      seg(['ben-thanh', 'cong-quynh', 'nga-sau-cong-hoa', 'ly-thai-to', 'lanh-binh-thang', 'dam-sen', 'hoa-binh', 'an-ha'], 'planned', 2035, 'Western extension Bến Thành – An Hạ (Decision 1711; priority list for 2035; waypoints follow the published road alignment)'),
      seg(['ben-xe-suoi-tien', 'dong-nai-admin', 'phuoc-tan', 'an-phuoc', 'long-thanh-airport'], 'approved', 2030, 'Extension Suối Tiên – Đồng Nai admin centre – Long Thành airport (~44 km, Đồng Nai PPP project, 2026-2030; intermediate points indicative)'),
    ],
  },
  {
    id: 'line-2', code: '2', name: 'Line 2', nameLocal: 'Tuyến số 2 (Thủ Thiêm – Bến Thành – Tham Lương)', group: 'metro', color: '#cc205f', mode: 'metro',
    opened: 2030, lengthKm: 62.2,
    description: 'Bến Thành – Tham Lương (11.3 km, 11 stations, mostly underground) broke ground 15 Jan 2026; Bến Thành – Thủ Thiêm (6.2 km) broke ground 29 Apr 2026; both targeted for commercial operation by end-2030. The western section Tham Lương – An Hạ and branch 2S An Hạ – Tây Bắc Củ Chi urban area are on the 2026-2030 priority list (PPP proposal by Him Lam – Việt Thiên Hà – VRCC, alignment not yet published). Full line in Decision 1711: 62.2 km. Colour as used on OSM and Wikipedia.',
    sources: ['osm-l2', 'en-wiki', 'vi-wiki', 'vtc-5', 'tuoitre-255', 'tuoitre-l2w', 'hdnd-gantt', 'tienphong-12', 'wiki-colors'],
    segments: [
      seg(['thu-thiem', 'binh-khanh', 'benh-vien-quoc-te', 'cung-thieu-nhi', 'to-huu', 'ham-nghi', 'ben-thanh'], 'construction', 2030, 'Bến Thành – Thủ Thiêm (construction began 29 Apr 2026)', { pathFrom: 'l2' }),
      seg(['ben-thanh', 'tao-dan', 'dan-chu', 'hoa-hung', 'le-thi-rieng', 'pham-van-hai', 'bay-hien', 'nguyen-hong-dao', 'ba-queo', 'pham-van-bach', 'tan-binh'], 'construction', 2030, 'Bến Thành – Tham Lương (construction began 15 Jan 2026)', { pathFrom: 'l2' }),
      seg(['tan-binh', 'an-suong', 'an-ha'], 'planned', 2030, 'Tham Lương – An Hạ (2026-2030 priority list; PPP proposal, alignment indicative)'),
      seg(['an-ha', 'kenh-an-ha', 'tay-bac-cu-chi'], 'planned', 2030, 'Branch 2S An Hạ – Tây Bắc Củ Chi urban area (2026-2030 priority list; alignment indicative)'),
      seg(['thu-thiem', 'ben-xe-song-tac'], 'planned', undefined, 'Eastern extension Thủ Thiêm – Sông Tắc bus terminal (network plan; no schedule)'),
    ],
  },
  {
    id: 'line-3', code: '3', name: 'Line 3', nameLocal: 'Tuyến số 3 (An Hạ – Tao Đàn)', group: 'metro', color: '#fb7d37', mode: 'metro',
    lengthKm: 32.5,
    description: 'An Hạ – Lê Minh Xuân – Tân Kiên – QL1 – Kinh Dương Vương – Hồng Bàng – Hùng Vương – Ngã 6 Cộng Hòa – Nguyễn Thị Minh Khai – Tao Đàn. Formerly Hiệp Bình Phước – An Hạ (45.8 km); its northern part is now covered by the Thủ Dầu Một – Tao Đàn line. On the priority list for completion by 2035; investor proposals under study (Oct 2026). The Oct 2026 draft plan would extend it west to Tây Ninh. Stations are waypoints along the published alignment.',
    sources: ['tienphong-12', 'vi-wiki', 'tuoitre-10', 'voh-10', 'vtc-5', 'dantri-draft', 'wiki-colors'],
    segments: [
      seg(['an-ha', 'le-minh-xuan', 'tan-kien', 'an-lac', 'ben-xe-mien-tay', 'phu-lam', 'phu-dong-thien-vuong', 'hung-vuong', 'nga-sau-cong-hoa', 'tao-dan'], 'planned', 2035, 'An Hạ – Tao Đàn (target 2035)'),
    ],
  },
  {
    id: 'line-4', code: '4', name: 'Line 4', nameLocal: 'Tuyến số 4 (Đông Thạnh – Hiệp Phước)', group: 'metro', color: '#97cf6f', mode: 'metro',
    lengthKm: 47.3,
    description: 'Đông Thạnh – Hà Huy Giáp – Nguyễn Oanh – Nguyễn Kiệm – Tân Sơn Nhất airport – Nguyễn Văn Trỗi – Hai Bà Trưng – Bến Thành – Nguyễn Hữu Thọ – Bà Chiêm bridge – Hiệp Phước (47.3 km). Priority line for 2035; Sovico has studied a ~43 km version via the airport. Southern stations (ST.13–ST.30) follow OSM mapping of that study; northern points are waypoints. The Oct 2026 draft plan would extend it north to Thủ Dầu Một.',
    sources: ['tienphong-12', 'tuoitre-10', 'voh-10', 'vtc-5', 'dantri-draft', 'osm-l2', 'wiki-colors'],
    segments: [
      seg(['dong-thanh', 'ha-huy-giap', 'nguyen-oanh', 'go-vap', 'cong-vien-gia-dinh', 'tan-son-nhat', 'nguyen-van-troi', 'cong-vien-le-van-tam', 'nha-tho-duc-ba', 'ben-thanh', 'cong-vien-khanh-hoi', 'nguyen-thi-thap', 'nguyen-van-linh', 'rach-dia', 'cau-so-1', 'vinh-phuoc', 'kho-b', 'phuoc-kien', 'ba-chiem', 'long-thoi', 'phan-van-bay', 'cong-vien-the-thao', 'trung-tam-hiep-phuoc', 'bau-le', 'hiep-phuoc'], 'planned', 2035, 'Đông Thạnh – Hiệp Phước (target 2035)'),
      seg(['dong-thanh', 'go-dau'], 'proposed', undefined, 'Northern extension to Thủ Dầu Một (Oct 2026 draft network plan, not approved)'),
    ],
  },
  {
    id: 'line-5', code: '5', name: 'Line 5', nameLocal: 'Tuyến số 5 (Hưng Long – Vinhomes Grand Park / Sông Tắc)', group: 'metro', color: '#e690bb', mode: 'metro',
    lengthKm: 53.9,
    description: 'Hưng Long university town – new Cần Giuộc bus station – QL50 – Cao Xuân Dục – Phù Đổng Thiên Vương – Lý Thường Kiệt – Hoàng Văn Thụ – Phan Đăng Lưu – Bạch Đằng – Điện Biên Phủ – Võ Nguyên Giáp – Liên Phường – Long Thuận, then branches to Vinhomes Grand Park and Sông Tắc (53.9 km, Decision 1711). Proposed for deferral to 2036-2045 (Sep 2025 priority review). An Aug 2025 description gives a different alignment (Long Trường – Sài Gòn bridge – Bảy Hiền – Đa Phước), and the Oct 2026 draft keeps only the Hoàng Văn Thụ – Tân Cảng branch; treat the alignment as uncertain.',
    sources: ['tienphong-12', 'vietnamnet-12', 'voh-10', 'dbnd-7', 'dantri-draft', 'wiki-colors'],
    segments: [
      seg(['hung-long', 'ben-xe-can-giuoc', 'binh-hung', 'cao-xuan-duc', 'phu-dong-thien-vuong', 'phu-tho', 'bay-hien', 'hoang-van-thu', 'phan-dang-luu', 'hang-xanh', 'tan-cang', 'rach-chiec', 'lien-phuong', 'long-thuan', 'vinhomes-grand-park'], 'planned', 2045, 'Hưng Long – Vinhomes Grand Park (target 2036-2045)'),
      seg(['long-thuan', 'ben-xe-song-tac'], 'planned', 2045, 'Branch to Sông Tắc bus terminal'),
    ],
  },
  {
    id: 'line-6', code: '6', name: 'Line 6 (Inner Ring)', nameLocal: 'Tuyến số 6 (vành đai trong)', group: 'metro', color: '#c58120', mode: 'metro',
    opened: 2030, lengthKm: 53.8,
    description: 'Inner ring line (53.8 km). Phase 1 Bà Quẹo – Tân Sơn Nhất airport – Gò Vấp – Bình Triệu – Phú Hữu (~23 km, 17 stations ST01–ST17) is one of the 8 lines targeted for 2030; investment preparation under way, construction start planned for end-2026; interchange with the Thủ Thiêm – Long Thành line at Phú Hữu. Phase 2 closes the ring via Võ Chí Công – Tân Thuận – Nguyễn Thị Thập – Tạ Quang Bửu – Nguyễn Văn Luông – Phú Lâm – Lũy Bán Bích – Âu Cơ (priority list for 2035; waypoints only).',
    sources: ['tuoitre-140', 'vtc-5', 'vtc-ttlt', 'hdnd-gantt', 'tienphong-12', 'tuoitre-10', 'osm-l2', 'wiki-colors'],
    segments: [
      seg(L6P1, 'approved', 2030, 'Phase 1 Tân Sơn Nhất (Bà Quẹo) – Phú Hữu (~23 km, target 2030)', { pathFrom: 'l6' }),
      seg(['phu-huu', 'cat-lai', 'tan-thuan', 'nguyen-thi-thap', 'ta-quang-buu', 'nguyen-van-luong', 'phu-lam', 'luy-ban-bich', 'au-co', 'ba-queo'], 'planned', 2035, 'Phase 2 Phú Hữu – Tân Thuận – Phú Lâm – Bà Quẹo (target 2035)'),
    ],
  },
  {
    id: 'line-7', code: '7', name: 'Line 7', nameLocal: 'Tuyến số 7 (Tân Kiên – Long Bình)', group: 'metro', color: '#18bdc1', mode: 'metro',
    lengthKm: 51.2,
    description: 'Tân Kiên – Nguyễn Văn Linh – Bình Hưng Nam – Đào Sư Tích – Phú Mỹ Hưng – Huỳnh Tấn Phát – Trần Bạch Đằng – Trần Não – Thảo Điền – Thanh Đa – Trường Thọ – Rạch Chiếc – High Tech Park (D2) – Vinhomes Grand Park – Long Bình depot (51.2 km). Proposed for deferral to 2036-2045. The Oct 2026 draft plan would extend it north to Biên Hòa and south-west to Tây Ninh.',
    sources: ['tienphong-12', 'voh-10', 'dbnd-7', 'dantri-draft', 'wiki-colors'],
    segments: [
      seg(['tan-kien', 'phong-phu', 'binh-hung-nam', 'dao-su-tich', 'phu-my-hung', 'tran-bach-dang', 'tran-nao', 'thao-dien', 'thanh-da', 'linh-dong', 'rach-chiec', 'd2-cnc', 'vinhomes-grand-park', 'long-binh'], 'planned', 2045, 'Tân Kiên – Long Bình (target 2036-2045)'),
      seg(['long-binh', 'bien-hoa'], 'proposed', undefined, 'Northern extension to Biên Hòa (Oct 2026 draft network plan, not approved)'),
    ],
  },
  {
    id: 'line-8', code: '8', name: 'Line 8', nameLocal: 'Tuyến số 8 (Đa Phước – Bình Mỹ)', group: 'metro', color: '#6566a9', mode: 'metro',
    lengthKm: 42.8,
    description: 'Đa Phước – Chánh Hưng – Phạm Hùng – Ngô Gia Tự – Điện Biên Phủ – Nguyễn Phúc Nguyên – Hòa Hưng (Saigon) railway station – along the national railway – Nguyễn Kiệm – Quang Trung – Quang Trung Software Park – Tô Ký – Tân Chánh Hiệp – Hóc Môn – Bình Mỹ (42.8 km). Part of the 155 km (Lines 8-10) to be added by 2045. The Oct 2026 draft re-uses the number 8 for a new east–west line.',
    sources: ['tienphong-12', 'sggp-355', 'dantri-draft', 'wiki-colors'],
    segments: [
      seg(['da-phuoc', 'pham-hung', 'chanh-hung', 'hung-vuong', 'ly-thai-to', 'hoa-hung', 'go-vap', 'quang-trung', 'cv-phan-mem-quang-trung', 'to-ky', 'tan-chanh-hiep', 'hoc-mon', 'binh-my'], 'planned', 2045, 'Đa Phước – Bình Mỹ (target 2045)'),
    ],
  },
  {
    id: 'line-9', code: '9', name: 'Line 9', nameLocal: 'Tuyến số 9 (Bình Triệu – An Hạ)', group: 'metro', color: '#d36c97', mode: 'metro',
    lengthKm: 28.3,
    description: 'Bình Triệu station – Nơ Trang Long – Lê Văn Duyệt – Võ Thị Sáu – Hòa Hưng railway station – Tô Hiến Thành – Phú Thọ sports centre – Âu Cơ – Tân Kỳ Tân Quý – Hương Lộ 3 – Vĩnh Lộc A – Thanh Niên canal – An Hạ depot (28.3 km). Part of the 155 km (Lines 8-10) to be added by 2045.',
    sources: ['tienphong-12', 'sggp-355', 'wiki-colors'],
    segments: [
      seg(['binh-trieu', 'no-trang-long', 'le-van-duyet', 'cong-vien-le-van-tam', 'hoa-hung', 'to-hien-thanh', 'phu-tho', 'au-co', 'tan-ky-tan-quy', 'huong-lo-3', 'vinh-loc-a', 'an-ha'], 'planned', 2045, 'Bình Triệu – An Hạ (target 2045)'),
    ],
  },
  {
    id: 'line-10', code: '10', name: 'Line 10 (Outer Ring)', nameLocal: 'Tuyến số 10 (vành đai ngoài)', group: 'metro', color: '#6a926d', mode: 'metro',
    lengthKm: 83.9,
    description: 'Outer ring (83.9 km): Thủ Thiêm – Trương Văn Bang – Cát Lái – Tam Đa – Long Phước – High Tech Park (D1) – Linh Trung – QL1 – Ngã tư Bình Phước – An Phú Đông – Vàm Thuật river – 19/5 canal – Tham Lương canal – Mã Lò – Tân Tạo IP – Bình Tân medical zone – Hồ Học Lãm – Trịnh Quang Nghị – Phong Phú – Nhơn Đức – Nguyễn Bình – Đào Trí – Tân Thuận – Thủ Thiêm. Part of the 155 km (Lines 8-10) to be added by 2045. In the Oct 2026 draft its western part becomes a new Line 13.',
    sources: ['tienphong-12', 'sggp-355', 'dantri-draft', 'wiki-colors'],
    segments: [
      seg(['thu-thiem', 'truong-van-bang', 'cat-lai', 'tam-da', 'long-thuan', 'd1-cnc', 'linh-trung', 'linh-xuan', 'nga-tu-binh-phuoc', 'an-phu-dong', 'tan-binh', 'kenh-tham-luong', 'ma-lo', 'kcn-tan-tao', 'an-lac', 'trinh-quang-nghi', 'phong-phu', 'nhon-duc', 'ba-chiem', 'dao-tri', 'tan-thuan', 'thu-thiem'], 'planned', 2045, 'Outer ring loop (target 2045)'),
    ],
  },
  {
    id: 'line-11', code: '11', name: 'Line 11 Riverside Tram', nameLocal: 'Tuyến số 11 (tuyến ven sông, tramway/LRT)', group: 'lrt-tram', color: '#53c5e0', mode: 'tram',
    lengthKm: 48.7,
    description: 'Riverside tram/LRT for tourism: Western Bus Station – Lý Chiêu Hoàng – Võ Văn Kiệt – Mê Linh square – Tôn Đức Thắng – Ba Son – Saigon riverside road – Củ Chi (48.7 km; depot Trung An). In the Decision 1711 network; no schedule.',
    sources: ['tienphong-12', 'vietnamnet-12', 'vi-wiki', 'wiki-colors'],
    segments: [
      seg(['ben-xe-mien-tay', 'ly-chieu-hoang', 'vo-van-kiet-cho-lon', 'cau-ong-lanh', 'me-linh', 'ba-son', 'binh-quoi', 'thanh-loc', 'binh-my', 'trung-an'], 'planned', undefined, 'Western Bus Station – Củ Chi (no schedule)'),
    ],
  },
  {
    id: 'line-12', code: '12', name: 'Ben Thanh – Can Gio Railway', nameLocal: 'Tuyến số 12 / Đường sắt Bến Thành – Cần Giờ', group: 'regional', color: '#d627f5', mode: 'commuter',
    opened: 2028, lengthKm: 54,
    description: 'High-speed (up to 350 km/h) line from 23/9 Park (Bến Thành) along Hoàng Diệu – Nguyễn Văn Linh – Nhà Bè – Bình Khánh to the Cần Giờ coastal reclaimed urban area (54 km). PPP by VinSpeed (Vingroup), ~102,430 bn VND; groundbreaking 19 Dec 2025; operation targeted for 2028. Phase 1 has only 2 stations (Bến Thành, Cần Giờ); 4 intermediate stations may be added later. The Oct 2026 draft envisions a long-term bridge/tunnel link on to Vũng Tàu.',
    sources: ['voh-cangio', 'vtc-5', 'vtc-ttlt', 'vi-wiki', 'dantri-draft', 'wiki-colors'],
    segments: [
      seg(['ben-thanh', 'can-gio'], 'construction', 2028, 'Bến Thành – Cần Giờ (groundbreaking 19 Dec 2025)', { pathFrom: 'cangio' }),
      seg(['can-gio', 'le-hong-phong'], 'proposed', undefined, 'Long-term link Cần Giờ – Vũng Tàu by bridge or undersea tunnel (Oct 2026 draft, not approved)'),
    ],
  },
  {
    id: 'thu-thiem-long-thanh', code: 'LT', name: 'Thu Thiem – Long Thanh Line', nameLocal: 'Đường sắt Thủ Thiêm – Long Thành', group: 'regional', color: '#2e3192', mode: 'metro',
    opened: 2030, lengthKm: 47.7,
    description: 'Airport rail link from Thủ Thiêm along the HCMC – Long Thành – Dầu Giây expressway and Ring Road 3, across the Đồng Nai river and Nhơn Trạch to Long Thành airport (47.7 km; 11.5 km in HCMC, 36.2 km in Đồng Nai; ~18-20 stations). Added to the Resolution 188 project list (Dec 2025); PPP prepared by THACO/Đại Quang Minh, ~134,000-175,000 bn VND; approval expected Nov 2026, construction start end-2026, target 2030. Stations from OSM mapping of the published alignment. Colour chosen for this app (no official colour).',
    sources: ['voh-5', 'vtc-ttlt', 'vtc-5', 'tuoitre-140', 'tuoitre-255', 'osm-l2'],
    segments: [
      seg(['thu-thiem', 'binh-trung', 'do-xuan-hop', 'phu-huu', 'ong-nhieu', 'long-truong', 'thiec-dua', 'long-tan', 'phu-thanh', 'tuy-ha', 'nhon-trach', 'phu-hoi', 'phuoc-thien', 'hiep-phuoc-nhon-trach', 'lt-s16', 'lt-s17', 'lt-s19', 'long-thanh-airport'], 'approved', 2030, 'Thủ Thiêm – Long Thành airport (target 2030)', { pathFrom: 'ttlt' }),
    ],
  },
  {
    id: 'bd-line-1', code: 'B1', name: 'Binh Duong Line 1', nameLocal: 'Tuyến số 1 Bình Dương (TP mới Bình Dương – Suối Tiên)', group: 'regional', color: '#f4b400', mode: 'metro',
    opened: 2030, lengthKm: 32.4,
    description: 'Bình Dương New City – Dĩ An – Suối Tiên, connecting to Line 1 (29 km main line + 3.4 km depot link, 19 elevated stations, depot at Phú Chánh). On the Resolution 188 priority list; ~55,000 bn VND public budget; FS/FEED under preparation, construction start targeted end-2026, among the 8 lines for 2030. Station names not yet published (codes from OSM mapping of the alignment). Colour chosen for this app.',
    sources: ['thanhnien-bd', 'vi-wiki-bd', 'vtc-5', 'tuoitre-140', 'voh-5', 'tuoitre-255'],
    segments: [
      seg([...B1.map((c) => (c === 'S5' ? 'dong-cay-viet' : 'b1-' + c.toLowerCase())), 'ben-xe-suoi-tien'], 'approved', 2030, 'TP mới Bình Dương – Suối Tiên (target 2030)', { pathFrom: 'b1' }),
    ],
  },
  {
    id: 'bd-line-1b', code: 'B1B', name: 'Binh Duong Line 1B', nameLocal: 'Tuyến 1B (Tân Đông Hiệp – Ngã tư Gò Dưa)', group: 'regional', color: '#c99700', mode: 'metro', lengthKm: 7.5,
    description: 'Tân Đông Hiệp – Ngã tư Gò Dưa (7.5 km), former Bình Dương provincial plan. Endpoints only; no schedule. Colour chosen for this app.',
    sources: ['vi-wiki', 'vi-wiki-bd'],
    segments: [seg(['tan-dong-hiep', 'nga-tu-go-dua'], 'planned', undefined, 'Tân Đông Hiệp – Ngã tư Gò Dưa')],
  },
  {
    id: 'bd-line-2', code: 'B2', name: 'Thu Dau Mot – Tao Dan Line', nameLocal: 'Tuyến Thủ Dầu Một – TP.HCM (Đồng Cây Viết – Tao Đàn)', group: 'metro', color: '#00a651', mode: 'metro',
    opened: 2030, lengthKm: 35,
    description: 'Former Bình Dương Line 2, extended ~15.6 km in 2025-2026 from Vĩnh Phú/Hiệp Bình Phước into central HCMC: Đồng Cây Viết (C0, interchange with Line B1 S5) – Thủ Dầu Một – Thuận An – Bình Triệu – Hàng Xanh – Thị Nghè – Notre-Dame – Tao Đàn (C23), ~35 km (~20 km elevated, ~15 km underground), 24 stations. Alignment approved; ~113,000 bn VND public budget; added to the 2026-2030 priority list, construction start targeted end-2026. Stations from OSM mapping of the approved alignment. Colour chosen for this app.',
    sources: ['vtc-5', 'tuoitre-140', 'thanhnien-bd', 'vi-wiki', 'tuoitre-255', 'hdnd-gantt'],
    segments: [
      seg(['dong-cay-viet', ...B2IDS, 'tao-dan'], 'approved', 2030, 'Đồng Cây Viết – Tao Đàn (target 2030)', { pathFrom: 'b2' }),
    ],
  },
  {
    id: 'bd-line-2b', code: 'B2B', name: 'Binh Duong Line 2B', nameLocal: 'Tuyến 2B (Thủ Dầu Một – Thới Hòa)', group: 'regional', color: '#4caf50', mode: 'metro', lengthKm: 6.5,
    description: 'Thủ Dầu Một – Thới Hòa (6.5 km), northward continuation along QL13, former Bình Dương plan. Endpoints only; no schedule. Colour chosen for this app.',
    sources: ['vi-wiki', 'vi-wiki-bd', 'thanhnien-bd'],
    segments: [seg(['dong-cay-viet', 'thoi-hoa'], 'planned', undefined, 'Thủ Dầu Một – Thới Hòa')],
  },
  {
    id: 'bd-line-2c', code: 'B2C', name: 'Binh Duong Line 2C', nameLocal: 'Tuyến 2C (Thủ Dầu Một – Bình Mỹ)', group: 'regional', color: '#2e7d32', mode: 'metro', lengthKm: 9.3,
    description: 'Thủ Dầu Một – Bình Mỹ (Củ Chi) across the Saigon River (9.3 km), former Bình Dương plan. Endpoints only; no schedule. Colour chosen for this app.',
    sources: ['vi-wiki', 'vi-wiki-bd'],
    segments: [seg(['hiep-thanh', 'binh-my'], 'planned', undefined, 'Thủ Dầu Một – Bình Mỹ')],
  },
  {
    id: 'bd-line-3', code: 'B3', name: 'Binh Duong Line 3', nameLocal: 'Tuyến 3 (Bắc Tân Uyên – Tân Uyên – An Bình)', group: 'regional', color: '#8e24aa', mode: 'metro', lengthKm: 29.8,
    description: 'Bắc Tân Uyên – Tân Uyên – An Bình (Dĩ An) (29.8 km), former Bình Dương plan. Intermediate points are indicative localities; no schedule. Colour chosen for this app.',
    sources: ['vi-wiki', 'vi-wiki-bd'],
    segments: [seg(['bac-tan-uyen', 'tan-uyen', 'tan-hiep-bd', 'tan-phuoc-khanh', 'tan-dong-hiep', 'an-binh-di-an'], 'planned', undefined, 'Bắc Tân Uyên – An Bình')],
  },
  {
    id: 'bd-line-3b', code: 'B3B', name: 'Binh Duong Line 3B', nameLocal: 'Tuyến 3B (Thủ Dầu Một – Biên Hòa)', group: 'regional', color: '#ab47bc', mode: 'metro', lengthKm: 16.5,
    description: 'Thủ Dầu Một – Biên Hòa (16.5 km), former Bình Dương plan. Intermediate point indicative; no schedule. Colour chosen for this app.',
    sources: ['vi-wiki', 'vi-wiki-bd'],
    segments: [seg(['go-dau', 'tan-phuoc-khanh', 'bien-hoa'], 'planned', undefined, 'Thủ Dầu Một – Biên Hòa')],
  },
  {
    id: 'bd-line-4', code: 'B4', name: 'Binh Duong Line 4', nameLocal: 'Tuyến 4 (Tân Uyên – TP mới Bình Dương – Tây Nam)', group: 'regional', color: '#795548', mode: 'metro', lengthKm: 32.6,
    description: 'Tân Uyên – Bình Dương New City – Bến Cát – Tây Nam (32.6 km), former Bình Dương plan. Intermediate points indicative; no schedule. Colour chosen for this app.',
    sources: ['vi-wiki', 'vi-wiki-bd'],
    segments: [seg(['tan-uyen', 'b1-s0b', 'thoi-hoa', 'tay-nam'], 'planned', undefined, 'Tân Uyên – Tây Nam')],
  },
  {
    id: 'bd-line-5', code: 'B5', name: 'Binh Duong Line 5', nameLocal: 'Tuyến 5 (Cầu Thủ Biên – Cầu Phú Thuận)', group: 'regional', color: '#607d8b', mode: 'metro', lengthKm: 48.2,
    description: 'East–west line from Thủ Biên bridge (Thường Tân, Đồng Nai river) to Phú Thuận bridge (Phú An, Saigon river), 48.2 km, former Bình Dương plan. Intermediate points indicative; no schedule. Colour chosen for this app.',
    sources: ['vi-wiki', 'vi-wiki-bd'],
    segments: [seg(['cau-thu-bien', 'bach-dang-tu', 'tan-uyen', 'b1-s0b', 'phu-an', 'cau-phu-thuan'], 'planned', undefined, 'Cầu Thủ Biên – Cầu Phú Thuận')],
  },
  {
    id: 'bd-line-6', code: 'B6', name: 'Binh Duong Line 6', nameLocal: 'Tuyến 6 (TP mới Bình Dương – Bàu Bàng)', group: 'regional', color: '#ff7043', mode: 'metro', lengthKm: 26.1,
    description: 'Bình Dương New City – Bàu Bàng (26.1 km), former Bình Dương plan. Intermediate points indicative; no schedule. Colour chosen for this app.',
    sources: ['vi-wiki', 'vi-wiki-bd'],
    segments: [seg(['b1-s0b', 'thoi-hoa', 'ben-cat', 'bau-bang'], 'planned', undefined, 'TP mới Bình Dương – Bàu Bàng')],
  },
  {
    id: 'bd-line-7', code: 'B7', name: 'Binh Duong Line 7', nameLocal: 'Tuyến 7 (Thới Hòa – Dầu Tiếng)', group: 'regional', color: '#9e9d24', mode: 'metro', lengthKm: 45,
    description: 'Thới Hòa – Dầu Tiếng (45 km), former Bình Dương plan. Intermediate points indicative; no schedule. Colour chosen for this app.',
    sources: ['vi-wiki', 'vi-wiki-bd'],
    segments: [seg(['thoi-hoa', 'tay-nam', 'long-nguyen', 'thanh-tuyen', 'dau-tieng'], 'planned', undefined, 'Thới Hòa – Dầu Tiếng')],
  },
  {
    id: 'bd-line-8', code: 'B8', name: 'Binh Duong Line 8', nameLocal: 'Tuyến 8 (Bắc Tân Uyên – Phú Giáo)', group: 'regional', color: '#5d4037', mode: 'metro', lengthKm: 28.6,
    description: 'Bắc Tân Uyên – Phú Giáo (28.6 km), former Bình Dương plan. Intermediate points indicative; no schedule. Colour chosen for this app.',
    sources: ['vi-wiki', 'vi-wiki-bd'],
    segments: [seg(['bac-tan-uyen', 'vinh-tan', 'phuoc-hoa', 'phu-giao'], 'planned', undefined, 'Bắc Tân Uyên – Phú Giáo')],
  },
  {
    id: 'vt-line-3', code: 'V3', name: 'Vung Tau – Ba Ria – Phu My Line', nameLocal: 'Tuyến số 3 Vũng Tàu – Bà Rịa – Phú Mỹ', group: 'regional', color: '#1565c0', mode: 'metro',
    lengthKm: 40,
    description: 'Metro from central Vũng Tàu along QL51 via Bà Rịa to Phú Mỹ (~40 km; former Bà Rịa – Vũng Tàu plan). On the 10-line priority list for completion by 2035; under study by MAUR (Oct 2026). In Jul 2026 MAUR proposed studying an extension to Long Thành airport (~56 km total). No station list published; waypoints indicative. Colour chosen for this app.',
    sources: ['cafeland-vt', 'fsea-brvt', 'tuoitre-10', 'voh-10', 'vtc-5', 'vtc-ttlt'],
    segments: [
      seg(['le-hong-phong', 'rach-dua', 'phuoc-thang', 'ba-ria', 'tan-hai', 'phu-my'], 'planned', 2035, 'Vũng Tàu – Bà Rịa – Phú Mỹ (priority list, by 2035)'),
      seg(['phu-my', 'phuoc-binh', 'long-thanh-airport'], 'proposed', undefined, 'Proposed extension to Long Thành airport (study requested Jul 2026)'),
    ],
  },
  {
    id: 'vt-line-1', code: 'V1', name: 'Vung Tau Coastal Loop', nameLocal: 'Tuyến 1 vòng nội đô Vũng Tàu', group: 'lrt-tram', color: '#00838f', mode: 'monorail',
    lengthKm: 20,
    description: 'Inner-city coastal loop (~20 km): Trần Phú – Lê Lợi – Nguyễn An Ninh – Thùy Vân – Hạ Long – Quang Trung – Trần Phú. The provincial plan proposed two monorail lines and one metro without assigning modes per line; monorail shown here as an assumption. No schedule; waypoints indicative. Colour chosen for this app.',
    sources: ['fsea-brvt', 'tuoitre-10', 'cafeland-vt'],
    segments: [seg(['le-hong-phong', 'bai-sau', 'ha-long-vt', 'bai-truoc', 'le-hong-phong'], 'planned', undefined, 'Vũng Tàu coastal loop')],
  },
  {
    id: 'vt-line-2', code: 'V2', name: 'Vung Tau – Binh Chau Line', nameLocal: 'Tuyến 2 Vũng Tàu – Long Hải – Phước Hải – Bình Châu', group: 'lrt-tram', color: '#26a69a', mode: 'monorail',
    lengthKm: 65,
    description: 'Lê Hồng Phong roundabout – 3/2 and 2/9 roads – Cửa Lấp bridge – coastal road ĐT994 – Long Hải – Phước Hải – Bình Châu (~65 km; former Bà Rịa – Vũng Tàu plan). Mode assumed monorail (see V1). No schedule; waypoints indicative. Colour chosen for this app.',
    sources: ['fsea-brvt', 'tuoitre-10', 'cafeland-vt'],
    segments: [seg(['le-hong-phong', 'chi-linh', 'phuoc-thang', 'long-hai', 'phuoc-hai', 'loc-an', 'ho-tram', 'ho-coc', 'binh-chau'], 'planned', undefined, 'Vũng Tàu – Bình Châu')],
  },
];

// ---------------------------------------------------------------------------
// OSM geometry
// ---------------------------------------------------------------------------
const stationsJson = cache('stations');
const nodeById = new Map(stationsJson.elements.map((e) => [e.id, e]));
for (const s of Object.values(ST)) {
  if (typeof s.coord === 'number') {
    const n = nodeById.get(s.coord);
    if (!n) throw new Error(`OSM node ${s.coord} for ${s.id} not in cache`);
    s.osm = s.coord;
    s.coord = [n.lon, n.lat];
    if (s.approx === undefined) s.approx = false;
  } else if (s.approx === undefined) s.approx = true;
}

const railWays = cache('rail-ways').elements;
const line1Ways = cache('line1').elements.filter((e) => e.type === 'way');
const WAYSETS = {
  line1: line1Ways,
  l2: railWays.filter((w) => w.tags?.construction === 'subway' && /số 2|Tuyến 2/.test(w.tags?.name ?? '')),
  l6: railWays.filter((w) => /Tuyến 6/.test(w.tags?.name ?? '')),
  ttlt: railWays.filter((w) => /Thủ Thiêm-Long Thành/.test(w.tags?.name ?? '')),
  cangio: railWays.filter((w) => /Cần Giờ|Cầu Giờ/.test(w.tags?.name ?? '') || w.tags?.name === 'Đ' || (w.tags?.railway === 'proposed' && !w.tags?.name && w.geometry[0].lat < 10.75 && w.geometry[0].lon < 106.73 && w.geometry[0].lon > 106.71)),
  b1: railWays.filter((w) => /Suối Tiên - Thành phố mới Bình Dương/.test(w.tags?.name ?? '')),
  b2: railWays.filter((w) => /Thủ Dầu Một - Tao Đàn/.test(w.tags?.name ?? '')),
};

function buildGraph(ways) {
  const key = (p) => `${p.lon.toFixed(7)},${p.lat.toFixed(7)}`;
  const nodes = new Map(); // key -> {c, adj: Map}
  const get = (p) => {
    const k = key(p);
    if (!nodes.has(k)) nodes.set(k, { k, c: [p.lon, p.lat], adj: new Map() });
    return nodes.get(k);
  };
  const link = (a, b, w) => {
    if (a === b) return;
    if (!a.adj.has(b.k) || a.adj.get(b.k) > w) a.adj.set(b.k, w);
    if (!b.adj.has(a.k) || b.adj.get(a.k) > w) b.adj.set(a.k, w);
  };
  const ends = [];
  const wayOf = new Map();
  for (const w of ways) {
    const g = w.geometry;
    for (let i = 1; i < g.length; i++) {
      const a = get(g[i - 1]), b = get(g[i]);
      link(a, b, haversineKm(a.c, b.c));
    }
    for (const p of g) wayOf.set(key(p), w.id);
    ends.push(get(g[0]), get(g[g.length - 1]));
  }
  const all = [...nodes.values()];
  // Parallel tracks are mapped as separate ways: allow switching between ways at nodes < 40 m apart.
  for (let i = 0; i < all.length; i++)
    for (let j = i + 1; j < all.length; j++) {
      if (wayOf.get(all[i].k) === wayOf.get(all[j].k)) continue;
      const d = haversineKm(all[i].c, all[j].c);
      if (d < 0.04) link(all[i], all[j], d * 1.5);
    }
  // Bridge small gaps between ways (mapping gaps): endpoint -> nearest node of another way within 600 m.
  for (const e of ends) {
    let best = null, bd = 0.6;
    for (const n of all) {
      if (n === e || e.adj.has(n.k)) continue;
      const d = haversineKm(e.c, n.c);
      if (d < bd && d > 0) { bd = d; best = n; }
    }
    if (best) link(e, best, bd * 2);
  }
  return nodes;
}

function nearest(nodes, c) {
  let best = null, bd = Infinity;
  for (const n of nodes.values()) {
    const d = haversineKm(n.c, c);
    if (d < bd) { bd = d; best = n; }
  }
  return [best, bd];
}

function dijkstra(nodes, src, dst) {
  const dist = new Map([[src.k, 0]]);
  const prev = new Map();
  const done = new Set();
  // simple binary heap
  const heap = [[0, src.k]];
  const push = (x) => { heap.push(x); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  while (heap.length) {
    const [d, k] = pop();
    if (done.has(k)) continue;
    done.add(k);
    if (k === dst.k) break;
    for (const [nk, w] of nodes.get(k).adj) {
      const nd = d + w;
      if (nd < (dist.get(nk) ?? Infinity)) { dist.set(nk, nd); prev.set(nk, k); push([nd, nk]); }
    }
  }
  if (!done.has(dst.k)) return null;
  const out = [];
  for (let k = dst.k; k; k = prev.get(k)) { out.push(nodes.get(k).c); if (k === src.k) break; }
  return out.reverse();
}

function pathFor(setName, stationIds) {
  const nodes = buildGraph(WAYSETS[setName]);
  let path = [];
  const anchors = stationIds.map((id) => {
    const [n, d] = nearest(nodes, ST[id].coord);
    if (d > 1.2) console.warn(`  path ${setName}: station ${id} is ${d.toFixed(2)} km from track`);
    return n;
  });
  for (let i = 1; i < anchors.length; i++) {
    const p = dijkstra(nodes, anchors[i - 1], anchors[i]);
    if (!p) { console.warn(`  path ${setName}: no route ${stationIds[i - 1]} -> ${stationIds[i]}`); return undefined; }
    path = path.length ? path.concat(p.slice(1)) : p;
  }
  return simplify(path, 15).map(round5);
}

// ---------------------------------------------------------------------------
// Assemble
// ---------------------------------------------------------------------------
const used = new Set();
const lines = LINES.map((l) => {
  const segments = l.segments.map((s) => {
    for (const id of s.stations) { if (!ST[id]) throw new Error(`${l.id}: unknown station ${id}`); used.add(id); }
    const out = { stations: s.stations, status: s.status };
    if (s.year !== undefined) out.year = s.year;
    if (s.label) out.label = s.label;
    if (s.pathFrom) {
      const p = pathFor(s.pathFrom, s.stations);
      if (p) out.path = p;
    }
    return out;
  });
  const { segments: _, ...rest } = l;
  const status = ['operating', 'construction', 'approved', 'planned', 'proposed'].find((st) => segments.some((x) => x.status === st));
  const { id, code, name, nameLocal, group, color, mode, opened, lengthKm, description, sources } = rest;
  return { id, code, name, nameLocal, group, color, mode, status, opened, lengthKm, description, segments, sources };
});
for (const id of Object.keys(ST)) if (!used.has(id)) console.warn('unused station', id);

const stations = Object.values(ST).map((s) => {
  const o = { id: s.id, name: s.name, nameLocal: s.nameLocal, coord: round5(s.coord) };
  if (s.approx) o.approx = true;
  if (s.codes) o.codes = s.codes;
  return o;
});

const data = {
  id: 'hcmc',
  name: 'Ho Chi Minh City',
  nameLocal: 'TP. Hồ Chí Minh',
  center: [106.7, 10.8],
  zoom: 10,
  updated: ACCESSED,
  timeline: { min: 2024, max: 2050 },
  groups: GROUPS,
  lines,
  stations,
  sources: SOURCES.map(([id, title, url]) => ({ id, title, url, accessed: ACCESSED })),
  notes: [
    'Network as of November 2026. Only Line 1 (Bến Thành – Suối Tiên, opened 22 Dec 2024) is in service. Under construction: Line 2 Bến Thành – Tham Lương (since 15 Jan 2026) and Bến Thành – Thủ Thiêm (since 29 Apr 2026), both targeted for 2030, and the Bến Thành – Cần Giờ railway (groundbreaking 19 Dec 2025, target 2028).',
    'Status "approved" is used for lines on the Resolution 188/2025/QH15 project list or with an approved investment policy whose preparation is funded (Thủ Thiêm – Long Thành, Bình Dương Line 1, Thủ Dầu Một – Tao Đàn, Line 6 phase 1, Line 1 extension to Long Thành airport); several still await formal feasibility approval, with construction starts announced for end-2026.',
    'Planned lines follow the approved network: Decision 1711/QĐ-TTg (31 Dec 2024) for the former HCMC (Lines 1-12), plus the former Bình Dương (12 lines, ~305 km) and Bà Rịa – Vũng Tàu (3 lines, ~125 km) provincial plans, about 27 lines and ~1,012 km after the 1 July 2025 merger. Target years come from the city programme: ~255 km in 8 lines by 2030, ~532 km by 2035 (the 7-line, 355 km project of Dec 2024 was later enlarged), Lines 5 and 7 deferred to 2036-2045, and Lines 8-10 (155 km) by 2045. Lines without a year have no published schedule.',
    'A draft 100-year network plan (consultant ARUP, reported Oct 2026) proposes ~1,540-1,555 km (about 1,100 km metro and 440-460 km LRT by 2050 and beyond) and renumbers several lines; it is not approved, so only a few of its extensions are shown, as "proposed".',
    'Station positions: operating and under-construction stations come from OpenStreetMap. Stations of approved lines come from OSM volunteer mapping of published alignment drawings and may shift. For lines without a published station list, the points are waypoints named after the roads or places in the plan text (marked approximate), not official stations. Long-distance lines show straight segments between these waypoints.',
    'Line colours: Line 1 and 2 and the numbered lines use the colours of OSM / Wikipedia; there is no published official palette for future lines. Other colours were chosen for this app.',
    'National and inter-regional railways (North–South high-speed rail, HCMC – Cần Thơ, Biên Hòa – Vũng Tàu, HCMC – Tây Ninh / Lộc Ninh) are out of scope.',
  ].join(' '),
};

const outFile = new URL('../../public/data/hcmc.json', import.meta.url);
writeFileSync(outFile, JSON.stringify(data) + '\n');
console.log(`wrote hcmc.json: ${lines.length} lines, ${stations.length} stations, ${(JSON.stringify(data).length / 1024).toFixed(0)} KB`);
