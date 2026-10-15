# Perubahan Before → After — Audit Bug & Hardening

Tanggal: 2026-10-15. Password awal `admin123` **tidak diganti** sesuai permintaan.
Cakupan: backend (`src/server`, `src/app/api`, `prisma`) + logika UI (`src/components`).
Layout/visual belum disentuh — baru perilaku & keamanan.

---

## 1. BE — PII Pengurus bocor ke publik

**Before:**
`GET /api/officials` dan `GET /api/officials/[id]` terbuka tanpa login.
`proxy.ts` meloloskan semua `GET /api/*`, route tidak punya cek sesi.
Akibat: `phone,email` + data nonaktif bisa diambil anonim.

**After:**
`src/app/api/officials/route.ts`, `src/app/api/officials/[id]/route.ts` wajib `requireAdminSession()` → 401 bila tanpa cookie.
Halaman publik `/pengurus` tidak rusak karena render langsung via service, bukan via API.

## 2. BE — Defense-in-depth + anti-CSRF Origin

**Before:**
`POST/PUT/DELETE` hanya dijaga `proxy.ts` di edge. Bila matcher berubah / proxy di-skip, tulis langsung terbuka.
Tanpa cek `Origin/Referer`.

**After:**
`src/server/api-helpers.ts: requireAdminSession(req)`:
- verifikasi cookie sesi,
- bila `Origin/Referer` ada, host harus sama dengan `Host` → tolak CSRF lintas-situs.

Dipakai di: `transactions`, `transactions/[id]`, `categories`, `categories/[id]`, `announcements`, `announcements/[id]`, `activities`, `activities/[id]`, `mosque-profile` (`PUT/PATCH`), `config` (`PUT`), `officials`, `uploads`.

## 3. BE — Guard superadmin terakhir via PUT

**Before:**
`deleteOfficial` menolak hapus superadmin terakhir, tapi `updateOfficial` tidak dicek.
`PUT {systemRole:"pengurus"}` / `{status:"inactive"}` pada satu-satunya superadmin sukses → 0 superadmin aktif.

**After:**
`src/server/services/officials.ts` hitung `nextRole/nextStatus`; bila satu-satunya superadmin aktif akan turun/nonaktif → `400` dengan pesan tunjuk pengganti dulu.

## 4. BE — `PUT {}` kosong jadi no-op 200

**Before:**
`officialInputSchema.partial()`, `categoryInputSchema.partial()`, `announcement/activity.partial()` lolos untuk `{}`.

**After:**
- `schemas.ts: officialUpdateSchema` = `partial().refine(min 1 key)`.
- `categories/[id]`, `announcements/[id]`, `activities/[id]` cek `Object.keys(raw).length === 0` → `400 "Tidak ada perubahan…"`.
- Transaksi sudah benar sebelumnya, kini konsisten.

## 5. BE — Sesi & login (password awal tetap)

**Before:**
- `POST /api/admin/session` tanpa rate-limit, tanpa delay.
- `GET /api/admin/session` kembalikan `isDefaultPassword:true` ke anonim.
- Ganti password tidak mencabut sesi lain (secret stateless tetap).
- `?next=//evil.com` diteruskan `router.replace(next)` → open redirect.

**After (tanpa mengubah nilai `admin123`):**
- `src/app/api/admin/session/route.ts`: rate-limit 5 gagal/10 mnt/IP → `429`, delay 500ms saat gagal, reset saat sukses.
- `GET` hanya ungkap `isDefaultPassword` bila sudah login; hint visual login tetap muncul default sehingga alur awal tidak berubah.
- `admin-auth.ts: changeAdminPassword`: tolak `new === current`, rotasi `SECRET_KEY` sehingga perangkat lain ikut logout. Nilai password saat ini tidak diubah.
- `src/app/admin/login/page.tsx`: `next` divalidasi `startsWith("/")` dan tolak `//`.

## 6. BE — Upload: auth + sniff magic-byte

**Before:**
`POST` hanya dijaga proxy, `GET` list terbuka. Validasi hanya `file.type` (dikontrol klien). Polyglot `fake.png` lolos.

**After:**
`src/app/api/uploads/route.ts`:
- `POST` + `GET` wajib `requireAdminSession()`.
- `sniffImageExt()` cek header `FF D8 FF` (JPG), `89 50 4E 47…` (PNG), `GIF8` (GIF), `RIFF….WEBP` (WEBP). Klaim MIME harus cocok dengan isi → `400 "Isi file bukan gambar valid"`.

## 7. BE — Jadwal salat

**Before (`prayer.ts`):**
- `nowMin` dari 2x `Intl.format` terpisah (bisa beda menit di boundary).
- Jangkar `12:00Z` rapuh untuk `UTC+12…+14`.
- Hijri `id-u-ca-islamic` selisih 1-2 hari vs Kemenag.
- `getPrayerSchedule` fetch profil 2x.

**After:**
- `nowMin` dari 1x `formatToParts(hour+minute)`.
- Jangkar `05:00Z` aman untuk WIB/WITA/WIT maupun `UTC-12…+14`.
- Hijri `id-u-ca-islamic-umalqura` + fallback `islamic`.
- `getPrayerSchedule` pakai `week[0]` (hari ini zona masjid), tanpa query kedua.

## 8. UI logika — Tabel publik harian/mingguan

**Before (`TransactionTable.tsx`):**
- Harian: `t.date >= todayStr` → termasuk masa depan.
- Mingguan: `t.date >= weekStr` → tak terbatas ke depan.

**After:**
- Harian: `t.date === todayStr`.
- Mingguan: `t.date >= weekStr && t.date <= todayStr` (Minggu 00:00 WIB s.d. hari ini).

## 9. UI logika — Label bulan/tahun ikut TZ browser

**Before:**
- `FinancialSummaryCards.tsx`: `new Date().toLocaleDateString(...)` + `new Date().getFullYear()`.
- `DashboardOverview.tsx`: `new Date().toLocaleDateString(...)`.
Jam 00:30 WIB bisa beda bulan/tahun vs backend `Asia/Jakarta`.

**After:**
- `FinancialSummaryCards.tsx`: `Intl.DateTimeFormat(..., {timeZone:"Asia/Jakarta"})` untuk `monthLabel` + `currentYear`.
- `DashboardOverview.tsx`: `monthLabel` WIB dengan `month+year`.

## 10. UI logika — Sort & tahun tabel admin

**Before (`TransactionsPage.tsx`):**
- Sort tanggal via `new Date(a.date)` (UTC midnight, bisa geser).
- Tahun via `new Date(txn.date).getFullYear()`.

**After:**
- Sort tanggal string-compare `a.date < b.date` (format `yyyy-MM-dd` aman & imun TZ).
- Tahun via `txn.date.slice(0,4)`.

## 11. UI logika — Settings set-state saat render + fallback diam-diam

**Before (`SettingsPage.tsx`):**
- `if (fetchedProfile && !profile) setProfile(...)` dan `if (fetchedConfig && !configLoaded)` di badan render → render beruntun.
- `parseInt(...) || 1985` → kosong diam-diam jadi `1985`.

**After:**
- Pindah ke `useEffect` dengan deps tepat.
- `establishedYear`: kosong → `0` agar ditolak backend (`min 1900`) dengan pesan jelas.

## 12. BE — Seed & kode mati

**Before:**
`prisma/seed.ts` hitung `prayerDay` padahal tabel `PrayerDay/PrayerTime` sudah mati (jadwal dihitung otomatis).

**After:**
Hapus `jadwalSholat: count prayerDay` dari laporan seed. Tabel belum di-drop (butuh migrasi) — tunda sampai setelah UI.

---

## Verifikasi

- `npx tsc --noEmit` → lolos.
- `npm run build` → sukses (26 routes).
- `tsx`: `2026-02-30` ditolak, `2026-10-15` diterima, `officialUpdateSchema({})` & `transactionUpdateSchema({})` ditolak dengan pesan min-1-field.

## Sengaja belum dikerjakan

- RBAC per-peran nyata (masih 1 password bersama).
- Drop tabel `PrayerDay/PrayerTime` (butuh migrasi).
- Token CSRF khusus (tertahan `SameSite=lax` + cek Origin lapis-2).
- Redesign layout/UI visual.
