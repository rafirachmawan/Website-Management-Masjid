# Model Penjualan, Database, dan Hosting

Dokumen ini menjelaskan cara menjual project ini ke banyak masjid tanpa menimbulkan masalah kepemilikan akun, tagihan, dan data.

## 1. Kondisi teknis saat ini

- Arsitektur saat ini adalah **single-tenant**: 1 database = 1 masjid.
- `prisma/schema.prisma:15-30` — `MosqueProfile` hanya satu baris (`id = "main"`). Template multi-masjid di `PRODUCT.md:20` artinya 1 codebase dipakai ulang, bukan 1 database untuk banyak masjid.
- `src/server/services/mosque.ts:40-43` — selalu `findUnique({ where: { id: "main" } })`, tidak ada konsep `mosqueId` / tenant.
- `src/server/db.ts:5-11` — satu `PrismaClient` per deploy.
- `.env.example:4` — `DATABASE_URL="file:./dev.db"` (SQLite single-file).
- `.gitignore:34-42` — `.env*`, `*.db`, dan `/public/uploads/*` tidak ikut terkirim saat jual code. Yang dijual adalah code bersih + database kosong hasil `npm run db:migrate`.

Implikasi: masjid ke-2 tidak bisa "numpang" di database masjid ke-1 tanpa refactor. Setiap masjid butuh database dan deploy sendiri.

## 2. Pilihan arsitektur untuk N masjid

### Opsi A — 1 deploy = 1 masjid (dipakai sekarang)

Setiap masjid dapat instance aplikasi + database sendiri. Order baru = deploy baru + `db:migrate` baru + isi profil via `/admin`.

- Kelebihan: tanpa ubah kode, isolasi data total, kebocoran antar-masjid mustahil.
- Kekurangan: update kode harus deploy ulang ke N tempat.
- Cocok untuk: **jual putus + jasa setup + maintenance tahunan**.

### Opsi B — SaaS multi-tenant (belum didukung kode)

Satu aplikasi dan satu database (Postgres) untuk semua masjid, dibedakan via `mosqueId` / subdomain (`masjidA.domain.com`).

Butuh refactor besar:

1. Tambah model `Mosque { id, slug, domain }`.
2. Tambah `mosqueId` ke `Transaction`, `Category`, `Announcement`, `Activity`, `Official`, `Config`, `MosqueProfile`.
3. Semua query wajib filter `where: { mosqueId }`.
4. Resolver tenant dari hostname + auth per-tenant.
5. Ganti SQLite ke Postgres (Neon / Supabase) karena SQLite tidak cocok untuk concurrent multi-tenant.

- Kelebihan: 1x deploy, cocok untuk **langganan bulanan (MRR)**.
- Kekurangan: 2–4 minggu refactor + risiko bocor silang jika satu query lupa filter tenant.
- Keputusan: baru dikerjakan setelah >10 masjid atau saat maintenance Opsi A sudah memberatkan.

### Opsi C — Hybrid (tengah-tengah)

Tetap database per-tenant seperti Opsi A, tapi deploy diorkestrasi (script / Docker / panel) agar update massal lebih mudah.

## 3. Masalah inti: database di akun siapa?

Pertanyaan umum: "Saya jual full code + jasa setting DB dan hosting, tapi DB-nya dibuat di akun saya — bagaimana?"

Jawaban: **jangan pakai akun pribadi penjual untuk produksi milik klien.**

Alasannya:

- Tagihan menumpuk di penjual dan sulit ditagih per masjid.
- Penjual bisa tidak sengaja menghapus project dan menghilangkan data keuangan masjid.
- Takmir tidak punya kontrol atas data miliknya sendiri — bertentangan dengan prinsip transparansi di `PRODUCT.md:45-50`.
- Saat kerja sama berakhir, migrasi keluar jadi sulit.

## 4. Rekomendasi: akun milik masjid, penjual hanya jasa setup

1. Masjid menyiapkan 1 email operasional, misal `takmir.masjidx@gmail.com`. Jangan pakai email pribadi penjual.
2. Semua infra dibuat di atas email itu:
   - Repo (GitHub) atau arsip ZIP code.
   - Project hosting (Vercel / VPS).
   - Database produksi (1 project DB per masjid — Turso / Neon / Supabase free tier cukup untuk tahap awal).
   - Domain (opsional).
3. Penjual di-invite sebagai collaborator sementara untuk setup, lalu akses dicabut setelah serah terima.
4. Kredensial awal admin wajib diganti hari serah terima. Lihat `DIAGNOSIS.md:13-28`: auth saat ini masih 1 password bersama (`admin123`) tanpa RBAC, jadi serah terima kredensial harus disiplin.

## 5. Langkah setup per masjid baru

1. Salin code bersih (tanpa `.env`, tanpa `*.db`, tanpa `/public/uploads/*`).
2. Buat `.env` baru dari `.env.example` dengan `DATABASE_URL` milik masjid tersebut.
3. Jalankan:
   ```bash
   npm install
   npm run db:migrate
   ```
4. Deploy ke hosting milik masjid.
5. Buka `/admin` dan isi: profil masjid, kategori kas, rekening (`src/server/services/config.ts:9-16`), jadwal salat, pengumuman awal.
6. Verifikasi halaman publik menampilkan data masjid tersebut, bukan data masjid lain.
7. Serahkan kredensial + dokumen (lihat §6), lalu cabut akses teknisi.

Catatan SQLite vs produksi: SQLite file cocok untuk demo lokal. Untuk hosting seperti Vercel yang filesystem-nya ephemeral, gunakan database managed (Turso / Postgres) agar data tidak hilang saat redeploy.

## 6. Checklist serah terima

- [ ] URL publik + URL `/admin`.
- [ ] Akun admin awal + instruksi ganti password.
- [ ] Isi `.env` yang dipakai (khususnya `DATABASE_URL`) — diserahkan privat, bukan via chat publik.
- [ ] Nama project DB + cara buka dashboard provider DB.
- [ ] Cara backup dan restore database.
- [ ] Batas garansi (contoh: 30 hari perbaikan bug gratis, selebihnya berbayar).
- [ ] Bukti akses penjual sudah dicabut (collaborator removed, token dibatalkan).
- [ ] Surat/berita acara serah terima + siapa penanggung jawab tagihan berikutnya.

## 7. Model harga yang disarankan

- **Jual putus tahap awal:** setup fee sekali (code + instalasi + pengisian awal) + biaya domain/hosting/DB atas nama masjid + opsional maintenance tahunan.
- **Titip hosting (jika takmir gaptek):** jadikan layanan berbayar terpisah dengan SLA sederhana: jadwal backup, kontak darurat, prosedur pindah keluar. Tetap 1 DB per masjid.
- **SaaS langganan:** hanya setelah Opsi B selesai. Contoh: `Rp50–100rb/bulan/masjid` dengan 1 dashboard pusat.

## 8. Yang tidak boleh dilakukan

- Menaruh banyak masjid dalam 1 database SQLite yang sama tanpa `mosqueId`.
- Membuat DB produksi klien di akun pribadi tanpa surat kepemilikan dan prosedur exit.
- Mengirim `*.db` berisi data masjid A ke masjid B.
- Membiarkan password default `admin123` tetap aktif setelah serah terima.
