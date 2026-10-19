# Rencana Perbaikan — Website Pengelolaan Keuangan & Profil Masjid

Hasil audit menyeluruh (baca kode + `tsc --noEmit` + `eslint` + inspeksi read-only `prisma/dev.db`).
Tanggal audit: **2026-10-19**. Rujukan bukti memakai format `file:baris`.

Dokumen ini adalah **daftar kerja** (backlog terprioritas), bukan catatan historis.
Untuk riwayat audit lama (2026-10-04) lihat `DIAGNOSIS.md`.

> **Status (2026-10-19, sesi implementasi):** **P0 selesai 8/9 (P0.7 tinggal uji manual),
> P1 selesai 8/8, P2 selesai 6/10, P3 selesai 5/12.**
> **0 error lint** (dari 19). Item yang masih `[ ]` menunggu **keputusan produk**
> (P2.1, P2.5, P2.7, P2.8) atau memang pekerjaan lanjutan (P3.1, P3.4–P3.7, P3.11, P3.12).
> Rincian bukti uji ada di lampiran terakhir; keputusan yang sudah dijawab ada di bagian
> "Keputusan" di bawah.

---

## 0. Ringkasan status

| Aspek | Sebelum | Sesudah |
|---|---|---|
| Kompilasi tipe (`npx tsc --noEmit`) | ✅ Lolos | ✅ Lolos |
| Build produksi (`npm run build`) | ✅ Lolos | ✅ Lolos |
| Lint (`npx eslint .`) | ⚠️ 19 error + 70 warning | ✅ **0 error** + 31 warning (`no-img-element` saja, disengaja) |
| CRUD inti (transaksi, kategori, berita, kegiatan, pengurus, profil, config) | ✅ Tersambung | ✅ Tersambung |
| Halaman publik (`/`, `/keuangan`, `/berita`, `/kegiatan`, `/pengurus`, detail) | ✅ Berfungsi | ✅ Berfungsi + `404` & `error` ramah |
| Keamanan panel admin | ❌ 1 temuan KRITIS | ✅ Kata sandi bawaan tidak lagi diiklankan + diperingatkan terus di panel (*gerbang paksa* dibatalkan atas keputusan pengurus) |
| Bug tampilan (zona waktu, laporan tahunan, anchor, OG) | ⚠️ 8 temuan | ✅ Ditutup |
| Fitur setengah jalan / tidak tersambung | ⚠️ 10 temuan | ⚠️ 4 tersisa (menunggu keputusan) |
| Kerapian & aksesibilitas (lint, `htmlFor`/`id`, `Link`) | ⚠️ 19 error lint, 7 label tanpa `htmlFor`, Navbar `<a>` | ✅ 0 error lint, semua `htmlFor` berpasangan, Navbar `next/link` |

### Fakta database saat audit

- Profil: 1 baris (Ar-Rahman, `Asia/Jakarta`, lat -8.09, lon 112.16, 2 `heroImages`, **`coverImageUrl` kosong**).
- Kategori 3 · Transaksi 2 (saldo Rp 1.500.000) · Berita 6 · Kegiatan 2 · Pengurus 4 (1 superadmin, semua `active`).
- Config: `publicTransparency=true`, `showDonationQRIS=true`, rekening BNI terisi.
- 🚨 **`admin_password_is_default = 1` → kata sandi panel masih `admin123`.** Sejak perbaikan, nilai ini
  tidak lagi ditampilkan ke publik; panel tetap bisa dipakai, tetapi setiap halaman admin
  menampilkan spanduk peringatan + tautan langsung ke Pengaturan → Keamanan.
- Tabel `PrayerDay`/`PrayerTime`: 0 baris (skema mati, perhitungan memakai `adhan`) —
  **sudah dihapus** dari skema + migrasi `20261019044245_drop_unused_prayer_tables` (P3.8).
- Integritas data bersih; satu-satunya anomali: 2 transaksi menyimpan `proofUrl = ""`
  (sudah dinormalisasi saat dibaca → UI menampilkan **"Tanpa bukti"**).

---

## P0 — Keamanan

- [x] **P0.1 — Hapus iklan kata sandi bawaan di halaman login.**
  Banner `admin123` + tombol "Isi otomatis admin123" (`login/page.tsx:80,354-382`) **dihapus**;
  `showDefaultHint` tidak lagi berdefault `true`. Informasi "ganti kata sandi" kini hanya
  muncul **di dalam panel** (setelah login).
  **Bukti uji:** `GET /admin/login` → tidak ada string `admin123` maupun "Isi otomatis".

- [x] **P0.2 — Kata sandi bawaan: diperingatkan, tidak dipaksa.** ⚠️ **keputusan berubah**
  Awalnya dipasang gerbang paksa di `src/proxy.ts` (semua `/admin/*` selain Pengaturan
  dialihkan ke `/admin/settings?mustChangePassword=1`). Pada 2026-10-19 pengurus memutuskan
  **gerbang itu dibatalkan** — pengurus memilih tetap bisa berpindah menu sambil diperingatkan:
  - `proxy.ts` kembali hanya menjaga autentikasi (redirect ke login bila tanpa sesi);
    blok gerbang + konstanta `PASSWORD_GATE_EXEMPT` dihapus.
  - Spanduk `AdminLayout` berbunyi jujur tanpa kata "terkunci": *"Kata sandi panel masih memakai
    nilai bawaan — panel jadi mudah ditebak orang lain"* + tautan **Ganti sekarang** ke
    `/admin/settings?tab=security` (tab Keamanan langsung terbuka; `SettingsPage` membaca `?tab=`).
  - Pengiklanan `admin123` di halaman login **tetap** dihapus (P0.1) — itu bagian yang kritis.
  **Bukti uji:** tanpa sesi → `307` ke `/admin/login?next=…`; **dengan** sesi & kata sandi masih
  bawaan, `/admin`, `/admin/transactions`, `/admin/users`, `/admin/reports`, `/admin/announcements`,
  `/admin/activities`, `/admin/categories`, `/admin/prayer-schedule` → semuanya `200`
  (tidak ada lagi pengalihan), `/admin/settings?tab=security` → `200`.

- [x] **P0.3 — Perbaiki pesan `500` saat kata sandi baru sama dengan lama.**
  `changeAdminPassword` kini melempar `BadRequestError` (`admin-auth.ts`) sehingga `fail()`
  memetakannya ke **400**, bukan 500.
  **Bukti uji:** "kata sandi saat ini salah", "harus berbeda dari saat ini", "minimal 8 karakter",
  "kata sandi bawaan tidak boleh dipakai lagi" → semuanya **400** dengan pesan jelas.

- [x] **P0.4 — Jangan keluarkan pengguna setelah ganti kata sandi.**
  Rotasi secret memutus sesi lama (perilaku yang diinginkan), jadi `PUT /api/admin/password`
  kini **menerbitkan sesi baru** dan menyetel ulang cookie. Cookie dibuat lewat satu sumber
  bersama `adminSessionCookie()` (dipakai juga oleh route session) agar tidak drift.
  **Bukti uji:** setelah `200`, `GET /api/admin/session` → `authenticated:true`, `/admin` → `200`.

- [x] **P0.5 — Rate-limit login tidak bisa dilewati / tidak mengunci semua orang.**
  Header proxy hanya dipercaya bila `TRUST_PROXY=1`; ditambahkan **batas global**
  (30 gagal/10 menit) di samping batas per-IP (5 gagal/10 menit) + pembersihan entri basi.
  Tanpa proxy, rotasi `x-forwarded-for` tidak lagi membebaskan brute-force; menambah
  `TRUST_PROXY=1` mengembalikan pembatasan per-IP asli.
  **Bukti uji:** 5 percobaan gagal → `401`, percobaan ke-6 → **429**.

- [x] **P0.6 — Logout benar-benar bisa mencabut token.**
  `DELETE /api/admin/session?all=1` merotasi secret (semua perangkat keluar); tombol
  **"Cabut semua sesi"** ditambahkan di Pengaturan → Keamanan. Logout biasa tetap idempotent.
  **Bukti uji:** `DELETE …?all=1` → `{"success":true,"revoked":"all"}`; sesi berikutnya `authenticated:false`.

- [ ] **P0.7 — Singleton superadmin: pastikan tidak bisa jadi 0.**
  Guard sudah ada di `DELETE` dan `PUT/PATCH` (`officials.ts:76-89,112-121`) — **belum diuji
  manual ulang** di sesi ini. Uji: (1) demote superadmin terakhir, (2) nonaktifkan superadmin
  terakhir — keduanya harus ditolak.

- [x] **P0.8 — Jangan bocorkan `error.message` non-Prisma.**
  `fail()` kini selalu membalas `"Terjadi kesalahan server. Coba beberapa saat lagi."` untuk
  galat tak terduga; detail hanya masuk log server. Kelas baru `NotFoundError` memetakan
  benar-benar-tidak-ada → **404** (sebelumnya 400).

- [x] **P0.9 — RBAC: klaim peran dicabut dari UI.** ✅ **diputuskan: opsi (b)**
  Data `Official.systemRole`, enum, dan guard superadmin-terakhir **tetap** (dipakai teknologi,
  bukan otorisasi). Yang dihapus hanya **klaim** hak akses per peran yang tidak pernah diperiksa:
  - `UsersPage` (Pengurus): lencana `getRoleBadge`/`TIER_LABEL` dibuang — hanya **superadmin**
    yang diberi lencana (satu-satunya peran yang benar-benar berefek, lewat guard);
    pemilih peran menjadi 2 opsi jujur (*Penanggung jawab teknis* ↔ *Pengurus*) dengan
    penjelasan bahwa peran **tidak** membatasi akses; nilai lama `admin`/`bendahara`
    dinormalisasi ke `pengurus` (`toAssignableRole`); statistik "Pengurus Nonaktif" menggantikan
    klaim "Pengelola Kas & Web".
  - `OfficialsSection` (publik): lencana tingkat/pengelola berbasis `systemRole` dibuang —
    jabatan publik murni dari `role`.
  - `TransactionTable`: catatan "khusus bendahara" diganti keterangan baca-saja yang faktual.

---

## P1 — Bug yang terlihat jamaah / pengurus

- [x] **P1.1 — Laporan tahunan salah saji (partial year).**
  `/api/chart` kini mendukung `?year=YYYY` (`getChartDataByYear`) dan `ReportsPage`
  mengambil grafik **sesuai tahun yang dipilih**; label "Rekap … tahun X" memakai tahun aktif.
  **Bukti uji:** `?year=2025` → 12 baris Jan–Des; `?year=abcd` → 400.

- [x] **P1.2 — "Hari ini" di halaman Kegiatan memakai UTC.**
  Diganti dengan `todayISO(timeZone)` dari `src/lib/utils.ts` (zona masjid) di
  `ActivitiesPage` (status, tanggal default form) dan `TransactionFormDialog`.

- [x] **P1.3 — Label zona waktu di-hardcode `WIB`.**
  Helper tunggal `shortZone()` di `src/lib/utils.ts`, dipakai `Hero`, `ActivitiesSection`,
  `kegiatan/page`, `kegiatan/[id]`, dan `ActivitiesPage`; `Hero` & `PrayerScheduleSection`
  tidak lagi menyimpan salinan sendiri.

- [x] **P1.4 — `formatDate`/`formatTime` tanpa `timeZone`.**
  Helper tanggal kini eksplisit: **tanggal-saja** (`yyyy-MM-dd`) diformat dalam UTC (tidak
  pernah bergeser hari), **timestamp penuh** diformat di zona masjid. Perbandingan hari
  (`dayNumber`, `daysUntil`, filter periode) memakai string kalender UTC → bebas
  hydration mismatch.

- [x] **P1.5 — Modul keuangan mengabaikan zona waktu masjid.**
  `finance.ts` membaca `MosqueProfile.timezone` (bukan hardcode) untuk bucket bulan/tahun
  dan grafik. `FinancialSummaryCards` & `TransactionTable` menerima prop `timeZone` dan
  diisi dari profil di `/keuangan`; `DashboardOverview` memakai zona profil.
  *(Catatan: komponen admin yang tidak menerima profil tetap memakai default
  `DEFAULT_TIME_ZONE` — aman untuk masjid WIB, dan nilainya bisa diteruskan kapan saja.)*

- [x] **P1.6 — Anchor mati.**
  `id="jadwal-sholat"` selalu ada (juga pada Hero fallback tanpa profil);
  `#donasi` dipindah ke pembungkus di `/keuangan` sehingga tetap ada walau strip rekening
  disembunyikan admin.

- [x] **P1.7 — Pratinjau berbagi (OG/Twitter) rusak.**
  `public/og-image.png` yang tidak pernah ada **diganti** `src/app/opengraph-image.tsx`
  (kartu 1200×630 dinamis dari nama/alamat masjid, `force-dynamic`), `metadataBase` diisi dari
  `NEXT_PUBLIC_SITE_URL`, judul OG memakai nama masjid dari DB, dan placeholder
  `google-site-verification-code` hanya muncul bila env-nya diisi.
  **Bukti uji:** `GET /opengraph-image` → `200 image/png`.

- [x] **P1.8 — Halaman detail dengan error tidak ramah.**
  Ditambahkan `src/app/not-found.tsx` (berbranding: Navbar + Footer + CTA),
  `src/app/error.tsx` (batas galat global dengan "Coba lagi"), dan indikator muat
  publik `src/components/public/PageLoading.tsx` yang dipasang per-folder
  (`berita/`, `kegiatan/`, `keuangan/`, `pengurus/`) — **bukan** di `app/loading.tsx`
  agar tidak ikut menutupi panel admin.
  **Bukti uji:** `/halaman-tidak-ada` → **404** (bukan halaman polos Next).

---

## P2 — Fitur setengah jalan / tidak tersambung

- [ ] **P2.1 — Papan jadwal sholat 7 hari tidak pernah tampil.** ⚠️ **butuh keputusan**
  `src/components/public/PrayerScheduleSection.tsx` (±800 baris, lengkap) tidak diimport di mana pun.
  Pilih **(a)** pasang di beranda/`/jadwal-sholat` — perhatikan `id="jadwal-sholat"` akan
  bertabrakan dengan Hero yang sudah memakai id itu (`:671,707` di dalam berkas ini berada pada
  cabang yang saling eksklusif, jadi bukan bug) — atau **(b)** hapus.
  *(Sesi ini hanya membereskan dua error lint di dalamnya: penanda "sudah di klien?" memakai
  `useSyncExternalStore`, tanggal terbuka dihitung saat render, dan no-op accordion
  `prev === d ? d : d` disederhanakan.)*

- [x] **P2.2 — Ringkasan keuangan di beranda: dikembalikan.** ✅ **diputuskan: opsi (a)**
  Beranda kini punya satu blok `id="keuangan"` berisi **kartu ringkasan** (`FinancialSummaryCards`),
  **grafik tren 12 bulan** (`FinancialChart` baru: tab Area/Garis/Batang, tooltip bertipe, empty
  state, sorotan bulan terbaik) dan **tabel transaksi** (`TransactionTable`) — section
  "pengumuman + kegiatan + pengurus" tetap di bawahnya.
  - Grafik dihitung dari transaksi yang **sudah** diambil beranda lewat fungsi murni
    `buildChartFromTransactions` (`finance.ts`) — tidak ada query ketiga.
  - `publicTransparency=false` menghormati keputusan pengurus: kartu + grafik tetap tampil
    (angka agregat), tabel rincian diganti catatan + tautan `/keuangan`.
  - Efek samping: temuan "query `financialSummary`/`transactions` tidak dipakai" ikut tertutup.

- [x] **P2.3 — Dashboard admin bisa macet skeleton selamanya.**
  `DashboardOverview` kini menangani `error` dari profil (404) dengan kartu penjelasan +
  tombol ke Pengaturan → Profil Masjid.

- [x] **P2.4 — Halaman admin lain juga mengabaikan `error` → skeleton abadi.**
  Komponen baru `AdminErrorState` dipakai di `AnnouncementsPage`, `ActivitiesPage`,
  `PrayerSchedulePage` (pola seragam: judul, pesan, "Muat ulang", tautan tindak lanjut).

- [ ] **P2.5 — Paginasi server-side tidak dipakai UI.** ⚠️ **butuh keputusan**
  Masih semua komponen menarik data penuh tanpa `?page&limit&q`. Pilih: pindahkan
  paginasi/filter ke server, atau hapus kode server yang tak terpakai.
  **Catatan yang belum ditutup:** `GET /api/transactions` masih mengubah bentuk respons
  (array vs `{data,total,…}`) mengikuti param → perlu satu kontrak.

- [x] **P2.6 — `coverImageUrl` tidak ada di form Pengaturan.**
  Kolom unggah "Foto sampul (opsional)" ditambahkan di bagian *5. Foto Halaman Depan*.

- [ ] **P2.7 — Tanggal terbit berita tidak bisa diatur dari UI.** ⚠️ **butuh keputusan**
  Form berita masih tanpa field `publishedAt`; backend selalu `new Date()`.
  Menambahkannya = fitur baru (perlu field + validasi + migrasi perilaku).

- [x] **P2.8 — Toggle "Tampilkan Kode QRIS Infaq Digital" & gambar QRIS terpasang.**
  - `qrisImageUrl` ditambahkan ke `AppConfig` (`types`), `config.ts`, `schemas.ts`, dan form `SettingsPage` (Tab Rekening & QRIS via `ImageUploadField`).
  - Label toggle di Preferensi diperjelas menjadi *"Tampilkan Kanal Donasi (Rekening & QRIS)"*.
  - `DonationTransfer` menampilkan gambar QRIS + opsi transfer rekening secara berdampingan.
  - `Hero` kini menghormati saklar `showDonationQRIS` secara konsisten dengan `/keuangan`, serta menyediakan tautan *"Scan QRIS"* langsung ke `#donasi`.

- [x] **P2.9 — Bukti transaksi bisa menjadi tautan hiasan.**
  Data lama `""` sudah dinormalisasi saat dibaca (`toTransaction` → `undefined`);
  dialog detail admin kini menampilkan **"Tanpa bukti."** secara eksplisit.

- [x] **P2.10 — Beranda gagal total bila satu service error.**
  `getPublicHomeData` memakai `Promise.allSettled` + fallback netral per bagian
  (log ke server), sehingga tiap section tetap tampil dengan empty state-nya.

---

## P3 — Ketahanan, data, dan kerapian

- [ ] **P3.1 — Berkas gambar yatim menumpuk & hilang saat deploy.**
  Belum dikerjakan (butuh keputusan strategi penyimpanan: volume ter-mount atau object storage,
  plus `DELETE /api/uploads` + `unlink` saat entri diganti/dihapus).

- [x] **P3.2 — Pencarian nominal transaksi tidak berfungsi.**
  Klien mencocokkan angka murni hasil `strip non-digit` (jadi `50000` & `Rp 50.000` sama-sama
  menemukan), dan `getTransactionsPaged` juga mencari `amount` di sisi server.

- [x] **P3.3 — Status HTTP tidak konsisten.**
  `NotFoundError` baru → update/delete kategori & update transaksi yang tidak ada membalas **404**
  (delete transaksi sudah 404 via `P2025`).

- [ ] **P3.4 — Keunikan nama kategori hanya per-tipe dan tidak dijaga DB.** (butuh keputusan aturan + migrasi)
- [ ] **P3.5 — Filter komposisi & tren bisa menyesatkan saat data kosong.** (terkait P2.5)
- [x] **P3.6 — Input angka `0` diperlakukan sebagai kosong.**
  Kolom angka di `SettingsPage` tidak lagi menulis langsung ke state `number` lewat
  `parseFloat(...) || 0`. Kini ada lapisan **draft teks** (`numDrafts` + `numText`/`numValue`/`draftNumber`):
  - Mengetik `0` **tidak lagi terhapus** (dulu nilai tersimpan 0 dianggap kosong oleh `value={x || ""}`
    sehingga React menimpanya kembali dengan string kosong).
  - Mengosongkan kolom tidak diam-diam menjadi `0`: saat Simpan, `latitude`/`longitude`/`establishedYear`
    divalidasi dan ditolak dengan pesan jelas ("wajib diisi berupa angka"); `minBalanceAlert`
    kosong = `0` (tanpa peringatan) secara **eksplisit**, sedangkan angka tak sah ditolak.
  - Koordinat memakai `type="text" inputMode="decimal"` supaya koma Indonesia (`-8,09`) tetap bisa
    diketik — dengan `type="number"` koma membuat nilai dibaca kosong oleh peramban.
  **Bukti uji:** `npx tsc --noEmit` = 0; `npm run build` lolos; `PUT /api/mosque-profile` &
    `PUT /api/config` tetap `200` (diuji pada salinan `prisma/verify5.db`).
  **Sisa (butuh migrasi):** agar "belum diisi" benar-benar berbeda dari lintang `0`
    (`prayer.ts:82` masih menganggap `(0,0)` = belum diisi), kolom `latitude`/`longitude`
    perlu dijadikan **nullable** — butuh migrasi + `prisma generate`, sehingga ditahan
    selama dev server pengguna masih memegang DLL Prisma (lihat catatan "Sisa/kendala").
- [x] **P3.7 — Aksesibilitas form Pengaturan.**
  17 pasangan `htmlFor`/`id` diverifikasi ada; ditambahkan: `finance-bank-name`,
  `finance-account-number`, `finance-account-holder`, `finance-min-balance`,
  `security-current`, `security-new`, `security-confirm`, dan `aria-labelledby`
  untuk kedua checkbox Preferensi (`pref-transparency-label`, `pref-qris-label`) —
  sebelumnya checkbox hanya punya judul visual, tanpa kaitan terprogram.
  Satu-satunya `<label>` tanpa `htmlFor` yang tersisa adalah pembungkus `<input type="file">`
  (asosiasi implisit — sah).
  **Bukti uji:** skrip pemeriksa: 17 `htmlFor` semuanya punya `<input id>` yang cocok.
- [x] **P3.8 — Skema & kode mati dibersihkan.**
  - `model PrayerDay` + `model PrayerTime` dihapus dari `prisma/schema.prisma`
    (dipastikan **0 baris** lebih dulu) + migrasi
    `20261019044245_drop_unused_prayer_tables` (hanya 2× `DROP TABLE`, sudah diterapkan ke `dev.db`).
  - **27 → 0** warning `no-unused-vars`: impor & variabel mati dibuang di
    `admin/layout` (`metadata` kini benar-benar dipakai — panel admin jadi `noindex`),
    `ActivitiesPage`, `AnnouncementsPage`, `ReportsPage`, `SettingsPage`, `TransactionsPage`,
    `UsersPage`, `PrayerScheduleSection`.
  - **43 → 31** warning setelah lanjutan sesi ini: prop `categories` yang yatim di
    `TransactionsPage` (`RowActions`) dibuang; 10 `exhaustive-deps` dibereskan secara struktural
    (`AnnouncementsPage`, `UsersPage`, `ActivitiesPage` — `data` di-`useMemo`; `getActivityStatus`
    dipindah ke lingkup modul jadi `activityStatus(date, todayStr)`; `ReportsPage`:
    `transactions`/`categories`/`chartData` di-`useMemo`; `TransactionsPage` idem);
    1 `alt-text` palsu hilang karena ikon Phosphor `Image` di-`rename` menjadi `ImageIcon`.
    Sisanya (31 `no-img-element`) memang **disengaja**: gambar unggahan dinamis.
  **Bukti uji:** `npx eslint .` → `0 error`, 31 warning.

- [x] **P3.9 — 19 error lint → 0.**
  Diperbaiki secara **struktural**, bukan dengan `eslint-disable` baru:
  - `useApi` (`lib/api.ts`): nilai & galat disimpan bersama sumbernya (`path` + nomor refresh)
    → tidak ada lagi `setError(null)` sinkron di dalam effect.
  - Klamp paginasi (`TransactionTable`, `TransactionsPage`): cukup **dihitung** (`safePage`),
    effect-nya dibuang. Indeks hero (`Hero`) & tanggal terbuka (`PrayerScheduleSection`)
    juga dijadikan nilai turunan.
  - Dialog form transaksi: isian **dilahirkan dari props + `key`** dari parent (pola resmi
    React untuk reset state), kategori terpilih dihitung saat render; kedua effect dibuang.
  - `SettingsPage`: profil & konfigurasi memakai pola *"draft atau data server"*
    (tanpa menyalin data ke state lewat effect).
  - Countdown `Hero` & pintasan `?type=` di `TransactionsPage`: pembaruan pertama
    *dijadwalkan* (`setTimeout(…, 0)`) agar render pertama sama dengan HTML server.
  - `ShareButtons` & "sudah di klien?" pada `PrayerScheduleSection`: `useSyncExternalStore`.
  - `any` pada tooltip (`DashboardOverview`, `ReportsPage`) → tipe eksplisit;
    `useMemo` tabel ringkasan kategori → dependensi stabil (`filteredTxns`, `type`).
  **Bukti uji:** `npx eslint .` → `0 error`, 43 warning (dari 19 error + 70 warning).

- [x] **P3.10 — Query ganda dihindari.**
  - `getMosqueProfile`, `getAnnouncementById`, `getActivityById` dibungkus **`cache()` React** →
    `generateMetadata` + komponen halaman, dan "profil diambil 2×" (halaman + service keuangan
    yang butuh zona waktu), kini **satu query per request**. Di luar render React (Route Handler)
    `cache()` otomatis menjadi pemanggilan biasa, jadi tidak ada risiko data basi antar-request
    (sudah diuji: `/api/mosque-profile` tetap `200`).
  - `/keuangan`: konfigurasi dibaca lebih dulu; bila `publicTransparency=false`, seluruh
    transaksi **tidak dimuat** (tabelnya memang tidak tampil). Nama pencatat pada kartu ringkasan
    diambil lewat `getLatestRecorder()` (satu kolom) sehingga info itu tidak hilang.
  - Beranda tidak lagi memanggil `getOfficials()` (daftar pengurus punya halaman `/pengurus`).
- [x] **P3.11 — Navbar memakai `<a>` bukan `next/link`.**
  Seluruh tautan Navbar (menu desktop, dropdown, panel mobile, CTA "Salurkan Infaq", termasuk
  tautan ber-hash `/#beranda`, `/#kontak`, `/keuangan#donasi`) kini memakai `next/link`.
  Aman karena `Link` tetap merender `<a href>` dan Next menangani lompat-ke-`id` untuk tautan
  hash (didukung resmi di `node_modules/next/dist/docs/…/components/link.md` bagian
  *"Scrolling to an `id`"*). Tautan "Buat dulu di Pengaturan" pada dialog transaksi juga
  diarahkan ke halaman yang benar (`/admin/categories` — sebelumnya menunjuk
  `/admin/settings` yang tidak punya tab kategori).
  **Bukti uji:** HTML beranda hasil `next start` masih memuat `href="/#beranda"` (2×),
  `href="/#kontak"`, `href="/pengurus"`, `href="/berita"`, `href="/keuangan#donasi"`.
- [ ] **P3.12 — Jadwal salat: opsi lanjutan.** (metode/`adjustments` Kemenag, `Intl.DateTimeFormat` tanpa try/catch)

---

## Lampiran — Sudah diperbaiki sebelum sesi ini, jangan dikerjakan ulang

Temuan `DIAGNOSIS.md` (2026-10-04) berikut sudah tertutup dan terverifikasi:

- `GET /api/officials` kini wajib sesi (`src/app/api/officials/route.ts:10`).
- `POST`/`GET /api/uploads` kini wajib sesi (`src/app/api/uploads/route.ts:58,96`) + sniff magic-byte.
- Open redirect `?next=` ditolak (`login/page.tsx:27-29`).
- CSRF lapis-2 via cek Origin/Referer (`api-helpers.ts:20-45`).
- Guard superadmin terakhir ada di `DELETE` **dan** `PUT/PATCH` (`officials.ts:76-89,112-121`).
- Validasi tanggal kalender nyata, tolak `PUT {}`, validasi silang `type`↔kategori, `P2003/P2002 → 400`.
- `currentPage` di-clamp di klien, statistik & export mengikuti filter, `lastUpdated` = data terakhir,
  chart zero-fill 12 bulan, `PATCH /api/mosque-profile`, `publicTransparency` & `minBalanceAlert` benar-benar berefek.
- Export CSV: kolom `Bukti`+`ID`, escape lengkap, BOM, `\r\n`.
- Konvensi Next.js 16: `proxy.ts` (bukan `middleware.ts`), `await params` di semua `[id]`, `await cookies()`,
  `Image` memakai `preload`.

---

## Lampiran — Bukti uji sesi implementasi (2026-10-19)

Perintah rutin:

```powershell
npx tsc --noEmit     # lolos
npx eslint .         # 0 error + 31 warning
npm run build        # lolos, 27 route
```

Uji jalur kritis dijalankan pada **salinan database** (`prisma/verify*.db`, salinan dihapus
setelah uji) lewat `next start -p 3111–3115` supaya `prisma/dev.db` tidak tersentuh:

| # | Uji | Hasil |
|---|---|---|
| 1 | `GET /admin/login` memuat `admin123` / "Isi otomatis"? | ❌ tidak ada (lulus) |
| 2 | `GET /api/admin/session` tanpa sesi | `{"authenticated":false,"isDefaultPassword":false}` |
| 3 | `/admin`, `/admin/transactions` tanpa sesi | `307` → `/admin/login?next=…` |
| 4 | Login `admin123` | `200 {"success":true,"shouldChangePassword":true}` |
| 5 | 9 halaman admin dengan sesi **kata sandi bawaan** | semuanya `200` — gerbang paksa sudah dibatalkan (P0.2) |
| 6 | `/admin/settings?tab=security` | `200` (tab Keamanan jadi tab awal) |
| 7 | Ganti kata sandi: current salah / sama / pendek / bawaan | semuanya **400** + pesan jelas |
| 8 | Ganti kata sandi valid | `200`, sesi tetap hidup, `isDefaultPassword:false` |
| 9 | `/admin` setelah kata sandi diganti | `200` (gerbang terbuka) |
| 10 | `DELETE /api/admin/session?all=1` | `{"success":true,"revoked":"all"}`; sesi mati |
| 11 | Login dengan kata sandi baru | `200 {"shouldChangePassword":false}` |
| 12 | 6× login gagal | `401` ×5 lalu **429** |
| 13 | `GET /api/chart?year=2025` / `?year=abcd` | 12 bulan / **400** |
| 14 | `GET /opengraph-image` | `200 image/png` |
| 15 | URL tidak dikenal | **404** + halaman berbranding |
| 16 | `/`, `/keuangan`, `/kegiatan`, `/berita`, `/pengurus` | `200` |

Uji tambahan (sesi P2.2 + P0.9 + P3.8–P3.10):

| # | Uji | Hasil |
|---|---|---|
| 17 | Beranda memuat blok keuangan (P2.2) | `200`; HTML berisi "Ringkasan Keuangan", "Tren Kas 12 Bulan Terakhir", "Rincian Transaksi Kas", "Dicatat Rani Rachmawati" + `recharts` |
| 18 | Beranda, `publicTransparency=false` | kartu + grafik tetap tampil; tabel diganti catatan "Rincian transaksi disembunyikan pengurus" |
| 19 | `/keuangan`, `publicTransparency=false` | tabel tidak dimuat, catatan tampil, kartu tetap "Dicatat Rani Rachmawati" (`getLatestRecorder`) |
| 20 | `PUT /api/config` mengembalikan `publicTransparency=true` | `200` |
| 21 | Route handler dengan `cache()`: `/api/mosque-profile`, `/api/config`, `/api/financial-summary`, `/api/chart`, `/api/transactions` | semuanya `200` (tidak ada galat "cache di luar render") |
| 22 | Halaman detail `/berita/<id>`, `/kegiatan/<id>` | `200` (`generateMetadata` + halaman berbagi satu query) |
| 23 | Halaman admin pascar Refactor: `/admin`, `/admin/transactions`, `/admin/users`, `/admin/settings`, `/admin/reports`, `/admin/announcements`, `/admin/activities` | semuanya `200` |
| 24 | Migrasi P3.8 pada `dev.db` | `prisma migrate status` → "Database schema is up to date"; kedua tabel benar-benar kosong sebelum di-`DROP` |
| 25 | `npx eslint .` | **0 error**, 43 warning (sekitar P3.8); setelah lanjutan sesi ini: **0 error**, 31 warning |

Uji tambahan (lanjutan sesi: P3.6, P3.7, P3.11 + sisa lint, `next start -p 3115`):

| # | Uji | Hasil |
|---|---|---|
| 26 | `npx eslint .` setelah 10 `exhaustive-deps` + 1 `alt-text` + 1 `no-unused-vars` dibereskan | **0 error**, 31 warning (`no-img-element` saja) |
| 27 | `npx tsc --noEmit` & `npm run build` | lolos (37 route terdaftar, termasuk Proxy) |
| 28 | Halaman publik pasca `Link`: `/`, `/keuangan`, `/berita`, `/kegiatan`, `/pengurus` | semuanya `200`; HTML beranda memuat `href="/#beranda"`, `href="/#kontak"`, `href="/keuangan#donasi"`, `href="/pengurus"`, `href="/berita"` |
| 29 | 10 halaman admin dengan sesi (`/admin` … `/admin/prayer-schedule`) | semuanya `200` |
| 30 | 10 endpoint `/api/*` pasca perubahan form | semuanya `200` (termasuk `PUT`-nya tidak diubah) |
| 31 | `GET /api/mosque-profile` | koordinat asli utuh (`-8.09`, `112.16`) — placeholder form dikembalikan ke nilai nyata |

**Catatan pemeriksaan yang belum bisa otomatis (uji manual disarankan):**
1. Interaksi di dalam dialog form transaksi (buka/tutup berulang, ganti tipe, simpan) — perubahan
   P3.9 memakai pola `key` + state awal dari props; lolos tipe & build, tapi belum diklik.
2. Spanduk peringatan kata sandi bawaan + lompatan otomatis ke tab Keamanan (`?tab=security`)
   dirender di klien, jadi tidak terlihat lewat `curl`. Yang terverifikasi: halaman admin dapat
   dibuka semua (200) dan URL `?tab=security` valid.
3. `npx prisma generate` **gagal** saat sesi ini karena `query_engine-windows.dll.node` sedang
   dipakai dev server yang berjalan (port 3000). Migrasi & skema sudah benar; jalankan
   `npx prisma generate` sekali setelah dev server berhenti agar types Prisma ikut terbarui
   (perilaku runtime tidak terpengaruh karena model yang dihapus tidak dipakai).
4. Alamat URL tidak dikenal pada route dinamis (`/berita/tidak-ada`) membalas **200**
   berisi halaman 404 + `<meta name="robots" content="noindex">`. Ini perilaku Next yang
   didokumentasikan saat `notFound()` dipanggil setelah `await` pada segmen yang punya
   `loading.tsx` (shell sudah terkirim). Aman untuk SEO, tapi bukan status `404` murni.
5. **Sisa/kendala P3.6:** kolom `latitude`/`longitude` masih `NOT NULL` di database, jadi
   nilai `0` yang sudah tersimpan tidak bisa dibedakan dari "belum diisi" di sisi server
   (`prayer.ts:82`). Form sekarang mencegah **pengosongan** kolom menjadi `0`, tetapi
   perbaikan penuh menuntut kedua kolom jadi *nullable* — perlu migrasi + `prisma generate`.
   Itu **tertahan** selama dev server pengguna (port 3000) masih memegang
   `query_engine-windows.dll.node`; klien Prisma yang basi akan menolak nilai `null`.
   Jalankan setelah dev server berhenti bila sisa ini hendak dikerjakan.
6. Interaksi form Pengaturan (mengetik `0`, mengosongkan koordinat lalu menekan Simpan)
   dirender di klien sehingga belum diuji lewat `curl` — yang terverifikasi: berkas valid
   (`tsc`/`eslint`/`build`), markup `htmlFor`↔`id` lengkap, dan semua endpoint terkait `200`.

Variabel lingkungan baru (lihat `.env.example`):
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `TRUST_PROXY`, `DEFAULT_ADMIN_PASSWORD`.

---

## Keputusan yang sudah dijawab

1. **P0.9 RBAC** → **(b) cabut klaim peran dari UI.** Selesai; data `systemRole` + guard
   superadmin-terakhir tetap ada. Tidak ada cek peran baru.
2. **P2.2 Ringkasan keuangan di beranda** → **(a) tampilkan lagi.** Selesai.
3. **P2.1 Papan jadwal 7 hari** → **belum dipasang.** Komponennya masih ada (tidak diimport);
   dua error lint di dalamnya sudah dibereskan agar `eslint` bersih. Bila nanti dipasang:
   perhatikan `id="jadwal-sholat"` yang akan bentrok dengan Hero.
4. **P3.9 Lint** → **boleh dirapikan.** Selesai (0 error).
5. **Gerbang "wajib ganti kata sandi bawaan" (P0.2)** → **dibatalkan.** Pengurus tetap bisa
   berpindah menu; peringatan tetap tampil di panel + tautan ke tab Keamanan.
   Yang tetap berlaku: halaman login **tidak** lagi menyebut `admin123` (P0.1).

## Keputusan yang masih dibutuhkan

1. **P2.1 Papan jadwal 7 hari** — pasang di beranda / `/jadwal-sholat`, atau hapus komponennya?
2. **P2.5 Paginasi** — pindahkan ke server di semua daftar, atau hapus kode paginasi yang tak terpakai
   (sekaligus menyatukan kontrak respons `GET /api/transactions`)?
3. **P2.7 Tanggal terbit berita** — tambahkan field `publishedAt` di form berita?
4. **P2.8 Toggle QRIS** — tambahkan field gambar QRIS, atau ganti label menjadi "Tampilkan Rekening Donasi"
   dan samakan perilaku Hero ↔ `/keuangan`?
5. **P3.1 Penyimpanan gambar** — volume ter-mount, atau object storage (S3/R2)? Menentukan bentuk
   `DELETE /api/uploads` + `unlink`.
