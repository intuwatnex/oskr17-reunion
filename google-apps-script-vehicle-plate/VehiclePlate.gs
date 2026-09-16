/**
 * OSKR17th Anniversary — Vehicle Plate registration
 *
 * โปรเจกต์ Apps Script แยกต่างหากโดยตั้งใจ — ไม่ใช้ไฟล์ร่วมกับ Code.gs /
 * Register.gs / ConnectionMap.gs ของโปรเจกต์เว็บแอปหลักเลยแม้แต่บรรทัดเดียว
 * ไฟล์นี้ประกาศทุกอย่างที่ต้องใช้ไว้ในตัวเอง (SHEET_ID, ฟังก์ชันช่วยเหลือ
 * ทั้งหมด) เพื่อไม่ให้กระทบ หรือไปแย่ง quota/คิวการทำงานกับสคริปต์หลักที่ถูก
 * เรียกพร้อมกันหลายฟังก์ชันอยู่แล้ว (login/reveal/register ฯลฯ)
 *
 * วิธี deploy (ทำครั้งเดียว):
 * 1. ไปที่ https://script.google.com -> New project
 * 2. ตั้งชื่อโปรเจกต์ เช่น "OSKR17 Vehicle Plate"
 * 3. ลบโค้ดเริ่มต้น (function myFunction(){}) ออก แล้ววางไฟล์นี้ทั้งไฟล์แทน
 * 4. Deploy -> New deployment -> เลือกประเภท "Web app"
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 5. คัดลอก URL ที่ได้ (ลงท้ายด้วย /exec) ส่งกลับมาให้ผมใส่ใน
 *    assets/js/vehicle-plate.js (ตัวแปร VEHICLE_PLATE_CONFIG.scriptUrl)
 *
 * เวลาจะอัปเดตโค้ดในอนาคต: แก้ในโปรเจกต์นี้ตรง ๆ ได้เลย แล้ว Deploy ->
 * Manage deployments -> ✏️ -> New version -> Deploy (URL เดิมไม่เปลี่ยน)
 */

const SHEET_ID = '1w39fXg6C8XrOe_zs_d4xS_Go9NPa7MOExEdkHhj0j5s';
const SHEET_NAME = 'Form Responses 1';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    return handleVehiclePlate(data);
  } catch (err) {
    return jsonOutput({ result: 'error', message: err.message });
  }
}

/* body: { phone, vehicleType: 'car'|'motorcycle', plate } */
function handleVehiclePlate(data) {
  const phoneRaw = (data.phone || '').toString().trim();
  const plateRaw = (data.plate || '').toString().trim();
  const vehicleType = (data.vehicleType || '').toString().trim();

  if (!phoneRaw || !plateRaw) {
    return jsonOutput({ result: 'error', code: 'invalid_input', message: 'กรุณากรอกเบอร์โทรศัพท์และเลขทะเบียนรถให้ครบถ้วน' });
  }

  const vehicleTypeLabel = vehicleType === 'motorcycle' ? 'รถจักรยานยนต์'
    : (vehicleType === 'car' ? 'รถยนต์' : '');
  if (!vehicleTypeLabel) {
    return jsonOutput({ result: 'error', code: 'invalid_input', message: 'กรุณาเลือกประเภทรถ' });
  }

  const normalizedInput = normalizePhoneDigits(phoneRaw);
  if (normalizedInput.length < 9) {
    return jsonOutput({ result: 'error', code: 'invalid_input', message: 'เบอร์โทรศัพท์ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' });
  }

  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return jsonOutput({ result: 'error', code: 'not_found', message: 'ไม่พบเบอร์โทรศัพท์นี้ในระบบลงทะเบียน กรุณาตรวจสอบและกรอกใหม่อีกครั้ง' });
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const colIndex = buildColIndex(headers);
  const phoneColIdx = colIndex['เบอร์โทรศัพท์'];
  if (phoneColIdx === undefined) {
    return jsonOutput({ result: 'error', code: 'server_error', message: 'ระบบขัดข้อง กรุณาติดต่อทีมงาน' });
  }

  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  let matchIdx = -1;
  for (let i = 0; i < values.length; i++) {
    if (normalizePhoneDigits(values[i][phoneColIdx]) === normalizedInput) {
      matchIdx = i;
      break;
    }
  }

  if (matchIdx === -1) {
    // ไม่พบเบอร์ตรงกัน — ไม่แก้ไขชีทใด ๆ ทั้งสิ้น ให้ผู้ใช้กรอกใหม่
    return jsonOutput({ result: 'error', code: 'not_found', message: 'ไม่พบเบอร์โทรศัพท์นี้ในระบบลงทะเบียน กรุณาตรวจสอบและกรอกใหม่อีกครั้ง' });
  }

  const ensureColumn = makeEnsureColumn(sheet, headers, colIndex);
  const plateColIdx = ensureColumn('ทะเบียนรถ');
  const rowNumber = matchIdx + 2;
  sheet.getRange(rowNumber, plateColIdx + 1).setValue(plateRaw + ' (' + vehicleTypeLabel + ')');

  return jsonOutput({ result: 'success' });
}

/* ---------- helpers (คัดลอกมาจาก Code.gs ให้ครบในตัวเอง ไม่แชร์กัน) ---------- */

function getTargetSheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
}

function buildColIndex(headers) {
  const colIndex = {};
  headers.forEach((name, i) => { if (name) colIndex[String(name).trim()] = i; });
  return colIndex;
}

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

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ตัดอักขระที่ไม่ใช่ตัวเลขออกทั้งหมด ก่อนเทียบเบอร์โทร — กันปัญหาเว้นวรรค/
// ขีด/เลข 0 นำหน้าหายที่พิมพ์ไม่ตรงกันระหว่างตอนลงทะเบียนกับตอนกรอกหน้านี้
function normalizePhoneDigits(value) {
  return (value || '').toString().replace(/\D/g, '');
}
