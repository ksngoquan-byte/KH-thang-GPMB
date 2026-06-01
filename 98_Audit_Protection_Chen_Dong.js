function auditProtectionChenDong() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  var details = [];
  var totalSheetLevel = 0;
  var totalRangeLevel = 0;
  var totalRiskInsertRow = 0;

  sheets.forEach(function(sheet) {
    var name = sheet.getName();

    var isSystemSheet = /^(Data|Data2|Cau_hinh|Cáº¥u hÃ¬nh|Mail|Log|Email|Dashboard|DM_phong|Mail_Log|Run_Log)$/i.test(name);
    if (isSystemSheet) return;

    var sheetProtections = sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    var rangeProtections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);

    totalSheetLevel += sheetProtections.length;
    totalRangeLevel += rangeProtections.length;

    var sheetProtectionDetails = sheetProtections.map(function(p) {
      var editors = [];
      var unprotectedRanges = [];

      try {
        editors = p.getEditors().map(function(e) { return e.getEmail(); });
      } catch (err1) {
        editors = ["READ_EDITORS_FAIL"];
      }

      try {
        unprotectedRanges = p.getUnprotectedRanges().map(function(r) { return r.getA1Notation(); });
      } catch (err2) {
        unprotectedRanges = ["READ_UNPROTECTED_RANGES_FAIL"];
      }

      return {
        description: p.getDescription() || "",
        warning_only: p.isWarningOnly(),
        editors: editors,
        unprotected_range_count: unprotectedRanges.length,
        unprotected_ranges: unprotectedRanges
      };
    });

    var riskInsertRowBlocked = sheetProtections.length > 0;
    if (riskInsertRowBlocked) totalRiskInsertRow++;

    details.push({
      sheet_name: name,
      max_rows: sheet.getMaxRows(),
      max_columns: sheet.getMaxColumns(),
      sheet_level_protection_count: sheetProtections.length,
      range_level_protection_count: rangeProtections.length,
      risk_insert_row_blocked: riskInsertRowBlocked,
      sheet_protections: sheetProtectionDetails
    });
  });

  var result = {
    spreadsheet_name: ss.getName(),
    spreadsheet_id: ss.getId(),
    total_sheets_checked: details.length,
    total_sheet_level_protections: totalSheetLevel,
    total_range_level_protections: totalRangeLevel,
    total_sheets_risk_insert_row_blocked: totalRiskInsertRow,
    conclusion: totalRiskInsertRow > 0 ? "CO_RUI_RO_KHONG_CHEN_DUOC_DONG" : "CHUA_THAY_RUI_RO_SHEET_LEVEL_PROTECTION",
    details: details
  };

  Logger.log(JSON.stringify(result));
  return JSON.stringify(result);
}
