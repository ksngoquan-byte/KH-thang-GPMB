var MENU_2_PERSONNEL_CONFIG_ = {
  SHEET_NAME: '',
  HEADER_ROW: 4,
  REPORT_DATE: null,
  TOP_RISK_LIMIT: 5,
  TOP_REALLOCATION_LIMIT: 5,
  TOP_GOVERNANCE_LIMIT: 5,
  DATA_SHEET_NAME: 'Data',
  INTERNAL_STAFF_START_ROW: 6,
  INTERNAL_STAFF_END_ROW: 56,
  INTERNAL_STAFF_NAME_COL: 12 // L
};

function getMenu2PersonnelReport() {
  try {
    var config = cloneMenu2Config_();
    var ss = layBangTinhDangMo_();
    var sheet = laySheetMenu2_(ss, config);
    var reportDate = resolveMenu1ReportDate_(config.REPORT_DATE);
    var headerRow = Number(config.HEADER_ROW || 4);

    validateMenu1Input_(sheet, headerRow, reportDate);

    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    var totalRowsRead = Math.max(lastRow - headerRow, 0);
    var ketQua = taoKetQuaMenu2Rong_(sheet.getName(), reportDate, totalRowsRead);

    if (totalRowsRead <= 0 || lastColumn <= 0) {
      return ketQua;
    }

    var sheetData = ss.getSheetByName(config.DATA_SHEET_NAME);
    var tapNhanSuNoiBo = layTapNhanSuNoiBoMenu2_(sheetData, config);
    var headers = sheet.getRange(headerRow, 1, 1, lastColumn).getDisplayValues()[0];
    var dataValues = sheet.getRange(headerRow + 1, 1, totalRowsRead, lastColumn).getValues();
    var headerMap = applyMenu1FixedColumns_(buildHeaderMap(headers));
    var banDoNhanSu = {};
    var validTasks = [];

    for (var i = 0; i < dataValues.length; i++) {
      var rowIndex = headerRow + 1 + i;
      var task = normalizeTaskRow(dataValues[i], headerMap, rowIndex);
      task.state = resolveTaskState(task, reportDate);
      task.delayDays = task.state === 'OVERDUE' ? calcDelayDays(task.deadlineDate, reportDate) : null;
      task.isOpenByPercent = task.percentCompleteNormalized !== 100;
      task.hasEvaluationUpdate = coCapNhatDanhGiaMenu2_(task);

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

      if (task.rowType === 'GROUP' || laDongTongMenu2_(task)) {
        ketQua.meta.groupRowCount++;
        continue;
      }

      if (task.rowType === 'INVALID') {
        ketQua.meta.invalidRowCount++;
        continue;
      }

      ketQua.meta.taskRowCount++;
      validTasks.push(task);

      var dsNhanSuLienQuan = tachNhanSuLienQuanMenu2_(task, tapNhanSuNoiBo);
      if (!dsNhanSuLienQuan.length) {
        continue;
      }

      capNhatBanDoNhanSuMenu2_(banDoNhanSu, dsNhanSuLienQuan, task);
    }

    var dsNhanSu = Object.keys(banDoNhanSu)
      .map(function(key) { return hoanTatThongKeNhanSuMenu2_(banDoNhanSu[key]); })
      .filter(function(item) { return item.openTaskCount > 0 || item.totalTaskCount > 0; });

    var dsRuiRo = xepHangRuiRoNhanSuMenu2_(dsNhanSu);
    var dsCanDieuPhoi = dsNhanSu
      .filter(function(item) { return item.highPriorityOverdueCount > 0; })
      .sort(soSanhDieuPhoiMenu2_);
    var dsQuanTriKem = dsNhanSu
      .filter(function(item) { return item.missingGovernanceCount > 0; })
      .sort(soSanhQuanTriKemMenu2_);
    var dsCamKet = dsNhanSu
      .filter(function(item) { return item.commitmentEligibleCount > 0; })
      .slice()
      .sort(function(a, b) {
        if (b.onTimeCommitmentRate !== a.onTimeCommitmentRate) {
          return b.onTimeCommitmentRate - a.onTimeCommitmentRate;
        }
        return b.commitmentEligibleCount - a.commitmentEligibleCount;
      });

    ketQua.summary = buildMenu2Summary_(dsNhanSu, dsRuiRo, dsCanDieuPhoi, dsQuanTriKem, dsCamKet);
    ketQua.rankings = {
      riskRanking: buildMenu2RiskTable_(dsRuiRo, config.TOP_RISK_LIMIT),
      reallocationList: buildMenu2ReallocationTable_(dsCanDieuPhoi, config.TOP_REALLOCATION_LIMIT),
      governancePoorList: buildMenu2GovernanceTable_(dsQuanTriKem, config.TOP_GOVERNANCE_LIMIT),
      bestCommitment: dsCamKet.length ? buildMenu2CommitmentItem_(dsCamKet[0]) : null,
      worstCommitment: dsCamKet.length ? buildMenu2CommitmentItem_(dsCamKet[dsCamKet.length - 1]) : null
    };
    ketQua.people = buildMenu2PeopleTable_(dsNhanSu);

    Logger.log('Menu 2 - Tổng số dòng đọc được: %s', ketQua.meta.totalRowsRead);
    Logger.log('Menu 2 - Số dòng TASK hợp lệ: %s', ketQua.meta.taskRowCount);
    Logger.log('Menu 2 - Số dòng GROUP: %s', ketQua.meta.groupRowCount);
    Logger.log('Menu 2 - Số dòng INVALID: %s', ketQua.meta.invalidRowCount);
    Logger.log('Menu 2 - Số nhân sự có việc: %s', ketQua.summary.peopleCount);

    return ketQua;
  } catch (error) {
    Logger.log('Lỗi getMenu2PersonnelReport: %s', error.stack || error);
    throw error;
  }
}

function chayMenu2TaiTrongNhanSu() {
  try {
    var ketQua = getMenu2PersonnelReport();
    SpreadsheetApp.getUi().alert(
      'Báo cáo tình hình thực hiện theo nhân sự',
      buildMenu2PopupMessage_(ketQua),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return ketQua;
  } catch (error) {
    Logger.log('Lỗi chayMenu2TaiTrongNhanSu: %s', error.stack || error);
    throw error;
  }
}

function test_Menu2_PersonnelReport() {
  var ketQua = getMenu2PersonnelReport();
  Logger.log('[TEST] test_Menu2_PersonnelReport => %s', JSON.stringify(ketQua));
  return ketQua;
}

function cloneMenu2Config_() {
  return {
    SHEET_NAME: MENU_2_PERSONNEL_CONFIG_.SHEET_NAME,
    HEADER_ROW: MENU_2_PERSONNEL_CONFIG_.HEADER_ROW,
    REPORT_DATE: MENU_2_PERSONNEL_CONFIG_.REPORT_DATE,
    TOP_RISK_LIMIT: MENU_2_PERSONNEL_CONFIG_.TOP_RISK_LIMIT,
    TOP_REALLOCATION_LIMIT: MENU_2_PERSONNEL_CONFIG_.TOP_REALLOCATION_LIMIT,
    TOP_GOVERNANCE_LIMIT: MENU_2_PERSONNEL_CONFIG_.TOP_GOVERNANCE_LIMIT,
    DATA_SHEET_NAME: MENU_2_PERSONNEL_CONFIG_.DATA_SHEET_NAME,
    INTERNAL_STAFF_START_ROW: MENU_2_PERSONNEL_CONFIG_.INTERNAL_STAFF_START_ROW,
    INTERNAL_STAFF_END_ROW: MENU_2_PERSONNEL_CONFIG_.INTERNAL_STAFF_END_ROW,
    INTERNAL_STAFF_NAME_COL: MENU_2_PERSONNEL_CONFIG_.INTERNAL_STAFF_NAME_COL
  };
}

function laySheetMenu2_(ss, config) {
  return laySheetMenu1_(ss, config);
}

function taoKetQuaMenu2Rong_(sheetName, reportDate, totalRowsRead) {
  return {
    meta: {
      sheetName: sheetName,
      reportDate: formatDateOutput_(reportDate),
      totalRowsRead: totalRowsRead,
      taskRowCount: 0,
      groupRowCount: 0,
      emptyRowCount: 0,
      invalidRowCount: 0
    },
    summary: {
      peopleCount: 0,
      totalOpenOwnerTasks: 0,
      totalOpenAssigneeTasks: 0,
      highestRiskPerson: null,
      bestCommitmentPerson: null,
      worstCommitmentPerson: null,
      immediateReallocationCount: 0,
      poorGovernanceCount: 0
    },
    rankings: {
      riskRanking: [],
      reallocationList: [],
      governancePoorList: [],
      bestCommitment: null,
      worstCommitment: null
    },
    people: [],
    logs: {
      warnings: [],
      errors: []
    }
  };
}

function layTapNhanSuNoiBoMenu2_(sheetData, config) {
  var tap = {};
  if (!sheetData) {
    return tap;
  }

  var soDong = config.INTERNAL_STAFF_END_ROW - config.INTERNAL_STAFF_START_ROW + 1;
  var duLieu = sheetData.getRange(
    config.INTERNAL_STAFF_START_ROW,
    config.INTERNAL_STAFF_NAME_COL,
    soDong,
    1
  ).getDisplayValues();

  duLieu.forEach(function(dong) {
    var ten = normalizeText(dong[0]);
    if (ten) {
      tap[chuanHoaChuoi_(ten)] = ten;
    }
  });

  return tap;
}

function tachNhanSuLienQuanMenu2_(task, tapNhanSuNoiBo) {
  var ds = [];
  var daCo = {};
  var tenChuTri = normalizeText(task.ownerPrimary);
  if (tenChuTri) {
    themNhanSuLienQuanMenu2_(ds, daCo, tenChuTri, 'chu_tri');
  }

  (task.assignees || []).forEach(function(tenPhoiHop) {
    var ten = normalizeText(tenPhoiHop);
    if (!ten) {
      return;
    }
    var khoa = chuanHoaChuoi_(ten);
    if (tapNhanSuNoiBo && Object.keys(tapNhanSuNoiBo).length && !tapNhanSuNoiBo[khoa]) {
      return;
    }
    themNhanSuLienQuanMenu2_(ds, daCo, ten, 'phoi_hop');
  });

  return ds;
}

function themNhanSuLienQuanMenu2_(ds, daCo, tenNhanSu, vaiTro) {
  var khoa = chuanHoaChuoi_(tenNhanSu);
  if (!khoa) {
    return;
  }
  var item = daCo[khoa];
  if (!item) {
    item = {
      tenNhanSu: tenNhanSu,
      laChuTri: false,
      laPhoiHop: false
    };
    daCo[khoa] = item;
    ds.push(item);
  }
  if (vaiTro === 'chu_tri') {
    item.laChuTri = true;
  }
  if (vaiTro === 'phoi_hop') {
    item.laPhoiHop = true;
  }
}

function capNhatBanDoNhanSuMenu2_(banDoNhanSu, dsNhanSuLienQuan, task) {
  dsNhanSuLienQuan.forEach(function(item) {
    var khoa = chuanHoaChuoi_(item.tenNhanSu);
    if (!banDoNhanSu[khoa]) {
      banDoNhanSu[khoa] = taoNhanSuThongKeRongMenu2_(item.tenNhanSu);
    }
    var thongKe = banDoNhanSu[khoa];
    capNhatThongKeNhanSuMenu2_(thongKe, task, item);
  });
}

function taoNhanSuThongKeRongMenu2_(tenNhanSu) {
  return {
    tenNhanSu: tenNhanSu,
    totalTaskCount: 0,
    openOwnerCount: 0,
    openAssigneeCount: 0,
    openTaskCount: 0,
    overdueNoReportCount: 0,
    highPriorityOverdueCount: 0,
    missingDeadlineCount: 0,
    missingPriorityCount: 0,
    missingEvaluationUpdateCount: 0,
    missingGovernanceCount: 0,
    commitmentEligibleCount: 0,
    commitmentOnTimeCount: 0,
    onTimeCommitmentRate: 0
  };
}

function capNhatThongKeNhanSuMenu2_(thongKe, task, lienQuan) {
  thongKe.totalTaskCount++;

  if (task.isOpenByPercent) {
    if (lienQuan.laChuTri) {
      thongKe.openOwnerCount++;
    }
    if (lienQuan.laPhoiHop) {
      thongKe.openAssigneeCount++;
    }
  }

  if (task.state === 'OVERDUE' && !task.hasEvaluationUpdate) {
    thongKe.overdueNoReportCount++;
  }

  if (task.state === 'OVERDUE' && laUuTienCaoMenu2_(task.priority)) {
    thongKe.highPriorityOverdueCount++;
  }

  if (!task.deadlineDate) {
    thongKe.missingDeadlineCount++;
  }

  if (!normalizeText(task.priority)) {
    thongKe.missingPriorityCount++;
  }

  if (!task.hasEvaluationUpdate) {
    thongKe.missingEvaluationUpdateCount++;
  }

  if (lienQuan.laChuTri && task.deadlineDate) {
    thongKe.commitmentEligibleCount++;
    if (task.state === 'DONE') {
      thongKe.commitmentOnTimeCount++;
    }
  }
}

function hoanTatThongKeNhanSuMenu2_(thongKe) {
  thongKe.openTaskCount = thongKe.openOwnerCount + thongKe.openAssigneeCount;
  thongKe.missingGovernanceCount =
    thongKe.missingDeadlineCount +
    thongKe.missingPriorityCount +
    thongKe.missingEvaluationUpdateCount;
  thongKe.onTimeCommitmentRate = thongKe.commitmentEligibleCount > 0
    ? roundNumber_((thongKe.commitmentOnTimeCount / thongKe.commitmentEligibleCount) * 100, 1)
    : 0;
  return thongKe;
}

function xepHangRuiRoNhanSuMenu2_(dsNhanSu) {
  return (dsNhanSu || []).slice().sort(function(a, b) {
    if (b.highPriorityOverdueCount !== a.highPriorityOverdueCount) {
      return b.highPriorityOverdueCount - a.highPriorityOverdueCount;
    }
    if (b.overdueNoReportCount !== a.overdueNoReportCount) {
      return b.overdueNoReportCount - a.overdueNoReportCount;
    }
    if (b.openTaskCount !== a.openTaskCount) {
      return b.openTaskCount - a.openTaskCount;
    }
    if (b.missingGovernanceCount !== a.missingGovernanceCount) {
      return b.missingGovernanceCount - a.missingGovernanceCount;
    }
    return a.onTimeCommitmentRate - b.onTimeCommitmentRate;
  });
}

function soSanhDieuPhoiMenu2_(a, b) {
  if (b.highPriorityOverdueCount !== a.highPriorityOverdueCount) {
    return b.highPriorityOverdueCount - a.highPriorityOverdueCount;
  }
  if (b.openTaskCount !== a.openTaskCount) {
    return b.openTaskCount - a.openTaskCount;
  }
  return b.overdueNoReportCount - a.overdueNoReportCount;
}

function soSanhQuanTriKemMenu2_(a, b) {
  if (b.missingGovernanceCount !== a.missingGovernanceCount) {
    return b.missingGovernanceCount - a.missingGovernanceCount;
  }
  if (b.missingEvaluationUpdateCount !== a.missingEvaluationUpdateCount) {
    return b.missingEvaluationUpdateCount - a.missingEvaluationUpdateCount;
  }
  return b.missingDeadlineCount - a.missingDeadlineCount;
}

function buildMenu2Summary_(dsNhanSu, dsRuiRo, dsCanDieuPhoi, dsQuanTriKem, dsCamKet) {
  var tongChuTriMo = dsNhanSu.reduce(function(sum, item) { return sum + item.openOwnerCount; }, 0);
  var tongPhoiHopMo = dsNhanSu.reduce(function(sum, item) { return sum + item.openAssigneeCount; }, 0);

  return {
    peopleCount: dsNhanSu.length,
    totalOpenOwnerTasks: tongChuTriMo,
    totalOpenAssigneeTasks: tongPhoiHopMo,
    highestRiskPerson: dsRuiRo.length ? dsRuiRo[0].tenNhanSu : null,
    bestCommitmentPerson: dsCamKet.length ? dsCamKet[0].tenNhanSu : null,
    worstCommitmentPerson: dsCamKet.length ? dsCamKet[dsCamKet.length - 1].tenNhanSu : null,
    immediateReallocationCount: dsCanDieuPhoi.length,
    poorGovernanceCount: dsQuanTriKem.length
  };
}

function buildMenu2RiskTable_(dsRuiRo, limit) {
  return dsRuiRo.slice(0, Math.max(Number(limit || 5), 0)).map(function(item, index) {
    return {
      rank: index + 1,
      personName: item.tenNhanSu,
      openOwnerCount: item.openOwnerCount,
      openAssigneeCount: item.openAssigneeCount,
      overdueNoReportCount: item.overdueNoReportCount,
      highPriorityOverdueCount: item.highPriorityOverdueCount,
      onTimeCommitmentRate: item.onTimeCommitmentRate,
      missingGovernanceCount: item.missingGovernanceCount
    };
  });
}

function buildMenu2ReallocationTable_(dsCanDieuPhoi, limit) {
  return dsCanDieuPhoi.slice(0, Math.max(Number(limit || 5), 0)).map(function(item) {
    return {
      personName: item.tenNhanSu,
      highPriorityOverdueCount: item.highPriorityOverdueCount,
      openOwnerCount: item.openOwnerCount,
      openAssigneeCount: item.openAssigneeCount,
      overdueNoReportCount: item.overdueNoReportCount
    };
  });
}

function buildMenu2GovernanceTable_(dsQuanTriKem, limit) {
  return dsQuanTriKem.slice(0, Math.max(Number(limit || 5), 0)).map(function(item) {
    return {
      personName: item.tenNhanSu,
      missingDeadlineCount: item.missingDeadlineCount,
      missingPriorityCount: item.missingPriorityCount,
      missingEvaluationUpdateCount: item.missingEvaluationUpdateCount,
      missingGovernanceCount: item.missingGovernanceCount
    };
  });
}

function buildMenu2CommitmentItem_(item) {
  return {
    personName: item.tenNhanSu,
    onTimeCommitmentRate: item.onTimeCommitmentRate,
    commitmentEligibleCount: item.commitmentEligibleCount
  };
}

function buildMenu2PeopleTable_(dsNhanSu) {
  return dsNhanSu.slice().sort(function(a, b) {
    return a.tenNhanSu.localeCompare(b.tenNhanSu, 'vi');
  }).map(function(item) {
    return {
      personName: item.tenNhanSu,
      openOwnerCount: item.openOwnerCount,
      openAssigneeCount: item.openAssigneeCount,
      openTaskCount: item.openTaskCount,
      overdueNoReportCount: item.overdueNoReportCount,
      highPriorityOverdueCount: item.highPriorityOverdueCount,
      onTimeCommitmentRate: item.onTimeCommitmentRate,
      missingDeadlineCount: item.missingDeadlineCount,
      missingPriorityCount: item.missingPriorityCount,
      missingEvaluationUpdateCount: item.missingEvaluationUpdateCount,
      missingGovernanceCount: item.missingGovernanceCount
    };
  });
}

function buildMenu2PopupMessage_(ketQua) {
  var dsRuiRo = (ketQua.rankings.riskRanking || []).slice(0, 3);
  var dsDieuPhoi = (ketQua.rankings.reallocationList || []).slice(0, 3);
  var dsQuanTri = (ketQua.rankings.governancePoorList || []).slice(0, 3);
  var mucDoChung = resolveMenu2InterventionLevel_(ketQua);
  var tone = getAdaptiveReportTone_(mucDoChung);
  var lines = [tone.lead, '- Mức độ chung: ' + mucDoChung];
  lines.push('');

  if (ketQua.summary.highestRiskPerson) {
    lines.push('- Nhân sự cần ưu tiên theo dõi hiện tại: ' + ketQua.summary.highestRiskPerson);
  }
  if (dsDieuPhoi.length) {
    lines.push('- Nhân sự cần xem xét điều phối ngay: ' + dsDieuPhoi[0].personName);
  }
  if (dsQuanTri.length) {
    lines.push('- Nhân sự cần cập nhật thông tin quản trị ngay: ' + dsQuanTri[0].personName);
  }
  lines.push('');

  if (dsRuiRo.length) {
    lines.push('Nhân sự cần theo dõi, chỉ đạo:');
    dsRuiRo.forEach(function(item) {
      lines.push(
        '- ' + item.personName
        + ' | Việc chưa hoàn thành: ' + (item.openOwnerCount + item.openAssigneeCount)
        + (item.overdueNoReportCount > 0 ? ' | Quá hạn chưa cập nhật: ' + item.overdueNoReportCount : '')
        + (item.highPriorityOverdueCount > 0 ? ' | Việc ưu tiên cao quá hạn: ' + item.highPriorityOverdueCount : '')
      );
    });
    lines.push('');
  }

  if (dsDieuPhoi.length) {
    lines.push('Nhân sự cần xem xét điều phối công việc:');
    dsDieuPhoi.forEach(function(item) {
      lines.push(
        '- ' + item.personName
        + ' | Việc ưu tiên cao quá hạn: ' + item.highPriorityOverdueCount
        + ' | Việc chưa hoàn thành: ' + (item.openOwnerCount + item.openAssigneeCount)
      );
    });
    lines.push('');
  }

  if (dsQuanTri.length) {
    lines.push('Nhân sự cần cập nhật thông tin quản trị:');
    dsQuanTri.forEach(function(item) {
      lines.push(
        '- ' + item.personName
        + (item.missingDeadlineCount > 0 ? ' | Thiếu thời hạn: ' + item.missingDeadlineCount : '')
        + (item.missingPriorityCount > 0 ? ' | Thiếu ưu tiên: ' + item.missingPriorityCount : '')
        + (item.missingEvaluationUpdateCount > 0 ? ' | Thiếu cập nhật đánh giá: ' + item.missingEvaluationUpdateCount : '')
      );
    });
    lines.push('');
  }

  lines.push('Tổng quan:');
  lines.push('- Số nhân sự đang được giao việc: ' + ketQua.summary.peopleCount);
  lines.push('- Tổng số việc chưa hoàn thành: ' + (ketQua.summary.totalOpenOwnerTasks + ketQua.summary.totalOpenAssigneeTasks) + ' việc');
  if (ketQua.rankings.bestCommitment) {
    lines.push(
      '- Nhân sự có kết quả thực hiện đúng hạn cao nhất: ' + ketQua.rankings.bestCommitment.personName
      + ' (' + dinhDangTyLeMenu1_(ketQua.rankings.bestCommitment.onTimeCommitmentRate) + ')'
    );
  }
  if (ketQua.rankings.worstCommitment) {
    lines.push(
      '- Nhân sự có kết quả thực hiện đúng hạn thấp nhất: ' + ketQua.rankings.worstCommitment.personName
      + ' (' + dinhDangTyLeMenu1_(ketQua.rankings.worstCommitment.onTimeCommitmentRate) + ')'
    );
  }

  return lines.join('\n');
}

function resolveMenu2InterventionLevel_(ketQua) {
  var summary = ketQua && ketQua.summary ? ketQua.summary : {};
  if ((summary.immediateReallocationCount || 0) > 0 || (summary.poorGovernanceCount || 0) > 1) {
    return 'CẦN CAN THIỆP NGAY';
  }
  if ((summary.highestRiskPerson || null) || (summary.totalOpenOwnerTasks || 0) + (summary.totalOpenAssigneeTasks || 0) > 0) {
    return 'CẦN THEO DÕI';
  }
  return 'ỔN ĐỊNH';
}

function coCapNhatDanhGiaMenu2_(task) {
  return !!task.actualDateDate
    || task.actualBudget !== null
    || task.percentCompleteNormalized !== null
    || !!normalizeText(task.evaluation)
    || !!normalizeText(task.rootCauseAction)
    || !!normalizeText(task.managementDirection);
}

function laUuTienCaoMenu2_(priorityValue) {
  var muc = normalizePriority_(priorityValue);
  return muc === 'urgent' || muc === 'high';
}

function laDongTongMenu2_(task) {
  var stt = normalizeText(task.index);
  return stt === '∑' || stt === 'Σ';
}
