function onEdit(e) {
  // ตั้งค่าชื่อชีต
  const SHEET_NAME = "Form Responses 1";

  const sheet = e.range.getSheet();

  if (sheet.getName() !== SHEET_NAME) return;

  const row = e.range.getRow();
  const col = e.range.getColumn();

  // ตรวจเฉพาะคอลัมน์ N (คอลัมน์ที่ 14) สถานะชำระเงิน
  if (col !== 14) return;

  const paymentStatus = sheet.getRange(row, 14).getValue();

  if (paymentStatus !== "ชำระเงินแล้ว") return;

  const mailStatus = sheet.getRange(row, 15).getValue();

  // ถ้าส่งแล้ว ไม่ต้องส่งอีก
  if (mailStatus === "ส่งแล้ว") return;

  const email = sheet.getRange(row, 3).getValue();
  const name = sheet.getRange(row, 4).getValue();
  const regID = sheet.getRange(row, 1).getValue();
  const qr = sheet.getRange(row, 16).getValue();
  const editToken = sheet.getRange(row, 22).getValue(); // คอลัมน์ V: Edit Token

  // TODO: เปลี่ยนเป็น URL จริงของเว็บไซต์เมื่อ merge ขึ้น main แล้ว
  // (ต้องตรงกับ SITE_BASE_URL ใน Code.gs)
  const SITE_BASE_URL = 'https://intuwatnex.github.io/oskr17-reunion/test/';

  // ลิงก์ส่วนตัวสำหรับแก้ไข/ลบข้อมูล Connection Map ของตัวเอง
  // ถ้าแถวนี้ไม่มี Edit Token (เช่น ลงทะเบียนก่อนมีฟีเจอร์นี้) จะไม่แสดงลิงก์ในอีเมล
  const manageUrl = editToken
    ? SITE_BASE_URL + 'manage.html?id=' + encodeURIComponent(regID) + '&token=' + encodeURIComponent(editToken)
    : '';

  // ดึงไฟล์ Email.html มาเป็น Template
  const template = HtmlService.createTemplateFromFile('Email');

  // ส่งค่าตัวแปรไปยัง Template
  template.name = name;
  template.regID = regID;
  template.qr = qr;
  template.manageUrl = manageUrl;

  // ประมวลผลออกมาเป็น HTML string
  const htmlBody = template.evaluate().getContent();

  const subject = "ยืนยันการชำระเงิน | OSKR 17th Anniversary";

  // ส่งอีเมล
  GmailApp.sendEmail(
    email,
    subject,
    "",
    {
      htmlBody: htmlBody
    }
  );

  // บันทึกว่าส่งแล้ว
  sheet.getRange(row, 15).setValue("ส่งแล้ว");
}
