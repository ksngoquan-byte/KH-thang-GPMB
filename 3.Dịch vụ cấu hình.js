function docCauHinh_(ss) {
  var spreadsheet = ss || layBangTinhDangMo_();

  if (!coDayDuCanonicalConfigSheets_(spreadsheet)) {
    throw new Error(
      'Chưa có canonical config đầy đủ. Hãy chạy validateConfigSafe() hoặc setupCanonicalConfig_(false) trước.'
    );
  }

  return loadCanonicalConfig_(spreadsheet);
}

var REQUIRED_CANONICAL_CONFIG_SHEETS_ = ['CONFIG_CORE', 'CONFIG_HEADER_MAP', 'CONFIG_VALIDATION', 'CONFIG_FORMAT'];
var REQUIRED_CANONICAL_CORE_KEYS_ = [
  'data_sheet_name',
  'header_row',
  'first_data_row',
  'month_sheet_regex',
  'exclude_sheets',
  'department_code',
  'month_sheet_code'
];
var REQUIRED_CANONICAL_VALIDATION_FIELDS_ = ['ma_du_an_dropdown', 'chu_tri', 'phoi_hop', 'thoi_han'];
var REQUIRED_CANONICAL_FORMAT_FIELDS_ = [
  'thoi_han',
  'ngay_hoan_thanh',
  'ngan_sach_ke_hoach',
  'ngan_sach_thuc_hien'
];

function coDayDuCanonicalConfigSheets_(ss) {
  var spreadsheet = ss || layBangTinhDangMo_();
  var ketQua = phanTichCanonicalConfigSheets_(spreadsheet);

  if (!ketQua.hopLe) {
    Logger.log(
      'Canonical config chưa đầy đủ | thiếu sheet=%s | lỗi header=%s | thiếu key/rule=%s',
      JSON.stringify(ketQua.thieuSheets),
      JSON.stringify(ketQua.loiHeaders),
      JSON.stringify(ketQua.thieuNoiDung)
    );
  }

  return ketQua.hopLe;
}

function phanTichCanonicalConfigSheets_(ss) {
  var spreadsheet = ss || layBangTinhDangMo_();
  var thieuSheets = [];
  var loiHeaders = [];
  var thieuNoiDung = [];
  var duLieuTheoSheet = {};

  REQUIRED_CANONICAL_CONFIG_SHEETS_.forEach(function(sheetName) {
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      thieuSheets.push(sheetName);
      return;
    }

    var values = sheet.getDataRange().getDisplayValues();
    var headers = values.length ? values[0].map(function(item) {
      return String(item || '').trim();
    }) : [];
    var expectedHeaders = CANONICAL_CONFIG_HEADERS[sheetName] || [];
    var missingHeaders = expectedHeaders.filter(function(header) {
      return headers.indexOf(header) === -1;
    });

    if (missingHeaders.length) {
      loiHeaders.push(sheetName + ': thiếu cột ' + missingHeaders.join(', '));
      return;
    }

    try {
      duLieuTheoSheet[sheetName] = getDataRowsAsObjects_(sheet);
    } catch (error) {
      loiHeaders.push(sheetName + ': ' + (error.message || String(error)));
    }
  });

  if (!thieuSheets.length && !loiHeaders.length) {
    var coreRows = duLieuTheoSheet.CONFIG_CORE || [];
    var validationRows = duLieuTheoSheet.CONFIG_VALIDATION || [];
    var formatRows = duLieuTheoSheet.CONFIG_FORMAT || [];

    REQUIRED_CANONICAL_CORE_KEYS_.forEach(function(key) {
      if (!coDongCanonicalHopLe_(coreRows, 'key', key, 'value')) {
        thieuNoiDung.push('CONFIG_CORE thiếu key ' + key);
      }
    });

    REQUIRED_CANONICAL_VALIDATION_FIELDS_.forEach(function(fieldName) {
      if (!coDongCanonicalHopLe_(validationRows, 'field_name', fieldName, 'rule_value')) {
        thieuNoiDung.push('CONFIG_VALIDATION thiếu field ' + fieldName);
      }
    });

    REQUIRED_CANONICAL_FORMAT_FIELDS_.forEach(function(fieldName) {
      if (!coDongCanonicalHopLe_(formatRows, 'field_name', fieldName, 'format_value')) {
        thieuNoiDung.push('CONFIG_FORMAT thiếu field ' + fieldName);
      }
    });
  }

  return {
    hopLe: thieuSheets.length === 0 && loiHeaders.length === 0 && thieuNoiDung.length === 0,
    thieuSheets: thieuSheets,
    loiHeaders: loiHeaders,
    thieuNoiDung: thieuNoiDung
  };
}

function coDongCanonicalHopLe_(rows, keyName, expectedValue, valueName) {
  var row = (rows || []).find(function(item) {
    return String(item[keyName] || '').trim() === expectedValue;
  });

  return !!row && String(row[valueName] || '').trim() !== '';
}

function laySystemConfig_(config) {
  return config && config.system ? config.system : {};
}

function layValidationRules_(config) {
  return config && Array.isArray(config.validationRules) ? config.validationRules : [];
}

function layFormatRules_(config) {
  return config && Array.isArray(config.formatRules) ? config.formatRules : [];
}

function timValidationRuleTheoField_(config, fieldName) {
  return timRuleTheoFieldName_(layValidationRules_(config), fieldName);
}

function timFormatRuleTheoField_(config, fieldName) {
  return timRuleTheoFieldName_(layFormatRules_(config), fieldName);
}

function timRuleTheoFieldName_(rules, fieldName) {
  for (var i = 0; i < (rules || []).length; i++) {
    if (rules[i] && rules[i].fieldName === fieldName) {
      return rules[i];
    }
  }

  return null;
}

function timHeaderMapTheoLogicalField_(config, logicalField) {
  var headerMap = config && config.headerMap ? config.headerMap : {};
  return headerMap[logicalField] || null;
}
