function taoSheetMailPhoiHop() {
  try {
    var ss = layBangTinhEmailPhoiHop_();
    var tenSheet = CAU_HINH_TONG_HOP_PHOI_HOP.TEN_SHEET_LOG;
    var sheet = ss.getSheetByName(tenSheet);

    if (sheet) {
      anCacSheetKyThuat_();
      Logger.log('Sheet %s đã tồn tại', tenSheet);
      return sheet;
    }

    sheet = ss.insertSheet(tenSheet);
    sheet.getRange(1, 1, 1, 11).setValues([[
      'ngay_gui',
      'ten_sheet',
      'phong_lap_ke_hoach',
      'thang_ke_hoach',
      'ds_doi_tuong_nhan',
      'ds_email_nhan',
      'so_cong_viec',
      'hash_noi_dung',
      'ma_dot_gui',
      'trang_thai',
      'ghi_chu'
    ]]);

    sheet.getRange(1, 1, 1, 11).setFontWeight('bold');
    sheet.autoResizeColumns(1, 11);
    anCacSheetKyThuat_();

    Logger.log('Đã tạo sheet %s', tenSheet);
    return sheet;
  } catch (loi) {
    Logger.log('Lỗi taoSheetMailPhoiHop: %s', loi.stack || loi);
    throw loi;
  }
}

function damBaoSheetPhuTroEmailPhoiHop_() {
  try {
    var ss = layBangTinhEmailPhoiHop_();
    var canhBao = [];

    taoSheetMailPhoiHop();

    var sheetData = ss.getSheetByName(CAU_HINH_EMAIL_PHOI_HOP.tenSheetData);
    if (!sheetData) {
      canhBao.push('Không tìm thấy sheet Data. Hoàn thiện bước 3.1 trước khi bật trigger email.');
      Logger.log('Cảnh báo damBaoSheetPhuTroEmailPhoiHop_: thiếu sheet Data, tạm bỏ qua kiểm tra phụ trợ.');
    }

    anCacSheetKyThuat_();

    Logger.log('Đã đảm bảo xong sheet phụ trợ email phối hợp');
    return {
      ok: true,
      warnings: canhBao
    };
  } catch (loi) {
    Logger.log('Lỗi damBaoSheetPhuTroEmailPhoiHop_: %s', loi.stack || loi);
    throw loi;
  }
}

function layDanhSachTenSheetKyThuatCanAn_() {
  var ds = [
    'CONFIG_CORE',
    'CONFIG_HEADER_MAP',
    'CONFIG_VALIDATION',
    'CONFIG_FORMAT',
    CAU_HINH_UNG_DUNG.TEN_SHEET.DATA_2 || 'Data (2)'
  ];

  if (typeof CAU_HINH_TONG_HOP_PHOI_HOP !== 'undefined' && CAU_HINH_TONG_HOP_PHOI_HOP.TEN_SHEET_LOG) {
    ds.push(CAU_HINH_TONG_HOP_PHOI_HOP.TEN_SHEET_LOG);
  }

  var daCo = {};
  return ds.filter(function(tenSheet) {
    var ten = String(tenSheet || '').trim();
    if (!ten || daCo[ten]) {
      return false;
    }
    daCo[ten] = true;
    return true;
  });
}

function anCacSheetKyThuat_() {
  try {
    var ss = layBangTinhDangMo_();
    var dsTenSheet = layDanhSachTenSheetKyThuatCanAn_();
    var soSheetDaAn = 0;

    dsTenSheet.forEach(function(tenSheet) {
      var sheet = ss.getSheetByName(tenSheet);
      if (!sheet || sheet.isSheetHidden()) {
        return;
      }

      if (sheet.isSheetHidden() === false && ss.getActiveSheet() && ss.getActiveSheet().getSheetId() === sheet.getSheetId()) {
        var sheetKhaDung = timSheetHienThiAnToanDeKichHoat_(ss, dsTenSheet, sheet.getSheetId());
        if (sheetKhaDung) {
          sheetKhaDung.activate();
        }
      }

      sheet.hideSheet();
      soSheetDaAn++;
      Logger.log('Đã ẩn sheet kỹ thuật: %s', tenSheet);
    });

    Logger.log('Hoàn tất ẩn sheet kỹ thuật | soSheetDaAn=%s', soSheetDaAn);
    return {
      soSheetDaAn: soSheetDaAn,
      dsTenSheet: dsTenSheet
    };
  } catch (loi) {
    Logger.log('Lỗi anCacSheetKyThuat_: %s', loi.stack || loi);
    throw loi;
  }
}

function timSheetHienThiAnToanDeKichHoat_(ss, dsTenSheetKyThuat, boQuaSheetId) {
  var dsKyThuat = {};
  (dsTenSheetKyThuat || []).forEach(function(ten) {
    dsKyThuat[String(ten || '').trim()] = true;
  });

  var dsSheet = ss.getSheets();
  for (var i = 0; i < dsSheet.length; i++) {
    var sheet = dsSheet[i];
    if (!sheet || sheet.isSheetHidden()) {
      continue;
    }
    if (boQuaSheetId && sheet.getSheetId() === boQuaSheetId) {
      continue;
    }
    if (dsKyThuat[sheet.getName()]) {
      continue;
    }
    return sheet;
  }

  for (var j = 0; j < dsSheet.length; j++) {
    var sheetDuPhong = dsSheet[j];
    if (!sheetDuPhong || sheetDuPhong.isSheetHidden()) {
      continue;
    }
    if (boQuaSheetId && sheetDuPhong.getSheetId() === boQuaSheetId) {
      continue;
    }
    return sheetDuPhong;
  }

  return null;
}
