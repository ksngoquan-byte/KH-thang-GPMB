var MENU_5_MONTH_END_CONFIG_ = {
  SHEET_NAME: '',
  HEADER_ROW: 4,
  TEST_MODE: false,
  REPORT_DATE: null,
  POPUP_TOP_N: 5,
  HIGH_RISK_SCORE: 0.75,
  MONITOR_RISK_SCORE: 0.4,
  LOW_COMPOSITE_SCORE_THRESHOLD: 50,
  MONITOR_COMPOSITE_SCORE_THRESHOLD: 70,
  LOW_RCA_RATE_THRESHOLD: 0.6,
  LOW_ON_TIME_THRESHOLD: 0.6,
  HIGH_BLANK_EVALUATION_RATE_THRESHOLD: 0.3,
  HIGH_MANAGEMENT_DIRECTION_TASK_COUNT_THRESHOLD: 3
};

function getMenu5MonthEndReport() {
  try {
    var config = cloneMenu5Config_();
    var ss = layBangTinhDangMo_();
    var sheet = laySheetMenu1_(ss, config);
    var reportDate = resolveMenu1ReportDate_(config.REPORT_DATE);
    var headerRow = Number(config.HEADER_ROW || 4);

    validateMenu1Input_(sheet, headerRow, reportDate);

    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    var totalRowsRead = Math.max(lastRow - headerRow, 0);
    var reportData = taoKetQuaMenu5Rong_(sheet.getName(), reportDate, totalRowsRead);

    if (totalRowsRead <= 0 || lastColumn <= 0) {
      reportData.executiveRecommendations = buildExecutiveRecommendations(reportData, config);
      reportData.popupHtml = buildMenu5PopupHtml(reportData);
      return reportData;
    }

    var headers = sheet.getRange(headerRow, 1, 1, lastColumn).getDisplayValues()[0];
    var dataRange = sheet.getRange(headerRow + 1, 1, totalRowsRead, lastColumn);
    var dataValues = dataRange.getValues();
    var dataDisplayValues = dataRange.getDisplayValues();
    var headerMap = applyMenu1FixedColumns_(buildHeaderMap(headers));
    var arisingSectionInfo = findMenu5ArisingSection_(dataDisplayValues, headerRow);
    var validTasks = [];

    for (var i = 0; i < dataValues.length; i++) {
      var rowIndex = headerRow + 1 + i;
      var rawRow = dataValues[i].slice();
      rawRow[MENU_1_OVERDUE_FIXED_COLUMNS_.index] = dataDisplayValues[i][MENU_1_OVERDUE_FIXED_COLUMNS_.index];

      var task = normalizeTaskRow(rawRow, headerMap, rowIndex);
      task.rowType = detectRowTypeMenu5_(rawRow, task);
      task.state = resolveTaskState(task, reportDate);
      task.taskIndex = normalizeText(task.index);
      task.ownerList = parseOwnerList(task.ownerPrimary);
      task.ownerPrimary = task.ownerPrimary || 'unassigned';
      task.priorityNormalized = normalizePriority(task.priority);
      task.projectBucket = normalizeText(task.projectCode) || 'Công ty';
      task.taskGroupBucket = normalizeText(task.taskGroup) || 'Chưa phân nhóm nhiệm vụ';
      task.isArising = isTaskInMenu5ArisingSection_(rowIndex, arisingSectionInfo);
      task.parentIndex = null;
      task.level = null;
      task.childrenIndexes = [];
      task.isParent = false;
      task.isLeaf = true;
      task.managerMonthEndRiskScore = 0;
      task.interventionLevel = 'ỔN ĐỊNH';
      task.suggestedAction = '';
      task.sttWarning = null;

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

      if (task.rowType === 'GROUP' || laDongTongMenu5_(task.taskIndex)) {
        reportData.meta.groupRowCount++;
        continue;
      }

      if (task.rowType === 'INVALID') {
        reportData.meta.invalidRowCount++;
        continue;
      }

      var info = parseTaskIndex(task.taskIndex);
      task.parentIndex = info.parentIndex;
      task.level = info.level;
      task.sttWarning = info.warning || null;
      if (task.sttWarning) {
        reportData.logs.warnings.push('Dòng ' + rowIndex + ': ' + task.sttWarning);
      }

      reportData.meta.taskRowCount++;
      validTasks.push(task);
    }

    buildTaskHierarchy(validTasks);
    assignParentChildRelations(validTasks);

    var validLeafTasks = getLeafTasks(validTasks);
    reportData.meta.leafTaskCount = validLeafTasks.length;
    reportData.summary = calcMonthEndSummary(validLeafTasks, config);
    reportData.ownerStats = calcOwnerStats(validLeafTasks, config);
    reportData.projectStats = calcProjectStats(validLeafTasks, config);
    reportData.taskGroupStats = calcTaskGroupStats(validLeafTasks, config);
    reportData.arisingStats = calcArisingStats(validLeafTasks, config);
    reportData.backlogStats = calcMenu5BacklogStats_(validLeafTasks, config);
    reportData.meta.projectCount = reportData.projectStats.length;
    reportData.meta.taskGroupCount = reportData.taskGroupStats.length;
    reportData.topLateCauses = buildTopLateCauses(validLeafTasks, config);

    validLeafTasks.forEach(function(task) {
      task.managerMonthEndRiskScore = calcManagerMonthEndRiskScore(task, config);
      task.interventionLevel = resolveMonthEndInterventionLevel(task, reportData.summary, config);
      task.suggestedAction = buildMonthEndSuggestedAction(task, config);
    });

    reportData.topRiskTasks = buildTopRiskTasks(validLeafTasks, config);
    reportData.alerts = buildMenu5Alerts(reportData.summary, reportData.topRiskTasks, reportData.topLateCauses, config)
      .concat(buildMenu5HierarchyAlerts_(validTasks));
    reportData.executiveRecommendations = buildExecutiveRecommendations(reportData, config);
    reportData.popupHtml = buildMenu5PopupHtml(reportData);

    Logger.log('Menu 5 - Tổng số dòng đọc được: %s', reportData.meta.totalRowsRead);
    Logger.log('Menu 5 - Số dòng TASK hợp lệ: %s', reportData.meta.taskRowCount);
    Logger.log('Menu 5 - Số dòng GROUP: %s', reportData.meta.groupRowCount);
    Logger.log('Menu 5 - Số dòng INVALID: %s', reportData.meta.invalidRowCount);
    Logger.log('Menu 5 - Số task lá: %s', reportData.meta.leafTaskCount);
    Logger.log('Menu 5 - Điểm hiệu suất tháng: %s', formatNumberVi(reportData.summary.compositeScore));
    Logger.log('Menu 5 - Tỷ lệ hoàn thành tháng: %s', formatPercentVi(reportData.summary.monthlyCompletionRate));

    return reportData;
  } catch (error) {
    Logger.log('Lỗi getMenu5MonthEndReport: %s', error.stack || error);
    throw error;
  }
}

function showMenu5MonthEndPopup() {
  try {
    var reportData = getMenu5MonthEndReport();
    var html = HtmlService.createHtmlOutput(reportData.popupHtml)
      .setWidth(760)
      .setHeight(640);
    SpreadsheetApp.getUi().showModalDialog(html, 'Tổng kết cuối tháng');
    return reportData;
  } catch (error) {
    Logger.log('Lỗi showMenu5MonthEndPopup: %s', error.stack || error);
    throw error;
  }
}

function test_Menu5_MonthEndReport() {
  var reportData = getMenu5MonthEndReport();
  Logger.log('[TEST] test_Menu5_MonthEndReport => %s', JSON.stringify(reportData));
  return reportData;
}
function buildMenu5PopupHtml(reportData) {
  var summary = reportData.summary || {};
  var topLateCauses = reportData.topLateCauses || [];
  var ownerStats = reportData.ownerStats || [];
  var projectStats = reportData.projectStats || [];
  var taskGroupStats = reportData.taskGroupStats || [];
  var arisingStats = reportData.arisingStats || {};
  var backlogStats = reportData.backlogStats || {};
  var recommendations = reportData.executiveRecommendations || [];
  var executiveConclusion = buildMenu5ExecutiveConclusion_(reportData);
  var ownerAttention = getMenu5OwnerAttentionItems_(ownerStats);
  var dossierItems = getMenu5DossierItems_(reportData);
  var managementItems = buildMenu5ManagementFocus_(reportData);
  var projectBestWorst = getMenu5BestWorstStat_(projectStats, 'completedRate');
  var ownerBestWorst = getMenu5BestWorstStat_(ownerStats, 'completedRate');
  var taskGroupBestWorst = getMenu5BestWorstStat_(taskGroupStats, 'completedRate');
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
  html.push('.owner-table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px;}');
  html.push('.owner-table th,.owner-table td{border:1px solid #ddd;padding:6px 8px;text-align:left;}');
  html.push('.subhead{font-weight:700;margin-top:10px;}');
  html.push('.btn-wrap{margin-top:20px;text-align:right;}');
  html.push('button{padding:8px 16px;border:1px solid #777;background:#fff;border-radius:18px;cursor:pointer;}');
  html.push('</style></head><body>');
  html.push('<h1>BÁO CÁO TỔNG KẾT ĐÁNH GIÁ CUỐI THÁNG</h1>');

  html.push('<div class="section"><h2>I. KẾT LUẬN ĐIỀU HÀNH</h2><ul>');
  executiveConclusion.forEach(function(item) {
    html.push('<li>' + escapeHtml(item) + '</li>');
  });
  html.push('</ul></div>');

  html.push('<div class="section"><h2>II. TÌNH HÌNH THỰC HIỆN TỔNG QUÁT</h2><ul>');
  html.push('<li>Công việc: tổng số ' + escapeHtml(formatNumberVi(reportData.meta.leafTaskCount || 0)) + ' việc; đã hoàn thành ' + escapeHtml(formatNumberVi(summary.completedTaskCount || 0)) + ' việc, đạt ' + escapeHtml(formatPercentVi(summary.monthlyCompletionRate)) + '; đúng hạn ' + escapeHtml(formatPercentVi(summary.onTimeCompletionRate)) + '.</li>');
  html.push('<li>Tồn đọng chuyển tháng sau: ' + escapeHtml(formatNumberVi(summary.backlogTransferCount || 0)) + ' việc, chiếm ' + escapeHtml(formatPercentVi(summary.backlogTransferRate || 0)) + ' tổng số việc trong tháng.</li>');
  html.push('<li>Dự án: trong tháng thực hiện ' + escapeHtml(formatNumberVi(reportData.meta.projectCount || 0)) + ' dự án/đầu việc cấp công ty.</li>');
  if (projectBestWorst.best) {
    html.push('<li>Dự án hoàn thành tốt nhất: ' + escapeHtml(projectBestWorst.best.name) + ' (' + escapeHtml(formatPercentVi(projectBestWorst.best.completedRate)) + ').</li>');
  }
  if (projectBestWorst.worst) {
    html.push('<li>Dự án hoàn thành thấp nhất: ' + escapeHtml(projectBestWorst.worst.name) + ' (' + escapeHtml(formatPercentVi(projectBestWorst.worst.completedRate)) + ').</li>');
  }
  if (summary.budgetVarianceRate === null) {
    html.push('<li>Ngân sách: chưa đủ dữ liệu để đối chiếu kế hoạch và thực hiện.</li>');
  } else {
    html.push('<li>Ngân sách: kế hoạch ' + escapeHtml(formatNumberVi(summary.totalPlannedBudget || 0)) + ' đồng; thực hiện ' + escapeHtml(formatNumberVi(summary.totalActualBudget || 0)) + ' đồng; chênh lệch ' + escapeHtml(formatPercentVi(summary.budgetVarianceRate)) + '.</li>');
  }
  if (ownerBestWorst.best) {
    html.push('<li>Nhân sự hoàn thành tốt nhất: ' + escapeHtml(formatOwnerViMenu5_(ownerBestWorst.best.ownerPrimary || ownerBestWorst.best.name)) + ' (' + escapeHtml(formatPercentVi(ownerBestWorst.best.completedRate)) + ').</li>');
  }
  if (ownerBestWorst.worst) {
    html.push('<li>Nhân sự có tỷ lệ hoàn thành còn thấp: ' + escapeHtml(formatOwnerViMenu5_(ownerBestWorst.worst.ownerPrimary || ownerBestWorst.worst.name)) + ' (' + escapeHtml(formatPercentVi(ownerBestWorst.worst.completedRate)) + ').</li>');
  }
  html.push('<li>Công việc phát sinh trong kỳ: ' + escapeHtml(formatNumberVi(arisingStats.taskCount || 0)) + ' việc; đã hoàn thành ' + escapeHtml(formatNumberVi(arisingStats.completedTaskCount || 0)) + ' việc, đạt ' + escapeHtml(formatPercentVi(arisingStats.completionRate || 0)) + '.</li>');
  html.push('<li>Mức độ chung: <span class="level">' + escapeHtml(summary.reportInterventionLevel || 'ỔN ĐỊNH') + '</span></li>');
  html.push('</ul>');
  html.push('<div class="subhead">Theo nhóm nhiệm vụ</div><ul>');
  html.push('<li>Số nhóm nhiệm vụ có phát sinh việc: ' + escapeHtml(formatNumberVi(reportData.meta.taskGroupCount || 0)) + '.</li>');
  if (taskGroupBestWorst.best) {
    html.push('<li>Nhóm nhiệm vụ hoàn thành tốt nhất: ' + escapeHtml(taskGroupBestWorst.best.name) + ' (' + escapeHtml(formatPercentVi(taskGroupBestWorst.best.completedRate)) + ').</li>');
  }
  if (taskGroupBestWorst.worst) {
    html.push('<li>Nhóm nhiệm vụ hoàn thành thấp nhất: ' + escapeHtml(taskGroupBestWorst.worst.name) + ' (' + escapeHtml(formatPercentVi(taskGroupBestWorst.worst.completedRate)) + ').</li>');
  }
  html.push('</ul>');
  if (ownerAttention.length) {
    html.push('<div class="subhead">Nhân sự cần rà soát</div>');
    html.push('<table class="owner-table"><thead><tr><th>Nhân sự cần rà soát</th><th>Số việc</th><th>Hoàn thành</th><th>Đúng hạn</th><th>Việc trễ</th><th>Đánh giá trống</th></tr></thead><tbody>');
    ownerAttention.forEach(function(item) {
      html.push('<tr><td>' + escapeHtml(formatOwnerViMenu5_(item.ownerPrimary)) + '</td><td>' + escapeHtml(formatNumberVi(item.taskCount)) + '</td><td>' + escapeHtml(formatPercentVi(item.completedRate)) + '</td><td>' + escapeHtml(formatPercentVi(item.onTimeRate)) + '</td><td>' + escapeHtml(formatNumberVi(item.lateTaskCount)) + '</td><td>' + escapeHtml(formatPercentVi(item.blankEvaluationRate)) + '</td></tr>');
    });
    html.push('</tbody></table>');
  }
  html.push('</div>');

  html.push('<div class="section"><h2>III. NỘI DUNG TRƯỞNG PHÒNG CẦN XEM XÉT NGAY</h2>');
  if (!managementItems.length) {
    html.push('<div class="muted">Hiện chưa phát sinh nội dung trọng tâm cần xem xét ngay theo tiêu chí tổng kết cuối tháng.</div>');
  } else {
    html.push('<ul>');
    managementItems.forEach(function(item) {
      html.push('<li>' + escapeHtml(item) + '</li>');
    });
    html.push('</ul>');
  }
  html.push('</div>');

  html.push('<div class="section"><h2>IV. NGUYÊN NHÂN CHẬM TIẾN ĐỘ CHỦ YẾU</h2>');
  if (!topLateCauses.length) {
    html.push('<div class="muted">Chưa có đủ dữ liệu nguyên nhân chậm tiến độ để tổng hợp.</div>');
  } else {
    html.push('<ul>');
    topLateCauses.forEach(function(item) {
      html.push('<li>' + escapeHtml(item.causeGroup) + ': ' + escapeHtml(formatNumberVi(item.count)) + ' lần</li>');
    });
    html.push('</ul>');
  }
  html.push('</div>');

  html.push('<div class="section"><h2>V. NỘI DUNG CẦN HOÀN THIỆN TRƯỚC KHI CHỐT THÁNG</h2>');
  if (!dossierItems.length) {
    html.push('<div class="muted">Hồ sơ quản trị tháng cơ bản đã đầy đủ.</div>');
  } else {
    html.push('<ul>');
    dossierItems.forEach(function(item) {
      html.push('<li>' + escapeHtml(item) + '</li>');
    });
    html.push('</ul>');
  }
  if ((backlogStats.taskCount || 0) > 0) {
    html.push('<div class="subhead">Tồn đọng chuyển tháng sau</div><ul>');
    html.push('<li>Số công việc dự kiến chuyển sang tháng sau: ' + escapeHtml(formatNumberVi(backlogStats.taskCount || 0)) + ' việc.</li>');
    if ((backlogStats.withRCACount || 0) > 0 && (backlogStats.topCauses || []).length) {
      html.push('<li>Nguyên nhân tồn đọng chủ yếu: ' + escapeHtml(backlogStats.topCauses.map(function(item) { return item.causeGroup + ' (' + formatNumberVi(item.count) + ' lần)'; }).join('; ')) + '.</li>');
    } else {
      html.push('<li>Nguyên nhân tồn đọng: chưa đủ dữ liệu nguyên nhân và giải pháp để tổng hợp.</li>');
    }
    (backlogStats.recommendedActions || []).forEach(function(item) {
      html.push('<li>' + escapeHtml(item) + '</li>');
    });
    html.push('</ul>');
  }
  html.push('</div>');

  if (recommendations.length) {
    html.push('<div class="section"><h2>VI. KIẾN NGHỊ ĐIỀU HÀNH CHUNG</h2><ul>');
    recommendations.forEach(function(item) {
      html.push('<li>' + escapeHtml(item) + '</li>');
    });
    html.push('</ul></div>');
  }

  html.push('<div class="btn-wrap"><button onclick="google.script.host.close()">Đóng</button></div>');
  html.push('</body></html>');
  return html.join('');
}

function calcMonthEndSummary(tasks, config) {
  var leafTasks = tasks || [];
  var lateTasks = leafTasks.filter(function(task) { return task.state === 'OVERDUE' || task.state === 'DONE_LATE'; });
  var completedTasks = leafTasks.filter(function(task) { return task.state === 'DONE' || task.state === 'DONE_LATE'; });
  var completedOnTimeCount = completedTasks.filter(function(task) {
    return task.actualDateDate && task.deadlineDate && task.actualDateDate.getTime() <= task.deadlineDate.getTime();
  }).length;
  var lateTasksWithRCACount = lateTasks.filter(function(task) { return !!normalizeText(task.rootCauseAction); }).length;
  var directionTaskCount = leafTasks.filter(function(task) { return !!normalizeText(task.managementDirection); }).length;
  var blankEvaluationCount = leafTasks.filter(function(task) { return !normalizeText(task.evaluation); }).length;
  var backlogTasks = leafTasks.filter(function(task) { return task.state !== 'DONE' && task.state !== 'DONE_LATE'; });
  var budgetComparable = leafTasks.filter(function(task) { return typeof task.plannedBudget === 'number' && typeof task.actualBudget === 'number'; });
  var plannedTotal = budgetComparable.reduce(function(sum, task) { return sum + task.plannedBudget; }, 0);
  var actualTotal = budgetComparable.reduce(function(sum, task) { return sum + task.actualBudget; }, 0);
  var budgetVarianceRate = plannedTotal > 0 ? (actualTotal - plannedTotal) / plannedTotal : null;
  var budgetControlScore = budgetVarianceRate === null ? 0 : Math.max(0, Math.min(1, 1 - Math.abs(budgetVarianceRate)));
  var monthlyCompletionRate = leafTasks.length ? completedTasks.length / leafTasks.length : 0;
  var onTimeCompletionRate = completedTasks.length ? completedOnTimeCount / completedTasks.length : 0;
  var lateTasksWithRCARate = lateTasks.length ? lateTasksWithRCACount / lateTasks.length : 0;
  var managementDirectionCoverageRate = leafTasks.length ? directionTaskCount / leafTasks.length : 0;
  var blankEvaluationRate = leafTasks.length ? blankEvaluationCount / leafTasks.length : 0;
  var compositeScore = ((monthlyCompletionRate * 0.4) + (onTimeCompletionRate * 0.3) + (budgetControlScore * 0.2) + (lateTasksWithRCARate * 0.1)) * 100;

  var level = 'ỔN ĐỊNH';
  if (compositeScore < config.LOW_COMPOSITE_SCORE_THRESHOLD || lateTasksWithRCARate < config.LOW_RCA_RATE_THRESHOLD || onTimeCompletionRate < config.LOW_ON_TIME_THRESHOLD) {
    level = 'CẦN CAN THIỆP NGAY';
  } else if (compositeScore < config.MONITOR_COMPOSITE_SCORE_THRESHOLD || blankEvaluationRate >= config.HIGH_BLANK_EVALUATION_RATE_THRESHOLD || directionTaskCount >= config.HIGH_MANAGEMENT_DIRECTION_TASK_COUNT_THRESHOLD) {
    level = 'CẦN THEO DÕI';
  }

  return {
    compositeScore: roundNumber_(compositeScore, 1),
    monthlyCompletionRate: monthlyCompletionRate,
    onTimeCompletionRate: onTimeCompletionRate,
    totalPlannedBudget: plannedTotal,
    totalActualBudget: actualTotal,
    budgetVarianceRate: budgetVarianceRate,
    budgetControlScore: budgetControlScore,
    completedTaskCount: completedTasks.length,
    lateTaskCount: lateTasks.length,
    backlogTransferCount: backlogTasks.length,
    backlogTransferRate: leafTasks.length ? backlogTasks.length / leafTasks.length : 0,
    lateTasksWithRCARate: lateTasksWithRCARate,
    lateTasksWithoutRCACount: Math.max(lateTasks.length - lateTasksWithRCACount, 0),
    managementDirectionCoverageRate: managementDirectionCoverageRate,
    managementDirectionTaskCount: directionTaskCount,
    blankEvaluationCount: blankEvaluationCount,
    blankEvaluationRate: blankEvaluationRate,
    reportInterventionLevel: level
  };
}
function calcOwnerStats(tasks, config) {
  var groups = {};
  (tasks || []).forEach(function(task) {
    var owner = task.ownerPrimary || 'unassigned';
    if (!groups[owner]) {
      groups[owner] = [];
    }
    groups[owner].push(task);
  });

  return Object.keys(groups).map(function(owner) {
    var items = groups[owner];
    var lateTasks = items.filter(function(task) { return task.state === 'OVERDUE' || task.state === 'DONE_LATE'; });
    var completedTasks = items.filter(function(task) { return task.state === 'DONE' || task.state === 'DONE_LATE'; });
    var completedOnTimeCount = completedTasks.filter(function(task) {
      return task.actualDateDate && task.deadlineDate && task.actualDateDate.getTime() <= task.deadlineDate.getTime();
    }).length;
    var lateTasksWithRCARate = lateTasks.length ? lateTasks.filter(function(task) { return !!normalizeText(task.rootCauseAction); }).length / lateTasks.length : 0;
    var directionCount = items.filter(function(task) { return !!normalizeText(task.managementDirection); }).length;
    var blankEvaluationRate = items.length ? items.filter(function(task) { return !normalizeText(task.evaluation); }).length / items.length : 0;
    var budgetComparable = items.filter(function(task) { return typeof task.plannedBudget === 'number' && typeof task.actualBudget === 'number'; });
    var plannedTotal = budgetComparable.reduce(function(sum, task) { return sum + task.plannedBudget; }, 0);
    var actualTotal = budgetComparable.reduce(function(sum, task) { return sum + task.actualBudget; }, 0);
    var budgetVarianceRate = plannedTotal > 0 ? (actualTotal - plannedTotal) / plannedTotal : null;
    var budgetControlScore = budgetVarianceRate === null ? 0 : Math.max(0, Math.min(1, 1 - Math.abs(budgetVarianceRate)));
    var completedRate = items.length ? completedTasks.length / items.length : 0;
    var onTimeRate = completedTasks.length ? completedOnTimeCount / completedTasks.length : 0;
    var compositeScore = ((completedRate * 0.4) + (onTimeRate * 0.3) + (budgetControlScore * 0.2) + (lateTasksWithRCARate * 0.1)) * 100;

    return {
      ownerPrimary: owner,
      taskCount: items.length,
      completedRate: completedRate,
      onTimeRate: onTimeRate,
      lateTaskCount: lateTasks.length,
      lateTasksWithRCARate: lateTasksWithRCARate,
      managementDirectionTaskCount: directionCount,
      blankEvaluationRate: blankEvaluationRate,
      compositeScore: roundNumber_(compositeScore, 1)
    };
  }).sort(function(a, b) {
    if (b.lateTaskCount !== a.lateTaskCount) {
      return b.lateTaskCount - a.lateTaskCount;
    }
    if (b.blankEvaluationRate !== a.blankEvaluationRate) {
      return b.blankEvaluationRate - a.blankEvaluationRate;
    }
    return a.compositeScore - b.compositeScore;
  });
}

function calcProjectStats(tasks, config) {
  return calcMenu5BucketStats_(tasks, function(task) {
    return task.projectBucket || 'Công ty';
  });
}

function calcTaskGroupStats(tasks, config) {
  return calcMenu5BucketStats_(tasks, function(task) {
    return task.taskGroupBucket || 'Chưa phân nhóm nhiệm vụ';
  });
}

function calcArisingStats(tasks, config) {
  var arisingTasks = (tasks || []).filter(function(task) { return !!task.isArising; });
  var completedCount = arisingTasks.filter(function(task) {
    return task.state === 'DONE' || task.state === 'DONE_LATE';
  }).length;
  return {
    taskCount: arisingTasks.length,
    completedTaskCount: completedCount,
    completionRate: arisingTasks.length ? completedCount / arisingTasks.length : 0,
    pendingTaskCount: Math.max(arisingTasks.length - completedCount, 0)
  };
}

function calcMenu5BacklogStats_(tasks, config) {
  var backlogTasks = (tasks || []).filter(function(task) {
    return task.state !== 'DONE' && task.state !== 'DONE_LATE';
  });
  var withRCATasks = backlogTasks.filter(function(task) {
    return !!normalizeText(task.rootCauseAction);
  });
  var causeCounter = {};
  withRCATasks.forEach(function(task) {
    var cause = classifyLateCause(task.rootCauseAction);
    causeCounter[cause] = (causeCounter[cause] || 0) + 1;
  });
  var topCauses = Object.keys(causeCounter).map(function(key) {
    return { causeGroup: key, count: causeCounter[key] };
  }).sort(function(a, b) {
    if (b.count !== a.count) return b.count - a.count;
    return a.causeGroup.localeCompare(b.causeGroup);
  }).slice(0, 3);

  var recommendedActions = [];
  if (backlogTasks.some(function(task) { return task.state === 'OVERDUE'; })) {
    recommendedActions.push('Đề nghị chốt lại mốc hoàn thành và biện pháp xử lý đối với các công việc đang quá hạn.');
  }
  if (backlogTasks.some(function(task) { return !normalizeText(task.rootCauseAction); })) {
    recommendedActions.push('Đề nghị bổ sung nguyên nhân và giải pháp đối với các công việc dự kiến chuyển sang tháng sau.');
  }
  if (backlogTasks.some(function(task) { return task.priorityNormalized === 'urgent' || task.priorityNormalized === 'high'; })) {
    recommendedActions.push('Kiến nghị ưu tiên nguồn lực cho các công việc tồn đọng có mức ưu tiên cao.');
  }
  if (!recommendedActions.length && backlogTasks.length) {
    recommendedActions.push('Đề nghị rà soát khối lượng công việc tồn đọng để điều chỉnh kế hoạch tháng sau.');
  }

  return {
    taskCount: backlogTasks.length,
    withRCACount: withRCATasks.length,
    topCauses: topCauses,
    recommendedActions: recommendedActions.slice(0, 3)
  };
}

function calcMenu5BucketStats_(tasks, bucketResolver) {
  var groups = {};
  (tasks || []).forEach(function(task) {
    var key = normalizeText(bucketResolver(task)) || 'Chưa xác định';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(task);
  });

  return Object.keys(groups).map(function(key) {
    var items = groups[key];
    var completedTasks = items.filter(function(task) {
      return task.state === 'DONE' || task.state === 'DONE_LATE';
    });
    var completedOnTimeCount = completedTasks.filter(function(task) {
      return task.actualDateDate && task.deadlineDate && task.actualDateDate.getTime() <= task.deadlineDate.getTime();
    }).length;
    var lateTaskCount = items.filter(function(task) {
      return task.state === 'OVERDUE' || task.state === 'DONE_LATE';
    }).length;
    var blankEvaluationRate = items.length ? items.filter(function(task) {
      return !normalizeText(task.evaluation);
    }).length / items.length : 0;

    return {
      name: key,
      taskCount: items.length,
      completedRate: items.length ? completedTasks.length / items.length : 0,
      onTimeRate: completedTasks.length ? completedOnTimeCount / completedTasks.length : 0,
      lateTaskCount: lateTaskCount,
      blankEvaluationRate: blankEvaluationRate
    };
  }).sort(function(a, b) {
    if (b.completedRate !== a.completedRate) return b.completedRate - a.completedRate;
    if (b.onTimeRate !== a.onTimeRate) return b.onTimeRate - a.onTimeRate;
    if (a.lateTaskCount !== b.lateTaskCount) return a.lateTaskCount - b.lateTaskCount;
    return a.name.localeCompare(b.name);
  });
}

function classifyLateCause(rootCauseAction) {
  var text = loaiBoDauTiengViet_(normalizeText(rootCauseAction).toLowerCase());
  if (!text) return 'nguyên nhân khác';
  if (/(cho duyet|phe duyet|xin y kien|trinh ky)/.test(text)) return 'chờ phê duyệt';
  if (/(thieu du lieu|chua co du lieu|bo sung ho so|ho so chua day du)/.test(text)) return 'thiếu dữ liệu';
  if (/(cham phoi hop|phoi hop cham|cho phan hoi|chua phoi hop)/.test(text)) return 'chậm phối hợp';
  if (/(thieu nhan su|thieu nguon luc|qua tai|khong du nguoi)/.test(text)) return 'thiếu nhân sự';
  if (/(thay doi pham vi|dieu chinh noi dung|thay doi yeu cau)/.test(text)) return 'thay đổi phạm vi';
  if (/(loi ky thuat|su co he thong|loi he thong|truc trac ky thuat)/.test(text)) return 'lỗi kỹ thuật';
  if (/(phu thuoc|ben ngoai|doi tac|co quan khac|lien nganh)/.test(text)) return 'phụ thuộc bên ngoài';
  return 'nguyên nhân khác';
}

function buildTopLateCauses(tasks, config) {
  var counter = {};
  (tasks || []).forEach(function(task) {
    if ((task.state === 'OVERDUE' || task.state === 'DONE_LATE') && normalizeText(task.rootCauseAction)) {
      var group = classifyLateCause(task.rootCauseAction);
      counter[group] = (counter[group] || 0) + 1;
    }
  });
  return Object.keys(counter).map(function(key) {
    return { causeGroup: key, count: counter[key] };
  }).sort(function(a, b) {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.causeGroup.localeCompare(b.causeGroup);
  }).slice(0, 5);
}

function calcManagerMonthEndRiskScore(task, config) {
  var overduePenalty = task.state === 'OVERDUE' ? 1 : (task.state === 'DONE_LATE' ? 0.7 : 0);
  var missingRCAPenalty = (task.state === 'OVERDUE' || task.state === 'DONE_LATE') && !normalizeText(task.rootCauseAction) ? 1 : 0;
  var missingEvaluationPenalty = !normalizeText(task.evaluation) ? 0.5 : 0;
  var directionFlag = normalizeText(task.managementDirection) ? 0.3 : 0;
  return roundNumber_((overduePenalty * 0.45) + (missingRCAPenalty * 0.30) + (missingEvaluationPenalty * 0.15) + (directionFlag * 0.10), 3);
}

function resolveMonthEndInterventionLevel(task, summary, config) {
  if (task.state === 'OVERDUE' || (task.state === 'DONE_LATE' && !normalizeText(task.rootCauseAction)) || !!normalizeText(task.managementDirection) || task.managerMonthEndRiskScore >= config.HIGH_RISK_SCORE) {
    return 'CẦN CAN THIỆP NGAY';
  }
  if (task.state === 'DONE_LATE' || !normalizeText(task.evaluation) || task.managerMonthEndRiskScore >= config.MONITOR_RISK_SCORE) {
    return 'CẦN THEO DÕI';
  }
  return 'ỔN ĐỊNH';
}

function buildMonthEndSuggestedAction(task, config) {
  if (task.state === 'OVERDUE') return 'Đề nghị rà soát ngay nguyên nhân chậm tiến độ và biện pháp xử lý dứt điểm.';
  if (task.state === 'DONE_LATE' && !normalizeText(task.rootCauseAction)) return 'Đề nghị bổ sung nguyên nhân và giải pháp để hoàn thiện hồ sơ đánh giá.';
  if (normalizeText(task.managementDirection)) return 'Kiến nghị trưởng phòng xem xét nội dung đã có ý kiến chỉ đạo để theo dõi kết quả thực hiện.';
  if (!normalizeText(task.evaluation)) return 'Đề nghị bổ sung nội dung đánh giá trước khi chốt báo cáo tháng.';
  if (task.state === 'DONE_LATE') return 'Đề nghị rà soát nguyên nhân chậm và rút kinh nghiệm trong tổ chức thực hiện.';
  return 'Tạm thời tiếp tục theo dõi, chưa cần xử lý bổ sung.';
}

function buildTopRiskTasks(tasks, config) {
  var interventionOrder = {'CẦN CAN THIỆP NGAY': 0, 'CẦN THEO DÕI': 1, 'ỔN ĐỊNH': 2};
  var stateOrder = {OVERDUE: 0, DONE_LATE: 1, IN_PROGRESS: 2, NOT_STARTED: 3, DONE: 4};
  var priorityOrder = {urgent: 0, high: 1, medium: 2, low: 3, unknown: 4};

  return (tasks || [])
    .filter(function(task) { return task.interventionLevel !== 'ỔN ĐỊNH'; })
    .sort(function(a, b) {
      var levelDiff = (interventionOrder[a.interventionLevel] || 9) - (interventionOrder[b.interventionLevel] || 9);
      if (levelDiff !== 0) return levelDiff;
      if (b.managerMonthEndRiskScore !== a.managerMonthEndRiskScore) return b.managerMonthEndRiskScore - a.managerMonthEndRiskScore;
      var stateDiff = (stateOrder[a.state] || 9) - (stateOrder[b.state] || 9);
      if (stateDiff !== 0) return stateDiff;
      return (priorityOrder[a.priorityNormalized] || 9) - (priorityOrder[b.priorityNormalized] || 9);
    })
    .slice(0, Number(config.POPUP_TOP_N || 5))
    .map(function(task) {
      return {
        rowIndex: task.rowIndex,
        taskIndex: task.taskIndex || null,
        parentIndex: task.parentIndex || null,
        level: task.level,
        isParent: !!task.isParent,
        isLeaf: !!task.isLeaf,
        taskName: task.taskName || null,
        ownerPrimary: task.ownerPrimary || null,
        priority: task.priority || null,
        deadline: task.deadline || null,
        actualDate: task.actualDate || null,
        state: task.state || null,
        rootCauseAction: task.rootCauseAction || null,
        managementDirection: task.managementDirection || null,
        evaluation: task.evaluation || null,
        managerMonthEndRiskScore: task.managerMonthEndRiskScore,
        interventionLevel: task.interventionLevel,
        suggestedAction: task.suggestedAction
      };
    });
}
function buildMenu5Alerts(summary, topRiskTasks, topLateCauses, config) {
  var alerts = [];
  (topRiskTasks || []).forEach(function(task) {
    if (task.state === 'OVERDUE') {
      alerts.push({level: 'CẦN CAN THIỆP NGAY', type: 'OVERDUE_TASK', message: 'Đề nghị rà soát ngay công việc quá hạn chưa hoàn thành.', taskName: task.taskName || null, ownerPrimary: formatOwnerViMenu5_(task.ownerPrimary)});
    }
    if (task.state === 'DONE_LATE' && !normalizeText(task.rootCauseAction)) {
      alerts.push({level: 'CẦN THEO DÕI', type: 'DONE_LATE_MISSING_RCA', message: 'Đề nghị bổ sung nguyên nhân và giải pháp đối với công việc hoàn thành trễ.', taskName: task.taskName || null, ownerPrimary: formatOwnerViMenu5_(task.ownerPrimary)});
    }
    if (normalizeText(task.managementDirection)) {
      alerts.push({level: 'CẦN THEO DÕI', type: 'HAS_MANAGEMENT_DIRECTION', message: 'Công việc có ý kiến chỉ đạo của lãnh đạo, cần theo dõi kết quả thực hiện.', taskName: task.taskName || null, ownerPrimary: formatOwnerViMenu5_(task.ownerPrimary)});
    }
  });
  if ((summary.lateTasksWithRCARate || 0) < config.LOW_RCA_RATE_THRESHOLD) {
    alerts.push({level: 'CẦN CAN THIỆP NGAY', type: 'LOW_RCA_RATE', message: 'Tỷ lệ công việc trễ có nguyên nhân và giải pháp còn thấp, đề nghị rà soát hồ sơ đánh giá.', taskName: null, ownerPrimary: null});
  }
  if ((summary.compositeScore || 0) < config.LOW_COMPOSITE_SCORE_THRESHOLD) {
    alerts.push({level: 'CẦN CAN THIỆP NGAY', type: 'LOW_COMPOSITE_SCORE', message: 'Điểm hiệu suất tháng thấp, cần rà soát tổng thể kết quả thực hiện.', taskName: null, ownerPrimary: null});
  }
  if ((summary.onTimeCompletionRate || 0) < config.LOW_ON_TIME_THRESHOLD) {
    alerts.push({level: 'CẦN THEO DÕI', type: 'LOW_ON_TIME_RATE', message: 'Tỷ lệ hoàn thành đúng hạn còn thấp, đề nghị kiểm tra lại tiến độ các công việc trọng tâm.', taskName: null, ownerPrimary: null});
  }
  if ((summary.blankEvaluationRate || 0) >= config.HIGH_BLANK_EVALUATION_RATE_THRESHOLD) {
    alerts.push({level: 'CẦN THEO DÕI', type: 'HIGH_BLANK_EVALUATION_RATE', message: 'Tỷ lệ đánh giá trống còn cao, đề nghị bổ sung trước khi chốt báo cáo tháng.', taskName: null, ownerPrimary: null});
  }
  return alerts;
}

function buildExecutiveRecommendations(reportData, config) {
  var recommendations = [];
  var summary = reportData.summary || {};
  var topLateCauses = reportData.topLateCauses || [];
  var ownerAttention = getMenu5OwnerAttentionItems_(reportData.ownerStats || []);
  var backlogStats = reportData.backlogStats || {};
  var level = summary.reportInterventionLevel || 'ỔN ĐỊNH';

  if ((summary.compositeScore || 0) < config.LOW_COMPOSITE_SCORE_THRESHOLD) recommendations.push('Kiến nghị rà soát toàn bộ kết quả thực hiện tháng do điểm hiệu suất chung đang ở mức thấp.');
  if ((summary.onTimeCompletionRate || 0) < config.LOW_ON_TIME_THRESHOLD) recommendations.push('Cần tập trung kiểm soát các công việc hoàn thành trễ để cải thiện tỷ lệ đúng hạn.');
  if (summary.budgetVarianceRate !== null && Math.abs(summary.budgetVarianceRate) > 0.1) recommendations.push('Kiến nghị rà soát chênh lệch ngân sách kế hoạch và thực hiện đối với các hạng mục có biến động lớn.');
  if ((summary.managementDirectionTaskCount || 0) > 0) recommendations.push('Kiến nghị trưởng phòng xem xét các công việc đã có ý kiến chỉ đạo để theo dõi việc thực hiện kết luận.');
  if (topLateCauses.length) recommendations.push('Đề nghị tập trung xử lý nhóm nguyên nhân chậm tiến độ phát sinh nhiều nhất trong tháng.');
  if (ownerAttention.length) recommendations.push('Cần rà soát phân công và theo dõi kết quả thực hiện của các nhân sự đang có nhiều việc trễ hoặc nhiều hồ sơ chưa hoàn thiện.');
  if ((backlogStats.taskCount || 0) > 0) recommendations.push('Đề nghị chốt danh sách ' + formatNumberVi(backlogStats.taskCount) + ' công việc tồn đọng chuyển sang tháng sau kèm nguyên nhân và mốc xử lý cụ thể.');
  if (level === 'CẦN CAN THIỆP NGAY') recommendations.unshift('Kết quả tháng hiện ở mức cần can thiệp ngay, đề nghị tập trung xử lý các nội dung trọng tâm trước khi chốt báo cáo.');
  if (level === 'CẦN THEO DÕI') recommendations.unshift('Kết quả tháng phát sinh nội dung cần tiếp tục theo dõi và rà soát trước khi chốt báo cáo.');
  if (!recommendations.length) recommendations.push('Kết quả thực hiện tháng cơ bản ổn định, đề nghị tiếp tục duy trì nhịp theo dõi và hoàn thiện hồ sơ đánh giá.');
  return recommendations.slice(0, 5);
}

function cloneMenu5Config_() {
  return JSON.parse(JSON.stringify(MENU_5_MONTH_END_CONFIG_));
}

function taoKetQuaMenu5Rong_(sheetName, reportDate, totalRowsRead) {
  return {
    meta: {sheetName: sheetName, reportDate: formatDateOutput_(reportDate), totalRowsRead: totalRowsRead || 0, taskRowCount: 0, groupRowCount: 0, emptyRowCount: 0, invalidRowCount: 0, leafTaskCount: 0, projectCount: 0, taskGroupCount: 0},
    summary: {compositeScore: 0, monthlyCompletionRate: 0, onTimeCompletionRate: 0, totalPlannedBudget: 0, totalActualBudget: 0, budgetVarianceRate: null, budgetControlScore: 0, completedTaskCount: 0, lateTaskCount: 0, backlogTransferCount: 0, backlogTransferRate: 0, lateTasksWithRCARate: 0, lateTasksWithoutRCACount: 0, managementDirectionCoverageRate: 0, managementDirectionTaskCount: 0, blankEvaluationCount: 0, blankEvaluationRate: 0, reportInterventionLevel: 'ỔN ĐỊNH'},
    ownerStats: [], projectStats: [], taskGroupStats: [], arisingStats: {taskCount: 0, completedTaskCount: 0, completionRate: 0, pendingTaskCount: 0}, backlogStats: {taskCount: 0, withRCACount: 0, topCauses: [], recommendedActions: []}, topLateCauses: [], topRiskTasks: [], alerts: [], popupHtml: '', logs: {warnings: [], errors: []}
  };
}

function detectRowTypeMenu5_(rawRow, normalizedRow) {
  if (isMenu1EmptyRow_(rawRow, normalizedRow)) return 'EMPTY';
  if (normalizedRow.isGroupRow === true) return 'GROUP';
  var laGroup = !!normalizedRow.taskName && !normalizedRow.ownerPrimary && !normalizedRow.deadlineDate && normalizedRow.percentCompleteNormalized === null && !normalizedRow.actualDateDate;
  if (laGroup) return 'GROUP';
  var laTask = !!normalizedRow.taskName && (!!normalizedRow.deadlineDate || normalizedRow.percentCompleteNormalized !== null || !!normalizedRow.ownerPrimary);
  if (laTask) return 'TASK';
  return 'INVALID';
}

function laDongTongMenu5_(taskIndex) {
  return taskIndex === '∑' || taskIndex === 'Σ';
}

function findMenu5ArisingSection_(dataDisplayValues, headerRow) {
  var startRow = null;
  var endRow = null;
  for (var i = 0; i < (dataDisplayValues || []).length; i++) {
    var rowIndex = headerRow + 1 + i;
    var colA = normalizeText(dataDisplayValues[i][0]);
    var colB = normalizeText(dataDisplayValues[i][1]);
    if (colB === 'Công tác phát sinh khác trong kỳ') {
      startRow = rowIndex;
      continue;
    }
    if (startRow && (colA === '∑' || colA === 'Σ')) {
      endRow = rowIndex;
      break;
    }
  }
  return {
    startRow: startRow,
    endRow: endRow
  };
}

function isTaskInMenu5ArisingSection_(rowIndex, sectionInfo) {
  if (!sectionInfo || !sectionInfo.startRow) {
    return false;
  }
  var endRow = sectionInfo.endRow || Number.MAX_SAFE_INTEGER;
  return rowIndex > sectionInfo.startRow && rowIndex < endRow;
}

function buildMenu5HierarchyAlerts_(tasks) {
  var alerts = [];
  (tasks || []).forEach(function(task) {
    if (task.sttWarning) {
      alerts.push({level: 'CẦN THEO DÕI', type: 'TASK_INDEX_STRUCTURE_WARNING', message: 'Đề nghị rà soát cấu trúc STT để bảo đảm quan hệ cha - con rõ ràng.', taskName: task.taskName || null, ownerPrimary: formatOwnerViMenu5_(task.ownerPrimary)});
    }
  });
  return alerts;
}

function formatOwnerViMenu5_(owner) {
  return owner && owner !== 'unassigned' ? owner : 'Chưa phân công';
}

function formatStateViMenu5_(state) {
  var map = {DONE: 'Hoàn thành', DONE_LATE: 'Hoàn thành trễ', OVERDUE: 'Quá hạn', IN_PROGRESS: 'Đang thực hiện', NOT_STARTED: 'Chưa bắt đầu'};
  return map[state] || 'Chưa xác định';
}

function buildMenu5ExecutiveConclusion_(reportData) {
  var summary = reportData.summary || {};
  var ownerAttention = getMenu5OwnerAttentionItems_(reportData.ownerStats || []);
  var projectStats = reportData.projectStats || [];
  var arisingStats = reportData.arisingStats || {};
  var backlogStats = reportData.backlogStats || {};
  var conclusions = [];
  conclusions.push(buildMenu5ExecutiveLead_(summary.reportInterventionLevel || 'ỔN ĐỊNH'));
  conclusions.push('Trong tháng theo dõi ' + formatNumberVi(projectStats.length) + ' dự án/nhóm việc cấp công ty; tỷ lệ hoàn thành chung đạt ' + formatPercentVi(summary.monthlyCompletionRate) + ', trong đó đúng hạn ' + formatPercentVi(summary.onTimeCompletionRate) + '.');
  if (summary.budgetVarianceRate === null) {
    conclusions.push('Ngân sách: chưa đủ dữ liệu để đánh giá đầy đủ chênh lệch kế hoạch và thực hiện trong tháng.');
  } else {
    conclusions.push('Ngân sách: thực hiện ' + formatNumberVi(summary.totalActualBudget || 0) + ' đồng trên kế hoạch ' + formatNumberVi(summary.totalPlannedBudget || 0) + ' đồng; chênh lệch ' + formatPercentVi(summary.budgetVarianceRate) + '.');
  }
  if (ownerAttention.length) {
    conclusions.push('Con người: cần ưu tiên rà soát ' + formatOwnerViMenu5_(ownerAttention[0].ownerPrimary) + ' do có nhiều việc trễ hoặc tỷ lệ hồ sơ chưa hoàn thiện còn cao.');
  } else {
    conclusions.push('Con người: chưa phát sinh nhân sự cần ưu tiên rà soát riêng theo tiêu chí tổng kết tháng.');
  }
  if ((arisingStats.taskCount || 0) > 0) {
    conclusions.push('Công việc phát sinh trong kỳ: ' + formatNumberVi(arisingStats.taskCount) + ' việc; đã hoàn thành ' + formatNumberVi(arisingStats.completedTaskCount || 0) + ' việc, đạt ' + formatPercentVi(arisingStats.completionRate) + '.');
  }
  if ((backlogStats.taskCount || 0) > 0) {
    conclusions.push('Tồn đọng chuyển tháng sau: ' + formatNumberVi(backlogStats.taskCount) + ' việc; cần rà soát nguyên nhân và phương án xử lý trước khi chốt báo cáo.');
  }
  return conclusions;
}

function buildMenu5ExecutiveLead_(level) {
  if (level === 'CẦN CAN THIỆP NGAY') {
    return 'Mức độ chung của tháng: CẦN CAN THIỆP NGAY; cần tập trung xử lý các nội dung trọng tâm trước khi chốt báo cáo.';
  }
  if (level === 'CẦN THEO DÕI') {
    return 'Mức độ chung của tháng: CẦN THEO DÕI; đề nghị tiếp tục rà soát các nội dung còn vướng trước khi chốt báo cáo.';
  }
  return 'Mức độ chung của tháng: ỔN ĐỊNH; kết quả thực hiện cơ bản bám kế hoạch, tiếp tục hoàn thiện hồ sơ quản trị.';
}

function getMenu5OwnerAttentionItems_(ownerStats) {
  return (ownerStats || []).filter(function(item) {
    return item.lateTaskCount > 0 || item.blankEvaluationRate > 0 || item.managementDirectionTaskCount > 0;
  }).slice().sort(function(a, b) {
    if (b.lateTaskCount !== a.lateTaskCount) return b.lateTaskCount - a.lateTaskCount;
    if (b.blankEvaluationRate !== a.blankEvaluationRate) return b.blankEvaluationRate - a.blankEvaluationRate;
    return a.compositeScore - b.compositeScore;
  }).slice(0, 3);
}

function getMenu5DossierItems_(reportData) {
  var summary = reportData.summary || {};
  var items = [];
  if ((summary.lateTasksWithoutRCACount || 0) > 0) items.push('Đề nghị bổ sung nguyên nhân và giải pháp cho ' + formatNumberVi(summary.lateTasksWithoutRCACount) + ' công việc trễ hạn hoặc hoàn thành trễ.');
  if ((summary.blankEvaluationCount || 0) > 0) items.push('Đề nghị hoàn thiện nội dung đánh giá đối với ' + formatNumberVi(summary.blankEvaluationCount) + ' công việc chưa có nhận xét kết quả.');
  if ((summary.managementDirectionTaskCount || 0) > 0) items.push('Đề nghị rà soát việc cập nhật kết quả thực hiện đối với ' + formatNumberVi(summary.managementDirectionTaskCount) + ' công việc đã có ý kiến chỉ đạo.');
  return items.slice(0, 4);
}

function getMenu5BestWorstStat_(stats, metricKey) {
  var items = (stats || []).filter(function(item) {
    return typeof item[metricKey] === 'number';
  });
  if (!items.length) {
    return { best: null, worst: null };
  }
  var sorted = items.slice().sort(function(a, b) {
    if (b[metricKey] !== a[metricKey]) return b[metricKey] - a[metricKey];
    if ((b.onTimeRate || 0) !== (a.onTimeRate || 0)) return (b.onTimeRate || 0) - (a.onTimeRate || 0);
    if ((a.lateTaskCount || 0) !== (b.lateTaskCount || 0)) return (a.lateTaskCount || 0) - (b.lateTaskCount || 0);
    return String(a.name || a.ownerPrimary || '').localeCompare(String(b.name || b.ownerPrimary || ''));
  });
  return {
    best: sorted[0] || null,
    worst: sorted[sorted.length - 1] || null
  };
}

function buildMenu5ManagementFocus_(reportData) {
  var items = [];
  var summary = reportData.summary || {};
  var ownerAttention = getMenu5OwnerAttentionItems_(reportData.ownerStats || []);
  var projectBestWorst = getMenu5BestWorstStat_(reportData.projectStats || [], 'completedRate');
  var backlogStats = reportData.backlogStats || {};

  if ((summary.lateTaskCount || 0) > 0) {
    items.push('Có ' + formatNumberVi(summary.lateTaskCount) + ' công việc trễ hạn hoặc hoàn thành trễ; cần tập trung xử lý dứt điểm các đầu việc còn vướng.');
  }
  if (projectBestWorst.worst) {
    items.push('Dự án/đầu việc có kết quả thấp nhất hiện tại là ' + projectBestWorst.worst.name + ' với tỷ lệ hoàn thành ' + formatPercentVi(projectBestWorst.worst.completedRate) + '.');
  }
  if (ownerAttention.length) {
    var others = ownerAttention.slice(1).map(function(item) { return formatOwnerViMenu5_(item.ownerPrimary); }).filter(Boolean);
    items.push(
      others.length
        ? 'Nhân sự cần ưu tiên rà soát hiện tại là ' + formatOwnerViMenu5_(ownerAttention[0].ownerPrimary) + '; theo dõi thêm ' + others.join(', ') + '.'
        : 'Nhân sự cần ưu tiên rà soát hiện tại là ' + formatOwnerViMenu5_(ownerAttention[0].ownerPrimary) + '.'
    );
  }
  if ((summary.lateTasksWithRCARate || 0) < MENU_5_MONTH_END_CONFIG_.LOW_RCA_RATE_THRESHOLD) {
    items.push('Tỷ lệ công việc trễ có nguyên nhân và giải pháp còn thấp; cần bổ sung hồ sơ giải trình trước khi chốt tháng.');
  }
  if ((backlogStats.taskCount || 0) > 0) {
    items.push('Khối lượng tồn đọng dự kiến chuyển sang tháng sau là ' + formatNumberVi(backlogStats.taskCount) + ' việc; cần chốt nguyên nhân và mốc xử lý cho từng việc.');
  }
  return items.slice(0, 5);
}
