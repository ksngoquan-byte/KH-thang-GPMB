function chayToMau() {
  try {
    const ss = layBangTinhDangMo_();
    const config = docCauHinh_(ss);
    const dsSheetThang = layDanhSachSheetThang_(ss, config);

    let tongSoSheet = 0;
    let tongSoDongCon = 0;
    let tongSoDongTong = 0;
    let tongSoLoi = 0;

    dsSheetThang.forEach(function(sheet) {
      try {
        const ketQua = toMauSheetThang_(sheet);
        tongSoSheet++;
        tongSoDongCon += ketQua.soDongCon;
        tongSoDongTong += ketQua.soDongTong;
      } catch (err) {
        tongSoLoi++;
        Logger.log('Lỗi sheet %s: %s', sheet.getName(), err.stack || err);
      }
    });

    Logger.log(
      'Hoàn tất tô màu | sheet: %s | hàng con: %s | hàng tổng: %s | lỗi: %s',
      tongSoSheet,
      tongSoDongCon,
      tongSoDongTong,
      tongSoLoi
    );
  } catch (error) {
    Logger.log('Lỗi chayToMau: %s', error.stack || error);
    throw error;
  }
}

function toMauSheetThang_(sheet) {
  const dongCuoi = sheet.getLastRow();
  const cotCuoi = Math.min(sheet.getLastColumn(), 16); // A:P

  const COT_KE_HOACH_BD = 1;   // A
  const COT_KE_HOACH_KT = 10;  // J
  const COT_DANH_GIA_BD = 11;  // K
  const COT_DANH_GIA_KT = 16;  // P

  const MAU_KE_HOACH = '#D9EAF7';   // xanh nhạt
  const MAU_DANH_GIA = '#FFF2CC';   // vàng nhạt
  const MAU_HANG_TONG = '#1F4E78';  // xanh đậm
  const MAU_CHU_HANG_TONG = '#FFFFFF';

  if (dongCuoi < 1 || cotCuoi < 1) {
    return { soDongCon: 0, soDongTong: 0 };
  }

  const range = sheet.getRange(1, 1, dongCuoi, cotCuoi);
  const values = range.getDisplayValues();
  const backgrounds = range.getBackgrounds();
  const fontColors = range.getFontColors();

  let soDongCon = 0;
  let soDongTong = 0;

  const dsDongTieuDeNhom = [];

  for (let r = 0; r < values.length; r++) {
    const giaTriA = String(values[r][0] || '').trim();
    const giaTriB = String(values[r][1] || '').trim();

    if (laDongTieuDeNhom_(giaTriA, giaTriB)) {
      dsDongTieuDeNhom.push(r);
    }
  }

  if (dsDongTieuDeNhom.length === 0) {
    Logger.log('Sheet %s: không tìm thấy dòng tiêu đề nhóm', sheet.getName());
    return { soDongCon: 0, soDongTong: 0 };
  }

  for (let i = 0; i < dsDongTieuDeNhom.length; i++) {
    const dongTieuDe = dsDongTieuDeNhom[i];
    const dongBatDau = dongTieuDe + 1;
    const dongKetThuc = (i < dsDongTieuDeNhom.length - 1)
      ? dsDongTieuDeNhom[i + 1] - 1
      : values.length - 1;

    for (let r = dongBatDau; r <= dongKetThuc; r++) {
      const giaTriA = String(values[r][0] || '').trim();

      // Hàng tổng
      if (laDongTong_(giaTriA)) {
        for (let c = 0; c < cotCuoi; c++) {
          backgrounds[r][c] = MAU_HANG_TONG;
          fontColors[r][c] = MAU_CHU_HANG_TONG;
        }
        soDongTong++;
        continue;
      }

      // Tất cả hàng còn lại trong nhóm đều tô theo 2 khối
      for (let c = COT_KE_HOACH_BD - 1; c <= COT_KE_HOACH_KT - 1 && c < cotCuoi; c++) {
        backgrounds[r][c] = MAU_KE_HOACH;
      }

      for (let c = COT_DANH_GIA_BD - 1; c <= COT_DANH_GIA_KT - 1 && c < cotCuoi; c++) {
        backgrounds[r][c] = MAU_DANH_GIA;
      }

      soDongCon++;
    }
  }

  range.setBackgrounds(backgrounds);
  range.setFontColors(fontColors);

  Logger.log(
    'Sheet %s | hàng con: %s | hàng tổng: %s | nhóm: %s',
    sheet.getName(),
    soDongCon,
    soDongTong,
    dsDongTieuDeNhom.length
  );

  return {
    soDongCon: soDongCon,
    soDongTong: soDongTong
  };
}

function laDongTieuDeNhom_(giaTriA, giaTriB) {
  const a = String(giaTriA || '').trim();
  const b = String(giaTriB || '').trim();
  return /^(I|II|III|IV|V|VI|VII|VIII|IX|X)$/i.test(a) && b !== '';
}

function laDongTong_(giaTriA) {
  return String(giaTriA || '').trim() === '∑';
}
