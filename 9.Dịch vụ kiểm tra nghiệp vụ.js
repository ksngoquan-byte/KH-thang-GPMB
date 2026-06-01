function layCauHinhDropdownCotH_(config) {
  const rule = timValidationRuleTheoField_(config, 'chu_tri');
  if (!rule) {
    throw new Error('Không tìm thấy rule validation cho field chu_tri trong canonical config.');
  }

  return rule;
}

function kiemTraDropdownCotH(sheet, config) {
  if (!sheet) {
    throw new Error('Thiếu sheet để kiểm tra dropdown cột H.');
  }

  const system = laySystemConfig_(config);
  layCauHinhDropdownCotH_(config);
  const dongBatDau = Number(system.first_data_row || 6);
  const cotH = 8;
  const soDongKiemTra = Math.max(sheet.getLastRow() - dongBatDau + 1, 1);

  const rules = sheet.getRange(dongBatDau, cotH, soDongKiemTra, 1).getDataValidations();

  let soOCoDropdown = 0;

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i][0];
    if (rule) {
      soOCoDropdown++;
    }
  }

  return {
    tenSheet: sheet.getName(),
    hopLe: soOCoDropdown > 0,
    thongTin: 'Cột H có ' + soOCoDropdown + ' ô đang mang data validation'
  };
}

function chayKiemTraNghiepVu_Buoc4_1() {
  try {
    const ss = layBangTinhDangMo_();
    const config = docCauHinh_(ss);
    const danhSachSheetThang = layDanhSachSheetThang_(ss, config);

    if (danhSachSheetThang.length === 0) {
      Logger.log('Không tìm thấy sheet tháng hợp lệ.');
      return;
    }

    let tongLoi = 0;

    Logger.log(
      'Bắt đầu kiểm tra nghiệp vụ Bước 4.1 | chỉ kiểm tra dropdown cột H | số sheet: %s',
      danhSachSheetThang.length
    );

    danhSachSheetThang.forEach(function(sheet, index) {
      const ketQuaH = kiemTraDropdownCotH(sheet, config);

      Logger.log('%s. Sheet | %s', index + 1, sheet.getName());

      if (ketQuaH.hopLe) {
        Logger.log('   - OK cột H | %s', ketQuaH.thongTin);
      } else {
        Logger.log('   - LỖI cột H | %s', ketQuaH.thongTin);
        tongLoi++;
      }
    });

    Logger.log(
      'Hoàn tất kiểm tra nghiệp vụ Bước 4.1 | số sheet: %s | tổng lỗi: %s',
      danhSachSheetThang.length,
      tongLoi
    );
  } catch (loi) {
    Logger.log('Lỗi chayKiemTraNghiepVu_Buoc4_1: %s', loi.stack || loi);
    throw loi;
  }
}

function layCauHinhFormatTheoField_(config, fieldName) {
  const rule = timFormatRuleTheoField_(config, fieldName);
  if (!rule) {
    throw new Error('Không tìm thấy rule format cho field ' + fieldName + ' trong canonical config.');
  }

  return rule;
}

function kiemTraFormatNgayTheoField(sheet, config, fieldName, chuCot) {
  if (!sheet) {
    throw new Error('Thiếu sheet để kiểm tra format ngày.');
  }

  const system = laySystemConfig_(config);
  const cauHinh = layCauHinhFormatTheoField_(config, fieldName);
  const dongBatDau = Number(system.first_data_row || 6);
  const cot = String(chuCot || '').trim();
  const dinhDangMongMuon = String(cauHinh.formatValueRaw || 'dd/MM/yyyy').trim();

  if (!cot) {
    throw new Error('Thiếu chuCot cho field ' + fieldName);
  }

  const soCot = chuyenChuCotThanhSo_(cot);
  const dinhDangThucTe = sheet.getRange(dongBatDau, soCot).getNumberFormat();

  return {
    tenSheet: sheet.getName(),
    fieldName: fieldName,
    cot: cot,
    hopLe: dinhDangThucTe === dinhDangMongMuon,
    thongTin: 'Ô ' + cot + dongBatDau + ' có format [' + dinhDangThucTe + '], mong muốn [' + dinhDangMongMuon + ']'
  };
}

function kiemTraFormatTienTheoField(sheet, config, fieldName, chuCot) {
  if (!sheet) {
    throw new Error('Thiếu sheet để kiểm tra format tiền.');
  }

  const system = laySystemConfig_(config);
  layCauHinhFormatTheoField_(config, fieldName);
  const dongBatDau = Number(system.first_data_row || 6);
  const cot = String(chuCot || '').trim();

  if (!cot) {
    throw new Error('Thiếu chuCot cho field ' + fieldName);
  }

  const soCot = chuyenChuCotThanhSo_(cot);
  const dinhDangThucTe = sheet.getRange(dongBatDau, soCot).getNumberFormat();

  return {
    tenSheet: sheet.getName(),
    fieldName: fieldName,
    cot: cot,
    hopLe: !!dinhDangThucTe && dinhDangThucTe.indexOf('#') !== -1,
    thongTin: 'Ô ' + cot + dongBatDau + ' có format [' + dinhDangThucTe + ']'
  };
}

function chayKiemTraNghiepVu_Buoc4_2() {
  try {
    const ss = layBangTinhDangMo_();
    const config = docCauHinh_(ss);
    const danhSachSheetThang = layDanhSachSheetThang_(ss, config);

    if (danhSachSheetThang.length === 0) {
      Logger.log('Không tìm thấy sheet tháng hợp lệ.');
      return;
    }

    let tongLoi = 0;

    Logger.log(
      'Bắt đầu kiểm tra nghiệp vụ Bước 4.2 | format F, K, G, L | số sheet: %s',
      danhSachSheetThang.length
    );

    danhSachSheetThang.forEach(function(sheet, index) {
      Logger.log('%s. Sheet | %s', index + 1, sheet.getName());

      const ketQuaF = kiemTraFormatNgayTheoField(sheet, config, 'thoi_han', 'F');
      const ketQuaK = kiemTraFormatNgayTheoField(sheet, config, 'ngay_hoan_thanh', 'K');
      const ketQuaG = kiemTraFormatTienTheoField(sheet, config, 'ngan_sach_ke_hoach', 'G');
      const ketQuaL = kiemTraFormatTienTheoField(sheet, config, 'ngan_sach_thuc_hien', 'L');

      [ketQuaF, ketQuaK, ketQuaG, ketQuaL].forEach(function(ketQua) {
        if (ketQua.hopLe) {
          Logger.log('   - OK %s | %s', ketQua.cot, ketQua.thongTin);
        } else {
          Logger.log('   - LỖI %s | %s', ketQua.cot, ketQua.thongTin);
          tongLoi++;
        }
      });
    });

    Logger.log(
      'Hoàn tất kiểm tra nghiệp vụ Bước 4.2 | số sheet: %s | tổng lỗi: %s',
      danhSachSheetThang.length,
      tongLoi
    );
  } catch (loi) {
    Logger.log('Lỗi chayKiemTraNghiepVu_Buoc4_2: %s', loi.stack || loi);
    throw loi;
  }
}

function laHangTongTheoCotA(giaTriCotA) {
  return String(giaTriCotA || '').trim() === '∑';
}

function laHangTieuDeNhomTheoCotA(giaTriCotA) {
  const giaTri = String(giaTriCotA || '').trim();
  return /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)$/.test(giaTri);
}

function kiemTraMauMotHang(sheet, soDong, giaTriCotA) {
  const cauHinhMau = CAU_HINH_UNG_DUNG.KIEM_TRA_MAU;

  const mauNenTrai = sheet.getRange(soDong, 1, 1, 10).getBackgrounds()[0];
  const mauNenPhai = sheet.getRange(soDong, 11, 1, 6).getBackgrounds()[0];
  const mauChuCaHang = sheet.getRange(soDong, 1, 1, 16).getFontColors()[0];

  const ketQua = {
    hopLe: true,
    danhSachLoi: []
  };

  if (laHangTongTheoCotA(giaTriCotA)) {
    const tatCaNenDung = mauNenTrai.every(function(mau) {
      return mau.toLowerCase() === cauHinhMau.MAU_HANG_TONG_NEN.toLowerCase();
    }) && mauNenPhai.every(function(mau) {
      return mau.toLowerCase() === cauHinhMau.MAU_HANG_TONG_NEN.toLowerCase();
    });

    const tatCaChuDung = mauChuCaHang.every(function(mau) {
      return mau.toLowerCase() === cauHinhMau.MAU_HANG_TONG_CHU.toLowerCase();
    });

    if (!tatCaNenDung) {
      ketQua.hopLe = false;
      ketQua.danhSachLoi.push('Hàng ∑ chưa tô đúng màu nền xanh đậm toàn hàng A:P');
    }

    if (!tatCaChuDung) {
      ketQua.hopLe = false;
      ketQua.danhSachLoi.push('Hàng ∑ chưa đúng màu chữ trắng toàn hàng A:P');
    }

    return ketQua;
  }

  if (laHangTieuDeNhomTheoCotA(giaTriCotA)) {
    return ketQua;
  }

  const khoiTraiDung = mauNenTrai.every(function(mau) {
    return mau.toLowerCase() === cauHinhMau.MAU_HANG_CON_KHOI_TRAI.toLowerCase();
  });

  const khoiPhaiDung = mauNenPhai.every(function(mau) {
    return mau.toLowerCase() === cauHinhMau.MAU_HANG_CON_KHOI_PHAI.toLowerCase();
  });

  if (!khoiTraiDung) {
    ketQua.hopLe = false;
    ketQua.danhSachLoi.push('Hàng con chưa đúng màu nền khối A:J');
  }

  if (!khoiPhaiDung) {
    ketQua.hopLe = false;
    ketQua.danhSachLoi.push('Hàng con chưa đúng màu nền khối K:P');
  }

  return ketQua;
}

function kiemTraMauNghiepVuSheetThang(sheet) {
  if (!sheet) {
    throw new Error('Thiếu sheet để kiểm tra màu nghiệp vụ.');
  }

  const dongBatDau = CAU_HINH_UNG_DUNG.KIEM_TRA_MAU.DONG_BAT_DAU_DU_LIEU;
  const lastRow = sheet.getLastRow();

  const danhSachLoi = [];
  let soHangKiemTra = 0;

  if (lastRow < dongBatDau) {
    return {
      tenSheet: sheet.getName(),
      hopLe: true,
      soHangKiemTra: 0,
      danhSachLoi: []
    };
  }

  const giaTriCotA = sheet.getRange(dongBatDau, 1, lastRow - dongBatDau + 1, 1).getValues();

  for (let i = 0; i < giaTriCotA.length; i++) {
    const soDong = dongBatDau + i;
    const giaTriA = giaTriCotA[i][0];

    if (String(giaTriA || '').trim() === '') {
      continue;
    }

    const ketQuaHang = kiemTraMauMotHang(sheet, soDong, giaTriA);
    soHangKiemTra++;

    if (!ketQuaHang.hopLe) {
      ketQuaHang.danhSachLoi.forEach(function(noiDungLoi) {
        danhSachLoi.push('Dòng ' + soDong + ' | ' + noiDungLoi);
      });
    }
  }

  return {
    tenSheet: sheet.getName(),
    hopLe: danhSachLoi.length === 0,
    soHangKiemTra: soHangKiemTra,
    danhSachLoi: danhSachLoi
  };
}

function chayKiemTraNghiepVu_Buoc4_3() {
  try {
    const ss = layBangTinhDangMo_();
    const config = docCauHinh_(ss);
    const danhSachSheetThang = layDanhSachSheetThang_(ss, config);

    if (danhSachSheetThang.length === 0) {
      Logger.log('Không tìm thấy sheet tháng hợp lệ.');
      return;
    }

    let tongLoi = 0;

    Logger.log(
      'Bắt đầu kiểm tra nghiệp vụ Bước 4.3 | màu hàng con và hàng ∑ | số sheet: %s',
      danhSachSheetThang.length
    );

    danhSachSheetThang.forEach(function(sheet, index) {
      const ketQua = kiemTraMauNghiepVuSheetThang(sheet);

      if (ketQua.hopLe) {
        Logger.log(
          '%s. OK | %s | số hàng kiểm tra: %s',
          index + 1,
          ketQua.tenSheet,
          ketQua.soHangKiemTra
        );
      } else {
        Logger.log(
          '%s. LỖI | %s | số hàng kiểm tra: %s',
          index + 1,
          ketQua.tenSheet,
          ketQua.soHangKiemTra
        );

        ketQua.danhSachLoi.forEach(function(loi) {
          Logger.log('   - %s', loi);
          tongLoi++;
        });
      }
    });

    Logger.log(
      'Hoàn tất kiểm tra nghiệp vụ Bước 4.3 | số sheet: %s | tổng lỗi: %s',
      danhSachSheetThang.length,
      tongLoi
    );
  } catch (loi) {
    Logger.log('Lỗi chayKiemTraNghiepVu_Buoc4_3: %s', loi.stack || loi);
    throw loi;
  }
}

function debugMauDongHienTai(tenSheet, soDong) {
  try {
    if (!tenSheet) {
      throw new Error('Thiếu tên sheet.');
    }

    if (!soDong || soDong <= 0) {
      throw new Error('Số dòng không hợp lệ.');
    }

    const bangTinh = layBangTinhDangMo_();
    const sheet = bangTinh.getSheetByName(tenSheet);

    if (!sheet) {
      throw new Error('Không tìm thấy sheet: ' + tenSheet);
    }

    const mauNenTrai = sheet.getRange(soDong, 1, 1, 10).getBackgrounds()[0];
    const mauNenPhai = sheet.getRange(soDong, 11, 1, 6).getBackgrounds()[0];
    const mauChuCaHang = sheet.getRange(soDong, 1, 1, 16).getFontColors()[0];
    const giaTriCotA = sheet.getRange(soDong, 1).getDisplayValue();

    Logger.log('Sheet: %s | Dòng: %s | Cột A: [%s]', tenSheet, soDong, giaTriCotA);
    Logger.log('Nen trai A:J = %s', JSON.stringify(mauNenTrai));
    Logger.log('Nen phai K:P = %s', JSON.stringify(mauNenPhai));
    Logger.log('Chu A:P = %s', JSON.stringify(mauChuCaHang));
  } catch (error) {
    Logger.log('Lỗi debugMauDongHienTai: %s', error.stack || error);
    throw error;
  }
}

function debugMauMauDaiDien() {
  try {
    const ss = layBangTinhDangMo_();
    const config = docCauHinh_(ss);
    const danhSachSheetThang = layDanhSachSheetThang_(ss, config);

    if (!danhSachSheetThang.length) {
      Logger.log('Không có sheet tháng nào để debug màu.');
      return;
    }

    const sheet = danhSachSheetThang[0];

    Logger.log('Debug màu trên sheet đại diện: %s', sheet.getName());
    debugMauDongHienTai(sheet.getName(), 6);
  } catch (error) {
    Logger.log('Lỗi debugMauMauDaiDien: %s', error.stack || error);
    throw error;
  }
}
