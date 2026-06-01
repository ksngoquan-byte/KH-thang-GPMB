// Tach tu 2.Chinh.js, giu nguyen ten ham public va trigger handler.

function layBangTinhEmailPhoiHop_() {
  return layBangTinhDangMo_();
}

var CAU_HINH_EMAIL_PHOI_HOP = {
  tenSheetData: 'Data',

  dongBatDauQuet: 5,

  cotNoiDung: 2,   // B
  cotMaDuAn: 3,    // C
  cotMucTieuCuThe: 4, // D
  cotCapUuTien: 5, // E
  cotThoiHan: 6,   // F
  cotChuTri: 8,    // H
  cotPhoiHop: 9,   // I

  dataDongNhanSuBatDau: 6,
  dataDongNhanSuKetThuc: 56,
  dataCotTenNhanSu: 12,   // L

  dataDongPhongBanBatDau: 57,
  dataDongPhongBanKetThuc: 107,
  dataCotTenPhongBan: 12,   // L

  dataDongKhoiPhoiHopBatDau: 57,
  dataDongKhoiPhoiHopKetThuc: 107,

  tenNguoiGui: 'Hệ thống kế hoạch tháng'
};

var CAU_HINH_TONG_HOP_PHOI_HOP = {
  TEN_SHEET_LOG: 'MAIL_LOG_PHOI_HOP',
  KHOA_CHU_KY_DA_GUI: 'PHOI_HOP_CHU_KY_DA_GUI_V1',
  KHOA_CHU_KY_PHAT_SINH_DA_GUI: 'PHAT_SINH_CHU_KY_DA_GUI_V1',
  KHOA_CHU_KY_NOI_BO_DA_GUI: 'PHOI_HOP_NOI_BO_CHU_KY_DA_GUI_V1',
  KHOA_GUI_GAN_NHAT: 'PHOI_HOP_GUI_GAN_NHAT_V1',
  DRY_RUN: false,
  SO_PHUT_CANH_BAO_GUI_GAN_NHAT: 5,
  DINH_DANG_NGAY: 'yyyy-MM-dd'
};

var EMAIL_PHOI_HOP_DISABLED = 'EMAIL_PHOI_HOP_DISABLED';
var EMAIL_PHOI_HOP_DISABLED_AT = 'EMAIL_PHOI_HOP_DISABLED_AT';
var EMAIL_PHOI_HOP_DISABLED_BY = 'EMAIL_PHOI_HOP_DISABLED_BY';
var DS_HANDLER_TRIGGER_EMAIL_PHOI_HOP = [
  'guiEmailPhoiHopTheoLich',
  'khiSuaDanhDauSheetEmailPhoiHop',
  'guiMailNhac5NgayChoPhongBan_',
  'guiMailNhac8GioChoNguoiChinhSua_',
  'guiMailNhacGuiTongHopNoiBoSauKhoa_'
];

function laHandlerTriggerEmailPhoiHop_(tenHam) {
  return DS_HANDLER_TRIGGER_EMAIL_PHOI_HOP.indexOf(String(tenHam || '').trim()) !== -1;
}

function kiemTraEmailPhoiHopDangBiChan_() {
  var giaTri = String(
    PropertiesService.getScriptProperties().getProperty(EMAIL_PHOI_HOP_DISABLED) || ''
  ).trim().toUpperCase();
  var dangBiChan = giaTri === 'TRUE' || giaTri === '1' || giaTri === 'YES';

  if (dangBiChan) {
    Logger.log(
      'Email phối hợp đang bị chặn bởi property %s=%s',
      EMAIL_PHOI_HOP_DISABLED,
      giaTri
    );
  }

  return dangBiChan;
}

function auditTriggerEmailPhoiHop() {
  var tatCaTrigger = ScriptApp.getProjectTriggers();
  var ketQua = [];
  var soTriggerEmail = 0;

  tatCaTrigger.forEach(function(trigger, index) {
    var tenHam = trigger.getHandlerFunction();
    var laEmail = laHandlerTriggerEmailPhoiHop_(tenHam);
    var eventType = '';
    var source = '';

    try {
      eventType = String(trigger.getEventType());
    } catch (e) {
      eventType = 'KHONG_DOC_DUOC';
    }

    try {
      source = String(trigger.getTriggerSource());
    } catch (e2) {
      source = 'KHONG_DOC_DUOC';
    }

    if (laEmail) {
      soTriggerEmail++;
    }

    ketQua.push({
      stt: index + 1,
      handler: tenHam,
      eventType: eventType,
      source: source,
      laTriggerEmailPhoiHop: laEmail
    });
  });

  Logger.log('===== AUDIT TRIGGER EMAIL PHOI HOP =====');
  Logger.log('Tong trigger: %s | trigger email phoi hop: %s', tatCaTrigger.length, soTriggerEmail);
  ketQua.forEach(function(item) {
    Logger.log(
      '[%s] handler=%s | eventType=%s | source=%s | email=%s',
      item.stt,
      item.handler,
      item.eventType,
      item.source,
      item.laTriggerEmailPhoiHop
    );
  });

  return {
    tongTrigger: tatCaTrigger.length,
    soTriggerEmailPhoiHop: soTriggerEmail,
    danhSach: ketQua
  };
}

function batChanEmailPhoiHopKhanCap() {
  var props = PropertiesService.getScriptProperties();
  var nguoiChay = '';

  try {
    nguoiChay = Session.getEffectiveUser().getEmail();
  } catch (e) {
    nguoiChay = '';
  }

  props.setProperty(EMAIL_PHOI_HOP_DISABLED, 'TRUE');
  props.setProperty(EMAIL_PHOI_HOP_DISABLED_AT, new Date().toISOString());
  props.setProperty(EMAIL_PHOI_HOP_DISABLED_BY, nguoiChay || 'KHONG_XAC_DINH');

  var dsDaXoa = xoaTriggerGuiEmailPhoiHop();
  Logger.log(
    'Đã bật chặn email phối hợp khẩn cấp | soTriggerEmailDaXoa=%s',
    dsDaXoa.length
  );

  return {
    disabled: true,
    soTriggerEmailDaXoa: dsDaXoa.length,
    dsTriggerDaXoa: dsDaXoa
  };
}

function tatChanEmailPhoiHopKhanCap() {
  PropertiesService.getScriptProperties().setProperty(EMAIL_PHOI_HOP_DISABLED, 'FALSE');
  Logger.log('Đã gỡ chặn email phối hợp khẩn cấp. Chưa tạo lại trigger email.');

  return {
    disabled: false,
    daTaoLaiTrigger: false
  };
}

function taoTriggerGuiEmailPhoiHop() {
  Logger.log('DISABLED_BY_MASTER_MIGRATION|taoTriggerGuiEmailPhoiHop|Child scheduled email trigger creation disabled. MASTER handles scheduled emails.');
  return {
    status: 'DISABLED_BY_MASTER_MIGRATION',
    function_name: 'taoTriggerGuiEmailPhoiHop',
    note: 'Child scheduled email trigger creation disabled. MASTER handles scheduled emails.'
  };
}

function xoaTriggerGuiEmailPhoiHop() {
  try {
    const tatCaTrigger = ScriptApp.getProjectTriggers();
    const dsDaXoa = [];

    tatCaTrigger.forEach(function(trigger) {
      const tenHam = trigger.getHandlerFunction();

      if (laHandlerTriggerEmailPhoiHop_(tenHam)) {
        var banGhi = {
          handler: tenHam,
          eventType: '',
          source: ''
        };

        try {
          banGhi.eventType = String(trigger.getEventType());
        } catch (e) {
          banGhi.eventType = 'KHONG_DOC_DUOC';
        }

        try {
          banGhi.source = String(trigger.getTriggerSource());
        } catch (e2) {
          banGhi.source = 'KHONG_DOC_DUOC';
        }

        ScriptApp.deleteTrigger(trigger);
        dsDaXoa.push(banGhi);
        Logger.log(
          'Đã xóa trigger email phối hợp | handler=%s | eventType=%s | source=%s',
          banGhi.handler,
          banGhi.eventType,
          banGhi.source
        );
      }
    });

    Logger.log('Đã xóa trigger email phối hợp cũ: %s', dsDaXoa.length);
    return dsDaXoa;
  } catch (loi) {
    Logger.log('Lỗi xoaTriggerGuiEmailPhoiHop: %s', loi.stack || loi);
    throw loi;
  }
}

function guiEmailPhoiHopTheoLich() {
  Logger.log('DISABLED_BY_MASTER_MIGRATION|guiEmailPhoiHopTheoLich|Child scheduled email handler disabled. MASTER handles scheduled emails.');
  return JSON.stringify({
    status: 'DISABLED_BY_MASTER_MIGRATION',
    function_name: 'guiEmailPhoiHopTheoLich',
    note: 'Child scheduled email handler disabled. MASTER handles scheduled emails.'
  });
}

function guiTongHopPhoiHopThuCongChoSheetHienTai() {
  var khoa = LockService.getScriptLock();
  if (!khoa.tryLock(30000)) {
    throw new Error('Không lấy được khóa gửi mail phối hợp. Hãy thử lại sau vài giây.');
  }

  try {
    var ss = layBangTinhEmailPhoiHop_();
    var sheet = ss.getActiveSheet();
    var tenSheet = sheet ? sheet.getName() : '';
    var ngayXuLy = dinhDangNgayYmdPhoiHop_(new Date());
    var sheetData = ss.getSheetByName(CAU_HINH_EMAIL_PHOI_HOP.tenSheetData);

    if (!sheet || !laSheetThangEmailHopLe_(tenSheet)) {
      throw new Error('Sheet đang mở không phải sheet tháng hợp lệ để gửi mail phối hợp.');
    }

    if (!sheetData) {
      throw new Error('Không tìm thấy sheet Data.');
    }

    var lanGuiGanNhat = layLanGuiGanNhatTheoSheetPhoiHop_(tenSheet);
    if (!xacNhanGuiTongHopPhoiHopThuCong_(sheet, lanGuiGanNhat)) {
      return {
        sheet: tenSheet,
        ngayXuLy: ngayXuLy,
        trangThai: 'HUY_GUI_THU_CONG',
        ghiChu: 'Người dùng hủy ở bước xác nhận gửi thủ công'
      };
    }

    var ketQua = xuLyGuiTongHopPhoiHopChoMotSheet_({
      sheet: sheet,
      sheetData: sheetData,
      ngayXuLy: ngayXuLy,
      cheDoGui: 'PHOI_HOP_KE_HOACH'
    });

    var trangThai = ketQua && ketQua.trangThai ? ketQua.trangThai : 'KHONG_RO';
    var ghiChu = ketQua && ketQua.ghiChu ? ketQua.ghiChu : '';
    var thongBao = '';

    if (trangThai === 'DA_GUI' || trangThai === 'DRY_RUN') {
      thongBao = 'Đã gửi tổng hợp phối hợp cho sheet hiện tại.';
    } else {
      thongBao = 'Không gửi mail phối hợp: ' + (ghiChu || trangThai);
    }

    ss.toast(thongBao, 'Quản lý KH tháng', 6);
    Logger.log(
      'guiTongHopPhoiHopThuCongChoSheetHienTai | sheet=%s | trạng thái=%s | ghi chú=%s',
      tenSheet,
      trangThai,
      ghiChu
    );

    return {
      sheet: tenSheet,
      ngayXuLy: ngayXuLy,
      trangThai: trangThai,
      ghiChu: ghiChu
    };
  } catch (loi) {
    Logger.log('Lỗi guiTongHopPhoiHopThuCongChoSheetHienTai: %s', loi.stack || loi);
    throw loi;
  } finally {
    khoa.releaseLock();
  }
}

function guiTongHopPhatSinhTrongKyThuCongChoSheetHienTai() {
  var khoa = LockService.getScriptLock();
  if (!khoa.tryLock(30000)) {
    throw new Error('Không lấy được khóa gửi mail phát sinh trong kỳ. Hãy thử lại sau vài giây.');
  }

  try {
    var ss = layBangTinhEmailPhoiHop_();
    var sheet = ss.getActiveSheet();
    var tenSheet = sheet ? sheet.getName() : '';
    var ngayXuLy = dinhDangNgayYmdPhoiHop_(new Date());
    var sheetData = ss.getSheetByName(CAU_HINH_EMAIL_PHOI_HOP.tenSheetData);

    if (!sheet || !laSheetThangEmailHopLe_(tenSheet)) {
      throw new Error('Sheet đang mở không phải sheet tháng hợp lệ để gửi mail phát sinh trong kỳ.');
    }

    if (!sheetData) {
      throw new Error('Không tìm thấy sheet Data.');
    }

    if (!xacNhanGuiTongHopPhatSinhThuCong_(sheet)) {
      return {
        sheet: tenSheet,
        ngayXuLy: ngayXuLy,
        trangThai: 'HUY_GUI_THU_CONG',
        ghiChu: 'Người dùng hủy ở bước xác nhận gửi phát sinh thủ công'
      };
    }

    var ketQua = xuLyGuiTongHopPhoiHopChoMotSheet_({
      sheet: sheet,
      sheetData: sheetData,
      ngayXuLy: ngayXuLy,
      cheDoGui: 'PHAT_SINH'
    });

    var trangThai = ketQua && ketQua.trangThai ? ketQua.trangThai : 'KHONG_RO';
    var ghiChu = ketQua && ketQua.ghiChu ? ketQua.ghiChu : '';
    var thongBao = (trangThai === 'DA_GUI' || trangThai === 'DRY_RUN')
      ? 'Đã gửi tổng hợp phát sinh trong kỳ cho sheet hiện tại.'
      : 'Không gửi mail phát sinh trong kỳ: ' + (ghiChu || trangThai);

    ss.toast(thongBao, 'Quản lý KH tháng', 6);
    Logger.log(
      'guiTongHopPhatSinhTrongKyThuCongChoSheetHienTai | sheet=%s | trạng thái=%s | ghi chú=%s',
      tenSheet,
      trangThai,
      ghiChu
    );

    return {
      sheet: tenSheet,
      ngayXuLy: ngayXuLy,
      trangThai: trangThai,
      ghiChu: ghiChu
    };
  } catch (loi) {
    Logger.log('Lỗi guiTongHopPhatSinhTrongKyThuCongChoSheetHienTai: %s', loi.stack || loi);
    throw loi;
  } finally {
    khoa.releaseLock();
  }
}

function guiTongHopNoiBoThuCongChoSheetHienTai() {
  var khoa = LockService.getScriptLock();
  if (!khoa.tryLock(30000)) {
    throw new Error('Không lấy được khóa gửi tổng hợp nội bộ. Hãy thử lại sau vài giây.');
  }

  try {
    var ss = layBangTinhEmailPhoiHop_();
    var sheet = ss.getActiveSheet();
    var tenSheet = sheet ? sheet.getName() : '';
    var sheetData = ss.getSheetByName(CAU_HINH_EMAIL_PHOI_HOP.tenSheetData);
    var cheDoGuiNoiBo = xacDinhCheDoGuiNoiBoTheoSheet_(sheet);

    if (!sheet || !laSheetThangEmailHopLe_(tenSheet)) {
      throw new Error('Sheet đang mở không phải sheet tháng hợp lệ để gửi tổng hợp nội bộ.');
    }

    if (!sheetData) {
      throw new Error('Không tìm thấy sheet Data.');
    }

    if (!xacNhanGuiTongHopNoiBoThuCong_(sheet, cheDoGuiNoiBo)) {
      return {
        sheet: tenSheet,
        cheDoGuiNoiBo: cheDoGuiNoiBo,
        trangThai: 'HUY_GUI_NOI_BO',
        ghiChu: 'Người dùng hủy ở bước xác nhận gửi tổng hợp nội bộ'
      };
    }

    var ketQua = guiTongHopNoiBoChoMotSheet_({
      ss: ss,
      sheet: sheet,
      sheetData: sheetData,
      cheDoGuiNoiBo: cheDoGuiNoiBo
    });

    var trangThai = ketQua && ketQua.trangThai ? ketQua.trangThai : 'KHONG_RO';
    var ghiChu = ketQua && ketQua.ghiChu ? ketQua.ghiChu : '';
    var thongBao = (trangThai === 'DA_GUI' || trangThai === 'DRY_RUN')
      ? 'Đã gửi tổng hợp nội bộ cho sheet hiện tại.'
      : 'Không gửi tổng hợp nội bộ: ' + (ghiChu || trangThai);

    ss.toast(thongBao, 'Quản lý KH tháng', 6);
    Logger.log(
      'guiTongHopNoiBoThuCongChoSheetHienTai | sheet=%s | chế độ=%s | trạng thái=%s | ghi chú=%s',
      tenSheet,
      cheDoGuiNoiBo,
      trangThai,
      ghiChu
    );

    return {
      sheet: tenSheet,
      cheDoGuiNoiBo: cheDoGuiNoiBo,
      trangThai: trangThai,
      ghiChu: ghiChu
    };
  } catch (loi) {
    Logger.log('Lỗi guiTongHopNoiBoThuCongChoSheetHienTai: %s', loi.stack || loi);
    throw loi;
  } finally {
    khoa.releaseLock();
  }
}

function xacDinhCheDoGuiNoiBoTheoSheet_(sheet) {
  if (!sheet || typeof layCacMocThoiGianSheetThang_ !== 'function') {
    return 'TAM_THOI';
  }

  try {
    var cacMoc = layCacMocThoiGianSheetThang_(sheet);
    var mocKhoa = cacMoc && cacMoc.mocKhoaDanhGia;
    if (mocKhoa instanceof Date && !isNaN(mocKhoa) && new Date().getTime() >= mocKhoa.getTime()) {
      return 'SAU_KHOA';
    }
  } catch (e) {
    Logger.log('Không xác định được chế độ gửi nội bộ theo sheet: %s', e);
  }

  return 'TAM_THOI';
}

function xacNhanGuiTongHopNoiBoThuCong_(sheet, cheDoGuiNoiBo) {
  var ui = SpreadsheetApp.getUi();
  var tenSheet = sheet.getName();
  var thongTinSheet = tachThongTinPhongBanVaThangTuTenSheet_(tenSheet) || {};
  var laSauKhoa = cheDoGuiNoiBo === 'SAU_KHOA';
  var noiDung =
    'Gửi tổng hợp khối lượng công việc từng cá nhân cho sheet "' + tenSheet + '"'
    + (thongTinSheet.thangKeHoachText ? ' (tháng ' + thongTinSheet.thangKeHoachText + ')' : '')
    + '?\n\n'
    + 'Mail sẽ được gửi bằng chính tài khoản của người đang bấm menu.\n'
    + 'Hệ thống sẽ tổng hợp công việc của từng cá nhân trong phòng và gửi cho các nhân sự nội bộ có email.\n'
    + (laSauKhoa
      ? 'Dữ liệu hiện đã qua thời điểm khóa. Nếu không có thay đổi so với lần gửi trước thì hệ thống sẽ tự bỏ qua, không gửi trùng.'
      : 'Dữ liệu hiện chưa đến thời điểm khóa. Mail sẽ được gửi ở trạng thái tạm thời và nếu sau khóa dữ liệu không đổi thì hệ thống sẽ không gửi lại.');

  var luaChon = ui.alert('Xác nhận gửi tổng hợp nội bộ', noiDung, ui.ButtonSet.OK_CANCEL);
  return luaChon === ui.Button.OK;
}

function xacNhanGuiTongHopPhoiHopThuCong_(sheet, lanGuiGanNhat) {
  var ui = SpreadsheetApp.getUi();
  var tenSheet = sheet.getName();
  var thongTinSheet = tachThongTinPhongBanVaThangTuTenSheet_(tenSheet) || {};
  var noiDung = 'Gửi tổng hợp phối hợp cho sheet "' + tenSheet + '"'
    + (thongTinSheet.thangKeHoachText ? ' (kế hoạch tháng ' + thongTinSheet.thangKeHoachText + ')' : '')
    + '?\n\n'
    + '- Nếu không có công việc mới/điều chỉnh so với các công việc đã gửi trước đó thì hệ thống sẽ không gửi mail.\n'
    + '- Nếu đã điều chỉnh một trong các cột B, C, D, E, F, H của công việc đã gửi mail phối hợp thì hệ thống sẽ gửi báo lại.';

  if (lanGuiGanNhat && lanGuiGanNhat.ngayGui) {
    var ngayGuiText = Utilities.formatDate(
      lanGuiGanNhat.ngayGui,
      Session.getScriptTimeZone(),
      'dd/MM/yyyy HH:mm:ss'
    );
    noiDung += '\n\nLần gửi gần nhất: ' + ngayGuiText;

    if (lanGuiGanNhat.nguoiNhan) {
      noiDung += '\nĐối tượng nhận gần nhất: ' + lanGuiGanNhat.nguoiNhan;
    }

    if (coCanhBaoGuiGanNhat_(lanGuiGanNhat.ngayGui, new Date())) {
      noiDung += '\n\nCảnh báo: sheet này vừa gửi trong vòng '
        + (CAU_HINH_TONG_HOP_PHOI_HOP.SO_PHUT_CANH_BAO_GUI_GAN_NHAT || 5)
        + ' phút gần đây.';
    }
  }

  var luaChon = ui.alert('Xác nhận gửi tổng hợp phối hợp', noiDung, ui.ButtonSet.OK_CANCEL);
  return luaChon === ui.Button.OK;
}

function xacNhanGuiTongHopPhatSinhThuCong_(sheet) {
  var ui = SpreadsheetApp.getUi();
  var tenSheet = sheet.getName();
  var thongTinSheet = tachThongTinPhongBanVaThangTuTenSheet_(tenSheet) || {};
  var noiDung = 'Gửi tổng hợp công việc phát sinh trong kỳ cho sheet "' + tenSheet + '"'
    + (thongTinSheet.thangKeHoachText ? ' (tháng ' + thongTinSheet.thangKeHoachText + ')' : '')
    + '?\n\n'
    + '- Hệ thống chỉ lấy phần công việc nằm trong khối "Công tác phát sinh khác trong kỳ".\n'
    + '- Nếu không có phát sinh mới/điều chỉnh so với lần gửi trước thì hệ thống sẽ không gửi mail.\n'
    + '- Mail sẽ được gửi bằng chính tài khoản của người đang bấm menu.';
  var luaChon = ui.alert('Xác nhận gửi phát sinh trong kỳ', noiDung, ui.ButtonSet.OK_CANCEL);
  return luaChon === ui.Button.OK;
}

function taoBanDoPhongBanEmail_(sheetData) {
  var soDong = CAU_HINH_EMAIL_PHOI_HOP.dataDongKhoiPhoiHopKetThuc - CAU_HINH_EMAIL_PHOI_HOP.dataDongKhoiPhoiHopBatDau + 1;

  var duLieu = sheetData.getRange(
    CAU_HINH_EMAIL_PHOI_HOP.dataDongKhoiPhoiHopBatDau,
    CAU_HINH_EMAIL_PHOI_HOP.dataCotTenPhongBan,
    soDong,
    4
  ).getValues();
  // [L, M, N, O]

  var banDo = {};

  duLieu.forEach(function(dong) {
    var tenPhongBan = layGiaTriAnToan_(dong[0]);
    var email = layGiaTriAnToan_(dong[3]);

    if (tenPhongBan && email) {
      banDo[chuanHoaChuoi_(tenPhongBan)] = {
        tenPhong: tenPhongBan,
        email: String(email).trim().toLowerCase()
      };
    }
  });

  return banDo;
}

function layBanDoNhanSuNoiBoTongHop_(sheetData) {
  var soDong = CAU_HINH_EMAIL_PHOI_HOP.dataDongNhanSuKetThuc - CAU_HINH_EMAIL_PHOI_HOP.dataDongNhanSuBatDau + 1;

  var duLieu = sheetData.getRange(
    CAU_HINH_EMAIL_PHOI_HOP.dataDongNhanSuBatDau,
    CAU_HINH_EMAIL_PHOI_HOP.dataCotTenNhanSu,
    soDong,
    4
  ).getValues();
  // [L, M, N, O]

  var banDo = {};

  duLieu.forEach(function(dong) {
    var tenNhanSu = layGiaTriAnToan_(dong[0]);
    var emailCaNhan = layGiaTriAnToan_(dong[3]);

    if (tenNhanSu && emailCaNhan) {
      banDo[chuanHoaChuoi_(tenNhanSu)] = {
        tenNhanSu: tenNhanSu,
        emailCaNhan: String(emailCaNhan).trim().toLowerCase()
      };
    }
  });

  return banDo;
}

function laSheetThangEmailHopLe_(tenSheet) {
  return /^.+\s*[-–—]\s*T(0[1-9]|1[0-2])\.\d{4}$/.test(String(tenSheet || '').trim());
}

function timDongTruocTongTheoCotA_Email_(sheet) {
  var dongCuoi = sheet.getLastRow();
  if (dongCuoi < CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet) {
    return CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet - 1;
  }

  var soDong = dongCuoi - CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet + 1;
  var duLieuCotA = sheet.getRange(
    CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet,
    1,
    soDong,
    1
  ).getDisplayValues();

  for (var i = 0; i < duLieuCotA.length; i++) {
    var giaTriA = layGiaTriAnToan_(duLieuCotA[i][0]);
    if (giaTriA === '∑' || giaTriA === 'Σ') {
      return CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet + i - 1;
    }
  }

  return dongCuoi;
}

function xuLyGuiTongHopPhoiHopChoMotSheet_(thamSo) {
  var sheet = thamSo.sheet;
  var sheetData = thamSo.sheetData;
  var ngayXuLy = thamSo.ngayXuLy;
  var cheDoGui = thamSo.cheDoGui || 'PHOI_HOP_KE_HOACH';

  var thongTinSheet = tachThongTinPhongBanVaThangTuTenSheet_(sheet.getName());
  if (!thongTinSheet) {
    Logger.log('Bỏ qua sheet không đúng mẫu tên: %s', sheet.getName());
    return {
      trangThai: 'BO_QUA',
      ghiChu: 'Sai mẫu tên sheet'
    };
  }

  var dongKetThuc = timDongTruocTongTheoCotA_Email_(sheet);
  if (dongKetThuc < CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet) {
    Logger.log('Bỏ qua gửi tổng hợp | sheet=%s | không có dữ liệu trong vùng quét', sheet.getName());
    return {
      trangThai: 'BO_QUA',
      ghiChu: 'Không có dữ liệu trong vùng quét'
    };
  }

  var dongBatDauPhatSinh = timDongBatDauPhatSinh_(sheet);
  var soDong = dongKetThuc - CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet + 1;

  var duLieu = sheet.getRange(
    CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet,
    1,
    soDong,
    9
  ).getValues();

  var banDoPhongBan = taoBanDoPhongBanEmail_(sheetData);
  var banDoNhanSu = layBanDoNhanSuNoiBoTongHop_(sheetData);

  var dsCongViec = [];
  var soDongKhongCoNguoiNhan = 0;

  for (var i = 0; i < duLieu.length; i++) {
    var dongThuc = CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet + i;
    var noiDung = layGiaTriAnToan_(duLieu[i][CAU_HINH_EMAIL_PHOI_HOP.cotNoiDung - 1]);
    var maDuAn = layGiaTriAnToan_(duLieu[i][CAU_HINH_EMAIL_PHOI_HOP.cotMaDuAn - 1]);
    var mucTieuCuThe = layGiaTriAnToan_(duLieu[i][CAU_HINH_EMAIL_PHOI_HOP.cotMucTieuCuThe - 1]);
    var capUuTien = layGiaTriAnToan_(duLieu[i][CAU_HINH_EMAIL_PHOI_HOP.cotCapUuTien - 1]);
    var thoiHan = duLieu[i][CAU_HINH_EMAIL_PHOI_HOP.cotThoiHan - 1];
    var chuTri = layGiaTriAnToan_(duLieu[i][CAU_HINH_EMAIL_PHOI_HOP.cotChuTri - 1]);
    var phoiHop = layGiaTriAnToan_(duLieu[i][CAU_HINH_EMAIL_PHOI_HOP.cotPhoiHop - 1]);

    if (!noiDung) {
      continue;
    }

    var laPhatSinh = !!dongBatDauPhatSinh && dongThuc >= dongBatDauPhatSinh;
    var ketQuaNhan;

    if (cheDoGui === 'PHAT_SINH' && !laPhatSinh) {
      continue;
    }

    if (cheDoGui === 'PHOI_HOP_KE_HOACH' && laPhatSinh) {
      continue;
    }

    if (laPhatSinh) {
      ketQuaNhan = layDanhSachEmailNhanPhatSinhTongHop_(
        chuTri,
        phoiHop,
        banDoNhanSu,
        banDoPhongBan,
        thongTinSheet.phongLapKeHoach
      );
    } else {
      if (!phoiHop) {
        Logger.log('Bỏ qua dòng thường không có cột I | sheet=%s | dòng=%s', sheet.getName(), dongThuc);
        continue;
      }

      ketQuaNhan = layDanhSachEmailNhanPhoiHopThuongTongHop_(
        phoiHop,
        banDoPhongBan,
        thongTinSheet.phongLapKeHoach
      );
    }

    if (!ketQuaNhan || !ketQuaNhan.dsEmail.length) {
      soDongKhongCoNguoiNhan++;
      Logger.log(
        'Bỏ qua dòng không xác định được email nhận | sheet=%s | dòng=%s | loại=%s | chủ trì=%s | phối hợp=%s',
        sheet.getName(),
        dongThuc,
        laPhatSinh ? 'PHAT_SINH' : 'THUONG',
        chuTri,
        phoiHop
      );
      continue;
    }

    dsCongViec.push({
      dong: dongThuc,
      loai: laPhatSinh ? 'Phát sinh trong kỳ' : 'Kế hoạch tháng',
      noiDung: noiDung,
      maDuAn: maDuAn,
      mucTieuCuThe: mucTieuCuThe,
      capUuTien: capUuTien,
      thoiHanText: dinhDangNgayChiLayNgay_(thoiHan),
      chuTri: chuTri,
      doiTuongPhoiHop: ketQuaNhan.dsDoiTuong.join(', '),
      dsDoiTuongPhoiHop: (ketQuaNhan.dsDoiTuong || []).slice(),
      dsEmailNhan: (ketQuaNhan.dsEmail || []).slice()
    });
  }

  if (!dsCongViec.length) {
    Logger.log(
      'Bỏ qua gửi tổng hợp | sheet=%s | không có công việc hợp lệ | số dòng không map được email=%s',
      sheet.getName(),
      soDongKhongCoNguoiNhan
    );
    return {
      trangThai: 'BO_QUA',
      ghiChu: 'Không có công việc hợp lệ; soDongKhongMapEmail=' + soDongKhongCoNguoiNhan
    };
  }

  dsCongViec.sort(function(a, b) {
    return a.dong - b.dong;
  });

  return guiMotMailTongHopPhoiHopChoMotSheet_({
    sheet: sheet,
    thongTinSheet: thongTinSheet,
    ngayXuLy: ngayXuLy,
    dsCongViec: dsCongViec,
    cheDoGui: cheDoGui
  });
}

function guiMotMailTongHopPhoiHopChoMotSheet_(thamSo) {
  var sheet = thamSo.sheet;
  var thongTinSheet = thamSo.thongTinSheet;
  var dsCongViecToanBo = thamSo.dsCongViec || [];
  var ngayXuLy = thamSo.ngayXuLy;
  var cheDoGui = thamSo.cheDoGui || 'PHOI_HOP_KE_HOACH';
  var dsChuKyCongViecToanBo = dsCongViecToanBo.map(function(item) {
    return taoChuKyCongViecPhoiHop_(item);
  });
  var phanTichBienDong = cheDoGui === 'PHAT_SINH'
    ? layPhanTichBienDongCongViecPhatSinh_(sheet.getName(), dsCongViecToanBo)
    : layPhanTichBienDongCongViecPhoiHop_(sheet.getName(), dsCongViecToanBo);
  var bangChuKyCu = {};

  phanTichBienDong.dsChuKyCu.forEach(function(chuKy) {
    bangChuKyCu[chuKy] = true;
  });

  var dsCongViecMoi = dsCongViecToanBo.filter(function(item) {
    return !bangChuKyCu[taoChuKyCongViecPhoiHop_(item)];
  });

  if (!dsCongViecMoi.length) {
    Logger.log('Bỏ qua gửi tổng hợp vì không có công việc mới | sheet=%s | chế độ=%s', sheet.getName(), cheDoGui);
    return {
      trangThai: 'BO_QUA_KHONG_CO_VIEC_MOI',
      ghiChu: cheDoGui === 'PHAT_SINH'
        ? 'Không có công việc phát sinh mới/điều chỉnh kể từ lần gửi trước'
        : 'Không có công việc mới kể từ lần gửi trước'
    };
  }

  var dsEmailNhan = [];
  var dsDoiTuongNhan = [];
  dsCongViecMoi.forEach(function(item) {
    (item.dsEmailNhan || []).forEach(function(email) {
      dsEmailNhan.push(email);
    });
    (item.dsDoiTuongPhoiHop || []).forEach(function(doiTuong) {
      dsDoiTuongNhan.push(doiTuong);
    });
  });

  dsEmailNhan = hopNhatEmail_(dsEmailNhan)
    .map(function(email) {
      return String(email || '').trim().toLowerCase();
    })
    .filter(Boolean)
    .sort();
  dsDoiTuongNhan = dsDoiTuongNhan.filter(function(item, index, arr) {
    return item && arr.indexOf(item) === index;
  }).sort();

  if (!dsEmailNhan.length) {
    Logger.log('Bỏ qua gửi tổng hợp | sheet=%s | không có email nhận cho danh sách việc mới', sheet.getName());
    return {
      trangThai: 'BO_QUA_KHONG_CO_EMAIL',
      ghiChu: 'Không có email nhận cho danh sách việc mới'
    };
  }

  var dsChuKyCongViecMoi = dsCongViecMoi.map(function(item) {
    return taoChuKyCongViecPhoiHop_(item);
  });
  var payloadHash = {
    tenSheet: sheet.getName(),
    phongLapKeHoach: thongTinSheet.phongLapKeHoach,
    dsDoiTuongNhan: dsDoiTuongNhan.slice(),
    dsEmailNhan: dsEmailNhan.slice(),
    dsCongViec: dsChuKyCongViecMoi.slice()
  };
  var hashMoi = taoHashNoiDungPhoiHop_(payloadHash);
  var hashCu = timHashGanNhatTheoSheet_(sheet.getName());

  if (hashMoi === hashCu) {
    Logger.log('Bỏ qua gửi tổng hợp do hash trùng | sheet=%s', sheet.getName());
    return {
      trangThai: 'BO_QUA_HASH_TRUNG',
      ghiChu: 'Hash nội dung trùng lần gửi gần nhất'
    };
  }

  var thoiDiemChotText = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "H'h' 'ngày' dd/MM/yyyy"
  );

  var noiDungMail = taoNoiDungMailTongHopPhoiHopChoMotSheet_({
    tenSheet: sheet.getName(),
    phongLapKeHoach: thongTinSheet.phongLapKeHoach,
    thangKeHoach: thongTinSheet.thangKeHoachText,
    dsDoiTuongNhan: dsDoiTuongNhan,
    dsCongViec: dsCongViecMoi,
    thoiDiemChotText: thoiDiemChotText,
    cheDoGui: cheDoGui
  });

  var maDotGui = 'DOT_' + ngayXuLy + '_' + sheet.getSheetId();

  if (CAU_HINH_TONG_HOP_PHOI_HOP.DRY_RUN) {
    Logger.log(
      '[DRY_RUN] Sẽ gửi tổng hợp | sheet=%s | soEmail=%s | soViec=%s | soViecMoi=%s',
      sheet.getName(),
      dsEmailNhan.length,
      dsCongViecMoi.length,
      dsCongViecMoi.length
    );
  } else {
    GmailApp.sendEmail(
      dsEmailNhan.join(','),
      noiDungMail.tieuDe,
      noiDungMail.noiDungText,
      {
        name: CAU_HINH_EMAIL_PHOI_HOP.tenNguoiGui,
        htmlBody: noiDungMail.noiDungHtml
      }
    );
  }

  if (cheDoGui === 'PHAT_SINH') {
    capNhatDanhSachChuKyDaGuiTheoSheetPhatSinh_(sheet.getName(), dsChuKyCongViecToanBo);
  } else {
    capNhatDanhSachChuKyDaGuiTheoSheetPhoiHop_(sheet.getName(), dsChuKyCongViecToanBo);
  }

  ghiLogGuiTongHopPhoiHop_({
    ngayGui: new Date(),
    tenSheet: sheet.getName(),
    phongLapKeHoach: thongTinSheet.phongLapKeHoach,
    thangKeHoach: thongTinSheet.thangKeHoachText,
    dsDoiTuongNhan: dsDoiTuongNhan.join(', '),
    dsEmailNhan: dsEmailNhan.join(', '),
    soCongViec: dsCongViecMoi.length,
    hashNoiDung: hashMoi,
    maDotGui: maDotGui,
    trangThai: CAU_HINH_TONG_HOP_PHOI_HOP.DRY_RUN ? 'DRY_RUN' : 'DA_GUI',
    ghiChu: 'ngayXuLy=' + ngayXuLy + '; soViecMoi=' + dsCongViecMoi.length + '; soViecBiXoa=' + phanTichBienDong.soCongViecBiXoa
  });

  capNhatLanGuiGanNhatTheoSheetPhoiHop_(
    sheet.getName(),
    new Date(),
    dsDoiTuongNhan.join(', ')
  );

  return {
    trangThai: CAU_HINH_TONG_HOP_PHOI_HOP.DRY_RUN ? 'DRY_RUN' : 'DA_GUI',
    ghiChu: 'Đã xử lý gửi mail tổng hợp'
  };
}

function guiMailNhacGuiTongHopNoiBoSauKhoa_(thamSo) {
  var ss = thamSo.ss;
  var sheetData = thamSo.sheetData;
  var hienTai = new Date();

  if (hienTai.getDate() !== 3) {
    return;
  }

  var thangMucTieu = hienTai.getMonth() + 1;
  var namMucTieu = hienTai.getFullYear();

  var sheet = laySheetTheoThangNam_(ss, thangMucTieu, namMucTieu);
  if (!sheet) {
    Logger.log('Không tìm thấy sheet mục tiêu để gửi mail nhắc tổng hợp nội bộ sau khóa');
    return;
  }

  var mocNhac = taoNgayGio_(namMucTieu, thangMucTieu, 3, 8, 15, 0);
  if (!coCungNgay_(hienTai, mocNhac) || hienTai.getTime() < mocNhac.getTime()) {
    return;
  }

  var khoaDaGui = taoKhoaTrangThaiMailThang_('[MAIL_NHAC_GUI_TONG_HOP_NOI_BO_SAU_KHOA]', sheet.getName());
  if (daGuiMailTheoKhoa_(khoaDaGui)) {
    return;
  }

  var dsPhongBan = layDanhSachPhongBanNhanMailNhac5Ngay_(sheetData);
  var dsEmail = dsPhongBan.map(function(item) { return item.email; }).filter(Boolean);
  dsEmail = loaiBoEmailTrungMail_(dsEmail);

  if (!dsEmail.length) {
    Logger.log('Không có email phòng ban để nhắc gửi tổng hợp nội bộ sau khóa | sheet=' + sheet.getName());
    danhDauDaGuiMailTheoKhoa_(khoaDaGui);
    return;
  }

  var noiDungMail = taoNoiDungMailNhacGuiTongHopNoiBoSauKhoa_({
    ss: ss,
    sheet: sheet
  });

  GmailApp.sendEmail(
    dsEmail.join(','),
    noiDungMail.tieuDe,
    noiDungMail.noiDungText,
    {
      name: 'Hệ thống kế hoạch',
      htmlBody: noiDungMail.noiDungHtml
    }
  );

  danhDauDaGuiMailTheoKhoa_(khoaDaGui);

  Logger.log(
    'Đã gửi mail nhắc gửi tổng hợp nội bộ sau khóa' +
    ' | sheet=' + sheet.getName() +
    ' | soEmail=' + dsEmail.length
  );
}

function guiTongHopNoiBoChoMotSheet_(thamSo) {
  var ss = thamSo.ss;
  var sheet = thamSo.sheet;
  var sheetData = thamSo.sheetData;
  var cheDoGuiNoiBo = thamSo.cheDoGuiNoiBo || 'TAM_THOI';

  if (!ss) {
    throw new Error('Thiếu spreadsheet context để gửi tổng hợp nội bộ.');
  }

  var dongKetThuc = timDongTruocTongTheoCotA_Email_(sheet);

  if (dongKetThuc < CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet) {
    return {
      trangThai: 'BO_QUA_KHONG_CO_DU_LIEU',
      ghiChu: 'Không có dữ liệu để tổng hợp nội bộ'
    };
  }

  var soDong = dongKetThuc - CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet + 1;
  var duLieu = sheet.getRange(
    CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet,
    1,
    soDong,
    CAU_HINH_EMAIL_PHOI_HOP.cotPhoiHop
  ).getValues();

  var banDoNhanSu = layBanDoNhanSuNoiBo_(sheetData);
  var soMailGui = 0;
  var soNguoiBoQuaKhongDoi = 0;

  Object.keys(banDoNhanSu).forEach(function(khoaNguoi) {
    var nhanSu = banDoNhanSu[khoaNguoi];

    if (!nhanSu.emailCaNhan) {
      return;
    }

    var ketQuaTongHop = tongHopCongViecTheoNhanSu_(duLieu, nhanSu.tenNguoi, banDoNhanSu);
    if (!ketQuaTongHop.danhSachChiTiet.length) {
      return;
    }

    var phanTichBienDong = layPhanTichBienDongCongViecNoiBo_(
      sheet.getName(),
      nhanSu.tenNguoi,
      ketQuaTongHop.danhSachChiTiet
    );

    if (!phanTichBienDong.coThayDoi) {
      soNguoiBoQuaKhongDoi++;
      return;
    }

    var noiDungMail = taoNoiDungMailTongHopSauKhoa_({
      ss: ss,
      sheet: sheet,
      cheDoGuiNoiBo: cheDoGuiNoiBo,
      tenNhanSu: nhanSu.tenNguoi,
      soViecChuTri: ketQuaTongHop.soViecChuTri,
      soViecPhoiHop: ketQuaTongHop.soViecPhoiHop,
      danhSachChiTiet: ketQuaTongHop.danhSachChiTiet
    });

    GmailApp.sendEmail(
      nhanSu.emailCaNhan,
      noiDungMail.tieuDe,
      noiDungMail.noiDungText,
      {
        name: 'Hệ thống kế hoạch',
        htmlBody: noiDungMail.noiDungHtml
      }
    );

    capNhatDanhSachChuKyDaGuiTheoSheetVaNhanSuNoiBo_(
      sheet.getName(),
      nhanSu.tenNguoi,
      phanTichBienDong.dsChuKyMoi
    );
    soMailGui++;
  });

  if (!soMailGui) {
    return {
      trangThai: 'BO_QUA_KHONG_CO_BIEN_DONG',
      ghiChu: soNguoiBoQuaKhongDoi
        ? 'Không có thay đổi mới so với lần gửi trước'
        : 'Không có nhân sự nào có công việc nội bộ để gửi'
    };
  }

  return {
    trangThai: 'DA_GUI',
    ghiChu: 'Đã gửi ' + soMailGui + ' mail tổng hợp nội bộ'
      + (soNguoiBoQuaKhongDoi ? ' | bỏ qua ' + soNguoiBoQuaKhongDoi + ' nhân sự không có thay đổi' : '')
  };
}

function layBanDoNhanSuNoiBo_(sheetData) {
  var dongBatDau = CAU_HINH_EMAIL_PHOI_HOP.dataDongNhanSuBatDau;
  var dongKetThuc = CAU_HINH_EMAIL_PHOI_HOP.dataDongNhanSuKetThuc;
  var soDong = dongKetThuc - dongBatDau + 1;

  // L:M:N:O = tên người | ... | quyền | email cá nhân
  var duLieu = sheetData.getRange(dongBatDau, 12, soDong, 4).getValues();
  var banDo = {};
  var emailDaCo = {};

  duLieu.forEach(function(dong) {
    var tenNguoi = String(dong[0] || '').trim();
    var emailCaNhan = String(dong[3] || '').trim().toLowerCase();

    if (!tenNguoi || !emailCaNhan) {
      return;
    }

    if (emailDaCo[emailCaNhan]) {
      return;
    }

    emailDaCo[emailCaNhan] = true;
    banDo[chuanHoaChuoi_(tenNguoi)] = {
      tenNguoi: tenNguoi,
      emailCaNhan: emailCaNhan
    };
  });

  return banDo;
}

function dinhDangNgayChiLayNgay_(giaTri) {
  if (!giaTri) {
    return '';
  }

  if (Object.prototype.toString.call(giaTri) === '[object Date]' && !isNaN(giaTri)) {
    return Utilities.formatDate(
      giaTri,
      Session.getScriptTimeZone(),
      'd/M/yyyy'
    );
  }

  var text = String(giaTri).trim();
  if (text.indexOf(' ') > -1) {
    return text.split(' ')[0];
  }

  return text;
}

function tongHopCongViecTheoNhanSu_(duLieu, tenNguoi, banDoNhanSu) {
  var tenNguoiChuan = chuanHoaChuoi_(tenNguoi);
  var ketQua = {
    soViecChuTri: 0,
    soViecPhoiHop: 0,
    danhSachChiTiet: []
  };
  var nhomLaMaHienTai = '';

  for (var i = 0; i < duLieu.length; i++) {
    var dong = duLieu[i];
    var soDongThuc = CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet + i;
    var giaTriA = String(dong[0] || '').trim();

    var noiDung = String(dong[CAU_HINH_EMAIL_PHOI_HOP.cotNoiDung - 1] || '').trim();
    var maDuAn = String(dong[CAU_HINH_EMAIL_PHOI_HOP.cotMaDuAn - 1] || '').trim();
    var mucTieuCuThe = String(dong[CAU_HINH_EMAIL_PHOI_HOP.cotMucTieuCuThe - 1] || '').trim();
    var capUuTien = String(dong[CAU_HINH_EMAIL_PHOI_HOP.cotCapUuTien - 1] || '').trim();
    var thoiHan = dong[CAU_HINH_EMAIL_PHOI_HOP.cotThoiHan - 1];
    var chuTri = String(dong[CAU_HINH_EMAIL_PHOI_HOP.cotChuTri - 1] || '').trim();
    var phoiHop = String(dong[CAU_HINH_EMAIL_PHOI_HOP.cotPhoiHop - 1] || '').trim();

    if (laMaNhomEmailNoiBo_(giaTriA) && noiDung) {
      nhomLaMaHienTai = giaTriA;
      continue;
    }

    if (!noiDung) {
      continue;
    }

    var laChuTri = chuanHoaChuoi_(chuTri) === tenNguoiChuan;
    var laPhoiHop = false;

    if (phoiHop) {
      var dsPhoiHop = layDanhSachNhanSuPhoiHopNoiBoTheoMasterData_(phoiHop, banDoNhanSu || {});
      laPhoiHop = dsPhoiHop.some(function(item) {
        return chuanHoaChuoi_(item.tenNguoi) === tenNguoiChuan;
      });
    }

    if (!laChuTri && !laPhoiHop) {
      continue;
    }

    if (laChuTri) {
      ketQua.soViecChuTri++;
    }

    if (laPhoiHop) {
      ketQua.soViecPhoiHop++;
    }

    var dsVaiTro = [];
    if (laChuTri) {
      dsVaiTro.push('Chủ trì');
    }
    if (laPhoiHop) {
      dsVaiTro.push('Phối hợp');
    }

    ketQua.danhSachChiTiet.push({
      dong: soDongThuc,
      sttTrongSheet: taoSttTrongSheetNoiBo_(nhomLaMaHienTai, giaTriA),
      vaiTro: dsVaiTro.join(', '),
      noiDung: noiDung,
      maDuAn: maDuAn,
      mucTieuCuThe: mucTieuCuThe,
      capUuTien: capUuTien,
      thoiHan: dinhDangNgayChiLayNgay_(thoiHan)
    });
  }

  return ketQua;
}

function laMaNhomEmailNoiBo_(giaTriA) {
  return /^(I|II|III|IV|V|VI|VII|VIII|IX|X)$/i.test(String(giaTriA || '').trim());
}

function taoSttTrongSheetNoiBo_(nhomLaMa, sttCotA) {
  var nhom = String(nhomLaMa || '').trim();
  var stt = String(sttCotA || '').trim();

  if (nhom && stt) {
    return nhom + '.' + stt;
  }

  if (stt) {
    return stt;
  }

  return '';
}

function taoNoiDungMailTongHopSauKhoa_(thamSo) {
  var ss = thamSo.ss;
  var sheet = thamSo.sheet;
  var cheDoGuiNoiBo = thamSo.cheDoGuiNoiBo || 'TAM_THOI';
  var laSauKhoa = cheDoGuiNoiBo === 'SAU_KHOA';
  var tenNhanSu = thamSo.tenNhanSu || '';
  var soViecChuTri = Number(thamSo.soViecChuTri || 0);
  var soViecPhoiHop = Number(thamSo.soViecPhoiHop || 0);
  var danhSachChiTiet = thamSo.danhSachChiTiet || [];
  var thongTinSheet = tachThongTinPhongBanVaThangTuTenSheet_(sheet.getName()) || {};

  var tieuDe = (laSauKhoa ? '[Tổng hợp công việc nội bộ sau khóa] ' : '[Tổng hợp công việc nội bộ tạm thời] ')
    + (thongTinSheet.phongLapKeHoach || '')
    + ' - '
    + (thongTinSheet.thangKeHoachText || sheet.getName())
    + ' - ' + tenNhanSu;

  var dsDongText = danhSachChiTiet.map(function(item, index) {
    return (index + 1) + '. [' + (item.vaiTro || '') + '] '
      + (item.sttTrongSheet ? '[' + item.sttTrongSheet + '] ' : '')
      + (item.noiDung || '')
      + '\n   - Mã dự án: ' + (item.maDuAn || '')
      + '\n   - Mục tiêu - kết quả: ' + (item.mucTieuCuThe || '')
      + '\n   - Cấp độ ưu tiên: ' + (item.capUuTien || '')
      + '\n   - Thời hạn: ' + (item.thoiHan || '');
  }).join('\n');

  var rowsHtml = danhSachChiTiet.map(function(item, index) {
    return '<tr>'
      + '<td style="border:1px solid #ccc;padding:6px;">' + (index + 1) + '</td>'
      + '<td style="border:1px solid #ccc;padding:6px;">' + maHoaHtmlEmail_(item.vaiTro || '') + '</td>'
      + '<td style="border:1px solid #ccc;padding:6px;">' + maHoaHtmlEmail_(item.sttTrongSheet || '') + '</td>'
      + '<td style="border:1px solid #ccc;padding:6px;">' + maHoaHtmlEmail_(item.noiDung || '') + '</td>'
      + '<td style="border:1px solid #ccc;padding:6px;">' + maHoaHtmlEmail_(item.maDuAn || '') + '</td>'
      + '<td style="border:1px solid #ccc;padding:6px;">' + maHoaHtmlEmail_(item.mucTieuCuThe || '') + '</td>'
      + '<td style="border:1px solid #ccc;padding:6px;">' + maHoaHtmlEmail_(item.capUuTien || '') + '</td>'
      + '<td style="border:1px solid #ccc;padding:6px;">' + maHoaHtmlEmail_(item.thoiHan || '') + '</td>'
      + '</tr>';
  }).join('');

  var noiDungText =
    'Kính gửi anh/chị ' + tenNhanSu + ',\n\n'
    + 'Phòng/ban ' + (thongTinSheet.phongLapKeHoach || '') + ' kính gửi anh/chị danh sách tổng hợp các công việc của chính anh/chị trong tháng ' + (thongTinSheet.thangKeHoachText || '') + '. '
    + (laSauKhoa
      ? 'Đây là bản tổng hợp sau khi dữ liệu đã được khóa để anh/chị theo dõi và đối chiếu.\n'
      : 'Đây là bản tổng hợp tạm thời trong giai đoạn dữ liệu chưa khóa để anh/chị theo dõi và rà soát.\n')
    + 'Nội dung gồm:\n'
    + '- Số lượng công việc chủ trì: ' + soViecChuTri + '\n'
    + '- Số lượng công việc phối hợp: ' + soViecPhoiHop + '\n'
    + '- Chi tiết các công việc anh/chị tham gia trong tháng:\n\n'
    + (dsDongText ? dsDongText + '\n\n' : '')
    + (laSauKhoa ? '' : 'Lưu ý: Đây là bản tổng hợp tạm thời; dữ liệu có thể tiếp tục được điều chỉnh trước thời điểm khóa.\n\n')
    + 'Kính đề nghị anh/chị tiếp tục phát huy tinh thần chủ động, sáng tạo, phối hợp hiệu quả để hoàn thành các nhiệm vụ công việc được giao trong tháng.\n\n'
    + 'Trân trọng!';

  var noiDungHtml =
    '<p>Kính gửi anh/chị <b>' + maHoaHtmlEmail_(tenNhanSu) + '</b>,</p>'
    + '<p>Phòng/ban <b>' + maHoaHtmlEmail_(thongTinSheet.phongLapKeHoach || '') + '</b> kính gửi anh/chị danh sách tổng hợp các công việc của chính anh/chị trong tháng <b>' + maHoaHtmlEmail_(thongTinSheet.thangKeHoachText || '') + '</b>. '
    + (laSauKhoa
      ? 'Đây là bản tổng hợp sau khi dữ liệu đã được khóa để anh/chị theo dõi và đối chiếu.'
      : 'Đây là bản tổng hợp tạm thời trong giai đoạn dữ liệu chưa khóa để anh/chị theo dõi và rà soát.')
    + '</p>'
    + '<p>Nội dung gồm:</p>'
    + '<ul>'
    + '<li><b>Số lượng công việc chủ trì:</b> ' + soViecChuTri + '</li>'
    + '<li><b>Số lượng công việc phối hợp:</b> ' + soViecPhoiHop + '</li>'
    + '<li><b>Chi tiết các công việc anh/chị tham gia trong tháng:</b></li>'
    + '</ul>'
    + (laSauKhoa ? '' : '<p><i>Lưu ý: Đây là bản tổng hợp tạm thời; dữ liệu có thể tiếp tục được điều chỉnh trước thời điểm khóa.</i></p>')
    + '<table style="border-collapse:collapse;border:1px solid #ccc;">'
    + '<tr>'
    + '<th style="border:1px solid #ccc;padding:6px;">STT</th>'
    + '<th style="border:1px solid #ccc;padding:6px;">Vai trò</th>'
    + '<th style="border:1px solid #ccc;padding:6px;">STT trong sheet</th>'
    + '<th style="border:1px solid #ccc;padding:6px;">Nội dung công việc</th>'
    + '<th style="border:1px solid #ccc;padding:6px;">Mã dự án</th>'
    + '<th style="border:1px solid #ccc;padding:6px;">Mục tiêu - kết quả</th>'
    + '<th style="border:1px solid #ccc;padding:6px;">Cấp độ ưu tiên</th>'
    + '<th style="border:1px solid #ccc;padding:6px;">Thời hạn</th>'
    + '</tr>'
    + rowsHtml
    + '</table>'
    + '<p>Kính đề nghị anh/chị tiếp tục phát huy tinh thần chủ động, sáng tạo, phối hợp hiệu quả để hoàn thành các nhiệm vụ công việc được giao trong tháng.</p>'
    + '<p>Trân trọng!</p>';

  return {
    tieuDe: tieuDe,
    noiDungText: noiDungText,
    noiDungHtml: noiDungHtml
  };
}

function taoNoiDungMailNhacGuiTongHopNoiBoSauKhoa_(thamSo) {
  var ss = thamSo.ss;
  var sheet = thamSo.sheet;
  var thongTinSheet = tachThongTinPhongBanVaThangTuTenSheet_(sheet.getName()) || {};

  var tieuDe = '[Nhắc việc] Gửi tổng hợp nội bộ sau khóa';
  var noiDungText =
    'Kính gửi các phòng/ban,\n\n'
    + 'Dữ liệu báo cáo và kế hoạch đã được khóa.\n'
    + 'Đề nghị người phụ trách của từng phòng/ban sử dụng chức năng "1.4. Gửi mail nội bộ phòng thông báo danh sách việc" trong menu "Quản lý KH tháng" để gửi danh sách công việc cho nhân sự nội bộ của phòng mình.\n'
    + 'Email nội bộ sẽ được gửi bằng chính tài khoản của người đang thao tác trên menu.\n'
    + 'Trường hợp phòng/ban đã hoàn thành gửi thông báo nội bộ thì vui lòng bỏ qua email này.\n\n'
    + 'Trân trọng!';

  var noiDungHtml =
    '<p>Kính gửi các phòng/ban,</p>'
    + '<p>Dữ liệu báo cáo và kế hoạch đã được khóa.</p>'
    + '<p>Đề nghị người phụ trách của từng phòng/ban sử dụng chức năng <b>1.4. Gửi mail nội bộ phòng thông báo danh sách việc</b> trong menu <b>Quản lý KH tháng</b> để gửi danh sách công việc cho nhân sự nội bộ của phòng mình.</p>'
    + '<p>Email nội bộ sẽ được gửi bằng chính tài khoản của người đang thao tác trên menu.</p>'
    + '<p>Trường hợp phòng/ban đã hoàn thành gửi thông báo nội bộ thì vui lòng bỏ qua email này.</p>'
    + '<p>Trân trọng!</p>';

  return {
    tieuDe: tieuDe,
    noiDungText: noiDungText,
    noiDungHtml: noiDungHtml
  };
}


