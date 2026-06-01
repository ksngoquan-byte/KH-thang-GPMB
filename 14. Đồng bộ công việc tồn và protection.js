// Moved out of 2.Chính.js to reduce file size while keeping public entrypoints unchanged.

function laSheetThangDongBo_(sheet, config) {
  const system = laySystemConfig_(config);
  const regexText = layMonthSheetRegexText_(system);
  const excludeSheets = layDanhSachSheetLoaiTru_(system);
  const monthSheetCode = String(system.month_sheet_code || '').trim();
  const tenSheet = sheet.getName();

  if (!regexText) return false;
  if (excludeSheets.includes(tenSheet)) return false;
  if (!new RegExp(regexText).test(tenSheet)) return false;

  if (!monthSheetCode) {
    return true;
  }

  const regexTheoMaSheet = taoRegexSheetThangTheoMa_(monthSheetCode);

  return regexTheoMaSheet.test(tenSheet);
}

function taoRegexSheetThangTheoMa_(monthSheetCode) {
  const monthSheetCodeDaEscape = String(monthSheetCode || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    '^' + monthSheetCodeDaEscape + '\\s*[-–]\\s*T(0[1-9]|1[0-2])\\.\\d{4}$'
  );
}

const DONG_BAT_DAU_DONG_BO_CONG_VIEC_TON_ = 6;
const KHOA_BATCH_DONG_BO_CONG_VIEC_TON_TIMEOUT_MS_ = 30000;
const DEVELOPER_METADATA_KEY_CONG_VIEC_TON_ = 'AUTO_CONG_VIEC_TON_MARKER';
const DS_MA_NHOM_LA_MA_MAC_DINH_ = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

function khoaDongBoCongViecTon_(timeoutMs) {
  const lock = LockService.getDocumentLock();
  const thoiGianCho = Math.max(Number(timeoutMs || KHOA_BATCH_DONG_BO_CONG_VIEC_TON_TIMEOUT_MS_), 0);
  return lock.tryLock(thoiGianCho) ? lock : null;
}

function dongBoToanBoCongViecTonCuaSheetHienTai() {
  try {
    const lock = khoaDongBoCongViecTon_(KHOA_BATCH_DONG_BO_CONG_VIEC_TON_TIMEOUT_MS_);
    if (!lock) {
      throw new Error('Không lấy được lock để đồng bộ toàn bộ công việc tồn. Có thể đang có một lần chạy khác, hãy đợi khoảng 10-30 giây rồi chạy lại.');
    }

    try {
      const ss = layBangTinhDangMo_();
      const sheetNguon = ss.getActiveSheet();
      const config = docCauHinh_(ss);
      const tapTrangThaiCongViecTon = layTapTrangThaiCongViecTon_(ss, config);

      if (!laSheetThangDongBo_(sheetNguon, config)) {
        throw new Error('Sheet đang mở không phải sheet tháng hợp lệ để đồng bộ công việc tồn.');
      }

      const sheetDich = laySheetThangKeTiep_(ss, sheetNguon, config);
      if (!sheetDich) {
        throw new Error('Không tìm thấy sheet tháng kế tiếp cho ' + sheetNguon.getName());
      }

      yeuCauDongBoTrongKyBaoCaoKeHoach_(sheetNguon, sheetDich);

      if (!xacNhanDongBoCongViecTonThuCong_(sheetNguon, sheetDich)) {
        Logger.log('BO_QUA dongBoToanBoCongViecTonCuaSheetHienTai | nguoi_dung_huy_xac_nhan');
        return {
          sheetNguon: sheetNguon.getName(),
          sheetDich: sheetDich.getName(),
          tongNhom: 0,
          tongViecTon: 0,
          tongDongGhi: 0,
          tongDongXoa: 0,
          tongDongChenMoi: 0,
          tongBoQua: 0,
          chiTietNhom: [],
          daHuy: true
        };
      }

      const ketQuaTongHop = dongBoToanBoCongViecTonGiuaHaiSheet_(
        sheetNguon,
        sheetDich,
        config,
        tapTrangThaiCongViecTon
      );

      Logger.log(
        'Đồng bộ toàn bộ công việc tồn xong | nguon=%s | dich=%s | nhóm=%s | việc tồn=%s | dòng ghi=%s | dòng xóa=%s | dòng chèn=%s | bỏ qua=%s',
        ketQuaTongHop.sheetNguon,
        ketQuaTongHop.sheetDich,
        ketQuaTongHop.tongNhom,
        ketQuaTongHop.tongViecTon,
        ketQuaTongHop.tongDongGhi,
        ketQuaTongHop.tongDongXoa,
        ketQuaTongHop.tongDongChenMoi,
        ketQuaTongHop.tongBoQua
      );

      ss.toast(
        'Đã đồng bộ việc tồn từ ' + ketQuaTongHop.sheetNguon + ' sang ' + ketQuaTongHop.sheetDich,
        'Công việc tồn',
        5
      );

      return ketQuaTongHop;
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    Logger.log('Lỗi dongBoToanBoCongViecTonCuaSheetHienTai: %s', error.stack || error);
    throw error;
  }
}

function yeuCauDongBoTrongKyBaoCaoKeHoach_(sheetNguon, sheetDich) {
  const thongTinNguon = layThongTinThangTuTenSheet_(sheetNguon.getName());
  const thongTinDich = layThongTinThangTuTenSheet_(sheetDich.getName());
  if (!thongTinNguon || !thongTinDich) {
    throw new Error('Không đọc được thông tin tháng từ tên sheet để kiểm tra kỳ báo cáo/kế hoạch.');
  }

  const now = new Date();
  const hanKhoa = taoNgayGio_(thongTinDich.nam, thongTinDich.thang, 2, 18, 0, 0);
  if (now.getTime() >= hanKhoa.getTime()) {
    throw new Error(
      'Đã quá hạn đồng bộ công việc tồn. Hạn cho phép là trước 18:00 ngày 02/' +
      ('0' + thongTinDich.thang).slice(-2) + '/' + thongTinDich.nam
    );
  }

  const laLienKe =
    (thongTinNguon.nam === thongTinDich.nam && thongTinNguon.thang + 1 === thongTinDich.thang) ||
    (thongTinNguon.nam + 1 === thongTinDich.nam && thongTinNguon.thang === 12 && thongTinDich.thang === 1);

  if (!laLienKe) {
    throw new Error(
      'Chỉ được đồng bộ từ sheet tháng n sang đúng sheet tháng n+1, nhưng bạn đang chọn ' +
      sheetNguon.getName() + ' -> ' + sheetDich.getName()
    );
  }
}

function xacNhanDongBoCongViecTonThuCong_(sheetNguon, sheetDich) {
  const ui = SpreadsheetApp.getUi();
  const thongTinDich = layThongTinThangTuTenSheet_(sheetDich.getName());
  const hanText = thongTinDich
    ? '18:00 ngày 02/' + ('0' + thongTinDich.thang).slice(-2) + '/' + thongTinDich.nam
    : '18:00 ngày 02 của tháng đích';
  const nutBam = ui.alert(
    'Xác nhận đồng bộ việc tồn',
    'Đồng bộ công việc tồn từ "' + sheetNguon.getName() + '" sang "' + sheetDich.getName() + '"?\nHạn cho phép: trước ' + hanText + '.',
    ui.ButtonSet.OK_CANCEL
  );
  return nutBam === ui.Button.OK;
}

function dongBoToanBoCongViecTonGiuaHaiSheet_(sheetNguon, sheetDich, config, tapTrangThaiCongViecTon) {
  const banDoNguon = layBanDoCongViecTonTheoTenDuAn_(sheetNguon, config, tapTrangThaiCongViecTon);
  const banDoDich = layBanDoDuAnLaMaTheoTen_(sheetDich, config);
  const dsKeyNguon = Object.keys(banDoNguon);
  const dsKeyAuto = layDanhSachKeyDuAnCoDongAuto_(sheetDich, config);
  const dsKeyDongBo = hopNhatKeyDuAnDongBoTheoThuTuDich_(dsKeyNguon, dsKeyAuto, banDoDich);
  const dsThieuDuAn = dsKeyNguon.filter(function(key) {
    return (banDoNguon[key] || []).length > 0 && !banDoDich[key];
  });

  if (dsThieuDuAn.length) {
    throw new Error(
      'Không thể đồng bộ việc tồn vì sheet tháng sau thiếu dòng dự án/nhóm trùng tên tại cột B:\n- ' +
      dsThieuDuAn.map(function(key) {
        return banDoNguon[key][0].tenDuAnNguon;
      }).join('\n- ')
    );
  }

  const ketQuaTongHop = {
    sheetNguon: sheetNguon.getName(),
    sheetDich: sheetDich.getName(),
    tongNhom: dsKeyDongBo.length,
    tongViecTon: 0,
    tongDongGhi: 0,
    tongDongXoa: 0,
    tongDongChenMoi: 0,
    tongBoQua: 0,
    chiTietNhom: []
  };

  dsKeyDongBo
    .sort(function(a, b) {
      const dongA = banDoDich[a] ? banDoDich[a].dongChenMoi : 0;
      const dongB = banDoDich[b] ? banDoDich[b].dongChenMoi : 0;
      return dongB - dongA;
    })
    .forEach(function(keyDuAn) {
      const ketQuaDuAn = dongBoMotDuAnSangThangSau_(
        sheetNguon,
        sheetDich,
        keyDuAn,
        banDoNguon[keyDuAn] || [],
        banDoDich[keyDuAn]
      );
      ketQuaTongHop.tongViecTon += ketQuaDuAn.tongViecTon;
      ketQuaTongHop.tongDongGhi += ketQuaDuAn.soDongGhi;
      ketQuaTongHop.tongDongXoa += ketQuaDuAn.soDongXoa;
      ketQuaTongHop.tongDongChenMoi += ketQuaDuAn.soDongChenMoi;
      ketQuaTongHop.tongBoQua += ketQuaDuAn.soDongBoQua;
      ketQuaTongHop.chiTietNhom.push(ketQuaDuAn);
    });

  return ketQuaTongHop;
}

function dongBoMotNhomSangThangSau_(sheetNguon, sheetDich, maNhom, dsCongViecTonCoSan, config, tapTrangThaiCongViecTon) {
  const dsCongViecTon = Array.isArray(dsCongViecTonCoSan) ? dsCongViecTonCoSan : [];
  const ketQuaTongHop = {
    maNhom: maNhom,
    sheetNguon: sheetNguon.getName(),
    sheetDich: sheetDich.getName(),
    tongViecTon: dsCongViecTon.length,
    soDongGhi: 0,
    soDongXoa: 0,
    soDongChenMoi: 0,
    soDongBoQua: 0
  };

  const thongTinNhom = layThongTinNhomTrongSheet_(sheetDich, maNhom);
  if (!thongTinNhom) {
    ketQuaTongHop.soDongBoQua = dsCongViecTon.length;
    return ketQuaTongHop;
  }

  const phanTichNhom = phanTichDongConTrongNhomDeDongBo_(sheetDich, thongTinNhom);
  const dsDongAutoDaXoa = xoaDongBoCuTrongNhom_(sheetDich, phanTichNhom.dsDongAuto);
  ketQuaTongHop.soDongXoa = dsDongAutoDaXoa.length;

  if (!dsCongViecTon.length) {
    return ketQuaTongHop;
  }

  let dsDongTrong = phanTichNhom.dsDongTrong.slice();

  dsCongViecTon.forEach(function(item) {
    let dongDich = dsDongTrong.shift() || 0;

    if (!dongDich) {
      dongDich = chenThemDongTrongCuoiNhom_(sheetDich, thongTinNhom);
      if (dongDich) {
        ketQuaTongHop.soDongChenMoi++;
      }
    }

    if (!dongDich) {
      ketQuaTongHop.soDongBoQua++;
      return;
    }

    const marker = taoMarkerCongViecTon_(sheetNguon.getName(), item.soDongNguon, maNhom);
    ghiCongViecTonVaoDong_(sheetDich, dongDich, item, marker);
    ketQuaTongHop.soDongGhi++;
  });

  return ketQuaTongHop;
}

function phanTichDongConTrongNhomDeDongBo_(sheet, thongTinNhom) {
  if (thongTinNhom.dongKetThucDuLieu < thongTinNhom.dongBatDauDuLieu) {
    return { dsDongCon: [], dsDongTrong: [], dsDongAuto: [] };
  }

  const soDong = thongTinNhom.dongKetThucDuLieu - thongTinNhom.dongBatDauDuLieu + 1;
  const values = sheet.getRange(thongTinNhom.dongBatDauDuLieu, 1, soDong, 9).getDisplayValues();
  const ketQua = {
    dsDongCon: [],
    dsDongTrong: [],
    dsDongAuto: []
  };

  for (let i = 0; i < values.length; i++) {
    const soDongHienTai = thongTinNhom.dongBatDauDuLieu + i;
    const giaTriA = String(values[i][0] || '').trim();
    const giaTriB = String(values[i][1] || '').trim();
    const giaTriC = String(values[i][2] || '').trim();
    const giaTriH = String(values[i][7] || '').trim();
    const giaTriI = String(values[i][8] || '').trim();

    if (!laMaCongViecPhanCapDongBo_(giaTriA)) continue;

    ketQua.dsDongCon.push(soDongHienTai);

    const laAuto = !!layMarkerCongViecTonTheoDong_(sheet, soDongHienTai);
    const laTrongBCHI = giaTriB === '' && giaTriC === '' && giaTriH === '' && giaTriI === '';

    if (laAuto) {
      ketQua.dsDongAuto.push(soDongHienTai);
    }

    if (laTrongBCHI || laAuto) {
      ketQua.dsDongTrong.push(soDongHienTai);
    }
  }

  return ketQua;
}

function layBanDoCongViecTonTheoNhom_(sheet, config, tapTrangThaiCongViecTon) {
  const dongCuoi = sheet.getLastRow();
  const cotCuoi = Math.max(sheet.getLastColumn(), 16);
  if (dongCuoi < 6) return {};

  const displayValues = sheet.getRange(1, 1, dongCuoi, cotCuoi).getDisplayValues();
  const rawValues = sheet.getRange(1, 1, dongCuoi, cotCuoi).getValues();
  const dongBatDauQuet = layDongBatDauQuetNhomDongBo_(sheet);
  const ketQua = {};
  let maNhomHienTai = '';

  for (let r = dongBatDauQuet - 1; r < displayValues.length; r++) {
    const soDong = r + 1;
    const giaTriA = String(displayValues[r][0] || '').trim();
    const giaTriB = String(displayValues[r][1] || '').trim();
    const giaTriC = String(displayValues[r][2] || '').trim();
    const giaTriH = String(displayValues[r][7] || '').trim();
    const giaTriI = String(displayValues[r][8] || '').trim();
    const giaTriN = String(rawValues[r][13] || '').trim();

    if (laDongTieuDeNhomDongBo_(giaTriA, giaTriB)) {
      maNhomHienTai = giaTriA;
      continue;
    }

    if (laDongTongDongBo_(giaTriA)) break;
    if (!maNhomHienTai) continue;
    if (!laDongCongViecConDongBo_(giaTriA, giaTriB, giaTriC)) continue;
    if (!laTrangThaiCongViecTon_(giaTriN, tapTrangThaiCongViecTon)) continue;

    if (!ketQua[maNhomHienTai]) {
      ketQua[maNhomHienTai] = [];
    }

    ketQua[maNhomHienTai].push({
      soDongNguon: soDong,
      giaTriA: giaTriA,
      giaTriB: giaTriB,
      giaTriC: giaTriC,
      giaTriH: giaTriH,
      giaTriI: giaTriI,
      giaTriN: giaTriN
    });
  }

  return ketQua;
}

function layThongTinCongViecTaiDong_(sheet, soDong) {
  const range = sheet.getRange(soDong, 1, 1, Math.max(sheet.getLastColumn(), 16));
  const displayValues = range.getDisplayValues()[0];
  const rawValues = range.getValues()[0];
  const giaTriA = String(displayValues[0] || '').trim();
  const giaTriB = String(displayValues[1] || '').trim();
  const giaTriC = String(displayValues[2] || '').trim();

  return {
    soDongNguon: soDong,
    laDongCongViecCon: laDongCongViecConDongBo_(giaTriA, giaTriB, giaTriC),
    giaTriA: giaTriA,
    giaTriB: giaTriB,
    giaTriC: giaTriC,
    giaTriH: String(displayValues[7] || '').trim(),
    giaTriI: String(displayValues[8] || '').trim(),
    giaTriN: String(rawValues[13] || '').trim()
  };
}

function xoaDongBoCuTrongNhom_(sheet, dsDongCon) {
  const dsDongDaXoa = [];

  dsDongCon.forEach(function(soDong) {
    const laAuto = !!layMarkerCongViecTonTheoDong_(sheet, soDong);

    if (laAuto) {
      xoaGiaTriCongViecTonTaiDong_(sheet, soDong);
      xoaMarkerCongViecTonTheoDong_(sheet, soDong);
      dsDongDaXoa.push(soDong);
    }
  });

  return dsDongDaXoa;
}

function xoaDongCongViecTonTaiDong_(sheet, soDong) {
  xoaGiaTriCongViecTonTaiDong_(sheet, soDong);
  xoaMarkerCongViecTonTheoDong_(sheet, soDong);
}

function timMaNhomTheoDong_(sheet, soDongCanTim) {
  if (soDongCanTim < 6) return '';

  const duLieuAB = sheet.getRange(1, 1, soDongCanTim, 2).getDisplayValues();

  for (let i = soDongCanTim - 1; i >= 0; i--) {
    const giaTriA = String(duLieuAB[i][0] || '').trim();
    const giaTriB = String(duLieuAB[i][1] || '').trim();

    if (laDongTieuDeNhomDongBo_(giaTriA, giaTriB)) {
      return giaTriA;
    }
  }

  return '';
}

function laySheetThangKeTiep_(ss, sheetHienTai, config) {
  const dsSheetThang = layDanhSachSheetThang_(ss, config);
  const tenSheetHienTai = sheetHienTai.getName();

  for (let i = 0; i < dsSheetThang.length; i++) {
    if (dsSheetThang[i].getName() === tenSheetHienTai) {
      return i < dsSheetThang.length - 1 ? dsSheetThang[i + 1] : null;
    }
  }

  return null;
}

function taoMarkerCongViecTon_(tenSheetNguon, soDongNguon, maNhom) {
  return '__AUTO_CONG_VIEC_TON__|tu=' + tenSheetNguon + '|dong=' + soDongNguon + '|nhom=' + maNhom;
}

function laDongTieuDeNhomDongBo_(giaTriA, giaTriB) {
  const a = String(giaTriA || '').trim();
  const b = String(giaTriB || '').trim();

  return DS_MA_NHOM_LA_MA_MAC_DINH_.indexOf(a) !== -1 && b !== '';
}

function laDongTongDongBo_(giaTriA) {
  const a = String(giaTriA || '').trim();
  return a === '∑' || a === 'Σ';
}

function laDongCongViecConDongBo_(giaTriA, giaTriB, giaTriC) {
  const a = String(giaTriA || '').trim();
  const b = String(giaTriB || '').trim();
  const c = String(giaTriC || '').trim();

  if (!laMaCongViecPhanCapDongBo_(a)) return false;
  if (b === '' && c === '') return false;

  return true;
}

function laMaCongViecPhanCapDongBo_(giaTriA) {
  const a = String(giaTriA || '').trim();
  return /^\d+(?:\.\d+){0,3}$/.test(a);
}

function layThongTinNhomTrongSheet_(sheet, maNhomCanTim) {
  const dongCuoi = sheet.getLastRow();
  const cotCuoi = Math.max(sheet.getLastColumn(), 16);
  if (dongCuoi < 6) return null;

  const values = sheet.getRange(1, 1, dongCuoi, cotCuoi).getDisplayValues();
  const dongBatDauQuet = layDongBatDauQuetNhomDongBo_(sheet);

  let daVaoNhom = false;
  let dongTieuDe = 0;

  for (let r = dongBatDauQuet - 1; r < values.length; r++) {
    const soDong = r + 1;
    const giaTriA = String(values[r][0] || '').trim();
    const giaTriB = String(values[r][1] || '').trim();

    if (laDongTieuDeNhomDongBo_(giaTriA, giaTriB)) {
      if (daVaoNhom) {
        return {
          maNhom: maNhomCanTim,
          dongTieuDe: dongTieuDe,
          dongBatDauDuLieu: dongTieuDe + 1,
          dongKetThucDuLieu: soDong - 1,
          dongChenMoi: soDong
        };
      }

      if (giaTriA === maNhomCanTim) {
        daVaoNhom = true;
        dongTieuDe = soDong;
      }
      continue;
    }

    if (daVaoNhom && laDongTongDongBo_(giaTriA)) {
      return {
        maNhom: maNhomCanTim,
        dongTieuDe: dongTieuDe,
        dongBatDauDuLieu: dongTieuDe + 1,
        dongKetThucDuLieu: soDong - 1,
        dongChenMoi: soDong
      };
    }
  }

  if (daVaoNhom) {
    return {
      maNhom: maNhomCanTim,
      dongTieuDe: dongTieuDe,
      dongBatDauDuLieu: dongTieuDe + 1,
      dongKetThucDuLieu: dongCuoi,
      dongChenMoi: dongCuoi + 1
    };
  }

  return null;
}

function timDongTheoMarkerTrongNhom_(sheet, thongTinNhom, marker) {
  if (thongTinNhom.dongKetThucDuLieu < thongTinNhom.dongBatDauDuLieu) return 0;

  for (let soDong = thongTinNhom.dongBatDauDuLieu; soDong <= thongTinNhom.dongKetThucDuLieu; soDong++) {
    const markerHienTai = layMarkerCongViecTonTheoDong_(sheet, soDong);
    if (markerHienTai === marker) {
      return soDong;
    }
  }

  return 0;
}

function timDongTrongTrongNhom_(sheet, thongTinNhom) {
  if (thongTinNhom.dongKetThucDuLieu < thongTinNhom.dongBatDauDuLieu) return 0;

  const soDong = thongTinNhom.dongKetThucDuLieu - thongTinNhom.dongBatDauDuLieu + 1;
  const values = sheet.getRange(thongTinNhom.dongBatDauDuLieu, 1, soDong, 9).getDisplayValues();

  for (let i = 0; i < values.length; i++) {
    const soDong = thongTinNhom.dongBatDauDuLieu + i;
    const giaTriA = String(values[i][0] || '').trim();
    const giaTriB = String(values[i][1] || '').trim();
    const giaTriC = String(values[i][2] || '').trim();
    const giaTriH = String(values[i][7] || '').trim();
    const giaTriI = String(values[i][8] || '').trim();

    const laDongCon = laMaCongViecPhanCapDongBo_(giaTriA);
    const laTrongBCHI = giaTriB === '' && giaTriC === '' && giaTriH === '' && giaTriI === '';

    if (laDongCon && laTrongBCHI) {
      return soDong;
    }
  }

  return 0;
}

function chenThemDongTrongCuoiNhom_(sheet, thongTinNhom) {
  try {
    const dongChen = thongTinNhom.dongChenMoi;
    const dongMau = timDongMauDeChen_(sheet, thongTinNhom);

    if (!dongMau) {
      Logger.log(
        'Khong tim duoc dong mau de chen | sheet=%s | nhom=%s',
        sheet.getName(),
        thongTinNhom.maNhom
      );
      return 0;
    }

    const chieuCaoDongMau = sheet.getRowHeight(dongMau);

    sheet.insertRowsBefore(dongChen, 1);

    const dongMoi = dongChen;
    const rangeMoi = sheet.getRange(dongMoi, 1, 1, 16);
    const rangeMau = sheet.getRange(dongMau, 1, 1, 16);

    // Quan trọng: phá merge và xóa format kế thừa của dòng vừa chèn
    rangeMoi.breakApart();
    rangeMoi.clearFormat();
    rangeMoi.clearDataValidations();
    rangeMoi.clearNote();
    rangeMoi.clearContent();

    // Copy đúng định dạng + dropdown từ dòng con cùng nhóm
    rangeMau.copyTo(
      rangeMoi,
      SpreadsheetApp.CopyPasteType.PASTE_FORMAT,
      false
    );

    rangeMau.copyTo(
      rangeMoi,
      SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION,
      false
    );

    sheet.setRowHeight(dongMoi, chieuCaoDongMau);

    sheet.getRange(dongMoi, 1).clearContent().clearNote();

    // Chỉ xóa nội dung nhập tay, giữ format/drodpown vừa copy
    sheet.getRange(dongMoi, 2, 1, 15).clearContent();
    sheet.getRange(dongMoi, 2, 1, 15).clearNote();

    Logger.log(
      'Da chen them 1 dong trong dung mau tai sheet=%s | nhom=%s | dong moi=%s | dong mau=%s',
      sheet.getName(),
      thongTinNhom.maNhom,
      dongMoi,
      dongMau
    );

    return dongMoi;
  } catch (error) {
    Logger.log('Loi chenThemDongTrongCuoiNhom_: %s', error.stack || error);
    throw error;
  }
}

function timDongMauDeChen_(sheet, thongTinNhom) {
  for (let soDong = thongTinNhom.dongKetThucDuLieu; soDong >= thongTinNhom.dongBatDauDuLieu; soDong--) {
    const giaTriA = String(sheet.getRange(soDong, 1).getDisplayValue() || '').trim();
    if (laMaCongViecPhanCapDongBo_(giaTriA)) {
      return soDong;
    }
  }

  return 0;
}

function tinhSttMoiTrongNhom_(sheet, thongTinNhom) {
  if (thongTinNhom.dongKetThucDuLieu < thongTinNhom.dongBatDauDuLieu) return 1;

  const soDong = thongTinNhom.dongKetThucDuLieu - thongTinNhom.dongBatDauDuLieu + 1;
  const valuesA = sheet.getRange(thongTinNhom.dongBatDauDuLieu, 1, soDong, 1).getDisplayValues();

  let maxStt = 0;

  for (let i = 0; i < valuesA.length; i++) {
    const a = String(valuesA[i][0] || '').trim();
    if (laMaCongViecPhanCapDongBo_(a)) {
      const parts = a.split('.');
      const soCuoi = Number(parts[parts.length - 1] || 0);
      maxStt = Math.max(maxStt, soCuoi);
    }
  }

  return maxStt + 1;
}

function ghiCongViecTonVaoDong_(sheet, soDong, item, marker) {
  sheet.getRange(soDong, 1).setValue(item.giaTriA || '').clearNote();
  const oB = sheet.getRange(soDong, 2);
  oB.setValue(item.giaTriB).clearNote();
  sheet.getRange(soDong, 3).setValue(item.giaTriC).clearNote();
  sheet.getRange(soDong, 8).setValue(item.giaTriH || '').clearNote();
  sheet.getRange(soDong, 9).setValue(item.giaTriI || '').clearNote();
  datMarkerCongViecTonTheoDong_(sheet, soDong, marker);
}

function xoaGiaTriCongViecTonTaiDong_(sheet, soDong) {
  sheet.getRange(soDong, 2).clearContent().clearNote();
  sheet.getRange(soDong, 3).clearContent().clearNote();
  sheet.getRange(soDong, 8).clearContent().clearNote();
  sheet.getRange(soDong, 9).clearContent().clearNote();
}

function layDongBatDauQuetNhomDongBo_(sheet) {
  const system = laySystemConfig_(docCauHinh_(sheet.getParent()));
  return Math.max(Number(system.header_row || 5), 1);
}

function datMarkerCongViecTonTheoDong_(sheet, soDong, marker) {
  const rangeDong = layRangeToanDongChoMarkerCongViecTon_(sheet, soDong);
  xoaMarkerCongViecTonTheoDong_(sheet, soDong);
  rangeDong.addDeveloperMetadata(DEVELOPER_METADATA_KEY_CONG_VIEC_TON_, marker);
}

function xoaMarkerCongViecTonTheoDong_(sheet, soDong) {
  const metadataList = layRangeToanDongChoMarkerCongViecTon_(sheet, soDong).getDeveloperMetadata();

  metadataList.forEach(function(metadata) {
    if (metadata.getKey() === DEVELOPER_METADATA_KEY_CONG_VIEC_TON_) {
      metadata.remove();
    }
  });
}

function layMarkerCongViecTonTheoDong_(sheet, soDong) {
  const metadataList = layRangeToanDongChoMarkerCongViecTon_(sheet, soDong).getDeveloperMetadata();

  for (let i = 0; i < metadataList.length; i++) {
    if (metadataList[i].getKey() === DEVELOPER_METADATA_KEY_CONG_VIEC_TON_) {
      return String(metadataList[i].getValue() || '').trim();
    }
  }

  return '';
}

function layRangeToanDongChoMarkerCongViecTon_(sheet, soDong) {
  return sheet.getRange(soDong + ':' + soDong);
}

function layDanhSachMaNhomDongBo_(sheet) {
  const dongCuoi = sheet.getLastRow();
  const cotCuoi = Math.max(sheet.getLastColumn(), 3);
  if (dongCuoi < DONG_BAT_DAU_DONG_BO_CONG_VIEC_TON_) return [];

  const values = sheet.getRange(1, 1, dongCuoi, cotCuoi).getDisplayValues();
  const dongBatDauQuet = layDongBatDauQuetNhomDongBo_(sheet);
  const dsMaNhom = [];

  for (let r = dongBatDauQuet - 1; r < values.length; r++) {
    const giaTriA = String(values[r][0] || '').trim();
    const giaTriB = String(values[r][1] || '').trim();

    if (laDongTieuDeNhomDongBo_(giaTriA, giaTriB)) {
      dsMaNhom.push(giaTriA);
    }
  }

  return dsMaNhom;
}

function layDanhSachNhomCoDongAuto_(sheet) {
  const dongCuoi = sheet.getLastRow();
  const cotCuoi = Math.max(sheet.getLastColumn(), 3);
  if (dongCuoi < DONG_BAT_DAU_DONG_BO_CONG_VIEC_TON_) return [];

  const values = sheet.getRange(1, 1, dongCuoi, cotCuoi).getDisplayValues();
  const dongBatDauQuet = layDongBatDauQuetNhomDongBo_(sheet);
  const daCo = {};
  let maNhomHienTai = '';

  for (let r = dongBatDauQuet - 1; r < values.length; r++) {
    const soDong = r + 1;
    const giaTriA = String(values[r][0] || '').trim();
    const giaTriB = String(values[r][1] || '').trim();
    const giaTriC = String(values[r][2] || '').trim();

    if (laDongTieuDeNhomDongBo_(giaTriA, giaTriB)) {
      maNhomHienTai = giaTriA;
      continue;
    }

    if (laDongTongDongBo_(giaTriA)) break;
    if (!maNhomHienTai) continue;
    if (!laDongCongViecConDongBo_(giaTriA, giaTriB, giaTriC)) continue;

    if (layMarkerCongViecTonTheoDong_(sheet, soDong)) {
      daCo[maNhomHienTai] = true;
    }
  }

  return Object.keys(daCo);
}

function hopNhatDanhSachMaNhomDongBo_(ds1, ds2) {
  const daCo = {};

  ds1.forEach(function(ma) {
    if (ma) daCo[ma] = true;
  });

  ds2.forEach(function(ma) {
    if (ma) daCo[ma] = true;
  });

  const ketQua = [];

  DS_MA_NHOM_LA_MA_MAC_DINH_.forEach(function(ma) {
    if (daCo[ma]) {
      ketQua.push(ma);
      delete daCo[ma];
    }
  });

  Object.keys(daCo).forEach(function(ma) {
    ketQua.push(ma);
  });

  return ketQua;
}

function dongBoMotDuAnSangThangSau_(sheetNguon, sheetDich, keyDuAn, dsCongViecTonCoSan, thongTinDuAnDich) {
  const dsCongViecTon = Array.isArray(dsCongViecTonCoSan) ? dsCongViecTonCoSan : [];
  const ketQuaTongHop = {
    keyDuAn: keyDuAn,
    tenDuAn: thongTinDuAnDich ? thongTinDuAnDich.tenDuAn : (dsCongViecTon[0] ? dsCongViecTon[0].tenDuAnNguon : ''),
    sheetNguon: sheetNguon.getName(),
    sheetDich: sheetDich.getName(),
    tongViecTon: dsCongViecTon.length,
    soDongGhi: 0,
    soDongXoa: 0,
    soDongChenMoi: 0,
    soDongBoQua: 0
  };

  if (!thongTinDuAnDich) {
    ketQuaTongHop.soDongBoQua = dsCongViecTon.length;
    return ketQuaTongHop;
  }

  const dsDongAuto = layDanhSachDongAutoTrongDuAn_(sheetDich, thongTinDuAnDich);
  const dsDongTaiSuDung = lamSachDongAutoTrongDuAn_(sheetDich, dsDongAuto);
  ketQuaTongHop.soDongXoa = dsDongTaiSuDung.length;

  if (!dsCongViecTon.length) {
    return ketQuaTongHop;
  }

  const soDongCanChen = Math.max(dsCongViecTon.length - dsDongTaiSuDung.length, 0);
  const dsDongDich = dsDongTaiSuDung.slice();

  if (soDongCanChen > 0) {
    const dongChen = thongTinDuAnDich.dongChenMoi;
    sheetDich.insertRowsBefore(dongChen, soDongCanChen);
    for (let i = 0; i < soDongCanChen; i++) {
      dsDongDich.push(dongChen + i);
    }
    ketQuaTongHop.soDongChenMoi = soDongCanChen;
  }

  dsCongViecTon.forEach(function(item, index) {
    const dongDich = dsDongDich[index] || 0;
    if (!dongDich) {
      ketQuaTongHop.soDongBoQua++;
      return;
    }

    dinhDangDongCongViecTonMoi_(sheetDich, dongDich);
    const marker = taoMarkerCongViecTonTheoDuAn_(sheetNguon.getName(), item.soDongNguon, item.tenDuAnNguon);
    ghiCongViecTonTheoDuAnVaoDong_(sheetDich, dongDich, item, marker);
    ketQuaTongHop.soDongGhi++;
  });

  return ketQuaTongHop;
}

function layBanDoCongViecTonTheoTenDuAn_(sheet, config, tapTrangThaiCongViecTon) {
  const dongCuoi = sheet.getLastRow();
  const cotCuoi = Math.max(sheet.getLastColumn(), 16);
  if (dongCuoi < 6) return {};

  const displayValues = sheet.getRange(1, 1, dongCuoi, cotCuoi).getDisplayValues();
  const rawValues = sheet.getRange(1, 1, dongCuoi, cotCuoi).getValues();
  const dongBatDauQuet = layDongBatDauQuetNhomDongBo_(sheet);
  const ketQua = {};
  let duAnHienTai = null;

  for (let r = dongBatDauQuet - 1; r < displayValues.length; r++) {
    const soDong = r + 1;
    const giaTriA = String(displayValues[r][0] || '').trim();
    const giaTriB = String(displayValues[r][1] || '').trim();
    const giaTriN = String(rawValues[r][13] || '').trim();

    if (laDongDuAnLaMaDongBo_(giaTriA, giaTriB)) {
      duAnHienTai = {
        maLaMa: giaTriA.toUpperCase(),
        tenDuAn: giaTriB,
        key: chuanHoaTenDuAnDongBo_(giaTriB)
      };
      continue;
    }

    if (laDongTongDongBo_(giaTriA)) break;
    if (!duAnHienTai) continue;
    if (!giaTriB) continue;
    if (!laTrangThaiCongViecTon_(giaTriN, tapTrangThaiCongViecTon)) continue;

    if (!ketQua[duAnHienTai.key]) {
      ketQua[duAnHienTai.key] = [];
    }

    ketQua[duAnHienTai.key].push({
      soDongNguon: soDong,
      maLaMaNguon: duAnHienTai.maLaMa,
      tenDuAnNguon: duAnHienTai.tenDuAn,
      giaTriB: giaTriB,
      giaTriC: String(displayValues[r][2] || '').trim(),
      giaTriH: String(displayValues[r][7] || '').trim(),
      giaTriI: String(displayValues[r][8] || '').trim(),
      giaTriN: giaTriN
    });
  }

  return ketQua;
}

function layBanDoDuAnLaMaTheoTen_(sheet, config) {
  const dongCuoi = sheet.getLastRow();
  const cotCuoi = Math.max(sheet.getLastColumn(), 2);
  if (dongCuoi < 6) return {};

  const values = sheet.getRange(1, 1, dongCuoi, cotCuoi).getDisplayValues();
  const dongBatDauQuet = layDongBatDauQuetNhomDongBo_(sheet);
  const banDo = {};
  let duAnHienTai = null;

  function ketThucDuAnTaiDong_(dongKetThucDocLap) {
    if (!duAnHienTai) return;
    duAnHienTai.dongKetThucDuLieu = dongKetThucDocLap - 1;
    duAnHienTai.dongChenMoi = dongKetThucDocLap;
    banDo[duAnHienTai.key] = duAnHienTai;
    duAnHienTai = null;
  }

  for (let r = dongBatDauQuet - 1; r < values.length; r++) {
    const soDong = r + 1;
    const giaTriA = String(values[r][0] || '').trim();
    const giaTriB = String(values[r][1] || '').trim();

    if (laDongTongDongBo_(giaTriA)) {
      ketThucDuAnTaiDong_(soDong);
      break;
    }

    if (laDongDuAnLaMaDongBo_(giaTriA, giaTriB)) {
      ketThucDuAnTaiDong_(soDong);
      const key = chuanHoaTenDuAnDongBo_(giaTriB);
      if (banDo[key]) {
        throw new Error('Tên dự án/nhóm bị trùng trong sheet ' + sheet.getName() + ': ' + giaTriB);
      }
      duAnHienTai = {
        key: key,
        maLaMa: giaTriA.toUpperCase(),
        tenDuAn: giaTriB,
        dongTieuDe: soDong,
        dongBatDauDuLieu: soDong + 1,
        dongKetThucDuLieu: dongCuoi,
        dongChenMoi: dongCuoi + 1
      };
    }
  }

  ketThucDuAnTaiDong_(dongCuoi + 1);
  return banDo;
}

function layDanhSachKeyDuAnCoDongAuto_(sheet, config) {
  const banDoDich = layBanDoDuAnLaMaTheoTen_(sheet, config);
  const ketQua = [];

  Object.keys(banDoDich).forEach(function(key) {
    if (layDanhSachDongAutoTrongDuAn_(sheet, banDoDich[key]).length) {
      ketQua.push(key);
    }
  });

  return ketQua;
}

function layDanhSachDongAutoTrongDuAn_(sheet, thongTinDuAn) {
  const ketQua = [];
  if (!thongTinDuAn || thongTinDuAn.dongKetThucDuLieu < thongTinDuAn.dongBatDauDuLieu) return ketQua;

  for (let soDong = thongTinDuAn.dongBatDauDuLieu; soDong <= thongTinDuAn.dongKetThucDuLieu; soDong++) {
    if (layMarkerCongViecTonTheoDong_(sheet, soDong)) {
      ketQua.push(soDong);
    }
  }

  return ketQua;
}

function lamSachDongAutoTrongDuAn_(sheet, dsDongAuto) {
  const ketQua = (dsDongAuto || []).slice().sort(function(a, b) {
    return a - b;
  });

  ketQua.forEach(function(soDong) {
    try {
      sheet.getRange(soDong, 1, 1, 16).clearContent().clearNote();
      xoaMarkerCongViecTonTheoDong_(sheet, soDong);
    } catch (error) {
      Logger.log(
        'Không làm sạch được dòng auto %s sheet %s: %s',
        soDong,
        sheet.getName(),
        error && error.message ? error.message : error
      );
    }
  });

  return ketQua;
}

function hopNhatKeyDuAnDongBoTheoThuTuDich_(dsKeyNguon, dsKeyAuto, banDoDich) {
  const daCo = {};
  const ketQua = [];

  (dsKeyNguon || []).forEach(function(key) {
    if (key) daCo[key] = true;
  });
  (dsKeyAuto || []).forEach(function(key) {
    if (key) daCo[key] = true;
  });

  Object.keys(banDoDich || {})
    .sort(function(a, b) {
      return banDoDich[a].dongTieuDe - banDoDich[b].dongTieuDe;
    })
    .forEach(function(key) {
      if (daCo[key]) {
        ketQua.push(key);
        delete daCo[key];
      }
    });

  Object.keys(daCo).forEach(function(key) {
    ketQua.push(key);
  });

  return ketQua;
}

function ghiCongViecTonTheoDuAnVaoDong_(sheet, soDong, item, marker) {
  const values = new Array(16).fill('');
  values[1] = item.giaTriB || '';
  values[2] = item.giaTriC || '';
  values[7] = item.giaTriH || '';
  values[8] = item.giaTriI || '';

  sheet.getRange(soDong, 1, 1, 16).setValues([values]);
  sheet.getRange(soDong, 1, 1, 16).clearNote();
  datMarkerCongViecTonTheoDong_(sheet, soDong, marker);
}

function dinhDangDongCongViecTonMoi_(sheet, soDong) {
  const rangeDong = sheet.getRange(soDong, 1, 1, 16);
  try {
    rangeDong.breakApart();
  } catch (error) {}
  rangeDong.clearContent();
  rangeDong.clearNote();
  rangeDong.setWrap(true);
  rangeDong.setVerticalAlignment('middle');
}

function taoMarkerCongViecTonTheoDuAn_(tenSheetNguon, soDongNguon, tenDuAn) {
  return '__AUTO_CONG_VIEC_TON__|tu=' + tenSheetNguon + '|dong=' + soDongNguon + '|duan=' + tenDuAn;
}

function laDongDuAnLaMaDongBo_(giaTriA, giaTriB) {
  return laMaLaMaDongBo_(giaTriA) && String(giaTriB || '').trim() !== '';
}

function laMaLaMaDongBo_(giaTriA) {
  const a = String(giaTriA || '').trim().toUpperCase();
  if (!a) return false;
  return /^(?=[MDCLXVI]+$)M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(a);
}

function chuanHoaTenDuAnDongBo_(giaTri) {
  return String(giaTri || '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function laTrangThaiCongViecTon_(giaTriN, tapTrangThai) {
  const text = chuanHoaTrangThaiCongViecTon_(giaTriN);
  return !!text && !!tapTrangThai[text];
}

function layTapTrangThaiCongViecTon_(ss, config) {
  const bangTinh = ss || layBangTinhDangMo_();
  const cfg = config || docCauHinh_(bangTinh);
  const system = laySystemConfig_(cfg);
  const tenSheetData = String(system.data_sheet_name || 'Data').trim() || 'Data';
  const sheetData = bangTinh.getSheetByName(tenSheetData);

  if (!sheetData) {
    throw new Error('Không tìm thấy sheet Data để đọc danh sách trạng thái công việc tồn.');
  }

  const values = sheetData.getRange('R6:R10').getDisplayValues();
  const ketQua = {};

  values.forEach(function(row) {
    const text = chuanHoaTrangThaiCongViecTon_(row[0]);
    if (text && !laTrangThaiHoanTatCongViecTon_(text)) {
      ketQua[text] = true;
    }
  });

  return ketQua;
}

function chuanHoaTrangThaiCongViecTon_(giaTri) {
  return String(giaTri || '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function laTrangThaiHoanTatCongViecTon_(text) {
  return text === 'dat' || text === 'hoan thanh';
}


function layThongTinThangTuTenSheet_(tenSheet) {
  const ketQua = String(tenSheet || '').match(/T(0[1-9]|1[0-2])\.(\d{4})$/);
  if (!ketQua) return null;

  return {
    thang: Number(ketQua[1]),
    nam: Number(ketQua[2])
  };
}

function taoNgayGio_(nam, thang, ngay, gio, phut, giay) {
  return new Date(nam, thang - 1, ngay, gio, phut, giay || 0, 0);
}

function layThangKeTiep_(thang, nam) {
  if (thang === 12) {
    return { thang: 1, nam: nam + 1 };
  }

  return { thang: thang + 1, nam: nam };
}

function layNgayCuoiThang_(thang, nam) {
  return new Date(nam, thang, 0).getDate();
}

function layCacMocThoiGianSheetThang_(sheet) {
  const thongTin = layThongTinThangTuTenSheet_(sheet.getName());
  if (!thongTin) {
    throw new Error('Ten sheet khong dung dinh dang thang: ' + sheet.getName());
  }

  const thang = thongTin.thang;
  const nam = thongTin.nam;
  const thangSau = layThangKeTiep_(thang, nam);
  const ngayCuoiThang = layNgayCuoiThang_(thang, nam);

  return {
    thang: thang,
    nam: nam,
    mocKhoaKeHoachDauThang: taoNgayGio_(nam, thang, 2, 18, 0, 0),
    mocKhoaKeHoachPhatSinh: taoNgayGio_(nam, thang, ngayCuoiThang, 17, 0, 0),
    mocKhoaDanhGia: taoNgayGio_(thangSau.nam, thangSau.thang, 2, 18, 0, 0),
    mocKhoaCotP: taoNgayGio_(thangSau.nam, thangSau.thang, 4, 18, 0, 0),
    mocKhoaToanSheet: taoNgayGio_(thangSau.nam, thangSau.thang, 10, 0, 0, 0)
  };
}

function timDongCongTacPhatSinhKhacTrongKy_(sheet) {
  const dongCuoi = sheet.getLastRow();
  if (dongCuoi < 5) return 0;

  const duLieuCotB = sheet.getRange(5, 2, dongCuoi - 4, 1).getDisplayValues();

  for (let i = 0; i < duLieuCotB.length; i++) {
    const giaTriB = String(duLieuCotB[i][0] || '').trim();
    if (giaTriB === 'Công tác phát sinh khác trong kỳ') {
      return i + 5;
    }
  }

  return 0;
}

function timDongTongTheoCotA_(sheet) {
  const dongCuoi = sheet.getLastRow();
  if (dongCuoi < 5) return 0;

  const duLieuCotA = sheet.getRange(5, 1, dongCuoi - 4, 1).getDisplayValues();

  for (let i = 0; i < duLieuCotA.length; i++) {
    const giaTriA = String(duLieuCotA[i][0] || '').trim();
    if (giaTriA === '∑' || giaTriA === 'Σ') {
      return i + 5;
    }
  }

  return 0;
}

function layThongTinDongMoTheoThoiGian_(sheet) {
  const dongBatDau = 5;
  const dongPhatSinh = timDongCongTacPhatSinhKhacTrongKy_(sheet);
  const dongTong = timDongTongTheoCotA_(sheet);

  if (!dongPhatSinh) {
    throw new Error('Khong tim thay dong "Công tác phát sinh khác trong kỳ" trong sheet ' + sheet.getName());
  }

  if (!dongTong) {
    throw new Error('Khong tim thay dong tong ky hieu ∑ trong sheet ' + sheet.getName());
  }

  if (dongPhatSinh <= dongBatDau) {
    throw new Error('Dong "Công tác phát sinh khác trong kỳ" khong hop le trong sheet ' + sheet.getName());
  }

  if (dongTong <= dongPhatSinh) {
    throw new Error('Dong tong ∑ phai nam sau dong "Công tác phát sinh khác trong kỳ" trong sheet ' + sheet.getName());
  }

  return {
    dongBatDau: dongBatDau,
    dongPhatSinh: dongPhatSinh,
    dongTong: dongTong,
    dongKeHoachThuongBatDau: dongBatDau,
    dongKeHoachThuongKetThuc: dongPhatSinh - 1,
    dongKeHoachPhatSinhBatDau: dongPhatSinh + 1,
    dongKeHoachPhatSinhKetThuc: dongTong - 1,
    dongDanhGiaBatDau: 5,
    dongDanhGiaKetThuc: dongTong - 1,
    dongCotPBatDau: 5,
    dongCotPKetThuc: dongTong - 1
  };
}

function layDanhSachVungMoTheoThoiGian_(sheet, thoiDiemXet) {
  const thongTinDong = layThongTinDongMoTheoThoiGian_(sheet);
  const moc = layCacMocThoiGianSheetThang_(sheet);
  const now = thoiDiemXet || new Date();
  const dsVungMo = [];

  if (now.getTime() >= moc.mocKhoaToanSheet.getTime()) {
    return dsVungMo;
  }

  if (thongTinDong.dongKeHoachThuongKetThuc >= thongTinDong.dongKeHoachThuongBatDau) {
    if (now.getTime() <= moc.mocKhoaKeHoachDauThang.getTime()) {
      dsVungMo.push({
        moTa: 'Ke hoach A:J dau thang',
        range: sheet.getRange(
          thongTinDong.dongKeHoachThuongBatDau,
          1,
          thongTinDong.dongKeHoachThuongKetThuc - thongTinDong.dongKeHoachThuongBatDau + 1,
          10
        )
      });
    }
  }

  if (thongTinDong.dongKeHoachPhatSinhKetThuc >= thongTinDong.dongKeHoachPhatSinhBatDau) {
    if (now.getTime() <= moc.mocKhoaKeHoachPhatSinh.getTime()) {
      dsVungMo.push({
        moTa: 'Ke hoach A:J phat sinh trong ky',
        range: sheet.getRange(
          thongTinDong.dongKeHoachPhatSinhBatDau,
          1,
          thongTinDong.dongKeHoachPhatSinhKetThuc - thongTinDong.dongKeHoachPhatSinhBatDau + 1,
          10
        )
      });
    }
  }

  if (thongTinDong.dongDanhGiaKetThuc >= thongTinDong.dongDanhGiaBatDau) {
    if (now.getTime() <= moc.mocKhoaDanhGia.getTime()) {
      dsVungMo.push({
        moTa: 'Danh gia K:O',
        range: sheet.getRange(
          thongTinDong.dongDanhGiaBatDau,
          11,
          thongTinDong.dongDanhGiaKetThuc - thongTinDong.dongDanhGiaBatDau + 1,
          5
        )
      });
    }
  }

  if (thongTinDong.dongCotPKetThuc >= thongTinDong.dongCotPBatDau) {
    if (now.getTime() <= moc.mocKhoaCotP.getTime()) {
      dsVungMo.push({
        moTa: 'Cot P',
        range: sheet.getRange(
          thongTinDong.dongCotPBatDau,
          16,
          thongTinDong.dongCotPKetThuc - thongTinDong.dongCotPBatDau + 1,
          1
        )
      });
    }
  }

  return dsVungMo;
}



/***** ================================
 * TRIGGER PROTECTION THEO MOC THOI GIAN
 * Chi them vao Chinh.gs, khong doi logic protection hien co
 * ================================== */

var TEN_HAM_TRIGGER_PROTECTION = 'xuLyTriggerProtectionTheoLich_';
var DS_TEN_HAM_TRIGGER_PROTECTION_CU = [
  'capNhatBaoVeTheoThoiGian',
  'xuLyTriggerProtectionTheoLich_'
];
var KHOA_SCRIPT_PROPERTY_TRIGGER_PROTECTION = 'danh_sach_trigger_protection_v1';
var SO_TRIGGER_PROTECTION_TOI_DA_MOI_DOT = 8;

/**
 * Xem thu danh sach moc se tao trigger, KHONG tao trigger.
 * Dung de kiem tra truoc khi tao that.
 */

/**
 * Tao lai toan bo trigger protection theo cac moc thoi gian duy nhat.
 * Ham nay se:
 * 1) xoa trigger protection cu
 * 2) tinh lai danh sach moc
 * 3) tao trigger moi
 * 4) luu log vao Script Properties
 */
function taoTriggerProtectionMoi() {
  Logger.log('DISABLED_BY_MASTER_MIGRATION|taoTriggerProtectionMoi|Child protection trigger creation disabled. MASTER handles protection.');
  return {
    status: 'DISABLED_BY_MASTER_MIGRATION',
    function_name: 'taoTriggerProtectionMoi',
    note: 'Child protection trigger creation disabled. MASTER handles protection.'
  };
}

/**
 * Chi xoa cac trigger protection do nhom ham nay tao ra.
 * KHONG xoa trigger khac.
 */
function xoaTriggerProtectionCu() {
  try {
    var tatCaTrigger = ScriptApp.getProjectTriggers();
    var soLuongDaXoa = 0;

    for (var i = 0; i < tatCaTrigger.length; i++) {
      var trigger = tatCaTrigger[i];
      var tenHam = trigger.getHandlerFunction();

      if (DS_TEN_HAM_TRIGGER_PROTECTION_CU.indexOf(tenHam) !== -1) {
        ScriptApp.deleteTrigger(trigger);
        soLuongDaXoa++;

        Logger.log(
          '[DA XOA] Trigger protection cu | Trigger ID: ' +
          trigger.getUniqueId()
        );
      }
    }

    luuNhatKyTriggerProtection_([]);

    Logger.log('Tong so trigger protection cu da xoa: ' + soLuongDaXoa);
    return soLuongDaXoa;
  } catch (loi) {
    Logger.log('[LOI] xoaTriggerProtectionCu: ' + loi.message);
    throw loi;
  }
}

/**
 * Xem lai nhat ky trigger protection da tao gan nhat.
 * Doc tu Script Properties.
 */
function xemNhatKyTriggerProtection() {
  try {
    var duLieu = docNhatKyTriggerProtection_();

    Logger.log('===== NHAT KY TRIGGER PROTECTION =====');
    Logger.log('Tong so ban ghi: ' + duLieu.length);

    if (duLieu.length === 0) {
      Logger.log('Chua co ban ghi trigger protection nao.');
      return;
    }

    for (var i = 0; i < duLieu.length; i++) {
      var dong = duLieu[i];
      Logger.log(
        '[' + (i + 1) + '] ' +
        'Trigger ID: ' + dong.triggerId +
        ' | Moc: ' + dong.thoiGianLog +
        ' | ' + dong.moTa
      );
    }
  } catch (loi) {
    Logger.log('[LOI] xemNhatKyTriggerProtection: ' + loi.message);
    throw loi;
  }
}

/**
 * Ham duoc trigger goi tai moi moc.
 * Chi goi lai logic protection hien co.
 */
function xuLyTriggerProtectionTheoLich_() {
  Logger.log('DISABLED_BY_MASTER_MIGRATION|xuLyTriggerProtectionTheoLich_|Child scheduled protection handler disabled. MASTER handles protection.');
  return JSON.stringify({
    status: 'DISABLED_BY_MASTER_MIGRATION',
    function_name: 'xuLyTriggerProtectionTheoLich_',
    note: 'Child scheduled protection handler disabled. MASTER handles protection.'
  });
}

/**
 * Alias tương thích ngược cho các trigger protection cũ đã tạo trước khi đổi tên hàm.
 * Giữ public entrypoint này để tránh lỗi "Script function not found" trên các file đã rollout.
 */
function capNhatBaoVeTheoThoiGian() {
  Logger.log('DISABLED_BY_MASTER_MIGRATION|capNhatBaoVeTheoThoiGian|Child scheduled protection alias disabled. MASTER handles protection.');
  return JSON.stringify({
    status: 'DISABLED_BY_MASTER_MIGRATION',
    function_name: 'capNhatBaoVeTheoThoiGian',
    note: 'Child scheduled protection alias disabled. MASTER handles protection.'
  });
}

function apBaoVeTheoTriggerProtection_(thoiDiemChay, e) {
  var ss = layBangTinhDangMo_();
  var dsSheetMucTieu = timDanhSachSheetThangCanApBaoVeTheoTrigger_(ss, thoiDiemChay, e);
  var soSheetDaBaoVe = 0;

  dsSheetMucTieu.forEach(function(sheet) {
    baoVeRiengMotSheetThangTheoThoiDiem_(sheet, thoiDiemChay);
    soSheetDaBaoVe++;
  });

  return {
    triggerUid: e && e.triggerUid ? String(e.triggerUid) : '',
    soSheetMucTieu: dsSheetMucTieu.length,
    soSheetDaBaoVe: soSheetDaBaoVe
  };
}

function timDanhSachSheetThangCanApBaoVeTheoTrigger_(ss, thoiDiemChay, e) {
  var bangTheoTen = {};

  timDanhSachTenSheetTuSuKienTriggerProtection_(e).forEach(function(tenSheet) {
    if (!tenSheet) {
      return;
    }
    var sheet = ss.getSheetByName(tenSheet);
    if (sheet && laSheetThangChoTriggerProtection_(sheet.getName())) {
      bangTheoTen[sheet.getName()] = sheet;
    }
  });

  if (Object.keys(bangTheoTen).length) {
    return Object.keys(bangTheoTen).map(function(ten) { return bangTheoTen[ten]; });
  }

  return timDanhSachSheetThangCanApBaoVeGanMoc_(ss, thoiDiemChay);
}

function timDanhSachTenSheetTuSuKienTriggerProtection_(e) {
  if (!e || !e.triggerUid) {
    return [];
  }

  var banGhi = timBanGhiTriggerProtectionTheoUid_(String(e.triggerUid));
  if (!banGhi || !banGhi.moTa) {
    return [];
  }

  return tachDanhSachTenSheetTuMoTaTriggerProtection_(banGhi.moTa);
}

function timBanGhiTriggerProtectionTheoUid_(triggerUid) {
  var dsNhatKy = docNhatKyTriggerProtection_();

  for (var i = 0; i < dsNhatKy.length; i++) {
    var banGhi = dsNhatKy[i];
    if (String(banGhi.triggerId || '') === String(triggerUid || '')) {
      return banGhi;
    }
  }

  return null;
}

function tachDanhSachTenSheetTuMoTaTriggerProtection_(moTaTong) {
  var ketQua = [];
  var dsMoTa = String(moTaTong || '').split('||');

  for (var i = 0; i < dsMoTa.length; i++) {
    var moTa = String(dsMoTa[i] || '').trim();
    if (!moTa) {
      continue;
    }

    var viTri = moTa.indexOf(' | ');
    var tenSheet = viTri === -1 ? moTa : moTa.substring(0, viTri).trim();
    if (tenSheet && ketQua.indexOf(tenSheet) === -1) {
      ketQua.push(tenSheet);
    }
  }

  return ketQua;
}

function timDanhSachSheetThangCanApBaoVeGanMoc_(ss, thoiDiemChay) {
  var config = docCauHinh_(ss);
  var dsSheet = layDanhSachSheetThang_(ss, config);
  var ketQua = [];
  var cuaSoMilliGiay = 10 * 60 * 1000;

  dsSheet.forEach(function(sheet) {
    var cacMoc = layCacMocThoiGianSheetThang_(sheet);
    var dsMoc = [
      cacMoc.mocKhoaKeHoachDauThang,
      cacMoc.mocKhoaKeHoachPhatSinh,
      cacMoc.mocKhoaDanhGia,
      cacMoc.mocKhoaCotP,
      cacMoc.mocKhoaToanSheet
    ];

    var coMocGan = dsMoc.some(function(moc) {
      return moc instanceof Date &&
        !isNaN(moc.getTime()) &&
        Math.abs(moc.getTime() - thoiDiemChay.getTime()) <= cuaSoMilliGiay;
    });

    if (coMocGan) {
      ketQua.push(sheet);
    }
  });

  return ketQua;
}

function baoVeRiengMotSheetThangTheoThoiDiem_(sheet, thoiDiemChay) {
  var ketQuaXoa = xoaBaoVeSheetVaRange_(sheet);
  var protectionSheetThang = taoProtectionChuanChoSheet_(sheet, 'Bảo vệ động toàn sheet tháng ' + sheet.getName());
  var dsVungMo = layDanhSachVungMoTheoThoiGian_(sheet, thoiDiemChay);
  var dsRangeMo = dsVungMo.map(function(item) {
    return item.range;
  });

  protectionSheetThang.setUnprotectedRanges(dsRangeMo);

  Logger.log(
    'Đã bảo vệ động sheet tháng: %s | soVungMo=%s | rangeProtection=%s | sheetProtection=%s | moTa=%s',
    sheet.getName(),
    dsVungMo.length,
    ketQuaXoa.soRangeDaXoa,
    ketQuaXoa.soSheetDaXoa,
    dsVungMo.map(function(item) { return item.moTa; }).join(' || ')
  );
}

/**
 * Lay danh sach moc trigger duy nhat cho toan file.
 * Moi moc chi tao 1 trigger, du co the anh huong nhieu sheet.
 */
function layDanhSachMocTriggerProtection_() {
  var ss = layBangTinhDangMo_();
  var config = docCauHinh_(ss);
  var danhSachSheet = layDanhSachSheetThang_(ss, config);
  var danhSachMocRaw = [];
  var danhSachTruongMoc = [
    { key: 'mocKhoaKeHoachDauThang', moTa: 'Khoa khoi ke hoach A:J dau thang' },
    { key: 'mocKhoaKeHoachPhatSinh', moTa: 'Khoa khoi ke hoach A:J phan phat sinh' },
    { key: 'mocKhoaDanhGia', moTa: 'Khoa khoi danh gia K:O' },
    { key: 'mocKhoaCotP', moTa: 'Khoa cot P' },
    { key: 'mocKhoaToanSheet', moTa: 'Khoa toan bo sheet thang truoc' }
  ];

  if (typeof layCacMocThoiGianSheetThang_ !== 'function') {
    throw new Error('Khong tim thay ham layCacMocThoiGianSheetThang_ trong Chinh.gs');
  }

  for (var i = 0; i < danhSachSheet.length; i++) {
    var sheet = danhSachSheet[i];
    var tenSheet = sheet.getName();

    var cacMoc = layCacMocThoiGianSheetThang_(sheet);

    if (!cacMoc) {
      Logger.log('[BO QUA] Khong lay duoc moc thoi gian cua sheet: ' + tenSheet);
      continue;
    }

    for (var j = 0; j < danhSachTruongMoc.length; j++) {
      var truongMoc = danhSachTruongMoc[j];
      var thoiGianMoc = cacMoc[truongMoc.key];

      if (thoiGianMoc instanceof Date) {
        danhSachMocRaw.push({
          thoiGian: thoiGianMoc,
          moTa: tenSheet + ' | ' + truongMoc.moTa
        });
      }
    }
  }

  return gopMocTriggerTrungNhau_(danhSachMocRaw);
}

/**
 * Gom cac moc trung nhau thanh 1 trigger duy nhat.
 */
function gopMocTriggerTrungNhau_(danhSachMocRaw) {
  var bangTheoMoc = {};

  for (var i = 0; i < danhSachMocRaw.length; i++) {
    var dong = danhSachMocRaw[i];
    if (!dong || !(dong.thoiGian instanceof Date) || isNaN(dong.thoiGian.getTime())) {
      continue;
    }

    var key = dong.thoiGian.getTime().toString();

    if (!bangTheoMoc[key]) {
      bangTheoMoc[key] = {
        thoiGian: dong.thoiGian,
        danhSachMoTa: []
      };
    }

    if (bangTheoMoc[key].danhSachMoTa.indexOf(dong.moTa) === -1) {
      bangTheoMoc[key].danhSachMoTa.push(dong.moTa);
    }
  }

  var ketQua = [];
  var cacKey = Object.keys(bangTheoMoc);

  for (var j = 0; j < cacKey.length; j++) {
    var keyMoc = cacKey[j];
    var nhom = bangTheoMoc[keyMoc];

    ketQua.push({
      thoiGian: nhom.thoiGian,
      moTa: nhom.danhSachMoTa.join(' || ')
    });
  }

  ketQua.sort(function(a, b) {
    return a.thoiGian.getTime() - b.thoiGian.getTime();
  });

  return ketQua;
}

/**
 * Nhan dien sheet thang theo mau ten: ... T01.2026
 */
function laSheetThangChoTriggerProtection_(tenSheet) {
  return /\bT(0[1-9]|1[0-2])\.\d{4}$/.test(tenSheet);
}

/**
 * Luu nhat ky trigger vao Script Properties.
 */
function luuNhatKyTriggerProtection_(danhSachDaTao) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty(
    KHOA_SCRIPT_PROPERTY_TRIGGER_PROTECTION,
    JSON.stringify(danhSachDaTao || [])
  );
}

/**
 * Doc nhat ky trigger tu Script Properties.
 */
function docNhatKyTriggerProtection_() {
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty(KHOA_SCRIPT_PROPERTY_TRIGGER_PROTECTION);


  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw);
  } catch (loi) {
    Logger.log('[CANH BAO] Khong doc duoc nhat ky trigger protection tu Script Properties');
    return [];
  }
}

/**
 * Dinh dang ngay gio de log.
 */
function dinhDangNgayGioLog_(ngay) {
  if (!(ngay instanceof Date) || isNaN(ngay.getTime())) {
    return '';
  }

  return Utilities.formatDate(
    ngay,
    Session.getScriptTimeZone(),
    'dd/MM/yyyy HH:mm:ss'
  );
}



