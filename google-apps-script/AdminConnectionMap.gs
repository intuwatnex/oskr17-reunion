/**
 * OSKR17th Anniversary — Connection Map admin tools
 *
 * เรียกใช้ทีละฟังก์ชันเองจาก Editor (เลือกชื่อฟังก์ชันที่ dropdown ด้านบน แล้วกด Run)
 * ไม่ได้ผูกกับ doGet/doPost ของเว็บแอป — เป็นสคริปต์สำหรับทีมงานรันเองเท่านั้น
 *
 * import_raw (เตรียมเอง): ชีทที่มีคอลัมน์ email อย่างน้อย 1 คอลัมน์ — รายชื่อคนที่
 * ต้องการชวนเข้า Connection Map จะ match กับ "Form Responses 1" (registrations)
 * ด้วยอีเมล ถ้าไม่เจอแถวที่ match จะไม่สร้างข้อมูลลงทะเบียนใหม่ให้ (registrations
 * ต้องไม่ถูกแก้โครงสร้าง/เขียนทับ) แค่บันทึกผลไว้ในคอลัมน์ผลลัพธ์ข้าง ๆ ให้ทีมงานเช็ก
 */

/* ============================================================
   1) Bulk import จาก import_raw -> สร้าง/seed profiles(status=pending)
   ============================================================ */
function bulkImportFromRaw() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const rawSheet = ss.getSheetByName('import_raw');
  if (!rawSheet) {
    Logger.log('ไม่พบชีท "import_raw" — สร้างชีทนี้พร้อมคอลัมน์ email ก่อน');
    return;
  }

  const lastRow = rawSheet.getLastRow();
  const lastCol = Math.max(rawSheet.getLastColumn(), 1);
  const headers = rawSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const colIndex = buildColIndex(headers);
  const emailCol = colIndex['email'];
  if (emailCol === undefined) {
    Logger.log('ชีท "import_raw" ต้องมีคอลัมน์หัวข้อ "email"');
    return;
  }
  const resultCol = colIndex['result'] !== undefined ? colIndex['result'] : lastCol;
  if (colIndex['result'] === undefined) {
    rawSheet.getRange(1, resultCol + 1).setValue('result');
  }

  if (lastRow < 2) { Logger.log('import_raw ไม่มีข้อมูล'); return; }

  const regSheet = getTargetSheet();
  const regHeaders = regSheet.getRange(1, 1, 1, regSheet.getLastColumn()).getValues()[0];
  const regColIndex = buildColIndex(regHeaders);
  const regLastRow = regSheet.getLastRow();
  const regValues = regLastRow >= 2 ? regSheet.getRange(2, 1, regLastRow - 1, regSheet.getLastColumn()).getValues() : [];

  const rawValues = rawSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  let imported = 0, skippedNotFound = 0, skippedAlready = 0;

  rawValues.forEach((raw, i) => {
    const email = (raw[emailCol] || '').toString().trim().toLowerCase();
    const rowNumber = i + 2;
    if (!email) { rawSheet.getRange(rowNumber, resultCol + 1).setValue('ไม่มีอีเมล'); return; }

    const regRow = regValues.find((r) => (r[regColIndex['Email address']] || '').toString().trim().toLowerCase() === email);
    if (!regRow) {
      rawSheet.getRange(rowNumber, resultCol + 1).setValue('ไม่พบใน registrations');
      skippedNotFound++;
      return;
    }

    const regId = regRow[regColIndex['Registration ID']];
    if (!regId) {
      rawSheet.getRange(rowNumber, resultCol + 1).setValue('แถวยังไม่มี Registration ID (ยังไม่ประมวลผล)');
      skippedNotFound++;
      return;
    }

    const existingProfile = findProfileByRegId(regId);
    if (existingProfile && existingProfile.status && existingProfile.status !== 'pending') {
      rawSheet.getRange(rowNumber, resultCol + 1).setValue('มีอยู่แล้ว (' + existingProfile.status + ')');
      skippedAlready++;
      return;
    }

    upsertProfile(regId, { status: 'pending' });
    rawSheet.getRange(rowNumber, resultCol + 1).setValue('seed แล้ว: ' + regId);
    imported++;
  });

  Logger.log('Import เสร็จ: seed ใหม่ ' + imported + ' | ไม่พบใน registrations ' + skippedNotFound + ' | มีสถานะอยู่แล้ว ' + skippedAlready);
}

/* ============================================================
   2) ส่งอีเมลชวนยืนยันให้ทุกคนที่ status = pending
      (ใช้ทั้งตอนส่งรอบแรก และตอนส่ง reminder — เป็นฟังก์ชันเดียวกัน
      เพราะ reminder ก็คือส่งซ้ำให้เฉพาะคนที่ยังไม่ยืนยันเท่านั้น)
   ============================================================ */
function batchSendConfirmationEmails() { sendPendingConfirmationEmails(); }
function sendReminderEmails() { sendPendingConfirmationEmails(); }

function sendPendingConfirmationEmails() {
  const sheet = getProfilesSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) { Logger.log('ยังไม่มีข้อมูลใน profiles'); return; }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIndex = buildColIndex(headers);
  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  let sent = 0, skipped = 0;
  values.forEach((r) => {
    if (r[colIndex['status']] !== 'pending') return;
    const regId = r[colIndex['registration_id']];
    if (!regId) return;

    const found = findRowByRegId(regId);
    if (!found) { skipped++; return; }

    const { row, colIndex: regColIndex } = found;
    const email = row[regColIndex['Email address']];
    const name = row[regColIndex['ชื่อ-นามสกุล']];
    const editToken = row[regColIndex['Edit Token']];
    if (!email || !editToken) { skipped++; return; }

    sendConfirmLinkEmail(email, name, regId, editToken);
    sent++;
  });

  Logger.log('ส่งอีเมลชวนยืนยันแล้ว ' + sent + ' คน | ข้าม (ไม่มีอีเมล/ลิงก์) ' + skipped + ' คน');
}

/* ============================================================
   3) Export รายชื่อที่ยัง pending พร้อมเบอร์โทร ไปตามงานผ่าน SMS
   ============================================================ */
function exportPendingWithPhone() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const outName = 'pending_followup';
  let out = ss.getSheetByName(outName);
  if (out) out.clear(); else out = ss.insertSheet(outName);
  out.getRange(1, 1, 1, 4).setValues([['registration_id', 'full_name', 'phone', 'email']]);

  const sheet = getProfilesSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) { Logger.log('ยังไม่มีข้อมูลใน profiles'); return; }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIndex = buildColIndex(headers);
  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  const rows = [];
  values.forEach((r) => {
    if (r[colIndex['status']] !== 'pending') return;
    const regId = r[colIndex['registration_id']];
    const found = findRowByRegId(regId);
    if (!found) return;
    const { row, colIndex: regColIndex } = found;
    rows.push([
      regId,
      row[regColIndex['ชื่อ-นามสกุล']] || '',
      row[regColIndex['เบอร์โทรศัพท์']] || '',
      row[regColIndex['Email address']] || '',
    ]);
  });

  if (rows.length > 0) {
    out.getRange(2, 1, rows.length, 4).setValues(rows);
    out.getRange(2, 3, rows.length, 1).setNumberFormat('@'); // กันเบอร์โทรตัดเลข 0 นำหน้า
  }
  Logger.log('Export แล้ว ' + rows.length + ' คน ดูที่ชีท "' + outName + '"');
}

/* ============================================================
   4) สรุปจำนวนตามสถานะ + access_log ล่าสุด
   ============================================================ */
function showCounts() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const outName = 'admin_dashboard';
  let out = ss.getSheetByName(outName);
  if (out) out.clear(); else out = ss.insertSheet(outName);

  const sheet = getProfilesSheet();
  const lastRow = sheet.getLastRow();
  const counts = { pending: 0, active: 0, opted_out: 0 };
  if (lastRow >= 2) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const colIndex = buildColIndex(headers);
    const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    values.forEach((r) => {
      const status = r[colIndex['status']];
      if (status in counts) counts[status]++;
    });
  }

  out.getRange(1, 1, 4, 2).setValues([
    ['สถานะ', 'จำนวน'],
    ['pending', counts.pending],
    ['active', counts.active],
    ['opted_out', counts.opted_out],
  ]);

  const logSheet = getAccessLogSheet();
  const logLastRow = logSheet.getLastRow();
  out.getRange(6, 1, 1, 4).setValues([['access_log ล่าสุด (timestamp, viewer_id, target_id, action)', '', '', '']]);
  if (logLastRow >= 2) {
    const n = Math.min(50, logLastRow - 1);
    const startRow = logLastRow - n + 1;
    const recent = logSheet.getRange(startRow, 1, n, 4).getValues().reverse();
    out.getRange(7, 1, recent.length, 4).setValues(recent);
  }

  Logger.log('สรุป: pending=' + counts.pending + ' active=' + counts.active + ' opted_out=' + counts.opted_out + ' — ดูรายละเอียดที่ชีท "' + outName + '"');
}
