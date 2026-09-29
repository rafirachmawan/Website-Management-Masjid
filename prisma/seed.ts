// Seed DINONAKTIFKAN — tidak ada lagi data dummy/mockup.
// Seluruh data wajib diisi lewat halaman /admin dan tersimpan di database.
//
// `npm run db:seed` sekarang hanya memastikan database kosong & melaporkan
// isi terkini (tidak mengisi apa pun). Aman dijalankan ulang.

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const counts = {
    profil: await db.mosqueProfile.count(),
    kategori: await db.category.count(),
    transaksi: await db.transaction.count(),
    pengumuman: await db.announcement.count(),
    kegiatan: await db.activity.count(),
    jadwalSholat: await db.prayerDay.count(),
    pengurus: await db.official.count(),
  };
  console.log("Seed dinonaktifkan — tidak ada data dummy yang dimasukkan.");
  console.log("Isi database saat ini:", counts);
  console.log("Isi data lewat halaman /admin (tersimpan di database).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
