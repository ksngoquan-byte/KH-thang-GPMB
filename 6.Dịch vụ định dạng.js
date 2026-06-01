function apDungDinhDang_(ss, config, dsSheetThang) {
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

    FORMAT_RULE_FIELDS_.forEach(function(ruleMeta) {
      try {
        const ruleConfig = timFormatRuleTheoField_(config, ruleMeta.fieldName);
        if (!ruleConfig) {
          Logger.log('Bỏ qua format %s vì không có cấu hình', ruleMeta.fieldName);
          return;
        }

        apDungMotRuleDinhDang_(config, ruleConfig, ruleMeta, dsSheetThang);
        soRule++;
      } catch (error) {
        soLoi++;
        Logger.log('Lỗi khi áp định dạng %s: %s', ruleMeta.fieldName, error.stack || error);
      }
    });

    Logger.log(
      'Hoàn tất apDungDinhDang_ | sheet: %s | rule OK: %s | lỗi: %s',
      dsSheetThang.length,
      soRule,
      soLoi
    );

    return {
      soSheet: dsSheetThang.length,
      soRule: soRule,
      soLoi: soLoi,
      ruleFields: FORMAT_RULE_FIELDS_.map(function(item) {
        return item.fieldName;
      })
    };
  } catch (loi) {
    Logger.log('Lỗi apDungDinhDang_: %s', loi.stack || loi);
    throw loi;
  }
}

var FORMAT_RULE_FIELDS_ = [
  { fieldName: 'thoi_han', targetColumn: 'F', formatType: 'DATE', roundTo: 0 },
  { fieldName: 'ngay_hoan_thanh', targetColumn: 'K', formatType: 'DATE', roundTo: 0 },
  { fieldName: 'ngan_sach_ke_hoach', targetColumn: 'G', formatType: 'MONEY', roundTo: 1000 },
  { fieldName: 'ngan_sach_thuc_hien', targetColumn: 'L', formatType: 'MONEY', roundTo: 1000 }
];

function apDungMotRuleDinhDang_(config, ruleConfig, ruleMeta, dsSheetThang) {
  try {
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
    const loaiDinhDang = String(ruleMeta && ruleMeta.formatType || ruleConfig.formatType || '').trim().toUpperCase();
    const mauDinhDang = String(ruleConfig.formatValueRaw || '').trim();
    const lamTronDen = Number(ruleMeta && ruleMeta.roundTo || 0);

    if (!cotDich || !loaiDinhDang || !mauDinhDang) {
      throw new Error('Thiếu targetColumn / formatType / formatValue trong canonical config');
    }

    if (dongBatDau <= 0) {
      throw new Error('start_row không hợp lệ: ' + dongBatDau);
    }

    const soCot = chuyenChuCotThanhSo_(cotDich);
    let soSheetDaAp = 0;

    dsSheetThang.forEach(function(sheet) {
      if (!sheet) {
        return;
      }

      const soDong = tinhSoDongApDungRule_(sheet, dongBatDau);
      if (soDong <= 0) {
        Logger.log(
          'Bỏ qua sheet=%s vì không có dòng hợp lệ để áp định dạng | start_row=%s',
          sheet.getName(),
          dongBatDau
        );
        return;
      }

      const range = sheet.getRange(dongBatDau, soCot, soDong, 1);

      if (loaiDinhDang === 'DATE') {
        range.setNumberFormat(mauDinhDang);
      } else if (loaiDinhDang === 'MONEY') {
        lamTronTien_(range, lamTronDen);
        range.setNumberFormat(mauDinhDang);
      } else {
        throw new Error('format_type không hỗ trợ: ' + loaiDinhDang);
      }

      soSheetDaAp++;

      Logger.log(
        'Đã áp định dạng | sheet=%s | cột=%s | type=%s | format=%s | số dòng=%s',
        sheet.getName(),
        cotDich,
        loaiDinhDang,
        mauDinhDang,
        soDong
      );
    });

    Logger.log(
      'Hoàn tất apDungMotRuleDinhDang_ | cột=%s | type=%s | số sheet đã áp=%s',
      cotDich,
      loaiDinhDang,
      soSheetDaAp
    );

    return {
      targetColumn: cotDich,
      formatType: loaiDinhDang,
      formatValue: mauDinhDang,
      soSheetDaAp: soSheetDaAp
    };
  } catch (loi) {
    Logger.log('Lỗi apDungMotRuleDinhDang_: %s', loi.stack || loi);
    throw loi;
  }
}

function lamTronTien_(range, lamTronDen) {
  try {
    if (!range) {
      throw new Error('Thiếu range để làm tròn tiền.');
    }

    if (!lamTronDen || lamTronDen <= 0) {
      Logger.log('Bỏ qua lamTronTien_ vì round_to không hợp lệ: %s', lamTronDen);
      return;
    }

    const values = range.getValues();
    const formulas = range.getFormulas();

    const output = values.map(function(row, r) {
      const cellValue = row[0];
      const hasFormula = formulas[r][0];

      if (hasFormula) return [cellValue];
      if (cellValue === '' || cellValue === null) return [''];
      if (typeof cellValue !== 'number') return [cellValue];

      return [Math.round(cellValue / lamTronDen) * lamTronDen];
    });

    range.setValues(output);

    Logger.log(
      'Đã làm tròn tiền | số dòng=%s | round_to=%s',
      output.length,
      lamTronDen
    );
  } catch (loi) {
    Logger.log('Lỗi lamTronTien_: %s', loi.stack || loi);
    throw loi;
  }
}
