/**
 * OSKR17th Anniversary — รหัสผ่านสำหรับ manage.html
 *
 * ลิงก์อีเมล (id + Edit Token) พิสูจน์ว่าเป็นเจ้าของอีเมลได้ครั้งเดียวตอนคลิก
 * แต่ตัวลิงก์เองอาจหลุด/ถูกส่งต่อได้ (ค้างอยู่ในกล่องจดหมาย เปิดจากคอมฯ ที่ใช้
 * ร่วมกัน ฯลฯ) ฟีเจอร์นี้เพิ่มรหัสผ่านเป็นอีกชั้น: ครั้งแรกที่คลิกลิงก์ (ยังไม่มี
 * Password Hash ในแถว) จะบังคับให้ตั้งรหัสผ่านก่อน ครั้งถัด ๆ ไปต้องกรอกรหัสผ่าน
 * ทุกครั้งถึงจะเห็น/แก้ไขข้อมูลได้ (ดู handleLookup ใน Code.gs ที่คืนแค่
 * authStage ไม่คืนโปรไฟล์) — คนละเรื่องกับ handleLogin/handleReveal ใน
 * ConnectionMap.gs ซึ่งเป็นการล็อกอินดู Connection Map ด้วย Registration ID
 * อย่างเดียว (ไม่มีรหัสผ่าน)
 *
 * Apps Script ไม่มี bcrypt/scrypt ให้ใช้ — hashPassword() ด้านล่างเป็น KDF
 * ทำเองแบบง่าย: iterate HMAC-SHA256 ผูกกับ salt สุ่มต่อแถว (2000 รอบ) เก็บ
 * salt/hash แยกคอลัมน์ ไม่เก็บรหัสผ่านจริงเด็ดขาด
 *
 * Rate limit ใช้ sheet access_log เดียวกับ ConnectionMap.gs (getAccessLogSheet/
 * logAccess ประกาศไว้ที่นั่น เรียกใช้ร่วมกันได้เพราะทุกไฟล์ .gs ใน Apps Script
 * project เดียวกันแชร์ global scope):
 * - verifyPassword ผิดเกิน MANAGE_LOGIN_FAIL_LIMIT ครั้ง/คน/วัน -> ล็อกชั่วคราว
 * - forgotPassword เกิน PASSWORD_RESET_REQUEST_LIMIT ครั้ง/คน/วัน -> กันสแปมอีเมล
 */

const PASSWORD_MIN_LENGTH = 8;
const MANAGE_LOGIN_FAIL_LIMIT = 10;
const PASSWORD_RESET_REQUEST_LIMIT = 5;
const PASSWORD_RESET_EXPIRY_MS = 30 * 60 * 1000; // ลิงก์รีเซ็ตหมดอายุใน 30 นาที

/* ============================================================
   Password hashing helpers
   ============================================================ */
function generateSalt() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
}

function bytesToHex(bytes) {
  return bytes.map((b) => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');
}

// PBKDF2-แบบง่าย: iterate HMAC-SHA256 ผูกกับ salt (ไม่มี bcrypt ให้ใช้ใน Apps Script)
function hashPassword(password, salt) {
  const iterations = 2000;
  let value = salt;
  for (let i = 0; i < iterations; i++) {
    value = bytesToHex(Utilities.computeHmacSha256Signature(value + password, salt));
  }
  return value;
}

function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// นับจำนวนครั้งของ action หนึ่ง ๆ ใน access_log ของวันนี้ (ใช้ sheet เดียวกับ
// ConnectionMap.gs — getAccessLogSheet()/logAccess() ประกาศไว้ที่นั่น)
function countTodayAccessLogActions(viewerId, action) {
  const sheet = getAccessLogSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const tz = Session.getScriptTimeZone() || 'Asia/Bangkok';
  const todayStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  let count = 0;
  values.forEach((r) => {
    const ts = r[0], vId = r[1], a = r[3];
    if (a !== action || vId !== viewerId || !(ts instanceof Date)) return;
    if (Utilities.formatDate(ts, tz, 'yyyy-MM-dd') === todayStr) count++;
  });
  return count;
}

/* ============================================================
   POST action=setPassword  body: { id, token, password }
   ตั้งรหัสผ่านครั้งแรก — ถ้ามีรหัสผ่านอยู่แล้วปฏิเสธ (ให้ไปหน้า login/forgot แทน)
   ============================================================ */
function handleSetPassword(data) {
  const found = findRowByToken(data.id, data.token);
  if (!found) return jsonOutput({ result: 'error', message: 'ไม่พบข้อมูล หรือลิงก์ไม่ถูกต้อง' });

  const { sheet, rowNumber, colIndex, row } = found;
  if (colIndex['Password Hash'] !== undefined && row[colIndex['Password Hash']]) {
    return jsonOutput({ result: 'error', code: 'already_set', message: 'ตั้งรหัสผ่านไปแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านที่ตั้งไว้' });
  }

  const password = (data.password || '').toString();
  if (password.length < PASSWORD_MIN_LENGTH) {
    return jsonOutput({ result: 'error', code: 'weak_password', message: 'รหัสผ่านต้องมีอย่างน้อย ' + PASSWORD_MIN_LENGTH + ' ตัวอักษร' });
  }

  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const ensureColumn = makeEnsureColumn(sheet, headers, colIndex);
  const salt = generateSalt();
  const hash = hashPassword(password, salt);
  sheet.getRange(rowNumber, ensureColumn('Password Salt') + 1).setValue(salt);
  sheet.getRange(rowNumber, ensureColumn('Password Hash') + 1).setValue(hash);

  return jsonOutput({ result: 'success', profile: buildManageProfile(found) });
}

/* ============================================================
   POST action=verifyPassword  body: { id, token, password }
   ============================================================ */
function handleVerifyPassword(data) {
  const found = findRowByToken(data.id, data.token);
  if (!found) return jsonOutput({ result: 'error', message: 'ไม่พบข้อมูล หรือลิงก์ไม่ถูกต้อง' });

  const regId = (data.id || '').toString();
  if (countTodayAccessLogActions(regId, 'manage_login_fail') >= MANAGE_LOGIN_FAIL_LIMIT) {
    return jsonOutput({ result: 'error', code: 'locked', message: 'กรอกรหัสผ่านผิดเกินกำหนดของวันนี้ กรุณาลองใหม่พรุ่งนี้ หรือกด "ลืมรหัสผ่าน"' });
  }

  const { row, colIndex } = found;
  const storedHash = colIndex['Password Hash'] !== undefined ? row[colIndex['Password Hash']] : '';
  const storedSalt = colIndex['Password Salt'] !== undefined ? row[colIndex['Password Salt']] : '';
  if (!storedHash || !storedSalt) {
    return jsonOutput({ result: 'error', code: 'not_set', message: 'ยังไม่ได้ตั้งรหัสผ่าน กรุณาโหลดหน้านี้ใหม่' });
  }

  const password = (data.password || '').toString();
  const computedHash = hashPassword(password, storedSalt);
  if (!timingSafeEqualStr(computedHash, storedHash)) {
    logAccess(regId, regId, 'manage_login_fail');
    return jsonOutput({ result: 'error', code: 'wrong_password', message: 'รหัสผ่านไม่ถูกต้อง' });
  }

  return jsonOutput({ result: 'success', profile: buildManageProfile(found) });
}

/* ============================================================
   POST action=forgotPassword  body: { id, token }
   ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลที่ลงทะเบียนไว้ (ต้องมีลิงก์ manage.html
   เดิมอยู่ในมือก่อน — id/token ต้องตรงกัน — ถึงจะขอรีเซ็ตได้)
   ============================================================ */
function handleForgotPassword(data) {
  const found = findRowByToken(data.id, data.token);
  if (!found) return jsonOutput({ result: 'error', message: 'ไม่พบข้อมูล หรือลิงก์ไม่ถูกต้อง' });

  const regId = (data.id || '').toString();
  if (countTodayAccessLogActions(regId, 'password_reset_request') >= PASSWORD_RESET_REQUEST_LIMIT) {
    return jsonOutput({ result: 'error', code: 'rate_limited', message: 'ขอลิงก์ตั้งรหัสผ่านใหม่บ่อยเกินไป กรุณาลองใหม่พรุ่งนี้' });
  }

  const { sheet, rowNumber, colIndex } = found;
  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const ensureColumn = makeEnsureColumn(sheet, headers, colIndex);

  const resetToken = Utilities.getUuid().replace(/-/g, '');
  sheet.getRange(rowNumber, ensureColumn('Password Reset Token') + 1).setValue(resetToken);
  sheet.getRange(rowNumber, ensureColumn('Password Reset Expiry') + 1).setValue(Date.now() + PASSWORD_RESET_EXPIRY_MS);

  logAccess(regId, regId, 'password_reset_request');
  sendPasswordResetEmail(rowNumber, resetToken, regId);

  return jsonOutput({ result: 'success', message: 'ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลของคุณแล้ว กรุณาตรวจสอบกล่องจดหมาย (หรือ Spam) ลิงก์มีอายุ 30 นาที' });
}

/* ============================================================
   POST action=resetPassword  body: { id, resetToken, password }
   ตั้งรหัสผ่านใหม่จากลิงก์ในอีเมล (สำหรับ reset-password.html — ไม่ต้องใช้
   Edit Token เดิม เพราะจุดประสงค์คือกรณีลืมรหัสผ่าน)
   ============================================================ */
function handleResetPassword(data) {
  const regId = (data.id || '').toString().trim();
  const resetToken = (data.resetToken || '').toString().trim();
  if (!regId || !resetToken) return jsonOutput({ result: 'error', message: 'ลิงก์ไม่ถูกต้อง' });

  const found = findRowByRegId(regId);
  if (!found) return jsonOutput({ result: 'error', message: 'ไม่พบข้อมูล หรือลิงก์ไม่ถูกต้อง' });

  const { sheet, rowNumber, colIndex, row } = found;
  const storedToken = colIndex['Password Reset Token'] !== undefined ? row[colIndex['Password Reset Token']] : '';
  const storedExpiry = colIndex['Password Reset Expiry'] !== undefined ? row[colIndex['Password Reset Expiry']] : '';

  if (!storedToken || storedToken !== resetToken) {
    return jsonOutput({ result: 'error', code: 'invalid_token', message: 'ลิงก์ตั้งรหัสผ่านใหม่ไม่ถูกต้อง หรือถูกใช้ไปแล้ว' });
  }
  if (!storedExpiry || Date.now() > Number(storedExpiry)) {
    return jsonOutput({ result: 'error', code: 'expired_token', message: 'ลิงก์ตั้งรหัสผ่านใหม่หมดอายุแล้ว กรุณาขอลิงก์ใหม่อีกครั้ง' });
  }

  const password = (data.password || '').toString();
  if (password.length < PASSWORD_MIN_LENGTH) {
    return jsonOutput({ result: 'error', code: 'weak_password', message: 'รหัสผ่านต้องมีอย่างน้อย ' + PASSWORD_MIN_LENGTH + ' ตัวอักษร' });
  }

  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const ensureColumn = makeEnsureColumn(sheet, headers, colIndex);
  const salt = generateSalt();
  const hash = hashPassword(password, salt);
  sheet.getRange(rowNumber, ensureColumn('Password Salt') + 1).setValue(salt);
  sheet.getRange(rowNumber, ensureColumn('Password Hash') + 1).setValue(hash);
  sheet.getRange(rowNumber, ensureColumn('Password Reset Token') + 1).setValue('');
  sheet.getRange(rowNumber, ensureColumn('Password Reset Expiry') + 1).setValue('');

  return jsonOutput({ result: 'success' });
}

/* ============================================================
   อีเมลลิงก์ตั้งรหัสผ่านใหม่ — ใช้ ResetPasswordEmail.html template
   ============================================================ */
function sendPasswordResetEmail(rowNumber, resetToken, regId) {
  const SHEET_NAME = 'Form Responses 1';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const email = sheet.getRange(rowNumber, 3).getValue();
  const name = sheet.getRange(rowNumber, 4).getValue();

  // TODO: เปลี่ยนเป็น URL จริงของเว็บไซต์เมื่อ merge ขึ้น main แล้ว (ต้องตรงกับ Code.gs/Register.gs)
  const SITE_BASE_URL = 'https://intuwatnex.github.io/oskr17-reunion/test/';
  const resetUrl = SITE_BASE_URL + 'reset-password.html?id=' + encodeURIComponent(regId) + '&resetToken=' + encodeURIComponent(resetToken);

  const template = HtmlService.createTemplateFromFile('ResetPasswordEmail');
  template.name = name;
  template.resetUrl = resetUrl;
  const htmlBody = template.evaluate().getContent();

  GmailApp.sendEmail(email, 'ตั้งรหัสผ่านใหม่ | OSKR 17th Anniversary', '', { htmlBody: htmlBody });
}
