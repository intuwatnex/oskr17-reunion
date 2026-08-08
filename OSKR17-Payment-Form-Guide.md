# เพิ่มหน้ากรอกฟอร์ม + บันทึกเงินเข้า Google Form/Sheet
## OSKR17th Anniversary — Payment Form Guide

---

## 1. ข้อจำกัดที่ต้องเข้าใจก่อน

เว็บที่ทำเป็น static site (HTML/JS ล้วน ไม่มี backend/server) **ไม่สามารถรับชำระเงินจริงผ่านบัตรเครดิตได้เอง** ต้องพึ่ง third-party เสมอ สำหรับงาน reunion แบบนี้ วิธีที่คนไทยใช้กันทั่วไปคือ:

> กรอกฟอร์ม (ชื่อ-รุ่น-ประเภทบัตร) → โอนเงินผ่าน PromptPay QR → แนบสลิปโอนเงิน → ระบบบันทึกข้อมูล + สลิป เก็บไว้ให้ทีมงานตรวจสอบ

นี่คือแนวทางที่ผมแนะนำ เพราะไม่ต้องขอใบอนุญาตรับชำระเงิน (payment gateway license) และทำได้เร็ว

มี 2 วิธีหลักในการ "save ข้อมูลเข้า Google" โดยไม่มี backend ของตัวเอง:

| วิธี | ข้อดี | ข้อจำกัด |
|---|---|---|
| **A. ยิงข้อมูลเข้า Google Form ที่มีอยู่แล้ว** | ตั้งค่าเร็ว ไม่ต้องเขียนโค้ด backend | **แนบไฟล์สลิปไม่ได้** (Google Form ต้อง login ถึงจะอัปโหลดไฟล์ได้ ใช้กับ guest ไม่ได้) |
| **B. Google Apps Script เป็น Web App (แนะนำ)** | แนบรูปสลิปได้ บันทึกลง Google Sheet + เก็บไฟล์ใน Drive อัตโนมัติ ควบคุม field ได้เต็มที่ | ต้องตั้งค่า Apps Script เพิ่ม (ไม่ยาก ทำตามได้) |

เพราะงานนี้น่าจะอยากให้แนบสลิปโอนเงินด้วย **แนะนำวิธี B** แต่ผมใส่ทั้งสองวิธีไว้ให้เลือก

---

## 2. วิธี A — ยิงข้อมูลเข้า Google Form (ไม่มีไฟล์แนบ)

### ตั้งค่า Google Form
1. สร้าง Google Form ใหม่ ใส่คำถามให้ตรงกับฟอร์มในเว็บ เช่น ชื่อ-นามสกุล, เบอร์โทร, ประเภทบัตร (Early Bird/Regular), Line ID
2. กด **ดูตัวอย่างฟอร์ม** (ไอคอนรูปตา) แล้วเปิด **View Page Source** (Ctrl+U หรือคลิกขวา → ดูซอร์สหน้าเว็บ)
3. หา `entry.XXXXXXX` ของแต่ละคำถาม (ค้นหาคำว่า `entry.` ในซอร์ส) จด ID ของทุกช่องไว้
4. หา URL สำหรับส่งข้อมูล: จะเป็นรูปแบบ
   `https://docs.google.com/forms/d/e/FORM_ID/formResponse`
   (เอา FORM_ID จาก URL ของฟอร์ม เปลี่ยน `/viewform` เป็น `/formResponse`)

### วิธีส่งข้อมูลจากเว็บ (ใช้ fetch + mode: no-cors)
ส่งได้ แต่จะไม่เห็น response กลับมา (ข้อจำกัดของ Google) ต้อง design UX ให้ขึ้น "ส่งข้อมูลสำเร็จ" ทันทีหลังกดส่ง โดยไม่รอ response

---

## 3. วิธี B — Google Apps Script Web App (แนะนำ รองรับแนบสลิป)

### ขั้นตอนตั้งค่า (ทำครั้งเดียว)

1. สร้าง **Google Sheet** ใหม่ ตั้งชื่อคอลัมน์แถวแรก เช่น:
   `Timestamp | ชื่อ-นามสกุล | เบอร์โทร | Line ID | ประเภทบัตร | ราคา | ลิงก์สลิป`

2. ในชีทนั้น ไปที่เมนู **ส่วนขยาย (Extensions) → Apps Script**

3. วางโค้ดนี้ (Claude Code จะช่วยปรับให้ตรงกับ field ของคุณอีกที):

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const folder = DriveApp.getFolderById('YOUR_DRIVE_FOLDER_ID'); // โฟลเดอร์เก็บสลิป

  const data = JSON.parse(e.postData.contents);
  let slipUrl = '';

  if (data.slipBase64) {
    const blob = Utilities.newBlob(
      Utilities.base64Decode(data.slipBase64.split(',')[1]),
      data.slipMimeType,
      data.name + '_slip'
    );
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    slipUrl = file.getUrl();
  }

  sheet.appendRow([
    new Date(),
    data.name,
    data.phone,
    data.lineId,
    data.ticketType,
    data.price,
    slipUrl
  ]);

  return ContentService.createTextOutput(
    JSON.stringify({ result: 'success' })
  ).setMimeType(ContentService.MimeType.JSON);
}
```

4. กด **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. กด Deploy จะได้ **Web App URL** (รูปแบบ `https://script.google.com/macros/s/XXXXX/exec`) — เก็บ URL นี้ไว้ ใช้ในหน้าเว็บ
6. สร้างโฟลเดอร์ใน Google Drive สำหรับเก็บสลิป เอา Folder ID (จาก URL) ไปใส่แทน `YOUR_DRIVE_FOLDER_ID` ในโค้ดข้างบน

---

## 4. Prompt สำหรับสั่ง Claude Code (คัดลอกไปใช้ได้เลย)

```
เพิ่มหน้า/section "ลงทะเบียนและชำระเงิน" ในเว็บ OSKR17th Anniversary 
ที่ทำไว้แล้ว (ธีม Time Machine เดิม) โดยมีรายละเอียดดังนี้:

FLOW ของฟอร์ม:
1. ผู้ใช้เลือกประเภทบัตร (Early Bird / Regular) — ราคาต้อง auto-fill ตาม
   ประเภทที่เลือก และถ้า Early Bird หมดเขตแล้วให้ disable ตัวเลือกนั้น
2. กรอกฟอร์ม: ชื่อ-นามสกุล, เบอร์โทร, LINE ID, (เพิ่ม field อื่นได้ตามต้องการ)
3. แสดง PromptPay QR Code สำหรับโอนเงิน (ใช้ placeholder image 
   /assets/promptpay-qr.png ที่จะเปลี่ยนเป็นรูปจริงทีหลัง) พร้อมเลขบัญชี/พร้อมเพย์ 
   และยอดเงินที่ต้องโอน (ตรงกับประเภทบัตรที่เลือก)
4. ให้ผู้ใช้อัปโหลดรูปสลิปโอนเงิน (input type=file, accept="image/*", 
   แปลงเป็น base64 ก่อนส่ง)
5. กดปุ่ม "ยืนยันการลงทะเบียน" → ส่งข้อมูลทั้งหมด (รวม base64 ของสลิป) 
   ไปยัง Google Apps Script Web App ผ่าน fetch() แบบ POST 
   (URL ปลายทางให้ทำเป็น constant ต้นไฟล์ชื่อ GOOGLE_SCRIPT_URL 
   เพื่อให้แก้ไขง่าย — ตอนนี้ใส่ placeholder ไว้ก่อน)
6. ระหว่างส่งข้อมูล แสดง loading state บนปุ่ม
7. เมื่อส่งสำเร็จ แสดงหน้า/modal "ลงทะเบียนสำเร็จ" พร้อมสรุปข้อมูลที่กรอก 
   และข้อความแจ้งว่าทีมงานจะตรวจสอบสลิปและยืนยันกลับทาง LINE ภายใน X วัน
8. ถ้าส่งไม่สำเร็จ (network error) แสดงข้อความ error ที่ชัดเจน 
   พร้อมปุ่มลองใหม่ และสำรองด้วยการโชว์เบอร์/LINE ติดต่อโดยตรง

VALIDATION:
- ชื่อ-นามสกุล, เบอร์โทร (รูปแบบเบอร์ไทย), และไฟล์สลิป เป็นฟิลด์บังคับ
- ก่อน submit ให้ preview รูปสลิปที่อัปโหลดให้ผู้ใช้เห็นก่อนกดยืนยัน
- จำกัดขนาดไฟล์สลิปไม่เกิน 5MB พร้อมแจ้งเตือนถ้าเกิน

DESIGN:
- ใช้โทนสี/ฟอนต์เดิมของเว็บ (กรมท่าเข้ม/ทอง/มินิมอล time machine theme)
- ฟอร์มควรดู clean เป็นขั้นตอนชัดเจน (อาจทำเป็น step แบบ 1-2-3 หรือฟอร์มเดียว 
  ยาวลงมาก็ได้ แล้วแต่ความเหมาะสม)
- Responsive เต็มรูปแบบ โดยเฉพาะช่องอัปโหลดรูปที่ต้องใช้งานง่ายบนมือถือ 
  (เปิดกล้องถ่ายสลิปได้เลยถ้าเป็นไปได้)

TECHNICAL:
- เขียนเป็น JS แยกฟังก์ชันชัดเจน: handleFileUpload, validateForm, 
  submitToGoogleScript, showSuccessState, showErrorState
- Comment กำกับจุดที่ต้องแก้ไข เช่น 
  "// TODO: ใส่ Google Apps Script Web App URL ที่นี่" และ 
  "// TODO: ใส่ URL รูป PromptPay QR จริง"
```

---

## 5. Checklist ก่อนใช้งานจริง

- [ ] สร้าง Google Sheet + Apps Script ตามขั้นตอนข้อ 3 แล้ว deploy เป็น Web App
- [ ] เอา Web App URL มาใส่แทน placeholder ในโค้ดเว็บ
- [ ] เตรียมรูป PromptPay QR Code จริง (โหลดจากแอปธนาคาร) ใส่แทนไฟล์ placeholder
- [ ] ทดสอบส่งฟอร์มจริง 1 รอบ เช็คว่าเข้า Google Sheet ถูกต้อง และไฟล์สลิปขึ้นใน Drive
- [ ] ตั้งค่า Sharing ของ Drive folder ให้ทีมงานที่เกี่ยวข้องเข้าถึงได้
- [ ] เตรียมขั้นตอนหลังบ้าน: ใครเช็คสลิป และยืนยันตัวผู้ลงทะเบียนกลับอย่างไร (เช่น 
  ทีมงานเปิด Sheet เช็คทุกวัน แล้วทัก LINE ยืนยัน)

---

**หมายเหตุด้านความปลอดภัย:** วิธีนี้เก็บสลิปเป็นรูปใน Drive ของคุณเอง ไม่มีการส่งข้อมูลบัตรเครดิต/ข้อมูลธนาคารผ่านเว็บโดยตรง จึงไม่ต้องกังวลเรื่อง PCI compliance แต่ควรระวังเรื่องข้อมูลส่วนบุคคล (เบอร์โทร, ชื่อ) ให้เข้าถึงได้เฉพาะทีมงานที่เกี่ยวข้อง
