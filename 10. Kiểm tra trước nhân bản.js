const KIEM_TRA_TRUOC_NHAN_BAN = {
  BAT_KIEM_TRA_CAU_TRUC: true,
  BAT_KIEM_TRA_NGHIEP_VU: true,
  BAT_KIEM_TRA_HAM_LOI: true,
  BAT_KIEM_TRA_TRIGGER_PROTECTION: true,
  BAT_KIEM_TRA_EMAIL_PHOI_HOP: true,

  // Chỉ bật khi admin chủ động muốn tạo thử trigger trong bước kiểm tra kỹ thuật.
  BAT_TAO_THU_TRIGGER: false,
  BAT_XEM_NHAT_KY_TRIGGER: true
};

function chayKiemTraTruocNhanBan() {
  const batDau = new Date();
  const baoCao = [];
  let soBuocOk = 0;
  let soBuocLoi = 0;

  function chayMotBuoc_(tenBuoc, hamCanChay) {
    try {
      Logger.log('===== BAT DAU: %s =====', tenBuoc);
      const ketQua = hamCanChay();
      Logger.log('===== OK: %s | %s =====', tenBuoc, ketQua || '');
      baoCao.push(['OK', tenBuoc, ketQua || '']);
      soBuocOk++;
    } catch (loi) {
      Logger.log('===== LOI: %s =====', tenBuoc);
      Logger.log(loi && loi.stack ? loi.stack : loi);
      baoCao.push([
        'LOI',
        tenBuoc,
        loi && loi.message ? loi.message : String(loi)
      ]);
      soBuocLoi++;
    }
  }

  try {
    const ss = layBangTinhDangMo_();
    Logger.log('==============================');
    Logger.log('BAT DAU chayKiemTraTruocNhanBan');
    Logger.log('File: %s', ss.getName());
    Logger.log('Thoi gian: %s', batDau);

    chayMotBuoc_('Kiem tra ham loi can giu de nhan ban', function() {
      return kiemTraHamLoiTruocNhanBan_();
    });

    chayMotBuoc_('Kiem tra du lieu co ban cua file dang mo', function() {
      return kiemTraDuLieuNenToiThieu_();
    });

    if (KIEM_TRA_TRUOC_NHAN_BAN.BAT_KIEM_TRA_CAU_TRUC) {
      chayMotBuoc_('Kiem tra cau truc - Buoc 2', function() {
        chayKiemTraCauTruc_Buoc2();
        return 'Da chay xong Buoc 2';
      });

      chayMotBuoc_('Kiem tra cau truc - Buoc 3', function() {
        chayKiemTraCauTruc_Buoc3();
        return 'Da chay xong Buoc 3';
      });
    }

    if (KIEM_TRA_TRUOC_NHAN_BAN.BAT_KIEM_TRA_NGHIEP_VU) {
      chayMotBuoc_('Kiem tra nghiep vu - Buoc 4.2', function() {
        chayKiemTraNghiepVu_Buoc4_2();
        return 'Da chay xong Buoc 4.2';
      });
    }

    if (KIEM_TRA_TRUOC_NHAN_BAN.BAT_KIEM_TRA_TRIGGER_PROTECTION) {
      chayMotBuoc_('Kiem tra ham protection con giu', function() {
  const dsHamCanCo = [
    'layDanhSachVungMoTheoThoiGian_',
    'layCacMocThoiGianSheetThang_',
    'layDanhSachMocTriggerProtection_',
    'xoaTriggerProtectionCu',
    'taoTriggerProtectionMoi',
    'xoaTriggerProtectionCu',
    'xemNhatKyTriggerProtection'
  ];

  const dsHamThieu = dsHamCanCo.filter(function(tenHam) {
    return typeof this[tenHam] !== 'function';
  }, this);

  if (dsHamThieu.length) {
    throw new Error('Thiếu hàm protection: ' + dsHamThieu.join(', '));
  }

  return 'Du ' + dsHamCanCo.length + ' ham protection dang dung';
});

chayMotBuoc_('Kiem tra tao danh sach moc trigger protection', function() {
  const danhSachMoc = layDanhSachMocTriggerProtection_();

  if (!Array.isArray(danhSachMoc)) {
    throw new Error('layDanhSachMocTriggerProtection_ khong tra ve mang.');
  }

  return 'So moc trigger protection: ' + danhSachMoc.length;
});

      if (KIEM_TRA_TRUOC_NHAN_BAN.BAT_TAO_THU_TRIGGER) {
        chayMotBuoc_('Tao trigger protection moi', function() {
          taoTriggerProtectionMoi();
          return 'Da tao trigger protection moi';
        });
      }

      if (KIEM_TRA_TRUOC_NHAN_BAN.BAT_XEM_NHAT_KY_TRIGGER) {
        chayMotBuoc_('Xem nhat ky trigger protection', function() {
          xemNhatKyTriggerProtection();
          return 'Da log nhat ky trigger protection';
        });
      }
    }

    if (KIEM_TRA_TRUOC_NHAN_BAN.BAT_KIEM_TRA_EMAIL_PHOI_HOP) {
      chayMotBuoc_('Kiem tra cau hinh email phoi hop', function() {
        return kiemTraEmailPhoiHopTruocNhanBan_();
      });
    }

    Logger.log('==============================');
    Logger.log('KET THUC chayKiemTraTruocNhanBan');
    Logger.log('So buoc OK: %s', soBuocOk);
    Logger.log('So buoc LOI: %s', soBuocLoi);
    Logger.log('Bao cao tong hop: %s', JSON.stringify(baoCao));

    if (soBuocLoi > 0) {
      throw new Error(
        'Tong kiem tra co ' + soBuocLoi + ' buoc loi. CHUA nen nhan ban.'
      );
    }

    ss.toast(
      'Kiểm tra trước nhân bản hoàn tất. OK: ' + soBuocOk + ' | Lỗi: ' + soBuocLoi,
      'Kiểm tra trước nhân bản',
      7
    );

    Logger.log('Tat ca buoc deu OK. Co the sang buoc nhan ban 14 phong ban.');
  } catch (loiTong) {
    Logger.log('LOI TONG: %s', loiTong && loiTong.stack ? loiTong.stack : loiTong);
    throw loiTong;
  }
}

function kiemTraHamLoiTruocNhanBan_() {
  const danhSachHamBatBuoc = [
    'layBangTinhDangMo_',
    'taoHoacLamMoiSheetConfig',
    'dongBoDropdownVaDinhDang',
    'chayToMau',
    'baoVeBieuMau',
    'taoTriggerProtectionMoi',
    'xoaTriggerProtectionCu',
    'taoTriggerGuiEmailPhoiHop',
    'xoaTriggerGuiEmailPhoiHop',
    'thietLapVaKhoiTaoFileHienTai',
    'batToanBoTrigger',
    'tatToanBoTrigger'
  ];

  const dsHamThieu = danhSachHamBatBuoc.filter(function(tenHam) {
    return typeof this[tenHam] !== 'function';
  }, this);

  if (dsHamThieu.length > 0) {
    throw new Error(
      'Thiếu hàm lõi trước nhân bản: ' + dsHamThieu.join(', ')
    );
  }

  Logger.log('Da xac nhan du cac ham loi: %s', danhSachHamBatBuoc.join(', '));
  return 'Du ' + danhSachHamBatBuoc.length + ' ham loi';
}

function kiemTraDuLieuNenToiThieu_() {
  const ss = layBangTinhDangMo_();
  const sheetData = ss.getSheetByName(CAU_HINH_UNG_DUNG.TEN_SHEET.DATA);

  if (!sheetData) {
    throw new Error('Thiếu sheet Data.');
  }

  const config = docCauHinh_(ss);
  const system = laySystemConfig_(config);

  if (!config || typeof config !== 'object') {
    throw new Error('Canonical config không đọc được.');
  }

  if (!String(system.data_sheet_name || '').trim()) {
    throw new Error('Canonical config thiếu system.data_sheet_name.');
  }

  if (!String(system.month_sheet_regex_raw || '').trim()) {
    throw new Error('Canonical config thiếu system.month_sheet_regex.');
  }

  const dsSheetThang = layDanhSachSheetThang_(ss, config);
  if (!dsSheetThang || dsSheetThang.length === 0) {
    throw new Error('Không tìm thấy sheet tháng hợp lệ theo canonical config.');
  }

  const tenSheetMau = dsSheetThang[0].getName();

  Logger.log(
    'File dang mo hop le | dataSheet: %s | soSheetThang: %s | sheetMau: %s',
    system.data_sheet_name,
    dsSheetThang.length,
    tenSheetMau
  );

  return 'Có Data + canonical config hợp lệ + ' + dsSheetThang.length + ' sheet tháng';
}

function kiemTraEmailPhoiHopTruocNhanBan_() {
  const props = PropertiesService.getScriptProperties();
  const dsTrigger = ScriptApp.getProjectTriggers();

  const soTriggerLich = dsTrigger.filter(function(trigger) {
    return trigger.getHandlerFunction() === 'guiEmailPhoiHopTheoLich';
  }).length;

  const giaTriTatMail = props.getProperty('EMAIL_PHOI_HOP_DISABLED');
  const giaTriMenu = props.getProperty('ADMIN_MENU_ENABLED');

  Logger.log(
    'Email phối hợp | trigger theo lịch: %s | EMAIL_PHOI_HOP_DISABLED: %s | ADMIN_MENU_ENABLED: %s',
    soTriggerLich,
    giaTriTatMail,
    giaTriMenu
  );

  return (
    'Trigger email - theo lich: ' + soTriggerLich
  );
}
