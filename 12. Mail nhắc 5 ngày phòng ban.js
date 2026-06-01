function guiMailNhac5NgayChoPhongBan_(thamSo) {
  try {
    var ss = thamSo.ss || layBangTinhEmailPhoiHop_();
    var sheetData = thamSo.sheetData || ss.getSheetByName(CAU_HINH_EMAIL_PHOI_HOP.tenSheetData);

    if (!sheetData) {
      throw new Error('Không tìm thấy sheet Data');
    }

    var homNay = new Date();
    var mocNhac = taoNgayGio_(
      homNay.getFullYear(),
      homNay.getMonth() + 1,
      25,
      8,
      0,
      0
    );

    if (!coCungNgayMail_(homNay, mocNhac) || homNay.getTime() < mocNhac.getTime()) {
      return;
    }

    var thangSau = layThangKeTiep_(homNay.getMonth() + 1, homNay.getFullYear());
    var thangDanhGiaText = dinhDangThangNamMail_(homNay.getMonth() + 1, homNay.getFullYear());
    var thangKeHoachText = dinhDangThangNamMail_(thangSau.thang, thangSau.nam);
    var dsPhongBan = layDanhSachPhongBanNhanMailNhac5Ngay_(sheetData);
    var dsEmail = loaiBoEmailTrungMail_(
      dsPhongBan.map(function(item) { return item.email; }).filter(Boolean)
    );

    if (!dsEmail.length) {
      Logger.log('Bỏ qua nhắc ngày 25 phòng ban: không có email');
      return;
    }

    var dsSheetNhac = layDanhSachSheetNhac5NgayPhongBan_(ss, thangSau.thang, thangSau.nam);

    if (!dsSheetNhac.length) {
      Logger.log('Bỏ qua nhắc ngày 25 phòng ban: không có sheet kế hoạch tháng %s', thangKeHoachText);
      return;
    }

    var khoaTrangThai = taoKhoaNhac5NgayTongHopPhongBan_(thangSau.thang, thangSau.nam, homNay);
    if (daGuiMailTheoKhoaMail_(khoaTrangThai)) {
      Logger.log('Bỏ qua nhắc ngày 25 phòng ban: đã gửi tổng hợp rồi | tháng=%s', thangKeHoachText);
      return;
    }

    var dsSheetDaGuiTheoKhoaCu = dsSheetNhac.filter(function(item) {
      return daGuiMailTheoKhoaMail_(taoKhoaNhac5NgayPhongBan_(item.tenSheet, homNay));
    });
    if (dsSheetDaGuiTheoKhoaCu.length) {
      danhDauDaGuiMailTheoKhoaMail_(khoaTrangThai);
      Logger.log(
        'Bỏ qua nhắc ngày 25 phòng ban: phát hiện phiên bản cũ đã gửi trong ngày | tháng=%s | soSheetDaGui=%s',
        thangKeHoachText,
        dsSheetDaGuiTheoKhoaCu.length
      );
      return;
    }

    var tieuDe = '[Nhắc việc] Bắt đầu đánh giá tháng ' + thangDanhGiaText + ' và lập kế hoạch tháng ' + thangKeHoachText;
    var noiDung = taoNoiDungMailNhac5NgayChoPhongBan_({
      dsSheetNhac: dsSheetNhac,
      thangDanhGia: thangDanhGiaText,
      thangKeHoach: thangKeHoachText,
      mocNhac: mocNhac
    });
    var noiDungText = taoNoiDungTextMailNhac5NgayChoPhongBan_({
      dsSheetNhac: dsSheetNhac,
      thangDanhGia: thangDanhGiaText,
      thangKeHoach: thangKeHoachText,
      mocNhac: mocNhac
    });

    MailApp.sendEmail({
      to: dsEmail.join(','),
      subject: tieuDe,
      body: noiDungText,
      htmlBody: noiDung,
      name: CAU_HINH_EMAIL_PHOI_HOP.tenNguoiGui
    });

    danhDauDaGuiMailTheoKhoaMail_(khoaTrangThai);
    dsSheetNhac.forEach(function(item) {
      danhDauDaGuiMailTheoKhoaMail_(taoKhoaNhac5NgayPhongBan_(item.tenSheet, homNay));
    });

    Logger.log(
      'Đã gửi 1 mail nhắc ngày 25 cho tất cả phòng ban | tháng=%s | soSheet=%s | soEmail=%s',
      thangKeHoachText,
      dsSheetNhac.length,
      dsEmail.length
    );
  } catch (loi) {
    Logger.log('Lỗi guiMailNhac5NgayChoPhongBan_: %s', loi.stack || loi);
    throw loi;
  }
}

function layDanhSachSheetNhac5NgayPhongBan_(ss, thang, nam) {
  var ketQua = [];

  ss.getSheets().forEach(function(sheet) {
    var tenSheet = sheet.getName();

    if (!laSheetThangEmailHopLe_(tenSheet)) {
      return;
    }

    var thongTinSheet = tachThongTinPhongBanVaThangTuTenSheet_(tenSheet) || {};
    if (
      Number(thongTinSheet.thang) !== Number(thang) ||
      Number(thongTinSheet.nam) !== Number(nam)
    ) {
      return;
    }

    ketQua.push({
      tenSheet: tenSheet,
      phongLapKeHoach: thongTinSheet.phongLapKeHoach || '',
      thangKeHoachText: thongTinSheet.thangKeHoachText || dinhDangThangNamMail_(thang, nam)
    });
  });

  return ketQua;
}

function layDanhSachPhongBanNhanMailNhac5Ngay_(sheetData) {
  var soDong = CAU_HINH_EMAIL_PHOI_HOP.dataDongPhongBanKetThuc - CAU_HINH_EMAIL_PHOI_HOP.dataDongPhongBanBatDau + 1;

  var duLieu = sheetData.getRange(
    CAU_HINH_EMAIL_PHOI_HOP.dataDongPhongBanBatDau,
    CAU_HINH_EMAIL_PHOI_HOP.dataCotTenPhongBan,
    soDong,
    4
  ).getValues();

  var ketQua = [];

  duLieu.forEach(function(dong) {
    var tenPhong = String(dong[0] || '').trim();
    var email = String(dong[3] || '').trim().toLowerCase();

    if (tenPhong && email) {
      ketQua.push({
        tenPhong: tenPhong,
        email: email
      });
    }
  });

  return ketQua;
}

function taoKhoaNhac5NgayPhongBan_(tenSheet, ngay) {
  return 'MAIL_NHAC_5_NGAY_PHONG_BAN__' + tenSheet + '__' + dinhDangNgayYmdPhoiHop_(ngay);
}

function taoKhoaNhac5NgayTongHopPhongBan_(thang, nam, ngay) {
  return 'MAIL_NHAC_5_NGAY_PHONG_BAN_TONG_HOP__'
    + dinhDangThangNamMail_(thang, nam)
    + '__'
    + dinhDangNgayYmdPhoiHop_(ngay);
}

function daGuiMailTheoKhoaMail_(khoa) {
  return PropertiesService.getScriptProperties().getProperty(khoa) === '1';
}

function danhDauDaGuiMailTheoKhoaMail_(khoa) {
  PropertiesService.getScriptProperties().setProperty(khoa, '1');
}

function coCungNgayMail_(ngayA, ngayB) {
  return ngayA.getFullYear() === ngayB.getFullYear()
    && ngayA.getMonth() === ngayB.getMonth()
    && ngayA.getDate() === ngayB.getDate();
}

function loaiBoEmailTrungMail_(dsEmail) {
  var daCo = {};
  var ketQua = [];

  (dsEmail || []).forEach(function(email) {
    var e = String(email || '').trim().toLowerCase();
    if (!e || daCo[e]) return;
    daCo[e] = true;
    ketQua.push(e);
  });

  return ketQua;
}

function taoNoiDungMailNhac5NgayChoPhongBan_(thamSo) {
  var thangDanhGia = thamSo.thangDanhGia || '';
  var thangKeHoach = thamSo.thangKeHoach || '';
  var mocNhac = thamSo.mocNhac;

  var mocNhacText = Utilities.formatDate(
    mocNhac,
    Session.getScriptTimeZone(),
    'dd/MM/yyyy HH:mm'
  );

  return ''
    + '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6">'
    + '<p>Kính gửi các phòng ban,</p>'
    + '<p>Hệ thống thông báo đã đến thời điểm bắt đầu <b>đánh giá kết quả công việc tháng ' + escapeHtmlMail_(thangDanhGia) + '</b> và <b>lập kế hoạch công việc tháng ' + escapeHtmlMail_(thangKeHoach) + '</b>.</p>'
    + '<ul>'
    + '<li><b>Thời điểm nhắc:</b> ' + escapeHtmlMail_(mocNhacText) + '</li>'
    + '<li><b>Tháng đánh giá:</b> ' + escapeHtmlMail_(thangDanhGia) + '</li>'
    + '<li><b>Tháng kế hoạch:</b> ' + escapeHtmlMail_(thangKeHoach) + '</li>'
    + '</ul>'
    + '<p>Đề nghị các phòng/ban chủ động rà soát, cập nhật kết quả thực hiện tháng hiện tại và phối hợp hoàn thiện kế hoạch công việc tháng tiếp theo theo đúng tiến độ.</p>'
    + '<p>Trân trọng!</p>'
    + '</div>';
}

function taoNoiDungTextMailNhac5NgayChoPhongBan_(thamSo) {
  var thangDanhGia = thamSo.thangDanhGia || '';
  var thangKeHoach = thamSo.thangKeHoach || '';
  var mocNhac = thamSo.mocNhac;
  var mocNhacText = Utilities.formatDate(
    mocNhac,
    Session.getScriptTimeZone(),
    'dd/MM/yyyy HH:mm'
  );

  return 'Kính gửi các phòng ban,\n\n'
    + 'Hệ thống thông báo đã đến thời điểm bắt đầu đánh giá kết quả công việc tháng '
    + thangDanhGia
    + ' và lập kế hoạch công việc tháng '
    + thangKeHoach
    + '.\n\n'
    + 'Thời điểm nhắc: ' + mocNhacText + '\n'
    + 'Tháng đánh giá: ' + thangDanhGia + '\n'
    + 'Tháng kế hoạch: ' + thangKeHoach + '\n\n'
    + 'Đề nghị các phòng/ban chủ động rà soát, cập nhật kết quả thực hiện tháng hiện tại và phối hợp hoàn thiện kế hoạch công việc tháng tiếp theo theo đúng tiến độ.\n\n'
    + 'Trân trọng!';
}

function dinhDangThangNamMail_(thang, nam) {
  var thangText = Number(thang) < 10 ? ('0' + Number(thang)) : String(Number(thang));
  return thangText + '.' + String(nam);
}

function escapeHtmlMail_(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
