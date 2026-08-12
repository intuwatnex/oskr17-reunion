/**
 * OSKR17th Anniversary — Registration + Connection Map Web App
 *
 * รับข้อมูลลงทะเบียน + สลิปโอนเงิน (base64) จากหน้า register.html
 * แล้วบันทึกลง Google Sheet ที่ผูกกับสคริปต์นี้ (ต้องสร้างสคริปต์นี้จาก
 * เมนู Extensions > Apps Script ของ Sheet ที่มีคอลัมน์พร้อมแล้ว)
 * พร้อมอัปโหลดรูปสลิปเข้า Google Drive folder ที่กำหนดไว้
 *
 * คอลัมน์ที่มีอยู่แล้วที่สคริปต์นี้จะกรอกให้: Registration ID, Timestamp,
 * Email address, ชื่อ-นามสกุล, ชื่อเล่น, เบอร์โทรศัพท์,
 * แพ้อาหาร (ถ้ามี โปรดระบุ), สายอาชีพ, โปรดระบุรายละเอียดเพิ่มเติม,
 * วันที่โอนเงิน, เวลาที่โอน, แนบสลิปโอนเงิน, กดรับทราบเงื่อนไข,
 * สถานะชำระเงิน (ตั้งเป็น "รอตรวจสอบ" อัตโนมัติ)
 *
 * คอลัมน์ที่ "ไม่แตะ" ปล่อยว่างไว้ให้ทีมงาน/สคริปต์อื่นจัดการทีหลัง:
 * ส่งอีเมล, QR Code, Check in, Check in Time, Wristband No.
 *
 * คอลัมน์ใหม่สำหรับฟีเจอร์ Connection Map (สคริปต์จะสร้างคอลัมน์ให้เอง
 * อัตโนมัติถ้ายังไม่มีในชีท ไม่ต้องเพิ่มมือ):
 * ยินยอมแสดงข้อมูล Connection Map, ช่องทางติดต่อที่เปิดเผย,
 * เปิดรับคุยเรื่องอะไร, Edit Token
 */

// TODO: ใส่ Folder ID ของ Google Drive ที่เตรียมไว้เก็บรูปสลิป
// (เอาจาก URL ของโฟลเดอร์ เช่น drive.google.com/drive/folders/FOLDER_ID_ตรงนี้)
const DRIVE_FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID';

// ชื่อชีทที่จะบันทึกข้อมูล — เว้นว่างไว้ = ใช้ชีทที่ active อยู่
const SHEET_NAME = '';

// สถานะชำระเงินเริ่มต้นเมื่อมีการส่งฟอร์ม (รอทีมงานตรวจสลิป)
const DEFAULT_PAYMENT_STATUS = 'รอตรวจสอบ';

// TODO: เปลี่ยนเป็น URL จริงของเว็บไซต์เมื่อ merge ขึ้น main แล้ว
// (ตอนนี้ชี้ไปที่ preview บน test branch)
const SITE_BASE_URL = 'https://intuwatnex.github.io/oskr17-reunion/test/';

function doGet(e) {
  const action = e.parameter && e.parameter.action;
  if (action === 'lookup') {
    return handleLookup(e.parameter.id, e.parameter.token);
  }
  return ContentService
    .createTextOutput('OSKR17 Registration API is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'update') return handleUpdate(data);
    if (data.action === 'delete') return handleDelete(data);
    return handleNewRegistration(data);
  } catch (err) {
    return jsonOutput({ result: 'error', message: err.message });
  }
}

/* ----------------------------------------------------------
   สมัครลงทะเบียนใหม่
   ---------------------------------------------------------- */
function handleNewRegistration(data) {
  validateRequired(data);

  const sheet = getTargetSheet();
  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const colIndex = buildColIndex(headers);
  const ensureColumn = makeEnsureColumn(sheet, headers, colIndex);

  const registrationId = generateRegistrationId();
  const editToken = generateEditToken();
  const slipUrl = saveSlipToDrive(data, registrationId);

  const row = [];
  const set = (headerName, value) => { row[ensureColumn(headerName)] = value; };

  set('Registration ID', registrationId);
  set('Timestamp', new Date());
  set('Email address', data.email);
  set('ชื่อ-นามสกุล', data.fullName);
  set('ชื่อเล่น', data.nickname);
  set('เบอร์โทรศัพท์', data.phone);
  set('แพ้อาหาร (ถ้ามี โปรดระบุ)', data.allergy || '');
  set('สายอาชีพ', data.occupation);
  set('โปรดระบุรายละเอียดเพิ่มเติม', data.occupationDetail || '');
  set('วันที่โอนเงิน', data.transferDate || '');
  set('เวลาที่โอน', data.transferTime || '');
  set('แนบสลิปโอนเงิน', slipUrl);
  set('กดรับทราบเงื่อนไข', data.agree ? 'ยอมรับ' : '');
  set('สถานะชำระเงิน', DEFAULT_PAYMENT_STATUS);
  set('ยินยอมแสดงข้อมูล Connection Map', data.connectionConsent ? 'ยินยอม' : 'ไม่ยินยอม');
  set('ช่องทางติดต่อที่เปิดเผย', data.connectionConsent ? contactVisibilityLabel(data.contactVisibility) : '');
  set('เปิดรับคุยเรื่องอะไร', data.connectionConsent ? (data.talkTopics || '') : '');
  set('Edit Token', editToken);

  for (let i = 0; i < headers.length; i++) {
    if (row[i] === undefined) row[i] = '';
  }

  sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);

  sendConfirmationEmail(data, registrationId, editToken);

  return jsonOutput({ result: 'success', registrationId: registrationId });
}

function validateRequired(data) {
  const required = ['fullName', 'nickname', 'phone', 'email', 'occupation', 'slipBase64', 'agree'];
  required.forEach((key) => {
    if (!data[key]) throw new Error('ข้อมูลไม่ครบ: ' + key);
  });
}

/* ----------------------------------------------------------
   ดูข้อมูลตัวเอง (สำหรับหน้า manage.html)
   ---------------------------------------------------------- */
function handleLookup(id, token) {
  const found = findRowByToken(id, token);
  if (!found) return jsonOutput({ result: 'error', message: 'ไม่พบข้อมูล หรือลิงก์ไม่ถูกต้อง' });

  const { row, colIndex } = found;
  const get = (name) => (name in colIndex ? row[colIndex[name]] : '');
  const visibilityLabel = get('ช่องทางติดต่อที่เปิดเผย');

  return jsonOutput({
    result: 'success',
    profile: {
      fullName: get('ชื่อ-นามสกุล'),
      nickname: get('ชื่อเล่น'),
      email: get('Email address'),
      phone: get('เบอร์โทรศัพท์'),
      occupation: get('สายอาชีพ'),
      occupationDetail: get('โปรดระบุรายละเอียดเพิ่มเติม'),
      allergy: get('แพ้อาหาร (ถ้ามี โปรดระบุ)'),
      connectionConsent: get('ยินยอมแสดงข้อมูล Connection Map') === 'ยินยอม',
      contactVisibility: visibilityLabel === 'อีเมล + เบอร์โทรศัพท์' ? 'email_phone' : (visibilityLabel === 'เฉพาะอีเมล' ? 'email' : ''),
      talkTopics: get('เปิดรับคุยเรื่องอะไร'),
    },
  });
}

/* ----------------------------------------------------------
   แก้ไขข้อมูลตัวเอง (สำหรับหน้า manage.html)
   ---------------------------------------------------------- */
function handleUpdate(data) {
  const found = findRowByToken(data.id, data.token);
  if (!found) return jsonOutput({ result: 'error', message: 'ไม่พบข้อมูล หรือลิงก์ไม่ถูกต้อง' });

  const { sheet, rowNumber, colIndex } = found;
  const updates = {
    'ชื่อ-นามสกุล': data.fullName,
    'ชื่อเล่น': data.nickname,
    'เบอร์โทรศัพท์': data.phone,
    'สายอาชีพ': data.occupation,
    'โปรดระบุรายละเอียดเพิ่มเติม': data.occupationDetail || '',
    'แพ้อาหาร (ถ้ามี โปรดระบุ)': data.allergy || '',
    'ยินยอมแสดงข้อมูล Connection Map': data.connectionConsent ? 'ยินยอม' : 'ไม่ยินยอม',
    'ช่องทางติดต่อที่เปิดเผย': data.connectionConsent ? contactVisibilityLabel(data.contactVisibility) : '',
    'เปิดรับคุยเรื่องอะไร': data.connectionConsent ? (data.talkTopics || '') : '',
  };

  Object.keys(updates).forEach((name) => {
    if (name in colIndex) sheet.getRange(rowNumber, colIndex[name] + 1).setValue(updates[name]);
  });

  return jsonOutput({ result: 'success' });
}

/* ----------------------------------------------------------
   ลบข้อมูล Connection Map ของตัวเอง
   (ไม่ลบข้อมูลลงทะเบียน/การชำระเงินหลัก — แค่เอาชื่อ/อาชีพออกจากหน้า
   Connection Map สาธารณะ เพราะบัตร/สถานะเช็คอินยังต้องใช้อยู่)
   ---------------------------------------------------------- */
function handleDelete(data) {
  const found = findRowByToken(data.id, data.token);
  if (!found) return jsonOutput({ result: 'error', message: 'ไม่พบข้อมูล หรือลิงก์ไม่ถูกต้อง' });

  const { sheet, rowNumber, colIndex } = found;
  const clears = {
    'ยินยอมแสดงข้อมูล Connection Map': 'ไม่ยินยอม',
    'ช่องทางติดต่อที่เปิดเผย': '',
    'เปิดรับคุยเรื่องอะไร': '',
    'โปรดระบุรายละเอียดเพิ่มเติม': '',
  };

  Object.keys(clears).forEach((name) => {
    if (name in colIndex) sheet.getRange(rowNumber, colIndex[name] + 1).setValue(clears[name]);
  });

  return jsonOutput({ result: 'success' });
}

/* ----------------------------------------------------------
   Helpers
   ---------------------------------------------------------- */
function getTargetSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getActiveSheet();
}

function buildColIndex(headers) {
  const colIndex = {};
  headers.forEach((name, i) => { if (name) colIndex[String(name).trim()] = i; });
  return colIndex;
}

// คืนฟังก์ชันที่หา index ของคอลัมน์ตามชื่อ ถ้ายังไม่มีในชีทจะสร้างคอลัมน์ใหม่ให้อัตโนมัติ
function makeEnsureColumn(sheet, headers, colIndex) {
  return function ensureColumn(name) {
    if (name in colIndex) return colIndex[name];
    const newIndex = headers.length;
    sheet.getRange(1, newIndex + 1).setValue(name);
    headers.push(name);
    colIndex[name] = newIndex;
    return newIndex;
  };
}

function findRowByToken(id, token) {
  if (!id || !token) return null;

  const sheet = getTargetSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIndex = buildColIndex(headers);
  if (!('Registration ID' in colIndex) || !('Edit Token' in colIndex)) return null;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  const idx = values.findIndex((r) => r[colIndex['Registration ID']] === id);
  if (idx === -1) return null;
  if (values[idx][colIndex['Edit Token']] !== token) return null;

  return { sheet, rowNumber: idx + 2, row: values[idx], colIndex };
}

function contactVisibilityLabel(value) {
  if (value === 'email_phone') return 'อีเมล + เบอร์โทรศัพท์';
  if (value === 'email') return 'เฉพาะอีเมล';
  return '';
}

function generateRegistrationId() {
  const stamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyMMddHHmmss');
  return 'OSKR17-' + stamp;
}

function generateEditToken() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 24);
}

function saveSlipToDrive(data, registrationId) {
  if (!data.slipBase64) return '';
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const matches = data.slipBase64.match(/^data:(.+);base64,(.*)$/);
  const mimeType = matches ? matches[1] : 'image/jpeg';
  const base64Data = matches ? matches[2] : data.slipBase64;
  const blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    mimeType,
    registrationId + '_' + data.fullName
  );
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function sendConfirmationEmail(data, registrationId, editToken) {
  const manageUrl = SITE_BASE_URL + 'manage.html?id=' + encodeURIComponent(registrationId) + '&token=' + encodeURIComponent(editToken);
  const subject = 'ยืนยันการลงทะเบียน OSKR17th Anniversary — ' + registrationId;
  const body = [
    'สวัสดีคุณ ' + data.fullName + ',',
    '',
    'ขอบคุณที่ลงทะเบียนร่วมงาน OSKR17th Anniversary — Time Machine',
    'รหัสลงทะเบียนของคุณ: ' + registrationId,
    '',
    'ทีมงานจะตรวจสอบสลิปโอนเงินและยืนยันการชำระเงินให้เร็วที่สุด',
    '',
    'คุณสามารถแก้ไข/ลบข้อมูล Connection Map ของตัวเอง (หรือเข้าร่วมภายหลังได้)',
    'ผ่านลิงก์ส่วนตัวนี้ได้ทุกเมื่อ (เก็บอีเมลนี้ไว้ ไม่ต้องจำรหัสผ่าน):',
    manageUrl,
    '',
    'หากมีข้อสงสัย ติดต่อ พีรพล 099-789-2416',
    '',
    'OSKR 17th Anniversary — Time Machine',
  ].join('\n');

  try {
    MailApp.sendEmail(data.email, subject, body);
  } catch (err) {
    // ไม่ให้การส่งอีเมลล้มเหลวทำให้การลงทะเบียนล้มเหลวไปด้วย
  }
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
