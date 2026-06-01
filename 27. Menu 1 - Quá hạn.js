var MENU_1_OVERDUE_CONFIG_ = {
  SHEET_NAME: '',
  HEADER_ROW: 4,
  TEST_MODE: false,
  REPORT_DATE: null,
  LARGE_PLANNED_BUDGET_THRESHOLD: 10000000
};

var MENU_1_OVERDUE_FIXED_COLUMNS_ = {
  index: 0,                // A
  taskName: 1,             // B
  projectCode: 2,          // C
  definitionOfDone: 3,     // D
  priority: 4,             // E
  deadline: 5,             // F
  plannedBudget: 6,        // G
  owner: 7,                // H
  assignees: 8,            // I
  actualDate: 10,          // K
  actualBudget: 11,        // L
  percentComplete: 12,     // M
  evaluation: 13,          // N
  rootCauseAction: 14,     // O
  managementDirection: 15  // P
};

function getMenu1OverdueReport() {
  try {
    var config = cloneMenu1Config_();
    var ss = layBangTinhDangMo_();
    var sheet = laySheetMenu1_(ss, config);
    var headerRow = Number(config.HEADER_ROW || 4);
    var reportDate = resolveMenu1ReportDate_(config.REPORT_DATE);

    validateMenu1Input_(sheet, headerRow, reportDate);

    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    var totalRowsRead = Math.max(lastRow - headerRow, 0);
    if (totalRowsRead <= 0 || lastColumn <= 0) {
      return taoKetQuaMenu1Rong_(sheet.getName(), reportDate, 0);
    }

    var headers = sheet.getRange(headerRow, 1, 1, lastColumn).getDisplayValues()[0];
    var dataValues = sheet.getRange(headerRow + 1, 1, totalRowsRead, lastColumn).getValues();
    var headerMap = applyMenu1FixedColumns_(buildHeaderMap(headers));
    Logger.log('Menu 1 - Cột KH ngân sách: %s', headerMap.plannedBudget !== undefined ? (headerMap.plannedBudget + 1) : 'không tìm thấy');
    Logger.log('Menu 1 - Cột ngân sách thực hiện: %s', headerMap.actualBudget !== undefined ? (headerMap.actualBudget + 1) : 'không tìm thấy');
    var ketQua = {
      meta: {
        sheetName: sheet.getName(),
        reportDate: formatDateOutput_(reportDate),
        totalRowsRead: totalRowsRead,
        taskRowCount: 0,
        groupRowCount: 0,
        emptyRowCount: 0,
        invalidRowCount: 0,
        overdueRowCount: 0
      },
      summary: {
        overdueRate: 0,
        overdueCount: 0,
        medianOverdueDays: 0,
        overdueBudgetHeld: 0
      },
      table: [],
      alerts: [],
      logs: {
        warnings: [],
        errors: []
      }
    };

    var validTasks = [];
    var overdueTasks = [];

    for (var i = 0; i < dataValues.length; i++) {
      var rowIndex = headerRow + 1 + i;
      var task = normalizeTaskRow(dataValues[i], headerMap, rowIndex);

      task.state = resolveTaskState(task, reportDate);
      task.delayDays = task.state === 'OVERDUE' ? calcDelayDays(task.deadlineDate, reportDate) : null;

      if (task.alerts.length) {
        ketQua.alerts = ketQua.alerts.concat(task.alerts);
      }
      if (task.logs.warnings.length) {
        ketQua.logs.warnings = ketQua.logs.warnings.concat(task.logs.warnings);
      }
      if (task.logs.errors.length) {
        ketQua.logs.errors = ketQua.logs.errors.concat(task.logs.errors);
      }

      if (task.rowType === 'EMPTY') {
        ketQua.meta.emptyRowCount++;
        continue;
      }

      if (task.rowType === 'GROUP') {
        ketQua.meta.groupRowCount++;
        continue;
      }

      if (task.rowType === 'INVALID') {
        ketQua.meta.invalidRowCount++;
        continue;
      }

      ketQua.meta.taskRowCount++;
      validTasks.push(task);

      if (task.state === 'OVERDUE') {
        ketQua.meta.overdueRowCount++;
        overdueTasks.push(task);
      }
    }

    ketQua.summary = buildMenu1Summary(validTasks, overdueTasks);
    ketQua.table = buildMenu1Table(overdueTasks);
    ketQua.alerts = ketQua.alerts.concat(buildMenu1Alerts(overdueTasks, config));

    Logger.log('Menu 1 - Tổng số dòng đọc được: %s', ketQua.meta.totalRowsRead);
    Logger.log('Menu 1 - Số dòng TASK hợp lệ: %s', ketQua.meta.taskRowCount);
    Logger.log('Menu 1 - Số dòng GROUP: %s', ketQua.meta.groupRowCount);
    Logger.log('Menu 1 - Số dòng INVALID: %s', ketQua.meta.invalidRowCount);
    Logger.log('Menu 1 - Số dòng OVERDUE: %s', ketQua.meta.overdueRowCount);

    return ketQua;
  } catch (error) {
    Logger.log('Lỗi getMenu1OverdueReport: %s', error.stack || error);
    throw error;
  }
}

function buildHeaderMap(headers) {
  var aliasMap = {
    index: ['stt', 'so thu tu'],
    projectCode: ['ma du an', 'ma da'],
    taskName: ['ten cong viec', 'noi dung cong viec'],
    taskGroup: ['nhom nhiem vu', 'nhom cong viec'],
    owner: ['chu tri', 'owner'],
    assignees: ['phoi hop', 'assignees'],
    priority: ['cap uu tien', 'uu tien', 'priority'],
    deadline: ['thoi han', 'deadline'],
    actualDate: ['ngay hoan thanh thuc te', 'ngay hoan thanh', 'actualdate', 'actual date'],
    percentComplete: ['ty le hoan thanh', 'percentcomplete', 'percent complete', '% hoan thanh'],
    plannedBudget: [
      'kh ngan sach',
      'ngan sach ke hoach',
      'ke hoach ngan sach',
      'kh kinh phi',
      'kinh phi ke hoach',
      'ke hoach kinh phi',
      'du toan',
      'plannedbudget',
      'planned budget'
    ],
    actualBudget: [
      'ngan sach thuc hien',
      'thuc hien ngan sach',
      'kinh phi thuc hien',
      'thuc hien kinh phi',
      'actualbudget',
      'actual budget'
    ],
    definitionOfDone: ['muc tieu kq cu the', 'muc tieu ket qua cu the', 'muc tieu kq', 'muc tieu', 'definitionofdone'],
    evaluation: ['danh gia', 'evaluation'],
    rootCauseAction: ['nguyen nhan giai phap', 'nguyen nhan va giai phap', 'rootcauseaction'],
    managementDirection: ['y kien chi dao', 'managementdirection'],
    note: ['ghi chu', 'note'],
    isGroupRow: ['co dong nhom', 'isgrouprow'],
    reportMonth: ['thang bao cao', 'reportmonth']
  };

  var normalizedHeaders = (headers || []).map(function(header) {
    return normalizeHeaderKey_(header);
  });
  var headerMap = {};

  Object.keys(aliasMap).forEach(function(key) {
    var aliases = aliasMap[key];
    for (var i = 0; i < normalizedHeaders.length; i++) {
      if (aliases.indexOf(normalizedHeaders[i]) !== -1) {
        headerMap[key] = i;
        return;
      }
    }
  });

  return headerMap;
}

function applyMenu1FixedColumns_(headerMap) {
  var ketQua = Object.assign({}, headerMap || {});
  Object.keys(MENU_1_OVERDUE_FIXED_COLUMNS_).forEach(function(key) {
    ketQua[key] = MENU_1_OVERDUE_FIXED_COLUMNS_[key];
  });
  return ketQua;
}

function normalizeText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDateSafe(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return atStartOfDay_(value);
  }

  var text = normalizeText(value);
  if (!text) {
    return null;
  }

  var matchVn = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (matchVn) {
    var d = Number(matchVn[1]);
    var m = Number(matchVn[2]);
    var y = Number(matchVn[3]);
    var parsed = new Date(y, m - 1, d);
    if (parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d) {
      return atStartOfDay_(parsed);
    }
  }

  var parsedNative = new Date(text);
  if (!isNaN(parsedNative.getTime())) {
    return atStartOfDay_(parsedNative);
  }

  return null;
}

function parsePercentSafe(value) {
  if (value === null || value === undefined || value === '') {
    return { value: null, error: null };
  }

  if (typeof value === 'number') {
    if (value >= 0 && value <= 1) {
      return { value: roundNumber_(value * 100, 2), error: null };
    }
    if (value >= 0 && value <= 100) {
      return { value: roundNumber_(value, 2), error: null };
    }
    return { value: null, error: 'Tá»· lá»‡ hoÃ n thÃ nh ngoÃ i khoáº£ng 0-100.' };
  }

  var text = normalizeText(value).replace(',', '.');
  if (!text) {
    return { value: null, error: null };
  }

  if (/%$/.test(text)) {
    text = text.replace('%', '').trim();
  }

  if (!/^[-+]?\d+(\.\d+)?$/.test(text)) {
    return { value: null, error: 'KhÃ´ng parse Ä‘Æ°á»£c tá»· lá»‡ hoÃ n thÃ nh.' };
  }

  var num = Number(text);
  if (num >= 0 && num <= 1 && String(value).indexOf('%') === -1) {
    num = num * 100;
  }

  if (num < 0 || num > 100) {
    return { value: null, error: 'Tá»· lá»‡ hoÃ n thÃ nh ngoÃ i khoáº£ng 0-100.' };
  }

  return { value: roundNumber_(num, 2), error: null };
}

function parseCurrencySafe(value) {
  if (value === null || value === undefined || value === '') {
    return { value: null, error: null };
  }

  if (typeof value === 'number') {
    if (value < 0) {
      return { value: null, error: 'NgÃ¢n sÃ¡ch Ã¢m khÃ´ng há»£p lá»‡.' };
    }
    return { value: value, error: null };
  }

  var text = normalizeText(value);
  if (!text) {
    return { value: null, error: null };
  }

  text = text
    .replace(/Ä‘|vnd/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');

  if (!/^[-+]?\d+(\.\d+)?$/.test(text)) {
    return { value: null, error: 'KhÃ´ng parse Ä‘Æ°á»£c ngÃ¢n sÃ¡ch.' };
  }

  var num = Number(text);
  if (num < 0) {
    return { value: null, error: 'NgÃ¢n sÃ¡ch Ã¢m khÃ´ng há»£p lá»‡.' };
  }

  return { value: num, error: null };
}

function parseOwnerList(value) {
  var text = normalizeText(value);
  if (!text) {
    return [];
  }

  return text
    .split(/[;,|\/\n]+/)
    .map(function(item) { return normalizeText(item); })
    .filter(Boolean);
}

function detectRowType(rawRow, normalizedRow) {
  if (isMenu1EmptyRow_(rawRow, normalizedRow)) {
    return 'EMPTY';
  }

  if (normalizedRow.isGroupRow === true) {
    return 'GROUP';
  }

  var chiCoTenNhom =
    normalizedRow.taskName &&
    !normalizedRow.ownerPrimary &&
    !normalizedRow.deadlineDate &&
    normalizedRow.percentCompleteNormalized === null &&
    normalizedRow.plannedBudget === null &&
    normalizedRow.actualBudget === null &&
    !normalizedRow.actualDate;

  if (chiCoTenNhom) {
    return 'GROUP';
  }

  var laTask =
    !!normalizedRow.taskName &&
    (
      !!normalizedRow.deadlineDate ||
      normalizedRow.percentCompleteNormalized !== null ||
      !!normalizedRow.ownerPrimary ||
      normalizedRow.plannedBudget !== null ||
      normalizedRow.actualBudget !== null
    );

  if (laTask) {
    return 'TASK';
  }

  return 'INVALID';
}

function normalizeTaskRow(rawRow, headerMap, rowIndex) {
  var alerts = [];
  var warnings = [];
  var errors = [];
  var normalizedRaw = extractNormalizedRawRow_(rawRow, headerMap);
  var percentParsed = parsePercentSafe(normalizedRaw.percentCompleteRaw);
  var plannedBudgetParsed = parseCurrencySafe(normalizedRaw.plannedBudgetRaw);
  var actualBudgetParsed = parseCurrencySafe(normalizedRaw.actualBudgetRaw);
  var deadlineDate = parseDateSafe(normalizedRaw.deadlineRaw);
  var actualDate = parseDateSafe(normalizedRaw.actualDateRaw);
  var ownerList = parseOwnerList(normalizedRaw.ownerRaw);
  var priorityNormalized = normalizePriority_(normalizedRaw.priorityRaw);

  if (percentParsed.error) {
    errors.push(formatMenu1RowMessage_(rowIndex, 'percentComplete', percentParsed.error));
    alerts.push(createMenu1ValidationAlert_(rowIndex, normalizedRaw.taskName, 'percentComplete', percentParsed.error));
  }

  if (plannedBudgetParsed.error) {
    errors.push(formatMenu1RowMessage_(rowIndex, 'plannedBudget', plannedBudgetParsed.error));
    alerts.push(createMenu1ValidationAlert_(rowIndex, normalizedRaw.taskName, 'plannedBudget', plannedBudgetParsed.error));
  }

  if (actualBudgetParsed.error) {
    errors.push(formatMenu1RowMessage_(rowIndex, 'actualBudget', actualBudgetParsed.error));
    alerts.push(createMenu1ValidationAlert_(rowIndex, normalizedRaw.taskName, 'actualBudget', actualBudgetParsed.error));
  }

  if (normalizedRaw.deadlineRaw && !deadlineDate) {
    warnings.push(formatMenu1RowMessage_(rowIndex, 'deadline', 'KhÃ´ng parse Ä‘Æ°á»£c thá»i háº¡n.'));
  }

  if (normalizedRaw.actualDateRaw && !actualDate) {
    warnings.push(formatMenu1RowMessage_(rowIndex, 'actualDate', 'KhÃ´ng parse Ä‘Æ°á»£c ngÃ y hoÃ n thÃ nh thá»±c táº¿.'));
  }

  var task = {
    rowIndex: rowIndex,
    index: normalizedRaw.index,
    projectCode: normalizedRaw.projectCode || null,
    taskGroup: normalizedRaw.taskGroup || null,
    taskName: normalizedRaw.taskName || null,
    ownerPrimary: ownerList.length ? ownerList[0] : null,
    assignees: parseOwnerList(normalizedRaw.assigneesRaw),
    priority: normalizedRaw.priorityRaw || null,
    priorityNormalized: priorityNormalized,
    deadline: deadlineDate ? formatDateOutput_(deadlineDate) : null,
    deadlineDate: deadlineDate,
    actualDate: actualDate ? formatDateOutput_(actualDate) : null,
    actualDateRaw: normalizedRaw.actualDateRaw,
    actualDateDate: actualDate,
    percentCompleteNormalized: percentParsed.value,
    plannedBudget: plannedBudgetParsed.value,
    actualBudget: actualBudgetParsed.value,
    definitionOfDone: normalizedRaw.definitionOfDone || null,
    evaluation: normalizedRaw.evaluation || null,
    rootCauseAction: normalizedRaw.rootCauseAction || null,
    managementDirection: normalizedRaw.managementDirection || null,
    note: normalizedRaw.note || null,
    reportMonth: normalizedRaw.reportMonth || null,
    isGroupRow: normalizedRaw.isGroupRow,
    rowType: null,
    state: null,
    delayDays: null,
    alerts: alerts,
    logs: {
      warnings: warnings,
      errors: errors
    }
  };

  task.rowType = detectRowType(rawRow, task);
  return task;
}

function resolveTaskState(task, reportDate) {
  var percent = task.percentCompleteNormalized;
  var actualDate = task.actualDateDate;
  var deadline = task.deadlineDate;
  var done = !!actualDate || percent === 100;

  if (done && deadline && actualDate && actualDate.getTime() > deadline.getTime()) {
    return 'DONE_LATE';
  }

  if (done) {
    return 'DONE';
  }

  if (deadline && deadline.getTime() < reportDate.getTime()) {
    return 'OVERDUE';
  }

  if (percent !== null && percent > 0 && percent < 100) {
    return 'IN_PROGRESS';
  }

  return 'NOT_STARTED';
}

function calcDelayDays(deadline, reportDate) {
  if (!deadline || !reportDate) {
    return null;
  }

  var ms = atStartOfDay_(reportDate).getTime() - atStartOfDay_(deadline).getTime();
  return ms > 0 ? Math.floor(ms / 86400000) : 0;
}

function calcMedian(values) {
  var ds = (values || [])
    .filter(function(item) { return typeof item === 'number' && !isNaN(item); })
    .sort(function(a, b) { return a - b; });

  if (!ds.length) {
    return 0;
  }

  var mid = Math.floor(ds.length / 2);
  if (ds.length % 2 === 1) {
    return ds[mid];
  }

  return (ds[mid - 1] + ds[mid]) / 2;
}

function buildMenu1Summary(validTasks, overdueTasks) {
  var taskCount = (validTasks || []).length;
  var overdueCount = (overdueTasks || []).length;
  var delayValues = overdueTasks
    .map(function(task) { return task.delayDays; })
    .filter(function(item) { return typeof item === 'number'; });
  var budgetValues = overdueTasks
    .map(function(task) { return task.plannedBudget; })
    .filter(function(item) { return typeof item === 'number'; });

  return {
    overdueRate: taskCount ? roundNumber_((overdueCount / taskCount) * 100, 2) : 0,
    overdueCount: overdueCount,
    medianOverdueDays: calcMedian(delayValues),
    overdueBudgetHeld: budgetValues.length ? budgetValues.reduce(function(sum, value) { return sum + value; }, 0) : 0
  };
}

function buildMenu1Table(overdueTasks) {
  var priorityOrder = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
    unknown: 4
  };

  return (overdueTasks || [])
    .map(function(task) {
      return {
        rowIndex: task.rowIndex,
        projectCode: task.projectCode,
        taskGroup: task.taskGroup,
        taskName: task.taskName,
        ownerPrimary: task.ownerPrimary,
        priority: task.priority,
        deadline: task.deadline,
        percentCompleteNormalized: task.percentCompleteNormalized,
        plannedBudget: task.plannedBudget,
        delayDays: task.delayDays,
        state: dichTrangThaiCongViec_(task.state),
        rootCauseAction: task.rootCauseAction,
        managementDirection: task.managementDirection
      };
    })
    .sort(function(a, b) {
      var pA = priorityOrder[normalizePriority_(a.priority)] !== undefined ? priorityOrder[normalizePriority_(a.priority)] : 4;
      var pB = priorityOrder[normalizePriority_(b.priority)] !== undefined ? priorityOrder[normalizePriority_(b.priority)] : 4;
      if (pA !== pB) {
        return pA - pB;
      }
      if ((b.delayDays || 0) !== (a.delayDays || 0)) {
        return (b.delayDays || 0) - (a.delayDays || 0);
      }
      return (b.plannedBudget || 0) - (a.plannedBudget || 0);
    });
}

function buildMenu1Alerts(overdueTasks, config) {
  var threshold = Number(config.LARGE_PLANNED_BUDGET_THRESHOLD || 0);
  var alerts = [];

  (overdueTasks || []).forEach(function(task) {
    if ((task.delayDays || 0) > 7) {
      alerts.push({
        level: 'canh_bao',
        type: 'QUA_HAN_TREN_7_NGAY',
        message: 'Công việc quá hạn trên 7 ngày.',
        rowIndex: task.rowIndex,
        taskName: task.taskName
      });
    }

    if (task.priorityNormalized === 'urgent' || task.priorityNormalized === 'high') {
      alerts.push({
        level: 'canh_bao',
        type: 'QUA_HAN_UU_TIEN_CAO',
        message: 'Công việc quá hạn có mức ưu tiên cao.',
        rowIndex: task.rowIndex,
        taskName: task.taskName
      });
    }

    if (threshold > 0 && typeof task.plannedBudget === 'number' && task.plannedBudget >= threshold) {
      alerts.push({
        level: 'canh_bao',
        type: 'QUA_HAN_NGAN_SACH_LON',
        message: 'Công việc quá hạn có ngân sách kế hoạch lớn.',
        rowIndex: task.rowIndex,
        taskName: task.taskName
      });
    }

    if (!normalizeText(task.rootCauseAction)) {
      alerts.push({
        level: 'thong_tin',
        type: 'QUA_HAN_THIEU_NGUYEN_NHAN_GIAI_PHAP',
        message: 'Công việc quá hạn chưa có nguyên nhân và giải pháp.',
        rowIndex: task.rowIndex,
        taskName: task.taskName
      });
    }
  });

  return alerts;
}

function test_Menu1_OverdueReport() {
  var ketQua = getMenu1OverdueReport();
  Logger.log('[TEST] test_Menu1_OverdueReport => %s', JSON.stringify(ketQua));
  return ketQua;
}

function chayMenu1KiemTraCongViecQuaHan() {
  try {
    var ketQua = getMenu1OverdueReport();
    var ui = SpreadsheetApp.getUi();
    var thongDiep = buildMenu1ManagerPopupMessage_(ketQua);

    ui.alert('Tổng hợp tình trạng công việc quá hạn', thongDiep, ui.ButtonSet.OK);
    return ketQua;
  } catch (error) {
    Logger.log('Lỗi chayMenu1KiemTraCongViecQuaHan: %s', error.stack || error);
    throw error;
  }
}

function buildMenu1OverduePreviewLines_(table, maxItems) {
  var ds = Array.isArray(table) ? table : [];
  var gioiHan = Math.max(Number(maxItems || 10), 0);

  if (!ds.length) {
    return '- Không có công việc quá hạn.';
  }

  var lines = ds.slice(0, gioiHan).map(function(item) {
    var maDuAn = normalizeText(item.projectCode) ? '[' + String(item.projectCode) + '] ' : '';
    return '- ' + maDuAn + String(item.taskName || '')
      + ' | Chủ trì: ' + String(item.ownerPrimary || 'Chưa có')
      + ' | Quá hạn: ' + String(item.delayDays || 0) + ' ngày';
  });

  if (ds.length > gioiHan) {
    lines.push('- ... và ' + (ds.length - gioiHan) + ' công việc quá hạn khác.');
  }

  return lines.join('\n');
}

function dinhDangTienVndMenu1_(value) {
  var so = Number(value || 0);
  var phanNguyen = String(Math.round(so));
  return phanNguyen.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đồng';
}

function dinhDangTyLeMenu1_(value) {
  var so = Number(value || 0);
  return (Math.round(so * 10) / 10) + '%';
}

function dinhDangSoNgayMenu1_(value) {
  var so = Number(value || 0);
  return Math.round(so);
}

function getAdaptiveReportTone_(level) {
  var muc = String(level || 'ỔN ĐỊNH');
  if (muc === 'CẦN CAN THIỆP NGAY') {
    return {
      lead: 'Kết luận nhanh:',
      summaryLead: 'Tình hình cần ưu tiên xử lý ngay:',
      emptyFocus: 'Đã phát hiện nội dung cần ưu tiên can thiệp ngay theo số liệu hiện có.',
      stableRecommendation: 'Đề nghị tập trung xử lý ngay các nội dung trọng tâm nêu dưới đây.'
    };
  }
  if (muc === 'CẦN THEO DÕI') {
    return {
      lead: 'Kết luận nhanh:',
      summaryLead: 'Tình hình cần tiếp tục theo dõi:',
      emptyFocus: 'Chưa phát sinh nội dung cần can thiệp ngay, tuy nhiên cần tiếp tục theo dõi sát.',
      stableRecommendation: 'Đề nghị tiếp tục theo dõi các nội dung trọng tâm nêu dưới đây.'
    };
  }
  return {
    lead: 'Kết luận nhanh:',
    summaryLead: 'Tình hình hiện tại:',
    emptyFocus: 'Tình hình cơ bản ổn định, chưa phát sinh nội dung cần xử lý ngay.',
    stableRecommendation: 'Đề nghị tiếp tục duy trì nhịp theo dõi theo kế hoạch.'
  };
}

function resolveMenu1InterventionLevel_(ketQua) {
  var overdueCount = Number(ketQua && ketQua.summary ? ketQua.summary.overdueCount : 0) || 0;
  var overdueRate = Number(ketQua && ketQua.summary ? ketQua.summary.overdueRate : 0) || 0;
  var soUuTienCao = demAlertTheoType_(ketQua ? ketQua.alerts : [], 'QUA_HAN_UU_TIEN_CAO');
  if (soUuTienCao > 0 || overdueCount >= 3 || overdueRate >= 20) {
    return 'CẦN CAN THIỆP NGAY';
  }
  if (overdueCount > 0) {
    return 'CẦN THEO DÕI';
  }
  return 'ỔN ĐỊNH';
}

function buildMenu1ManagerPopupMessage_(ketQua) {
  var dsQuaHan = Array.isArray(ketQua.table) ? ketQua.table : [];
  var dsCanXuLyNgay = dsQuaHan
    .slice()
    .sort(function(a, b) {
      var mucA = normalizePriority_(a.priority);
      var mucB = normalizePriority_(b.priority);
      var diemA = (mucA === 'urgent' || mucA === 'high') ? 1 : 0;
      var diemB = (mucB === 'urgent' || mucB === 'high') ? 1 : 0;
      if (diemB !== diemA) {
        return diemB - diemA;
      }
      if ((b.delayDays || 0) !== (a.delayDays || 0)) {
        return (b.delayDays || 0) - (a.delayDays || 0);
      }
      return (b.plannedBudget || 0) - (a.plannedBudget || 0);
    });
  var soUuTienCao = demAlertTheoType_(ketQua.alerts, 'QUA_HAN_UU_TIEN_CAO');
  var soThieuNguyenNhan = demAlertTheoType_(ketQua.alerts, 'QUA_HAN_THIEU_NGUYEN_NHAN_GIAI_PHAP');
  var mucDoChung = resolveMenu1InterventionLevel_(ketQua);
  var tone = getAdaptiveReportTone_(mucDoChung);
  var lines = [
    tone.lead,
    '- Mức độ chung: ' + mucDoChung,
    '',
    tone.summaryLead,
    '- Tỷ lệ công việc quá hạn: ' + dinhDangTyLeMenu1_(ketQua.summary.overdueRate),
    '- Số lượng công việc quá hạn: ' + ketQua.summary.overdueCount + ' việc',
    '- Mức quá hạn phổ biến: khoảng ' + dinhDangSoNgayMenu1_(ketQua.summary.medianOverdueDays) + ' ngày',
    '- Tổng KH ngân sách của công việc quá hạn: ' + dinhDangTienVndMenu1_(ketQua.summary.overdueBudgetHeld),
    ''
  ];

  if (ketQua.summary.overdueCount > 0) {
    lines.push('Top việc cần xử lý ngay:');
    lines.push(buildMenu1OverduePreviewLines_(dsCanXuLyNgay, 5));
    lines.push('');
  } else {
    lines.push(tone.emptyFocus);
    lines.push('');
  }

  if (soUuTienCao > 0 || soThieuNguyenNhan > 0) {
    lines.push('Cảnh báo cần lưu ý:');
    if (soUuTienCao > 0) {
      lines.push('- Công việc quá hạn ưu tiên cao: ' + soUuTienCao + ' việc');
    }
    if (soThieuNguyenNhan > 0) {
      lines.push('- Công việc quá hạn chưa có nguyên nhân/giải pháp: ' + soThieuNguyenNhan + ' việc');
    }
    lines.push('');
  }

  if (ketQua.meta.invalidRowCount > 0) {
    lines.push('Kiểm tra dữ liệu:');
    lines.push('- Dòng dữ liệu không hợp lệ: ' + ketQua.meta.invalidRowCount);
  }

  return lines.join('\n');
}

function demAlertTheoType_(alerts, type) {
  return (alerts || []).filter(function(item) {
    return item && item.type === type;
  }).length;
}

function cloneMenu1Config_() {
  return {
    SHEET_NAME: MENU_1_OVERDUE_CONFIG_.SHEET_NAME,
    HEADER_ROW: MENU_1_OVERDUE_CONFIG_.HEADER_ROW,
    TEST_MODE: MENU_1_OVERDUE_CONFIG_.TEST_MODE,
    REPORT_DATE: MENU_1_OVERDUE_CONFIG_.REPORT_DATE,
    LARGE_PLANNED_BUDGET_THRESHOLD: MENU_1_OVERDUE_CONFIG_.LARGE_PLANNED_BUDGET_THRESHOLD
  };
}

function laySheetMenu1_(ss, config) {
  var tenSheet = normalizeText(config.SHEET_NAME);
  if (tenSheet) {
    var sheetByName = ss.getSheetByName(tenSheet);
    if (!sheetByName) {
      throw new Error('Không tìm thấy sheet theo cấu hình SHEET_NAME: ' + tenSheet);
    }
    return sheetByName;
  }

  var activeSheet = ss.getActiveSheet();
  if (!activeSheet) {
    throw new Error('Không lấy được sheet đang mở.');
  }
  return activeSheet;
}

function validateMenu1Input_(sheet, headerRow, reportDate) {
  if (!sheet) {
    throw new Error('Thiếu sheet đầu vào.');
  }
  if (!headerRow || headerRow < 1) {
    throw new Error('HEADER_ROW không hợp lệ.');
  }
  if (!reportDate || isNaN(reportDate.getTime())) {
    throw new Error('REPORT_DATE không hợp lệ.');
  }
}

function resolveMenu1ReportDate_(reportDateConfig) {
  return parseDateSafe(reportDateConfig) || atStartOfDay_(new Date());
}

function taoKetQuaMenu1Rong_(sheetName, reportDate, totalRowsRead) {
  Logger.log('Menu 1 - Tổng số dòng đọc được: %s', totalRowsRead);
  Logger.log('Menu 1 - Số dòng TASK hợp lệ: 0');
  Logger.log('Menu 1 - Số dòng GROUP: 0');
  Logger.log('Menu 1 - Số dòng INVALID: 0');
  Logger.log('Menu 1 - Số dòng OVERDUE: 0');

  return {
    meta: {
      sheetName: sheetName,
      reportDate: formatDateOutput_(reportDate),
      totalRowsRead: totalRowsRead,
      taskRowCount: 0,
      groupRowCount: 0,
      emptyRowCount: 0,
      invalidRowCount: 0,
      overdueRowCount: 0
    },
    summary: {
      overdueRate: 0,
      overdueCount: 0,
      medianOverdueDays: 0,
      overdueBudgetHeld: 0
    },
    table: [],
    alerts: [],
    logs: {
      warnings: [],
      errors: []
    }
  };
}

function extractNormalizedRawRow_(rawRow, headerMap) {
  return {
    index: normalizeText(readCellByKey_(rawRow, headerMap, 'index')),
    projectCode: normalizeText(readCellByKey_(rawRow, headerMap, 'projectCode')),
    taskName: normalizeText(readCellByKey_(rawRow, headerMap, 'taskName')),
    taskGroup: normalizeText(readCellByKey_(rawRow, headerMap, 'taskGroup')),
    ownerRaw: readCellByKey_(rawRow, headerMap, 'owner'),
    assigneesRaw: readCellByKey_(rawRow, headerMap, 'assignees'),
    priorityRaw: normalizeText(readCellByKey_(rawRow, headerMap, 'priority')),
    deadlineRaw: readCellByKey_(rawRow, headerMap, 'deadline'),
    actualDateRaw: readCellByKey_(rawRow, headerMap, 'actualDate'),
    percentCompleteRaw: readCellByKey_(rawRow, headerMap, 'percentComplete'),
    plannedBudgetRaw: readCellByKey_(rawRow, headerMap, 'plannedBudget'),
    actualBudgetRaw: readCellByKey_(rawRow, headerMap, 'actualBudget'),
    definitionOfDone: normalizeText(readCellByKey_(rawRow, headerMap, 'definitionOfDone')),
    evaluation: normalizeText(readCellByKey_(rawRow, headerMap, 'evaluation')),
    rootCauseAction: normalizeText(readCellByKey_(rawRow, headerMap, 'rootCauseAction')),
    managementDirection: normalizeText(readCellByKey_(rawRow, headerMap, 'managementDirection')),
    note: normalizeText(readCellByKey_(rawRow, headerMap, 'note')),
    reportMonth: normalizeText(readCellByKey_(rawRow, headerMap, 'reportMonth')),
    isGroupRow: parseBooleanish_(readCellByKey_(rawRow, headerMap, 'isGroupRow'))
  };
}

function readCellByKey_(rawRow, headerMap, key) {
  if (!headerMap || headerMap[key] === undefined) {
    return '';
  }
  return rawRow[headerMap[key]];
}

function isMenu1EmptyRow_(rawRow, normalizedRow) {
  var rawHasValue = (rawRow || []).some(function(cell) {
    return normalizeText(cell) !== '';
  });

  if (!rawHasValue) {
    return true;
  }

  return !normalizedRow.taskName &&
    !normalizedRow.projectCode &&
    !normalizedRow.taskGroup &&
    !normalizedRow.ownerPrimary &&
    normalizedRow.percentCompleteNormalized === null &&
    normalizedRow.plannedBudget === null &&
    normalizedRow.actualBudget === null &&
    !normalizedRow.deadlineDate &&
    !normalizedRow.actualDate &&
    !normalizedRow.definitionOfDone &&
    !normalizedRow.evaluation &&
    !normalizedRow.rootCauseAction &&
    !normalizedRow.managementDirection &&
    !normalizedRow.note;
}

function parseBooleanish_(value) {
  var text = normalizeText(value).toLowerCase();
  return ['true', '1', 'yes', 'y', 'x'].indexOf(text) !== -1;
}

function normalizeHeaderKey_(value) {
  var text = normalizeText(value).toLowerCase();
  text = text
    .replace(/[â€“â€”-]/g, ' ')
    .replace(/[()]/g, ' ')
    .replace(/&/g, ' va ')
    .replace(/\s+/g, ' ');
  text = loaiBoDauTiengViet_(text);
  return text;
}

function loaiBoDauTiengViet_(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Ä‘/g, 'd')
    .replace(/Ä/g, 'D');
}

function normalizePriority_(value) {
  var text = loaiBoDauTiengViet_(normalizeText(value).toLowerCase());
  if (!text) return 'unknown';
  if (['ut1', 'uu tien 1', 'uutien1'].indexOf(text) !== -1) return 'urgent';
  if (['ut2', 'uu tien 2', 'uutien2'].indexOf(text) !== -1) return 'high';
  if (['ut3', 'uu tien 3', 'uutien3'].indexOf(text) !== -1) return 'medium';
  if (['ut4', 'uu tien 4', 'uutien4'].indexOf(text) !== -1) return 'low';
  if (['urgent', 'khan', 'rat cao', 'critical'].indexOf(text) !== -1) return 'urgent';
  if (['high', 'cao'].indexOf(text) !== -1) return 'high';
  if (['medium', 'trung binh'].indexOf(text) !== -1) return 'medium';
  if (['low', 'thap'].indexOf(text) !== -1) return 'low';
  return 'unknown';
}

function formatDateOutput_(date) {
  if (!date) {
    return null;
  }
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function atStartOfDay_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function roundNumber_(value, decimals) {
  var factor = Math.pow(10, Number(decimals || 0));
  return Math.round(Number(value || 0) * factor) / factor;
}

function formatMenu1RowMessage_(rowIndex, fieldName, message) {
  return 'DÃ²ng ' + rowIndex + ' | ' + fieldName + ' | ' + message;
}

function createMenu1ValidationAlert_(rowIndex, taskName, type, message) {
  return {
    level: 'loi',
    type: 'LOI_DU_LIEU_' + String(type || '').toUpperCase(),
    message: message,
    rowIndex: rowIndex,
    taskName: taskName || null
  };
}

function dichTrangThaiCongViec_(state) {
  var map = {
    DONE: 'Hoàn thành',
    DONE_LATE: 'Hoàn thành quá hạn',
    OVERDUE: 'Quá hạn',
    IN_PROGRESS: 'Đang thực hiện',
    NOT_STARTED: 'Chưa bắt đầu'
  };
  return map[state] || state || null;
}

