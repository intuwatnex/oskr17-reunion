/**
 * เรียกใช้ครั้งเดียวจาก Apps Script Editor (เลือกฟังก์ชัน backfillEditTokensAndEmail
 * แล้วกด Run) เพื่อเติม Edit Token ให้แถวที่ลงทะเบียนไว้ก่อนมีฟีเจอร์ manage.html
 * (จ่ายเงินแล้ว แต่คอลัมน์ Edit Token ยังว่าง) แล้วส่งอีเมลแจ้งลิงก์จัดการข้อมูล
 * Connection Map ให้อีกครั้ง — ใช้ Email.html template เดียวกับ Register.gs
 *
 * เงื่อนไขที่นับว่าเป็นแถวที่ต้อง backfill:
 *  - Registration ID (คอลัมน์ A) ไม่ว่าง (คือมีคนลงทะเบียนจริงในแถวนี้)
 *  - สถานะชำระเงิน (คอลัมน์ N) = "ชำระเงินแล้ว"
 *  - Edit Token (คอลัมน์ V) ยังว่าง
 *
 * ลบไฟล์นี้ทิ้งได้หลังรันเสร็จ ไม่ต้องเก็บไว้ถาวร
 */
function backfillEditTokensAndEmail() {
  const SHEET_NAME = "Form Responses 1";
  const SITE_BASE_URL = 'https://intuwatnex.github.io/oskr17-reunion/test/';

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const values = sheet.getRange(2, 1, lastRow - 1, 22).getValues(); // คอลัมน์ A..V

  let processed = 0;
  let skipped = 0;

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const rowNumber = i + 2;

    const regID = row[0];          // A: Registration ID
    const email = row[2];          // C: Email address
    const name = row[3];           // D: ชื่อ-นามสกุล
    const paymentStatus = row[13]; // N: สถานะชำระเงิน
    const qr = row[15];            // P: QR Code
    const editToken = row[21];     // V: Edit Token

    if (!regID || paymentStatus !== "ชำระเงินแล้ว" || editToken) {
      skipped++;
      continue;
    }

    const newToken = Utilities.getUuid().replace(/-/g, '').slice(0, 24);
    sheet.getRange(rowNumber, 22).setValue(newToken); // เขียน Edit Token ใหม่ลงคอลัมน์ V

    const manageUrl = SITE_BASE_URL + 'manage.html?id=' + encodeURIComponent(regID) + '&token=' + encodeURIComponent(newToken);

    const template = HtmlService.createTemplateFromFile('Email');
    template.name = name;
    template.regID = regID;
    template.qr = qr;
    template.manageUrl = manageUrl;
    const htmlBody = template.evaluate().getContent();

    GmailApp.sendEmail(
      email,
      "ลิงก์จัดการข้อมูล Connection Map ของคุณ | OSKR 17th Anniversary",
      "",
      { htmlBody: htmlBody }
    );

    processed++;
  }

  Logger.log('Backfilled + emailed ' + processed + ' rows. Skipped ' + skipped + ' rows (already had a token, unpaid, or empty).');
}
