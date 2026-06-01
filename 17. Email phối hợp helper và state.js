// Tach tu 2.Chinh.js, giu nguyen ten ham va logic helper/state.

function layGiaTriAnToan_(giaTri) {
  if (giaTri === null || typeof giaTri === 'undefined') {
    return '';
  }

  return String(giaTri).trim();
}

function chuanHoaChuoi_(giaTri) {
  return layGiaTriAnToan_(giaTri).toLowerCase();
}

function hopNhatEmail_(dsEmail) {
  var bangDaCo = {};
  var ketQua = [];

  (dsEmail || []).forEach(function(email) {
    var e = chuanHoaChuoi_(email);
    if (!e || bangDaCo[e]) {
      return;
    }
    bangDaCo[e] = true;
    ketQua.push(e);
  });

  return ketQua;
}

function tachDanhSachPhongBanPhoiHop_(giaTri) {
  return layGiaTriAnToan_(giaTri)
    .split(/[;,\n\r]+/)
    .map(function(item) {
      return item.trim();
    })
    .filter(function(item) {
      return item !== '';
    });
}

function layDanhSachKhoiPhoiHopTheoMasterData_(phoiHop, banDoPhongBan, tenPhongLoaiTru) {
  var chuoiPhoiHop = chuanHoaChuoi_(phoiHop);
  var phongLoaiTru = chuanHoaChuoi_(tenPhongLoaiTru);
  var dsMuc = Object.keys(banDoPhongBan || {}).map(function(key) {
    return {
      key: key,
      tenPhong: banDoPhongBan[key].tenPhong,
      email: banDoPhongBan[key].email
    };
  }).filter(function(item) {
    return item.key && item.email && item.key !== phongLoaiTru;
  }).sort(function(a, b) {
    return b.key.length - a.key.length;
  });

  var dsKetQua = [];
  var bangDaCo = {};

  dsMuc.forEach(function(item) {
    if (chuoiPhoiHop.indexOf(item.key) === -1) {
      return;
    }

    if (bangDaCo[item.key]) {
      return;
    }

    bangDaCo[item.key] = true;
    dsKetQua.push({
      tenPhong: item.tenPhong,
      email: item.email
    });
  });

  return dsKetQua;
}

function layDanhSachNhanSuPhoiHopNoiBoTheoMasterData_(phoiHop, banDoNhanSu) {
  var chuoiPhoiHop = chuanHoaChuoi_(phoiHop);
  var dsMuc = Object.keys(banDoNhanSu || {}).map(function(key) {
    return {
      key: key,
      tenNguoi: banDoNhanSu[key].tenNguoi,
      emailCaNhan: banDoNhanSu[key].emailCaNhan
    };
  }).filter(function(item) {
    return item.key && item.tenNguoi;
  }).sort(function(a, b) {
    return b.key.length - a.key.length;
  });

  var dsKetQua = [];
  var bangDaCo = {};

  dsMuc.forEach(function(item) {
    if (chuoiPhoiHop.indexOf(item.key) === -1) {
      return;
    }

    if (bangDaCo[item.key]) {
      return;
    }

    bangDaCo[item.key] = true;
    dsKetQua.push({
      tenNguoi: item.tenNguoi,
      emailCaNhan: item.emailCaNhan
    });
  });

  return dsKetQua;
}

function dinhDangNgayYmdPhoiHop_(ngay) {
  return Utilities.formatDate(
    ngay,
    Session.getScriptTimeZone(),
    CAU_HINH_TONG_HOP_PHOI_HOP.DINH_DANG_NGAY
  );
}

function layNgayHomQuaYmdPhoiHop_() {
  var now = new Date();
  var homQua = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return dinhDangNgayYmdPhoiHop_(homQua);
}

function taoChuKyCongViecPhoiHop_(item) {
  return [
    item.loai || '',
    item.noiDung || '',
    item.maDuAn || '',
    item.mucTieuCuThe || '',
    item.capUuTien || '',
    item.thoiHanText || '',
    item.chuTri || '',
    item.doiTuongPhoiHop || ''
  ].join('|');
}

function docChuKyCongViecDaGuiPhoiHop_() {
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty(CAU_HINH_TONG_HOP_PHOI_HOP.KHOA_CHU_KY_DA_GUI);

  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch (e) {
    Logger.log('Không đọc được chữ ký công việc đã gửi phối hợp: %s', e);
    return {};
  }
}

function luuChuKyCongViecDaGuiPhoiHop_(duLieu) {
  PropertiesService.getScriptProperties().setProperty(
    CAU_HINH_TONG_HOP_PHOI_HOP.KHOA_CHU_KY_DA_GUI,
    JSON.stringify(duLieu || {})
  );
}

function layDanhSachChuKyDaGuiTheoSheetPhoiHop_(tenSheet) {
  var duLieu = docChuKyCongViecDaGuiPhoiHop_();
  return duLieu[tenSheet] || [];
}

function capNhatDanhSachChuKyDaGuiTheoSheetPhoiHop_(tenSheet, dsChuKy) {
  var duLieu = docChuKyCongViecDaGuiPhoiHop_();
  duLieu[tenSheet] = (dsChuKy || []).filter(function(item, index, arr) {
    return item && arr.indexOf(item) === index;
  });
  luuChuKyCongViecDaGuiPhoiHop_(duLieu);
}

function layPhanTichBienDongCongViecPhoiHop_(tenSheet, dsCongViec) {
  var dsChuKyCu = layDanhSachChuKyDaGuiTheoSheetPhoiHop_(tenSheet);
  var dsChuKyMoi = (dsCongViec || []).map(function(item) {
    return taoChuKyCongViecPhoiHop_(item);
  }).filter(Boolean);

  var bangCu = {};
  var bangMoi = {};

  dsChuKyCu.forEach(function(item) {
    bangCu[item] = true;
  });

  dsChuKyMoi.forEach(function(item) {
    bangMoi[item] = true;
  });

  var dsMoi = dsChuKyMoi.filter(function(item) {
    return !bangCu[item];
  });

  var dsBiXoa = dsChuKyCu.filter(function(item) {
    return !bangMoi[item];
  });

  var chiXoaBot = dsChuKyMoi.length > 0 && dsMoi.length === 0 && dsBiXoa.length > 0;

  return {
    dsChuKyCu: dsChuKyCu,
    dsChuKyMoi: dsChuKyMoi,
    soCongViecMoi: dsMoi.length,
    soCongViecBiXoa: dsBiXoa.length,
    chiXoaBot: chiXoaBot
  };
}

function docChuKyCongViecDaGuiPhatSinh_() {
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty(CAU_HINH_TONG_HOP_PHOI_HOP.KHOA_CHU_KY_PHAT_SINH_DA_GUI);

  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch (e) {
    Logger.log('Không đọc được chữ ký công việc đã gửi phát sinh: %s', e);
    return {};
  }
}

function luuChuKyCongViecDaGuiPhatSinh_(duLieu) {
  PropertiesService.getScriptProperties().setProperty(
    CAU_HINH_TONG_HOP_PHOI_HOP.KHOA_CHU_KY_PHAT_SINH_DA_GUI,
    JSON.stringify(duLieu || {})
  );
}

function layDanhSachChuKyDaGuiTheoSheetPhatSinh_(tenSheet) {
  var duLieu = docChuKyCongViecDaGuiPhatSinh_();
  return duLieu[tenSheet] || [];
}

function capNhatDanhSachChuKyDaGuiTheoSheetPhatSinh_(tenSheet, dsChuKy) {
  var duLieu = docChuKyCongViecDaGuiPhatSinh_();
  duLieu[tenSheet] = (dsChuKy || []).filter(function(item, index, arr) {
    return item && arr.indexOf(item) === index;
  });
  luuChuKyCongViecDaGuiPhatSinh_(duLieu);
}

function layPhanTichBienDongCongViecPhatSinh_(tenSheet, dsCongViec) {
  var dsChuKyCu = layDanhSachChuKyDaGuiTheoSheetPhatSinh_(tenSheet);
  var dsChuKyMoi = (dsCongViec || []).map(function(item) {
    return taoChuKyCongViecPhoiHop_(item);
  }).filter(Boolean);

  var bangCu = {};
  var bangMoi = {};

  dsChuKyCu.forEach(function(item) {
    bangCu[item] = true;
  });

  dsChuKyMoi.forEach(function(item) {
    bangMoi[item] = true;
  });

  var dsMoi = dsChuKyMoi.filter(function(item) {
    return !bangCu[item];
  });

  var dsBiXoa = dsChuKyCu.filter(function(item) {
    return !bangMoi[item];
  });

  var chiXoaBot = dsChuKyMoi.length > 0 && dsMoi.length === 0 && dsBiXoa.length > 0;

  return {
    dsChuKyCu: dsChuKyCu,
    dsChuKyMoi: dsChuKyMoi,
    soCongViecMoi: dsMoi.length,
    soCongViecBiXoa: dsBiXoa.length,
    chiXoaBot: chiXoaBot
  };
}

function taoChuKyCongViecNoiBo_(item) {
  return [
    item.vaiTro || '',
    item.sttTrongSheet || '',
    item.noiDung || '',
    item.maDuAn || '',
    item.mucTieuCuThe || '',
    item.capUuTien || '',
    item.thoiHan || ''
  ].join('|');
}

function docChuKyCongViecDaGuiNoiBo_() {
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty(CAU_HINH_TONG_HOP_PHOI_HOP.KHOA_CHU_KY_NOI_BO_DA_GUI);

  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch (e) {
    Logger.log('Không đọc được chữ ký công việc đã gửi nội bộ: %s', e);
    return {};
  }
}

function luuChuKyCongViecDaGuiNoiBo_(duLieu) {
  PropertiesService.getScriptProperties().setProperty(
    CAU_HINH_TONG_HOP_PHOI_HOP.KHOA_CHU_KY_NOI_BO_DA_GUI,
    JSON.stringify(duLieu || {})
  );
}

function layDanhSachChuKyDaGuiTheoSheetVaNhanSuNoiBo_(tenSheet, tenNhanSu) {
  var duLieu = docChuKyCongViecDaGuiNoiBo_();
  var khoaSheet = chuanHoaChuoi_(tenSheet);
  var khoaNhanSu = chuanHoaChuoi_(tenNhanSu);
  return (((duLieu[khoaSheet] || {})[khoaNhanSu]) || []);
}

function capNhatDanhSachChuKyDaGuiTheoSheetVaNhanSuNoiBo_(tenSheet, tenNhanSu, dsChuKy) {
  var duLieu = docChuKyCongViecDaGuiNoiBo_();
  var khoaSheet = chuanHoaChuoi_(tenSheet);
  var khoaNhanSu = chuanHoaChuoi_(tenNhanSu);

  if (!duLieu[khoaSheet]) {
    duLieu[khoaSheet] = {};
  }

  duLieu[khoaSheet][khoaNhanSu] = (dsChuKy || []).filter(function(item, index, arr) {
    return item && arr.indexOf(item) === index;
  });

  luuChuKyCongViecDaGuiNoiBo_(duLieu);
}

function layPhanTichBienDongCongViecNoiBo_(tenSheet, tenNhanSu, dsCongViec) {
  var dsChuKyCu = layDanhSachChuKyDaGuiTheoSheetVaNhanSuNoiBo_(tenSheet, tenNhanSu);
  var dsChuKyMoi = (dsCongViec || []).map(function(item) {
    return taoChuKyCongViecNoiBo_(item);
  }).filter(Boolean);

  var bangCu = {};
  var dsMoi = [];

  dsChuKyCu.forEach(function(item) {
    bangCu[item] = true;
  });

  dsChuKyMoi.forEach(function(item) {
    if (!bangCu[item]) {
      dsMoi.push(item);
    }
  });

  return {
    dsChuKyCu: dsChuKyCu,
    dsChuKyMoi: dsChuKyMoi,
    soBienDongMoi: dsMoi.length,
    coThayDoi: dsChuKyMoi.length > 0 && dsMoi.length > 0
  };
}

function tachThongTinPhongBanVaThangTuTenSheet_(tenSheet) {
  var match = String(tenSheet || '').trim().match(/^(.+?)\s*[-–—]\s*T(0[1-9]|1[0-2])\.(\d{4})$/);
  if (!match) return null;

  return {
    phongLapKeHoach: String(match[1] || '').trim(),
    thang: match[2],
    nam: match[3],
    thangKeHoachText: match[2] + '.' + match[3]
  };
}

function taoHashNoiDungPhoiHop_(payload) {
  var raw = JSON.stringify(payload || {});
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, raw);

  return digest.map(function(b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function taoHoacDamBaoSheetLogPhoiHop_() {
  var ss = layBangTinhDangMo_();
  var sheet = ss.getSheetByName(CAU_HINH_TONG_HOP_PHOI_HOP.TEN_SHEET_LOG);

  if (!sheet) {
    sheet = ss.insertSheet(CAU_HINH_TONG_HOP_PHOI_HOP.TEN_SHEET_LOG);
    sheet.getRange(1, 1, 1, 11).setValues([[
      'ngay_gui',
      'ten_sheet',
      'phong_lap_ke_hoach',
      'thang_ke_hoach',
      'ds_doi_tuong_nhan',
      'ds_email_nhan',
      'so_cong_viec',
      'hash_noi_dung',
      'ma_dot_gui',
      'trang_thai',
      'ghi_chu'
    ]]);
    sheet.getRange(1, 1, 1, 11).setFontWeight('bold');
    sheet.autoResizeColumns(1, 11);
  }

  return sheet;
}

function escapeHtml_(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function timHashGanNhatTheoSheet_(tenSheet) {
  var sheetLog = taoHoacDamBaoSheetLogPhoiHop_();
  var dongCuoi = sheetLog.getLastRow();
  if (dongCuoi < 2) return '';

  var duLieu = sheetLog.getRange(2, 1, dongCuoi - 1, 11).getValues();

  for (var i = duLieu.length - 1; i >= 0; i--) {
    var row = duLieu[i];
    var tenSheetLog = layGiaTriAnToan_(row[1]);
    var hashLog = layGiaTriAnToan_(row[7]);
    var trangThai = layGiaTriAnToan_(row[9]);

    if (tenSheetLog === tenSheet && (trangThai === 'DA_GUI' || trangThai === 'DRY_RUN')) {
      return hashLog;
    }
  }

  return '';
}

function timLanGuiGanNhatTheoSheet_(tenSheet) {
  var sheetLog = taoHoacDamBaoSheetLogPhoiHop_();
  var dongCuoi = sheetLog.getLastRow();
  if (dongCuoi < 2) {
    return null;
  }

  var duLieu = sheetLog.getRange(2, 1, dongCuoi - 1, 11).getValues();

  for (var i = duLieu.length - 1; i >= 0; i--) {
    var row = duLieu[i];
    var tenSheetLog = layGiaTriAnToan_(row[1]);
    var trangThai = layGiaTriAnToan_(row[9]);
    var dsDoiTuongNhan = layGiaTriAnToan_(row[4]);
    var ngayGui = row[0];

    if (tenSheetLog !== tenSheet) {
      continue;
    }

    if (trangThai !== 'DA_GUI' && trangThai !== 'DRY_RUN') {
      continue;
    }

    if (Object.prototype.toString.call(ngayGui) !== '[object Date]' || isNaN(ngayGui)) {
      continue;
    }

    return {
      ngayGui: ngayGui,
      nguoiNhan: dsDoiTuongNhan
    };
  }

  return null;
}

function taoKhoaGuiGanNhatTheoSheetPhoiHop_(tenSheet) {
  return CAU_HINH_TONG_HOP_PHOI_HOP.KHOA_GUI_GAN_NHAT + '_' + chuanHoaChuoi_(tenSheet);
}

function layLanGuiGanNhatTheoSheetPhoiHop_(tenSheet) {
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty(taoKhoaGuiGanNhatTheoSheetPhoiHop_(tenSheet));

  if (raw) {
    try {
      var duLieu = JSON.parse(raw);
      var ngayGui = duLieu && duLieu.ngayGui ? new Date(duLieu.ngayGui) : null;
      if (ngayGui && !isNaN(ngayGui)) {
        return {
          ngayGui: ngayGui,
          nguoiNhan: layGiaTriAnToan_(duLieu.nguoiNhan)
        };
      }
    } catch (e) {
      Logger.log('Không đọc được state gửi gần nhất theo sheet: %s', e);
    }
  }

  return timLanGuiGanNhatTheoSheet_(tenSheet);
}

function capNhatLanGuiGanNhatTheoSheetPhoiHop_(tenSheet, ngayGui, nguoiNhan) {
  var props = PropertiesService.getScriptProperties();
  props.setProperty(
    taoKhoaGuiGanNhatTheoSheetPhoiHop_(tenSheet),
    JSON.stringify({
      ngayGui: (ngayGui instanceof Date ? ngayGui : new Date()).toISOString(),
      nguoiNhan: layGiaTriAnToan_(nguoiNhan)
    })
  );
}

function coCanhBaoGuiGanNhat_(ngayGuiGanNhat, hienTai) {
  if (Object.prototype.toString.call(ngayGuiGanNhat) !== '[object Date]' || isNaN(ngayGuiGanNhat)) {
    return false;
  }

  var mocHienTai = hienTai instanceof Date ? hienTai : new Date();
  var soPhut = CAU_HINH_TONG_HOP_PHOI_HOP.SO_PHUT_CANH_BAO_GUI_GAN_NHAT || 5;
  return (mocHienTai.getTime() - ngayGuiGanNhat.getTime()) < soPhut * 60 * 1000;
}

function ghiLogGuiTongHopPhoiHop_(banGhi) {
  var sheetLog = taoHoacDamBaoSheetLogPhoiHop_();
  var dongMoi = sheetLog.getLastRow() + 1;

  sheetLog.getRange(dongMoi, 1, 1, 11).setValues([[
    banGhi.ngayGui,
    banGhi.tenSheet,
    banGhi.phongLapKeHoach,
    banGhi.thangKeHoach,
    banGhi.dsDoiTuongNhan,
    banGhi.dsEmailNhan,
    banGhi.soCongViec,
    banGhi.hashNoiDung,
    banGhi.maDotGui,
    banGhi.trangThai,
    banGhi.ghiChu
  ]]);
}

function timDongBatDauPhatSinh_(sheet) {
  var dongCuoi = sheet.getLastRow();
  if (dongCuoi < CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet) {
    return 0;
  }

  var soDong = dongCuoi - CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet + 1;
  var duLieuCotB = sheet.getRange(
    CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet,
    CAU_HINH_EMAIL_PHOI_HOP.cotNoiDung,
    soDong,
    1
  ).getDisplayValues();

  for (var i = 0; i < duLieuCotB.length; i++) {
    var giaTri = String(duLieuCotB[i][0] || '').trim();
    if (giaTri === 'Công tác phát sinh khác trong kỳ') {
      return CAU_HINH_EMAIL_PHOI_HOP.dongBatDauQuet + i + 1;
    }
  }

  return 0;
}

function layDanhSachEmailNhanPhatSinhTongHop_(chuTri, phoiHop, banDoNhanSu, banDoPhongBan, tenPhongLoaiTru) {
  var dsEmail = [];
  var dsDoiTuong = [];

  var chuTriChuan = chuanHoaChuoi_(chuTri);
  if (chuTriChuan && banDoNhanSu[chuTriChuan] && banDoNhanSu[chuTriChuan].emailCaNhan) {
    dsEmail.push(banDoNhanSu[chuTriChuan].emailCaNhan);
    dsDoiTuong.push(banDoNhanSu[chuTriChuan].tenNhanSu || chuTri);
  }

  var dsPhoiHop = layDanhSachKhoiPhoiHopTheoMasterData_(phoiHop, banDoPhongBan, tenPhongLoaiTru);
  dsPhoiHop.forEach(function(item) {
    dsEmail.push(item.email);
    dsDoiTuong.push(item.tenPhong);
  });

  return {
    dsEmail: hopNhatEmail_(dsEmail),
    dsDoiTuong: dsDoiTuong.filter(function(item, index, arr) {
      return arr.indexOf(item) === index;
    })
  };
}

function layDanhSachEmailNhanPhoiHopThuongTongHop_(phoiHop, banDoPhongBan, tenPhongLoaiTru) {
  var dsEmail = [];
  var dsDoiTuong = [];

  var dsPhoiHop = layDanhSachKhoiPhoiHopTheoMasterData_(phoiHop, banDoPhongBan, tenPhongLoaiTru);
  dsPhoiHop.forEach(function(item) {
    dsEmail.push(item.email);
    dsDoiTuong.push(item.tenPhong);
  });

  return {
    dsEmail: hopNhatEmail_(dsEmail),
    dsDoiTuong: dsDoiTuong.filter(function(item, index, arr) {
      return arr.indexOf(item) === index;
    })
  };
}

function taoNoiDungMailTongHopPhoiHopChoMotSheet_(thamSo) {
  var tenSheet = thamSo.tenSheet;
  var phongLapKeHoach = thamSo.phongLapKeHoach;
  var thangKeHoach = thamSo.thangKeHoach;
  var dsDoiTuongNhan = thamSo.dsDoiTuongNhan || [];
  var dsCongViec = thamSo.dsCongViec || [];
  var cheDoGui = thamSo.cheDoGui || 'PHOI_HOP_KE_HOACH';
  var thoiDiemChotText = thamSo.thoiDiemChotText || Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "H'h' 'ngày' dd/MM/yyyy"
  );
  var doiTuongNhanText = dsDoiTuongNhan.length ? dsDoiTuongNhan.join(', ') : 'Theo danh sách phối hợp';
  var bangTheoPhong = {};

  dsDoiTuongNhan.forEach(function(tenPhong) {
    bangTheoPhong[tenPhong] = [];
  });

  dsCongViec.forEach(function(item) {
    var dsPhong = item.dsDoiTuongPhoiHop || [];
    dsPhong.forEach(function(tenPhong) {
      if (!bangTheoPhong[tenPhong]) {
        bangTheoPhong[tenPhong] = [];
      }

      var dsPhoiHopKhac = dsPhong.filter(function(itemPhong) {
        return itemPhong !== tenPhong;
      });

      bangTheoPhong[tenPhong].push({
        dong: item.dong,
        loai: item.loai,
        noiDung: item.noiDung,
        maDuAn: item.maDuAn,
        mucTieuCuThe: item.mucTieuCuThe,
        capUuTien: item.capUuTien,
        thoiHanText: item.thoiHanText,
        chuTri: item.chuTri,
        phoiHopCung: dsPhoiHopKhac.join(', ')
      });
    });
  });

  var laPhatSinh = cheDoGui === 'PHAT_SINH';
  var tieuDe = laPhatSinh
    ? '[Phát sinh trong kỳ tháng ' + thangKeHoach + '] ' + phongLapKeHoach + ' - ' + dsCongViec.length + ' công việc mới/điều chỉnh'
    : '[Phối hợp kế hoạch tháng ' + thangKeHoach + '] ' + phongLapKeHoach + ' - ' + dsCongViec.length + ' công việc mới/điều chỉnh';

  var dsSectionText = [];
  var dsSectionHtml = [];
  var sttMuc = 0;

  dsDoiTuongNhan.forEach(function(tenPhongNhan) {
    var dsViecTheoPhong = bangTheoPhong[tenPhongNhan] || [];
    if (!dsViecTheoPhong.length) {
      return;
    }

    sttMuc++;
    var cacDongText = dsViecTheoPhong.map(function(item, index) {
      var dongText = (index + 1) + '. ' + (item.noiDung || '');
      if (laPhatSinh) {
        dongText += '\n   - Loại: ' + (item.loai || '');
      }
      dongText += '\n   - Mã dự án: ' + (item.maDuAn || '');
      dongText += '\n   - Mục tiêu/KQ cụ thể: ' + (item.mucTieuCuThe || '');
      dongText += '\n   - Cấp ưu tiên: ' + (item.capUuTien || '');
      dongText += '\n   - Thời hạn: ' + (item.thoiHanText || '');
      dongText += '\n   - Chủ trì: ' + (item.chuTri || '');
      if (item.phoiHopCung) {
        dongText += '\n   - Phối hợp cùng: ' + item.phoiHopCung;
      }
      return dongText;
    }).join('\n');

    var rowsHtml = dsViecTheoPhong.map(function(item, index) {
      return '<tr>' +
        '<td style="border:1px solid #ccc;padding:6px;">' + (index + 1) + '</td>' +
        (laPhatSinh
          ? '<td style="border:1px solid #ccc;padding:6px;">' + escapeHtml_(item.loai || '') + '</td>'
          : '') +
        '<td style="border:1px solid #ccc;padding:6px;">' + escapeHtml_(item.noiDung || '') + '</td>' +
        '<td style="border:1px solid #ccc;padding:6px;">' + escapeHtml_(item.maDuAn || '') + '</td>' +
        '<td style="border:1px solid #ccc;padding:6px;">' + escapeHtml_(item.mucTieuCuThe || '') + '</td>' +
        '<td style="border:1px solid #ccc;padding:6px;">' + escapeHtml_(item.capUuTien || '') + '</td>' +
        '<td style="border:1px solid #ccc;padding:6px;">' + escapeHtml_(item.thoiHanText || '') + '</td>' +
        '<td style="border:1px solid #ccc;padding:6px;">' + escapeHtml_(item.chuTri || '') + '</td>' +
        '<td style="border:1px solid #ccc;padding:6px;">' + escapeHtml_(item.phoiHopCung || '') + '</td>' +
        '</tr>';
    }).join('');

    dsSectionText.push(
      sttMuc + '. Danh sách việc cần ' + tenPhongNhan + ' phối hợp:\n' + cacDongText
    );

    dsSectionHtml.push(
      '<h3>' + sttMuc + '. Danh sách việc cần ' + escapeHtml_(tenPhongNhan) + ' phối hợp</h3>' +
      '<table style="border-collapse:collapse;border:1px solid #ccc;margin-bottom:16px;">' +
        '<tr>' +
          '<th style="border:1px solid #ccc;padding:6px;">STT</th>' +
          (laPhatSinh
            ? '<th style="border:1px solid #ccc;padding:6px;">Loại</th>'
            : '') +
          '<th style="border:1px solid #ccc;padding:6px;">Nội dung công việc</th>' +
          '<th style="border:1px solid #ccc;padding:6px;">Mã dự án</th>' +
          '<th style="border:1px solid #ccc;padding:6px;">Mục tiêu/KQ cụ thể</th>' +
          '<th style="border:1px solid #ccc;padding:6px;">Cấp ưu tiên</th>' +
          '<th style="border:1px solid #ccc;padding:6px;">Thời hạn</th>' +
          '<th style="border:1px solid #ccc;padding:6px;">Chủ trì</th>' +
          '<th style="border:1px solid #ccc;padding:6px;">Phối hợp cùng</th>' +
        '</tr>' +
        rowsHtml +
      '</table>'
    );
  });

  var noiDungText =
    'Kính gửi Quý anh/chị,\n\n' +
    (laPhatSinh
      ? 'Phòng/ban ' + phongLapKeHoach + ' kính gửi Quý anh/chị danh sách tổng hợp các công việc phát sinh trong kỳ cần phối hợp, cập nhật đến ' + thoiDiemChotText + '.\n\n'
      : 'Phòng/ban ' + phongLapKeHoach + ' kính gửi Quý anh/chị danh sách tổng hợp các công việc mới hoặc điều chỉnh cần phối hợp trong kế hoạch tháng ' + thangKeHoach + ', cập nhật đến ' + thoiDiemChotText + '.\n\n') +
    'Đối tượng nhận: ' + doiTuongNhanText + '\n' +
    'Tổng số công việc: ' + dsCongViec.length + '\n' +
    'Sheet nguồn: ' + tenSheet + '\n\n' +
    dsSectionText.join('\n\n') + '\n\n' +
    'Kính đề nghị các phòng/ban, cá nhân liên quan rà soát, phối hợp và tổ chức thực hiện theo danh sách trên.\n\n' +
    'Trân trọng!\nHệ thống kế hoạch tháng';

  var noiDungHtml =
    '<p>Kính gửi Quý anh/chị,</p>' +
    (laPhatSinh
      ? '<p>Phòng/ban <b>' + escapeHtml_(phongLapKeHoach) + '</b> kính gửi Quý anh/chị danh sách tổng hợp các công việc phát sinh trong kỳ cần phối hợp, cập nhật đến <b>' + escapeHtml_(thoiDiemChotText) + '</b>.</p>'
      : '<p>Phòng/ban <b>' + escapeHtml_(phongLapKeHoach) + '</b> kính gửi Quý anh/chị danh sách tổng hợp các công việc mới hoặc điều chỉnh cần phối hợp trong kế hoạch tháng <b>' + escapeHtml_(thangKeHoach) + '</b>, cập nhật đến <b>' + escapeHtml_(thoiDiemChotText) + '</b>.</p>') +
    '<p><b>Đối tượng nhận:</b> ' + escapeHtml_(doiTuongNhanText) + '<br>' +
    '<b>Tổng số công việc:</b> ' + dsCongViec.length + '<br>' +
    '<b>Sheet nguồn:</b> ' + escapeHtml_(tenSheet) + '</p>' +
    dsSectionHtml.join('') +
    '<p>Kính đề nghị các phòng/ban, cá nhân liên quan rà soát, phối hợp và tổ chức thực hiện theo danh sách trên.</p>' +
    '<p>Trân trọng!<br>Hệ thống kế hoạch tháng</p>';

  return {
    tieuDe: tieuDe,
    noiDungText: noiDungText,
    noiDungHtml: noiDungHtml
  };
}

