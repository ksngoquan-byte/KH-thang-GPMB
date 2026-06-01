// Lean canonical config runtime for one active spreadsheet.
// This file intentionally redefines the canonical helpers with the simplified
// schema requested for in-sheet setup, load, validate, and test.

var CANONICAL_CONFIG_VERSION = 'canonical-1-link-seeded-v1';

var CANONICAL_CONFIG_FLAGS = {
  FORCE_RESET: false,
  TEST_MODE: true
};

var CANONICAL_CONFIG_SHEETS = {
  CORE: 'CONFIG_CORE',
  HEADER_MAP: 'CONFIG_HEADER_MAP',
  VALIDATION: 'CONFIG_VALIDATION',
  FORMAT: 'CONFIG_FORMAT'
};

var CANONICAL_CONFIG_HEADERS = {
  CONFIG_CORE: ['key', 'value', 'note'],
  CONFIG_HEADER_MAP: ['logical_field', 'header_text', 'required', 'note'],
  CONFIG_VALIDATION: ['field_name', 'rule_type', 'rule_value', 'message'],
  CONFIG_FORMAT: ['field_name', 'format_type', 'format_value', 'note']
};

var CANONICAL_CONFIG_SEEDS = {
  CONFIG_CORE: [
    ['data_sheet_name', 'Data', 'Sheet du lieu chinh'],
    ['header_row', '5', 'Dong tieu de'],
    ['first_data_row', '6', 'Dong du lieu dau tien'],
    ['month_sheet_regex', '^.+\\s[-\u2013]\\sT(0[1-9]|1[0-2])\\.2026$', 'Regex sheet thang'],
    ['exclude_sheets', 'Data,CONFIG_CORE,CONFIG_HEADER_MAP,CONFIG_VALIDATION,CONFIG_FORMAT', 'Bo qua khi quet'],
    ['department_code', 'UBNCSP', 'Ma don vi'],
    ['month_sheet_code', 'UBNCSP', 'Ma sheet thang']
  ],
  CONFIG_HEADER_MAP: [
    ['ma_du_an', 'M\u00e3 d\u1ef1 \u00e1n', 'TRUE', 'Map ma du an'],
    ['noi_dung', 'N\u1ed9i dung c\u00f4ng vi\u1ec7c', 'TRUE', 'Map noi dung'],
    ['chu_tri', 'Ch\u1ee7 tr\u00ec', 'FALSE', 'Map nguoi chu tri'],
    ['thoi_han', 'Th\u1eddi h\u1ea1n', 'FALSE', 'Map deadline']
  ],
  CONFIG_VALIDATION: [
    ['ma_du_an', 'required', 'TRUE', 'Ma du an la bat buoc'],
    ['ma_du_an_dropdown', 'range', 'Data!C6:C', 'Nguon dropdown cot C'],
    ['chu_tri', 'range', 'Data!L6:L56', 'Nguon dropdown cot H'],
    ['phoi_hop', 'range', 'Data!L6:L106', 'Nguon dropdown cot I chon nhieu gia tri'],
    ['thoi_han', 'date', 'dd/MM/yyyy', 'Thoi han phai la ngay hop le'],
    ['email', 'regex', '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', 'Email khong hop le']
  ],
  CONFIG_FORMAT: [
    ['thoi_han', 'date', 'dd/MM/yyyy', 'Dinh dang ngay'],
    ['ngay_hoan_thanh', 'date', 'dd/MM/yyyy', 'Dinh dang ngay hoan thanh'],
    ['ngan_sach_ke_hoach', 'money', '#,##0', 'Dinh dang ngan sach ke hoach'],
    ['ngan_sach_thuc_hien', 'money', '#,##0', 'Dinh dang ngan sach thuc hien'],
    ['muc_do_uu_tien', 'list', 'Th\u1ea5p|Trung b\u00ecnh|Cao', 'Danh sach uu tien']
  ]
};

var CANONICAL_CONFIG_SCHEMA = {
  requiredSheets: [
    CANONICAL_CONFIG_SHEETS.CORE,
    CANONICAL_CONFIG_SHEETS.HEADER_MAP,
    CANONICAL_CONFIG_SHEETS.VALIDATION,
    CANONICAL_CONFIG_SHEETS.FORMAT
  ],
  coreKeys: {
    data_sheet_name: { type: 'STRING', required: true, default: 'Data' },
    header_row: { type: 'NUMBER', required: true, default: 5 },
    first_data_row: { type: 'NUMBER', required: true, default: 6 },
    month_sheet_regex: { type: 'REGEX', required: true, default: '^.+\\s[-\u2013]\\sT(0[1-9]|1[0-2])\\.2026$' },
    exclude_sheets: { type: 'STRING', required: true, default: 'Data,CONFIG_CORE,CONFIG_HEADER_MAP,CONFIG_VALIDATION,CONFIG_FORMAT' },
    department_code: { type: 'STRING', required: true, default: 'UBNCSP' },
    month_sheet_code: { type: 'STRING', required: true, default: 'UBNCSP' }
  },
  validationRuleTypes: ['required', 'date', 'regex', 'range'],
  formatTypes: ['date', 'list', 'money']
};

var CONFIG_DEFAULTS = {
  version: CANONICAL_CONFIG_VERSION,
  system: {
    data_sheet_name: 'Data',
    header_row: 5,
    first_data_row: 6,
    month_sheet_regex_raw: '^.+\\s[-\u2013]\\sT(0[1-9]|1[0-2])\\.2026$',
    exclude_sheets_raw: 'Data,CONFIG_CORE,CONFIG_HEADER_MAP,CONFIG_VALIDATION,CONFIG_FORMAT',
    department_code: 'UBNCSP',
    month_sheet_code: 'UBNCSP'
  }
};

var DEPRECATED_KEY_MAP = {
  config_sheet_name: 'Removed from lean canonical config',
  plan_year: 'Removed from lean canonical config',
  template_type: 'Removed from lean canonical config',
  month_sheet_display_pattern: 'Removed from lean canonical config',
  month_sheet_name_pattern: 'Use month_sheet_regex only in this lean config'
};

function ensureCanonicalConfig_() {
  return setupCanonicalConfig_(CANONICAL_CONFIG_FLAGS.FORCE_RESET);
}

function setupCanonicalConfig_(forceReset) {
  var ss = layBangTinhDangMo_();
  var shouldReset = forceReset === true;
  var createdSheets = [];
  var existingSheets = [];
  var resetSheets = [];
  var errors = [];

  try {
    CANONICAL_CONFIG_SCHEMA.requiredSheets.forEach(function(sheetName) {
      var sheet = ss.getSheetByName(sheetName);

      if (!sheet) {
        sheet = createCanonicalSheet_(ss, sheetName);
        seedCanonicalSheet_(sheet, sheetName);
        createdSheets.push(sheetName);
        return;
      }

      existingSheets.push(sheetName);

      if (shouldReset) {
        resetCanonicalSheet_(sheet, sheetName);
        resetSheets.push(sheetName);
      }
    });

    dongBoCanonicalCoreTheoSheetThang_(ss);
    upsertCanonicalCoreValue_(
      ss.getSheetByName(CANONICAL_CONFIG_SHEETS.CORE),
      'exclude_sheets',
      'Data,CONFIG_CORE,CONFIG_HEADER_MAP,CONFIG_VALIDATION,CONFIG_FORMAT',
      'Bo qua khi quet'
    );

    Logger.log(
      'setupCanonicalConfig_ OK | file=%s | id=%s | created=%s | existing=%s | reset=%s',
      ss.getName(),
      ss.getId(),
      JSON.stringify(createdSheets),
      JSON.stringify(existingSheets),
      JSON.stringify(resetSheets)
    );

    return {
      fileName: ss.getName(),
      fileId: ss.getId(),
      createdSheets: createdSheets,
      existingSheets: existingSheets,
      resetSheets: resetSheets,
      errors: errors
    };
  } catch (error) {
    errors.push(error.message || String(error));
    Logger.log(
      'setupCanonicalConfig_ LOI | file=%s | id=%s | created=%s | existing=%s | errors=%s',
      ss.getName(),
      ss.getId(),
      JSON.stringify(createdSheets),
      JSON.stringify(existingSheets),
      JSON.stringify(errors)
    );
    throw error;
  }
}

function xoaSheetConfigCuNeuCo_(ss) {
  var spreadsheet = ss || layBangTinhDangMo_();
  var sheetConfigCu = spreadsheet.getSheetByName('CONFIG');
  if (!sheetConfigCu) {
    return false;
  }

  spreadsheet.deleteSheet(sheetConfigCu);
  Logger.log('Da xoa sheet CONFIG cu. Project nay chuyen sang canonical-only.');
  return true;
}

function dongBoCanonicalCoreTheoSheetThang_(ss) {
  var spreadsheet = ss || layBangTinhDangMo_();
  var maSheet = detectMonthSheetCodeFromSpreadsheet_(spreadsheet);
  if (!maSheet) {
    return null;
  }

  var sheet = spreadsheet.getSheetByName(CANONICAL_CONFIG_SHEETS.CORE);
  if (!sheet) {
    return null;
  }

  upsertCanonicalCoreValue_(sheet, 'department_code', maSheet, 'Tu dong dong bo theo sheet thang');
  upsertCanonicalCoreValue_(sheet, 'month_sheet_code', maSheet, 'Tu dong dong bo theo sheet thang');
  return maSheet;
}

function detectMonthSheetCodeFromSpreadsheet_(ss) {
  var spreadsheet = ss || layBangTinhDangMo_();
  var regex = /^(.+?)\s*[-–—]\s*T(0[1-9]|1[0-2])\.(\d{4})$/;
  var sheets = spreadsheet.getSheets();

  for (var i = 0; i < sheets.length; i++) {
    var tenSheet = String(sheets[i].getName() || '').trim();
    var match = tenSheet.match(regex);
    if (match && match[1]) {
      return String(match[1]).trim();
    }
  }

  return '';
}

function upsertCanonicalCoreValue_(sheet, key, value, note) {
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  var keyText = String(key || '').trim();
  var valueText = String(value || '').trim();
  var noteText = String(note || '').trim();

  for (var r = 1; r < values.length; r++) {
    if (String(values[r][0] || '').trim() === keyText) {
      if (String(values[r][1] || '').trim() !== valueText || String(values[r][2] || '').trim() !== noteText) {
        sheet.getRange(r + 1, 2, 1, 2).setValues([[valueText, noteText]]);
      }
      return;
    }
  }

  sheet.appendRow([keyText, valueText, noteText]);
}

function createCanonicalSheet_(ss, sheetName) {
  var sheet = ss.insertSheet(sheetName);
  var headers = CANONICAL_CONFIG_HEADERS[sheetName];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.autoResizeColumns(1, headers.length);
  return sheet;
}

function seedCanonicalSheet_(sheet, sheetName) {
  var headers = CANONICAL_CONFIG_HEADERS[sheetName];
  var rows = CANONICAL_CONFIG_SEEDS[sheetName] || [];

  if (sheet.getLastRow() < 1) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  sheet.autoResizeColumns(1, headers.length);
}

function resetCanonicalSheet_(sheet, sheetName) {
  var headers = CANONICAL_CONFIG_HEADERS[sheetName];
  var rows = CANONICAL_CONFIG_SEEDS[sheetName] || [];

  sheet.clearContents();
  sheet.clearFormats();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  sheet.autoResizeColumns(1, headers.length);
}

function loadCanonicalConfig_(ss) {
  var spreadsheet = ss || layBangTinhDangMo_();

  try {
    var rawSheets = readCanonicalSheets_(spreadsheet);
    var cfg = mapCanonicalConfig_(rawSheets);
    validateCanonicalConfig_(cfg);
    Logger.log('loadCanonicalConfig_ OK | version=%s', cfg.version);
    return cfg;
  } catch (error) {
    Logger.log('Loi loadCanonicalConfig_: %s', error.stack || error);
    throw error;
  }
}

function readCanonicalSheets_(ss) {
  var missingSheets = [];
  var result = {};

  CANONICAL_CONFIG_SCHEMA.requiredSheets.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      missingSheets.push(sheetName);
      return;
    }
    result[sheetName] = getDataRowsAsObjects_(sheet);
  });

  if (missingSheets.length) {
    throw new Error('Thieu sheet config bat buoc: ' + missingSheets.join(', '));
  }

  return result;
}

function getDataRowsAsObjects_(sheet) {
  var values = sheet.getDataRange().getDisplayValues();
  if (!values.length) {
    return [];
  }

  var headers = values[0].map(function(item) {
    return String(item || '').trim();
  });

  assertCanonicalHeaders_(sheet.getName(), headers);

  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = {};
    for (var c = 0; c < headers.length; c++) {
      row[headers[c]] = values[i][c];
    }
    row.__rowNumber = i + 1;

    if (!isBlankRowObject_(row)) {
      rows.push(row);
    }
  }

  return rows;
}

function assertCanonicalHeaders_(sheetName, headers) {
  var expected = CANONICAL_CONFIG_HEADERS[sheetName];
  if (!expected) {
    return;
  }

  var missing = expected.filter(function(col) {
    return headers.indexOf(col) === -1;
  });

  if (missing.length) {
    throw new Error('Sheet ' + sheetName + ' thieu cot bat buoc: ' + missing.join(', '));
  }
}

function parseTypedValue_(value, type) {
  var raw = value === null || typeof value === 'undefined' ? '' : String(value);
  var trimmed = raw.trim();
  var normalizedType = String(type || 'STRING').trim().toUpperCase();

  if (trimmed === '') {
    return null;
  }

  switch (normalizedType) {
    case 'STRING':
      return trimmed;
    case 'NUMBER':
      if (!/^[-+]?\d+(\.\d+)?$/.test(trimmed)) {
        throw new Error('Gia tri NUMBER khong hop le: ' + trimmed);
      }
      return Number(trimmed);
    case 'BOOLEAN':
      if (trimmed === 'TRUE') return true;
      if (trimmed === 'FALSE') return false;
      throw new Error('Gia tri BOOLEAN khong hop le: ' + trimmed);
    case 'LIST':
      return trimmed.split(';').map(function(item) {
        return item.trim();
      }).filter(Boolean);
    case 'REGEX':
      return {
        raw: trimmed,
        regex: compileRegex_(trimmed)
      };
    default:
      throw new Error('Kieu du lieu chua ho tro: ' + normalizedType);
  }
}

function compileRegex_(pattern) {
  try {
    return new RegExp(String(pattern || '').trim());
  } catch (error) {
    throw new Error('REGEX khong compile duoc: ' + pattern + ' | ' + error.message);
  }
}

function parseBooleanFlag_(value) {
  return parseTypedValue_(value, 'BOOLEAN');
}

function parseCsvList_(value) {
  return String(value || '')
    .split(',')
    .map(function(item) {
      return item.trim();
    })
    .filter(Boolean);
}

function parsePipeList_(value) {
  return String(value || '')
    .split('|')
    .map(function(item) {
      return item.trim();
    })
    .filter(Boolean);
}

function isBlankRowObject_(rowObj) {
  return Object.keys(rowObj).every(function(key) {
    if (key === '__rowNumber') return true;
    return String(rowObj[key] || '').trim() === '';
  });
}

function mapCanonicalConfig_(rawSheets) {
  var defaultsApplied = [];
  var deprecatedWarnings = [];
  var unknownWarnings = [];
  var system = JSON.parse(JSON.stringify(CONFIG_DEFAULTS.system));
  var coreRows = rawSheets[CANONICAL_CONFIG_SHEETS.CORE] || [];

  coreRows.forEach(function(row) {
    var key = String(row.key || '').trim();
    if (!key) {
      return;
    }

    if (DEPRECATED_KEY_MAP[key]) {
      deprecatedWarnings.push('Deprecated key found in CONFIG_CORE: ' + key + ' => ' + DEPRECATED_KEY_MAP[key]);
    }

    if (!CANONICAL_CONFIG_SCHEMA.coreKeys[key]) {
      unknownWarnings.push('Unknown CONFIG_CORE key: ' + key + ' at row ' + row.__rowNumber);
      return;
    }

    assignCoreRuntimeValue_(system, key, row.value);
  });

  applyCoreDefaults_(system, defaultsApplied);

  return {
    version: CANONICAL_CONFIG_VERSION,
    system: {
      data_sheet_name: system.data_sheet_name,
      header_row: system.header_row,
      first_data_row: system.first_data_row,
      month_sheet_regex_raw: system.month_sheet_regex_raw,
      month_sheet_regex: system.month_sheet_regex,
      exclude_sheets_raw: system.exclude_sheets_raw,
      exclude_sheets: system.exclude_sheets,
      department_code: system.department_code,
      month_sheet_code: system.month_sheet_code
    },
    sheetRule: {
      month_sheet_regex_raw: system.month_sheet_regex_raw,
      month_sheet_regex: system.month_sheet_regex,
      exclude_sheets: system.exclude_sheets
    },
    businessRule: {},
    headerMap: mapHeaderMapRows_(rawSheets[CANONICAL_CONFIG_SHEETS.HEADER_MAP] || [], unknownWarnings),
    validationRules: mapValidationRows_(rawSheets[CANONICAL_CONFIG_SHEETS.VALIDATION] || [], unknownWarnings),
    formatRules: mapFormatRows_(rawSheets[CANONICAL_CONFIG_SHEETS.FORMAT] || [], unknownWarnings),
    defaultsApplied: defaultsApplied,
    deprecatedWarnings: deprecatedWarnings,
    unknownWarnings: unknownWarnings
  };
}

function assignCoreRuntimeValue_(system, key, rawValue) {
  var schema = CANONICAL_CONFIG_SCHEMA.coreKeys[key];
  var parsed = parseTypedValue_(rawValue, schema.type);

  if (key === 'month_sheet_regex') {
    system.month_sheet_regex_raw = parsed ? parsed.raw : null;
    system.month_sheet_regex = parsed ? parsed.regex : null;
    return;
  }

  if (key === 'exclude_sheets') {
    system.exclude_sheets_raw = String(rawValue || '').trim();
    system.exclude_sheets = parseCsvList_(rawValue);
    return;
  }

  system[key] = parsed;
}

function applyCoreDefaults_(system, defaultsApplied) {
  Object.keys(CANONICAL_CONFIG_SCHEMA.coreKeys).forEach(function(key) {
    var schema = CANONICAL_CONFIG_SCHEMA.coreKeys[key];

    if (key === 'month_sheet_regex') {
      if (!system.month_sheet_regex_raw) {
        system.month_sheet_regex_raw = schema.default;
        system.month_sheet_regex = compileRegex_(schema.default);
        defaultsApplied.push('Applied default for ' + key);
      }
      return;
    }

    if (key === 'exclude_sheets') {
      if (!system.exclude_sheets_raw) {
        system.exclude_sheets_raw = schema.default;
        system.exclude_sheets = parseCsvList_(schema.default);
        defaultsApplied.push('Applied default for ' + key);
      }
      return;
    }

    if (system[key] === null || typeof system[key] === 'undefined' || system[key] === '') {
      system[key] = schema.default;
      defaultsApplied.push('Applied default for ' + key);
    }
  });
}

function mapHeaderMapRows_(rows, unknownWarnings) {
  var result = {};

  rows.forEach(function(row) {
    var logicalField = String(row.logical_field || '').trim();
    if (!logicalField) {
      unknownWarnings.push('Blank logical_field in CONFIG_HEADER_MAP at row ' + row.__rowNumber);
      return;
    }

    result[logicalField] = {
      logicalField: logicalField,
      headerText: String(row.header_text || '').trim(),
      required: parseBooleanFlag_(row.required),
      note: String(row.note || '').trim()
    };
  });

  return result;
}

function mapValidationRows_(rows, unknownWarnings) {
  return rows.map(function(row) {
    var ruleType = String(row.rule_type || '').trim().toLowerCase();
    if (CANONICAL_CONFIG_SCHEMA.validationRuleTypes.indexOf(ruleType) === -1) {
      unknownWarnings.push('Unknown validation rule_type: ' + ruleType + ' at row ' + row.__rowNumber);
    }

    return {
      fieldName: String(row.field_name || '').trim(),
      ruleType: ruleType,
      ruleValueRaw: String(row.rule_value || '').trim(),
      ruleValue: parseValidationRuleValue_(ruleType, row.rule_value),
      message: String(row.message || '').trim()
    };
  });
}

function mapFormatRows_(rows, unknownWarnings) {
  return rows.map(function(row) {
    var formatType = String(row.format_type || '').trim().toLowerCase();
    if (CANONICAL_CONFIG_SCHEMA.formatTypes.indexOf(formatType) === -1) {
      unknownWarnings.push('Unknown format_type: ' + formatType + ' at row ' + row.__rowNumber);
    }

    return {
      fieldName: String(row.field_name || '').trim(),
      formatType: formatType,
      formatValueRaw: String(row.format_value || '').trim(),
      formatValue: parseFormatRuleValue_(formatType, row.format_value),
      note: String(row.note || '').trim()
    };
  });
}

function parseValidationRuleValue_(ruleType, value) {
  var normalizedRuleType = String(ruleType || '').trim().toLowerCase();

  if (normalizedRuleType === 'required') {
    return parseBooleanFlag_(value);
  }
  if (normalizedRuleType === 'regex') {
    return parseTypedValue_(value, 'REGEX');
  }
  if (normalizedRuleType === 'date') {
    return parseTypedValue_(value, 'STRING');
  }
  if (normalizedRuleType === 'range') {
    return parseTypedValue_(value, 'STRING');
  }

  return parseTypedValue_(value, 'STRING');
}

function parseFormatRuleValue_(formatType, value) {
  var normalizedFormatType = String(formatType || '').trim().toLowerCase();

  if (normalizedFormatType === 'list') {
    return parsePipeList_(value);
  }

  return parseTypedValue_(value, 'STRING');
}

function validateCanonicalConfig_(cfg) {
  var errors = [];

  if (!cfg || typeof cfg !== 'object') {
    throw new Error('Canonical config khong hop le.');
  }

  validateCanonicalCore_(cfg.system, errors);
  validateCanonicalHeaderMap_(cfg.headerMap, errors);
  validateCanonicalValidationRules_(cfg.validationRules, errors);
  validateCanonicalFormatRules_(cfg.formatRules, errors);

  if (errors.length) {
    throw new Error('Canonical config invalid:\n- ' + errors.join('\n- '));
  }

  return true;
}

function validateCanonicalCore_(system, errors) {
  Object.keys(CANONICAL_CONFIG_SCHEMA.coreKeys).forEach(function(key) {
    var schema = CANONICAL_CONFIG_SCHEMA.coreKeys[key];
    var value;

    if (key === 'month_sheet_regex') {
      value = system.month_sheet_regex_raw;
    } else if (key === 'exclude_sheets') {
      value = system.exclude_sheets_raw;
    } else {
      value = system[key];
    }

    var isMissing = value === null || typeof value === 'undefined' ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0);

    if (schema.required && isMissing) {
      errors.push('Thieu key required trong CONFIG_CORE: ' + key);
    }
  });

  if (!(system.first_data_row > system.header_row)) {
    errors.push('first_data_row phai lon hon header_row.');
  }

  if (!system.month_sheet_regex_raw) {
    errors.push('Thieu month_sheet_regex.');
  } else {
    try {
      compileRegex_(system.month_sheet_regex_raw);
    } catch (error) {
      errors.push(error.message);
    }
  }
}

function validateCanonicalHeaderMap_(headerMap, errors) {
  var logicalFields = Object.keys(headerMap || {});
  var seen = {};

  logicalFields.forEach(function(fieldName) {
    if (seen[fieldName]) {
      errors.push('Duplicate logical_field trong CONFIG_HEADER_MAP: ' + fieldName);
    }
    seen[fieldName] = true;

    var rule = headerMap[fieldName];
    if (!rule.headerText) {
      errors.push('Thieu header_text trong CONFIG_HEADER_MAP: ' + fieldName);
    }
  });
}

function validateCanonicalValidationRules_(validationRules, errors) {
  (validationRules || []).forEach(function(rule) {
    if (!rule.fieldName) {
      errors.push('Blank field_name trong CONFIG_VALIDATION.');
    }

    if (rule.ruleType === 'required' && typeof rule.ruleValue !== 'boolean') {
      errors.push('Rule required phai co TRUE/FALSE | field ' + rule.fieldName);
    }

    if (rule.ruleType === 'regex') {
      try {
        compileRegex_(rule.ruleValueRaw);
      } catch (error) {
        errors.push(error.message + ' | field ' + rule.fieldName);
      }
    }

    if (rule.ruleType === 'date' && !rule.ruleValueRaw) {
      errors.push('Rule date thieu dinh dang ngay | field ' + rule.fieldName);
    }
  });
}

function validateCanonicalFormatRules_(formatRules, errors) {
  (formatRules || []).forEach(function(rule) {
    if (!rule.fieldName) {
      errors.push('Blank field_name trong CONFIG_FORMAT.');
    }

    if (!rule.formatType) {
      errors.push('Blank format_type trong CONFIG_FORMAT | field ' + rule.fieldName);
    }

    if (!rule.formatValueRaw) {
      errors.push('Blank format_value trong CONFIG_FORMAT | field ' + rule.fieldName);
    }
  });
}

function validateConfig() {
  var cfg = loadCanonicalConfig_();
  validateCanonicalConfig_(cfg);
  Logger.log('validateConfig OK | version=%s', cfg.version);
  return {
    ok: true,
    version: cfg.version,
    defaultsApplied: cfg.defaultsApplied,
    deprecatedWarnings: cfg.deprecatedWarnings,
    unknownWarnings: cfg.unknownWarnings
  };
}

function validateConfigSafe() {
  ensureCanonicalConfig_();
  return validateConfig();
}

function testLoadCanonicalConfig_() {
  var cfg = loadCanonicalConfig_();
  Logger.log('testLoadCanonicalConfig_ => %s', JSON.stringify({
    version: cfg.version,
    system: cfg.system,
    headerMapKeys: Object.keys(cfg.headerMap || {}),
    validationRuleCount: (cfg.validationRules || []).length,
    formatRuleCount: (cfg.formatRules || []).length,
    defaultsApplied: (cfg.defaultsApplied || []).length,
    deprecatedWarnings: (cfg.deprecatedWarnings || []).length,
    unknownWarnings: (cfg.unknownWarnings || []).length
  }));
  return cfg;
}

function testCanonicalSetupAndLoad_() {
  var setup = ensureCanonicalConfig_();
  var cfg = loadCanonicalConfig_();
  return {
    setup: setup,
    config: cfg
  };
}
