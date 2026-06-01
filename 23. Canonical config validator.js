function validateCanonicalConfigLegacy_(cfg) {
  var errors = [];

  if (!cfg || typeof cfg !== 'object') {
    throw new Error('Canonical config khong hop le.');
  }

  validateCoreRequiredFields_(cfg, errors);
  validateSystemLogic_(cfg, errors);
  validateHeaderMap_(cfg.headerMap, errors);
  validateValidationRules_(cfg.validationRules, cfg.formatRules, errors);
  validateFormatRules_(cfg.formatRules, errors);

  if (errors.length) {
    throw new Error('Canonical config invalid:\n- ' + errors.join('\n- '));
  }

  return true;
}

function validateCoreRequiredFields_(cfg, errors) {
  Object.keys(CONFIG_SCHEMA.coreGroups).forEach(function(groupName) {
    var target = groupName === 'SYSTEM_CORE'
      ? cfg.system
      : (groupName === 'SHEET_RULE' ? cfg.sheetRule : cfg.businessRule);

    var groupSchema = CONFIG_SCHEMA.coreGroups[groupName];
    Object.keys(groupSchema).forEach(function(key) {
      if (!groupSchema[key].required) {
        return;
      }

      var value = target[key];
      if (key === 'month_sheet_regex') {
        value = target.month_sheet_regex_raw;
      }

      var missing = value === null || typeof value === 'undefined' ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0);

      if (missing) {
        errors.push('Thieu key required: ' + groupName + '.' + key);
      }
    });
  });
}

function validateSystemLogic_(cfg, errors) {
  if (!(cfg.system.first_data_row > cfg.system.header_row)) {
    errors.push('first_data_row phai lon hon header_row.');
  }

  if (!cfg.system.month_sheet_regex_raw) {
    errors.push('Thieu month_sheet_regex.');
  } else {
    try {
      compileRegexLegacy_(cfg.system.month_sheet_regex_raw);
    } catch (error) {
      errors.push(error.message);
    }
  }
}

function validateHeaderMap_(headerMap, errors) {
  var seen = {};

  Object.keys(headerMap || {}).forEach(function(logicalName) {
    if (seen[logicalName]) {
      errors.push('Duplicate logical_name trong CONFIG_HEADER_MAP: ' + logicalName);
    }
    seen[logicalName] = true;

    if (!isColumnLetter_(headerMap[logicalName].columnLetter)) {
      errors.push('column_letter khong hop le trong CONFIG_HEADER_MAP: ' + logicalName);
    }
  });
}

function validateValidationRules_(validationRules, formatRules, errors) {
  var dateFormatColumns = {};
  (formatRules || []).forEach(function(rule) {
    if (rule.formatType === 'DATE' && rule.numberFormat) {
      dateFormatColumns[rule.targetColumn] = true;
    }
  });

  (validationRules || []).forEach(function(rule) {
    if (!isColumnLetter_(rule.targetColumn)) {
      errors.push('target_column không hợp lệ trong CONFIG_VALIDATION: ' + rule.targetColumn);
    }

    if (rule.validationType === 'DROPDOWN') {
      var hasRangeSource = !!(rule.sourceSheet && rule.sourceRange);
      var hasInlineValues = Array.isArray(rule.sourceValues) && rule.sourceValues.length > 0;
      if (!hasRangeSource && !hasInlineValues) {
        errors.push('Rule DROPDOWN phai co source_sheet + source_range hoac source_values | cot ' + rule.targetColumn);
      }
    }

    if (rule.validationType === 'DATE' && !dateFormatColumns[rule.targetColumn]) {
      errors.push('Rule DATE phai co CONFIG_FORMAT tuong ung voi number_format | cot ' + rule.targetColumn);
    }
  });
}

function validateFormatRules_(formatRules, errors) {
  (formatRules || []).forEach(function(rule) {
    if (!isColumnLetter_(rule.targetColumn)) {
      errors.push('target_column khong hop le trong CONFIG_FORMAT: ' + rule.targetColumn);
    }

    if ((rule.formatType === 'DATE' || rule.formatType === 'MONEY' || rule.formatType === 'PERCENT') &&
        !rule.numberFormat) {
      errors.push('Format rule thieu number_format | cot ' + rule.targetColumn);
    }
  });
}
