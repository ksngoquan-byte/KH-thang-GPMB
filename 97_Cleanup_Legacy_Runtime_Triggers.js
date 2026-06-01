var LEGACY_RUNTIME_TRIGGER_HANDLERS_ = [
  'guiEmailPhoiHopTheoLich',
  'capNhatBaoVeTheoThoiGian',
  'guiMailNhac8GioChoNguoiChinhSua_',
  'xuLyTriggerProtectionTheoLich_',
  'taoTriggerGuiEmailPhoiHop',
  'taoTriggerProtectionMoi'
];

var LEGACY_RUNTIME_TRIGGER_PATTERNS_ = [
  /TheoLich/i,
  /ProtectionTheoThoiGian/i,
  /Nhac8Gio/i,
  /Ngay02/i,
  /Ngay03/i,
  /0815/i,
  /8h15/i,
  /18h/i
];

function cleanupLegacyRuntimeTriggers_() {
  var triggers = ScriptApp.getProjectTriggers();
  var deletedHandlers = [];
  var keptHandlers = [];
  var deletedCount = 0;
  var keptCount = 0;

  triggers.forEach(function(trigger) {
    var handler = trigger.getHandlerFunction ? String(trigger.getHandlerFunction() || '') : '';
    var shouldDelete = isLegacyRuntimeTriggerHandler_(handler);

    if (handler === 'onOpen') {
      shouldDelete = false;
    }

    if (shouldDelete) {
      ScriptApp.deleteTrigger(trigger);
      deletedCount++;
      deletedHandlers.push(handler);
    } else {
      keptCount++;
      keptHandlers.push(handler);
    }
  });

  var result = {
    status: 'OK',
    deleted_count: deletedCount,
    kept_count: keptCount,
    deleted_handlers: deletedHandlers,
    kept_handlers: keptHandlers
  };
  Logger.log(JSON.stringify(result));
  return JSON.stringify(result);
}

function auditLegacyRuntimeTriggers_() {
  var triggers = ScriptApp.getProjectTriggers();
  var legacyHandlers = [];
  var keptHandlers = [];

  triggers.forEach(function(trigger) {
    var handler = trigger.getHandlerFunction ? String(trigger.getHandlerFunction() || '') : '';
    if (handler !== 'onOpen' && isLegacyRuntimeTriggerHandler_(handler)) {
      legacyHandlers.push(handler);
    } else {
      keptHandlers.push(handler);
    }
  });

  var result = {
    status: legacyHandlers.length ? 'LEGACY_TRIGGER_FOUND' : 'OK',
    legacy_count: legacyHandlers.length,
    legacy_handlers: legacyHandlers,
    kept_count: keptHandlers.length,
    kept_handlers: keptHandlers
  };
  Logger.log(JSON.stringify(result));
  return JSON.stringify(result);
}

function isLegacyRuntimeTriggerHandler_(handler) {
  if (!handler) {
    return false;
  }
  if (LEGACY_RUNTIME_TRIGGER_HANDLERS_.indexOf(handler) !== -1) {
    return true;
  }
  for (var i = 0; i < LEGACY_RUNTIME_TRIGGER_PATTERNS_.length; i++) {
    if (LEGACY_RUNTIME_TRIGGER_PATTERNS_[i].test(handler)) {
      return true;
    }
  }
  return false;
}

function cleanupLegacyRuntimeTriggers() {
  return cleanupLegacyRuntimeTriggers_();
}

