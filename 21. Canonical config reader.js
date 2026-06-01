function loadCanonicalConfigLegacy_(ss) {
  var spreadsheet = ss || (typeof layBangTinhDangMo_ === 'function'
    ? layBangTinhDangMo_()
    : SpreadsheetApp.getActiveSpreadsheet());

  try {
    var rawSheets = readCanonicalSheetsLegacy_(spreadsheet);
    var cfg = mapCanonicalConfigLegacy_(rawSheets);
    validateCanonicalConfigLegacy_(cfg);
    Logger.log('loadCanonicalConfigLegacy_ OK | version=%s', cfg.version);
    return cfg;
  } catch (error) {
    Logger.log('Loi loadCanonicalConfigLegacy_: %s', error.stack || error);
    throw error;
  }
}

function readCanonicalSheetsLegacy_(ss) {
  var missingSheets = [];
  var result = {};

  CONFIG_SCHEMA.requiredRuntimeSheets.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      missingSheets.push(sheetName);
      return;
    }
    result[sheetName] = getDataRowsAsObjectsLegacy_(sheet);
  });

  CONFIG_SCHEMA.optionalSheets.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      result[sheetName] = getDataRowsAsObjectsLegacy_(sheet);
    }
  });

  if (missingSheets.length) {
    throw new Error('Thieu sheet config bat buoc: ' + missingSheets.join(', '));
  }

  return result;
}

function getDataRowsAsObjectsLegacy_(sheet) {
  var values = sheet.getDisplayValues();
  if (!values.length) {
    return [];
  }

  var headers = values[0].map(function(item) {
    return String(item || '').trim();
  });

  assertRequiredColumns_(sheet.getName(), headers);

  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = {};
    for (var c = 0; c < headers.length; c++) {
      row[headers[c]] = values[i][c];
    }

    if (!isBlankRowObjectLegacy_(row)) {
      row.__rowNumber = i + 1;
      rows.push(row);
    }
  }

  return rows;
}

function assertRequiredColumns_(sheetName, headers) {
  var requiredColumns;

  if (sheetName === CANONICAL_CONFIG_SHEETS.CORE) {
    requiredColumns = CONFIG_SCHEMA.coreColumns;
  } else if (sheetName === CANONICAL_CONFIG_SHEETS.HEADER_MAP) {
    requiredColumns = CONFIG_SCHEMA.headerMapColumns;
  } else if (sheetName === CANONICAL_CONFIG_SHEETS.VALIDATION) {
    requiredColumns = CONFIG_SCHEMA.validationColumns;
  } else if (sheetName === CANONICAL_CONFIG_SHEETS.FORMAT) {
    requiredColumns = CONFIG_SCHEMA.formatColumns;
  } else if (sheetName === CANONICAL_CONFIG_SHEETS.MIGRATION) {
    requiredColumns = CONFIG_SCHEMA.migrationColumns;
  } else {
    return;
  }

  var missing = requiredColumns.filter(function(col) {
    return headers.indexOf(col) === -1;
  });

  if (missing.length) {
    throw new Error('Sheet ' + sheetName + ' thieu cot bat buoc: ' + missing.join(', '));
  }
}
