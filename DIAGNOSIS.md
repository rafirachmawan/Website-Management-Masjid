# Diagnosis Bug & Fitur Kurang — Website Keuangan Masjid

Hasil audit read-only seluruh `src/`, `prisma/schema.prisma`, dan API. Urut dari paling kritis.
Tanggal: 2026-10-04. Sumber rujukan memakai format `file:baris`.

## Status Implementasi (update 2026-10-04)

* **No.1 Auth & Hak Akses — BELUM dikerjakan** (tetap terbuka, lihat §1).
* **No.2 Keuangan — SUDAH diperbaiki** (validasi tanggal riil, tolak PUT kosong, validasi silang type↔kategori, nama kategori trim + unik case-insensitive, `P2003→400`, `lastUpdated` = catat terakhir, bar kosong ada placeholder, statistik ikut filter, export tambah `Bukti,ID` + `\r\n`, filter string-prefix WIB, chart samakan tahun, pagination clamp + windowing, proofUrl klik, `todayISO()` WIB).
* **No.3 Konten/Dashboard — SUDAH diperbaiki** (server pagination `?page&limit&q` untuk transaksi/pengumuman/kegiatan, chart zero-fill 12 bulan, `PATCH /api/mosque-profile`, `publicTransparency` menyembunyikan rincian, empty-state dashboard + loading progresif + badge `minBalanceAlert` + tren MoM + ringkasan konten, sanitasi URL/email/phone/rekening/timezone, `config` tulis atomik).
* Verifikasi: `npx tsc --noEmit` lolos, `npm run build` sukses, uji `tsx`: tanggal fiktif/PUT kosong/kategori spasi/`javascript:` ditolak, chart 12 poin, `lastUpdated` = data terakhir.

## 1. Auth & Hak Akses — KRITIS, fiksi — ⏳ BELUM

Arsitektur saat ini: **1 password bersama (`admin123`)**, tanpa login per-user. Tapi schema (`prisma/schema.prisma:88`, `src/server/schemas.ts:100`) dan UI mengklaim ada `superadmin|admin|bendahara|pengurus`.

* **RBAC tidak ada sama sekali:** `src/proxy.ts:24,35` hanya cek sesi biner. Tidak ada pengecekan `systemRole` di route manapun. `Sidebar.tsx:27-37` tampilkan semua menu ke semua orang. Siapa pun bisa `POST {systemRole:"superadmin"}` via `src/server/services/officials.ts:49-85`.
* **PII bocor publik:** `src/proxy.ts:23` `GET /api/*` terbuka. `GET /api/officials` tanpa login kembalikan `phone,email` (`src/server/services/officials.ts:19-29`, `src/app/api/officials/route.ts:5-11`).
* **Otorisasi hanya di edge, tanpa defense-in-depth:** `src/app/api/admin/password/route.ts:16` punya cek lapis-2 `verifySessionValue`, tapi `src/app/api/officials/route.ts:13`, `src/app/api/officials/[id]/route.ts:22,32` tidak punya. Jika `matcher` berubah / `proxy` di-skip, tulis pengurus langsung terbuka.
* **Ganti password ≠ cabut sesi:** `src/server/services/admin-auth.ts:83-91` hanya ganti hash, tidak rotasi `SECRET_KEY`. Token stateless (`src/server/services/admin-auth.ts:106-112`, TTL 12 jam di `:16`) deterministik per-ms, tanpa `sessionId`/random per-login. `DELETE session` hanya hapus cookie browser (`src/app/api/admin/session/route.ts:62-65`). Hapus pengurus (`src/components/admin/UsersPage.tsx:599-603`) klaim "akses dinonaktifkan" padahal sesi tetap hidup.
* **Brute-force terbuka:** `src/app/api/admin/session/route.ts:40-59` tanpa rate-limit/lockout. `scrypt N=16384` (`admin-auth.ts:36`) ringan, tanpa delay/captcha/hitung gagal.
* **Bocor kredensial default:** `GET session:33` kembalikan `{authenticated, isDefaultPassword}` tanpa auth. `src/app/admin/login/page.tsx:24,78-82` umumkan ke anonim bahwa `admin123` masih berlaku.
* **Auto-seed bisa hidupkan `admin123` diam-diam:** `admin-auth.ts:65-70,77` + `session/route.ts:30` panggil `ensureAdminSeeded()` setiap verifikasi. Jika baris hash terhapus/corrupt, password default dibuat ulang tanpa alert/audit.
* **Cookie tanpa hardening + tanpa anti-CSRF:** `session/route.ts:14-25` `httpOnly:true, sameSite:"lax", secure:only-prod, path:/`. Tanpa `__Host-` prefix, tanpa token CSRF untuk `PUT /api/admin/password` dan `POST/PUT/DELETE /api/officials/*`.
* **Guard sole-superadmin bisa bypass via PUT:** `officials.ts:92-101` cegah `DELETE` superadmin terakhir, tapi `updateOfficial:66-85` tidak dicek. `PUT /api/officials/[id]:22-26` dengan `{systemRole:"pengurus"}` atau `{status:"inactive"}` pada satu-satunya superadmin sukses → 0 superadmin aktif.
* **Open redirect via `?next=`:** `src/app/admin/login/page.tsx:12,23,42` `router.replace(next)` tanpa validasi `startsWith("/")` / blok `//` / `https:`. `/admin/login?next=//evil.com` meneruskan korban keluar pasca-login.
* **Kebijakan password lemah:** hanya `length>=8` (`admin-auth.ts:18`). `admin123` (panjang 8) lolos. Tanpa cek `new!==current`, tanpa tolak default, tanpa histori/kompleksitas. Jika ganti lalu balik ke `admin123`, flag `firstRun` di `session/route.ts:54` jadi `0` sehingga banner `AdminLayout.tsx:53,79-90` tidak muncul.
* **Validasi officials lemah:** email tanpa `.trim().toLowerCase()` (`schemas.ts:104`) → duplikat beda casing lolos (SQLite case-sensitive, `officials.ts:42-47`). `role` invalid diam-diam jadi `Anggota Takmir` via `normalizePosition` fallback (`positions.ts:63-68`, `schemas.ts:96-99`) → typo hilang tanpa error. `joinedDate` hanya regex (`schemas.ts:106-108`) → `2026-99-99` lolos. `phone min8 max25` tanpa pola (`schemas.ts:103`) → `"aaaaaaaa"` lolos. `UsersPage.tsx:135` pakai UTC `toISOString()` bukan `Asia/Jakarta` → off-by-one. `avatar` tanpa validasi URL (`schemas.ts:109-113`).
* **Kurang:** login per-pengurus, middleware cek peran per-route, revoke sesi per-device, audit log, kebijakan password, CSRF, rate-limit, konsistensi status HTTP (`400` vs `404`, `api-helpers.ts:23-30` bocorkan message mentah).

## 2. Keuangan (Transaksi, Kategori, Laporan) — ✅ SUDAH diperbaiki 2026-10-04

### Validasi `amount` / `date` / `category`

* **Tanggal kalender fiktif lolos:** `src/server/schemas.ts:8-10,73-75` hanya `.regex(/^\d{4}-\d{2}-\d{2}$/)`. `2026-02-30`, `2026-13-40`, `2026-00-00` tersimpan sebagai `Transaction.date: String`. Dampak berantai ke `finance.ts:229,257`.
* **PUT body kosong jadi no-op 200:** `schemas.ts:36` `transactionUpdateSchema = transactionInputSchema.partial()` tanpa `.refine(min 1 key)`. `PUT {}` jadi `db.transaction.update({data:{}})` (`finance.ts:186-209`, `[id]/route.ts:25`).
* **PUT type tanpa categoryId tidak divalidasi silang → desinkron:** `finance.ts:191-205` cek `category.type !== type` hanya jika `input.categoryId` ada. `PUT {type:"income"}` pada transaksi `expense` lolos → `type=income` + `categoryId`/`category` tetap expense.
* **Category.name `"  "` lolos:** `schemas.ts:121` `min(2)` dihitung sebelum `trim()`. `"  "` lolos zod lalu `input.name.trim()` → `""` disimpan (`finance.ts:69-77`). `updateCategory:96` aman (`|| existing.name`), `createCategory` tidak.
* **Duplikat case-sensitive:** `finance.ts:70-72,110-112` `findFirst({name:{equals:name}})` di SQLite case-sensitive. `Infak` vs `infak` dianggap beda, pie yang group by `name` pecah.

### Denormalisasi `category` vs `categoryId`

* Sumber ganda: `prisma/schema.prisma:44-46`, `finance.ts:175,203-204`. Rename di-sync via `finance.ts:126-128`, tapi bug desinkron di atas merusaknya.
* Konsumen tidak konsisten: filter benar pakai `categoryId` (`TransactionsPage.tsx:534`), search pakai label (`:543`), dot warna pakai join (`:884-886`) vs label (`:890`), pie/rekap pakai label (`ReportsPage.tsx:616,632`) vs tabel pakai `categoryId` (`:352`). Publik `TransactionTable.tsx:232` tampilkan label basi jika desinkron.

### Hapus kategori ber-relasi

* OK sebagian tapi bocor `500` saat race: service `count` lalu `delete` (`finance.ts:139-149`), DB `onDelete: Restrict` benar (`schema.prisma:47`). Tapi `fail()` hanya map `P2025→404` (`api-helpers.ts:26-27`). Pelanggaran `Restrict (P2003)` / race `count→delete` jadi `500` + pesan Prisma mentah, bukan `400` ramah.

### Saldo / ringkasan / chart

* **Chart crash data kotor → `undefined YYYY`:** `finance.ts:257,267-273` `key.slice(0,7)`, `ID_MONTHS[m-1]` jadi `"undefined 2026"` jika `m=13` dari data fiktif.
* **`lastUpdated` = waktu request:** `finance.ts:245`, `ReportsPage.tsx:919-921`, `FinancialSummaryCards.tsx:150-157` `lastUpdated: now.toISOString()` selalu "baru", diklaim "Data terakhir diperbarui pada …".
* **Bar komposisi kosong menipu:** `FinancialSummaryCards.tsx:100-101,184-185` `totalFlow=0 → incomeShare=0`, bar render `0%` hijau + `100%` merah padahal tidak ada data.
* **Statistik admin abaikan filter:** `TransactionsPage.tsx:76-83,674` `TransactionStats(transactions)` hitung semua, Export `:589-602` hitung `filteredTransactions`. Filter kategori/bulan tidak mengubah kartu.
* **Skala:** `getTransactions/getFinancialSummary/getChartData` (`finance.ts:151,215,249`) + `keuangan/page.tsx:20-25` selalu `findMany` full-table tanpa pagination/filter server-side.

### Filter tanggal backend vs frontend beda zona/logika

* Backend benar string-prefix Jakarta (`finance.ts:24-30,229,233`). Frontend salah pakai `new Date()` local-TZ (`ReportsPage.tsx:569-575,558`, `TransactionTable.tsx:62,67,70,73`) → `getMonth()/getFullYear()` bisa mundur sehari/bulan. Harusnya `startsWith("YYYY-MM")` seperti backend.
* Filter mingguan pakai jam saat ini (`TransactionTable.tsx:65-67` `setDate(now.getDate()-now.getDay())` tanpa reset ke `00:00`) → batas tidak deterministik.
* Chart bulanan abaikan tahun, tahunan abaikan tahun terpilih (`ReportsPage.tsx:608-610,902` `filter(c=>c.period.includes(MONTHS[m].slice(0,3)))`, yearly tampil semua tahun, label `Total Tahun 2026` menjumlah semua tahun).
* Tipe mati `custom`: `ReportsPage.tsx:534,683-696` `PeriodType="monthly"|"yearly"|"custom"` tapi `Select` hanya 2 opsi.

### Pagination

* **`currentPage` tidak di-clamp:** `TransactionsPage.tsx:565-569`, `TransactionTable.tsx:93-97` `slice` langsung. Halaman 5 → filter jadi 1 halaman → `paginated=[]` + `Pagination currentPage=5 totalPages=1`. Reset hanya di search/type/category (`:572-574,689,712`), tidak saat delete/refresh.
* **Render semua nomor halaman:** `TransactionsPage.tsx:436,454-467` `Array.from({length:totalPages})` tanpa windowing/ellipsis. 1000 data = 100 tombol.

### Export CSV

* Inkonsistensi sort + kolom hilang: `TransactionsPage.tsx:589-602` pertahankan sort tabel vs `ReportsPage.tsx:591-592` paksa `sort date asc`. Keduanya hanya `Tanggal,Tipe,Kategori,Keterangan,Nominal,Pencatat` — `id,categoryId,proofUrl,createdAt` dibuang → tak bisa audit ulang / re-impor. Join `"\n"` (`:601`, `ReportsPage:604`) tanpa `\r\n`; `toCsvRow` di `lib/utils.ts:76-83` + BOM `:87-97` sudah benar untuk Excel-ID.

### `proofUrl`

* Tanpa validasi URL, `""` tersimpan: `schemas.ts:24-27` `string.max(500).optional()`, `finance.ts:179`, `TransactionFormDialog.tsx:118` kirim `proofUrl.trim()` → `""` disimpan (`toTransaction:52` pakai `??` sehingga `""` bocor bukan `undefined`).
* Detail tidak bisa diklik/diverifikasi: `TransactionsPage.tsx:232-242` hanya `split("/").pop()` tanpa `<a href>` / `<img>`. Klaim "Dapat ditelusuri ke bukti" (`FinancialSummaryCards.tsx:166-168`) tidak terbukti. Input `type="text"` (`TransactionFormDialog.tsx:279-285`) tanpa validasi `url`.
* `todayISO()` pakai UTC (`TransactionFormDialog.tsx:27-29` `toISOString().split("T")[0]`) → off-by-one di WIB jam 00:30.

## 3. Konten, Upload, Jadwal Salat, Profil, Dashboard — ✅ SUDAH diperbaiki 2026-10-04 (kecuali Upload auth & Jadwal salat Kemenag — tetap terbuka, lihat catatan)

### Validasi input kurang

* `schemas.ts:154` `timezone min3 max60` tanpa cek IANA. `tz` invalid → `Intl.DateTimeFormat` di `prayer.ts:23,44,80` lempar `RangeError` → `api-helpers.ts:29-30` jadi `500` mentah, bukan `400`.
* `schemas.ts:152-153` `latitude/longitude` boleh `0`. `prayer.ts:71` anggap `0,0 = belum diisi`, padahal `0` lintang valid (Pontianak). `SettingsPage.tsx:439,454` `parseFloat(...)||0` membuat kosong tak terbedakan dari `0`.
* `schemas.ts:55-59,81-85,161-163,109-113,24-27` `imageUrl/logoUrl/coverImageUrl/heroImages/avatar/proofUrl` hanya `max(500)` tanpa `.url()`. Sampah/`javascript:` bisa tersimpan; display hanya filter `startsWith(http|/)` di `berita/page.tsx:84`, `kegiatan/page.tsx:62`, `AnnouncementsSection.tsx:34`, `ActivitiesSection.tsx:21`.
* `schemas.ts:134-135` `bankName/accountNumber/accountHolder` `optional+""`, `accountNumber max60` tanpa regex digit. Rekening setengah-kosong lolos; `DonationTransfer.tsx:17-20` lalu `return null`/parsial.
* `schemas.ts:60-63` + `content.ts:91,114` `publishedAt` opsional, `new Date(input.publishedAt)` tanpa guard `Invalid Date`.
* `schemas.ts:73-78` `date` regex lolos `2026-13-40`; `time` regex lolos `99:99`. Sorting `new Date(a.date)` di `kegiatan/page.tsx:22`, `ActivitiesSection.tsx:216` jadi `NaN`.
* `content.ts:120-122,170-172` `deleteAnnouncement/deleteActivity` langsung `delete` tanpa `findUnique`. `P2025` ditelan `api-helpers.ts:26-28` jadi generik.
* `mosque.ts:45-66` + `schemas.ts:146-164` `PUT /api/mosque-profile` wajib full body. Tidak ada `PATCH/partial`; `mosque-profile/route.ts:17-24` akan `400` untuk update parsial.
* `SettingsPage.tsx:372,698` `parseInt(...)||1985` / `||0`: kosong diam-diam jadi `1985`/`0`.

### Upload file

* `src/app/api/uploads/route.ts:26,35-41` cek hanya `file.type` (dikontrol klien) → ekstensi dari `MIME_TO_EXT`. Tanpa sniff magic-byte/dimensi. Polyglot `fake.png` lolos.
* `uploads/route.ts:19-47,51-68` `POST` dan `GET` tanpa auth/session. Publik bisa upload/list.
* `GET` list semua file tanpa pagination/auth; regex filter ekstensi saja. Info-disclosure + DoS bila banyak file.
* Orphan: hapus `heroImages` di `SettingsPage.tsx:184-191` hanya `filter(state)`; hapus berita/kegiatan di `content.ts:120,170` tidak hapus file. Tidak ada `DELETE /api/uploads`.
* `public/uploads/` lokal ephemeral. Duplikasi `MAX 5MB` di `uploads/route.ts:10`, `ImageUploadField.tsx:8`, `SettingsPage.tsx:150` rawan drift.

### Jadwal salat

* `prayer.ts:75` `CalculationMethod.Singapore()` hardcode. Tanpa opsi `madhab` (default Syafi’i), `HighLatitudeRule`, `adjustments`/ihtiyati Kemenag 2 mnt.
* Fallback `Asia/Jakarta` bila kosong, tapi `tz` invalid tidak divalidasi → `500`.
* `prayer.ts:94-100` `addDaysISO+noon UTC` rapuh; komentar sendiri `UTC-12…UTC+11`. Gagal untuk `UTC+12…+14`.
* `prayer.ts:78-91` `nowMin` dari dua `Intl.format` terpisah (jam+menit) — bisa beda menit di boundary.
* Hijri `id-u-ca-islamic` tanpa `islamic-umalqura` (`prayer.ts:54-66`); bisa selisih 1-2 hari vs Kemenag.
* `getPrayerSchedule` fetch `mosqueProfile` 2x (di `getWeekly` + lagi, `prayer.ts:68-71,146-147`). Redundan.
* `prisma/schema.prisma:96-115` `PrayerDay/PrayerTime` mati (service hitung otomatis) tapi masih migrasi; `prisma/seed.ts:19` masih `count prayerDay` — membingungkan.
* `prayer-schedule/route.ts:5-11` selalu 7 hari dari `now`, tanpa `?date/?offset`.
* Inkonsisten zona: `PrayerScheduleSection.tsx:29-34` pakai `shortZone(tz)`, tapi `kegiatan/page.tsx:78`, `kegiatan/[id]/page.tsx:40`, `ActivitiesSection.tsx:124,197` hardcode `WIB`.

### Pagination publik & empty state

* `content.ts:72-75,126-129` `getAnnouncements/getActivities` tanpa `take/skip`. `finance.ts:151-154` sama. `page.tsx:15-20` + `public-home.ts:40-50` fetch semua lalu `AnnouncementsSection.tsx:190-199`, `ActivitiesSection.tsx:216-229` render semua. `berita/page.tsx:31-42`, `kegiatan/page.tsx:17-22` tanpa `?page&limit&q`. `keuangan/page.tsx:20-25` + `TransactionTable.tsx:93-97` pagination hanya `slice` klien (`ITEMS_PER_PAGE=10`), tetap unduh semua.
* `DashboardOverview.tsx:334-372` `UpcomingAnnouncements` tanpa cabang kosong; `RecentTransactions.tsx:202-264` sama; `MiniChart:144-200` tanpa pesan bila `chartData=[]`.
* `DashboardOverview.tsx:381` `if(!mosqueProfile||!financialSummary||...)` skeleton global. Satu API lambat/`404` (`/api/mosque-profile` return `404` di `mosque-profile/route.ts:9`) blokir seluruh dashboard.
* Baik: `Hero.tsx:65-70`, `PrayerScheduleSection.tsx:662-683`, `AnnouncementsSection.tsx:220-223`, `ActivitiesSection.tsx:267-270`, `berita/page.tsx:69-72`, `OfficialsSection.tsx:279-283` sudah ada empty. `DonationTransfer.tsx:16-20` `return null` tanpa placeholder.

### Dashboard stats & pengaturan rekening

* `DashboardOverview.tsx:420-453` hanya 4 kartu kas. Tanpa ringkasan konten (total berita/kegiatan/pengurus/status jadwal).
* `minBalanceAlert` disimpan (`SettingsPage.tsx:688-706`, `config.ts:47`) tapi tak pernah dibaca di dashboard/finance.
* `StatCard.tsx:86-95,421-452` prop `trend/trendLabel` tak pernah diisi → badge tren mati. Perbandingan MoM tak dihitung.
* `finance.ts:249-275` `getChartData` sparse (hanya bulan ada transaksi), tanpa zero-fill → garis `MiniChart.tsx:147` menyesatkan.
* `config.ts:53-55` `upsert` loop sekuensial, bukan `$transaction`. Gagal tengah = tulis parsial.
* `SettingsPage.tsx:77-81,90-93` `setProfile/setFinanceConfig` di badan render, bukan `useEffect`.
* `SettingsPage.tsx:216-234,794-799` tab Rekening dan Preferensi berbagi `financeConfig`; Simpan di satu tab ikut simpan state kotor tab lain.
* `SettingsPage.tsx:12-24,199-204,495-604` `EMPTY_PROFILE` tanpa `logoUrl/coverImageUrl`, form tanpa input keduanya, tapi `Hero.tsx:150-152` fallback ke `coverImageUrl`.
* `publicTransparency` tanpa efek: `keuangan/page.tsx:19-52` selalu tampilkan `FinancialSummaryCards+TransactionTable` tanpa cek `config.publicTransparency`. Hanya `showDonationQRIS` dipakai (`DonationTransfer.tsx:16`). Nama menipu — tak ada field gambar QR, yang dikontrol seluruh kartu rekening.

## Prioritas Saran

1. **Kritis — BELUM:** tutup `GET /api/officials`, tambah auth di `uploads`, implementasi RBAC beneran atau cabut klaim peran, rotasi secret + revoke sesi, rate-limit login, hapus pengumuman `admin123`, validasi `?next=`.
2. **Tinggi — SUDAH (2026-10-04):** validasi tanggal kalender riil, kunci silang `type-category`, clamp pagination, perbaiki filter tahun & timezone frontend, klik `proofUrl`. File kunci: `src/server/schemas.ts`, `src/server/services/finance.ts`, `src/server/api-helpers.ts`, `src/components/public/TransactionTable.tsx`, `src/components/public/FinancialSummaryCards.tsx`, `src/components/admin/TransactionsPage.tsx`, `src/components/admin/ReportsPage.tsx`, `src/components/admin/TransactionFormDialog.tsx`.
3. **Sedang — SUDAH (2026-10-04):** server-side pagination, zero-fill chart, `PATCH` profil, efek `publicTransparency`, empty-state dashboard, sanitasi URL/email. File kunci: `src/app/api/transactions/route.ts`, `src/app/api/announcements/route.ts`, `src/app/api/activities/route.ts`, `src/app/api/mosque-profile/route.ts` (+`PATCH`), `src/server/services/content.ts`, `src/server/services/mosque.ts`, `src/server/services/config.ts`, `src/server/services/officials.ts`, `src/app/keuangan/page.tsx`, `src/components/admin/DashboardOverview.tsx`.
