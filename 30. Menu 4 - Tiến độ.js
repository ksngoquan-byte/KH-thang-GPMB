var MENU_4_PROGRESS_CONFIG_ = {
  SHEET_NAME: '',
  HEADER_ROW: 4,
  TEST_MODE: false,
  REPORT_DATE: null,
  POPUP_TOP_N: 5,
  HIGH_RISK_SCORE: 0.75,
  MONITOR_RISK_SCORE: 0.4,
  HIGH_OVERDUE_DAYS: 7,
  OVERDUE_DAY_CAP: 14,
  LOW_PROGRESS_THRESHOLD: 40,
  HIGH_BACKLOG_COUNT_THRESHOLD: 5,
  LOW_ON_TIME_THRESHOLD: 0.6,
  REPORT_HIGH_FORECAST_THRESHOLD: 0.7,
  REPORT_MONITOR_FORECAST_THRESHOLD: 0.85,
  NEAR_DEADLINE_DAYS: 3,
  HIGH_IN_PROGRESS_RATE: 0.6,
  HIGH_NOT_STARTED_RATE: 0.3
};

function getMenu4ProgressReport() {
  try {
    var config = cloneMenu4Config_();
    var ss = layBangTinhDangMo_();
    var sheet = laySheetMenu1_(ss, config);
    var reportDate = resolveMenu1ReportDate_(config.REPORT_DATE);
    var headerRow = Number(config.HEADER_ROW || 4);
    var monthRange = getMonthRange(reportDate);

    config._resolvedReportDate = reportDate;
    config._monthRange = monthRange;

    validateMenu1Input_(sheet, headerRow, reportDate);

    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    var totalRowsRead = Math.max(lastRow - headerRow, 0);
    var reportData = taoKetQuaMenu4Rong_(sheet.getName(), reportDate, monthRange, totalRowsRead);

    if (totalRowsRead <= 0 || lastColumn <= 0) {
      reportData.executiveRecommendations = buildMenu4ExecutiveRecommendations_(reportData, config);
      reportData.popupHtml = buildMenu4PopupHtml(reportData);
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
      task.rowType = detectRowTypeMenu4_(rawRow, task);
      task.state = resolveTaskState(task, reportDate);
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

      if (task.rowType === 'GROUP' || laDongTongMenu4_(task.taskIndex)) {
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
      task.sttWarning = taskIndexInfo.warning || null;
      task.overdueDays = calcOverdueDays(task.deadlineDate, reportDate);
      task.completionScorePerTask = null;
      task.managerProgressRiskScore = 0;
      task.interventionLevel = 'ỔN ĐỊNH';
      task.suggestedAction = '';

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

    var summary = calcProgressSummary(validLeafTasks, config);
    reportData.summary = summary;

    validLeafTasks.forEach(function(task) {
      task.completionScorePerTask = calcCompletionScore(task, config);
      task.managerProgressRiskScore = calcManagerProgressRiskScore(task, config);
      task.interventionLevel = resolveProgressInterventionLevel(task, summary, config);
      task.suggestedAction = buildProgressSuggestedAction(task, config);
    });

    reportData.topRiskTasks = buildMenu4TopRiskTasks_(validLeafTasks, config);
    reportData.alerts = buildMenu4Alerts(summary, reportData.topRiskTasks, config)
      .concat(buildMenu4HierarchyAlerts_(validTasks));
    reportData.executiveRecommendations = buildMenu4ExecutiveRecommendations_(reportData, config);
    reportData.popupHtml = buildMenu4PopupHtml(reportData);

    Logger.log('Menu 4 - Tổng số dòng đọc được: %s', reportData.meta.totalRowsRead);
    Logger.log('Menu 4 - Số dòng TASK hợp lệ: %s', reportData.meta.taskRowCount);
    Logger.log('Menu 4 - Số dòng GROUP: %s', reportData.meta.groupRowCount);
    Logger.log('Menu 4 - Số dòng INVALID: %s', reportData.meta.invalidRowCount);
    Logger.log('Menu 4 - Số task lá: %s', reportData.meta.leafTaskCount);
    Logger.log('Menu 4 - Tỷ lệ hoàn thành tháng: %s', formatPercentVi(reportData.summary.monthlyCompletionRate));
    Logger.log('Menu 4 - Dự báo hoàn thành cuối tháng: %s', formatPercentVi(reportData.summary.forecastCompletionRate));

    return reportData;
  } catch (error) {
    Logger.log('Lỗi getMenu4ProgressReport: %s', error.stack || error);
    throw error;
  }
}

function showMenu4ProgressPopup() {
  try {
    var reportData = getMenu4ProgressReport();
    var html = HtmlService.createHtmlOutput(reportData.popupHtml)
      .setWidth(760)
      .setHeight(640);
    SpreadsheetApp.getUi().showModalDialog(html, 'Báo cáo tiến độ tháng');
    return reportData;
  } catch (error) {
    Logger.log('Lỗi showMenu4ProgressPopup: %s', error.stack || error);
    throw error;
  }
}

function test_Menu4_ProgressReport() {
  var reportData = getMenu4ProgressReport();
  Logger.log('[TEST] test_Menu4_ProgressReport => %s', JSON.stringify(reportData));
  return reportData;
}

function buildMenu4PopupHtml(reportData) {
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
  html.push('.btn-wrap{margin-top:20px;text-align:right;}');
  html.push('button{padding:8px 16px;border:1px solid #777;background:#fff;border-radius:18px;cursor:pointer;}');
  html.push('</style></head><body>');
  html.push('<h1>BÁO CÁO TỔNG QUAN TIẾN ĐỘ THÁNG</h1>');

  html.push('<div class="section">');
  html.push('<h2>I. TÓM TẮT TÌNH HÌNH THỰC HIỆN</h2>');
  html.push('<ul>');
  html.push('<li>Kết luận điều hành: ' + escapeHtml(buildMenu4ExecutiveLead_(summary.reportInterventionLevel || 'ỔN ĐỊNH')) + '</li>');
  html.push('<li>Tỷ lệ hoàn thành tháng theo số việc: ' + escapeHtml(formatPercentVi(summary.monthlyCompletionRate)) + '</li>');
  html.push('<li>Tỷ lệ hoàn thành có trọng số: ' + escapeHtml(formatPercentVi(summary.weightedCompletionRate)) + '</li>');
  html.push('<li>Tỷ lệ hoàn thành đúng hạn: ' + escapeHtml(formatPercentVi(summary.onTimeCompletionRate)) + '</li>');
  html.push('<li>Số lượng backlog chuyển kỳ: ' + escapeHtml(formatNumberVi(summary.backlogCount || 0)) + ' việc</li>');
  html.push('<li>Dự báo hoàn thành đến cuối tháng: ' + escapeHtml(formatPercentVi(summary.forecastCompletionRate)) + '</li>');
  html.push('<li>Tỷ lệ việc đang làm: ' + escapeHtml(formatPercentVi(summary.inProgressRate)) + '</li>');
  html.push('<li>Tỷ lệ việc chưa bắt đầu: ' + escapeHtml(formatPercentVi(summary.notStartedRate)) + '</li>');
  html.push('<li>Mức độ chung: <span class="level">' + escapeHtml(summary.reportInterventionLevel || 'ỔN ĐỊNH') + '</span></li>');
  html.push('</ul></div>');

  html.push('<div class="section">');
  html.push('<h2>II. CÁC HẠNG MỤC CẦN RÀ SOÁT</h2>');
  if (!topRiskTasks.length) {
    html.push('<div class="muted">' + escapeHtml(tone.emptyFocus) + '</div>');
  } else {
    topRiskTasks.forEach(function(task) {
      html.push('<div class="item">');
      html.push('<div><span class="level">[MỨC ĐỘ: ' + escapeHtml(task.interventionLevel) + ']</span> ' + escapeHtml(task.taskName || '') + '</div>');
      html.push('<ul>');
      html.push('<li>STT: ' + escapeHtml(task.taskIndex || '') + '</li>');
      html.push('<li>Mã dự án: ' + escapeHtml(task.projectCode || 'Chưa có') + '</li>');
      html.push('<li>Chủ trì: ' + escapeHtml(formatOwnerViMenu4_(task.ownerPrimary)) + '</li>');
      html.push('<li>Mức ưu tiên: ' + escapeHtml(formatPriorityViMenu4_(task.priority)) + '</li>');
      html.push('<li>Ngày kế hoạch: ' + escapeHtml(formatDateVi(task.deadline)) + '</li>');
      html.push('<li>Ngày hoàn thành: ' + escapeHtml(formatDateVi(task.actualDate, 'Chưa cập nhật')) + '</li>');
      html.push('<li>Tỷ lệ hoàn thành: ' + escapeHtml(formatPercentFromPercentValueMenu4_(task.percentCompleteNormalized)) + '</li>');
      html.push('<li>Trạng thái: ' + escapeHtml(formatStateViMenu4_(task.state)) + '</li>');
      html.push('<li>Kiến nghị: ' + escapeHtml(task.suggestedAction || '') + '</li>');
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

function buildMenu4ExecutiveLead_(level) {
  if (level === 'CẦN CAN THIỆP NGAY') {
    return 'Tiến độ tháng hiện ở mức cần can thiệp ngay, cần tập trung chỉ đạo các nội dung trọng tâm.';
  }
  if (level === 'CẦN THEO DÕI') {
    return 'Tiến độ tháng có nội dung cần tiếp tục theo dõi để bảo đảm hoàn thành kế hoạch.';
  }
  return 'Tiến độ tháng cơ bản ổn định, tiếp tục duy trì nhịp triển khai theo kế hoạch.';
}

function getMonthRange(reportDate) {
  var date = parseDateSafe(reportDate) || atStartOfDay_(new Date());
  return {
    monthStartDate: new Date(date.getFullYear(), date.getMonth(), 1),
    monthEndDate: new Date(date.getFullYear(), date.getMonth() + 1, 0)
  };
}

function calcOverdueDays(deadline, reportDate) {
  return calcDelayDays(deadline, reportDate);
}

function calcCompletionScore(task, config) {
  var percent = typeof task.percentCompleteNormalized === 'number' ? task.percentCompleteNormalized : null;

  if (task.state === 'DONE_LATE') {
    return 70;
  }
  if (task.state === 'DONE') {
    if (task.actualDateDate && task.deadlineDate) {
      return 100;
    }
    return 85;
  }
  if (task.state === 'IN_PROGRESS') {
    return percent !== null ? percent : 0;
  }
  if (task.state === 'NOT_STARTED' || task.state === 'OVERDUE') {
    return percent !== null ? percent : 0;
  }
  return percent !== null ? percent : 0;
}

function calcProgressSummary(tasks, config) {
  var leafTasks = tasks || [];
  var leafCount = leafTasks.length;
  var completedTasks = leafTasks.filter(function(task) {
    return task.state === 'DONE' || task.state === 'DONE_LATE';
  });
  var monthlyCompletionRate = leafCount ? completedTasks.length / leafCount : 0;

  var totalWeightedScore = 0;
  var totalWeight = 0;
  leafTasks.forEach(function(task) {
    var priorityWeight = resolvePriorityWeightScoreMenu4_(task.priorityNormalized || normalizePriority(task.priority));
    var completionScore = calcCompletionScore(task, config);
    totalWeightedScore += priorityWeight * completionScore;
    totalWeight += priorityWeight;
  });
  var weightedCompletionRate = totalWeight ? totalWeightedScore / (totalWeight * 100) : 0;

  var onTimeCompletedCount = completedTasks.filter(function(task) {
    return !!task.actualDateDate && !!task.deadlineDate && task.actualDateDate.getTime() <= task.deadlineDate.getTime();
  }).length;
  var onTimeCompletionRate = completedTasks.length ? onTimeCompletedCount / completedTasks.length : 0;

  var backlogCount = leafTasks.filter(function(task) {
    return !isCompletedByMonthEndMenu4_(task, config._monthRange.monthEndDate);
  }).length;

  var forecast = calcForecastCompletion(leafTasks, config);
  var inProgressRate = leafCount ? leafTasks.filter(function(task) { return task.state === 'IN_PROGRESS'; }).length / leafCount : 0;
  var notStartedRate = leafCount ? leafTasks.filter(function(task) { return task.state === 'NOT_STARTED'; }).length / leafCount : 0;

  var reportInterventionLevel = 'ỔN ĐỊNH';
  if (
    forecast.forecastCompletionRate < config.REPORT_HIGH_FORECAST_THRESHOLD ||
    backlogCount > config.HIGH_BACKLOG_COUNT_THRESHOLD ||
    onTimeCompletionRate < config.LOW_ON_TIME_THRESHOLD
  ) {
    reportInterventionLevel = 'CẦN CAN THIỆP NGAY';
  } else if (
    forecast.forecastCompletionRate < config.REPORT_MONITOR_FORECAST_THRESHOLD ||
    inProgressRate > config.HIGH_IN_PROGRESS_RATE ||
    notStartedRate > config.HIGH_NOT_STARTED_RATE
  ) {
    reportInterventionLevel = 'CẦN THEO DÕI';
  }

  return {
    monthlyCompletionRate: monthlyCompletionRate,
    weightedCompletionRate: weightedCompletionRate,
    onTimeCompletionRate: onTimeCompletionRate,
    backlogCount: backlogCount,
    forecastCompletionRate: forecast.forecastCompletionRate,
    inProgressRate: inProgressRate,
    notStartedRate: notStartedRate,
    reportInterventionLevel: reportInterventionLevel
  };
}

function calcForecastCompletion(tasks, config) {
  var monthStartDate = config._monthRange.monthStartDate;
  var monthEndDate = config._monthRange.monthEndDate;
  var reportDate = atStartOfDay_(config._resolvedReportDate);
  var effectiveReportDate = reportDate.getTime() > monthEndDate.getTime() ? monthEndDate : reportDate;
  var elapsedDays = Math.max(1, Math.floor((effectiveReportDate.getTime() - monthStartDate.getTime()) / 86400000) + 1);
  var totalDaysOfMonth = Math.floor((monthEndDate.getTime() - monthStartDate.getTime()) / 86400000) + 1;
  var doneSoFar = (tasks || []).filter(function(task) {
    return task.actualDateDate &&
      task.actualDateDate.getTime() >= monthStartDate.getTime() &&
      task.actualDateDate.getTime() <= effectiveReportDate.getTime();
  }).length;
  var velocityPerDay = doneSoFar / elapsedDays;
  var forecastDone = Math.min((tasks || []).length, velocityPerDay * totalDaysOfMonth);
  var forecastCompletionRate = (tasks || []).length ? forecastDone / tasks.length : 0;

  return {
    elapsedDays: elapsedDays,
    totalDaysOfMonth: totalDaysOfMonth,
    doneSoFar: doneSoFar,
    velocityPerDay: velocityPerDay,
    forecastDone: forecastDone,
    forecastCompletionRate: forecastCompletionRate
  };
}

function calcManagerProgressRiskScore(task, config) {
  var priorityWeightNormalized = resolvePriorityWeightNormalizedMenu4_(task.priorityNormalized || normalizePriority(task.priority));
  var delayRisk = task.state === 'OVERDUE' ? Math.min(1, (task.overdueDays || 0) / config.OVERDUE_DAY_CAP) : 0;
  var incompleteRisk = typeof task.percentCompleteNormalized === 'number'
    ? Math.max(0, 1 - (task.percentCompleteNormalized / 100))
    : 1;
  var onTimePenalty = 0;

  if (task.state === 'DONE_LATE') {
    onTimePenalty = 0.7;
  } else if (task.state === 'DONE' && !task.actualDateDate) {
    onTimePenalty = 0.3;
  }

  return roundNumber_(
    (priorityWeightNormalized * 0.35) +
    (delayRisk * 0.35) +
    (incompleteRisk * 0.20) +
    (onTimePenalty * 0.10),
    4
  );
}

function resolveProgressInterventionLevel(task, summary, config) {
  var priority = task.priorityNormalized || normalizePriority(task.priority);
  var percent = typeof task.percentCompleteNormalized === 'number' ? task.percentCompleteNormalized : null;
  var nearDeadline = isNearDeadlineMenu4_(task.deadlineDate, config._resolvedReportDate, config.NEAR_DEADLINE_DAYS);

  if (
    (task.state === 'OVERDUE' && (priority === 'urgent' || priority === 'high')) ||
    task.managerProgressRiskScore >= config.HIGH_RISK_SCORE ||
    ((task.overdueDays || 0) >= config.HIGH_OVERDUE_DAYS) ||
    (priority === 'urgent' && task.state !== 'DONE' && task.state !== 'DONE_LATE')
  ) {
    return 'CẦN CAN THIỆP NGAY';
  }

  if (
    (task.state === 'IN_PROGRESS' && percent !== null && percent < config.LOW_PROGRESS_THRESHOLD) ||
    (task.state === 'NOT_STARTED' && nearDeadline) ||
    task.managerProgressRiskScore >= config.MONITOR_RISK_SCORE ||
    task.state === 'DONE_LATE'
  ) {
    return 'CẦN THEO DÕI';
  }

  return 'ỔN ĐỊNH';
}

function buildProgressSuggestedAction(task, config) {
  var priority = task.priorityNormalized || normalizePriority(task.priority);
  var nearDeadline = isNearDeadlineMenu4_(task.deadlineDate, config._resolvedReportDate, config.NEAR_DEADLINE_DAYS);

  if (task.state === 'OVERDUE' && (priority === 'urgent' || priority === 'high')) {
    return 'Đề nghị ưu tiên xử lý ngay và báo cáo phương án hoàn thành.';
  }
  if (task.state === 'OVERDUE') {
    return 'Kiến nghị rà soát nguyên nhân chậm tiến độ và mốc hoàn thành điều chỉnh.';
  }
  if (task.state === 'IN_PROGRESS' && typeof task.percentCompleteNormalized === 'number' && task.percentCompleteNormalized < config.LOW_PROGRESS_THRESHOLD) {
    return 'Đề nghị kiểm tra tiến độ thực hiện và điều phối nguồn lực nếu cần.';
  }
  if (task.state === 'NOT_STARTED' && nearDeadline) {
    return 'Cần xem xét khởi động ngay công việc để bảo đảm tiến độ kế hoạch.';
  }
  if (task.state === 'DONE_LATE') {
    return 'Đề nghị rút kinh nghiệm về kiểm soát thời hạn và cập nhật nguyên nhân chậm.';
  }
  if (task.state === 'DONE' && (!task.actualDateDate || !task.deadlineDate)) {
    return 'Đề nghị bổ sung dữ liệu ngày để bảo đảm cơ sở đánh giá đúng hạn.';
  }
  return 'Tạm thời tiếp tục theo dõi, chưa cần điều chỉnh lớn.';
}

function buildMenu4TopRiskTasks_(tasks, config) {
  var interventionOrder = {
    'CẦN CAN THIỆP NGAY': 0,
    'CẦN THEO DÕI': 1,
    'ỔN ĐỊNH': 2
  };
  var priorityOrder = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
    unknown: 4
  };

  return (tasks || []).filter(function(task) {
    return task.interventionLevel !== 'ỔN ĐỊNH';
  }).sort(function(a, b) {
    var levelA = interventionOrder[a.interventionLevel] !== undefined ? interventionOrder[a.interventionLevel] : 2;
    var levelB = interventionOrder[b.interventionLevel] !== undefined ? interventionOrder[b.interventionLevel] : 2;
    if (levelA !== levelB) {
      return levelA - levelB;
    }
    if (b.managerProgressRiskScore !== a.managerProgressRiskScore) {
      return b.managerProgressRiskScore - a.managerProgressRiskScore;
    }
    var priorityA = priorityOrder[a.priorityNormalized || normalizePriority(a.priority)] !== undefined ? priorityOrder[a.priorityNormalized || normalizePriority(a.priority)] : 4;
    var priorityB = priorityOrder[b.priorityNormalized || normalizePriority(b.priority)] !== undefined ? priorityOrder[b.priorityNormalized || normalizePriority(b.priority)] : 4;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    var deadlineA = a.deadlineDate ? a.deadlineDate.getTime() : Number.MAX_SAFE_INTEGER;
    var deadlineB = b.deadlineDate ? b.deadlineDate.getTime() : Number.MAX_SAFE_INTEGER;
    return deadlineA - deadlineB;
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
      deadline: task.deadline || null,
      actualDate: task.actualDate || null,
      percentCompleteNormalized: task.percentCompleteNormalized,
      completionScorePerTask: task.completionScorePerTask,
      overdueDays: task.overdueDays,
      state: task.state || null,
      managerProgressRiskScore: task.managerProgressRiskScore,
      interventionLevel: task.interventionLevel,
      suggestedAction: task.suggestedAction
    };
  });
}

function buildMenu4Alerts(summary, topRiskTasks, config) {
  var alerts = [];

  (topRiskTasks || []).forEach(function(task) {
    var priority = normalizePriority(task.priority);
    var deadlineDate = parseDateSafe(task.deadline);

    if (task.state === 'OVERDUE' && (priority === 'urgent' || priority === 'high')) {
      alerts.push({
        level: 'CẦN CAN THIỆP NGAY',
        type: 'HIGH_PRIORITY_OVERDUE',
        message: 'Cần ưu tiên xử lý công việc ưu tiên cao đang quá hạn.',
        taskName: task.taskName,
        ownerPrimary: task.ownerPrimary
      });
    }
    if ((task.overdueDays || 0) >= config.HIGH_OVERDUE_DAYS) {
      alerts.push({
        level: 'CẦN THEO DÕI',
        type: 'LONG_OVERDUE',
        message: 'Đề nghị rà soát công việc quá hạn nhiều ngày để xử lý dứt điểm.',
        taskName: task.taskName,
        ownerPrimary: task.ownerPrimary
      });
    }
    if (task.state === 'NOT_STARTED' && isNearDeadlineMenu4_(deadlineDate, config._resolvedReportDate, config.NEAR_DEADLINE_DAYS)) {
      alerts.push({
        level: 'CẦN THEO DÕI',
        type: 'NOT_STARTED_NEAR_DEADLINE',
        message: 'Cần xem xét công việc chưa bắt đầu nhưng đã gần đến hạn.',
        taskName: task.taskName,
        ownerPrimary: task.ownerPrimary
      });
    }
    if (task.state === 'DONE_LATE') {
      alerts.push({
        level: 'CẦN THEO DÕI',
        type: 'DONE_LATE',
        message: 'Đề nghị rà soát công việc hoàn thành trễ để rút kinh nghiệm điều hành.',
        taskName: task.taskName,
        ownerPrimary: task.ownerPrimary
      });
    }
    if ((task.state === 'DONE' || task.state === 'DONE_LATE') && !parseDateSafe(task.actualDate)) {
      alerts.push({
        level: 'CẦN THEO DÕI',
        type: 'DONE_MISSING_ACTUAL_DATE',
        message: 'Đề nghị bổ sung ngày hoàn thành thực tế đối với công việc đã hoàn thành.',
        taskName: task.taskName,
        ownerPrimary: task.ownerPrimary
      });
    }
  });

  if (summary.forecastCompletionRate < config.REPORT_HIGH_FORECAST_THRESHOLD) {
    alerts.push({
      level: 'CẦN CAN THIỆP NGAY',
      type: 'LOW_FORECAST_COMPLETION',
      message: 'Dự báo hoàn thành cuối tháng đang thấp hơn ngưỡng cho phép.',
      taskName: null,
      ownerPrimary: null
    });
  }
  if (summary.backlogCount > config.HIGH_BACKLOG_COUNT_THRESHOLD) {
    alerts.push({
      level: 'CẦN CAN THIỆP NGAY',
      type: 'HIGH_BACKLOG',
      message: 'Khối lượng backlog chuyển kỳ đang vượt ngưỡng theo dõi.',
      taskName: null,
      ownerPrimary: null
    });
  }
  if (summary.onTimeCompletionRate < config.LOW_ON_TIME_THRESHOLD) {
    alerts.push({
      level: 'CẦN THEO DÕI',
      type: 'LOW_ON_TIME_COMPLETION',
      message: 'Tỷ lệ hoàn thành đúng hạn đang ở mức thấp, cần rà soát nguyên nhân.',
      taskName: null,
      ownerPrimary: null
    });
  }

  return alerts;
}

function buildMenu4ExecutiveRecommendations_(reportData, config) {
  var recommendations = [];
  var summary = reportData.summary || {};
  var topRiskTasks = reportData.topRiskTasks || [];
  var level = summary.reportInterventionLevel || 'ỔN ĐỊNH';

  if (topRiskTasks.some(function(task) {
    var priority = normalizePriority(task.priority);
    return (priority === 'urgent' || priority === 'high') && task.state !== 'DONE' && task.state !== 'DONE_LATE';
  })) {
    recommendations.push('Đề nghị ưu tiên nguồn lực cho các công việc có mức ưu tiên cao nhưng chưa hoàn thành.');
  }
  if ((summary.backlogCount || 0) > 0) {
    recommendations.push('Kiến nghị rà soát backlog chuyển kỳ để điều chỉnh kế hoạch thực hiện.');
  }
  if (topRiskTasks.some(function(task) { return task.state === 'OVERDUE'; })) {
    recommendations.push('Cần xem xét các công việc quá hạn chưa hoàn thành để có phương án xử lý dứt điểm.');
  }
  if (topRiskTasks.some(function(task) { return (task.state === 'DONE' || task.state === 'DONE_LATE') && !task.actualDate; })) {
    recommendations.push('Đề nghị kiểm tra các công việc hoàn thành nhưng thiếu dữ liệu ngày hoàn thành thực tế.');
  }
  if ((summary.forecastCompletionRate || 0) < config.REPORT_MONITOR_FORECAST_THRESHOLD) {
    recommendations.push('Kiến nghị tập trung chỉ đạo các công việc ưu tiên cao có nguy cơ chậm tiến độ cuối kỳ.');
  }

  if (level === 'CẦN CAN THIỆP NGAY') {
    recommendations.unshift('Tiến độ tháng hiện cần tập trung chỉ đạo ngay để bảo đảm khả năng hoàn thành kế hoạch.');
  } else if (level === 'CẦN THEO DÕI') {
    recommendations.unshift('Tiến độ tháng có dấu hiệu chậm so với kế hoạch, đề nghị tiếp tục bám sát các mốc trọng tâm.');
  }

  if (!recommendations.length) {
    recommendations.push('Tình hình tiến độ hiện tại cơ bản ổn định, đề nghị tiếp tục theo dõi theo kế hoạch tháng.');
  }

  return recommendations.slice(0, 5);
}

function formatDateVi(value, emptyText) {
  var date = parseDateSafe(value);
  if (!date) {
    return emptyText || 'Không xác định';
  }
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

function cloneMenu4Config_() {
  return JSON.parse(JSON.stringify(MENU_4_PROGRESS_CONFIG_));
}

function taoKetQuaMenu4Rong_(sheetName, reportDate, monthRange, totalRowsRead) {
  return {
    meta: {
      sheetName: sheetName,
      reportDate: formatDateOutput_(reportDate),
      monthStartDate: formatDateOutput_(monthRange.monthStartDate),
      monthEndDate: formatDateOutput_(monthRange.monthEndDate),
      totalRowsRead: totalRowsRead || 0,
      taskRowCount: 0,
      groupRowCount: 0,
      emptyRowCount: 0,
      invalidRowCount: 0,
      leafTaskCount: 0
    },
    summary: {
      monthlyCompletionRate: 0,
      weightedCompletionRate: 0,
      onTimeCompletionRate: 0,
      backlogCount: 0,
      forecastCompletionRate: 0,
      inProgressRate: 0,
      notStartedRate: 0,
      reportInterventionLevel: 'ỔN ĐỊNH'
    },
    topRiskTasks: [],
    alerts: [],
    popupHtml: '',
    logs: {
      warnings: [],
      errors: []
    }
  };
}

function detectRowTypeMenu4_(rawRow, normalizedRow) {
  if (isMenu1EmptyRow_(rawRow, normalizedRow)) {
    return 'EMPTY';
  }
  if (normalizedRow.isGroupRow === true) {
    return 'GROUP';
  }

  var laGroup =
    !!normalizedRow.taskName &&
    !normalizedRow.ownerPrimary &&
    !normalizedRow.deadlineDate &&
    normalizedRow.percentCompleteNormalized === null &&
    !normalizedRow.actualDateDate;

  if (laGroup) {
    return 'GROUP';
  }

  var laTask =
    !!normalizedRow.taskName &&
    (
      !!normalizedRow.deadlineDate ||
      normalizedRow.percentCompleteNormalized !== null ||
      !!normalizedRow.ownerPrimary
    );

  if (laTask) {
    return 'TASK';
  }

  return 'INVALID';
}

function laDongTongMenu4_(taskIndex) {
  return taskIndex === '∑' || taskIndex === 'Σ';
}

function buildMenu4HierarchyAlerts_(tasks) {
  var alerts = [];
  (tasks || []).forEach(function(task) {
    if (task.sttWarning) {
      alerts.push({
        level: 'CẦN THEO DÕI',
        type: 'TASK_INDEX_STRUCTURE_WARNING',
        message: 'Đề nghị rà soát cấu trúc STT để bảo đảm quan hệ cha - con rõ ràng.',
        taskName: task.taskName || null,
        ownerPrimary: formatOwnerViMenu4_(task.ownerPrimary)
      });
    }
  });
  return alerts;
}

function resolvePriorityWeightScoreMenu4_(priority) {
  var map = {
    urgent: 4,
    high: 3,
    medium: 2,
    low: 1,
    unknown: 1
  };
  return map[priority] !== undefined ? map[priority] : 1;
}

function resolvePriorityWeightNormalizedMenu4_(priority) {
  var map = {
    urgent: 1.0,
    high: 0.8,
    medium: 0.5,
    low: 0.25,
    unknown: 0.25
  };
  return map[priority] !== undefined ? map[priority] : 0.25;
}

function isNearDeadlineMenu4_(deadlineDate, reportDate, nearDays) {
  if (!deadlineDate || !reportDate) {
    return false;
  }
  var diff = Math.floor((atStartOfDay_(deadlineDate).getTime() - atStartOfDay_(reportDate).getTime()) / 86400000);
  return diff >= 0 && diff <= nearDays;
}

function isCompletedByMonthEndMenu4_(task, monthEndDate) {
  if (task.actualDateDate) {
    return task.actualDateDate.getTime() <= monthEndDate.getTime();
  }
  return task.state === 'DONE' || task.state === 'DONE_LATE';
}

function formatOwnerViMenu4_(owner) {
  return owner && owner !== 'unassigned' ? owner : 'Chưa phân công';
}

function formatPriorityViMenu4_(priority) {
  var text = normalizeText(priority);
  return text || 'Chưa xác định';
}

function formatStateViMenu4_(state) {
  var map = {
    DONE: 'Hoàn thành',
    DONE_LATE: 'Hoàn thành trễ',
    OVERDUE: 'Quá hạn',
    IN_PROGRESS: 'Đang thực hiện',
    NOT_STARTED: 'Chưa bắt đầu'
  };
  return map[state] || 'Chưa xác định';
}

function formatPercentFromPercentValueMenu4_(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return formatNumberVi(Number(value)) + '%';
}
