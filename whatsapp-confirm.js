// Vercel Serverless Function: Konfirmasi Pembelian ke WhatsApp Admin 6289606457010
// File: api/whatsapp-confirm.js
// Endpoint: POST /api/whatsapp-confirm

const ADMIN_WA = process.env.ADMIN_WHATSAPP_NUMBER || "6289606457010";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const body = req.method === "POST" ? (req.body || {}) : (req.query || {});
  const invoice = body.invoiceNumber || body.invoice || "ROE-ORDER";
  const username = body.robloxUsername || body.username || "-";
  const userId = body.robloxUserId || "-";
  const robux = body.robuxAmount || body.robux || 50;
  const price = Number(body.amountIdr || body.price || 8000);
  const buyerWa = body.buyerWhatsapp || "-";
  const timestamp = body.timestamp || new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

  const message = [
    "*✅ KONFIRMASI PEMBELIAN ROEBUX STORE*",
    `No. Invoice : ${invoice}`,
    `Waktu WIB   : ${timestamp}`,
    `Username    : @${username} (ID: ${userId})`,
    `Paket Robux : ${robux} Robux (Via USN / Send)`,
    `Total Bayar : Rp ${price.toLocaleString("id-ID")} (QRIS Dinamis ROEBUX - TELECOM - LUNAS)`,
    `WA Pembeli  : ${buyerWa}`,
    `Status      : Pembayaran Terkonfirmasi & Auto-Order Diproses!`
  ].join("\n");

  let gatewaySent = false;
  const targets = [ADMIN_WA, buyerWa !== "-" ? buyerWa : null].filter(Boolean).join(",");
  if (process.env.FONNTE_API_TOKEN) {
    try {
      const fRes = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: { Authorization: process.env.FONNTE_API_TOKEN },
        body: new URLSearchParams({ target: targets, message })
      });
      gatewaySent = fRes.ok;
    } catch (_) {}
  }

  const waApiUrl = `https://api.whatsapp.com/send?phone=${ADMIN_WA}&text=${encodeURIComponent(message)}`;
  const waMeUrl = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(message)}`;

  return res.status(200).json({
    ok: true,
    adminWhatsapp: ADMIN_WA,
    gatewaySent,
    waApiUrl,
    waMeUrl,
    message
  });
}
