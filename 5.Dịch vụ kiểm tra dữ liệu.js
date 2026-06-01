function apDungDropdown_(ss, config, dsSheetThang) {
  try {
    if (!ss) {
      throw new Error('Thiếu bảng tính đầu vào.');
    }

    if (!config || typeof config !== 'object') {
      throw new Error('Config không hợp lệ.');
    }

    if (!Array.isArray(dsSheetThang)) {
      throw new Error('Danh sách sheet tháng không hợp lệ.');
    }

    let soRule = 0;
    let soLoi = 0;

    DROPDOWN_RULE_FIELDS_.forEach(function(ruleMeta) {
      try {
        const ruleConfig = timValidationRuleTheoField_(config, ruleMeta.fieldName);
        if (!ruleConfig) {
          Logger.log('Bỏ qua rule dropdown %s vì không có cấu hình', ruleMeta.fieldName);
          return;
        }

        apDungMotRuleDropdown_(ss, config, ruleConfig, ruleMeta, dsSheetThang);
        soRule++;
      } catch (error) {
        soLoi++;
        Logger.log('Lỗi khi áp rule %s: %s', ruleMeta.fieldName, error.stack || error);
      }
    });

    Logger.log(
      'Hoàn tất apDungDropdown_ | sheet: %s | rule OK: %s | lỗi: %s',
      dsSheetThang.length,
      soRule,
      soLoi
    );

    return {
      soSheet: dsSheetThang.length,
      soRule: soRule,
      soLoi: soLoi,
      ruleFields: DROPDOWN_RULE_FIELDS_.map(function(item) {
        return item.fieldName;
      })
    };
  } catch (loi) {
    Logger.log('Lỗi apDungDropdown_: %s', loi.stack || loi);
    throw loi;
  }
}

var DROPDOWN_RULE_FIELDS_ = [
  { fieldName: 'ma_du_an_dropdown', targetColumn: 'C', allowInvalid: false },
  { fieldName: 'chu_tri', targetColumn: 'H', allowInvalid: false },
  { fieldName: 'phoi_hop', targetColumn: 'I', allowInvalid: true }
];

function tachNguonRangeA1_(ruleValueRaw, defaultSheetName) {
  const raw = String(ruleValueRaw || '').trim();
  const fallbackSheetName = String(defaultSheetName || '').trim();

  if (!raw) {
    throw new Error('Thiếu rule_value cho validation range.');
  }

  const match = raw.match(/^([^!]+)!(.+)$/);
  if (match) {
    const sourceSheet = String(match[1] || '').trim();
    const sourceRange = String(match[2] || '').trim();

    if (!sourceSheet || !sourceRange) {
      throw new Error('rule_value không hợp lệ: ' + raw);
    }

    return {
      sourceSheet: sourceSheet,
      sourceRange: sourceRange
    };
  }

  if (!fallbackSheetName) {
    throw new Error('Thiếu defaultSheetName cho validation range: ' + raw);
  }

  return {
    sourceSheet: fallbackSheetName,
    sourceRange: raw
  };
}

function tinhSoDongApDungRule_(sheet, dongBatDau) {
  const maxRows = sheet.getMaxRows();
  const lastRow = sheet.getLastRow();
  const dongKetThuc = Math.min(maxRows, Math.max(lastRow, dongBatDau) + 300);

  if (dongKetThuc < dongBatDau) {
    return 0;
  }

  return dongKetThuc - dongBatDau + 1;
}

function apDungMotRuleDropdown_(ss, config, ruleConfig, ruleMeta, dsSheetThang) {
  try {
    if (!ss) {
      throw new Error('Thiếu bảng tính đầu vào.');
    }

    if (!config || typeof config !== 'object') {
      throw new Error('Config không hợp lệ.');
    }

    if (!ruleConfig || typeof ruleConfig !== 'object') {
      throw new Error('Rule config không hợp lệ.');
    }

    if (!Array.isArray(dsSheetThang)) {
      throw new Error('Danh sách sheet tháng không hợp lệ.');
    }

    const system = laySystemConfig_(config);
    const cotDich = String(ruleMeta && ruleMeta.targetColumn || '').trim();
    const dongBatDau = Number(system.first_data_row || 6);
    const nguonRange = tachNguonRangeA1_(ruleConfig.ruleValueRaw, system.data_sheet_name || 'Data');
    const tenSheetNguon = nguonRange.sourceSheet;
    const vungNguonA1 = nguonRange.sourceRange;
    const choPhepSai = !!(ruleMeta && ruleMeta.allowInvalid);

    if (!cotDich || !tenSheetNguon || !vungNguonA1) {
      throw new Error('Thiếu targetColumn / sourceSheet / sourceRange trong canonical config');
    }

    if (dongBatDau <= 0) {
      throw new Error('start_row không hợp lệ: ' + dongBatDau);
    }

    const sourceSheet = ss.getSheetByName(tenSheetNguon);
    if (!sourceSheet) {
      throw new Error('Không tìm thấy sheet nguồn: ' + tenSheetNguon);
    }

    const sourceRange = sourceSheet.getRange(vungNguonA1);
    const soCot = chuyenChuCotThanhSo_(cotDich);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(sourceRange, true)
      .setAllowInvalid(choPhepSai)
      .build();
    let soSheetDaAp = 0;

    dsSheetThang.forEach(function(sheet) {
      if (!sheet) {
        return;
      }

      const soDong = tinhSoDongApDungRule_(sheet, dongBatDau);
      if (soDong <= 0) {
        Logger.log(
          'Bỏ qua sheet=%s vì không có dòng hợp lệ để áp dropdown | start_row=%s',
          sheet.getName(),
          dongBatDau
        );
        return;
      }

      const targetRange = sheet.getRange(dongBatDau, soCot, soDong, 1);
      targetRange.setDataValidation(rule);
      soSheetDaAp++;

      Logger.log(
        'Đã áp dropdown | sheet=%s | cột=%s | nguồn=%s!%s | số dòng=%s',
        sheet.getName(),
        cotDich,
        tenSheetNguon,
        vungNguonA1,
        soDong
      );
    });

    Logger.log(
      'Hoàn tất apDungMotRuleDropdown_ | cột=%s | số sheet đã áp=%s',
      cotDich,
      soSheetDaAp
    );

    return {
      targetColumn: cotDich,
      sourceSheet: tenSheetNguon,
      sourceRange: vungNguonA1,
      soSheetDaAp: soSheetDaAp
    };
  } catch (loi) {
    Logger.log('Lỗi apDungMotRuleDropdown_: %s', loi.stack || loi);
    throw loi;
  }
}

function apDungDropdownCapCongViec_(ss, config, dsSheetThang) {
  try {
    if (!ss) {
      throw new Error('Thiếu bảng tính đầu vào.');
    }

    if (!config || typeof config !== 'object') {
      throw new Error('Config không hợp lệ.');
    }

    if (!Array.isArray(dsSheetThang)) {
      throw new Error('Danh sách sheet tháng không hợp lệ.');
    }

    const system = laySystemConfig_(config);
    const dongBatDau = Number(system.first_data_row || 6);
    const tenSheetNguon = CAU_HINH_UNG_DUNG.TEN_SHEET.DATA_2 || 'Data (2)';
    const sheetNguon = ss.getSheetByName(tenSheetNguon);

    if (!sheetNguon) {
      throw new Error('Không tìm thấy sheet nguồn dropdown cấp công việc: ' + tenSheetNguon);
    }

    const sourceRange = sheetNguon.getRange('A2:A6');
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(sourceRange, true)
      .setAllowInvalid(true)
      .build();
    let soSheetDaAp = 0;

    dsSheetThang.forEach(function(sheet) {
      if (!sheet) {
        return;
      }

      const soDong = tinhSoDongApDungRule_(sheet, dongBatDau);
      if (soDong <= 0) {
        return;
      }

      sheet.getRange(dongBatDau, 1, soDong, 1).setDataValidation(rule);
      soSheetDaAp++;
    });

    Logger.log(
      'Đã áp dropdown cấp công việc | source=%s!A2:A6 | soSheet=%s',
      tenSheetNguon,
      soSheetDaAp
    );

    return {
      tenSheetNguon: tenSheetNguon,
      soSheetDaAp: soSheetDaAp
    };
  } catch (loi) {
    Logger.log('Lỗi apDungDropdownCapCongViec_: %s', loi.stack || loi);
    throw loi;
  }
}
