function parseTypedValueLegacy_(value, type) {
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
        regex: compileRegexLegacy_(trimmed)
      };
    default:
      throw new Error('Kieu du lieu chua ho tro: ' + normalizedType);
  }
}

function compileRegexLegacy_(pattern) {
  try {
    return new RegExp(String(pattern || '').trim());
  } catch (error) {
    throw new Error('REGEX khong compile duoc: ' + pattern + ' | ' + error.message);
  }
}

function parseBooleanFlagLegacy_(value) {
  return parseTypedValueLegacy_(value, 'BOOLEAN');
}

function isColumnLetter_(value) {
  return /^[A-Z]+$/.test(String(value || '').trim());
}

function normalizeColumnLetter_(value) {
  var col = String(value || '').trim().toUpperCase();
  if (!isColumnLetter_(col)) {
    throw new Error('target_column / column_letter khong hop le: ' + value);
  }
  return col;
}

function isBlankRowObjectLegacy_(rowObj) {
  return Object.keys(rowObj).every(function(key) {
    return String(rowObj[key] || '').trim() === '';
  });
}
