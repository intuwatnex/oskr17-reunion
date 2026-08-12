/**
 * OSKR17th Anniversary — Registration Web App
 *
 * รับข้อมูลลงทะเบียน + สลิปโอนเงิน (base64) จากหน้า register.html
 * แล้วบันทึกลง Google Sheet ที่ผูกกับสคริปต์นี้ (ต้องสร้างสคริปต์นี้จาก
 * เมนู Extensions > Apps Script ของ Sheet ที่มีคอลัมน์พร้อมแล้ว)
 * พร้อมอัปโหลดรูปสลิปเข้า Google Drive folder ที่กำหนดไว้
 *
 * คอลัมน์ที่สคริปต์นี้จะกรอกให้: Registration ID, Timestamp, Email address,
 * ชื่อ-นามสกุล, ชื่อเล่น, เบอร์โทรศัพท์, แพ้อาหาร (ถ้ามี โปรดระบุ), สายอาชีพ,
 * โปรดระบุรายละเอียดเพิ่มเติม, วันที่โอนเงิน, เวลาที่โอน, แนบสลิปโอนเงิน,
 * กดรับทราบเงื่อนไข, สถานะชำระเงิน (ตั้งเป็น "รอตรวจสอบ" อัตโนมัติ)
 *
 * คอลัมน์ที่ "ไม่แตะ" ปล่อยว่างไว้ให้ทีมงาน/สคริปต์อื่นจัดการทีหลัง:
 * ส่งอีเมล, QR Code, Check in, Check in Time, Wristband No.
 */

// TODO: ใส่ Folder ID ของ Google Drive ที่เตรียมไว้เก็บรูปสลิป
// (เอาจาก URL ของโฟลเดอร์ เช่น drive.google.com/drive/folders/FOLDER_ID_ตรงนี้)
const DRIVE_FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID';

// ชื่อชีทที่จะบันทึกข้อมูล — เว้นว่างไว้ = ใช้ชีทที่ active อยู่
const SHEET_NAME = '';

// สถานะชำระเงินเริ่มต้นเมื่อมีการส่งฟอร์ม (รอทีมงานตรวจสลิป)
const DEFAULT_PAYMENT_STATUS = 'รอตรวจสอบ';

function doGet(e) {
  return ContentService
    .createTextOutput('OSKR17 Registration API is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    validateRequired(data);

    const sheet = getTargetSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const colIndex = {};
    headers.forEach((name, i) => { colIndex[String(name).trim()] = i; });

    const registrationId = generateRegistrationId();
    const slipUrl = saveSlipToDrive(data, registrationId);

    const row = new Array(headers.length).fill('');
    setIfExists(row, colIndex, 'Registration ID', registrationId);
    setIfExists(row, colIndex, 'Timestamp', new Date());
    setIfExists(row, colIndex, 'Email address', data.email);
    setIfExists(row, colIndex, 'ชื่อ-นามสกุล', data.fullName);
    setIfExists(row, colIndex, 'ชื่อเล่น', data.nickname);
    setIfExists(row, colIndex, 'เบอร์โทรศัพท์', data.phone);
    setIfExists(row, colIndex, 'แพ้อาหาร (ถ้ามี โปรดระบุ)', data.allergy || '');
    setIfExists(row, colIndex, 'สายอาชีพ', data.occupation);
    setIfExists(row, colIndex, 'โปรดระบุรายละเอียดเพิ่มเติม', data.occupationDetail || '');
    setIfExists(row, colIndex, 'วันที่โอนเงิน', data.transferDate || '');
    setIfExists(row, colIndex, 'เวลาที่โอน', data.transferTime || '');
    setIfExists(row, colIndex, 'แนบสลิปโอนเงิน', slipUrl);
    setIfExists(row, colIndex, 'กดรับทราบเงื่อนไข', data.agree ? 'ยอมรับ' : '');
    setIfExists(row, colIndex, 'สถานะชำระเงิน', DEFAULT_PAYMENT_STATUS);

    sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);

    return jsonOutput({ result: 'success', registrationId: registrationId });
  } catch (err) {
    return jsonOutput({ result: 'error', message: err.message });
  }
}

function validateRequired(data) {
  const required = ['fullName', 'nickname', 'phone', 'email', 'occupation', 'slipBase64', 'agree'];
  required.forEach((key) => {
    if (!data[key]) throw new Error('ข้อมูลไม่ครบ: ' + key);
  });
}

function getTargetSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getActiveSheet();
}

function setIfExists(row, colIndex, headerName, value) {
  if (headerName in colIndex) row[colIndex[headerName]] = value;
}

function generateRegistrationId() {
  const stamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyMMddHHmmss');
  return 'OSKR17-' + stamp;
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

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
