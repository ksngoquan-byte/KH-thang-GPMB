var MENU_3_BUDGET_CONFIG_ = {
  SHEET_NAME: '',
  HEADER_ROW: 4,
  TEST_MODE: false,
  REPORT_DATE: null,
  POPUP_TOP_N: 5,
  HIGH_VARIANCE_UPPER_MULTIPLIER: 1.2,
  HIGH_FAC_UPPER_MULTIPLIER: 1.2,
  REPORT_HIGH_VARIANCE_RATE: 0.2,
  REPORT_MONITOR_VARIANCE_RATE: 0.05,
  REPORT_HIGH_FAC_MULTIPLIER: 1.15,
  HIGH_BUDGET_MISSING_RATE: 0.3,
  LARGE_PROJECT_VARIANCE_AMOUNT: 10000000,
  LARGE_TASK_VARIANCE_AMOUNT: 5000000,
  HIGH_RISK_SCORE: 0.75,
  MONITOR_RISK_SCORE: 0.4
};

function getMenu3BudgetReport() {
  try {
    var config = cloneMenu3Config_();
    var ss = layBangTinhDangMo_();
    var sheet = laySheetMenu1_(ss, config);
    var reportDate = resolveMenu1ReportDate_(config.REPORT_DATE);
    var headerRow = Number(config.HEADER_ROW || 4);

    validateMenu1Input_(sheet, headerRow, reportDate);

    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    var totalRowsRead = Math.max(lastRow - headerRow, 0);
    var reportData = taoKetQuaMenu3Rong_(sheet.getName(), reportDate, totalRowsRead);

    if (totalRowsRead <= 0 || lastColumn <= 0) {
      reportData.popupHtml = buildMenu3PopupHtml(reportData);
      return reportData;
    }

    var headers = sheet.getRange(headerRow, 1, 1, lastColumn).getDisplayValues()[0];
    var dataRange = sheet.getRange(headerRow + 1, 1, totalRowsRead, lastColumn);
    var dataValues = dataRange.getValues();
    var dataDisplayValues = dataRange.getDisplayValues();
    var headerMap = applyMenu1FixedColumns_(buildHeaderMap(headers));
    var validTasks = [];

    for (var i = 0; i < dataValues.length; i++) {
      var rowIndex = headerRow + 1 + i;
      var rawRow = dataValues[i].slice();
      rawRow[MENU_1_OVERDUE_FIXED_COLUMNS_.index] = dataDisplayValues[i][MENU_1_OVERDUE_FIXED_COLUMNS_.index];
      var task = normalizeTaskRow(rawRow, headerMap, rowIndex);
      task.state = resolveTaskState(task, reportDate);
      task.delayDays = task.state === 'OVERDUE' ? calcDelayDays(task.deadlineDate, reportDate) : null;
      task.taskIndex = normalizeText(task.index);
      task.ownerList = parseOwnerList(task.ownerPrimary);
      task.ownerPrimary = task.ownerPrimary || 'unassigned';
      task.priorityNormalized = normalizePriority(task.priority);

      if (task.logs.warnings.length) {
        reportData.logs.warnings = reportData.logs.warnings.concat(task.logs.warnings);
      }
      if (task.logs.errors.length) {
        reportData.logs.errors = reportData.logs.errors.concat(task.logs.errors);
      }

      if (task.rowType === 'EMPTY') {
        reportData.meta.emptyRowCount++;
        continue;
      }

      if (task.rowType === 'GROUP' || laDongTongMenu3_(task.taskIndex)) {
        reportData.meta.groupRowCount++;
        continue;
      }

      if (task.rowType === 'INVALID') {
        reportData.meta.invalidRowCount++;
        continue;
      }

      var taskIndexInfo = parseTaskIndex(task.taskIndex);
      task.parentIndex = taskIndexInfo.parentIndex;
      task.level = taskIndexInfo.level;
      task.childrenIndexes = [];
      task.isParent = false;
      task.isLeaf = true;
      task.rawPlannedBudget = resolveRawPlannedBudgetMenu3_(task);
      task.rawActualBudget = task.actualBudget;
      task.effectivePlannedBudget = task.rawPlannedBudget;
      task.effectiveActualBudget = task.actualBudget;
      task.FAC_line = null;
      task.varianceAmount = null;
      task.varianceRate = null;
      task.managerBudgetRiskScore = 0;
      task.interventionLevel = 'ỔN ĐỊNH';
      task.suggestedAction = '';
      task.projectCode = task.projectCode || null;
      task.sttWarning = taskIndexInfo.warning || null;

      if (task.sttWarning) {
        reportData.logs.warnings.push('Dòng ' + rowIndex + ': ' + task.sttWarning);
      }

      reportData.meta.taskRowCount++;
      validTasks.push(task);
    }

    buildTaskHierarchy(validTasks);
    assignParentChildRelations(validTasks);
    computeEffectiveBudgets(validTasks);

    var validLeafTasks = getLeafTasks(validTasks);
    var budgetAggregationTasks = getBudgetAggregationTasks_(validTasks);
    var comparableAggregationTasks = budgetAggregationTasks.filter(function(task) {
      return laDongCoDuNganSachMenu3_(task);
    });

    reportData.meta.budgetComparableTaskCount = comparableAggregationTasks.length;
    reportData.meta.projectCount = Object.keys(groupTasksByProject(budgetAggregationTasks)).length;

    var summary = calcBudgetSummary(budgetAggregationTasks, config);
    reportData.summary = summary;

    budgetAggregationTasks.forEach(function(task) {
      var lineMetric = calcBudgetLineMetrics(task, config);
      task.FAC_line = lineMetric.FAC_line;
      task.varianceAmount = lineMetric.varianceAmount;
      task.varianceRate = lineMetric.varianceRate;
      task.managerBudgetRiskScore = calcManagerBudgetRiskScore(lineMetric, config);
      task.interventionLevel = resolveBudgetInterventionLevel(lineMetric, summary, config);
      task.suggestedAction = buildBudgetSuggestedAction(lineMetric, config);
    });

    var topRiskTasks = buildMenu3TopRiskTasks_(budgetAggregationTasks, config);
    var topProjectVariance = buildTopProjectVariance(budgetAggregationTasks);
    var alerts = buildMenu3Alerts(summary, topRiskTasks, topProjectVariance, config)
      .concat(buildMenu3HierarchyAlerts_(validTasks, config));

    reportData.topRiskTasks = topRiskTasks;
    reportData.topProjectVariance = topProjectVariance;
    reportData.alerts = alerts;
    reportData.executiveRecommendations = buildMenu3ExecutiveRecommendations_(reportData, config);
    reportData.popupHtml = buildMenu3PopupHtml(reportData);

    Logger.log('Menu 3 - Tổng số dòng đọc được: %s', reportData.meta.totalRowsRead);
    Logger.log('Menu 3 - Số dòng TASK hợp lệ: %s', reportData.meta.taskRowCount);
    Logger.log('Menu 3 - Số dòng GROUP: %s', reportData.meta.groupRowCount);
    Logger.log('Menu 3 - Số dòng INVALID: %s', reportData.meta.invalidRowCount);
    Logger.log('Menu 3 - Số dòng có đủ dữ liệu ngân sách: %s', reportData.meta.budgetComparableTaskCount);
    Logger.log('Menu 3 - Số dự án: %s', reportData.meta.projectCount);

    return reportData;
  } catch (error) {
    Logger.log('Lỗi getMenu3BudgetReport: %s', error.stack || error);
    throw error;
  }
}

function showMenu3BudgetPopup() {
  try {
    var reportData = getMenu3BudgetReport();
    var html = HtmlService.createHtmlOutput(reportData.popupHtml)
      .setWidth(760)
      .setHeight(640);
    SpreadsheetApp.getUi().showModalDialog(html, 'Báo cáo ngân sách');
    return reportData;
  } catch (error) {
    Logger.log('Lỗi showMenu3BudgetPopup: %s', error.stack || error);
    throw error;
  }
}

function test_Menu3_BudgetReport() {
  var reportData = getMenu3BudgetReport();
  Logger.log('[TEST] test_Menu3_BudgetReport => %s', JSON.stringify(reportData));
  return reportData;
}

function buildMenu3PopupHtml(reportData) {
  var summary = reportData.summary || {};
  var topRiskTasks = reportData.topRiskTasks || [];
  var recommendations = reportData.executiveRecommendations || [];
  var tone = getAdaptiveReportTone_(summary.reportInterventionLevel || 'ỔN ĐỊNH');

  var html = [];
  html.push('<!DOCTYPE html><html><head><meta charset="UTF-8">');
  html.push('<style>');
  html.push('body{font-family:Arial,sans-serif;color:#222;padding:20px;line-height:1.45;}');
  html.push('h1{font-size:22px;margin:0 0 18px 0;font-weight:700;}');
  html.push('h2{font-size:16px;margin:18px 0 8px 0;font-weight:700;}');
  html.push('.section{margin-bottom:18px;}');
  html.push('.item{margin:8px 0 12px 0;padding:10px 12px;border:1px solid #d9d9d9;border-radius:6px;background:#fafafa;}');
  html.push('.level{font-weight:700;}');
  html.push('ul{margin:6px 0 0 18px;padding:0;}');
  html.push('li{margin:4px 0;}');
  html.push('.muted{color:#666;}');
  html.push('.note{font-size:12px;color:#666;margin-top:8px;}');
  html.push('.btn-wrap{margin-top:20px;text-align:right;}');
  html.push('button{padding:8px 16px;border:1px solid #777;background:#fff;border-radius:18px;cursor:pointer;}');
  html.push('</style></head><body>');

  html.push('<div class="section">');
  html.push('<h2>I. TÓM TẮT TÌNH HÌNH THỰC HIỆN</h2>');
  html.push('<ul>');
  html.push('<li>Kết luận điều hành: ' + escapeHtml(buildMenu3ExecutiveLead_(summary.reportInterventionLevel || 'ỔN ĐỊNH')) + '</li>');
  html.push('<li>Tổng ngân sách kế hoạch: ' + escapeHtml(formatCurrencyVi(summary.totalPlannedBudget)) + '</li>');
  html.push('<li>Tổng ngân sách thực hiện: ' + escapeHtml(formatCurrencyVi(summary.totalActualBudget)) + '</li>');
  html.push('<li>Chênh lệch ngân sách: ' + escapeHtml(formatCurrencyVi(summary.budgetVarianceAmount)) + '</li>');
  html.push('<li>Tỷ lệ chênh lệch: ' + escapeHtml(formatPercentVi(summary.budgetVarianceRate)) + '</li>');
  html.push('<li>Tỷ lệ vượt ngân sách: ' + escapeHtml(formatPercentVi(summary.budgetOverrunRate)) + '</li>');
  html.push('<li>Tỷ lệ thiếu dữ liệu ngân sách: ' + escapeHtml(formatPercentVi(summary.budgetMissingRate)) + '</li>');
  html.push('<li>Mức độ chung: <span class="level">' + escapeHtml(summary.reportInterventionLevel || 'ỔN ĐỊNH') + '</span></li>');
  html.push('</ul></div>');

  html.push('<div class="section">');
  html.push('<h2>II. CÁC HẠNG MỤC CẦN RÀ SOÁT TRỌNG TÂM</h2>');
  if (!topRiskTasks.length) {
    if ((summary.budgetMissingRate || 0) > 0) {
      html.push('<div class="muted">Chưa ghi nhận hạng mục vượt ngưỡng ngân sách cần can thiệp ngay; tuy nhiên tỷ lệ thiếu dữ liệu ngân sách còn cao, đề nghị ưu tiên bổ sung số liệu trước khi đánh giá sâu hơn.</div>');
    } else {
      html.push('<div class="muted">' + escapeHtml(tone.emptyFocus) + '</div>');
    }
  } else {
    topRiskTasks.forEach(function(task) {
      var tieuDeHangMuc = task.taskName || '';
      if (task.projectCode) {
        tieuDeHangMuc = '[' + task.projectCode + '] ' + tieuDeHangMuc;
      }
      html.push('<div class="item">');
      html.push('<div><span class="level">[MỨC ĐỘ: ' + escapeHtml(task.interventionLevel) + ']</span> ' + escapeHtml(tieuDeHangMuc) + '</div>');
      html.push('<ul>');
      html.push('<li>STT: ' + escapeHtml(task.taskIndex || '') + '</li>');
      html.push('<li>Chủ trì: ' + escapeHtml(task.ownerPrimary || 'Chưa phân công') + '</li>');
      html.push('<li>Ngân sách kế hoạch: ' + escapeHtml(formatCurrencyVi(task.effectivePlannedBudget)) + '</li>');
      html.push('<li>Ngân sách thực hiện: ' + escapeHtml(formatCurrencyViMenu3_(task.effectiveActualBudget, 'Chưa nhập giá trị')) + '</li>');
      html.push('<li>Chênh lệch: ' + escapeHtml(formatCurrencyViMenu3_(task.varianceAmount, 'Chưa đủ cơ sở xác định')) + '</li>');
      html.push('</ul></div>');
    });
  }
  html.push('</div>');

  html.push('<div class="section">');
  html.push('<h2>III. KIẾN NGHỊ XỬ LÝ</h2>');
  html.push('<ul>');
  recommendations.forEach(function(item) {
    html.push('<li>' + escapeHtml(item) + '</li>');
  });
  html.push('</ul></div>');

  html.push('<div class="btn-wrap"><button onclick="google.script.host.close()">Đóng</button></div>');
  html.push('</body></html>');
  return html.join('');
}

function normalizePriority(value) {
  return normalizePriority_(value);
}

function parseTaskIndex(value) {
  var stt = normalizeText(value);
  if (!stt) {
    return {
      taskIndex: null,
      parentIndex: null,
      level: null,
      isValid: false,
      warning: 'Thiếu STT công việc.'
    };
  }

  if (!/^\d+(?:\.\d+)*$/.test(stt)) {
    return {
      taskIndex: stt,
      parentIndex: null,
      level: null,
      isValid: false,
      warning: 'STT không đúng cấu trúc phân cấp.'
    };
  }

  var parts = stt.split('.');
  return {
    taskIndex: stt,
    parentIndex: parts.length > 1 ? parts.slice(0, -1).join('.') : null,
    level: parts.length - 1,
    isValid: true,
    warning: null
  };
}

function getTaskHierarchyInfo(taskIndex) {
  var info = parseTaskIndex(taskIndex);
  return {
    taskIndex: info.taskIndex,
    parentIndex: info.parentIndex,
    childrenIndexes: [],
    level: info.level,
    isParent: false,
    isLeaf: true
  };
}

function buildTaskHierarchy(tasks) {
  var map = {};
  var stack = [];

  (tasks || []).forEach(function(task) {
    var info = getTaskHierarchyInfo(task.taskIndex);
    task.taskIndex = info.taskIndex;
    task.parentIndex = info.parentIndex;
    task.childrenIndexes = [];
    task.level = typeof info.level === 'number' ? info.level : 0;
    task.isParent = false;
    task.isLeaf = true;
    task.parentRowIndex = null;
    task.childrenRowIndexes = [];
    task.descendantRowIndexes = [];

    while (stack.length && stack[stack.length - 1].level >= task.level) {
      stack.pop();
    }

    if (stack.length) {
      var parentTask = stack[stack.length - 1];
      task.parentRowIndex = parentTask.rowIndex;
      parentTask.childrenRowIndexes.push(task.rowIndex);
      parentTask.childrenIndexes.push(task.taskIndex);
      parentTask.isParent = true;
      parentTask.isLeaf = false;
    }

    map[String(task.rowIndex)] = task;
    stack.push(task);
  });

  (tasks || []).slice().reverse().forEach(function(task) {
    var descendants = [];
    (task.childrenRowIndexes || []).forEach(function(childRowIndex) {
      var childTask = map[String(childRowIndex)];
      if (!childTask) {
        return;
      }
      descendants.push(childTask.rowIndex);
      if (childTask.descendantRowIndexes && childTask.descendantRowIndexes.length) {
        descendants = descendants.concat(childTask.descendantRowIndexes);
      }
    });
    task.descendantRowIndexes = descendants;
  });

  return map;
}

function assignParentChildRelations(tasks) {
  return tasks || [];
}

function computeEffectiveBudgets(tasks) {
  (tasks || []).forEach(function(task) {
    task.effectivePlannedBudget = typeof task.rawPlannedBudget === 'number' ? task.rawPlannedBudget : null;
    task.effectiveActualBudget = typeof task.rawActualBudget === 'number' ? task.rawActualBudget : null;
    task.usesRawPlannedFallback = false;
    task.usesRawActualFallback = false;
    task._budgetComputed = true;
  });
  return tasks;
}

function isLeafTask(task) {
  return !!task && task.rowType === 'TASK' && task.isLeaf === true;
}

function getLeafTasks(tasks) {
  return (tasks || []).filter(isLeafTask);
}

function getBudgetAggregationTasks_(tasks) {
  var map = {};
  (tasks || []).forEach(function(task) {
    map[String(task.rowIndex)] = task;
  });

  function hasOwnBudget(task) {
    return typeof task.rawPlannedBudget === 'number' || typeof task.rawActualBudget === 'number';
  }

  function hasDescendantBudget(task) {
    return (task.descendantRowIndexes || []).some(function(rowIndex) {
      var childTask = map[String(rowIndex)];
      return !!childTask && hasOwnBudget(childTask);
    });
  }

  return (tasks || []).filter(function(task) {
    if (!task || task.rowType !== 'TASK') {
      return false;
    }
    if (!hasOwnBudget(task)) {
      return false;
    }
    if (hasDescendantBudget(task)) {
      return false;
    }

    task.effectivePlannedBudget = typeof task.rawPlannedBudget === 'number' ? task.rawPlannedBudget : null;
    task.effectiveActualBudget = typeof task.rawActualBudget === 'number' ? task.rawActualBudget : null;
    return true;
  });
}

function calcBudgetLineMetrics(task, config) {
  var planned = task.effectivePlannedBudget;
  var actual = task.effectiveActualBudget;
  var varianceAmount = null;
  var varianceRate = null;
  var FAC_line = null;
  var varianceRateLine = 0;
  var FACRiskLine = 0;
  var isBudgetDataMissing = isBudgetDataMissingMenu3_(task);
  var missingBudgetPenalty = isBudgetDataMissing ? 0.2 : 0;

  if (typeof planned === 'number' && typeof actual === 'number') {
    varianceAmount = actual - planned;
    if (planned > 0) {
      varianceRate = varianceAmount / planned;
      varianceRateLine = Math.max(0, varianceRate);
    }
  }

  var lineMetric = {
    rawPlannedBudget: task.rawPlannedBudget,
    rawActualBudget: task.rawActualBudget,
    effectivePlannedBudget: planned,
    effectiveActualBudget: actual,
    varianceAmount: varianceAmount,
    varianceRate: varianceRate,
    varianceRateLine: varianceRateLine,
    FAC_line: FAC_line,
    FACRiskLine: FACRiskLine,
    priorityWeight: resolvePriorityWeightMenu3_(task.priorityNormalized || normalizePriority(task.priority)),
    missingBudgetPenalty: missingBudgetPenalty,
    isBudgetDataMissing: isBudgetDataMissing
  };

  lineMetric.managerBudgetRiskScore = calcManagerBudgetRiskScore(lineMetric, config);
  return lineMetric;
}

function calcBudgetSummary(tasks, config) {
  var taskList = tasks || [];

  var plannedTasks = taskList.filter(function(task) {
    return typeof task.effectivePlannedBudget === 'number';
  });

  var actualTasks = taskList.filter(function(task) {
    return typeof task.effectiveActualBudget === 'number';
  });

  var comparableTasks = taskList.filter(function(task) {
    return typeof task.effectivePlannedBudget === 'number' &&
           typeof task.effectiveActualBudget === 'number';
  });

  var plannedTotal = plannedTasks.reduce(function(sum, task) {
    return sum + task.effectivePlannedBudget;
  }, 0);

  var actualTotal = actualTasks.reduce(function(sum, task) {
    return sum + task.effectiveActualBudget;
  }, 0);

  var varianceAmount = actualTotal - plannedTotal;
  var varianceRate = plannedTotal > 0 ? varianceAmount / plannedTotal : null;

  var overrunCount = comparableTasks.filter(function(task) {
    return task.effectiveActualBudget > task.effectivePlannedBudget;
  }).length;

  var missingCount = taskList.filter(function(task) {
    return isBudgetDataMissingMenu3_(task);
  }).length;

  var budgetMissingRate = taskList.length ? missingCount / taskList.length : 0;

  var summary = {
    totalPlannedBudget: plannedTotal,
    totalActualBudget: actualTotal,
    budgetVarianceAmount: varianceAmount,
    budgetVarianceRate: varianceRate,
    budgetOverrunRate: comparableTasks.length ? overrunCount / comparableTasks.length : 0,
    FAC_total: 0,
    budgetMissingRate: budgetMissingRate,
    reportInterventionLevel: '\u1ed4N \u0110\u1ecaNH',
    isEstimated: false
  };

  if (
    (typeof varianceRate === 'number' && varianceRate > config.REPORT_HIGH_VARIANCE_RATE)
  ) {
    summary.reportInterventionLevel = 'C\u1ea6N CAN THI\u1ec6P NGAY';
  } else if (
    (typeof varianceRate === 'number' && varianceRate > config.REPORT_MONITOR_VARIANCE_RATE) ||
    budgetMissingRate > config.HIGH_BUDGET_MISSING_RATE
  ) {
    summary.reportInterventionLevel = 'C\u1ea6N THEO D\u00d5I';
  }

  return summary;
}

function groupTasksByProject(tasks) {
  return (tasks || []).reduce(function(map, task) {
    var projectCode = normalizeText(task.projectCode);
    if (!projectCode) {
      return map;
    }
    if (!map[projectCode]) {
      map[projectCode] = [];
    }
    map[projectCode].push(task);
    return map;
  }, {});
}

function buildTopProjectVariance(tasks) {
  var grouped = groupTasksByProject(tasks);
  return Object.keys(grouped).map(function(projectCode) {
    var projectTasks = grouped[projectCode].filter(function(task) {
      return laDongCoDuNganSachMenu3_(task);
    });
    var plannedBudgetTotal = projectTasks.reduce(function(sum, task) {
      return sum + task.effectivePlannedBudget;
    }, 0);
    var actualBudgetTotal = projectTasks.reduce(function(sum, task) {
      return sum + task.effectiveActualBudget;
    }, 0);
    var varianceAmount = actualBudgetTotal - plannedBudgetTotal;
    var varianceRate = plannedBudgetTotal > 0 ? varianceAmount / plannedBudgetTotal : null;
    return {
      projectCode: projectCode,
      plannedBudgetTotal: plannedBudgetTotal,
      actualBudgetTotal: actualBudgetTotal,
      varianceAmount: varianceAmount,
      varianceRate: varianceRate
    };
  }).filter(function(item) {
    return item.varianceAmount > 0;
  }).sort(function(a, b) {
    if (b.varianceAmount !== a.varianceAmount) {
      return b.varianceAmount - a.varianceAmount;
    }
    return (b.varianceRate || 0) - (a.varianceRate || 0);
  }).slice(0, 5);
}

function calcManagerBudgetRiskScore(lineMetric, config) {
  return roundNumber_(
    (lineMetric.varianceRateLine * 0.45) +
    (lineMetric.priorityWeight * 0.25) +
    (lineMetric.missingBudgetPenalty * 0.30),
    4
  );
}

function resolveBudgetInterventionLevel(lineMetric, summary, config) {
  var planned = lineMetric.effectivePlannedBudget;
  var actual = lineMetric.effectiveActualBudget;
  var score = lineMetric.managerBudgetRiskScore;

  if (
    (typeof planned === 'number' && typeof actual === 'number' && actual > planned * config.HIGH_VARIANCE_UPPER_MULTIPLIER) ||
    score >= config.HIGH_RISK_SCORE
  ) {
    return 'C\u1ea6N CAN THI\u1ec6P NGAY';
  }

  if (
    (typeof planned === 'number' && typeof actual === 'number' && actual > planned) ||
    lineMetric.isBudgetDataMissing === true ||
    score >= config.MONITOR_RISK_SCORE
  ) {
    return 'C\u1ea6N THEO D\u00d5I';
  }

  return '\u1ed4N \u0110\u1ecaNH';
}

function buildBudgetSuggestedAction(lineMetric, config) {
  var planned = lineMetric.effectivePlannedBudget;
  var actual = lineMetric.effectiveActualBudget;

  if (typeof planned === 'number' && typeof actual === 'number' && actual > planned * config.HIGH_VARIANCE_UPPER_MULTIPLIER) {
    return 'Đề nghị rà soát nguyên nhân chênh lệch và phương án điều chỉnh ngân sách.';
  }
  if (lineMetric.priorityWeight === 0.4 && typeof planned === 'number' && typeof actual === 'number' && actual > planned) {
    return 'Đề xuất xem xét giảm phạm vi hoặc hoãn thực hiện hạng mục.';
  }
  if (lineMetric.isBudgetDataMissing === true) {
    return 'Đề nghị bổ sung dữ liệu ngân sách để bảo đảm cơ sở đánh giá.';
  }
  return 'Tạm thời tiếp tục theo dõi, chưa cần điều chỉnh lớn.';
}

function buildMenu3TopRiskTasks_(tasks, config) {
  var interventionOrder = {
    'CẦN CAN THIỆP NGAY': 0,
    'CẦN THEO DÕI': 1,
    'ỔN ĐỊNH': 2
  };

  return (tasks || []).filter(function(task) {
    return task.interventionLevel !== 'ỔN ĐỊNH';
  }).sort(function(a, b) {
    var orderA = interventionOrder[a.interventionLevel] || 2;
    var orderB = interventionOrder[b.interventionLevel] || 2;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    if (b.managerBudgetRiskScore !== a.managerBudgetRiskScore) {
      return b.managerBudgetRiskScore - a.managerBudgetRiskScore;
    }
    if ((b.varianceAmount || 0) !== (a.varianceAmount || 0)) {
      return (b.varianceAmount || 0) - (a.varianceAmount || 0);
    }
    return (b.effectivePlannedBudget || 0) - (a.effectivePlannedBudget || 0);
  }).slice(0, Math.max(Number(config.POPUP_TOP_N || 5), 0)).map(function(task) {
    return {
      rowIndex: task.rowIndex,
      taskIndex: task.taskIndex || null,
      parentIndex: task.parentIndex || null,
      level: task.level,
      isParent: !!task.isParent,
      isLeaf: !!task.isLeaf,
      projectCode: task.projectCode || null,
      taskGroup: task.taskGroup || null,
      taskName: task.taskName || null,
      ownerPrimary: task.ownerPrimary || null,
      priority: task.priority || null,
      rawPlannedBudget: task.rawPlannedBudget,
      rawActualBudget: task.rawActualBudget,
      effectivePlannedBudget: task.effectivePlannedBudget,
      effectiveActualBudget: task.effectiveActualBudget,
      varianceAmount: task.varianceAmount,
      varianceRate: task.varianceRate,
      FAC_line: task.FAC_line,
      managerBudgetRiskScore: task.managerBudgetRiskScore,
      interventionLevel: task.interventionLevel,
      suggestedAction: task.suggestedAction
    };
  });
}

function buildMenu3Alerts(summary, topRiskTasks, topProjectVariance, config) {
  var alerts = [];

  (topRiskTasks || []).forEach(function(task) {
    if (typeof task.effectivePlannedBudget === 'number' && typeof task.effectiveActualBudget === 'number' && task.effectiveActualBudget > task.effectivePlannedBudget) {
      alerts.push({
        level: 'CẦN THEO DÕI',
        type: 'TASK_BUDGET_OVERRUN',
        message: 'Đề nghị rà soát hạng mục có chi thực hiện vượt kế hoạch.',
        taskName: task.taskName,
        projectCode: task.projectCode
      });
    }
    if ((task.priority === 'ƯT1' || task.priority === 'ƯT2' || task.priority === 'urgent' || task.priority === 'high') && typeof task.effectivePlannedBudget === 'number' && typeof task.effectiveActualBudget === 'number' && task.effectiveActualBudget > task.effectivePlannedBudget) {
      alerts.push({
        level: 'CẦN CAN THIỆP NGAY',
        type: 'HIGH_PRIORITY_OVERRUN',
        message: 'Cần ưu tiên xử lý hạng mục ưu tiên cao đang vượt chi.',
        taskName: task.taskName,
        projectCode: task.projectCode
      });
    }
  });

  (topProjectVariance || []).forEach(function(item) {
    if (item.varianceAmount >= config.LARGE_PROJECT_VARIANCE_AMOUNT) {
      alerts.push({
        level: 'CẦN THEO DÕI',
        type: 'PROJECT_LARGE_VARIANCE',
        message: 'Kiến nghị rà soát dự án có chênh lệch ngân sách dương lớn.',
        taskName: null,
        projectCode: item.projectCode
      });
    }
  });

  if (summary.budgetMissingRate > config.HIGH_BUDGET_MISSING_RATE) {
    alerts.push({
      level: 'CẦN THEO DÕI',
      type: 'HIGH_BUDGET_MISSING_RATE',
      message: 'Đề nghị bổ sung dữ liệu ngân sách còn thiếu trước khi chốt báo cáo.',
      taskName: null,
      projectCode: null
    });
  }

  if (typeof summary.budgetVarianceRate === 'number' && summary.budgetVarianceRate > config.REPORT_HIGH_VARIANCE_RATE) {
    alerts.push({
      level: 'CẦN CAN THIỆP NGAY',
      type: 'REPORT_HIGH_VARIANCE',
      message: 'Cần ưu tiên xử lý các hạng mục có chênh lệch ngân sách dương lớn.',
      taskName: null,
      projectCode: null
    });
  }

  return alerts;
}

function buildMenu3ExecutiveRecommendations_(reportData, config) {
  var recommendations = [];
  var summary = reportData.summary || {};
  var topRiskTasks = reportData.topRiskTasks || [];
  var topProjectVariance = reportData.topProjectVariance || [];
  var level = summary.reportInterventionLevel || 'ỔN ĐỊNH';

  if ((summary.budgetOverrunRate || 0) > 0) {
    recommendations.push('Đề nghị rà soát các hạng mục có chi thực hiện vượt kế hoạch.');
  }
  if (topProjectVariance.length > 0) {
    recommendations.push('Cần ưu tiên xử lý các dự án có chênh lệch ngân sách dương lớn.');
  }
  if ((summary.budgetMissingRate || 0) > 0) {
    recommendations.push('Đề nghị bổ sung dữ liệu ngân sách còn thiếu trước khi chốt báo cáo.');
  }
  if (topRiskTasks.some(function(task) { return normalizePriority(task.priority) === 'low' && task.interventionLevel === 'CẦN CAN THIỆP NGAY'; })) {
    recommendations.push('Kiến nghị xem xét tạm dừng chi đối với các hạng mục ưu tiên thấp đang vượt dự toán.');
  }

  if (level === 'CẦN CAN THIỆP NGAY') {
    recommendations.unshift('Cần ưu tiên xử lý ngay các nội dung ngân sách đang vượt ngưỡng kiểm soát.');
  } else if (level === 'CẦN THEO DÕI') {
    recommendations.unshift('Đề nghị tiếp tục theo dõi sát các biến động ngân sách trong các hạng mục trọng tâm.');
  }

  if (!recommendations.length) {
    recommendations.push('Tình hình ngân sách hiện tại cơ bản ổn định, đề nghị tiếp tục theo dõi theo kế hoạch.');
  }

  return recommendations.slice(0, 5);
}

function buildMenu3ExecutiveLead_(level) {
  if (level === 'C\u1ea6N CAN THI\u1ec6P NGAY') {
    return 'T\u00ecnh h\u00ecnh ng\u00e2n s\u00e1ch th\u00e1ng hi\u1ec7n c\u1ea7n \u01b0u ti\u00ean x\u1eed l\u00fd ngay \u0111\u1ed1i v\u1edbi c\u00e1c h\u1ea1ng m\u1ee5c tr\u1ecdng t\u00e2m.';
  }
  if (level === 'C\u1ea6N THEO D\u00d5I') {
    return 'T\u00ecnh h\u00ecnh ng\u00e2n s\u00e1ch th\u00e1ng ph\u00e1t sinh n\u1ed9i dung c\u1ea7n ti\u1ebfp t\u1ee5c theo d\u00f5i v\u00e0 r\u00e0 so\u00e1t.';
  }
  return 'T\u00ecnh h\u00ecnh ng\u00e2n s\u00e1ch th\u00e1ng c\u01a1 b\u1ea3n \u1ed5n \u0111\u1ecbnh, ti\u1ebfp t\u1ee5c theo d\u00f5i theo k\u1ebf ho\u1ea1ch.';
}

function formatPercentVi(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'Không xác định';
  }
  return formatNumberVi(Number(value) * 100) + '%';
}

function formatNumberVi(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'Không xác định';
  }
  var so = roundNumber_(Number(value), 1);
  var phan = String(so).split('.');
  phan[0] = phan[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return phan.length > 1 && phan[1] !== '0' ? phan.join(',') : phan[0];
}

function formatCurrencyVi(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'Không xác định';
  }
  return formatNumberVi(Math.round(Number(value))) + ' đồng';
}

function formatCurrencyViMenu3_(value, emptyText) {
  if (value === null || value === undefined || isNaN(value)) {
    return emptyText || 'Không xác định';
  }
  return formatCurrencyVi(value);
}

function escapeHtml(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function laDongTongMenu3_(taskIndex) {
  return taskIndex === '∑' || taskIndex === 'Σ';
}

function laDongCoDuNganSachMenu3_(task) {
  return typeof task.effectivePlannedBudget === 'number' && typeof task.effectiveActualBudget === 'number';
}

function resolveRawPlannedBudgetMenu3_(task) {
  return typeof task.plannedBudget === 'number' ? task.plannedBudget : null;
}

function isBudgetDataMissingMenu3_(task) {
  var planned = task.effectivePlannedBudget;
  var actual = task.effectiveActualBudget;
  if (typeof planned !== 'number') {
    return false;
  }
  if (planned <= 0) {
    return false;
  }
  if (typeof actual === 'number') {
    return false;
  }
  return task.state === 'OVERDUE';
}

function resolvePriorityWeightMenu3_(priority) {
  var map = {
    urgent: 1.2,
    high: 1.0,
    medium: 0.7,
    low: 0.4,
    unknown: 0.6
  };
  return map[priority] !== undefined ? map[priority] : 0.6;
}

function buildMenu3HierarchyAlerts_(tasks, config) {
  var alerts = [];
  (tasks || []).forEach(function(task) {
    if (task.sttWarning) {
      alerts.push({
        level: 'CẦN THEO DÕI',
        type: 'TASK_INDEX_STRUCTURE_WARNING',
        message: 'Đề nghị rà soát cấu trúc STT để bảo đảm quan hệ cha - con rõ ràng.',
        taskName: task.taskName || null,
        projectCode: task.projectCode || null
      });
    }
    if (task.isParent && typeof task.rawPlannedBudget === 'number' && typeof task.effectivePlannedBudget === 'number') {
      if (Math.abs(task.rawPlannedBudget - task.effectivePlannedBudget) >= config.LARGE_TASK_VARIANCE_AMOUNT) {
        alerts.push({
          level: 'CẦN THEO DÕI',
          type: 'PARENT_CHILD_BUDGET_DEBUG',
          message: 'Kiến nghị kiểm tra chênh lệch giữa ngân sách dòng cha và tổng ngân sách công việc con.',
          taskName: task.taskName || null,
          projectCode: task.projectCode || null
        });
      }
    }
  });
  return alerts;
}

function cloneMenu3Config_() {
  return JSON.parse(JSON.stringify(MENU_3_BUDGET_CONFIG_));
}

function taoKetQuaMenu3Rong_(sheetName, reportDate, totalRowsRead) {
  return {
    meta: {
      sheetName: sheetName,
      reportDate: formatDateOutput_(reportDate),
      totalRowsRead: totalRowsRead || 0,
      taskRowCount: 0,
      groupRowCount: 0,
      emptyRowCount: 0,
      invalidRowCount: 0,
      budgetComparableTaskCount: 0,
      projectCount: 0
    },
    summary: {
      totalPlannedBudget: 0,
      totalActualBudget: 0,
      budgetVarianceAmount: 0,
      budgetVarianceRate: null,
      budgetOverrunRate: 0,
      FAC_total: 0,
      budgetMissingRate: 0,
      reportInterventionLevel: 'ỔN ĐỊNH',
      isEstimated: false
    },
    topRiskTasks: [],
    topProjectVariance: [],
    alerts: [],
    popupHtml: '',
    logs: {
      warnings: [],
      errors: []
    }
  };
}

// Reuse từ Menu 1/2:
// buildHeaderMap
// normalizeText
// parseDateSafe
// parsePercentSafe
// parseCurrencySafe
// parseOwnerList
// detectRowType
// normalizeTaskRow
// resolveTaskState














