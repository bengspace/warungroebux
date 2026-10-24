# ROEBUX STORE (WARUNG_ROEBUX) — Siap Deploy di Vercel

Struktur project ini sudah dikonfigurasi khusus untuk **Vercel (`*.vercel.app`)** tanpa error `[unused_function]`:

```text
WARUNG_ROEBUX/
├── index.html                 # Halaman utama ROEBUX STORE (QRIS Dinamis ROEBUX - TELECOM, Roblox Real Avatar Checker, WA API 6289606457010)
├── api/
│   ├── roblox-check.js        # Serverless API: /api/roblox-check?u=USERNAME (Validate + User ID + Real 3D Avatar)
│   └── whatsapp-confirm.js    # Serverless API: /api/whatsapp-confirm (Konfirmasi otomatis ke WA 6289606457010)
├── vercel.json                # Konfigurasi Vercel bebas error [unused_function]
├── package.json               # ESM Node 18+ untuk Serverless Functions
├── google-sheets/
│   └── Code.gs                # Script Google Sheets Real-Time Database
└── supabase/
    └── schema.sql             # Skema SQL PostgreSQL / Supabase
```

## Cara Deploy ke GitHub (`WARUNG_ROEBUX`) & Vercel
1. Pastikan file di repository GitHub `aracheron/WARUNG_ROEBUX` menggunakan `vercel.json` dan `package.json` terbaru dari paket ini (atau hapus blok `"functions": { "api/*.js": ... }` di `vercel.json` dan pastikan folder `api/` berada di root sejajar dengan `index.html`).
2. Di Dashboard Vercel -> **Settings** -> **General** -> **Framework Preset**, pilih **`Other`** (bukan Next.js).
3. Klik **Redeploy** — proses build akan selesai dalam ±2 detik tanpa error.
