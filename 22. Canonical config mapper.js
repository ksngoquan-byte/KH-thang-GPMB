function mapCanonicalConfigLegacy_(rawSheets) {
  var defaultsApplied = [];
  var deprecatedWarnings = [];
  var unknownWarnings = [];

  var coreResult = mapCoreConfig_(rawSheets[CANONICAL_CONFIG_SHEETS.CORE] || [], defaultsApplied, deprecatedWarnings, unknownWarnings);
  var headerMap = mapHeaderRules_(rawSheets[CANONICAL_CONFIG_SHEETS.HEADER_MAP] || [], unknownWarnings);
  var validationRules = mapValidationRules_(rawSheets[CANONICAL_CONFIG_SHEETS.VALIDATION] || [], unknownWarnings);
  var formatRules = mapFormatRules_(rawSheets[CANONICAL_CONFIG_SHEETS.FORMAT] || [], unknownWarnings);

  return {
    version: CANONICAL_CONFIG_VERSION,
    system: coreResult.system,
    sheetRule: coreResult.sheetRule,
    businessRule: coreResult.businessRule,
    headerMap: headerMap,
    validationRules: validationRules,
    formatRules: formatRules,
    defaultsApplied: defaultsApplied,
    deprecatedWarnings: deprecatedWarnings,
    unknownWarnings: unknownWarnings
  };
}

function mapCoreConfig_(rows, defaultsApplied, deprecatedWarnings, unknownWarnings) {
  var system = cloneSimpleObject_(CONFIG_DEFAULTS.system);
  var sheetRule = cloneSimpleObject_(CONFIG_DEFAULTS.sheetRule);
  var businessRule = cloneSimpleObject_(CONFIG_DEFAULTS.businessRule);

  Object.keys(CONFIG_DEFAULTS.system).forEach(function(key) {
    defaultsApplied.push('SYSTEM_CORE.' + key + ' => ' + JSON.stringify(CONFIG_DEFAULTS.system[key]));
  });
  Object.keys(CONFIG_DEFAULTS.sheetRule).forEach(function(key) {
    defaultsApplied.push('SHEET_RULE.' + key + ' => ' + JSON.stringify(CONFIG_DEFAULTS.sheetRule[key]));
  });
  Object.keys(CONFIG_DEFAULTS.businessRule).forEach(function(key) {
    defaultsApplied.push('BUSINESS_RULE_MIN.' + key + ' => ' + JSON.stringify(CONFIG_DEFAULTS.businessRule[key]));
  });

  rows.forEach(function(row) {
    var group = String(row.group || '').trim();
    var key = String(row.key || '').trim();
    var schemaGroup = CONFIG_SCHEMA.coreGroups[group];

    if (!schemaGroup) {
      var lookup = group + '.' + key;
      if (DEPRECATED_KEY_MAP[lookup]) {
        deprecatedWarnings.push('Deprecated key found: ' + lookup + ' => ' + DEPRECATED_KEY_MAP[lookup]);
      } else {
        unknownWarnings.push('Unknown CONFIG_CORE group/key: ' + lookup + ' at row ' + row.__rowNumber);
      }
      return;
    }

    var fieldSchema = schemaGroup[key];
    if (!fieldSchema) {
      unknownWarnings.push('Unknown CONFIG_CORE key: ' + group + '.' + key + ' at row ' + row.__rowNumber);
      return;
    }

    var runtimeValue = parseRowValueWithFallbackLegacy_(row, fieldSchema, defaultsApplied);
    assignCoreValue_(group, key, runtimeValue, system, sheetRule, businessRule);
  });

  return {
    system: system,
    sheetRule: sheetRule,
    businessRule: businessRule
  };
}

function parseRowValueWithFallbackLegacy_(row, fieldSchema, defaultsApplied) {
  var required = parseBooleanFlagLegacy_(row.required);
  var type = String(row.type || fieldSchema.type || 'STRING').trim().toUpperCase();
  var rawValue = row.value;
  var rawDefault = row['default'];

  if (String(rawValue || '').trim() === '') {
    if (String(rawDefault || '').trim() !== '') {
      var defaultValue = parseTypedValueLegacy_(rawDefault, type);
      defaultsApplied.push(
        String(row.group || '') + '.' + String(row.key || '') + ' => ' + JSON.stringify(serializeForLog_(defaultValue))
      );
      return defaultValue;
    }

    if (fieldSchema.default !== null && typeof fieldSchema.default !== 'undefined') {
      return fieldSchema.default;
    }

    if (required) {
      throw new Error('Thiếu giá trị required cho ' + row.group + '.' + row.key + ' ở dòng ' + row.__rowNumber);
    }

    return null;
  }

  return parseTypedValueLegacy_(rawValue, type);
}

function assignCoreValue_(group, key, value, system, sheetRule, businessRule) {
  if (group === 'SYSTEM_CORE') {
    if (key === 'month_sheet_regex' && value) {
      system.month_sheet_regex_raw = value.raw;
      system.month_sheet_regex = value.regex;
    } else {
      system[key] = value;
    }
    return;
  }

  if (group === 'SHEET_RULE') {
    sheetRule[key] = value;
    return;
  }

  if (group === 'BUSINESS_RULE_MIN') {
    businessRule[key] = value;
  }
}

function mapHeaderRules_(rows, unknownWarnings) {
  var headerMap = {};

  rows.forEach(function(row) {
    var logicalName = String(row.logical_name || '').trim();
    if (!logicalName) {
      return;
    }

    if (CONFIG_SCHEMA.allowedHeaderLogicalNames.indexOf(logicalName) === -1) {
      unknownWarnings.push('Unknown logical_name in CONFIG_HEADER_MAP: ' + logicalName + ' at row ' + row.__rowNumber);
    }

    headerMap[logicalName] = {
      logicalName: logicalName,
      columnLetter: normalizeColumnLetter_(row.column_letter),
      required: parseBooleanFlagLegacy_(row.required),
      block: String(row.block || '').trim(),
      note: String(row.note || '').trim()
    };
  });

  return headerMap;
}

function mapValidationRules_(rows, unknownWarnings) {
  return rows.map(function(row) {
    var validationType = String(row.validation_type || '').trim().toUpperCase();
    if (CONFIG_SCHEMA.supportedValidationTypes.indexOf(validationType) === -1) {
      unknownWarnings.push('Unknown validation_type: ' + validationType + ' at row ' + row.__rowNumber);
    }

    return {
      targetColumn: normalizeColumnLetter_(row.target_column),
      startRow: parseTypedValueLegacy_(row.start_row, 'NUMBER'),
      validationType: validationType,
      sourceSheet: String(row.source_sheet || '').trim() || null,
      sourceRange: String(row.source_range || '').trim() || null,
      sourceValues: parseTypedValueLegacy_(row.source_values, 'LIST'),
      allowInvalid: parseBooleanFlagLegacy_(row.allow_invalid),
      requiredForTask: parseBooleanFlagLegacy_(row.required_for_task),
      note: String(row.note || '').trim()
    };
  });
}

function mapFormatRules_(rows, unknownWarnings) {
  return rows.map(function(row) {
    var formatType = String(row.format_type || '').trim().toUpperCase();
    if (CONFIG_SCHEMA.supportedFormatTypes.indexOf(formatType) === -1) {
      unknownWarnings.push('Unknown format_type: ' + formatType + ' at row ' + row.__rowNumber);
    }

    return {
      targetColumn: normalizeColumnLetter_(row.target_column),
      startRow: parseTypedValueLegacy_(row.start_row, 'NUMBER'),
      formatType: formatType,
      numberFormat: String(row.number_format || '').trim() || null,
      roundTo: parseTypedValueLegacy_(row.round_to, 'NUMBER'),
      required: parseBooleanFlagLegacy_(row.required),
      note: String(row.note || '').trim()
    };
  });
}

function cloneSimpleObject_(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function serializeForLog_(value) {
  if (value && typeof value === 'object' && value.raw && value.regex) {
    return {
      raw: value.raw,
      regex: String(value.regex)
    };
  }
  return value;
}
