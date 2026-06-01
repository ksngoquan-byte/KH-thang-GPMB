// Safe test helpers to inspect each subsystem without changing existing business logic.

function test_01_TongQuanHeThong() {
  return chayBoTestHeThong_([
    test_01_01_ThongTinFileVaSheet_,
    test_01_02_ThongTinConfig_,
    test_01_03_ThongTinTriggerHienTai_
  ], 'test_01_TongQuanHeThong');
}

function test_02_CauHinhVaSheetThang() {
  return chayBoTestHeThong_([
    test_02_01_DocConfigVaSystem_,
    test_02_02_LietKeSheetThang_,
    test_02_03_KiemTraDataSheet_
  ], 'test_02_CauHinhVaSheetThang');
}

function test_03_EmailPhoiHop_AnToan() {
  return chayBoTestHeThong_([
    test_03_01_CauHinhEmailPhoiHop_,
    test_03_02_BanDoPhongBanVaNhanSu_,
    test_03_03_PhanTichTenSheetEmail_,
    test_03_04_MoPhongNoiDungMailPhoiHop_V2_,
    test_03_05_SoiCotI_PhoiHopSheetHienTai_
  ], 'test_03_EmailPhoiHop_AnToan');
}

function test_04_ProtectionVaTrigger_AnToan() {
  return chayBoTestHeThong_([
    test_04_01_MocProtection_,
    test_04_02_TriggerRegistryProtection_,
    test_04_03_TriggerEmailPhoiHop_
  ], 'test_04_ProtectionVaTrigger_AnToan');
}

function test_05_PreflightDayDu() {
  return chayBoTestHeThong_([
    function() {
      return {
        ten: 'preflight_nhan_ban',
        duLieu: chayKiemTraTruocNhanBan()
      };
    }
  ], 'test_05_PreflightDayDu');
}

function test_06_EmailPhoiHop_GhiPendingThu() {
  return {
    ten: 'email_phoi_hop_thu_cong',
    duLieu: {
      moHinh: 'gui_tay_bang_menu',
      menuPhoiHop: 'guiTongHopPhoiHopThuCongChoSheetHienTai',
      menuPhatSinh: 'guiTongHopPhatSinhTrongKyThuCongChoSheetHienTai',
      menuNoiBo: 'guiTongHopNoiBoThuCongChoSheetHienTai'
    }
  };
}

function test_07_CongViecTon_TheoSheetHienTai() {
  var ss = layBangTinhDangMo_();
  var sheet = ss.getActiveSheet();
  var config = docCauHinh_(ss);

  if (!laSheetThangDongBo_(sheet, config)) {
    throw new Error('Sheet Ä‘ang má»Ÿ khÃ´ng pháº£i sheet thÃ¡ng há»£p lá»‡ Ä‘á»ƒ soi cÃ´ng viá»‡c tá»“n.');
  }

  var tapTrangThaiCongViecTon = layTapTrangThaiCongViecTon_(ss, config);
  var banDoCongViecTon = layBanDoCongViecTonTheoNhom_(sheet, config, tapTrangThaiCongViecTon);
  var dsMaNhom = hopNhatDanhSachMaNhomDongBo_(Object.keys(banDoCongViecTon), []);

  var ketQua = {
    ten: 'cong_viec_ton_theo_sheet_hien_tai',
    duLieu: {
      sheet: sheet.getName(),
      trangThaiNguon: Object.keys(tapTrangThaiCongViecTon).sort(),
      tongNhomCoViecTon: dsMaNhom.length,
      nhom: dsMaNhom.map(function(maNhom) {
        var ds = banDoCongViecTon[maNhom] || [];
        return {
          maNhom: maNhom,
          soLuong: ds.length,
          dongNguon: ds.map(function(item) { return item.soDongNguon; }),
          cotB: ds.map(function(item) { return item.giaTriB; }),
          cotC: ds.map(function(item) { return item.giaTriC; }),
          cotH: ds.map(function(item) { return item.giaTriH; }),
          cotI: ds.map(function(item) { return item.giaTriI; }),
          cotN: ds.map(function(item) { return item.giaTriN; })
        };
      })
    }
  };

  Logger.log('[TEST] test_07_CongViecTon_TheoSheetHienTai => %s', JSON.stringify(ketQua));
  return ketQua;
}

function test_07_01_DumpDongSheetHienTai_CongViecTon() {
  var ss = layBangTinhDangMo_();
  var sheet = ss.getActiveSheet();
  var config = docCauHinh_(ss);
  var tapTrangThaiCongViecTon = layTapTrangThaiCongViecTon_(ss, config);
  var dongCuoi = Math.min(sheet.getLastRow(), 40);
  var range = sheet.getRange(1, 1, dongCuoi, Math.max(sheet.getLastColumn(), 14));
  var displayValues = range.getDisplayValues();
  var rawValues = range.getValues();
  var dongBatDauQuet = layDongBatDauQuetNhomDongBo_(sheet);
  var duLieu = [];

  for (var r = dongBatDauQuet - 1; r < displayValues.length; r++) {
    var soDong = r + 1;
    var giaTriA = String(displayValues[r][0] || '').trim();
    var giaTriB = String(displayValues[r][1] || '').trim();
    var giaTriC = String(displayValues[r][2] || '').trim();
    var giaTriN = String(rawValues[r][13] || '').trim();
    var trangThaiDaChuanHoa = chuanHoaTrangThaiCongViecTon_(giaTriN);

    duLieu.push({
      soDong: soDong,
      cotA: giaTriA,
      cotB: giaTriB,
      cotC: giaTriC,
      cotN: giaTriN,
      cotNChuanHoa: trangThaiDaChuanHoa,
      laTieuDeNhom: laDongTieuDeNhomDongBo_(giaTriA, giaTriB),
      laDongCongViecCon: laDongCongViecConDongBo_(giaTriA, giaTriB, giaTriC),
      laTrangThaiTon: laTrangThaiCongViecTon_(giaTriN, tapTrangThaiCongViecTon)
    });
  }

  Logger.log('[TEST] test_07_01_DumpDongSheetHienTai_CongViecTon => %s', JSON.stringify({
    sheet: sheet.getName(),
    trangThaiNguon: Object.keys(tapTrangThaiCongViecTon).sort(),
    duLieu: duLieu
  }));

  return {
    ten: 'dump_dong_sheet_hien_tai_cong_viec_ton',
    duLieu: {
      sheet: sheet.getName(),
      trangThaiNguon: Object.keys(tapTrangThaiCongViecTon).sort(),
      duLieu: duLieu
    }
  };
}

function test_07_02_DocCotN_SheetHienTai() {
  var ss = layBangTinhDangMo_();
  var sheet = ss.getActiveSheet();
  var dongBatDau = 6;
  var dongKetThuc = Math.min(sheet.getLastRow(), 20);
  var duLieu = [];

  for (var soDong = dongBatDau; soDong <= dongKetThuc; soDong++) {
    var oN = sheet.getRange(soDong, 14);
    duLieu.push({
      soDong: soDong,
      a: String(sheet.getRange(soDong, 1).getDisplayValue() || '').trim(),
      b: String(sheet.getRange(soDong, 2).getDisplayValue() || '').trim(),
      c: String(sheet.getRange(soDong, 3).getDisplayValue() || '').trim(),
      n_getValue: String(oN.getValue() || '').trim(),
      n_getDisplayValue: String(oN.getDisplayValue() || '').trim(),
      n_getFormula: String(oN.getFormula() || '').trim()
    });
  }

  var ketQua = {
    ten: 'doc_cot_n_sheet_hien_tai',
    duLieu: {
      sheet: sheet.getName(),
      dongBatDau: dongBatDau,
      dongKetThuc: dongKetThuc,
      duLieu: duLieu
    }
  };

  Logger.log('[TEST] test_07_02_DocCotN_SheetHienTai => %s', JSON.stringify(ketQua));
  return ketQua;
}

function test_07_03_DocVungMNO_SheetHienTai() {
  var ss = layBangTinhDangMo_();
  var sheet = ss.getActiveSheet();
  var dongBatDau = 6;
  var dongKetThuc = Math.min(sheet.getLastRow(), 20);
  var duLieu = [];

  for (var soDong = dongBatDau; soDong <= dongKetThuc; soDong++) {
    var vung = sheet.getRange(soDong, 13, 1, 3);
    var raw = vung.getValues()[0];
    var display = vung.getDisplayValues()[0];

    duLieu.push({
      soDong: soDong,
      a: String(sheet.getRange(soDong, 1).getDisplayValue() || '').trim(),
      b: String(sheet.getRange(soDong, 2).getDisplayValue() || '').trim(),
      c: String(sheet.getRange(soDong, 3).getDisplayValue() || '').trim(),
      m_getValue: String(raw[0] || '').trim(),
      m_getDisplayValue: String(display[0] || '').trim(),
      n_getValue: String(raw[1] || '').trim(),
      n_getDisplayValue: String(display[1] || '').trim(),
      o_getValue: String(raw[2] || '').trim(),
      o_getDisplayValue: String(display[2] || '').trim()
    });
  }

  var ketQua = {
    ten: 'doc_vung_mno_sheet_hien_tai',
    duLieu: {
      sheet: sheet.getName(),
      dongBatDau: dongBatDau,
      dongKetThuc: dongKetThuc,
      duLieu: duLieu
    }
  };

  Logger.log('[TEST] test_07_03_DocVungMNO_SheetHienTai => %s', JSON.stringify(ketQua));
  return ketQua;
}

function test_07_04_XacDinhCotDanhGia_ThucTe() {
  var ss = layBangTinhDangMo_();
  var sheet = ss.getActiveSheet();
  var dongHeader = 4;
  var cotBatDau = 11; // K
  var soCot = 6; // K:P
  var headers = sheet.getRange(dongHeader, cotBatDau, 1, soCot).getDisplayValues()[0];
  var dataRange = sheet.getRange(6, cotBatDau, Math.min(Math.max(sheet.getLastRow() - 5, 0), 10), soCot);
  var displayValues = dataRange.getDisplayValues();
  var rawValues = dataRange.getValues();
  var validations = dataRange.getDataValidations();
  var duLieu = [];

  for (var r = 0; r < displayValues.length; r++) {
    var dong = 6 + r;
    var item = { soDong: dong };
    for (var c = 0; c < soCot; c++) {
      var cotSo = cotBatDau + c;
      var tenCot = String.fromCharCode(64 + cotSo);
      item[tenCot + '_header'] = String(headers[c] || '').trim();
      item[tenCot + '_display'] = String(displayValues[r][c] || '').trim();
      item[tenCot + '_value'] = String(rawValues[r][c] || '').trim();
      item[tenCot + '_hasValidation'] = !!validations[r][c];
    }
    duLieu.push(item);
  }

  var ketQua = {
    ten: 'xac_dinh_cot_danh_gia_thuc_te',
    duLieu: {
      sheet: sheet.getName(),
      dongHeader: dongHeader,
      vungKDenP: duLieu
    }
  };

  Logger.log('[TEST] test_07_04_XacDinhCotDanhGia_ThucTe => %s', JSON.stringify(ketQua));
  return ketQua;
}

function test_03_04_MoPhongNoiDungMailPhoiHop_V2_() {
  var sheet = testTimSheetThangDauTien_();
  if (!sheet) {
    throw new Error('Khong co sheet thang de mo phong mail.');
  }

  var thongTinSheet = tachThongTinPhongBanVaThangTuTenSheet_(sheet.getName());
  var ketQua = taoNoiDungMailTongHopPhoiHopChoMotSheet_({
    tenSheet: sheet.getName(),
    phongLapKeHoach: thongTinSheet ? thongTinSheet.phongLapKeHoach : '',
    thangKeHoach: thongTinSheet ? thongTinSheet.thangKeHoachText : '',
    thoiDiemChotText: '8h ngÃ y 26/04/2026',
    dsDoiTuongNhan: ['PhÃ²ng A', 'PhÃ²ng B'],
    dsCongViec: [
      {
        loai: 'Káº¿ hoáº¡ch thÃ¡ng',
        noiDung: 'CÃ´ng viá»‡c máº«u',
        maDuAn: 'DA-001',
        mucTieuCuThe: 'HoÃ n thiá»‡n ná»™i dung phá»‘i há»£p máº«u',
        capUuTien: 'UT1',
        thoiHanText: '05/04/2026',
        chuTri: 'Nguyá»…n VÄƒn A',
        doiTuongPhoiHop: 'PhÃ²ng A, PhÃ²ng B',
        dsDoiTuongPhoiHop: ['PhÃ²ng A', 'PhÃ²ng B']
      }
    ]
  });

  return {
    ten: 'mo_phong_noi_dung_mail_phoi_hop',
    duLieu: {
      tieuDe: ketQua.tieuDe,
      textPreview: ketQua.noiDungText.substring(0, 400),
      htmlPreview: ketQua.noiDungHtml.substring(0, 600)
    }
  };
}
function test_03_05_SoiCotI_PhoiHopSheetHienTai_() {
  var ss = layBangTinhEmailPhoiHop_();
  var sheet = ss.getActiveSheet();
  var tenSheet = sheet ? sheet.getName() : '';
  if (!sheet || !laSheetThangEmailHopLe_(tenSheet)) {
    throw new Error('Sheet Ä‘ang má»Ÿ khÃ´ng pháº£i sheet thÃ¡ng há»£p lá»‡ Ä‘á»ƒ soi cá»™t I.');
  }

  var thongTinSheet = tachThongTinPhongBanVaThangTuTenSheet_(tenSheet) || {};
  var sheetData = ss.getSheetByName(CAU_HINH_EMAIL_PHOI_HOP.tenSheetData);
  if (!sheetData) {
    throw new Error('KhÃ´ng tÃ¬m tháº¥y sheet Data.');
  }

  var banDoPhongBan = taoBanDoPhongBanEmail_(sheetData);
  var dongCuoi = timDongTruocTongTheoCotA_Email_(sheet);
  var soDong = Math.max(0, dongCuoi - CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet + 1);
  var duLieu = [];

  if (soDong > 0) {
    var values = sheet.getRange(
      CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet,
      1,
      soDong,
      CAU_HINH_EMAIL_PHOI_HOP.cotPhoiHop
    ).getDisplayValues();

    for (var i = 0; i < values.length; i++) {
      var soDongThuc = CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet + i;
      var noiDung = String(values[i][CAU_HINH_EMAIL_PHOI_HOP.cotNoiDung - 1] || '').trim();
      var phoiHop = String(values[i][CAU_HINH_EMAIL_PHOI_HOP.cotPhoiHop - 1] || '').trim();
      if (!noiDung || !phoiHop) {
        continue;
      }

      var dsKhoi = layDanhSachKhoiPhoiHopTheoMasterData_(
        phoiHop,
        banDoPhongBan,
        thongTinSheet.phongLapKeHoach || ''
      );

      duLieu.push({
        soDong: soDongThuc,
        noiDung: noiDung,
        cotI: phoiHop,
        khop: dsKhoi.map(function(item) { return item.tenPhong; }),
        email: dsKhoi.map(function(item) { return item.email; })
      });
    }
  }

  return {
    ten: 'soi_cot_i_phoi_hop_sheet_hien_tai',
    duLieu: {
      sheet: tenSheet,
      phongLoaiTru: thongTinSheet.phongLapKeHoach || '',
      soDongCoPhoiHop: duLieu.length,
      duLieu: duLieu
    }
  };
}

function test_99_ChayTatCaBoTestAnToan() {
  return {
    tongQuan: test_01_TongQuanHeThong(),
    cauHinhVaSheet: test_02_CauHinhVaSheetThang(),
    emailPhoiHop: test_03_EmailPhoiHop_AnToan(),
    protectionVaTrigger: test_04_ProtectionVaTrigger_AnToan()
  };
}

function chayBoTestHeThong_(danhSachHamTest, tenBoTest) {
  var ketQua = [];

  danhSachHamTest.forEach(function(hamTest) {
    try {
      var duLieu = hamTest();
      ketQua.push(testDongKetQua_('OK', duLieu.ten, duLieu.duLieu));
    } catch (loi) {
      ketQua.push(testDongKetQua_('LOI', hamTest.name || 'anonymous_test', {
        message: loi && loi.message ? loi.message : String(loi),
        stack: loi && loi.stack ? loi.stack : ''
      }));
    }
  });

  Logger.log('[TEST] %s => %s', tenBoTest, JSON.stringify(ketQua));
  return ketQua;
}

function testDongKetQua_(trangThai, ten, duLieu) {
  return {
    trangThai: trangThai,
    ten: ten,
    duLieu: duLieu
  };
}

function testTimSheetThangDauTien_() {
  var ss = layBangTinhDangMo_();
  var config = docCauHinh_(ss);
  var dsSheet = layDanhSachSheetThang_(ss, config);
  return dsSheet.length ? dsSheet[0] : null;
}

function test_01_01_ThongTinFileVaSheet_() {
  var ss = layBangTinhDangMo_();
  return {
    ten: 'thong_tin_file_va_sheet',
    duLieu: {
      tenFile: ss.getName(),
      fileId: ss.getId(),
      soSheet: ss.getSheets().length,
      danhSachSheet: ss.getSheets().map(function(sheet) {
        return sheet.getName();
      })
    }
  };
}

function test_01_02_ThongTinConfig_() {
  var ss = layBangTinhDangMo_();
  var config = docCauHinh_(ss);
  return {
    ten: 'thong_tin_config',
    duLieu: {
      nhomConfig: Object.keys(config || {}).sort(),
      system: laySystemConfig_(config)
    }
  };
}

function test_01_03_ThongTinTriggerHienTai_() {
  var dsTrigger = ScriptApp.getProjectTriggers().map(function(trigger) {
    return {
      handler: trigger.getHandlerFunction(),
      eventType: String(trigger.getEventType())
    };
  });

  return {
    ten: 'thong_tin_trigger_hien_tai',
    duLieu: dsTrigger
  };
}

function test_02_01_DocConfigVaSystem_() {
  var ss = layBangTinhDangMo_();
  var config = docCauHinh_(ss);
  var system = laySystemConfig_(config);

  return {
    ten: 'doc_config_va_system',
    duLieu: {
      data_sheet_name: system.data_sheet_name || '',
      month_sheet_regex: system.month_sheet_regex_raw || '',
      exclude_sheets: Array.isArray(system.exclude_sheets)
        ? system.exclude_sheets.join(',')
        : (system.exclude_sheets_raw || ''),
      first_data_row: system.first_data_row || '',
      header_row: system.header_row || ''
    }
  };
}

function test_02_02_LietKeSheetThang_() {
  var ss = layBangTinhDangMo_();
  var config = docCauHinh_(ss);
  var dsSheet = layDanhSachSheetThang_(ss, config);

  return {
    ten: 'liet_ke_sheet_thang',
    duLieu: dsSheet.map(function(sheet) {
      return {
        tenSheet: sheet.getName(),
        lastRow: sheet.getLastRow(),
        lastColumn: sheet.getLastColumn()
      };
    })
  };
}

function test_02_03_KiemTraDataSheet_() {
  var ss = layBangTinhDangMo_();
  var config = docCauHinh_(ss);
  var sheet = ss.getSheetByName(CAU_HINH_UNG_DUNG.TEN_SHEET.DATA);
  if (!sheet) {
    throw new Error('Khong tim thay sheet Data.');
  }

  var ruleMaDuAn = timValidationRuleTheoField_(config, 'ma_du_an_dropdown');
  var ruleChuTri = timValidationRuleTheoField_(config, 'chu_tri');
  var rulePhoiHop = timValidationRuleTheoField_(config, 'phoi_hop');

  return {
    ten: 'kiem_tra_data_sheet',
    duLieu: {
      tenSheet: sheet.getName(),
      lastRow: sheet.getLastRow(),
      lastColumn: sheet.getLastColumn(),
      dataOpenRange: 'J6:P56',
      rangeDropdownMaDuAn: ruleMaDuAn ? ruleMaDuAn.ruleValueRaw : '',
      rangeDropdownChuTri: ruleChuTri ? ruleChuTri.ruleValueRaw : '',
      rangeDropdownPhoiHop: rulePhoiHop ? rulePhoiHop.ruleValueRaw : ''
    }
  };
}

function test_03_01_CauHinhEmailPhoiHop_() {
  return {
    ten: 'cau_hinh_email_phoi_hop',
    duLieu: {
      tenSheetData: CAU_HINH_EMAIL_PHOI_HOP.tenSheetData,
      dryRun: CAU_HINH_TONG_HOP_PHOI_HOP.DRY_RUN
    }
  };
}

function test_03_02_BanDoPhongBanVaNhanSu_() {
  var ss = layBangTinhEmailPhoiHop_();
  var sheetData = ss.getSheetByName(CAU_HINH_EMAIL_PHOI_HOP.tenSheetData);
  if (!sheetData) {
    throw new Error('Khong tim thay sheet Data.');
  }

  var banDoPhongBan = taoBanDoPhongBanEmail_(sheetData);
  var banDoNhanSu = layBanDoNhanSuNoiBoTongHop_(sheetData);

  return {
    ten: 'ban_do_phong_ban_va_nhan_su',
    duLieu: {
      soPhongBan: Object.keys(banDoPhongBan).length,
      soNhanSu: Object.keys(banDoNhanSu).length,
      mauPhongBan: Object.keys(banDoPhongBan).slice(0, 5),
      mauNhanSu: Object.keys(banDoNhanSu).slice(0, 5)
    }
  };
}

function test_03_03_PhanTichTenSheetEmail_() {
  var sheet = testTimSheetThangDauTien_();
  if (!sheet) {
    throw new Error('Khong co sheet thang de phan tich.');
  }

  return {
    ten: 'phan_tich_ten_sheet_email',
    duLieu: tachThongTinPhongBanVaThangTuTenSheet_(sheet.getName())
  };
}
function test_04_01_MocProtection_() {
  var dsMoc = layDanhSachMocTriggerProtection_();
  return {
    ten: 'moc_protection',
    duLieu: {
      soMoc: dsMoc.length,
      baMocDau: dsMoc.slice(0, 3)
    }
  };
}

function test_04_02_TriggerRegistryProtection_() {
  var props = PropertiesService.getScriptProperties();
  return {
    ten: 'trigger_registry_protection',
    duLieu: {
      khoaRegistry: KHOA_SCRIPT_PROPERTY_TRIGGER_PROTECTION,
      raw: props.getProperty(KHOA_SCRIPT_PROPERTY_TRIGGER_PROTECTION) || ''
    }
  };
}

function test_04_03_TriggerEmailPhoiHop_() {
  var dsTrigger = ScriptApp.getProjectTriggers().filter(function(trigger) {
    var tenHam = trigger.getHandlerFunction();
    return tenHam === 'guiEmailPhoiHopTheoLich';
  }).map(function(trigger) {
    return {
      handler: trigger.getHandlerFunction(),
      eventType: String(trigger.getEventType())
    };
  });

  return {
    ten: 'trigger_email_phoi_hop',
    duLieu: dsTrigger
  };
}
