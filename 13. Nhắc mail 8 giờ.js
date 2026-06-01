function layDanhSachNguoiChinhSua_(sheetData) {
  var dongBatDau = CAU_HINH_EMAIL_PHOI_HOP.dataDongNhanSuBatDau;
  var dongKetThuc = CAU_HINH_EMAIL_PHOI_HOP.dataDongNhanSuKetThuc;
  var soDong = dongKetThuc - dongBatDau + 1;

  // L:M:N:O = tên người | . | quyền | email cá nhân
  var duLieu = sheetData.getRange(dongBatDau, 12, soDong, 4).getValues();
  var ketQua = [];
  var emailDaCo = {};

  duLieu.forEach(function(dong) {
    var tenNguoi = String(dong[0] || '').trim();
    var quyen = String(dong[2] || '').trim().toLowerCase();
    var emailCaNhan = String(dong[3] || '').trim().toLowerCase();

    if (!tenNguoi || !emailCaNhan) {
      return;
    }

    if (quyen.indexOf('chỉnh sửa') !== -1 || quyen.indexOf('chinh sua') !== -1) {
      if (emailDaCo[emailCaNhan]) {
        return;
      }
      emailDaCo[emailCaNhan] = true;

      ketQua.push({
        tenNguoi: tenNguoi,
        emailCaNhan: emailCaNhan
      });
    }
  });

  return ketQua;
}

function laySheetTheoThangNam_(ss, thang, nam) {
  var dsSheet = ss.getSheets();

  for (var i = 0; i < dsSheet.length; i++) {
    var sheet = dsSheet[i];
    var tenSheet = sheet.getName();

    if (!laSheetThangEmailHopLe_(tenSheet)) {
      continue;
    }

    var thongTin = tachThongTinPhongBanVaThangTuTenSheet_(tenSheet);
    if (!thongTin) {
      continue;
    }

    if (Number(thongTin.thang) === Number(thang) && Number(thongTin.nam) === Number(nam)) {
      return sheet;
    }
  }

  return null;
}

function coCungNgay_(ngayA, ngayB) {
  return ngayA.getFullYear() === ngayB.getFullYear() &&
    ngayA.getMonth() === ngayB.getMonth() &&
    ngayA.getDate() === ngayB.getDate();
}

function taoKhoaTrangThaiMailThang_(tienTo, tenSheet) {
  return String(tienTo || '') + '|' + String(tenSheet || '');
}

function daGuiMailTheoKhoa_(khoa) {
  return PropertiesService.getScriptProperties().getProperty(khoa) === '1';
}

function danhDauDaGuiMailTheoKhoa_(khoa) {
  PropertiesService.getScriptProperties().setProperty(khoa, '1');
}

function guiMailNhac8GioChoNguoiChinhSua_(thamSo) {
  Logger.log('DISABLED_BY_MASTER_MIGRATION|guiMailNhac8GioChoNguoiChinhSua_|Child scheduled reminder disabled. MASTER handles scheduled reminders and protection.');
  return JSON.stringify({
    status: 'DISABLED_BY_MASTER_MIGRATION',
    function_name: 'guiMailNhac8GioChoNguoiChinhSua_',
    note: 'Child scheduled reminder disabled. MASTER handles scheduled reminders and protection.'
  });
}

function taoNoiDungMailNhac8Gio_(thamSo) {
  var ss = thamSo.ss;
  var sheet = thamSo.sheet;
  var tenSheet = sheet.getName();
  var thongTinSheet = tachThongTinPhongBanVaThangTuTenSheet_(tenSheet) || {};
  var cacMoc = layCacMocThoiGianSheetThang_(sheet);
  var mocKhoaText = Utilities.formatDate(
    cacMoc.mocKhoaKeHoachDauThang,
    Session.getScriptTimeZone(),
    'dd/MM/yyyy HH:mm'
  );
  var thangKeHoach = thongTinSheet.thangKeHoachText || '';
  var thangDanhGia = dinhDangThangDanhGiaMail_(thongTinSheet.thang, thongTinSheet.nam);

  var tieuDe = '[Nhắc việc] Hoàn thiện dữ liệu trước 18:00 hôm nay';

  var noiDungText =
    'Kính gửi anh/chị,\n\n' +
    'Hệ thống thông báo hôm nay lúc 18:00 sẽ khóa dữ liệu đánh giá tháng trước và kế hoạch tháng này.\n\n' +
    'Đề nghị anh/chị khẩn trương rà soát, hoàn thiện các nội dung liên quan trước thời điểm khóa.\n\n' +
    'Trường hợp anh/chị đã hoàn thành cập nhật, vui lòng bỏ qua email này.\n\n' +
    'Trân trọng!';

  var noiDungHtml =
    '<p>Kính gửi anh/chị,</p>' +
    '<p>Hệ thống thông báo hôm nay lúc <b>18:00</b> sẽ khóa dữ liệu đánh giá tháng trước và kế hoạch tháng này.</p>' +
    '<p>Đề nghị anh/chị khẩn trương rà soát, hoàn thiện các nội dung liên quan trước thời điểm khóa.</p>' +
    '<p>Trường hợp anh/chị đã hoàn thành cập nhật, vui lòng bỏ qua email này.</p>' +
    '<p>Trân trọng!</p>';

  return {
    tieuDe: tieuDe,
    noiDungText: noiDungText,
    noiDungHtml: noiDungHtml
  };
}

function maHoaHtmlEmail_(chuoi) {
  return String(chuoi || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function dinhDangThangDanhGiaMail_(thang, nam) {
  var thangSo = Number(thang);
  var namSo = Number(nam);
  if (!thangSo || !namSo) {
    return '';
  }

  if (thangSo === 1) {
    return '12.' + String(namSo - 1);
  }

  var thangText = (thangSo - 1) < 10 ? ('0' + String(thangSo - 1)) : String(thangSo - 1);
  return thangText + '.' + String(namSo);
}


