/**
 * Google Apps Script Web App untuk Database Real-Time ROEBUX STORE
 * Spreadsheet URL: https://docs.google.com/spreadsheets/d/1nGeYjVnpaIxXvLJNSbx07pv1QujHx79dwkOMNEgjEbk/edit
 */
const SHEET_NAME = 'Data_Transaksi_RealTime';

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const data = rows.slice(1).filter(r => r[0]).map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    return {
      invoice: String(obj.No_Invoice || r[0]),
      timestamp: String(obj.Waktu_Order_WIB || r[1]),
      username: String(obj.Username_Roblox || r[2]),
      robloxUserId: String(obj.Roblox_User_ID || r[3]),
      robux: Number(obj.Paket_Robux || r[4] || 0),
      price: Number(obj.Total_Bayar_IDR || r[5] || 0),
      paymentMethod: String(obj.Metode_Pembayaran || r[6] || 'QRIS Dinamis'),
      paymentStatus: String(obj.Status_Pembayaran || r[7] || 'UNPAID'),
      orderStatus: String(obj.Status_Order_Tracking || r[8] || 'PENDING'),
      durationSec: Number(obj.Durasi_Kirim_Detik || r[9] || 0),
      whatsapp: String(obj.WhatsApp_Pembeli || r[10] || ''),
      crcHex: String(obj.CRC16_QRIS || r[11] || '')
    };
  });
  return ContentService.createTextOutput(JSON.stringify({ ok: true, transactions: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const body = JSON.parse(e.postData.contents || '{}');
  const tx = body.transaction || body;
  const rows = sheet.getDataRange().getValues();
  let foundRowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(tx.invoice)) {
      foundRowIndex = i + 1;
      break;
    }
  }
  const rowValues = [
    tx.invoice, tx.timestamp, tx.username, tx.robloxUserId,
    tx.robux, tx.price, tx.paymentMethod, tx.paymentStatus,
    tx.orderStatus, tx.durationSec || 0, tx.whatsapp || '',
    tx.crcHex || '', tx.note || ('Order ' + tx.orderStatus + ' untuk @' + tx.username)
  ];
  if (foundRowIndex > 0) {
    sheet.getRange(foundRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true, invoice: tx.invoice, status: tx.orderStatus }))
    .setMimeType(ContentService.MimeType.JSON);
}
