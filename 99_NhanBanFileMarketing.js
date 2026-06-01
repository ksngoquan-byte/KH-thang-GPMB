const MKT_CLONE_TEMPLATE_FILE_ID = '1XLxkrZ9P238TDxUi2FlqVtNSj25OkLpnOfYI_bbPxjc';
const MKT_CLONE_DEST_FOLDER_ID = '1LF82gom5EnWAS8vTeiWnX8khuVbmoxzd';
const MKT_CLONE_TIMEZONE = 'Asia/Ho_Chi_Minh';
const MKT_CLONE_DRIVE_RETRY_LIMIT = 3;

const MKT_CLONE_TARGET_FILES = [
  { fileName: '16_KH_thang_GPMB_2026', sheetPrefix: 'GPMB' },
  { fileName: '17_KH_thang_Tieuchuan_2026', sheetPrefix: 'Tieuchuan' },
  { fileName: '18_KH_thang_BIM_2026', sheetPrefix: 'BIM' },
  { fileName: '19_KH_thang_Thietke_2026', sheetPrefix: 'Thietke' },
  { fileName: '20_KH_thang_Dauthau_2026', sheetPrefix: 'Dauthau' }
];

/**
 * Nhan ban file ke hoach thang tu file mau Marketing sang cac file phong ban.
 */
function nhanBanFileKeHoachTuMarketing() {
  const results = [];

  try {
    const templateFile = DriveApp.getFileById(MKT_CLONE_TEMPLATE_FILE_ID);
    const destFolder = DriveApp.getFolderById(MKT_CLONE_DEST_FOLDER_ID);

    MKT_CLONE_TARGET_FILES.forEach(function(target) {
      const existedFile = timFileTrungTenTrongFolder_(destFolder, target.fileName);

      if (existedFile) {
        results.push({
          fileName: target.fileName,
          status: 'SKIP_DA_TON_TAI',
          url: chayLaiKhiLoiDrive_(function() {
            return existedFile.getUrl();
          }, 'getUrl ' + target.fileName)
        });
        return;
      }

      try {
        const newFile = chayLaiKhiLoiDrive_(function() {
          return templateFile.makeCopy(target.fileName, destFolder);
        }, 'makeCopy ' + target.fileName);
        const spreadsheet = SpreadsheetApp.openById(newFile.getId());

        spreadsheet.setSpreadsheetTimeZone(MKT_CLONE_TIMEZONE);
        doiTenSheetThangMarketing_(spreadsheet, target.sheetPrefix);

        results.push({
          fileName: target.fileName,
          status: 'DA_TAO',
          url: newFile.getUrl()
        });
      } catch (err) {
        results.push({
          fileName: target.fileName,
          status: 'LOI: ' + (err && err.message ? err.message : err),
          url: ''
        });
      }
    });
  } catch (err) {
    Logger.log('LOI_KHOI_TAO: %s', err && err.stack ? err.stack : err);
    throw err;
  } finally {
    results.forEach(function(item) {
      Logger.log('%s | %s | %s', item.fileName, item.status, item.url);
    });
  }

  return results;
}

/**
 * Tim file trung ten trong folder de tranh tao trung.
 *
 * @param {GoogleAppsScript.Drive.Folder} folder
 * @param {string} fileName
 * @return {GoogleAppsScript.Drive.File|null}
 */
function timFileTrungTenTrongFolder_(folder, fileName) {
  const files = chayLaiKhiLoiDrive_(function() {
    return folder.getFilesByName(fileName);
  }, 'getFilesByName ' + fileName);
  return files.hasNext() ? files.next() : null;
}

/**
 * Chay lai thao tac Drive de giam loi tam thoi "Service error: Drive".
 *
 * @param {Function} action
 * @param {string} label
 * @return {*}
 */
function chayLaiKhiLoiDrive_(action, label) {
  let lastError = null;

  for (let attempt = 1; attempt <= MKT_CLONE_DRIVE_RETRY_LIMIT; attempt++) {
    try {
      return action();
    } catch (err) {
      lastError = err;
      Logger.log(
        'RETRY_DRIVE | %s | lan %s/%s | %s',
        label,
        attempt,
        MKT_CLONE_DRIVE_RETRY_LIMIT,
        err && err.message ? err.message : err
      );

      if (attempt < MKT_CLONE_DRIVE_RETRY_LIMIT) {
        Utilities.sleep(1000 * attempt);
      }
    }
  }

  throw lastError;
}

/**
 * Doi ten cac sheet thang Marketing tu MKT sang prefix moi.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet
 * @param {string} newPrefix
 */
function doiTenSheetThangMarketing_(spreadsheet, newPrefix) {
  for (let month = 1; month <= 12; month++) {
    const monthText = month < 10 ? '0' + month : String(month);
    const oldName = 'MKT – T' + monthText + '.2026';
    const newName = newPrefix + ' – T' + monthText + '.2026';
    const sheet = spreadsheet.getSheetByName(oldName);

    if (!sheet) {
      Logger.log('KHONG_TIM_THAY_SHEET | %s | %s', spreadsheet.getName(), oldName);
      continue;
    }

    sheet.setName(newName);
  }
}
