/**
 * オクタゴン 平日サブフロア 学生DJブッキング管理
 *
 * 使い方：
 *   1. Googleスプレッドシートを開き「拡張機能 → Apps Script」にこのファイルを貼り付けて保存
 *   2. 関数 setupBookingSheet を選んで「実行」（初回のみ権限の承認が必要）
 *
 * setupBookingSheet は何度実行しても、登録済みのデータを消さず、
 * 同じタブや同じトリガーを増やしません（見出し・書式・入力規則・条件付き書式を整え直します）。
 *
 * シートの共有設定は一切変更しません。
 */

// ============================================================
// 設定
// ============================================================

var SHEET = {
  GUIDE: '使い方',
  DJS: 'DJ一覧',
  INTRO: '紹介履歴',
  GIGS: '出演・集客管理',
  DAILY: '日別集計',
};

var ID_PREFIX = 'DJ-';
var ID_DIGITS = 4;
var PROP_LAST_ID = 'BOOKING_LAST_DJ_ID';
var EDIT_HANDLER = 'onBookingSheetEdit';
var MIN_ROWS = 1000;
var PROTECT_TAG = '[ブッキング管理] ';
var NOTE_TAG = '[自動] ';

var CHOICES = {
  KUBUN: ['未定', '単発', 'レギュラー'],
  DJ_STATUS: ['候補', '連絡済', '返信待ち', '条件調整中', '出演OK', '見送り'],
  GIG_STATUS: ['打診中', '仮押さえ', '確定', '出演済', 'キャンセル'],
  GUEST: ['未提出', '提出済', '不要'],
};

var COLOR = {
  HEADER_INPUT: '#1c1c1e', // 入力列の見出し（黒）
  HEADER_CALC: '#4a4a4f', // 自動列の見出し（濃いグレー）
  HEADER_TEXT: '#ffffff',
  CALC_BG: '#eeeff1', // 自動計算列（淡いグレー）
  BODY: '#ffffff',
  ACCENT: '#2e6b6e', // 落ち着いたアクセント（深いティール）
  ACCENT_LIGHT: '#e2eeee',
  TEXT: '#202124',
  MUTED: '#8a8d91',
  DUP: '#f4cccc', // 重複・名簿にないID（淡い赤）
  MISSING: '#fce8b2', // 入力漏れ（淡い黄）
  SAME_DAY: '#e1d5f0', // 同じ営業日・同じDJ（淡い紫）
  OK: '#d9ead3', // 出演OK・確定（淡い緑）
  DONE: '#d6e4f0', // 出演済（淡い青）
};

// 列定義（kind: input=入力列 / auto=自動発行 / calc=自動計算）
// DJ一覧
var DJ_COLS = [
  { h: 'DJ ID', kind: 'auto', w: 78, note: '新規登録時に自動発行されます（DJ名かInstagram IDを入力すると発行）。変更・削除しないでください。' },
  { h: 'DJ名・活動名', kind: 'input', w: 150 },
  { h: '年齢', kind: 'input', w: 52 },
  { h: '大学名', kind: 'input', w: 130 },
  { h: '学部（任意）', kind: 'input', w: 110 },
  { h: 'Instagram ID', kind: 'input', w: 140, note: '@の有無・大文字小文字・前後の空白は区別しません。プロフィールURLを貼ってもOKです。' },
  { h: 'その他連絡先（任意）', kind: 'input', w: 150 },
  { h: 'メイン紹介者', kind: 'input', w: 110, note: '誰経由のDJか（主な紹介者）。紹介が複数ある場合は「紹介履歴」タブに1件ずつ追加します。' },
  { h: 'ブッキング担当者', kind: 'input', w: 110, note: '連絡・調整を担当する人。' },
  { h: '出演区分', kind: 'input', w: 90 },
  { h: '対応状況', kind: 'input', w: 100 },
  { h: '出演可能曜日・時間帯（任意）', kind: 'input', w: 170 },
  { h: '次のアクション・期限', kind: 'input', w: 190, note: '例：12/3までにDMで条件を返信' },
  { h: 'メモ', kind: 'input', w: 200 },
  { h: 'Instagramリンク（自動）', kind: 'calc', w: 150 },
  { h: 'Instagram正規化（自動）', kind: 'calc', w: 130, note: '重複判定に使う値です（@・空白を除き小文字化）。' },
  { h: '重複チェック（自動）', kind: 'calc', w: 170, note: '同じInstagram／同じDJ IDの行があると表示します。自動では削除・統合しません。' },
  { h: '紹介件数（自動）', kind: 'calc', w: 90 },
  { h: '確定・出演済の回数（自動）', kind: 'calc', w: 110 },
];

// 紹介履歴
var INTRO_COLS = [
  { h: '紹介日', kind: 'input', w: 100, note: 'DJ IDを選ぶと空欄なら今日の日付が入ります。' },
  { h: 'DJ ID', kind: 'input', w: 90, note: 'プルダウンから選択。DJ名やInstagram IDを入力しても、1人に特定できればIDに置き換わります。' },
  { h: 'DJ名（自動表示）', kind: 'calc', w: 150 },
  { h: '紹介者', kind: 'input', w: 120 },
  { h: 'メモ', kind: 'input', w: 240 },
];

// 出演・集客管理
var GIG_COLS = [
  { h: '営業日', kind: 'input', w: 100, note: '営業を開始した日付。深夜0時を過ぎる出演も開始日の日付で入力します（例：金曜24:30の出演→金曜の日付）。' },
  { h: '出演時間', kind: 'input', w: 110, note: '例：00:30〜01:00' },
  { h: 'DJ ID', kind: 'input', w: 90, note: 'プルダウンから選択。DJ名やInstagram IDを入力しても、1人に特定できればIDに置き換わります。' },
  { h: 'DJ名（自動表示）', kind: 'calc', w: 140 },
  { h: 'ブッキング担当者', kind: 'input', w: 110, note: '空欄でDJ IDを選ぶとDJ一覧の担当者が入ります。' },
  { h: '出演区分', kind: 'input', w: 90, note: '空欄でDJ IDを選ぶとDJ一覧の出演区分が入ります。' },
  { h: '出演状況', kind: 'input', w: 95 },
  { h: '店舗側の集客目標人数', kind: 'input', w: 100 },
  { h: 'DJ本人の集客コミット人数', kind: 'input', w: 110, note: 'DJ本人が合意した人数。空欄＝未確認、0＝確認済みの0人。' },
  { h: '実来場人数', kind: 'input', w: 90, note: '受付でそのDJ経由と確認できた人数。空欄＝未確認、0＝確認済みの0人。複数DJの名前が出た来場者は、受付で記録した1人のDJにだけ計上します。' },
  { h: 'コミットとの差（実来場−コミット）', kind: 'calc', w: 120 },
  { h: 'コミット達成率（実来場÷コミット）', kind: 'calc', w: 120, note: 'コミットが0または未入力、または実来場が未入力の場合は空欄です。' },
  { h: 'ゲストリスト提出状況', kind: 'input', w: 110 },
  { h: 'メモ', kind: 'input', w: 220 },
];

// 日別集計（すべて自動）
var DAILY_COLS = [
  { h: '営業日', kind: 'calc', w: 100 },
  { h: '曜日', kind: 'calc', w: 50 },
  { h: '確定枠数（確定・出演済）', kind: 'calc', w: 110 },
  { h: '学生DJ経由の集客コミット合計（確定・出演済）', kind: 'calc', w: 150, note: 'コミットが1件も入力されていない日は空欄。' },
  { h: 'コミット未入力枠数（確定・出演済）', kind: 'calc', w: 130 },
  { h: '学生DJ経由の実来場合計（出演済）', kind: 'calc', w: 140, note: '店舗全体の来場数ではありません。実来場が全件未入力の日は空欄。' },
  { h: '実来場未入力枠数（出演済）', kind: 'calc', w: 120 },
  { h: '学生DJ経由のコミット達成率', kind: 'calc', w: 130, note: '出演済で、実来場とコミットが入力済み・コミット1人以上の行だけを対象に「実来場合計÷コミット合計」。対象がなければ空欄。' },
];

// ============================================================
// 数式（見出し行に置く配列数式。並べ替え・行挿入でもずれない）
// ============================================================

function q_(sheetName) {
  return "'" + sheetName + "'!";
}

function djFormulas_() {
  var IN = q_(SHEET.INTRO);
  var GG = q_(SHEET.GIGS);
  return {
    // O: Instagramリンク
    15: '=ARRAYFORMULA(IF(ROW(P:P)=1,"' + DJ_COLS[14].h + '",IF(P:P="","",HYPERLINK("https://www.instagram.com/"&P:P&"/","@"&P:P))))',
    // P: 正規化（空白除去→URL除去→末尾の/?#以降除去→先頭@除去→小文字）
    16:
      '=ARRAYFORMULA(IF(ROW(F:F)=1,"' + DJ_COLS[15].h + '",IF(LEN(F:F)=0,"",LOWER(' +
      'REGEXREPLACE(REGEXREPLACE(REGEXREPLACE(REGEXREPLACE(F:F&"","[\\s　]+",""),' +
      '"(?i)^(https?://)?(www\\.)?instagram\\.com/",""),"[/?#].*$",""),"^[@＠]+","")))))',
    // Q: 重複チェック
    17:
      '=ARRAYFORMULA(IF(ROW(A:A)=1,"' + DJ_COLS[16].h + '",TRIM(' +
      'IF((A:A<>"")*(COUNTIF(A:A,A:A)>1),"⚠ DJ IDが重複 ","")&' +
      'IF((P:P<>"")*(COUNTIF(P:P,P:P)>1),"⚠ 同じInstagramが"&COUNTIF(P:P,P:P)&"件",""))))',
    // R: 紹介件数
    18: '=ARRAYFORMULA(IF(ROW(A:A)=1,"' + DJ_COLS[17].h + '",IF(A:A="","",COUNTIF(' + IN + 'B:B,A:A))))',
    // S: 確定・出演済の回数
    19:
      '=ARRAYFORMULA(IF(ROW(A:A)=1,"' + DJ_COLS[18].h + '",IF(A:A="","",' +
      'COUNTIFS(' + GG + 'C:C,A:A,' + GG + 'G:G,"確定")+COUNTIFS(' + GG + 'C:C,A:A,' + GG + 'G:G,"出演済"))))',
  };
}

function nameLookupFormula_(header, idCol) {
  var DJ = q_(SHEET.DJS);
  var c = idCol + ':' + idCol;
  return (
    '=ARRAYFORMULA(IF(ROW(' + c + ')=1,"' + header + '",IF(' + c + '="","",' +
    'IFERROR(VLOOKUP(' + c + ',' + DJ + 'A:B,2,FALSE)&"","⚠ 名簿にないID"))))'
  );
}

function introFormulas_() {
  return { 3: nameLookupFormula_(INTRO_COLS[2].h, 'B') };
}

function gigFormulas_() {
  return {
    4: nameLookupFormula_(GIG_COLS[3].h, 'C'),
    // K: 差（どちらかが空欄なら空欄）
    11: '=ARRAYFORMULA(IF(ROW(I:I)=1,"' + GIG_COLS[10].h + '",IF((I:I="")+(J:J="")>0,"",J:J-I:I)))',
    // L: 達成率（コミットが0・空欄、実来場が空欄なら空欄）
    12: '=ARRAYFORMULA(IF(ROW(I:I)=1,"' + GIG_COLS[11].h + '",IF((I:I="")+(J:J="")>0,"",IF(I:I=0,"",J:J/I:I))))',
  };
}

function dailyFormulas_() {
  var G = q_(SHEET.GIGS);
  var A = G + 'A:A', I = G + 'I:I', J = G + 'J:J', ST = G + 'G:G';
  function wrap(header, body) {
    return '=ARRAYFORMULA(IF(ROW(A:A)=1,"' + header + '",IF(A:A="","",' + body + ')))';
  }
  // 「確定」「出演済」の両方を数える
  function cs(extra) {
    return 'COUNTIFS(' + A + ',A:A,' + ST + ',"確定"' + extra + ')+COUNTIFS(' + A + ',A:A,' + ST + ',"出演済"' + extra + ')';
  }
  var doneTarget = ',' + ST + ',"出演済",' + J + ',"<>",' + I + ',">=1"';
  return {
    // A: 営業日一覧（キャンセルのみの日は出さない）
    1:
      '=VSTACK("' + DAILY_COLS[0].h + '",IFERROR(SORT(UNIQUE(FILTER(' + A + ',ISNUMBER(' + A + '),' + ST + '<>"キャンセル"))),""))',
    2: wrap(DAILY_COLS[1].h, 'MID("日月火水木金土",WEEKDAY(A:A),1)'),
    3: wrap(DAILY_COLS[2].h, cs('')),
    4: wrap(
      DAILY_COLS[3].h,
      'IF(' + cs(',' + I + ',"<>"') + '=0,"",' +
        'SUMIFS(' + I + ',' + A + ',A:A,' + ST + ',"確定")+SUMIFS(' + I + ',' + A + ',A:A,' + ST + ',"出演済"))'
    ),
    5: wrap(DAILY_COLS[4].h, cs(',' + I + ',""')),
    6: wrap(
      DAILY_COLS[5].h,
      'IF(COUNTIFS(' + A + ',A:A,' + ST + ',"出演済",' + J + ',"<>")=0,"",SUMIFS(' + J + ',' + A + ',A:A,' + ST + ',"出演済"))'
    ),
    7: wrap(DAILY_COLS[6].h, 'COUNTIFS(' + A + ',A:A,' + ST + ',"出演済",' + J + ',"")'),
    8: wrap(
      DAILY_COLS[7].h,
      'IF(COUNTIFS(' + A + ',A:A' + doneTarget + ')=0,"",' +
        'SUMIFS(' + J + ',' + A + ',A:A' + doneTarget + ')/SUMIFS(' + I + ',' + A + ',A:A' + doneTarget + '))'
    ),
  };
}

// ============================================================
// メニュー
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('ブッキング管理')
    .addItem('未発行のDJ IDを発行', 'issueMissingDjIds')
    .addSeparator()
    .addItem('初期設定を再実行（データは保持）', 'setupBookingSheet')
    .addToUi();
}

// ============================================================
// 初期設定（何度実行しても安全）
// ============================================================

function setupBookingSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  var log = [];
  try {
    var created = [];
    var guide = getOrCreateSheet_(ss, SHEET.GUIDE, created);
    var djs = getOrCreateSheet_(ss, SHEET.DJS, created);
    var intro = getOrCreateSheet_(ss, SHEET.INTRO, created);
    var gigs = getOrCreateSheet_(ss, SHEET.GIGS, created);
    var daily = getOrCreateSheet_(ss, SHEET.DAILY, created);

    // 既存データの見出しが想定と違う場合は何も変更せず停止する（データ保護）
    checkHeaders_(djs, DJ_COLS);
    checkHeaders_(intro, INTRO_COLS);
    checkHeaders_(gigs, GIG_COLS);

    if (created.length) {
      var order = [SHEET.GUIDE, SHEET.DJS, SHEET.INTRO, SHEET.GIGS, SHEET.DAILY];
      for (var i = 0; i < order.length; i++) {
        ss.setActiveSheet(ss.getSheetByName(order[i]));
        ss.moveActiveSheet(i + 1);
      }
      log.push('作成したタブ：' + created.join('、'));
    } else {
      log.push('新しく作成したタブはありません（既存タブを整え直しました）');
    }

    setupDjSheet_(djs);
    setupIntroSheet_(intro);
    setupGigSheet_(gigs);
    setupDailySheet_(daily);
    setupGuideSheet_(guide);

    removeEmptyDefaultSheet_(ss);

    var issued = issueMissingIds_(djs);
    if (issued) log.push('未発行だったDJ IDを ' + issued + ' 件発行しました');

    log.push(ensureEditTrigger_(ss));
    SpreadsheetApp.flush();
    ss.setActiveSheet(guide);
  } finally {
    lock.releaseLock();
  }
  var msg = '初期設定が完了しました。\n' + log.join('\n');
  Logger.log(msg);
  try {
    ss.toast(log.join(' / '), 'ブッキング管理', 8);
  } catch (err) {
    // エディタから実行した場合など、表示できなくても問題なし
  }
  return msg;
}

function getOrCreateSheet_(ss, name, created) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    created.push(name);
  }
  return sh;
}

function checkHeaders_(sheet, cols) {
  if (sheet.getLastRow() < 2) return; // データがなければ見出しを上書きしてよい
  var width = Math.min(cols.length, sheet.getMaxColumns());
  var current = sheet.getRange(1, 1, 1, width).getDisplayValues()[0];
  var bad = [];
  for (var c = 0; c < cols.length; c++) {
    if (cols[c].kind === 'calc') continue; // 自動列は数式で上書きする
    var v = c < width ? String(current[c]).trim() : '';
    if (v !== '' && v !== cols[c].h) bad.push(colLetter_(c + 1) + '列「' + v + '」（想定：「' + cols[c].h + '」）');
  }
  if (bad.length) {
    throw new Error(
      '「' + sheet.getName() + '」の見出しが想定と違うため、データ保護のため処理を中止しました。\n' + bad.join('\n') +
        '\n列の並びを元に戻してから再実行してください。'
    );
  }
}

function ensureSize_(sheet, rows, cols) {
  if (sheet.getMaxRows() < rows) sheet.insertRowsAfter(sheet.getMaxRows(), rows - sheet.getMaxRows());
  if (sheet.getMaxColumns() < cols) sheet.insertColumnsAfter(sheet.getMaxColumns(), cols - sheet.getMaxColumns());
}

/** 見出し・数式・列幅・色・保護などシート共通の整形 */
function applyLayout_(sheet, cols, formulas, opts) {
  opts = opts || {};
  ensureSize_(sheet, MIN_ROWS, cols.length);
  var rows = sheet.getMaxRows();
  var n = cols.length;

  // 見出し（入力列は文字、自動列は配列数式）
  for (var c = 0; c < n; c++) {
    var cell = sheet.getRange(1, c + 1);
    var f = formulas[c + 1];
    if (f) {
      cell.setFormula(f);
    } else {
      // 想定外の値は checkHeaders_ で止めているので、ここでは空欄・一致のみ
      cell.setValue(cols[c].h);
    }
    cell.setNote(cols[c].note || '');
    sheet.setColumnWidth(c + 1, cols[c].w);
  }

  var header = sheet.getRange(1, 1, 1, n);
  header
    .setFontWeight('bold')
    .setFontColor(COLOR.HEADER_TEXT)
    .setBackground(COLOR.HEADER_INPUT)
    .setWrap(true)
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('center');
  sheet.setRowHeight(1, 48);
  sheet.setFrozenRows(1);
  if (opts.frozenCols !== undefined) sheet.setFrozenColumns(opts.frozenCols);

  var body = sheet.getRange(2, 1, rows - 1, n);
  body.setBackground(COLOR.BODY).setFontColor(COLOR.TEXT).setVerticalAlignment('middle');

  for (var k = 0; k < n; k++) {
    if (cols[k].kind !== 'input') {
      sheet.getRange(1, k + 1).setBackground(COLOR.HEADER_CALC);
      sheet.getRange(2, k + 1, rows - 1, 1).setBackground(COLOR.CALC_BG);
    }
  }

  // 自動列は「警告のみ」の保護（共有範囲・編集権限は変更しない）
  var olds = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  for (var p = 0; p < olds.length; p++) {
    if (String(olds[p].getDescription()).indexOf(PROTECT_TAG) === 0) olds[p].remove();
  }
  var protectHeader = sheet.getRange(1, 1, 1, n).protect();
  protectHeader.setDescription(PROTECT_TAG + '見出し行').setWarningOnly(true);
  for (var m = 0; m < n; m++) {
    if (cols[m].kind === 'input') continue;
    var pr = sheet.getRange(2, m + 1, rows - 1, 1).protect();
    pr.setDescription(PROTECT_TAG + cols[m].h + '（自動）').setWarningOnly(true);
  }

  if (opts.filter && !sheet.getFilter()) {
    sheet.getRange(1, 1, rows, n).createFilter();
  }
}

function setupDjSheet_(sh) {
  applyLayout_(sh, DJ_COLS, djFormulas_(), { filter: true, frozenCols: 2 });
  var rows = sh.getMaxRows() - 1;
  // 書式（電話番号の先頭0やIDが数値化されないよう文字列に）
  sh.getRange(2, 1, rows, 1).setNumberFormat('@').setHorizontalAlignment('center');
  sh.getRange(2, 3, rows, 1).setNumberFormat('0').setHorizontalAlignment('center');
  sh.getRange(2, 6, rows, 2).setNumberFormat('@');
  sh.getRange(2, 10, rows, 2).setHorizontalAlignment('center');
  sh.getRange(2, 12, rows, 3).setWrap(true);
  sh.getRange(2, 18, rows, 2).setHorizontalAlignment('center');

  // 入力規則
  sh.getRange(2, 3, rows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireFormulaSatisfied('=AND(ISNUMBER(C2),C2=INT(C2),C2>=10,C2<=99)')
      .setAllowInvalid(false)
      .setHelpText('年齢は整数（10〜99）で入力してください。')
      .build()
  );
  sh.getRange(2, 10, rows, 1).setDataValidation(listRule_(CHOICES.KUBUN));
  sh.getRange(2, 11, rows, 1).setDataValidation(listRule_(CHOICES.DJ_STATUS));

  var R = function (a1) {
    return sh.getRange(a1);
  };
  var last = sh.getMaxRows();
  var rules = [
    cfFormula_('=AND($A2<>"",COUNTIF($A:$A,$A2)>1)', [R('A2:A' + last)], COLOR.DUP, '#9c1c1c'),
    cfFormula_('=AND($P2<>"",COUNTIF($P:$P,$P2)>1)', [R('F2:F' + last), R('O2:Q' + last)], COLOR.DUP, '#9c1c1c'),
    cfText_('出演OK', [R('K2:K' + last)], COLOR.OK, '#1e5631'),
    cfText_('条件調整中', [R('K2:K' + last)], COLOR.MISSING, null),
    cfText_('返信待ち', [R('K2:K' + last)], COLOR.ACCENT_LIGHT, null),
    cfText_('レギュラー', [R('J2:J' + last)], COLOR.ACCENT_LIGHT, COLOR.ACCENT),
    cfFormula_('=$K2="見送り"', [R('A2:N' + last)], null, COLOR.MUTED),
  ];
  sh.setConditionalFormatRules(rules);
}

function setupIntroSheet_(sh) {
  applyLayout_(sh, INTRO_COLS, introFormulas_(), { filter: true, frozenCols: 0 });
  var rows = sh.getMaxRows() - 1;
  var last = sh.getMaxRows();
  sh.getRange(2, 1, rows, 1).setNumberFormat('yyyy/mm/dd').setHorizontalAlignment('center');
  sh.getRange(2, 2, rows, 1).setNumberFormat('@').setHorizontalAlignment('center');
  sh.getRange(2, 5, rows, 1).setWrap(true);
  sh.getRange(2, 1, rows, 1).setDataValidation(dateRule_());
  sh.getRange(2, 2, rows, 1).setDataValidation(idRule_());
  sh.setConditionalFormatRules([
    cfFormula_(notInRosterFormula_('B'), [sh.getRange('B2:C' + last)], COLOR.DUP, '#9c1c1c'),
  ]);
}

function setupGigSheet_(sh) {
  applyLayout_(sh, GIG_COLS, gigFormulas_(), { filter: true, frozenCols: 0 });
  var rows = sh.getMaxRows() - 1;
  var last = sh.getMaxRows();
  sh.getRange(2, 1, rows, 1).setNumberFormat('yyyy/mm/dd').setHorizontalAlignment('center');
  sh.getRange(2, 2, rows, 2).setNumberFormat('@').setHorizontalAlignment('center');
  sh.getRange(2, 6, rows, 2).setHorizontalAlignment('center');
  sh.getRange(2, 8, rows, 3).setNumberFormat('0').setHorizontalAlignment('center');
  sh.getRange(2, 11, rows, 1).setNumberFormat('+0;-0;0').setHorizontalAlignment('center');
  sh.getRange(2, 12, rows, 1).setNumberFormat('0%').setHorizontalAlignment('center');
  sh.getRange(2, 13, rows, 1).setHorizontalAlignment('center');
  sh.getRange(2, 14, rows, 1).setWrap(true);

  sh.getRange(2, 1, rows, 1).setDataValidation(dateRule_());
  sh.getRange(2, 2, rows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireFormulaSatisfied('=REGEXMATCH(TO_TEXT(B2),"^\\d{1,2}:\\d{2}\\s*[〜~～\\-－]\\s*\\d{1,2}:\\d{2}$")')
      .setAllowInvalid(true)
      .setHelpText('「00:30〜01:00」の形式で入力してください。')
      .build()
  );
  sh.getRange(2, 3, rows, 1).setDataValidation(idRule_());
  sh.getRange(2, 6, rows, 1).setDataValidation(listRule_(CHOICES.KUBUN));
  sh.getRange(2, 7, rows, 1).setDataValidation(listRule_(CHOICES.GIG_STATUS));
  sh.getRange(2, 8, rows, 3).setDataValidation(countRule_('H2'));
  sh.getRange(2, 13, rows, 1).setDataValidation(listRule_(CHOICES.GUEST));

  var R = function (a1) {
    return sh.getRange(a1);
  };
  sh.setConditionalFormatRules([
    cfFormula_(notInRosterFormula_('C'), [R('C2:D' + last)], COLOR.DUP, '#9c1c1c'),
    cfFormula_('=AND(OR($G2="確定",$G2="出演済"),$I2="")', [R('I2:I' + last)], COLOR.MISSING, null),
    cfFormula_('=AND($G2="出演済",$J2="")', [R('J2:J' + last)], COLOR.MISSING, null),
    cfFormula_('=AND($A2<>"",$C2<>"",COUNTIFS($A:$A,$A2,$C:$C,$C2)>1)', [R('A2:A' + last), R('C2:D' + last)], COLOR.SAME_DAY, null),
    cfText_('確定', [R('G2:G' + last)], COLOR.OK, '#1e5631'),
    cfText_('出演済', [R('G2:G' + last)], COLOR.DONE, '#1c3f66'),
    cfFormula_('=$G2="キャンセル"', [R('A2:N' + last)], null, COLOR.MUTED),
  ]);
}

function setupDailySheet_(sh) {
  // 日別集計は全列自動。既存の内容は数式で上書きして整える（入力データは持たない）
  applyLayout_(sh, DAILY_COLS, dailyFormulas_(), { filter: false, frozenCols: 1 });
  var rows = sh.getMaxRows() - 1;
  sh.getRange(2, 1, rows, 1).setNumberFormat('yyyy/mm/dd');
  sh.getRange(2, 1, rows, 8).setHorizontalAlignment('center');
  sh.getRange(2, 3, rows, 5).setNumberFormat('0');
  sh.getRange(2, 8, rows, 1).setNumberFormat('0%');
  sh.getRange(1, 1, 1, 8).setBackground(COLOR.HEADER_INPUT);
  sh.getRange(2, 1, rows, 8).setBackground(COLOR.BODY);
  sh.getRange(2, 1, rows, 1).setFontWeight('bold');
  var last = sh.getMaxRows();
  sh.setConditionalFormatRules([
    cfFormula_('=AND($A2<>"",OR($E2>0,$G2>0))', [sh.getRange('E2:E' + last), sh.getRange('G2:G' + last)], COLOR.MISSING, null),
    cfFormula_('=AND($A2<>"",ISNUMBER($H2))', [sh.getRange('H2:H' + last)], COLOR.ACCENT_LIGHT, COLOR.ACCENT),
  ]);
}

// ---- 入力規則・条件付き書式のヘルパー ----

function listRule_(items) {
  return SpreadsheetApp.newDataValidation().requireValueInList(items, true).setAllowInvalid(false).build();
}

function dateRule_() {
  return SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .setHelpText('日付（例：2026/12/04）を入力してください。')
    .build();
}

function idRule_() {
  var dj = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.DJS);
  return SpreadsheetApp.newDataValidation()
    .requireValueInRange(dj.getRange('A2:A'), true)
    .setAllowInvalid(true) // DJ名・Instagram IDの入力を受け付け、スクリプトがIDに置き換える
    .setHelpText('DJ一覧のDJ IDを選択してください（DJ名・Instagram IDを入力しても、1人に特定できればIDに置き換わります）。')
    .build();
}

function countRule_(topLeft) {
  return SpreadsheetApp.newDataValidation()
    .requireFormulaSatisfied('=AND(ISNUMBER(' + topLeft + '),' + topLeft + '>=0,' + topLeft + '=INT(' + topLeft + '))')
    .setAllowInvalid(false)
    .setHelpText('0以上の整数で入力してください。未確認なら空欄、確認済みで0人なら0。')
    .build();
}

function notInRosterFormula_(col) {
  return '=AND($' + col + '2<>"",COUNTIF(INDIRECT("\'' + SHEET.DJS + '\'!A:A"),$' + col + '2)=0)';
}

function cfFormula_(formula, ranges, bg, font) {
  var b = SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(formula).setRanges(ranges);
  if (bg) b.setBackground(bg);
  if (font) b.setFontColor(font);
  return b.build();
}

function cfText_(text, ranges, bg, font) {
  var b = SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(text).setRanges(ranges);
  if (bg) b.setBackground(bg);
  if (font) b.setFontColor(font);
  return b.build();
}

function colLetter_(n) {
  var s = '';
  while (n > 0) {
    var m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** 新規スプレッドシートに残る空の「シート1」を、空のときだけ削除する */
function removeEmptyDefaultSheet_(ss) {
  var ours = [SHEET.GUIDE, SHEET.DJS, SHEET.INTRO, SHEET.GIGS, SHEET.DAILY];
  var defaults = ['シート1', 'Sheet1'];
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sh = sheets[i];
    if (ours.indexOf(sh.getName()) >= 0 || defaults.indexOf(sh.getName()) < 0) continue;
    if (sh.getLastRow() === 0 && sh.getLastColumn() === 0 && ss.getSheets().length > 1) ss.deleteSheet(sh);
  }
}

/** 編集時トリガーを1つだけ用意する（既にあれば作らない） */
function ensureEditTrigger_(ss) {
  var found = ScriptApp.getProjectTriggers().filter(function (t) {
    return t.getHandlerFunction() === EDIT_HANDLER && t.getEventType() === ScriptApp.EventType.ON_EDIT;
  });
  if (found.length === 0) {
    ScriptApp.newTrigger(EDIT_HANDLER).forSpreadsheet(ss).onEdit().create();
    return '編集時トリガーを作成しました';
  }
  for (var i = 1; i < found.length; i++) ScriptApp.deleteTrigger(found[i]); // 万一の重複を整理
  return '編集時トリガーは設定済みです（追加していません）';
}

// ============================================================
// 使い方タブ
// ============================================================

function setupGuideSheet_(sh) {
  var L = [
    ['title', 'オクタゴン 平日サブフロア 学生DJブッキング管理'],
    ['p', '学生DJの紹介・打診・出演確定を複数の担当者で管理し、出演日ごとの「集客コミット人数」と「実際の来場人数（学生DJ経由）」を把握するためのシートです。'],
    ['h', '⚠ 共有について'],
    ['p', '年齢・大学名・連絡先を含みます。共有は運用に関わる担当者だけに限定し、「リンクを知っている全員」での共有や外部への転送はしないでください。来場者の氏名・連絡先は記録しません。'],
    ['h', '基本の流れ'],
    ['li', '① DJの新規登録：「DJ一覧」の空いている行にDJ名・Instagram IDなどを入力 → DJ IDが自動で入ります。'],
    ['li', '② 紹介の追加：「紹介履歴」に1件1行で、紹介日・DJ ID（プルダウン）・紹介者を入力。同じDJを別の人が紹介したら、同じDJ IDでもう1行追加します。'],
    ['li', '③ 出演の登録：「出演・集客管理」に1出演1行で、営業日・出演時間・DJ ID・出演状況などを入力。レギュラーDJも出演日ごとに1行追加します。DJ本人と合意したら「集客コミット人数」を入力します。'],
    ['li', '④ 来場結果の入力：営業後、受付でそのDJ経由と確認できた人数を「実来場人数」に入力し、出演状況を「出演済」にします。結果は「日別集計」に自動で反映されます。'],
    ['h', '入力ルール'],
    ['li', '空欄＝未確認、0＝確認済みの0人。分からないときは0を入れず空欄のままにします。'],
    ['li', '営業日は「その営業を開始した日付」。深夜0時を過ぎる出演も開始日で入力します（例：金曜の営業で24:30〜の出演 → 金曜の日付）。'],
    ['li', '出演時間は「00:30〜01:00」の形式で入力します。'],
    ['li', '実来場人数は、受付でそのDJ経由と確認できた来場者数です。複数のDJの名前を挙げた来場者は、受付で記録した1人のDJにだけ計上し、二重に数えません。'],
    ['li', 'キャンセルになった出演は行を消さず、出演状況を「キャンセル」にします（すべての集計から除外されます）。'],
    ['li', 'DJ IDはプルダウンから選びます。DJ名やInstagram IDを入力しても、1人に特定できればIDに置き換わります（候補が複数ならセルのメモに候補が表示されます）。名前が同じDJがいても、紐づけはDJ IDで行います。'],
    ['li', 'グレーの列は自動計算です。入力しないでください（入力すると「#REF!」になります。その場合は入力した値を消せば戻ります）。'],
    ['h', 'DJ IDと重複'],
    ['li', 'DJ IDは新規登録時に一度だけ発行され、並べ替えやDJ名の変更では変わりません。IDを書き換えると元に戻ります。'],
    ['li', 'Instagram IDは「@」の有無・大文字小文字・前後の空白を区別せずに比べ、同じ人の可能性がある行を赤く表示します。自動で削除・統合はしません。担当者同士で確認し、同一人物なら片方を「見送り」にしてメモに「DJ-0000と同一」のように残し、紹介履歴・出演のDJ IDを付け替えてください。'],
    ['li', '行をコピーしてDJ IDが重複した場合（赤表示）は、新しい方の行のDJ IDセルを削除すると新しいIDが発行されます。'],
    ['h', '色の意味'],
    ['color', COLOR.CALC_BG, '自動計算・自動表示の列（入力不要）'],
    ['color', COLOR.DUP, '重複候補（Instagram・DJ ID）／名簿にないDJ ID'],
    ['color', COLOR.MISSING, '入力漏れ：確定・出演済でコミット未入力、出演済で実来場未入力'],
    ['color', COLOR.SAME_DAY, '同じ営業日に同じDJの出演行が複数ある（確認用）'],
    ['color', COLOR.OK, '確定／出演OK'],
    ['color', COLOR.DONE, '出演済'],
    ['h', '日別集計の見方'],
    ['li', '営業日ごとに自動表示します。キャンセルはすべての集計から除外されます。人数は「学生DJ経由」の数で、店舗全体の来場数ではありません。'],
    ['li', '確定枠数・コミット合計・コミット未入力枠数は「確定」「出演済」の枠が対象。実来場合計・実来場未入力枠数は「出演済」の枠が対象です。実来場（またはコミット）が1件も入力されていない日は合計を空欄にします。'],
    ['li', 'コミット達成率＝（出演済で、実来場とコミットが入力済み・コミット1人以上の行の実来場合計）÷（同じ行のコミット合計）。対象行がなければ空欄です。'],
    ['h', '困ったとき'],
    ['li', 'DJ IDが入らない：上部メニュー「ブッキング管理 → 未発行のDJ IDを発行」を実行（スマホアプリではメニューが出ないため、PCで実行するか、DJ名を入力し直してください）。'],
    ['li', 'このタブは初期設定の再実行で書き直されます。メモはこのタブに書かないでください。'],
  ];

  ensureSize_(sh, Math.max(L.length + 2, 50), 2);
  var all = sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns());
  all.breakApart();
  sh.clear();
  all.clearNote();
  sh.setColumnWidth(1, 28);
  sh.setColumnWidth(2, 560);
  sh.setFrozenRows(0);
  sh.setHiddenGridlines(true);
  sh.getRange(1, 1, sh.getMaxRows(), 2).setBackground(COLOR.BODY).setFontColor(COLOR.TEXT).setWrap(true).setVerticalAlignment('middle');

  for (var i = 0; i < L.length; i++) {
    var r = i + 1;
    var type = L[i][0];
    var a = sh.getRange(r, 1);
    var b = sh.getRange(r, 2);
    if (type === 'title') {
      sh.getRange(r, 1, 1, 2).merge().setValue(L[i][1]).setFontSize(14).setFontWeight('bold')
        .setFontColor(COLOR.HEADER_TEXT).setBackground(COLOR.HEADER_INPUT);
      sh.setRowHeight(r, 40);
    } else if (type === 'h') {
      sh.getRange(r, 1, 1, 2).merge().setValue(L[i][1]).setFontWeight('bold').setFontColor(COLOR.ACCENT)
        .setBackground(COLOR.ACCENT_LIGHT);
      sh.setRowHeight(r, 28);
    } else if (type === 'color') {
      a.setBackground(L[i][1]);
      b.setValue(L[i][2]);
    } else {
      b.setValue(L[i][1]);
    }
  }
  var pr = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  for (var p = 0; p < pr.length; p++) {
    if (String(pr[p].getDescription()).indexOf(PROTECT_TAG) === 0) pr[p].remove();
  }
  sh.protect().setDescription(PROTECT_TAG + '使い方').setWarningOnly(true);
}

// ============================================================
// DJ ID の発行
// ============================================================

function formatId_(n) {
  var s = String(n);
  while (s.length < ID_DIGITS) s = '0' + s;
  return ID_PREFIX + s;
}

function parseIdNumber_(v) {
  var m = String(v).trim().match(/^DJ-(\d+)$/);
  return m ? Number(m[1]) : 0;
}

/**
 * DJ一覧で、DJ名またはInstagram IDがあるのにDJ IDが空の行へIDを発行する。
 * 呼び出し側でドキュメントロックを取得しておくこと。
 * 連番は「保存済みの最終番号」と「シート上の最大番号」の大きい方から続けるので、
 * 行削除後の再利用・同時登録・複数行貼り付けでも重複しない。
 */
function issueMissingIds_(sheet) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var vals = sheet.getRange(2, 1, last - 1, 14).getValues();
  var maxN = 0;
  for (var i = 0; i < vals.length; i++) maxN = Math.max(maxN, parseIdNumber_(vals[i][0]));
  var props = PropertiesService.getDocumentProperties();
  var counter = Math.max(Number(props.getProperty(PROP_LAST_ID)) || 0, maxN);

  var targets = [];
  for (var r = 0; r < vals.length; r++) {
    var id = String(vals[r][0]).trim();
    var name = String(vals[r][1]).trim();
    var ig = String(vals[r][5]).trim();
    if (id === '' && (name !== '' || ig !== '')) {
      counter++;
      targets.push({
        row: r + 2,
        id: formatId_(counter),
        kubun: String(vals[r][9]).trim() || CHOICES.KUBUN[0],
        status: String(vals[r][10]).trim() || CHOICES.DJ_STATUS[0],
      });
    }
  }
  if (!targets.length) {
    if (counter > (Number(props.getProperty(PROP_LAST_ID)) || 0)) props.setProperty(PROP_LAST_ID, String(counter));
    return 0;
  }
  // 先に番号を確定させてから書き込む（途中で失敗しても番号は再利用されない）
  props.setProperty(PROP_LAST_ID, String(counter));

  // 連続する行はまとめて書き込む
  var start = 0;
  for (var t = 1; t <= targets.length; t++) {
    if (t === targets.length || targets[t].row !== targets[t - 1].row + 1) {
      var group = targets.slice(start, t);
      sheet.getRange(group[0].row, 1, group.length, 1).setValues(group.map(function (g) {
        return [g.id];
      }));
      sheet.getRange(group[0].row, 10, group.length, 2).setValues(group.map(function (g) {
        return [g.kubun, g.status];
      }));
      start = t;
    }
  }
  return targets.length;
}

/** メニューから手動で実行 */
function issueMissingDjIds() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  var n;
  try {
    n = issueMissingIds_(ss.getSheetByName(SHEET.DJS));
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  ss.toast(n ? n + '件のDJ IDを発行しました' : '未発行の行はありません', 'ブッキング管理', 5);
  return n;
}

// ============================================================
// 編集時トリガー（setupBookingSheet が1つだけ作成）
// ============================================================

function onBookingSheetEdit(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  var name = sheet.getName();
  if (name !== SHEET.DJS && name !== SHEET.INTRO && name !== SHEET.GIGS) return;
  if (e.range.getLastRow() < 2) return; // 見出し行のみの編集

  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) {
    e.source.toast('混み合っているため自動処理をスキップしました。少し待ってから再入力してください。', 'ブッキング管理', 5);
    return;
  }
  try {
    if (name === SHEET.DJS) {
      handleDjEdit_(sheet, e);
    } else {
      handleRefEdit_(sheet, e, name === SHEET.INTRO ? 2 : 3, name);
    }
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
}

function handleDjEdit_(sheet, e) {
  var rg = e.range;
  // 1セルだけのDJ ID書き換え・削除は元に戻す（コピーで重複したIDを消した場合は除く）
  if (rg.getNumRows() === 1 && rg.getNumColumns() === 1 && rg.getColumn() === 1 && rg.getRow() >= 2) {
    var old = e.oldValue === undefined || e.oldValue === null ? '' : String(e.oldValue).trim();
    var cur = String(rg.getDisplayValue()).trim();
    if (parseIdNumber_(old) > 0 && cur !== old) {
      var ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getDisplayValues();
      var others = 0;
      for (var i = 0; i < ids.length; i++) {
        if (i + 2 !== rg.getRow() && String(ids[i][0]).trim() === old) others++;
      }
      if (others === 0) {
        rg.setValue(old);
        e.source.toast('DJ IDは変更できないため元に戻しました（' + old + '）', 'ブッキング管理', 5);
        return;
      }
    }
  }
  var n = issueMissingIds_(sheet);
  if (n) e.source.toast(n + '件のDJ IDを発行しました', 'ブッキング管理', 3);
}

// ---- DJ IDの参照（紹介履歴・出演） ----

function normalizeIg_(v) {
  return String(v)
    .replace(/[\s　]+/g, '')
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, '')
    .replace(/[\/?#].*$/, '')
    .replace(/^[@＠]+/, '')
    .toLowerCase();
}

function normalizeName_(v) {
  var s = String(v);
  if (s.normalize) s = s.normalize('NFKC');
  return s.replace(/[\s　]+/g, ' ').trim().toLowerCase();
}

function loadRoster_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.DJS);
  var last = sh.getLastRow();
  var roster = { byId: {}, byIg: {}, byName: {} };
  if (last < 2) return roster;
  var vals = sh.getRange(2, 1, last - 1, 14).getValues();
  for (var i = 0; i < vals.length; i++) {
    var id = String(vals[i][0]).trim();
    if (!parseIdNumber_(id)) continue;
    var rec = { id: id, name: String(vals[i][1]).trim(), booker: String(vals[i][8]).trim(), kubun: String(vals[i][9]).trim() };
    roster.byId[id] = rec;
    var ig = normalizeIg_(vals[i][5]);
    if (ig) (roster.byIg[ig] = roster.byIg[ig] || []).push(id);
    var nm = normalizeName_(vals[i][1]);
    if (nm) (roster.byName[nm] = roster.byName[nm] || []).push(id);
  }
  return roster;
}

/** 入力値をDJ IDに解決する。{id} / {candidates:[...]} / null */
function resolveDjRef_(raw, roster) {
  var v = String(raw).trim();
  if (!v) return null;
  if (roster.byId[v]) return { id: v };
  var m = v.normalize ? v.normalize('NFKC').match(/^dj[\s\-_ー]?0*(\d+)$/i) : null;
  if (m) {
    var id = formatId_(Number(m[1]));
    if (roster.byId[id]) return { id: id };
  }
  var lists = [roster.byIg[normalizeIg_(v)], roster.byName[normalizeName_(v)]];
  for (var i = 0; i < lists.length; i++) {
    var list = uniq_(lists[i] || []);
    if (list.length === 1) return { id: list[0] };
    if (list.length > 1) return { candidates: list };
  }
  return null;
}

function uniq_(arr) {
  var seen = {};
  return arr.filter(function (x) {
    if (seen[x]) return false;
    seen[x] = true;
    return true;
  });
}

function handleRefEdit_(sheet, e, idCol, name) {
  var rg = e.range;
  if (rg.getColumn() > idCol || rg.getLastColumn() < idCol) return;
  var r0 = Math.max(rg.getRow(), 2);
  var r1 = rg.getLastRow();
  var n = r1 - r0 + 1;
  var width = name === SHEET.INTRO ? INTRO_COLS.length : GIG_COLS.length;
  var vals = sheet.getRange(r0, 1, n, width).getValues();
  var idRange = sheet.getRange(r0, idCol, n, 1);
  var notes = idRange.getNotes();
  var roster = loadRoster_();
  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  var unresolved = 0;

  for (var i = 0; i < n; i++) {
    var row = r0 + i;
    var raw = String(vals[i][idCol - 1]).trim();
    var cell = sheet.getRange(row, idCol);
    var ourNote = String(notes[i][0]).indexOf(NOTE_TAG) === 0;
    if (!raw) {
      if (ourNote) cell.setNote('');
      continue;
    }
    var res = resolveDjRef_(raw, roster);
    if (!res) {
      unresolved++;
      if (ourNote) cell.setNote('');
      continue;
    }
    if (res.candidates) {
      cell.setNote(
        NOTE_TAG + '候補が複数あります。DJ IDを選び直してください：\n' +
          res.candidates.map(function (id) {
            return id + '（' + roster.byId[id].name + '）';
          }).join('\n')
      );
      unresolved++;
      continue;
    }
    if (res.id !== raw) cell.setValue(res.id);
    if (ourNote) cell.setNote('');

    var dj = roster.byId[res.id];
    if (name === SHEET.INTRO) {
      if (vals[i][0] === '' || vals[i][0] === null) {
        sheet.getRange(row, 1).setValue(Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd'));
      }
    } else {
      if (String(vals[i][4]).trim() === '' && dj.booker) sheet.getRange(row, 5).setValue(dj.booker);
      if (String(vals[i][5]).trim() === '' && CHOICES.KUBUN.indexOf(dj.kubun) >= 0) sheet.getRange(row, 6).setValue(dj.kubun);
    }
  }
  if (unresolved) {
    e.source.toast('DJ IDを特定できない行が ' + unresolved + ' 件あります（赤色のセル）', 'ブッキング管理', 5);
  }
}
