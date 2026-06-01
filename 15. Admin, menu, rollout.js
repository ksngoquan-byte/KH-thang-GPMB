// Moved out of 2.Chính.js to reduce file size while keeping public entrypoints unchanged.

function khoiTaoScriptPropertiesMacDinh_() {
  try {
    const props = PropertiesService.getScriptProperties();
    const macDinh = {
      ADMIN_MENU_ENABLED: 'true',
      SETUP_MENU_ENABLED: 'true',
      ADMIN_MAINTENANCE_MODE: 'false'
    };

    Object.keys(macDinh).forEach(function(key) {
      if (props.getProperty(key) === null) {
        props.setProperty(key, macDinh[key]);
        Logger.log('Đã khởi tạo Script Property mặc định: %s=%s', key, macDinh[key]);
      }
    });
  } catch (error) {
    Logger.log('Lỗi khoiTaoScriptPropertiesMacDinh_: %s', error.stack || error);
    throw error;
  }
}

function datScriptPropertyCoLog_(key, value) {
  try {
    PropertiesService.getScriptProperties().setProperty(key, String(value));
    Logger.log('Đã cập nhật Script Property: %s=%s', key, value);
  } catch (error) {
    Logger.log('Lỗi datScriptPropertyCoLog_: %s | %s', key, error.stack || error);
    throw error;
  }
}

function kiemTraTongAdmin() {
  try {
    Logger.log('Bắt đầu kiemTraTongAdmin');
    chayKiemTraTruocNhanBan();
    Logger.log('Hoàn tất kiemTraTongAdmin');
  } catch (error) {
    Logger.log('Lỗi kiemTraTongAdmin: %s', error.stack || error);
    throw error;
  }
}

function ADMIN_MENU_ENABLED_() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_MENU_ENABLED') !== 'false';
}

function SETUP_MENU_ENABLED_() {
  return PropertiesService.getScriptProperties().getProperty('SETUP_MENU_ENABLED') !== 'false';
}

function laCheDoBaoTriAdmin_() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_MAINTENANCE_MODE') === 'true';
}

function yeuCauCheDoBaoTriAdmin_(tenHam) {
  if (!laCheDoBaoTriAdmin_()) {
    throw new Error(
      'Hàm ' + tenHam + ' chỉ chạy khi ADMIN_MAINTENANCE_MODE=true. Hãy chạy batCheDoBaoTriAdmin() trước.'
    );
  }
}

function thietLapVaKhoiTaoFileHienTai() {
  try {
    khoiTaoScriptPropertiesMacDinh_();
    Logger.log('Bắt đầu thietLapVaKhoiTaoFileHienTai');

    taoHoacLamMoiSheetConfig();

    const ss = layBangTinhDangMo_();
    ss.toast('Đã tạo/làm mới sheet cấu hình. Tiếp tục bước 3.2 trong Giai đoạn 1.', 'Cài đặt KH tháng', 5);

    Logger.log('Hoàn tất thietLapVaKhoiTaoFileHienTai');
  } catch (error) {
    Logger.log('Lỗi thietLapVaKhoiTaoFileHienTai: %s', error.stack || error);
    throw error;
  }
}

function taoLamMoiSheetConfigAdmin() {
  try {
    Logger.log('Bắt đầu taoLamMoiSheetConfigAdmin');
    const ketQua = taoHoacLamMoiSheetConfig();
    const ss = layBangTinhDangMo_();
    ss.toast('Đã tạo/làm mới sheet cấu hình.', 'Quản lý KH tháng', 5);
    Logger.log('Hoàn tất taoLamMoiSheetConfigAdmin');
    return ketQua;
  } catch (error) {
    Logger.log('Lỗi taoLamMoiSheetConfigAdmin: %s', error.stack || error);
    throw error;
  }
}

function damBaoSheetPhoiHopAdmin() {
  try {
    Logger.log('Bắt đầu damBaoSheetPhoiHopAdmin');
    const ketQua = damBaoSheetPhuTroEmailPhoiHop_();
    const ss = layBangTinhDangMo_();
    ss.toast('Đã tạo/kiểm tra sheet phụ trợ email phối hợp.', 'Quản lý KH tháng', 5);
    Logger.log('Hoàn tất damBaoSheetPhoiHopAdmin');
    return ketQua;
  } catch (error) {
    Logger.log('Lỗi damBaoSheetPhoiHopAdmin: %s', error.stack || error);
    throw error;
  }
}

function dongBoDropdownVaDinhDangAdmin() {
  try {
    Logger.log('Bắt đầu dongBoDropdownVaDinhDangAdmin');
    const ketQua = dongBoDropdownVaDinhDang();
    const ss = layBangTinhDangMo_();
    ss.toast('Đã đồng bộ dropdown và định dạng.', 'Quản lý KH tháng', 5);
    Logger.log('Hoàn tất dongBoDropdownVaDinhDangAdmin');
    return ketQua;
  } catch (error) {
    Logger.log('Lỗi dongBoDropdownVaDinhDangAdmin: %s', error.stack || error);
    throw error;
  }
}

function taoHoacCapNhatSheetData2Admin() {
  try {
    Logger.log('Bắt đầu taoHoacCapNhatSheetData2Admin');
    const ketQua = taoHoacCapNhatSheetData2_();
    const ss = layBangTinhDangMo_();
    ss.toast('Đã tạo/cập nhật sheet Data (2). Tiếp tục bước 3.3 trong Giai đoạn 1.', 'Cài đặt KH tháng', 5);
    Logger.log('Hoàn tất taoHoacCapNhatSheetData2Admin');
    return ketQua;
  } catch (error) {
    Logger.log('Lỗi taoHoacCapNhatSheetData2Admin: %s', error.stack || error);
    throw error;
  }
}

function apDungDropdownChinhAdmin() {
  try {
    Logger.log('Bắt đầu apDungDropdownChinhAdmin');
    const ss = layBangTinhDangMo_();
    const config = docCauHinh_(ss);
    const dsSheetThang = layDanhSachSheetThang_(ss, config);
    const ketQua = apDungDropdown_(ss, config, dsSheetThang);
    ss.toast('Đã đồng bộ dropdown dữ liệu chính.', 'Cài đặt KH tháng', 5);
    Logger.log('Hoàn tất apDungDropdownChinhAdmin');
    return ketQua;
  } catch (error) {
    Logger.log('Lỗi apDungDropdownChinhAdmin: %s', error.stack || error);
    throw error;
  }
}

function apDungDropdownCapCongViecAdmin() {
  try {
    Logger.log('Bắt đầu apDungDropdownCapCongViecAdmin');
    const ss = layBangTinhDangMo_();
    const config = docCauHinh_(ss);
    const dsSheetThang = layDanhSachSheetThang_(ss, config);
    const ketQua = apDungDropdownCapCongViec_(ss, config, dsSheetThang);
    ss.toast('Đã đồng bộ dropdown cấp công việc.', 'Cài đặt KH tháng', 5);
    Logger.log('Hoàn tất apDungDropdownCapCongViecAdmin');
    return ketQua;
  } catch (error) {
    Logger.log('Lỗi apDungDropdownCapCongViecAdmin: %s', error.stack || error);
    throw error;
  }
}

function apDungDinhDangAdmin() {
  try {
    Logger.log('Bắt đầu apDungDinhDangAdmin');
    const ss = layBangTinhDangMo_();
    const config = docCauHinh_(ss);
    const dsSheetThang = layDanhSachSheetThang_(ss, config);
    const ketQua = apDungDinhDang_(ss, config, dsSheetThang);
    ss.toast('Đã áp dụng định dạng dữ liệu.', 'Cài đặt KH tháng', 5);
    Logger.log('Hoàn tất apDungDinhDangAdmin');
    return ketQua;
  } catch (error) {
    Logger.log('Lỗi apDungDinhDangAdmin: %s', error.stack || error);
    throw error;
  }
}

function apDungDinhDangNgayAdmin() {
  return apDungDinhDangTheoFieldAdmin_(
    ['thoi_han', 'ngay_hoan_thanh'],
    'Đã áp dụng định dạng ngày.'
  );
}

function apDungDinhDangNganSachAdmin() {
  return apDungDinhDangTheoFieldAdmin_(
    ['ngan_sach_ke_hoach', 'ngan_sach_thuc_hien'],
    'Đã áp dụng định dạng ngân sách.'
  );
}

function apDungDinhDangTheoFieldAdmin_(fieldNames, toastMessage) {
  try {
    Logger.log('Bắt đầu apDungDinhDangTheoFieldAdmin_ | fields=%s', JSON.stringify(fieldNames || []));
    const ss = layBangTinhDangMo_();
    const config = docCauHinh_(ss);
    const dsSheetThang = layDanhSachSheetThang_(ss, config);
    var soRule = 0;

    FORMAT_RULE_FIELDS_.forEach(function(ruleMeta) {
      if ((fieldNames || []).indexOf(ruleMeta.fieldName) === -1) {
        return;
      }
      const ruleConfig = timFormatRuleTheoField_(config, ruleMeta.fieldName);
      if (!ruleConfig) {
        Logger.log('Bỏ qua format %s vì không có cấu hình', ruleMeta.fieldName);
        return;
      }
      apDungMotRuleDinhDang_(config, ruleConfig, ruleMeta, dsSheetThang);
      soRule++;
    });

    ss.toast(toastMessage, 'Cài đặt KH tháng', 5);
    Logger.log('Hoàn tất apDungDinhDangTheoFieldAdmin_ | soRule=%s', soRule);
    return { ok: true, soRule: soRule };
  } catch (error) {
    Logger.log('Lỗi apDungDinhDangTheoFieldAdmin_: %s', error.stack || error);
    throw error;
  }
}

function hoanThienThietLapBanDauAdmin() {
  try {
    Logger.log('Bắt đầu hoanThienThietLapBanDauAdmin');
    if (!layBangTinhDangMo_().getSheetByName('CONFIG_CORE')) {
      taoHoacLamMoiSheetConfig();
    }
    const ketQuaMaDonVi = khoiTaoDonViTheoFileHienTai({ skipDropdownSync: true, showToast: false });

    const ss = layBangTinhDangMo_();
    ss.toast('Đã khởi tạo mã đơn vị theo file hiện tại. Nên chạy 3.5 để kiểm tra tổng thể Giai đoạn 1.', 'Cài đặt KH tháng', 5);

    Logger.log('Hoàn tất hoanThienThietLapBanDauAdmin');
    return {
      ok: true,
      maDonVi: ketQuaMaDonVi && ketQuaMaDonVi.maDonVi ? ketQuaMaDonVi.maDonVi : ''
    };
  } catch (error) {
    Logger.log('Lỗi hoanThienThietLapBanDauAdmin: %s', error.stack || error);
    throw error;
  }
}

function dongBoDinhDangVaToMauAdmin() {
  try {
    Logger.log('Bắt đầu dongBoDinhDangVaToMauAdmin');
    const ketQuaDropdown = dongBoDropdownVaDinhDang();

    const ss = layBangTinhDangMo_();
    ss.toast('Đã đồng bộ dropdown và định dạng. Có thể chuyển sang Giai đoạn 3 nếu cần khóa biểu mẫu.', 'Cài đặt KH tháng', 5);

    Logger.log('Hoàn tất dongBoDinhDangVaToMauAdmin');
    return {
      ok: true,
      ketQuaDropdown: ketQuaDropdown
    };
  } catch (error) {
    Logger.log('Lỗi dongBoDinhDangVaToMauAdmin: %s', error.stack || error);
    throw error;
  }
}

function toMauSauKhoiTaoAdmin() {
  try {
    Logger.log('Bắt đầu toMauSauKhoiTaoAdmin');
    chayToMau();
    const ss = layBangTinhDangMo_();
    ss.toast('Đã tô màu lại toàn bộ sheet tháng.', 'Cài đặt KH tháng', 5);
    Logger.log('Hoàn tất toMauSauKhoiTaoAdmin');
    return { ok: true };
  } catch (error) {
    Logger.log('Lỗi toMauSauKhoiTaoAdmin: %s', error.stack || error);
    throw error;
  }
}

function baoVeSheetKyThuatSauKhoiTaoAdmin() {
  try {
    Logger.log('Bắt đầu baoVeSheetKyThuatSauKhoiTaoAdmin');
    const ketQua = baoVeCacSheetKyThuatSauKhoiTao_();
    const ss = layBangTinhDangMo_();
    ss.toast('Đã bảo vệ sheet kỹ thuật sau khởi tạo.', 'Cài đặt KH tháng', 5);
    Logger.log('Hoàn tất baoVeSheetKyThuatSauKhoiTaoAdmin');
    return ketQua;
  } catch (error) {
    Logger.log('Lỗi baoVeSheetKyThuatSauKhoiTaoAdmin: %s', error.stack || error);
    throw error;
  }
}

function baoVeConfigCoreAdmin() {
  return baoVeTungSheetAdmin_('CONFIG_CORE', 'Đã bảo vệ sheet CONFIG_CORE.');
}

function baoVeConfigHeaderMapAdmin() {
  return baoVeTungSheetAdmin_('CONFIG_HEADER_MAP', 'Đã bảo vệ sheet CONFIG_HEADER_MAP.');
}

function baoVeConfigValidationAdmin() {
  return baoVeTungSheetAdmin_('CONFIG_VALIDATION', 'Đã bảo vệ sheet CONFIG_VALIDATION.');
}

function baoVeConfigFormatAdmin() {
  return baoVeTungSheetAdmin_('CONFIG_FORMAT', 'Đã bảo vệ sheet CONFIG_FORMAT.');
}

function baoVeSheetDataAdmin() {
  try {
    const ss = layBangTinhDangMo_();
    const sheet = ss.getSheetByName('Data');
    if (!sheet) {
      throw new Error('Không tìm thấy sheet Data.');
    }
    const ketQuaXoa = xoaBaoVeSheetVaRange_(sheet);
    const protectionData = taoProtectionChuanChoSheet_(sheet, 'Bảo vệ sheet Data, chỉ mở J6:P56');
    protectionData.setUnprotectedRanges([sheet.getRange('J6:P56')]);
    ss.toast('Đã bảo vệ sheet Data.', 'Cài đặt KH tháng', 5);
    return {
      ok: true,
      sheetName: 'Data',
      ketQuaXoa: ketQuaXoa
    };
  } catch (error) {
    Logger.log('Lỗi baoVeSheetDataAdmin: %s', error.stack || error);
    throw error;
  }
}

function baoVeSheetData2Admin() {
  const tenSheetData2 = CAU_HINH_UNG_DUNG.TEN_SHEET.DATA_2 || 'Data (2)';
  return baoVeTungSheetAdmin_(tenSheetData2, 'Đã bảo vệ sheet ' + tenSheetData2 + '.');
}

function baoVeSheetMailLogAdmin() {
  const tenSheetMailLog = (typeof CAU_HINH_TONG_HOP_PHOI_HOP !== 'undefined' && CAU_HINH_TONG_HOP_PHOI_HOP.TEN_SHEET_LOG)
    ? CAU_HINH_TONG_HOP_PHOI_HOP.TEN_SHEET_LOG
    : 'MAIL_LOG_PHOI_HOP';
  return baoVeTungSheetAdmin_(tenSheetMailLog, 'Đã bảo vệ sheet ' + tenSheetMailLog + '.');
}

function anSheetKyThuatAdmin() {
  try {
    const ketQua = anCacSheetKyThuat_();
    const ss = layBangTinhDangMo_();
    ss.toast('Đã ẩn các sheet kỹ thuật.', 'Cài đặt KH tháng', 5);
    return ketQua;
  } catch (error) {
    Logger.log('Lỗi anSheetKyThuatAdmin: %s', error.stack || error);
    throw error;
  }
}

function baoVeSheetThangNhom1Admin() {
  return baoVeSheetThangTheoKhoangThangAdmin_(1, 4, 'Đã bảo vệ sheet tháng T01-T04.');
}

function baoVeSheetThangNhom2Admin() {
  return baoVeSheetThangTheoKhoangThangAdmin_(5, 8, 'Đã bảo vệ sheet tháng T05-T08.');
}

function baoVeSheetThangNhom3Admin() {
  return baoVeSheetThangTheoKhoangThangAdmin_(9, 12, 'Đã bảo vệ sheet tháng T09-T12.');
}

function baoVeTungSheetAdmin_(sheetName, toastMessage) {
  try {
    const ss = layBangTinhDangMo_();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('Không tìm thấy sheet ' + sheetName + '.');
    }
    const ketQuaXoa = xoaBaoVeSheetVaRange_(sheet);
    taoProtectionChuanChoSheet_(sheet, 'Bảo vệ toàn bộ sheet ' + sheetName);
    ss.toast(toastMessage, 'Cài đặt KH tháng', 5);
    return {
      ok: true,
      sheetName: sheetName,
      ketQuaXoa: ketQuaXoa
    };
  } catch (error) {
    Logger.log('Lỗi baoVeTungSheetAdmin_: %s', error.stack || error);
    throw error;
  }
}

function baoVeSheetThangTheoKhoangThangAdmin_(thangBatDau, thangKetThuc, toastMessage) {
  try {
    const ss = layBangTinhDangMo_();
    const config = docCauHinh_(ss);
    const dsSheetThang = layDanhSachSheetThang_(ss, config).filter(function(sheet) {
      var thang = layThangTuTenSheet_(sheet.getName());
      return thang !== null && thang >= thangBatDau && thang <= thangKetThuc;
    });
    var soSheetDaBaoVe = 0;

    dsSheetThang.forEach(function(sheet) {
      const ketQuaXoa = xoaBaoVeSheetVaRange_(sheet);
      const protectionSheetThang = taoProtectionChuanChoSheet_(sheet, 'Bảo vệ động toàn sheet tháng ' + sheet.getName());
      const dsVungMo = layDanhSachVungMoTheoThoiGian_(sheet, new Date());
      const dsRangeMo = dsVungMo.map(function(item) {
        return item.range;
      });
      protectionSheetThang.setUnprotectedRanges(dsRangeMo);
      soSheetDaBaoVe++;
      Logger.log(
        'Đã bảo vệ động sheet tháng: %s | rangeProtection=%s | sheetProtection=%s',
        sheet.getName(),
        ketQuaXoa.soRangeDaXoa,
        ketQuaXoa.soSheetDaXoa
      );
    });

    ss.toast(toastMessage, 'Cài đặt KH tháng', 5);
    return {
      ok: true,
      soSheetDaBaoVe: soSheetDaBaoVe,
      thangBatDau: thangBatDau,
      thangKetThuc: thangKetThuc
    };
  } catch (error) {
    Logger.log('Lỗi baoVeSheetThangTheoKhoangThangAdmin_: %s', error.stack || error);
    throw error;
  }
}

function layThangTuTenSheet_(tenSheet) {
  var match = String(tenSheet || '').match(/T(0[1-9]|1[0-2])\.\d{4}/i);
  return match ? Number(match[1]) : null;
}

function xoaTriggerDongBoCongViecTon() {
  try {
    const soLuongDaXoa = xoaTriggerTheoTenHam_('tuDongCapNhatCongViecTon');
    Logger.log('Đã xóa trigger đồng bộ công việc tồn: %s', soLuongDaXoa);
    return soLuongDaXoa;
  } catch (error) {
    Logger.log('Lỗi xoaTriggerDongBoCongViecTon: %s', error.stack || error);
    throw error;
  }
}
function batToanBoTrigger() {
  try {
    khoiTaoScriptPropertiesMacDinh_();

    Logger.log('Bắt đầu batToanBoTrigger');
    taoTriggerProtectionMoi();
    xoaTriggerDongBoCongViecTon();
    taoTriggerGuiEmailPhoiHop();

    const ss = layBangTinhDangMo_();
    ss.toast('Đã bật trigger lõi. Công việc tồn chạy bằng menu thủ công.', 'Quản lý KH tháng', 5);

    Logger.log('Hoàn tất batToanBoTrigger');
  } catch (error) {
    Logger.log('Lỗi batToanBoTrigger: %s', error.stack || error);
    throw error;
  }
}

function tatToanBoTrigger() {
  try {
    Logger.log('Bắt đầu tatToanBoTrigger');
    xoaTriggerProtectionCu();
    xoaTriggerDongBoCongViecTon();
    xoaTriggerGuiEmailPhoiHop();

    const ss = layBangTinhDangMo_();
    ss.toast('Đã tắt toàn bộ trigger.', 'Quản lý KH tháng', 5);

    Logger.log('Hoàn tất tatToanBoTrigger');
  } catch (error) {
    Logger.log('Lỗi tatToanBoTrigger: %s', error.stack || error);
    throw error;
  }
}

function batCheDoBaoTriAdmin() {
  try {
    datScriptPropertyCoLog_('ADMIN_MAINTENANCE_MODE', 'true');

    const ss = layBangTinhDangMo_();
    ss.toast('Đã bật chế độ bảo trì admin.', 'Quản lý KH tháng', 5);

    Logger.log('Đã bật ADMIN_MAINTENANCE_MODE.');
  } catch (error) {
    Logger.log('Lỗi batCheDoBaoTriAdmin: %s', error.stack || error);
    throw error;
  }
}

function tatCheDoBaoTriAdmin() {
  try {
    datScriptPropertyCoLog_('ADMIN_MAINTENANCE_MODE', 'false');

    const ss = layBangTinhDangMo_();
    ss.toast('Đã tắt chế độ bảo trì admin.', 'Quản lý KH tháng', 5);

    Logger.log('Đã tắt ADMIN_MAINTENANCE_MODE.');
  } catch (error) {
    Logger.log('Lỗi tatCheDoBaoTriAdmin: %s', error.stack || error);
    throw error;
  }
}

function toMauLaiToanBoSheetThangAdmin() {
  try {
    const ui = SpreadsheetApp.getUi();
    const nutBam = ui.alert(
      'Xác nhận tô màu lại toàn bộ sheet tháng',
      'Hệ thống sẽ tô màu lại toàn bộ các sheet tháng trong file hiện tại. Chỉ dùng khi cần bảo trì kỹ thuật hoặc đồng bộ lại hiển thị.',
      ui.ButtonSet.OK_CANCEL
    );

    if (nutBam !== ui.Button.OK) {
      Logger.log('Bỏ qua toMauLaiToanBoSheetThangAdmin | nguoi_dung_huy_xac_nhan');
      return { daHuy: true };
    }

    Logger.log('Bắt đầu toMauLaiToanBoSheetThangAdmin');
    chayToMau();

    const ss = layBangTinhDangMo_();
    ss.toast('Đã tô màu lại toàn bộ sheet tháng.', 'Quản lý KH tháng', 5);

    Logger.log('Hoàn tất toMauLaiToanBoSheetThangAdmin');
    return { ok: true };
  } catch (error) {
    Logger.log('Lỗi toMauLaiToanBoSheetThangAdmin: %s', error.stack || error);
    throw error;
  }
}

function baoVeLaiToanBoBieuMauAdmin() {
  try {
    Logger.log('Bắt đầu baoVeLaiToanBoBieuMauAdmin');
    const ketQua = baoVeBieuMau();

    const ss = layBangTinhDangMo_();
    ss.toast('Đã bảo vệ lại toàn bộ biểu mẫu. Có thể bật trigger lõi và ẩn menu cài đặt.', 'Cài đặt KH tháng', 5);

    Logger.log('Hoàn tất baoVeLaiToanBoBieuMauAdmin');
    return ketQua;
  } catch (error) {
    Logger.log('Lỗi baoVeLaiToanBoBieuMauAdmin: %s', error.stack || error);
    throw error;
  }
}

function onOpen() {
  try {
    if (ADMIN_MENU_ENABLED_()) {
      taoMenuQuanLyKeHoachThang_();
      Logger.log('Đã tạo menu vận hành khi mở file.');
    } else {
      Logger.log('ADMIN_MENU_ENABLED=false, bỏ qua tạo menu vận hành.');
    }

    if (SETUP_MENU_ENABLED_()) {
      taoMenuCaiDatKHThang_();
      Logger.log('Đã tạo menu cài đặt khi mở file.');
    } else {
      Logger.log('SETUP_MENU_ENABLED=false, bỏ qua tạo menu cài đặt.');
    }
  } catch (error) {
    Logger.log('Lỗi onOpen: %s', error.stack || error);
    throw error;
  }
}

function taoMenuQuanLyKeHoachThang_() {
  try {
    const ui = SpreadsheetApp.getUi();

    ui.createMenu('📌 Quản lý KH tháng')
      .addSubMenu(
        ui.createMenu('1. 📋 Công tác lập kế hoạch')
          .addItem('1.1. Cập nhật lại STT sau khi đổi cấu trúc', 'chuanHoaCauTrucCongViecSheetHienTai')
          .addItem('1.2. Chuyển việc tồn sang tháng sau', 'dongBoToanBoCongViecTonCuaSheetHienTai')
          .addItem('1.3. Gửi mail yêu cầu phối hợp', 'guiTongHopPhoiHopThuCongChoSheetHienTai')
          .addItem('1.4. Gửi mail nội bộ phòng thông báo danh sách việc', 'guiTongHopNoiBoThuCongChoSheetHienTai')
          .addItem('1.5. Gửi mail thông báo công việc phát sinh', 'guiTongHopPhatSinhTrongKyThuCongChoSheetHienTai')
      )
      .addSubMenu(
        ui.createMenu('2. 📊 Công tác quản lý, báo cáo kế hoạch')
          .addItem('2.1. Kiểm tra công việc quá hạn', 'chayMenu1KiemTraCongViecQuaHan')
          .addItem('2.2. Kiểm tra tình hình thực hiện theo nhân sự', 'chayMenu2TaiTrongNhanSu')
          .addItem('2.3. Rà soát tình hình thực hiện ngân sách', 'showMenu3BudgetPopup')
          .addItem('2.4. Rà soát tổng quan tiến độ trong tháng', 'showMenu4ProgressPopup')
          .addItem('2.5. Báo cáo tổng kết đánh giá cuối tháng', 'showMenu5MonthEndPopup')
      )
      .addToUi();

    Logger.log('Đã tạo menu Quản lý KH tháng.');
  } catch (error) {
    Logger.log('Lỗi taoMenuQuanLyKeHoachThang_: %s', error.stack || error);
    throw error;
  }
}

function taoMenuCaiDatKHThang_() {
  try {
    const ui = SpreadsheetApp.getUi();
    const menuGiaiDoan1 = ui.createMenu('3. Giai đoạn 1 - Kích hoạt an toàn')
      .addItem('3.1. Tạo/làm mới sheet cấu hình', 'thietLapVaKhoiTaoFileHienTai')
      .addItem('3.2. Tạo/cập nhật sheet Data (2)', 'taoHoacCapNhatSheetData2Admin')
      .addItem('3.3. Hoàn thiện sheet phụ trợ email phối hợp', 'damBaoSheetPhoiHopAdmin')
      .addItem('3.4. Khởi tạo mã đơn vị theo file hiện tại', 'hoanThienThietLapBanDauAdmin')
      .addItem('3.5. Kiểm tra tổng thể sau kích hoạt', 'kiemTraTongAdmin');

    const menuGiaiDoan2 = ui.createMenu('4. Giai đoạn 2 - Hoàn thiện dùng hằng ngày')
      .addItem('4.1. Đồng bộ dropdown dữ liệu chính', 'apDungDropdownChinhAdmin')
      .addItem('4.2. Đồng bộ dropdown cấp công việc', 'apDungDropdownCapCongViecAdmin')
      .addItem('4.3. Áp dụng định dạng ngày', 'apDungDinhDangNgayAdmin')
      .addItem('4.4. Áp dụng định dạng ngân sách', 'apDungDinhDangNganSachAdmin')
      .addItem('4.5. Tô màu lại toàn bộ sheet tháng', 'toMauSauKhoiTaoAdmin');

    const menuGiaiDoan3 = ui.createMenu('5. Giai đoạn 3 - Khóa và bàn giao vận hành')
      .addItem('5.1. Bảo vệ sheet CONFIG_CORE', 'baoVeConfigCoreAdmin')
      .addItem('5.2. Bảo vệ sheet CONFIG_HEADER_MAP', 'baoVeConfigHeaderMapAdmin')
      .addItem('5.3. Bảo vệ sheet CONFIG_VALIDATION', 'baoVeConfigValidationAdmin')
      .addItem('5.4. Bảo vệ sheet CONFIG_FORMAT', 'baoVeConfigFormatAdmin')
      .addItem('5.5. Bảo vệ sheet Data', 'baoVeSheetDataAdmin')
      .addItem('5.6. Bảo vệ sheet Data (2)', 'baoVeSheetData2Admin')
      .addItem('5.7. Bảo vệ sheet MAIL_LOG_PHOI_HOP', 'baoVeSheetMailLogAdmin')
      .addItem('5.8. Ẩn các sheet kỹ thuật', 'anSheetKyThuatAdmin')
      .addItem('5.9. Bảo vệ sheet tháng T01-T04', 'baoVeSheetThangNhom1Admin')
      .addItem('5.10. Bảo vệ sheet tháng T05-T08', 'baoVeSheetThangNhom2Admin')
      .addItem('5.11. Bảo vệ sheet tháng T09-T12', 'baoVeSheetThangNhom3Admin')
      .addItem('5.12. Kiểm tra tổng thể trước bàn giao', 'kiemTraTongAdmin')
      .addItem('5.13. Bật trigger lõi', 'batToanBoTrigger')
      .addSeparator()
      .addItem('5.14. Ẩn menu cài đặt', 'anMenuCaiDatAdmin');

    ui.createMenu('⚙️ Cài đặt KH tháng')
      .addSubMenu(menuGiaiDoan1)
      .addSubMenu(menuGiaiDoan2)
      .addSubMenu(menuGiaiDoan3)
      .addToUi();

    Logger.log('Đã tạo menu Cài đặt KH tháng.');
  } catch (error) {
    Logger.log('Lỗi taoMenuCaiDatKHThang_: %s', error.stack || error);
    throw error;
  }
}

function hienThiLaiMenu() {
  try {
    datScriptPropertyCoLog_('ADMIN_MENU_ENABLED', 'true');
    datScriptPropertyCoLog_('SETUP_MENU_ENABLED', 'true');
    taoMenuQuanLyKeHoachThang_();
    taoMenuCaiDatKHThang_();

    const ss = layBangTinhDangMo_();
    ss.toast('Đã bật lại menu vận hành và menu cài đặt.', 'Quản lý KH tháng', 5);

    Logger.log('Đã bật ADMIN_MENU_ENABLED, SETUP_MENU_ENABLED và hiển thị lại các menu.');
  } catch (error) {
    Logger.log('Lỗi hienThiLaiMenu: %s', error.stack || error);
    throw error;
  }
}

function anMenuCaiDatAdmin() {
  try {
    datScriptPropertyCoLog_('SETUP_MENU_ENABLED', 'false');

    const ss = layBangTinhDangMo_();
    ss.toast('Đã ẩn menu cài đặt. Đóng và mở lại file để menu biến mất.', 'Cài đặt KH tháng', 5);

    Logger.log('Đã tắt SETUP_MENU_ENABLED, menu cài đặt sẽ ẩn ở lần mở file kế tiếp.');
  } catch (error) {
    Logger.log('Lỗi anMenuCaiDatAdmin: %s', error.stack || error);
    throw error;
  }
}

function anMenuQuanTriAdmin() {
  return anMenuCaiDatAdmin();
}
function doiTenSheetThangTheoMa_(maCu, maMoi) {
  try {
    const ss = layBangTinhDangMo_();

    const maNguon = String(maCu || '').trim();
    const maDich = String(maMoi || '').trim();

    if (!maNguon) {
      throw new Error('Thiếu mã cũ.');
    }

    if (!maDich) {
      throw new Error('Thiếu mã mới.');
    }

    if (maNguon === maDich) {
      throw new Error('Mã cũ và mã mới đang giống nhau, không cần đổi.');
    }

    const maNguonDaEscape = maNguon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('^' + maNguonDaEscape + '\\s*[–-]\\s*(T(0[1-9]|1[0-2])\\.\\d{4})$');

    const tatCaSheet = ss.getSheets();
    const dsCanDoi = [];
    const dsTenMoiBiTrung = [];

    tatCaSheet.forEach(function(sheet) {
      const tenCu = sheet.getName();
      const match = tenCu.match(regex);

      if (!match) {
        return;
      }

      const phanThangNam = match[1];
      const tenMoi = maDich + ' - ' + phanThangNam;

      if (ss.getSheetByName(tenMoi)) {
        dsTenMoiBiTrung.push(tenMoi);
        return;
      }

      dsCanDoi.push({
        sheet: sheet,
        tenCu: tenCu,
        tenMoi: tenMoi
      });
    });

    if (dsTenMoiBiTrung.length > 0) {
      throw new Error(
        'Dừng đổi tên vì bị trùng sheet đích: ' + dsTenMoiBiTrung.join(', ')
      );
    }

    if (dsCanDoi.length === 0) {
      Logger.log(
        'Không tìm thấy sheet tháng nào cần đổi | maCu=%s | maMoi=%s',
        maNguon,
        maDich
      );
      return {
        soSheetDaDoi: 0,
        dsSheet: []
      };
    }

    dsCanDoi.forEach(function(item) {
      item.sheet.setName(item.tenMoi);
      Logger.log('Đã đổi tên sheet: %s -> %s', item.tenCu, item.tenMoi);
    });

    Logger.log(
      'Hoàn tất doiTenSheetThangTheoMa_ | maCu=%s | maMoi=%s | soSheetDaDoi=%s',
      maNguon,
      maDich,
      dsCanDoi.length
    );

    return {
      soSheetDaDoi: dsCanDoi.length,
      dsSheet: dsCanDoi.map(function(item) {
        return item.tenMoi;
      })
    };
  } catch (error) {
    Logger.log('Lỗi doiTenSheetThangTheoMa_: %s', error.stack || error);
    throw error;
  }
}
function capNhatMaDonViTrongConfig_(maPhongBan, maSheetThang) {
  try {
    var maPhongBanChuan = String(maPhongBan || '').trim();
    var maSheetThangChuan = String(maSheetThang || '').trim();

    if (!maPhongBanChuan) {
      throw new Error('Thiếu maPhongBan.');
    }

    if (!maSheetThangChuan) {
      throw new Error('Thiếu maSheetThang.');
    }

    var ss = layBangTinhDangMo_();
    setupCanonicalConfig_(false);
    var sheetConfigCore = ss.getSheetByName('CONFIG_CORE');

    if (!sheetConfigCore) {
      throw new Error('Khong tim thay sheet CONFIG_CORE.');
    }

    upsertCanonicalCoreValue_(sheetConfigCore, 'department_code', maPhongBanChuan, 'Tu dong cap nhat theo rollout');
    upsertCanonicalCoreValue_(sheetConfigCore, 'month_sheet_code', maSheetThangChuan, 'Tu dong cap nhat theo rollout');

    Logger.log(
      'Hoàn tất capNhatMaDonViTrongConfig_ | maPhongBan=%s | maSheetThang=%s | soDongSua=%s',
      maPhongBanChuan,
      maSheetThangChuan,
      2
    );
  } catch (error) {
    Logger.log('Lỗi capNhatMaDonViTrongConfig_: %s', error.stack || error);
    throw error;
  }
}

function chuyenSangCanonicalConfigHoanToan() {
  try {
    var ss = layBangTinhDangMo_();
    var setup = setupCanonicalConfig_(true);
    var daXoaConfigCu = xoaSheetConfigCuNeuCo_(ss);

    dongBoDropdownVaDinhDang();
    taoTriggerGuiEmailPhoiHop();

    Logger.log(
      'Da chuyen sang canonical-only | file=%s | daXoaConfigCu=%s | created=%s | reset=%s | daTaoTriggerEmail=%s',
      ss.getName(),
      daXoaConfigCu,
      JSON.stringify(setup.createdSheets || []),
      JSON.stringify(setup.resetSheets || []),
      true
    );

    return {
      fileName: ss.getName(),
      fileId: ss.getId(),
      daXoaConfigCu: daXoaConfigCu,
      createdSheets: setup.createdSheets || [],
      resetSheets: setup.resetSheets || [],
      daTaoTriggerEmail: true
    };
  } catch (error) {
    Logger.log('Loi chuyenSangCanonicalConfigHoanToan: %s', error.stack || error);
    throw error;
  }
}

function dongBoCanonicalDropdownVaDinhDang() {
  try {
    var ss = layBangTinhDangMo_();
    Logger.log('Bat dau dongBoCanonicalDropdownVaDinhDang | file=%s', ss.getName());
    dongBoDropdownVaDinhDang();
    Logger.log('Hoan tat dongBoCanonicalDropdownVaDinhDang | file=%s', ss.getName());
    return {
      fileName: ss.getName(),
      fileId: ss.getId(),
      ok: true
    };
  } catch (error) {
    Logger.log('Loi dongBoCanonicalDropdownVaDinhDang: %s', error.stack || error);
    throw error;
  }
}

function kiemTraSauDongBoCanonical() {
  try {
    Logger.log('Bat dau kiemTraSauDongBoCanonical');
    return test_05_PreflightDayDu();
  } catch (error) {
    Logger.log('Loi kiemTraSauDongBoCanonical: %s', error.stack || error);
    throw error;
  }
}
function khoiTaoSauNhanBanDonVi_(maSheetCu, maDonViMoi) {
  try {
    var maSheetCuChuan = String(maSheetCu || '').trim();
    var maDonViMoiChuan = String(maDonViMoi || '').trim();

    if (!maSheetCuChuan) {
      throw new Error('Thiếu maSheetCu.');
    }

    if (!maDonViMoiChuan) {
      throw new Error('Thiếu maDonViMoi.');
    }

    Logger.log('=== BAT DAU khoiTaoSauNhanBanDonVi_ ===');
    Logger.log('maSheetCu=%s | maDonViMoi=%s', maSheetCuChuan, maDonViMoiChuan);

    doiTenSheetThangTheoMa_(maSheetCuChuan, maDonViMoiChuan);
    capNhatMaDonViTrongConfig_(maDonViMoiChuan, maDonViMoiChuan);
    dongBoDropdownVaDinhDang();

    Logger.log('=== KET THUC khoiTaoSauNhanBanDonVi_ ===');
    Logger.log(
      'Da hoan tat khoi tao sau nhan ban | maSheetCu=%s | maDonViMoi=%s',
      maSheetCuChuan,
      maDonViMoiChuan
    );
  } catch (error) {
    Logger.log('Lỗi khoiTaoSauNhanBanDonVi_: %s', error.stack || error);
    throw error;
  }
}

function layMaDonViTuSheetThangDauTien_() {
  try {
    var ss = layBangTinhDangMo_();
    var config = docCauHinh_(ss);
    var dsSheetThang = layDanhSachSheetThang_(ss, config);

    if (!dsSheetThang || dsSheetThang.length === 0) {
      throw new Error('Không tìm thấy sheet tháng hợp lệ để suy ra mã đơn vị.');
    }

    var tenSheet = dsSheetThang[0].getName();
    var match = tenSheet.match(/^(.+?)\s*[-–]\s*T(0[1-9]|1[0-2])\.\d{4}$/);

    if (!match) {
      throw new Error('Không suy ra được mã đơn vị từ tên sheet: ' + tenSheet);
    }

    var maDonVi = String(match[1] || '').trim();
    if (!maDonVi) {
      throw new Error('Mã đơn vị suy ra từ sheet tháng đang rỗng.');
    }

    return maDonVi;
  } catch (error) {
    Logger.log('Lỗi layMaDonViTuSheetThangDauTien_: %s', error.stack || error);
    throw error;
  }
}

function khoiTaoDonViTheoFileHienTai(options) {
  try {
    var opts = options || {};
    var ss = layBangTinhDangMo_();
    var maDonVi = layMaDonViTuSheetThangDauTien_();
    var boQuaDongBoDropdown = opts.skipDropdownSync === true;
    var hienToast = opts.showToast !== false;

    Logger.log('=== BAT DAU khoiTaoDonViTheoFileHienTai ===');
    Logger.log('file=%s | maDonVi=%s | boQuaDongBoDropdown=%s', ss.getName(), maDonVi, boQuaDongBoDropdown);

    capNhatMaDonViTrongConfig_(maDonVi, maDonVi);
    if (!boQuaDongBoDropdown) {
      dongBoDropdownVaDinhDang();
    }

    if (hienToast) {
      ss.toast(
        'Đã khởi tạo mã đơn vị theo file hiện tại: ' + maDonVi,
        'Quản lý KH tháng',
        5
      );
    }

    Logger.log('=== KET THUC khoiTaoDonViTheoFileHienTai ===');

    return {
      fileName: ss.getName(),
      fileId: ss.getId(),
      maDonVi: maDonVi,
      boQuaDongBoDropdown: boQuaDongBoDropdown,
      ok: true
    };
  } catch (error) {
    Logger.log('Lỗi khoiTaoDonViTheoFileHienTai: %s', error.stack || error);
    throw error;
  }
}
function chayHoanTatSauRollout() {
  dongBoDropdownVaDinhDang();
  chayToMau();
  baoVeBieuMau();
  batToanBoTrigger();
  chayKiemTraTruocNhanBan();
}

const DS_CAP_CONG_VIEC_DROPDOWN_ = ['Nhóm', 'Cấp 1', 'Cấp 2', 'Cấp 3', 'Cấp 4'];

function chuanHoaCauTrucCongViecSheetHienTai() {
  try {
    const ss = layBangTinhDangMo_();
    const sheet = ss.getActiveSheet();
    const config = docCauHinh_(ss);

    if (!laSheetThangDongBo_(sheet, config)) {
      throw new Error('Sheet đang mở không phải sheet tháng hợp lệ để chuẩn hóa cấu trúc công việc.');
    }

    const ui = SpreadsheetApp.getUi();
    const nutBam = ui.alert(
      'Xác nhận cập nhật lại STT sau khi đổi cấu trúc',
      'Sau khi đổi giá trị Nhóm / Cấp 1 / Cấp 2 / Cấp 3 / Cấp 4 ở cột A, cần chạy lại chức năng này để hệ thống đánh lại STT ở cột A, cập nhật note kỹ thuật và tự điền mã dự án cho dòng con nếu cha có mã dự án.\n\nHệ thống không tự cập nhật ngay khi vừa sửa cột A.\n\nNên chạy trước khi gửi mail hoặc chuyển việc tồn.',
      ui.ButtonSet.OK_CANCEL
    );
    if (nutBam !== ui.Button.OK) {
      Logger.log('Bỏ qua chuanHoaCauTrucCongViecSheetHienTai | nguoi_dung_huy_xac_nhan');
      return { daHuy: true };
    }

    const ketQua = chuanHoaCauTrucCongViecTrenSheet_(sheet);
    ss.toast(
      'Đã cập nhật lại STT/cấu trúc hiển thị. Dòng xử lý: ' + ketQua.soDongXuLy + ' | Cảnh báo: ' + ketQua.soCanhBao,
      'Quản lý KH tháng',
      5
    );
    Logger.log(
      'Hoàn tất chuanHoaCauTrucCongViecSheetHienTai | sheet=%s | dongXuLy=%s | canhBao=%s',
      sheet.getName(),
      ketQua.soDongXuLy,
      ketQua.soCanhBao
    );
    return ketQua;
  } catch (error) {
    Logger.log('Lỗi chuanHoaCauTrucCongViecSheetHienTai: %s', error.stack || error);
    throw error;
  }
}

function chuanHoaCauTrucCongViecTrenSheet_(sheet) {
  const dongBatDau = CAU_HINH_UNG_DUNG.KIEM_TRA_CAU_TRUC.DONG_BAT_DAU_DU_LIEU || 5;
  const dongCuoi = sheet.getLastRow();
  const soDong = Math.max(dongCuoi - dongBatDau + 1, 0);
  if (!soDong) {
    return { sheet: sheet.getName(), soDongXuLy: 0, soCanhBao: 0, canhBao: [] };
  }

  const values = sheet.getRange(dongBatDau, 1, soDong, 9).getDisplayValues();
  const notesA = sheet.getRange(dongBatDau, 1, soDong, 1).getNotes();
  const thongTinSheet = layThongTinThangTuTenSheet_(sheet.getName());
  const prefixMaCv = taoPrefixMaCvTheoSheet_(thongTinSheet);
  const trangThaiId = taoTrangThaiMaCv_(notesA, prefixMaCv);
  const boDemTheoCap = [0, 0, 0, 0, 0];
  const maCvTheoCap = ['', '', '', '', ''];
  const maDuAnTheoCap = ['', '', '', '', ''];
  const ketQuaA = [];
  const ketQuaC = [];
  const ketQuaNoteA = [];
  const canhBao = [];

  for (let i = 0; i < values.length; i++) {
    const soDongHienTai = dongBatDau + i;
    const giaTriA = String(values[i][0] || '').trim();
    const giaTriB = String(values[i][1] || '').trim();
    const giaTriC = String(values[i][2] || '').trim();
    const giaTriH = String(values[i][7] || '').trim();
    const giaTriI = String(values[i][8] || '').trim();

    if (laDongTongDongBo_(giaTriA)) {
      ketQuaA.push([giaTriA]);
      ketQuaC.push([giaTriC]);
      ketQuaNoteA.push([notesA[i][0] || '']);
      continue;
    }

    if (giaTriA === '' && giaTriB === '' && giaTriC === '' && giaTriH === '' && giaTriI === '') {
      ketQuaA.push([giaTriA]);
      ketQuaC.push([giaTriC]);
      ketQuaNoteA.push([notesA[i][0] || '']);
      continue;
    }

    const cap = xacDinhCapCongViecTuGiaTriA_(giaTriA);
    if (cap === null) {
      ketQuaA.push([giaTriA]);
      ketQuaC.push([giaTriC]);
      ketQuaNoteA.push([notesA[i][0] || '']);
      continue;
    }

    if (!coDuChaChoCapCongViec_(cap, maCvTheoCap)) {
      canhBao.push('Dòng ' + soDongHienTai + ': thiếu dòng cha hợp lệ cho ' + giaTriA);
      ketQuaA.push([giaTriA]);
      ketQuaC.push([giaTriC]);
      ketQuaNoteA.push([notesA[i][0] || '']);
      continue;
    }

    capNhatBoDemTheoCap_(boDemTheoCap, cap);
    const maHienThi = taoMaHienThiTheoCap_(boDemTheoCap, cap);
    const noteCu = phanTichNoteCongViec_(notesA[i][0]);
    const maCv = noteCu.ma_cv || taoMaCvMoi_(prefixMaCv, trangThaiId);
    const maCha = cap === 0 ? '' : (maCvTheoCap[cap - 1] || '');
    const maDuAnCha = timMaDuAnChaGanNhat_(maDuAnTheoCap, cap);
    let maDuAnMoi = giaTriC;

    if (!maDuAnMoi && maDuAnCha) {
      maDuAnMoi = maDuAnCha;
    } else if (maDuAnMoi && maDuAnCha && maDuAnMoi !== maDuAnCha) {
      canhBao.push('Dòng ' + soDongHienTai + ': mã dự án con khác mã dự án cha.');
    }

    maCvTheoCap[cap] = maCv;
    maDuAnTheoCap[cap] = maDuAnMoi || '';
    for (let level = cap + 1; level < maCvTheoCap.length; level++) {
      maCvTheoCap[level] = '';
      maDuAnTheoCap[level] = '';
    }

    ketQuaA.push([maHienThi]);
    ketQuaC.push([maDuAnMoi]);
    ketQuaNoteA.push([taoNoteCongViec_(maCv, cap, maCha, noteCu.chuyen_tu || '')]);
  }

  const rangeA = sheet.getRange(dongBatDau, 1, ketQuaA.length, 1);
  rangeA.setNumberFormat('@');
  rangeA.setValues(ketQuaA);

  sheet.getRange(dongBatDau, 3, ketQuaC.length, 1).setValues(ketQuaC);
  rangeA.setNotes(ketQuaNoteA);

  return {
    sheet: sheet.getName(),
    soDongXuLy: ketQuaA.length,
    soCanhBao: canhBao.length,
    canhBao: canhBao
  };
}

function xacDinhCapCongViecTuGiaTriA_(giaTriA) {
  const a = String(giaTriA || '').trim();
  if (!a || laDongTongDongBo_(a)) {
    return null;
  }

  const viTriDropdown = DS_CAP_CONG_VIEC_DROPDOWN_.indexOf(a);
  if (viTriDropdown !== -1) {
    return viTriDropdown;
  }

  if (/^[IVXLCDM]+$/i.test(a)) return 0;
  if (/^\d+$/.test(a)) return 1;
  if (/^\d+\.\d+$/.test(a)) return 2;
  if (/^\d+\.\d+\.\d+$/.test(a)) return 3;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(a)) return 4;

  return null;
}

function coDuChaChoCapCongViec_(cap, maCvTheoCap) {
  if (cap === 0) return true;
  return !!maCvTheoCap[cap - 1];
}

function capNhatBoDemTheoCap_(boDemTheoCap, cap) {
  if (cap === 0) {
    boDemTheoCap[0]++;
    boDemTheoCap[1] = 0;
    boDemTheoCap[2] = 0;
    boDemTheoCap[3] = 0;
    boDemTheoCap[4] = 0;
    return;
  }

  boDemTheoCap[cap]++;
  for (let i = cap + 1; i < boDemTheoCap.length; i++) {
    boDemTheoCap[i] = 0;
  }
}

function taoMaHienThiTheoCap_(boDemTheoCap, cap) {
  if (cap === 0) {
    return chuyenSoThanhLaMa_(boDemTheoCap[0]);
  }

  const parts = [];
  for (let i = 1; i <= cap; i++) {
    parts.push(String(boDemTheoCap[i]));
  }
  return parts.join('.');
}

function chuyenSoThanhLaMa_(so) {
  const number = Number(so || 0);
  if (number <= 0) {
    return '';
  }

  const ds = [
    { value: 1000, symbol: 'M' },
    { value: 900, symbol: 'CM' },
    { value: 500, symbol: 'D' },
    { value: 400, symbol: 'CD' },
    { value: 100, symbol: 'C' },
    { value: 90, symbol: 'XC' },
    { value: 50, symbol: 'L' },
    { value: 40, symbol: 'XL' },
    { value: 10, symbol: 'X' },
    { value: 9, symbol: 'IX' },
    { value: 5, symbol: 'V' },
    { value: 4, symbol: 'IV' },
    { value: 1, symbol: 'I' }
  ];
  let conLai = number;
  let ketQua = '';

  ds.forEach(function(item) {
    while (conLai >= item.value) {
      ketQua += item.symbol;
      conLai -= item.value;
    }
  });

  return ketQua;
}

function taoPrefixMaCvTheoSheet_(thongTinSheet) {
  if (!thongTinSheet) {
    return 'V0000-';
  }

  const yy = String(thongTinSheet.nam || '').slice(-2);
  const mm = ('0' + String(thongTinSheet.thang || '')).slice(-2);
  return 'V' + yy + mm + '-';
}

function taoTrangThaiMaCv_(notesA, prefixMaCv) {
  let maxSo = 0;
  (notesA || []).forEach(function(row) {
    const note = phanTichNoteCongViec_(row[0]);
    const maCv = String(note.ma_cv || '').trim();
    const match = maCv.match(new RegExp('^' + prefixMaCv.replace('-', '\\-') + '(\\d{3})$'));
    if (match) {
      maxSo = Math.max(maxSo, Number(match[1]));
    }
  });

  return {
    prefix: prefixMaCv,
    current: maxSo
  };
}

function taoMaCvMoi_(prefixMaCv, trangThaiId) {
  const state = trangThaiId || { prefix: prefixMaCv, current: 0 };
  state.current++;
  return state.prefix + ('00' + state.current).slice(-3);
}

function phanTichNoteCongViec_(noteText) {
  const ketQua = {
    ma_cv: '',
    cap_cv: '',
    ma_cha: '',
    chuyen_tu: ''
  };

  String(noteText || '').split(/\r?\n/).forEach(function(line) {
    const match = String(line || '').match(/^\s*([^=]+)=(.*)$/);
    if (!match) {
      return;
    }

    const key = String(match[1] || '').trim();
    const value = String(match[2] || '').trim();
    if (Object.prototype.hasOwnProperty.call(ketQua, key)) {
      ketQua[key] = value;
    }
  });

  return ketQua;
}

function taoNoteCongViec_(maCv, capCv, maCha, chuyenTu) {
  return [
    'ma_cv=' + String(maCv || '').trim(),
    'cap_cv=' + String(capCv),
    'ma_cha=' + String(maCha || '').trim(),
    'chuyen_tu=' + String(chuyenTu || '').trim()
  ].join('\n');
}

function timMaDuAnChaGanNhat_(maDuAnTheoCap, capHienTai) {
  for (let cap = capHienTai - 1; cap >= 1; cap--) {
    if (maDuAnTheoCap[cap]) {
      return maDuAnTheoCap[cap];
    }
  }
  return '';
}


