-- Pengaman duplikasi kategori di level database.
-- Cek aplikasi (case-insensitive) tetap menjadi pesan utama untuk pengguna;
-- indeks ini menutup celah dua permintaan yang datang bersamaan.
CREATE UNIQUE INDEX "Category_name_type_key" ON "Category"("name", "type");
