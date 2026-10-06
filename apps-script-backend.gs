/**
 * RUN FOR FLOWERS 花園路跑 — 報名後台
 * NID October Family Day｜2026.10.31（六）08:50–11:00｜大安森林公園環形迴廊
 *
 * 部署方式：
 *   1. script.google.com 新增專案，把這整份貼進 Code.gs
 *   2. 先執行一次 setupSheet()（會建立試算表，並建好「拾花巡禮」「安森秋跑」兩個分頁）
 *   3. 部署 → 新增部署作業 → 類型「網頁應用程式」
 *        執行身分：我     誰可以存取：所有人
 *   4. 複製 /exec 網址，貼到前端 index.html 的 SCRIPT_URL
 *
 *   ※ 部署必須用 events@nidrc.com 登入，asafa100m@gmail.com 只有編輯權沒有部署權。
 */

/* ══════════════ 設定 ══════════════ */

// 依組別分頁寫入；分頁名稱必須與前端 radio 的 value 完全一致
var SHEET_NAMES = { '拾花巡禮': '拾花巡禮', '安森秋跑': '安森秋跑' };

// 留空的話，setupSheet() 會自動建立一份新試算表並記住它的 ID。
// 若要指定既有試算表，把 ID 填進來。
var SHEET_ID = '';

// 管理頁密碼 —— 部署前請務必改掉，這組字串等於名單的鑰匙。
var ADMIN_KEY = 'CHANGE_ME_請改掉這組字串';

// 報名截止（與前端一致）
var REG_CLOSE_AT = new Date('2026-10-24T23:59:59+08:00');

// 非 NID 當期學員的費用，依組別
var FEE = { '拾花巡禮': 500, '安森秋跑': 0 };
var NON_MEMBER_LABEL = '非 NID 當期學員';
var CATEGORIES = ['拾花巡禮', '安森秋跑'];

var EVENT_NAME  = 'RUN FOR FLOWERS 花園路跑';
var EVENT_WHEN  = '2026/10/31（六）08:50–11:00';
var EVENT_WHERE = '大安森林公園・環形迴廊';
var MAIL_FROM   = 'NID RUN CLUB';

var LINE_OFFICIAL = 'https://page.line.me/eei8717i';
var LINE_GROUP    = 'https://line.me/ti/g2/5BBOmVbrCiD6m8Uzy6xigwzM1qihEJ_U0JUcKA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default';

var HEADERS = ['報名時間', '組別', '姓名', 'Email', '手機', '隸屬戰隊',
               '緊急聯絡人', '緊急聯絡人電話', '應繳費用', '繳費狀態', '備註'];

/* ══════════════ 試算表 ══════════════ */

function props_() { return PropertiesService.getScriptProperties(); }

function spreadsheet_() {
  var id = SHEET_ID || props_().getProperty('SHEET_ID');
  if (!id) throw new Error('還沒有試算表，請先執行一次 setupSheet()。');
  return SpreadsheetApp.openById(id);
}

function formatSheet_(sh) {
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    .setFontWeight('bold').setBackground('#1f2a24').setFontColor('#faf6f1');
  sh.setFrozenRows(1);
  var widths = [160, 110, 110, 230, 130, 140, 120, 150, 90, 100, 200];
  for (var i = 0; i < widths.length; i++) sh.setColumnWidth(i + 1, widths[i]);
  return sh;
}

/** 依組別取得對應分頁；沒有就建一個並排好版 */
function sheet_(category) {
  var name = SHEET_NAMES[category];
  if (!name) throw new Error('未知的組別：' + category);
  var ss = spreadsheet_();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = formatSheet_(ss.insertSheet(name));
  return sh;
}

/** 第一次使用請先手動執行這個函式。可重複執行，不會刪資料。 */
function setupSheet() {
  var id = SHEET_ID || props_().getProperty('SHEET_ID');
  var ss;
  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create('RUN FOR FLOWERS 報名名單');
    props_().setProperty('SHEET_ID', ss.getId());
    Logger.log('已建立試算表：' + ss.getUrl());
  }

  CATEGORIES.forEach(function (c) {
    var name = SHEET_NAMES[c];
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    formatSheet_(sh);
    Logger.log('分頁「' + name + '」目前 ' + Math.max(0, sh.getLastRow() - 1) + ' 筆');
  });

  Logger.log('試算表網址：' + ss.getUrl());
  Logger.log('總筆數：' + allRows_().length);
  return ss.getUrl();
}

/** 兩個分頁的資料列合併（不含表頭），依報名時間排序 */
function allRows_() {
  var ss = spreadsheet_();
  var out = [];
  CATEGORIES.forEach(function (c) {
    var sh = ss.getSheetByName(SHEET_NAMES[c]);
    if (!sh) return;
    var last = sh.getLastRow();
    if (last < 2) return;
    sh.getRange(2, 1, last - 1, HEADERS.length).getValues().forEach(function (r) {
      // getLastRow 有時會多報空列，用報名時間判斷是不是真的有資料
      if (String(r[0]).trim() !== '') out.push(r);
    });
  });
  out.sort(function (a, b) { return String(a[0]).localeCompare(String(b[0])); });
  return out;
}

/* ══════════════ 工具 ══════════════ */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function str_(v) { return String(v == null ? '' : v).trim(); }

function esc_(v) {
  return str_(v).replace(/[&<>"']/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
  });
}

function emailOk_(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str_(v)); }

function phoneOk_(v) {
  var d = str_(v).replace(/[^\d]/g, '');
  return d.length >= 8 && d.length <= 10 && d.charAt(0) === '0';
}

function feeFor_(category, club) {
  if (club !== NON_MEMBER_LABEL) return 0;
  return FEE[category] || 0;
}

function tz_() { return Session.getScriptTimeZone() || 'Asia/Taipei'; }

/* ══════════════ 報名寫入 ══════════════ */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json_({ status: 'error', message: '系統忙碌中，請稍後再試一次。' });
  }

  try {
    var d = JSON.parse(e.postData.contents);

    if (new Date() > REG_CLOSE_AT) {
      return json_({ status: 'closed',
        message: '報名已於 ' + Utilities.formatDate(REG_CLOSE_AT, tz_(), 'yyyy/MM/dd HH:mm') + ' 截止。' });
    }

    var category = str_(d.category);
    var name     = str_(d.name);
    var email    = str_(d.email).toLowerCase();
    var phone    = str_(d.phone);
    var club     = str_(d.club);
    var emgName  = str_(d.emgName);
    var emgPhone = str_(d.emgPhone);

    if (CATEGORIES.indexOf(category) < 0) return json_({ status: 'error', message: '組別不正確。' });
    if (!name)            return json_({ status: 'error', message: '請填寫姓名。' });
    if (!emailOk_(email)) return json_({ status: 'error', message: 'Email 格式不正確。' });
    if (!phoneOk_(phone)) return json_({ status: 'error', message: '手機號碼不正確。' });
    if (!club)            return json_({ status: 'error', message: '請選擇隸屬戰隊。' });
    if (!emgName)         return json_({ status: 'error', message: '請填寫緊急聯絡人。' });
    if (!phoneOk_(emgPhone)) return json_({ status: 'error', message: '緊急聯絡人電話不正確。' });

    // 重複報名：同一個 Email 只收一筆
    var rows = allRows_();
    for (var i = 0; i < rows.length; i++) {
      if (str_(rows[i][3]).toLowerCase() === email) {
        return json_({ status: 'error', code: 'dup_email', email: email,
          message: '這個 Email 已經報名過了。' });
      }
    }

    // 費用一律後端重算，不採用前端送來的數字
    var fee = feeFor_(category, club);

    sheet_(category).appendRow([
      Utilities.formatDate(new Date(), tz_(), 'yyyy/MM/dd HH:mm:ss'),
      category, name, email, phone, club, emgName, emgPhone,
      fee, fee ? '未繳' : '免費', ''
    ]);

    try {
      sendConfirm_({ category: category, name: name, email: email, phone: phone,
                     club: club, emgName: emgName, emgPhone: emgPhone, fee: fee });
    } catch (mailErr) {
      // 信寄不出去不該讓報名失敗，只記錄
      Logger.log('確認信寄送失敗：' + email + ' / ' + mailErr);
    }

    return json_({ status: 'ok', category: category, fee: fee });

  } catch (err) {
    Logger.log('doPost 例外：' + err);
    return json_({ status: 'error', message: '系統錯誤，請稍後再試或洽 NID 官方 LINE。' });
  } finally {
    lock.releaseLock();
  }
}

/* ══════════════ 確認信 ══════════════ */

function sendConfirm_(r) {
  var feeLine = r.fee
    ? '<b style="color:#b8395f">NT$' + r.fee + '</b>（當天報到時現場現金繳款）'
    : '<b style="color:#516c4b">免費</b>';

  var html =
    '<div style="font-family:-apple-system,\'Noto Sans TC\',Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2a24;line-height:1.75">' +
      '<div style="background:#16201b;color:#faf6f1;padding:28px 24px;border-radius:14px 14px 0 0">' +
        '<p style="margin:0 0 6px;font-size:12px;letter-spacing:.2em;color:#e0658a">NID OCTOBER FAMILY DAY</p>' +
        '<h1 style="margin:0;font-size:26px;font-weight:600">報名成功 🌷</h1>' +
      '</div>' +
      '<div style="border:1px solid #e4ddd2;border-top:0;border-radius:0 0 14px 14px;padding:26px 24px">' +
        '<p style="margin:0 0 18px;font-size:15px">' + esc_(r.name) + ' 你好，已經收到你的報名，以下是你填的資料：</p>' +
        '<table style="width:100%;border-collapse:collapse;font-size:14px">' +
          row_('組別', r.category) +
          row_('姓名', r.name) +
          row_('Email', r.email) +
          row_('手機', r.phone) +
          row_('隸屬戰隊', r.club) +
          row_('緊急聯絡人', r.emgName + '（' + r.emgPhone + '）') +
          '<tr><td style="padding:9px 0;color:#7a857d;width:120px">應繳費用</td>' +
            '<td style="padding:9px 0">' + feeLine + '</td></tr>' +
        '</table>' +
        '<div style="background:#f3efe8;border-radius:12px;padding:18px;margin:22px 0">' +
          '<p style="margin:0 0 6px;font-size:15px"><b>活動資訊</b></p>' +
          '<p style="margin:0;font-size:14px">' + EVENT_WHEN + '<br>' + EVENT_WHERE + '<br>08:50 開始報到</p>' +
        '</div>' +
        '<div style="background:#f0d9df;border-radius:12px;padding:18px;margin:0 0 22px">' +
          '<p style="margin:0;font-size:14px;color:#8d2546">' +
            '⚠️ 花材需事先向花店預訂，<b>報名後不得更換組別，活動當天也不接受臨時換組</b>。' +
          '</p>' +
        '</div>' +
        '<p style="margin:0 0 18px;font-size:14px">當天集合地點與注意事項會公告在活動 LINE 社群，記得加入：</p>' +
        '<p style="margin:0 0 22px">' +
          '<a href="' + LINE_GROUP + '" style="display:inline-block;background:#06c755;color:#fff;' +
          'text-decoration:none;font-weight:700;padding:12px 26px;border-radius:999px;font-size:15px">加入活動 LINE 社群</a>' +
        '</p>' +
        '<p style="margin:0;font-size:13px;color:#7a857d">' +
          '需要取消或修改資料，請洽 <a href="' + LINE_OFFICIAL + '" style="color:#b8395f">NID 官方 LINE</a>。<br>' +
          '這封信是系統自動寄出，請勿直接回覆。' +
        '</p>' +
      '</div>' +
    '</div>';

  var text =
    '【' + EVENT_NAME + '】報名成功\n\n' +
    r.name + ' 你好，已經收到你的報名。\n\n' +
    '組別：' + r.category + '\n' +
    'Email：' + r.email + '\n' +
    '手機：' + r.phone + '\n' +
    '隸屬戰隊：' + r.club + '\n' +
    '緊急聯絡人：' + r.emgName + '（' + r.emgPhone + '）\n' +
    '應繳費用：' + (r.fee ? 'NT$' + r.fee + '（當天現場現金繳款）' : '免費') + '\n\n' +
    '活動時間：' + EVENT_WHEN + '\n' +
    '活動地點：' + EVENT_WHERE + '（08:50 開始報到）\n\n' +
    '※ 花材需事先預訂，報名後不得更換組別，當天也不接受臨時換組。\n\n' +
    '活動 LINE 社群：' + LINE_GROUP + '\n' +
    'NID 官方 LINE：' + LINE_OFFICIAL + '\n';

  MailApp.sendEmail({
    to: r.email,
    subject: '【' + EVENT_NAME + '】報名成功 — ' + r.category,
    body: text,
    htmlBody: html,
    name: MAIL_FROM
  });
}

function row_(k, v) {
  return '<tr><td style="padding:9px 0;color:#7a857d;width:120px">' + esc_(k) + '</td>' +
         '<td style="padding:9px 0"><b>' + esc_(v) + '</b></td></tr>';
}

/* ══════════════ 後台檢視 ══════════════ */

function doGet(e) {
  var p = (e && e.parameter) || {};
  var action = p.action || '';

  if (action === 'list' || action === 'stats') {
    if (p.key !== ADMIN_KEY) {
      return HtmlService.createHtmlOutput('<p style="font-family:sans-serif;padding:40px">密碼不正確。</p>');
    }
    return action === 'list' ? listPage_() : json_(statsObj_());
  }

  if (action === 'count') {
    return json_({ status: 'ok', count: allRows_().length });
  }

  return ContentService.createTextOutput(
    EVENT_NAME + ' 報名後台運作中。\n' +
    '名單：?action=list&key=你的密碼'
  );
}

function statsObj_() {
  var rows = allRows_();
  var byCat = {}, byClub = {}, unpaid = 0, due = 0;
  CATEGORIES.forEach(function (c) { byCat[c] = 0; });
  rows.forEach(function (r) {
    byCat[r[1]] = (byCat[r[1]] || 0) + 1;
    byClub[r[5]] = (byClub[r[5]] || 0) + 1;
    if (Number(r[8]) > 0) { due += Number(r[8]); if (str_(r[9]) !== '已繳') unpaid++; }
  });
  var ss = spreadsheet_(), sheetCounts = {};
  CATEGORIES.forEach(function (c) {
    var sh = ss.getSheetByName(SHEET_NAMES[c]);
    sheetCounts[SHEET_NAMES[c]] = sh ? Math.max(0, sh.getLastRow() - 1) : 0;
  });
  return { status: 'ok', total: rows.length, byCategory: byCat, byClub: byClub,
           bySheet: sheetCounts, feeDue: due, unpaidCount: unpaid };
}

function listPage_() {
  var rows = allRows_();
  var s = statsObj_();

  var html =
    '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>報名名單｜' + esc_(EVENT_NAME) + '</title><style>' +
    'body{font-family:-apple-system,"Noto Sans TC",Arial,sans-serif;background:#faf6f1;color:#1f2a24;' +
    'margin:0;padding:24px;line-height:1.6}' +
    '.wrap{max-width:1200px;margin:0 auto}' +
    'h1{font-size:24px;margin:0 0 4px}.sub{color:#7a857d;font-size:14px;margin:0 0 22px}' +
    '.cards{display:flex;flex-wrap:wrap;gap:12px;margin:0 0 22px}' +
    '.card{background:#fff;border:1px solid #e4ddd2;border-radius:12px;padding:14px 18px;min-width:130px}' +
    '.card .k{font-size:12px;color:#7a857d;margin:0 0 4px}' +
    '.card .v{font-size:24px;font-weight:800;margin:0}' +
    'table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e4ddd2;' +
    'border-radius:12px;overflow:hidden;font-size:13.5px}' +
    'th{background:#1f2a24;color:#faf6f1;text-align:left;padding:10px 12px;white-space:nowrap}' +
    'td{padding:10px 12px;border-top:1px solid #efe9e0;vertical-align:top}' +
    'tr:nth-child(even) td{background:#faf8f5}' +
    '.tag{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:700}' +
    '.t1{background:#f0d9df;color:#8d2546}.t2{background:#e8efe6;color:#2f4a2b}' +
    '.unpaid{color:#b8395f;font-weight:700}' +
    '.empty{background:#fff;border:1px solid #e4ddd2;border-radius:12px;padding:40px;text-align:center;color:#7a857d}' +
    '</style></head><body><div class="wrap">' +
    '<h1>報名名單</h1>' +
    '<p class="sub">' + esc_(EVENT_NAME) + '｜' + esc_(EVENT_WHEN) +
    '　（更新時間 ' + Utilities.formatDate(new Date(), tz_(), 'yyyy/MM/dd HH:mm') + '）</p>' +
    '<div class="cards">' +
      card_('總報名人數', s.total) +
      card_('拾花巡禮', s.byCategory['拾花巡禮'] || 0) +
      card_('安森秋跑', s.byCategory['安森秋跑'] || 0) +
      card_('應收金額', 'NT$' + s.feeDue) +
      card_('未繳費', s.unpaidCount) +
    '</div>';

  if (!rows.length) {
    html += '<div class="empty">目前還沒有人報名。</div>';
  } else {
    html += '<table><tr><th>#</th>';
    HEADERS.forEach(function (h) { html += '<th>' + esc_(h) + '</th>'; });
    html += '</tr>';
    rows.forEach(function (r, i) {
      html += '<tr><td>' + (i + 1) + '</td>';
      r.forEach(function (v, c) {
        if (c === 1) {
          html += '<td><span class="tag ' + (v === '拾花巡禮' ? 't1' : 't2') + '">' + esc_(v) + '</span></td>';
        } else if (c === 8) {
          html += '<td>' + (Number(v) > 0 ? 'NT$' + v : '—') + '</td>';
        } else if (c === 9) {
          html += '<td class="' + (str_(v) === '未繳' ? 'unpaid' : '') + '">' + esc_(v) + '</td>';
        } else {
          html += '<td>' + esc_(v) + '</td>';
        }
      });
      html += '</tr>';
    });
    html += '</table>';
  }

  html += '</div></body></html>';
  return HtmlService.createHtmlOutput(html)
    .setTitle('報名名單').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function card_(k, v) {
  return '<div class="card"><p class="k">' + esc_(k) + '</p><p class="v">' + esc_(v) + '</p></div>';
}

/* ══════════════ 手動維護用 ══════════════ */

/** 在 Apps Script 編輯器直接執行，印出試算表網址與目前筆數 */
function showStatus() {
  Logger.log('試算表：' + spreadsheet_().getUrl());
  Logger.log(JSON.stringify(statsObj_(), null, 2));
}

/** 重寄某個 Email 的確認信 */
function resendOne(email) {
  var target = str_(email).toLowerCase();
  var rows = allRows_();
  for (var i = 0; i < rows.length; i++) {
    if (str_(rows[i][3]).toLowerCase() === target) {
      sendConfirm_({ category: rows[i][1], name: rows[i][2], email: rows[i][3], phone: rows[i][4],
                     club: rows[i][5], emgName: rows[i][6], emgPhone: rows[i][7], fee: Number(rows[i][8]) });
      Logger.log('已重寄：' + target);
      return;
    }
  }
  Logger.log('找不到這個 Email：' + target);
}
