/**
 * OSKR17th Anniversary — Connection Map "finding" feature
 *
 * เพิ่ม endpoint ใหม่เข้าไปใน doGet/doPost เดิมของ Code.gs (Apps Script มี
 * doGet/doPost ได้ไฟล์ละหนึ่งฟังก์ชันต่อโปรเจกต์เท่านั้น — ต้อง dispatch ผ่าน
 * action param เดียวกับที่ Code.gs ใช้อยู่แล้ว ดู doGet/doPost ท้ายไฟล์ Code.gs)
 *
 * ไม่มีขั้นตอน "ยืนยันโปรไฟล์" แยกต่างหาก — ใช้ความยินยอมที่เก็บไว้ตอน
 * ลงทะเบียนแล้ว (คอลัมน์ "กดรับทราบเงื่อนไข" + "ช่องทางติดต่อที่เปิดเผย" +
 * "เปิดรับคุยเรื่องอะไร" ใน "Form Responses 1") โดยตรง แก้ไขได้ผ่าน manage.html
 * เหมือนเดิม — ไม่มีชีท profiles/contacts แยกต่างหากแล้ว
 *
 * เงื่อนไขที่นับว่า "แสดงใน Connection Map":
 *  - สถานะชำระเงิน = "ชำระเงินแล้ว"
 *  - กดรับทราบเงื่อนไข ไม่ว่าง (ติ๊กยินยอมตอนลงทะเบียน/แก้ไขผ่าน manage.html)
 *
 * access_log (สร้างอัตโนมัติถ้ายังไม่มี ผ่าน getOrCreateSheet): timestamp,
 * viewer_id, target_id, action — เก็บไว้เป็น audit trail ของการกด "ดูช่องทาง
 * ติดต่อ" เท่านั้น ไม่มีชีทอื่นเพิ่มแล้ว
 *
 * หมายเหตุเรื่อง rate limit: Apps Script Web App ไม่มีทางรู้ IP จริงของผู้เรียก
 * (ไม่มี API ให้ดึงค่านี้) จึงจำกัดด้วย registration_id ที่ login แล้วแทน:
 * - /reveal: 20 ครั้ง/คน/วัน นับจาก access_log จริง (ไม่ใช้ตัวนับแยก กันข้อมูลเพี้ยน)
 * - /login: ไม่จำกัดจำนวนครั้ง ตรวจแค่ว่ามี Registration ID นี้จริงและจ่ายเงินแล้ว
 */

const ACCESS_LOG_HEADERS = ['timestamp', 'viewer_id', 'target_id', 'action'];
const CM_REVEAL_DAILY_LIMIT = 20;

/* ============================================================
   Sheet accessor สำหรับ access_log (สร้างให้อัตโนมัติถ้ายังไม่มี)
   ============================================================ */
function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}
function getAccessLogSheet() { return getOrCreateSheet('access_log', ACCESS_LOG_HEADERS); }

// หา row ใน registrations ด้วย Registration ID อย่างเดียว (ไม่เช็ก token) — ใช้ตอน login/reveal/claim
function findRowByRegId(regId) {
  const sheet = getTargetSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIndex = buildColIndex(headers);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  const idx = values.findIndex((r) => r[colIndex['Registration ID']] === regId);
  if (idx === -1) return null;
  return { sheet, rowNumber: idx + 2, row: values[idx], colIndex };
}

function logAccess(viewerId, targetId, action) {
  getAccessLogSheet().appendRow([new Date(), viewerId, targetId, action]);
}

function countTodayReveals(viewerId) {
  const sheet = getAccessLogSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const tz = Session.getScriptTimeZone() || 'Asia/Bangkok';
  const todayStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  let count = 0;
  values.forEach((r) => {
    const ts = r[0], vId = r[1], action = r[3];
    if (action !== 'reveal' || vId !== viewerId || !(ts instanceof Date)) return;
    if (Utilities.formatDate(ts, tz, 'yyyy-MM-dd') === todayStr) count++;
  });
  return count;
}

/* ============================================================
   Signed session token (HMAC) — ไม่มี library ภายนอก ใช้ Utilities ในตัว
   ============================================================ */
function getTokenSecret() {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('CM_TOKEN_SECRET');
  if (!secret) {
    secret = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('CM_TOKEN_SECRET', secret);
  }
  return secret;
}
function base64urlEncodeStr(str) {
  return Utilities.base64EncodeWebSafe(Utilities.newBlob(str).getBytes()).replace(/=+$/, '');
}
function base64urlDecodeStr(str) {
  return Utilities.newBlob(Utilities.base64DecodeWebSafe(str)).getDataAsString();
}
function signToken(payload) {
  const payloadB64 = base64urlEncodeStr(JSON.stringify(payload));
  const sigBytes = Utilities.computeHmacSha256Signature(payloadB64, getTokenSecret());
  const sigB64 = Utilities.base64EncodeWebSafe(sigBytes).replace(/=+$/, '');
  return payloadB64 + '.' + sigB64;
}
function verifyToken(token) {
  if (!token || token.indexOf('.') === -1) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  const expectedSigBytes = Utilities.computeHmacSha256Signature(payloadB64, getTokenSecret());
  const expectedSigB64 = Utilities.base64EncodeWebSafe(expectedSigBytes).replace(/=+$/, '');
  if (expectedSigB64 !== sigB64) return null;
  let payload;
  try { payload = JSON.parse(base64urlDecodeStr(payloadB64)); } catch (e) { return null; }
  if (!payload.exp || Date.now() > payload.exp) return null;
  return { regId: payload.regId, industry: payload.industry, exp: payload.exp };
}

function maskEmail(email) {
  if (!email) return '';
  const atIdx = email.indexOf('@');
  if (atIdx === -1) return email;
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx);
  return local.slice(0, Math.min(3, local.length)) + '***' + domain;
}

/* ============================================================
   POST action=login  body: { reg_id }
   ============================================================ */
function handleLogin(data) {
  const regId = (data.reg_id || '').toString().trim();
  if (!regId) return jsonOutput({ result: 'error', code: 'invalid_input', message: 'กรุณากรอกรหัสลงทะเบียน' });

  const found = findRowByRegId(regId);
  if (!found) return jsonOutput({ result: 'error', code: 'not_found', message: 'ไม่พบรหัสลงทะเบียนนี้ในระบบ กรุณาตรวจสอบอีกครั้ง' });

  const { row, colIndex } = found;
  if (row[colIndex['สถานะชำระเงิน']] !== 'ชำระเงินแล้ว') {
    return jsonOutput({ result: 'error', code: 'not_paid', message: 'การชำระเงินของคุณยังไม่ได้รับการยืนยัน กรุณารอทีมงานตรวจสอบก่อนใช้งาน Connection Map' });
  }

  const industry = row[colIndex['สายอาชีพ']] || '';
  const token = signToken({ regId: regId, industry: industry, exp: Date.now() + 24 * 60 * 60 * 1000 });
  logAccess(regId, regId, 'login');
  return jsonOutput({ result: 'success', token: token, industry: industry });
}

/* ============================================================
   GET action=tree  ?token=
   อ่านจาก registrations ("Form Responses 1") ตรง ๆ — คนที่จ่ายเงินแล้วและ
   ติ๊กยินยอมตอนลงทะเบียน (หรือแก้ไขทีหลังผ่าน manage.html) เท่านั้นที่แสดง
   ============================================================ */
function handleTree(token) {
  const session = verifyToken(token);
  if (!session) return jsonOutput({ result: 'error', code: 'invalid_token', message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' });

  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonOutput({ result: 'success', members: [], viewerIndustry: session.industry });

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIndex = buildColIndex(headers);
  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  const members = [];
  values.forEach((r) => {
    const regId = r[colIndex['Registration ID']];
    if (!regId) return;
    if (r[colIndex['สถานะชำระเงิน']] !== 'ชำระเงินแล้ว') return;
    if (!r[colIndex['กดรับทราบเงื่อนไข']]) return; // ไม่ได้ยินยอมให้แสดงข้อมูล

    // เลือกเฉพาะฟิลด์ที่อนุญาตทีละตัว ห้ามส่งทั้งแถว — phone/email ต้องไม่โผล่ที่นี่เด็ดขาด
    members.push({
      registration_id: regId,
      nickname: r[colIndex['ชื่อเล่น']] || '',
      industry: r[colIndex['สายอาชีพ']] || '',
      detail: r[colIndex['โปรดระบุรายละเอียดเพิ่มเติม']] || '',
      looking_for: r[colIndex['เปิดรับคุยเรื่องอะไร']] || '',
    });
  });

  return jsonOutput({ result: 'success', members: members, viewerIndustry: session.industry });
}

/* ============================================================
   POST action=reveal  body: { token, target_id }
   ใช้ค่า "ช่องทางติดต่อที่เปิดเผย" ที่กรอกไว้ตอนลงทะเบียน/แก้ไขใน manage.html
   ============================================================ */
function handleReveal(data) {
  const session = verifyToken(data.token);
  if (!session) return jsonOutput({ result: 'error', code: 'invalid_token', message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' });

  const targetId = (data.target_id || '').toString().trim();
  if (!targetId) return jsonOutput({ result: 'error', code: 'invalid_input', message: 'ไม่พบข้อมูลที่ต้องการ' });

  if (countTodayReveals(session.regId) >= CM_REVEAL_DAILY_LIMIT) {
    return jsonOutput({ result: 'error', code: 'rate_limited', message: 'คุณดูช่องทางติดต่อครบ ' + CM_REVEAL_DAILY_LIMIT + ' ครั้งแล้วในวันนี้ กรุณาลองใหม่พรุ่งนี้' });
  }

  // log ก่อนเสมอ ไม่ว่าผลลัพธ์จะเป็นอย่างไร (audit trail ต้องมีก่อนคืนข้อมูล)
  logAccess(session.regId, targetId, 'reveal');

  const found = findRowByRegId(targetId);
  if (!found) return jsonOutput({ result: 'success', share: 'hidden', message: 'ไม่เปิดเผยช่องทางติดต่อ' });

  const { row, colIndex } = found;
  const visibility = row[colIndex['ช่องทางติดต่อที่เปิดเผย']];

  if (visibility === 'อีเมล + เบอร์โทรศัพท์') {
    return jsonOutput({ result: 'success', share: 'phone', value: row[colIndex['เบอร์โทรศัพท์']] || '' });
  }
  if (visibility === 'เฉพาะอีเมล') {
    return jsonOutput({ result: 'success', share: 'email', value: row[colIndex['Email address']] || '' });
  }
  return jsonOutput({ result: 'success', share: 'hidden', message: 'ไม่เปิดเผยช่องทางติดต่อ' });
}

/* ============================================================
   GET action=claimSearch  ?q=   (fuzzy name search, ไม่โผล่อีเมล/เบอร์เต็ม)
   ============================================================ */
function handleClaimSearch(query) {
  const q = (query || '').toString().trim().toLowerCase();
  if (q.length < 2) return jsonOutput({ result: 'success', results: [] });

  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonOutput({ result: 'success', results: [] });

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIndex = buildColIndex(headers);
  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  const results = [];
  values.forEach((r) => {
    const regId = r[colIndex['Registration ID']];
    if (!regId) return;
    const name = (r[colIndex['ชื่อ-นามสกุล']] || '').toString();
    const nickname = (r[colIndex['ชื่อเล่น']] || '').toString();
    const haystack = (name + ' ' + nickname).toLowerCase();
    if (haystack.indexOf(q) === -1) return;
    results.push({
      registration_id: regId,
      name: name,
      masked_email: maskEmail(r[colIndex['Email address']]),
    });
  });

  return jsonOutput({ result: 'success', results: results.slice(0, 10) });
}

/* ============================================================
   POST action=claimRequest  body: { registration_id }
   ส่งอีเมลเดิมซ้ำ (QR + ลิงก์จัดการข้อมูล) ไปที่อีเมลของแถวนั้น — ใช้
   sendOskrConfirmationEmail() ตัวเดียวกับที่ Register.gs ใช้ (ดู Register.gs)
   ============================================================ */
function handleClaimRequest(data) {
  const regId = (data.registration_id || '').toString().trim();
  if (!regId) return jsonOutput({ result: 'error', message: 'ไม่พบข้อมูล' });

  const found = findRowByRegId(regId);
  if (!found) return jsonOutput({ result: 'error', message: 'ไม่พบข้อมูลการลงทะเบียนนี้' });

  const { row, colIndex, rowNumber } = found;
  const email = row[colIndex['Email address']];
  const editToken = row[colIndex['Edit Token']];

  if (!email || !editToken) return jsonOutput({ result: 'error', message: 'ไม่พบอีเมลหรือลิงก์สำหรับผู้ใช้นี้ กรุณาติดต่อทีมงานโดยตรง' });

  sendOskrConfirmationEmail(rowNumber);
  logAccess(regId, regId, 'claim_request');

  return jsonOutput({ result: 'success' });
}
