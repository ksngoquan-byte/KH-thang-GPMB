function layBangTinhMucTieu() {
  return layBangTinhDangMo_();
}

function layDanhSachSheetThang() {
  const bangTinh = layBangTinhMucTieu();
  const bieuThucSheetThang = CAU_HINH_UNG_DUNG.KIEM_TRA_CAU_TRUC.BIEU_THUC_SHEET_THANG;

  const danhSachSheetThang = bangTinh.getSheets().filter(function(sheet) {
    return bieuThucSheetThang.test(sheet.getName());
  });

  return danhSachSheetThang;
}

function kiemTraSheetBatBuoc() {
  const bangTinh = layBangTinhMucTieu();
  const danhSachThieu = [];

  if (!bangTinh.getSheetByName(CAU_HINH_UNG_DUNG.TEN_SHEET.DATA)) {
    danhSachThieu.push(CAU_HINH_UNG_DUNG.TEN_SHEET.DATA);
  }

  ['CONFIG_CORE', 'CONFIG_HEADER_MAP', 'CONFIG_VALIDATION', 'CONFIG_FORMAT'].forEach(function(tenSheet) {
    if (!bangTinh.getSheetByName(tenSheet)) {
      danhSachThieu.push(tenSheet);
    }
  });

  return {
    hopLe: danhSachThieu.length === 0,
    danhSachThieu: danhSachThieu
  };
}

function chayKiemTraCauTruc_Buoc2() {
  try {
    const ketQuaSheetBatBuoc = kiemTraSheetBatBuoc();

    if (!ketQuaSheetBatBuoc.hopLe) {
      Logger.log('Thiếu sheet bắt buộc: ' + ketQuaSheetBatBuoc.danhSachThieu.join(', '));
      return;
    }

    const danhSachSheetThang = layDanhSachSheetThang();

    if (danhSachSheetThang.length === 0) {
      Logger.log('Không tìm thấy sheet tháng hợp lệ.');
      return;
    }

    Logger.log('Đã tìm thấy ' + danhSachSheetThang.length + ' sheet tháng:');

    danhSachSheetThang.forEach(function(sheet, index) {
      Logger.log((index + 1) + '. ' + sheet.getName());
    });

  } catch (loi) {
    Logger.log('Lỗi chayKiemTraCauTruc_Buoc2: ' + loi.message);
    throw loi;
  }
}

function chuyenSoCotThanhChu(soCot) {
  let ketQua = '';
  let giaTriTam = soCot;

  while (giaTriTam > 0) {
    const phanDu = (giaTriTam - 1) % 26;
    ketQua = String.fromCharCode(65 + phanDu) + ketQua;
    giaTriTam = Math.floor((giaTriTam - 1) / 26);
  }

  return ketQua;
}

function kiemTraCauTrucCoBanSheetThang(sheet) {
  const cauHinh = CAU_HINH_UNG_DUNG.KIEM_TRA_CAU_TRUC;
  const danhSachLoi = [];

  const soCotHienTai = sheet.getLastColumn();
  if (soCotHienTai < cauHinh.SO_COT_TOI_THIEU) {
    danhSachLoi.push(
      'Thiếu cột: hiện tại ' + soCotHienTai + ', yêu cầu tối thiểu ' + cauHinh.SO_COT_TOI_THIEU
    );
  }

  cauHinh.CAC_COT_NGAY.forEach(function(soCot) {
    const dinhDang = sheet.getRange(cauHinh.DONG_BAT_DAU_DU_LIEU, soCot).getNumberFormat();

    if (dinhDang !== 'dd/MM/yyyy') {
      danhSachLoi.push(
        'Cột ' + chuyenSoCotThanhChu(soCot) + ' chưa đúng định dạng ngày dd/MM/yyyy'
      );
    }
  });

  cauHinh.CAC_COT_TIEN.forEach(function(soCot) {
    const dinhDang = sheet.getRange(cauHinh.DONG_BAT_DAU_DU_LIEU, soCot).getNumberFormat();

    if (!dinhDang || dinhDang.indexOf('#') === -1) {
      danhSachLoi.push(
        'Cột ' + chuyenSoCotThanhChu(soCot) + ' có thể chưa đúng định dạng số tiền'
      );
    }
  });

  return {
    tenSheet: sheet.getName(),
    hopLe: danhSachLoi.length === 0,
    danhSachLoi: danhSachLoi
  };
}

function chayKiemTraCauTruc_Buoc3() {
  try {
    const ketQuaSheetBatBuoc = kiemTraSheetBatBuoc();

    if (!ketQuaSheetBatBuoc.hopLe) {
      Logger.log('Thiếu sheet bắt buộc: ' + ketQuaSheetBatBuoc.danhSachThieu.join(', '));
      return;
    }

    const danhSachSheetThang = layDanhSachSheetThang();

    if (danhSachSheetThang.length === 0) {
      Logger.log('Không tìm thấy sheet tháng hợp lệ.');
      return;
    }

    let tongLoi = 0;

    Logger.log('Bắt đầu kiểm tra cấu trúc ' + danhSachSheetThang.length + ' sheet tháng');

    danhSachSheetThang.forEach(function(sheet, index) {
      const ketQua = kiemTraCauTrucCoBanSheetThang(sheet);

      if (ketQua.hopLe) {
        Logger.log((index + 1) + '. OK | ' + ketQua.tenSheet);
      } else {
        Logger.log((index + 1) + '. LỖI | ' + ketQua.tenSheet);

        ketQua.danhSachLoi.forEach(function(noiDungLoi) {
          Logger.log('   - ' + noiDungLoi);
          tongLoi++;
        });
      }
    });

    Logger.log(
      'Hoàn tất kiểm tra cấu trúc | số sheet: ' +
      danhSachSheetThang.length +
      ' | tổng lỗi: ' +
      tongLoi
    );

  } catch (loi) {
    Logger.log('Lỗi chayKiemTraCauTruc_Buoc3: ' + loi.message);
    throw loi;
  }
}
