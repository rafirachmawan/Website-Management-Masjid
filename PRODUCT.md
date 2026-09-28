# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Jamaah & publik**: melihat laporan keuangan masjid yang transparan (saldo, pemasukan, pengeluaran, grafik), jadwal salat, dan pengumuman. Tanpa login.
- **Pengurus masjid (multi-peran)**: mengelola data lewat halaman admin — mis. bendahara (transaksi & laporan), sekretaris/kegiatan (pengumuman & agenda), admin profil/jadwal. Lewat login admin.

## Product Purpose

Website profil + pengelolaan keuangan masjid dengan transparansi sebagai tujuan utama: setiap rupiah yang masuk dan keluar tercatat dan terbuka untuk umum, demi kepercayaan dan kebersamaan jamaah. Sukses = jamaah bisa memverifikasi keuangan kapan saja; pengurus bisa mencatat dan melaporkan dengan mudah.

## Positioning

Dibangun sebagai **template multi-masjid**: satu codebase yang bisa dipakai ulang oleh masjid lain, bukan hanya satu masjid. Transparansi keuangan publik (bukan sekadar pembukuan internal) adalah pembeda yang tidak bisa diklaim produk pembukuan biasa.

## Operating Context

- Bahasa antarmuka: Bahasa Indonesia.
- Konten Islami: jadwal salat lima waktu + tanggal Hijriah tampil di halaman publik.
- Alur pengurus: catat transaksi (pemasukan/pengeluaran per kategori) → pantau ringkasan & grafik → terbitkan laporan, pengumuman, dan jadwal salat.

## Capabilities and Constraints

- Halaman publik: hero, ringkasan keuangan, grafik, tabel transaksi, pengumuman, jadwal salat, footer profil.
- Halaman admin: dashboard, transaksi, laporan, kegiatan, pengumuman, pengguna, jadwal salat, pengaturan.
- Data saat ini statis (`src/lib/mock-data.ts`); **rencana disambungkan ke database/backend sungguhan** (teknologinya belum diputuskan — open decision).
- Identitas "Masjid Al-Ikhlas" beserta seluruh isi data contoh adalah placeholder template, bukan data final.
- Open decisions: pilihan database/backend; model autentikasi & hak akses per peran admin.

## Brand Commitments

- Bahasa dan nada: Bahasa Indonesia formal-sopan khas lembaga masjid ("jamaah", "takmir", "infak", "zakat", "wakaf").
- Tidak ada komitmen visual (logo, warna, font) yang mengikat — template harus netral dan mudah di-branding ulang per masjid.

## Evidence on Hand

- Data contoh: `src/lib/mock-data.ts` (profil, kategori, transaksi, pengumuman, jadwal).
- Tidak ada data asli, testimoni, atau aset brand final — jangan fabrikasi angka/transaksi seolah data sungguhan.

## Product Principles

1. Transparansi dulu: angka keuangan selalu terbuka dan mudah diverifikasi publik.
2. Template, bukan satu masjid: setiap identitas spesifik harus mudah diganti.
3. Mudah untuk non-teknisi: pengurus takmir harus bisa mengelola tanpa bantuan developer.
4. Kejujuran data: jelas membedakan data contoh vs data produksi.
