function taoHoacLamMoiSheetConfig() {
  try {
    const ss = layBangTinhDangMo_();
    Logger.log('Dang tao canonical config cho file: %s', ss.getName());

    const ketQua = setupCanonicalConfig_(true);
    const daXoaConfigCu = xoaSheetConfigCuNeuCo_(ss);

    Logger.log(
      'Tao canonical config hoan tat | created=%s | reset=%s | daXoaConfigCu=%s',
      JSON.stringify(ketQua.createdSheets || []),
      JSON.stringify(ketQua.resetSheets || []),
      daXoaConfigCu
    );
    return ketQua;
  } catch (error) {
    Logger.log('Lỗi taoHoacLamMoiSheetConfig: %s', error.stack || error);
    throw error;
  }
}

function dongBoDropdownVaDinhDang() {
  try {
    const ss = layBangTinhDangMo_();
    Logger.log('Bắt đầu đồng bộ cho file: %s', ss.getName());
    taoHoacCapNhatSheetData2_();

    const config = docCauHinh_(ss);
    const dsSheetThang = layDanhSachSheetThang_(ss, config);

    Logger.log('Số sheet tháng tìm thấy: %s', dsSheetThang.length);

    if (!dsSheetThang.length) {
      throw new Error('Không tìm thấy sheet tháng nào khớp canonical config hiện tại.');
    }

    const ketQuaDropdown = apDungDropdown_(ss, config, dsSheetThang);
    const ketQuaDropdownCap = apDungDropdownCapCongViec_(ss, config, dsSheetThang);
    const ketQuaDinhDang = apDungDinhDang_(ss, config, dsSheetThang);
    const ketQuaTongHop = {
      soSheetThang: dsSheetThang.length,
      soRuleDropdown: ketQuaDropdown.soRule,
      soSheetDropdownCapCongViec: ketQuaDropdownCap.soSheetDaAp,
      soRuleDinhDang: ketQuaDinhDang.soRule,
      soLoiDropdown: ketQuaDropdown.soLoi,
      soLoiDinhDang: ketQuaDinhDang.soLoi
    };

    Logger.log(
      'Hoàn tất đồng bộ. Sheet xử lý: %s | Rule dropdown: %s | Sheet cấp công việc: %s | Rule định dạng: %s | Lỗi dropdown: %s | Lỗi định dạng: %s',
      ketQuaTongHop.soSheetThang,
      ketQuaTongHop.soRuleDropdown,
      ketQuaTongHop.soSheetDropdownCapCongViec,
      ketQuaTongHop.soRuleDinhDang,
      ketQuaTongHop.soLoiDropdown,
      ketQuaTongHop.soLoiDinhDang
    );

    return ketQuaTongHop;
  } catch (error) {
    Logger.log('Lỗi dongBoDropdownVaDinhDang: %s', error.stack || error);
    throw error;
  }
}

function baoVeBieuMau() {
  try {
    Logger.log('=== DANG CHAY BAN MOI cua baoVeBieuMau ===');

    const ss = layBangTinhDangMo_();
    const config = docCauHinh_(ss);
    const dsSheetThang = layDanhSachSheetThang_(ss, config);
    const ketQuaTongHop = baoVeCacSheetKyThuatSauKhoiTao_();

    Logger.log('Bắt đầu áp bảo vệ cho file: %s', ss.getName());

    dsSheetThang.forEach(function(sheet) {
      const ketQuaXoa = xoaBaoVeSheetVaRange_(sheet);
      ketQuaTongHop.tongRangeProtectionDaXoa += ketQuaXoa.soRangeDaXoa;
      ketQuaTongHop.tongSheetProtectionDaXoa += ketQuaXoa.soSheetDaXoa;
      ketQuaTongHop.tongLoiXoaProtection += ketQuaXoa.soLoi;
      const protectionSheetThang = taoProtectionChuanChoSheet_(sheet, 'Bảo vệ động toàn sheet tháng ' + sheet.getName());
      const dsVungMo = layDanhSachVungMoTheoThoiGian_(sheet, new Date());
      const dsRangeMo = dsVungMo.map(function(item) {
        return item.range;
      });
      protectionSheetThang.setUnprotectedRanges(dsRangeMo);
      ketQuaTongHop.soSheetThangDaBaoVe++;

      Logger.log(
        'Đã bảo vệ động sheet tháng: %s | soVungMo=%s | moTa=%s',
        sheet.getName(),
        dsVungMo.length,
        dsVungMo.map(function(item) { return item.moTa; }).join(' || ')
      );
    });

    if (typeof anCacSheetKyThuat_ === 'function') {
      anCacSheetKyThuat_();
    }

    Logger.log(
      'Hoàn tất áp bảo vệ cho file đang mở | sheetConfig=%s | sheetData=%s | sheetMailLog=%s | sheetThang=%s | rangeProtectionDaXoa=%s | sheetProtectionDaXoa=%s | loiXoaProtection=%s',
      ketQuaTongHop.soSheetConfigDaBaoVe,
      ketQuaTongHop.daBaoVeSheetData,
      ketQuaTongHop.daBaoVeSheetMailLog,
      ketQuaTongHop.soSheetThangDaBaoVe,
      ketQuaTongHop.tongRangeProtectionDaXoa,
      ketQuaTongHop.tongSheetProtectionDaXoa,
      ketQuaTongHop.tongLoiXoaProtection
    );
    return ketQuaTongHop;
  } catch (error) {
    Logger.log('Lỗi baoVeBieuMau: %s', error.stack || error);
    throw error;
  }
}

function baoVeCacSheetKyThuatSauKhoiTao_() {
  try {
    const ss = layBangTinhDangMo_();
    const tenCacSheetConfig = ['CONFIG_CORE', 'CONFIG_HEADER_MAP', 'CONFIG_VALIDATION', 'CONFIG_FORMAT'];
    const tenSheetData2 = CAU_HINH_UNG_DUNG.TEN_SHEET.DATA_2 || 'Data (2)';
    const tenSheetMailLog = (typeof CAU_HINH_TONG_HOP_PHOI_HOP !== 'undefined' && CAU_HINH_TONG_HOP_PHOI_HOP.TEN_SHEET_LOG)
      ? CAU_HINH_TONG_HOP_PHOI_HOP.TEN_SHEET_LOG
      : 'MAIL_LOG_PHOI_HOP';
    const ketQuaTongHop = {
      soSheetConfigDaBaoVe: 0,
      daBaoVeSheetData: false,
      daBaoVeSheetMailLog: false,
      soSheetThangDaBaoVe: 0,
      tongRangeProtectionDaXoa: 0,
      tongSheetProtectionDaXoa: 0,
      tongLoiXoaProtection: 0
    };

    tenCacSheetConfig.forEach(function(tenSheetConfig) {
      const sheetConfig = ss.getSheetByName(tenSheetConfig);
      if (!sheetConfig) {
        return;
      }

      const ketQuaXoa = xoaBaoVeSheetVaRange_(sheetConfig);
      ketQuaTongHop.tongRangeProtectionDaXoa += ketQuaXoa.soRangeDaXoa;
      ketQuaTongHop.tongSheetProtectionDaXoa += ketQuaXoa.soSheetDaXoa;
      ketQuaTongHop.tongLoiXoaProtection += ketQuaXoa.soLoi;
      taoProtectionChuanChoSheet_(sheetConfig, 'Bao ve toan bo sheet ' + tenSheetConfig);
      ketQuaTongHop.soSheetConfigDaBaoVe++;
      Logger.log('Da bao ve toan bo sheet %s', tenSheetConfig);
    });

    const sheetData = ss.getSheetByName('Data');
    if (sheetData) {
      const ketQuaXoa = xoaBaoVeSheetVaRange_(sheetData);
      ketQuaTongHop.tongRangeProtectionDaXoa += ketQuaXoa.soRangeDaXoa;
      ketQuaTongHop.tongSheetProtectionDaXoa += ketQuaXoa.soSheetDaXoa;
      ketQuaTongHop.tongLoiXoaProtection += ketQuaXoa.soLoi;
      const protectionData = taoProtectionChuanChoSheet_(sheetData, 'Bảo vệ sheet Data, chỉ mở J6:P56');
      protectionData.setUnprotectedRanges([sheetData.getRange('J6:P56')]);
      ketQuaTongHop.daBaoVeSheetData = true;
      Logger.log('Đã bảo vệ sheet Data và mở J6:P56');
    }

    const sheetData2 = ss.getSheetByName(tenSheetData2);
    if (sheetData2) {
      const ketQuaXoa = xoaBaoVeSheetVaRange_(sheetData2);
      ketQuaTongHop.tongRangeProtectionDaXoa += ketQuaXoa.soRangeDaXoa;
      ketQuaTongHop.tongSheetProtectionDaXoa += ketQuaXoa.soSheetDaXoa;
      ketQuaTongHop.tongLoiXoaProtection += ketQuaXoa.soLoi;
      taoProtectionChuanChoSheet_(sheetData2, 'Bảo vệ toàn bộ sheet ' + tenSheetData2);
      Logger.log('Đã bảo vệ toàn bộ sheet %s', tenSheetData2);
    }

    const sheetMailLog = ss.getSheetByName(tenSheetMailLog);
    if (sheetMailLog) {
      const ketQuaXoa = xoaBaoVeSheetVaRange_(sheetMailLog);
      ketQuaTongHop.tongRangeProtectionDaXoa += ketQuaXoa.soRangeDaXoa;
      ketQuaTongHop.tongSheetProtectionDaXoa += ketQuaXoa.soSheetDaXoa;
      ketQuaTongHop.tongLoiXoaProtection += ketQuaXoa.soLoi;
      taoProtectionChuanChoSheet_(sheetMailLog, 'Bảo vệ toàn bộ sheet ' + tenSheetMailLog);
      ketQuaTongHop.daBaoVeSheetMailLog = true;
      Logger.log('Đã bảo vệ toàn bộ sheet %s', tenSheetMailLog);
    }

    if (typeof anCacSheetKyThuat_ === 'function') {
      anCacSheetKyThuat_();
    }

    Logger.log(
      'Hoàn tất bảo vệ sheet kỹ thuật | sheetConfig=%s | sheetData=%s | sheetMailLog=%s | rangeProtectionDaXoa=%s | sheetProtectionDaXoa=%s | loiXoaProtection=%s',
      ketQuaTongHop.soSheetConfigDaBaoVe,
      ketQuaTongHop.daBaoVeSheetData,
      ketQuaTongHop.daBaoVeSheetMailLog,
      ketQuaTongHop.tongRangeProtectionDaXoa,
      ketQuaTongHop.tongSheetProtectionDaXoa,
      ketQuaTongHop.tongLoiXoaProtection
    );

    return ketQuaTongHop;
  } catch (error) {
    Logger.log('Lỗi baoVeCacSheetKyThuatSauKhoiTao_: %s', error.stack || error);
    throw error;
  }
}

function taoProtectionChuanChoSheet_(target, moTa) {
  const emailNguoiChay = layEmailNguoiChayChoProtection_();
  const dsProtection = target.getProtections(SpreadsheetApp.ProtectionType.SHEET) || [];
  const protection = dsProtection.length ? dsProtection[0] : target.protect();

  protection.setDescription(moTa);

  if (protection.canDomainEdit()) {
    protection.setDomainEdit(false);
  }

  if (emailNguoiChay) {
    try {
      protection.addEditor(emailNguoiChay);
    } catch (error) {
      Logger.log('Không thêm được editor [%s] cho protection [%s]: %s', emailNguoiChay, moTa, error);
    }
    xoaEditorKhac_(protection, emailNguoiChay);
  } else {
    Logger.log('Không xác định được email người chạy, bỏ qua bước cập nhật editor cho protection [%s]', moTa);
  }

  return protection;
}

function xoaTriggerTheoTenHam_(tenHam) {
  const tenHamChuan = String(tenHam || '').trim();
  if (!tenHamChuan) {
    throw new Error('Thiếu tên hàm để xóa trigger.');
  }

  const triggers = ScriptApp.getProjectTriggers();
  const dsTriggerTrung = triggers.filter(function(trigger) {
    return trigger.getHandlerFunction() === tenHamChuan;
  });

  let soLuongDaXoa = 0;
  let soLuongLoi = 0;

  dsTriggerTrung.forEach(function(trigger) {
    try {
      ScriptApp.deleteTrigger(trigger);
      soLuongDaXoa++;
    } catch (error) {
      soLuongLoi++;
      Logger.log(
        'Không xóa được trigger [%s] | eventType=%s | lỗi=%s',
        tenHamChuan,
        String(trigger.getEventType()),
        error && error.message ? error.message : error
      );
    }
  });

  Logger.log(
    'Đã xử lý xóa trigger [%s] | tổng trigger=%s | trigger trùng=%s | xóa OK=%s | lỗi=%s',
    tenHamChuan,
    triggers.length,
    dsTriggerTrung.length,
    soLuongDaXoa,
    soLuongLoi
  );

  return soLuongDaXoa;
}

function xoaBaoVeSheetVaRange_(sheet) {
  let soRangeDaXoa = 0;
  let soSheetDaXoa = 0;
  let soLoi = 0;

  const protectionsRange = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  protectionsRange.forEach(function(protection) {
    try {
      protection.remove();
      soRangeDaXoa++;
    } catch (e) {
      soLoi++;
      Logger.log('Không xóa được range protection ở sheet %s: %s', sheet.getName(), e);
    }
  });

  const protectionsSheet = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  protectionsSheet.forEach(function(protection) {
    try {
      protection.remove();
      soSheetDaXoa++;
    } catch (e) {
      soLoi++;
      Logger.log('Không xóa được sheet protection ở sheet %s: %s', sheet.getName(), e);
    }
  });

  Logger.log(
    'Đã xử lý protection ở sheet %s | rangeProtection=%s | sheetProtection=%s | lỗi=%s',
    sheet.getName(),
    soRangeDaXoa,
    soSheetDaXoa,
    soLoi
  );

  return {
    sheetName: sheet.getName(),
    soRangeDaXoa: soRangeDaXoa,
    soSheetDaXoa: soSheetDaXoa,
    soLoi: soLoi
  };
}

function xoaEditorKhac_(protection, emailNguoiChay) {
  if (!protection || !emailNguoiChay) {
    return;
  }
  const editors = protection.getEditors();
  editors.forEach(function(user) {
    const email = user.getEmail();
    if (email !== emailNguoiChay) {
      try {
        protection.removeEditor(user);
      } catch (error) {
        Logger.log('Không xóa được editor [%s] khỏi protection: %s', email, error);
      }
    }
  });
}

function layEmailNguoiChayChoProtection_() {
  try {
    var emailHieuLuc = Session.getEffectiveUser().getEmail();
    if (emailHieuLuc) {
      return emailHieuLuc;
    }
  } catch (error) {
    Logger.log('Không lấy được Session.getEffectiveUser(): %s', error);
  }

  try {
    var emailNguoiDung = Session.getActiveUser().getEmail();
    if (emailNguoiDung) {
      return emailNguoiDung;
    }
  } catch (error2) {
    Logger.log('Không lấy được Session.getActiveUser(): %s', error2);
  }

  return '';
}

