/**
 * OSKR17th Anniversary — Registration + Payment Slip handler
 *
 * SETUP (one-time):
 * 1. Create a new Google Sheet. In row 1, add these column headers:
 *    Timestamp | ประเภทบัตร | ราคา | ชื่อ-นามสกุล | ชื่อเล่น | เบอร์โทร | LINE ID | แพ้อาหาร | สายอาชีพ | รายละเอียดเพิ่มเติม | ลิงก์สลิป
 * 2. In the Sheet, go to Extensions -> Apps Script.
 * 3. Delete any starter code, paste this whole file in, save.
 * 4. Create a folder in Google Drive to store slip images. Copy its ID
 *    from the URL (drive.google.com/drive/folders/<THIS_PART>).
 * 5. Paste that folder ID into DRIVE_FOLDER_ID below.
 * 6. Click Deploy -> New deployment -> type: Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 7. Click Deploy, authorize the permissions Google asks for, then copy
 *    the Web App URL (ends in /exec).
 * 8. Send that URL back — it goes into CONFIG.registration.webAppUrl
 *    in assets/js/script.js on the website.
 */

const DRIVE_FOLDER_ID = 'PASTE_YOUR_DRIVE_FOLDER_ID_HERE'; // TODO

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    let slipUrl = '';
    if (data.slipBase64) {
      const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      const base64Data = data.slipBase64.split(',')[1] || data.slipBase64;
      const blob = Utilities.newBlob(
        Utilities.base64Decode(base64Data),
        data.slipMimeType || 'image/jpeg',
        `${data.name || 'slip'}_${new Date().getTime()}`
      );
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      slipUrl = file.getUrl();
    }

    sheet.appendRow([
      new Date(),
      data.ticketType || '',
      data.price || '',
      data.name || '',
      data.nickname || '',
      data.phone || '',
      data.lineId || '',
      data.allergy || '',
      data.occupation || '',
      data.detail || '',
      slipUrl,
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ result: 'success', slipUrl })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: 'error', message: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'OSKR17 registration endpoint is running' })
  ).setMimeType(ContentService.MimeType.JSON);
}
