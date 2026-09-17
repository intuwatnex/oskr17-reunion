/**
 * OSKR17th Anniversary — Vehicle Plate registration (สำหรับหน้า vehicle-plate.html)
 *
 * ไฟล์นี้แยกออกมาต่างหากจาก Code.gs/ConnectionMap.gs โดยเจตนา — จัดการแค่
 * ฟีเจอร์เดียว: รับเบอร์โทร + เลขทะเบียนรถ (รถยนต์/มอเตอร์ไซค์) จากผู้ที่
 * ลงทะเบียนงานไว้แล้ว แล้วจับคู่ด้วยเบอร์โทรศัพท์ไปเขียนลงคอลัมน์ใหม่
 * "ทะเบียนรถ" ในชีทเดียวกับการลงทะเบียนหลัก (ใช้ SHEET_ID/getTargetSheet/
 * buildColIndex/makeEnsureColumn/jsonOutput ร่วมกับ Code.gs — global scope
 * เดียวกันในโปรเจกต์ Apps Script เดียวกัน ห้ามประกาศชื่อฟังก์ชัน/ตัวแปรซ้ำ
 * กับไฟล์อื่นในโปรเจกต์เด็ดขาด — โปรเจกต์นี้เจอบั๊ก "ประกาศซ้ำ" มาแล้วครั้ง
 * หนึ่ง ทำให้ทั้งเว็บพังหมด ระวังตอน paste ทับ)
 *
 * เรียกผ่าน endpoint เดิม (doPost ใน Code.gs) ด้วย action: 'vehiclePlate'
 * body: { phone, vehicleType: 'car'|'motorcycle', plate }
 *
 * ถ้าไม่พบเบอร์โทรศัพท์นี้ในระบบ (ยังไม่เคยลงทะเบียนงาน หรือกรอกเบอร์ผิด)
 * จะไม่เขียนอะไรลงชีท และตอบกลับ error ให้ผู้ใช้กรอกเบอร์ใหม่
 */
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
  const regIdColIdx = colIndex['Registration ID'];
  if (phoneColIdx === undefined || regIdColIdx === undefined) {
    return jsonOutput({ result: 'error', code: 'server_error', message: 'ระบบขัดข้อง กรุณาติดต่อทีมงาน' });
  }

  // อ่านเฉพาะคอลัมน์เบอร์โทร (1 คอลัมน์) แทนที่จะอ่านทั้งแถวทุกคอลัมน์ —
  // ชีทลงทะเบียนมีคอลัมน์เยอะมาก การอ่านทั้งแถวของทุกคนทุกครั้งที่มีคนมา
  // กรอกทะเบียนรถทำให้ช้าเกินจำเป็น (เคยวัดได้ช้าถึง ~19 วินาที/ครั้ง) — แก้
  // โดยดึงมาแค่คอลัมน์เดียวที่ใช้ค้นหาจริง ๆ
  const phoneValues = sheet.getRange(2, phoneColIdx + 1, lastRow - 1, 1).getValues();
  let matchRowNumber = -1;
  for (let i = 0; i < phoneValues.length; i++) {
    if (normalizePhoneDigits(phoneValues[i][0]) === normalizedInput) {
      matchRowNumber = i + 2;
      break;
    }
  }

  if (matchRowNumber === -1) {
    // ไม่พบเบอร์ตรงกัน — ไม่แก้ไขชีทใด ๆ ทั้งสิ้น ให้ผู้ใช้กรอกใหม่
    return jsonOutput({ result: 'error', code: 'not_found', message: 'ไม่พบเบอร์โทรศัพท์นี้ในระบบลงทะเบียน กรุณาตรวจสอบและกรอกใหม่อีกครั้ง' });
  }

  const ensureColumn = makeEnsureColumn(sheet, headers, colIndex);
  const plateColIdx = ensureColumn('ทะเบียนรถ');
  sheet.getRange(matchRowNumber, plateColIdx + 1).setValue(plateRaw + ' (' + vehicleTypeLabel + ')');

  // อ่านเฉพาะเซลล์ Registration ID ของแถวที่จับคู่ได้แล้ว (แถวเดียว ไม่กระทบ
  // ประสิทธิภาพเหมือนการอ่านทั้งคอลัมน์) เพื่อคำนวณระดับบัตรและสิทธิ์ที่จอดรถ
  const registrationId = sheet.getRange(matchRowNumber, regIdColIdx + 1).getValue();
  const tier = vehiclePlateTicketTier(registrationId);

  return jsonOutput({ result: 'success', ticketTier: tier.label, isVip: tier.isVip });
}

// ระดับบัตรสำหรับหน้าทะเบียนรถ — แยก A (First 50) ออกจาก B (Early Bird) เพื่อใช้
// ตัดสินสิทธิ์ที่จอดรถ VIP (ต่างจาก ticketTierLabel() ใน Code.gs ที่รวม A กับ B
// เป็น "Early Bird" เดียวกันสำหรับการแสดงผลทั่วไป)
function vehiclePlateTicketTier(registrationId) {
  const firstChar = (registrationId || '').toString().charAt(0).toUpperCase();
  switch (firstChar) {
    case 'A': return { label: 'Early Bird - First 50', isVip: true };
    case 'B': return { label: 'Early Bird', isVip: false };
    case 'C': return { label: 'Regular', isVip: false };
    case 'D': return { label: 'Final Call', isVip: false };
    default: return { label: 'Regular', isVip: false };
  }
}

// ตัดอักขระที่ไม่ใช่ตัวเลขออกทั้งหมด ก่อนเทียบเบอร์โทร — กันปัญหาเว้นวรรค/
// ขีด/เลข 0 นำหน้าหายที่พิมพ์ไม่ตรงกันระหว่างตอนลงทะเบียนกับตอนกรอกหน้านี้
function normalizePhoneDigits(value) {
  return (value || '').toString().replace(/\D/g, '');
}
