function layBangTinhDangMo_() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (!ss) {
      throw new Error('Không lấy được bảng tính đang mở.');
    }

    return ss;
  } catch (loi) {
    Logger.log('Lỗi layBangTinhDangMo_: %s', loi.stack || loi);
    throw loi;
  }
}

function layDanhSachSheetThang_(ss, config) {
  try {
    if (!ss) {
      throw new Error('Thiếu bảng tính đầu vào.');
    }

    if (!config || typeof config !== 'object') {
      throw new Error('Config không hợp lệ.');
    }

    const system = laySystemConfig_(config);
    const regexText = layMonthSheetRegexText_(system);
    const excludeSheets = layDanhSachSheetLoaiTru_(system);

    if (!regexText) {
      throw new Error('Canonical config thiếu system.month_sheet_regex');
    }

    const regex = new RegExp(regexText);
    const tatCaSheet = ss.getSheets();

    const dsSheetThang = tatCaSheet.filter(function(sheet) {
      const tenSheet = sheet.getName();

      if (excludeSheets.includes(tenSheet)) {
        return false;
      }

      return regex.test(tenSheet);
    });

    Logger.log(
      'layDanhSachSheetThang_ | tong sheet: %s | sheet thang hop le: %s',
      tatCaSheet.length,
      dsSheetThang.length
    );

    return dsSheetThang;
  } catch (loi) {
    Logger.log('Lỗi layDanhSachSheetThang_: %s', loi.stack || loi);
    throw loi;
  }
}

function layMonthSheetRegexText_(system) {
  return String((system.month_sheet_regex_raw || system.month_sheet_regex || '')).trim();
}

function layDanhSachSheetLoaiTru_(system) {
  var excludeSource = Array.isArray(system.exclude_sheets)
    ? system.exclude_sheets.join(',')
    : (system.exclude_sheets_raw || system.exclude_sheets || '');

  return String(excludeSource || '')
    .split(',')
    .map(function(s) {
      return s.trim();
    })
    .filter(Boolean);
}

function chuyenChuCotThanhSo_(letter) {
  try {
    const text = String(letter || '').toUpperCase().trim();

    if (!text) {
      throw new Error('Thiếu ký tự cột.');
    }

    if (!/^[A-Z]+$/.test(text)) {
      throw new Error('Ký tự cột không hợp lệ: ' + letter);
    }

    let column = 0;

    for (let i = 0; i < text.length; i++) {
      column = column * 26 + (text.charCodeAt(i) - 64);
    }

    return column;
  } catch (loi) {
    Logger.log('Lỗi chuyenChuCotThanhSo_: %s', loi.stack || loi);
    throw loi;
  }
}

function taoHoacCapNhatSheetData2_() {
  try {
    const ss = layBangTinhDangMo_();
    const tenSheet = CAU_HINH_UNG_DUNG.TEN_SHEET.DATA_2 || 'Data (2)';
    const duLieu = [
      ['cap_cong_viec', 'mo_ta'],
      ['Nhóm', 'Cấp 0 - nhóm công việc, hiển thị I, II, III...'],
      ['Cấp 1', 'Cấp 1 - hiển thị 1, 2, 3...'],
      ['Cấp 2', 'Cấp 2 - hiển thị 1.1, 1.2...'],
      ['Cấp 3', 'Cấp 3 - hiển thị 1.1.1, 1.1.2...'],
      ['Cấp 4', 'Cấp 4 - hiển thị 1.1.1.1, 1.1.1.2...']
    ];

    let sheet = ss.getSheetByName(tenSheet);
    if (!sheet) {
      sheet = ss.insertSheet(tenSheet);
    }

    sheet.clearContents();
    sheet.clearFormats();
    sheet.getRange(1, 1, duLieu.length, duLieu[0].length).setValues(duLieu);
    sheet.getRange('A1:B1').setFontWeight('bold').setBackground('#d9e2f3');
    sheet.autoResizeColumns(1, 2);
    sheet.setFrozenRows(1);

    Logger.log('Đã tạo/cập nhật sheet %s cho dropdown cấu trúc công việc.', tenSheet);
    return {
      tenSheet: tenSheet,
      soDong: duLieu.length
    };
  } catch (error) {
    Logger.log('Lỗi taoHoacCapNhatSheetData2_: %s', error.stack || error);
    throw error;
  }
}
