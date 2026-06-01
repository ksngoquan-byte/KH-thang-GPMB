// PATCH 2026-06-01
// Chuyen viec ton theo ten du an tai cot B cua dong nhom La Ma.
// Sheet thang dich chi can khung nhom: cot A la so La Ma, cot B la ten du an/nhom.
// Khong can dong mau ky thuat 1 / 1.1. STT cap nhat sau khi chuyen.

function dongBoToanBoCongViecTonCuaSheetHienTai() {
  let lock = null;
  try {
    lock = khoaDongBoCongViecTon_(KHOA_BATCH_DONG_BO_CONG_VIEC_TON_TIMEOUT_MS_);
    if (!lock) {
      throw new Error('Khong lay duoc lock de dong bo cong viec ton. Hay doi 10-30 giay roi chay lai.');
    }

    const ss = layBangTinhDangMo_();
    const sheetNguon = ss.getActiveSheet();
    const config = docCauHinh_(ss);
    const tapTrangThaiCongViecTon = layTapTrangThaiCongViecTon_(ss, config);

    if (!laSheetThangDongBo_(sheetNguon, config)) {
      throw new Error('Sheet dang mo khong phai sheet thang hop le de dong bo cong viec ton.');
    }

    const sheetDich = laySheetThangKeTiep_(ss, sheetNguon, config);
    if (!sheetDich) {
      throw new Error('Khong tim thay sheet thang ke tiep cho ' + sheetNguon.getName());
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
      'Dong bo viec ton theo ten du an xong | nguon=%s | dich=%s | du_an=%s | viec_ton=%s | dong_ghi=%s | dong_cu_clear=%s | dong_chen=%s | bo_qua=%s',
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
      'Da chuyen ' + ketQuaTongHop.tongDongGhi + '/' + ketQuaTongHop.tongViecTon +
        ' viec ton tu ' + ketQuaTongHop.sheetNguon + ' sang ' + ketQuaTongHop.sheetDich,
      'Cong viec ton',
      8
    );

    return ketQuaTongHop;
  } catch (error) {
    Logger.log('Loi dongBoToanBoCongViecTonCuaSheetHienTai: %s', error.stack || error);
    throw error;
  } finally {
    if (lock) lock.releaseLock();
  }
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
      'Khong the dong bo viec ton vi sheet thang sau thieu dong du an/nhom trung ten tai cot B:\n- ' +
      dsThieuDuAn.map(function(key) { return banDoNguon[key][0].tenDuAnNguon; }).join('\n- ')
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
      duAnHienTai = { maLaMa: giaTriA.toUpperCase(), tenDuAn: giaTriB, key: chuanHoaTenDuAnDongBo_(giaTriB) };
      continue;
    }
    if (laDongTongDongBoTheoDuAn_(giaTriA)) break;
    if (!duAnHienTai) continue;
    if (!giaTriB) continue;
    if (!laTrangThaiCongViecTon_(giaTriN, tapTrangThaiCongViecTon)) continue;

    if (!ketQua[duAnHienTai.key]) ketQua[duAnHienTai.key] = [];
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
    if (laDongTongDongBoTheoDuAn_(giaTriA)) {
      ketThucDuAnTaiDong_(soDong);
      break;
    }
    if (laDongDuAnLaMaDongBo_(giaTriA, giaTriB)) {
      ketThucDuAnTaiDong_(soDong);
      const key = chuanHoaTenDuAnDongBo_(giaTriB);
      if (banDo[key]) throw new Error('Ten du an/nhom bi trung trong sheet ' + sheet.getName() + ': ' + giaTriB);
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
    if (layDanhSachDongAutoTrongDuAn_(sheet, banDoDich[key]).length) ketQua.push(key);
  });
  return ketQua;
}

function layDanhSachDongAutoTrongDuAn_(sheet, thongTinDuAn) {
  const ketQua = [];
  if (!thongTinDuAn || thongTinDuAn.dongKetThucDuLieu < thongTinDuAn.dongBatDauDuLieu) return ketQua;
  for (let soDong = thongTinDuAn.dongBatDauDuLieu; soDong <= thongTinDuAn.dongKetThucDuLieu; soDong++) {
    if (layMarkerCongViecTonTheoDong_(sheet, soDong)) ketQua.push(soDong);
  }
  return ketQua;
}

function lamSachDongAutoTrongDuAn_(sheet, dsDongAuto) {
  const ketQua = (dsDongAuto || []).slice().sort(function(a, b) { return a - b; });
  ketQua.forEach(function(soDong) {
    try {
      sheet.getRange(soDong, 1, 1, 16).clearContent().clearNote();
      xoaMarkerCongViecTonTheoDong_(sheet, soDong);
    } catch (error) {
      Logger.log('Khong lam sach duoc dong auto %s sheet %s: %s', soDong, sheet.getName(), error && error.message ? error.message : error);
    }
  });
  return ketQua;
}

function hopNhatKeyDuAnDongBoTheoThuTuDich_(dsKeyNguon, dsKeyAuto, banDoDich) {
  const daCo = {};
  const ketQua = [];
  (dsKeyNguon || []).forEach(function(key) { if (key) daCo[key] = true; });
  (dsKeyAuto || []).forEach(function(key) { if (key) daCo[key] = true; });
  Object.keys(banDoDich || {})
    .sort(function(a, b) { return banDoDich[a].dongTieuDe - banDoDich[b].dongTieuDe; })
    .forEach(function(key) {
      if (daCo[key]) {
        ketQua.push(key);
        delete daCo[key];
      }
    });
  Object.keys(daCo).forEach(function(key) { ketQua.push(key); });
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
  try { rangeDong.breakApart(); } catch (error) {}
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

function laDongTongDongBoTheoDuAn_(giaTriA) {
  const a = String(giaTriA || '').trim();
  return a === '∑' || a === 'Σ';
}

function chuanHoaTenDuAnDongBo_(giaTri) {
  return String(giaTri || '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
}
