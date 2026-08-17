/**
 * OSKR17th Anniversary — Connection Map "finding" feature
 *
 * เพิ่ม endpoint ใหม่เข้าไปใน doGet/doPost เดิมของ Code.gs (Apps Script มี
 * doGet/doPost ได้ไฟล์ละหนึ่งฟังก์ชันต่อโปรเจกต์เท่านั้น — ต้อง dispatch ผ่าน
 * action param เดียวกับที่ Code.gs ใช้อยู่แล้ว ดู doGet/doPost ท้ายไฟล์ Code.gs)
 *
 * ชีทที่ใช้ (สร้างอัตโนมัติถ้ายังไม่มี ผ่าน getOrCreateSheet):
 * - profiles    : registration_id, nickname, industry, field, role, company,
 *                 tags, looking_for, status(pending|active|opted_out),
 *                 consent_at, updated_at
 * - contacts    : registration_id, phone, email, share_pref(phone|email_only|hidden)
 * - access_log  : timestamp, viewer_id, target_id, action
 *
 * registrations (= sheet "Form Responses 1" เดิม อ้างอิงผ่าน getTargetSheet()
 * ที่มีอยู่แล้วใน Code.gs) ใช้แบบอ่านอย่างเดียว ไม่แก้โครงสร้าง
 *
 * หมายเหตุเรื่อง rate limit: Apps Script Web App ไม่มีทางรู้ IP จริงของผู้เรียก
 * (ไม่มี API ให้ดึงค่านี้) จึงจำกัดด้วย registration_id ที่ login แล้วแทน:
 * - /reveal: 20 ครั้ง/คน/วัน นับจาก access_log จริง (ไม่ใช้ตัวนับแยก กันข้อมูลเพี้ยน)
 * - /login: ไม่จำกัดจำนวนครั้ง ตรวจแค่ว่ามี Registration ID นี้จริงและจ่ายเงินแล้ว
 *   (ตามที่ตกลงกันไว้ ไม่ทำ IP lockout เพราะ Apps Script ทำไม่ได้จริง)
 */

const PROFILES_HEADERS = ['registration_id', 'nickname', 'industry', 'field', 'role', 'company', 'tags', 'looking_for', 'status', 'consent_at', 'updated_at'];
const CONTACTS_HEADERS = ['registration_id', 'phone', 'email', 'share_pref'];
const ACCESS_LOG_HEADERS = ['timestamp', 'viewer_id', 'target_id', 'action'];
const CM_REVEAL_DAILY_LIMIT = 20;

/* ============================================================
   Sheet accessors (สร้างชีทให้อัตโนมัติถ้ายังไม่มี)
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
function getProfilesSheet() { return getOrCreateSheet('profiles', PROFILES_HEADERS); }
function getContactsSheet() { return getOrCreateSheet('contacts', CONTACTS_HEADERS); }
function getAccessLogSheet() { return getOrCreateSheet('access_log', ACCESS_LOG_HEADERS); }

/* ============================================================
   Generic key-based row helpers (ใช้ร่วมกันสำหรับ profiles/contacts)
   ============================================================ */
function findRowObjectByKey(sheet, keyColName, keyValue) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const colIndex = buildColIndex(headers);
  const keyCol = colIndex[keyColName];
  if (keyCol === undefined) return null;
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const row = values.find((r) => r[keyCol] === keyValue);
  if (!row) return null;
  const obj = {};
  Object.keys(colIndex).forEach((name) => { obj[name] = row[colIndex[name]]; });
  return obj;
}

function upsertRowByKey(sheet, keyColName, keyValue, fields) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const colIndex = buildColIndex(headers);
  const keyCol = colIndex[keyColName];
  const lastRow = sheet.getLastRow();

  let targetRow = -1;
  if (lastRow >= 2) {
    const keyValues = sheet.getRange(2, keyCol + 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < keyValues.length; i++) {
      if (keyValues[i][0] === keyValue) { targetRow = i + 2; break; }
    }
  }
  if (targetRow === -1) {
    targetRow = lastRow + 1;
    sheet.getRange(targetRow, keyCol + 1).setValue(keyValue);
  }

  Object.keys(fields).forEach((name) => {
    if (name in colIndex) sheet.getRange(targetRow, colIndex[name] + 1).setValue(fields[name]);
  });
}

function findProfileByRegId(regId) { return findRowObjectByKey(getProfilesSheet(), 'registration_id', regId); }
function findContactByRegId(regId) { return findRowObjectByKey(getContactsSheet(), 'registration_id', regId); }

function upsertProfile(regId, fields) {
  upsertRowByKey(getProfilesSheet(), 'registration_id', regId, Object.assign({}, fields, { updated_at: new Date() }));
}
function upsertContact(regId, fields) {
  upsertRowByKey(getContactsSheet(), 'registration_id', regId, fields);
}
function clearContact(regId) {
  upsertContact(regId, { phone: '', email: '', share_pref: 'hidden' });
}

// หา row ใน registrations ด้วย Registration ID อย่างเดียว (ไม่เช็ก token) — ใช้ตอน claim
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

  const profile = findProfileByRegId(regId);
  const industry = (profile && profile.industry) || row[colIndex['สายอาชีพ']] || '';

  const token = signToken({ regId: regId, industry: industry, exp: Date.now() + 24 * 60 * 60 * 1000 });
  logAccess(regId, regId, 'login');
  return jsonOutput({ result: 'success', token: token, industry: industry });
}

/* ============================================================
   GET action=tree  ?token=
   ============================================================ */
function handleTree(token) {
  const session = verifyToken(token);
  if (!session) return jsonOutput({ result: 'error', code: 'invalid_token', message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' });

  const sheet = getProfilesSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return jsonOutput({ result: 'success', members: [], viewerIndustry: session.industry });

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIndex = buildColIndex(headers);
  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  const members = [];
  values.forEach((r) => {
    if (r[colIndex['status']] !== 'active') return;
    if (!r[colIndex['registration_id']]) return;
    // เลือกเฉพาะฟิลด์ที่อนุญาตทีละตัว ห้ามส่งทั้งแถว — phone/email ต้องไม่โผล่ที่นี่เด็ดขาด
    members.push({
      registration_id: r[colIndex['registration_id']],
      nickname: r[colIndex['nickname']] || '',
      industry: r[colIndex['industry']] || '',
      field: r[colIndex['field']] || '',
      role: r[colIndex['role']] || '',
      company: r[colIndex['company']] || '',
      tags: r[colIndex['tags']] || '',
      looking_for: r[colIndex['looking_for']] || '',
    });
  });

  return jsonOutput({ result: 'success', members: members, viewerIndustry: session.industry });
}

/* ============================================================
   POST action=reveal  body: { token, target_id }
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

  const contact = findContactByRegId(targetId);
  if (!contact || contact.share_pref === 'hidden' || !contact.share_pref) {
    return jsonOutput({ result: 'success', share: 'hidden', message: 'ไม่เปิดเผยช่องทางติดต่อ' });
  }
  if (contact.share_pref === 'phone') {
    return jsonOutput({ result: 'success', share: 'phone', value: contact.phone || '' });
  }
  if (contact.share_pref === 'email_only') {
    return jsonOutput({ result: 'success', share: 'email', value: contact.email || '' });
  }
  return jsonOutput({ result: 'success', share: 'hidden', message: 'ไม่เปิดเผยช่องทางติดต่อ' });
}

/* ============================================================
   GET action=confirmLookup  ?id=&token=   (ใช้ Edit Token เดิมของ manage.html)
   ============================================================ */
function handleConfirmLookup(id, token) {
  const found = findRowByToken(id, token);
  if (!found) return jsonOutput({ result: 'error', code: 'invalid_link', message: 'ลิงก์ไม่ถูกต้องหรือหมดอายุ' });

  const { row, colIndex } = found;
  const profile = findProfileByRegId(id) || {};
  const contact = findContactByRegId(id) || {};

  return jsonOutput({
    result: 'success',
    profile: {
      registration_id: id,
      full_name: row[colIndex['ชื่อ-นามสกุล']] || '',
      nickname: profile.nickname || row[colIndex['ชื่อเล่น']] || '',
      industry: profile.industry || row[colIndex['สายอาชีพ']] || '',
      field: profile.field || '',
      role: profile.role || '',
      company: profile.company || '',
      tags: profile.tags || '',
      looking_for: profile.looking_for || '',
      status: profile.status || 'pending',
      phone: contact.phone || row[colIndex['เบอร์โทรศัพท์']] || '',
      email: contact.email || row[colIndex['Email address']] || '',
      share_pref: contact.share_pref || 'email_only',
    },
  });
}

/* ============================================================
   POST action=confirmSubmit
   body: { id, token, decision: 'active'|'opted_out', nickname, industry,
           field, role, company, tags, looking_for, phone, email, share_pref }
   ============================================================ */
function handleConfirmSubmit(data) {
  const found = findRowByToken(data.id, data.token);
  if (!found) return jsonOutput({ result: 'error', code: 'invalid_link', message: 'ลิงก์ไม่ถูกต้องหรือหมดอายุ' });

  const regId = data.id;

  if (data.decision === 'opted_out') {
    upsertProfile(regId, { status: 'opted_out' });
    clearContact(regId);
    return jsonOutput({ result: 'success', status: 'opted_out' });
  }

  upsertProfile(regId, {
    nickname: data.nickname || '',
    industry: data.industry || '',
    field: data.field || '',
    role: data.role || '',
    company: data.company || '',
    tags: data.tags || '',
    looking_for: data.looking_for || '',
    status: 'active',
    consent_at: new Date(),
  });
  upsertContact(regId, {
    phone: data.phone || '',
    email: data.email || '',
    share_pref: data.share_pref || 'hidden',
  });

  return jsonOutput({ result: 'success', status: 'active' });
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
   ส่งอีเมลเดิมซ้ำ (QR + ลิงก์จัดการข้อมูล + ลิงก์ยืนยัน Connection Map) ไปที่
   อีเมลของแถวนั้น — ใช้ sendOskrConfirmationEmail() ตัวเดียวกับที่ Register.gs
   และ AdminConnectionMap.gs ใช้ (ดู Register.gs)
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
