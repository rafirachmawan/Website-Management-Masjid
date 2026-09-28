// Seed database lokal dari data awal (prisma/seed-data.ts).
// Jalankan: `npm run db:seed`. Idempoten — aman dijalankan ulang.

import { PrismaClient } from "@prisma/client";
import {
  mosqueProfile,
  categories,
  transactions,
  announcements,
  activities,
  weeklyPrayerSchedule,
  officials,
} from "./seed-data";

const db = new PrismaClient();

async function main() {
  await db.mosqueProfile.upsert({
    where: { id: "main" },
    create: {
      id: "main",
      name: mosqueProfile.name,
      shortName: mosqueProfile.shortName,
      address: mosqueProfile.address,
      phone: mosqueProfile.phone,
      email: mosqueProfile.email,
      latitude: mosqueProfile.latitude,
      longitude: mosqueProfile.longitude,
      timezone: mosqueProfile.timezone,
      establishedYear: mosqueProfile.establishedYear,
      description: mosqueProfile.description,
      logoUrl: mosqueProfile.logoUrl,
      coverImageUrl: mosqueProfile.coverImageUrl,
      heroImages: mosqueProfile.heroImages ?? [],
    },
    update: {},
  });

  for (const c of categories) {
    await db.category.upsert({
      where: { id: c.id },
      create: { id: c.id, name: c.name, type: c.type, icon: c.icon, color: c.color },
      update: { name: c.name, type: c.type, icon: c.icon, color: c.color },
    });
  }

  for (const t of transactions) {
    await db.transaction.upsert({
      where: { id: t.id },
      create: {
        id: t.id,
        date: t.date,
        type: t.type,
        category: t.category,
        categoryId: t.categoryId,
        amount: t.amount,
        description: t.description,
        proofUrl: t.proofUrl,
        recordedBy: t.recordedBy,
        createdAt: new Date(t.createdAt),
      },
      update: {},
    });
  }

  for (const a of announcements) {
    await db.announcement.upsert({
      where: { id: a.id },
      create: {
        id: a.id,
        title: a.title,
        content: a.content,
        imageUrl: a.imageUrl,
        priority: a.priority,
        publishedAt: new Date(a.publishedAt),
        author: a.author,
      },
      update: {},
    });
  }

  for (const a of activities) {
    await db.activity.upsert({
      where: { id: a.id },
      create: {
        id: a.id,
        title: a.title,
        description: a.description,
        date: a.date,
        time: a.time,
        location: a.location,
        organizer: a.organizer,
        imageUrl: a.imageUrl,
      },
      update: {},
    });
  }

  for (const o of officials) {
    await db.official.upsert({
      where: { id: o.id },
      create: {
        id: o.id,
        name: o.name,
        role: o.role,
        systemRole: o.systemRole,
        phone: o.phone,
        email: o.email,
        status: o.status,
        joinedDate: o.joinedDate,
        avatar: o.avatar,
      },
      update: {},
    });
  }

  // Jadwal sholat: tulis ulang penuh agar flag isCurrent/isNext selalu sinkron.
  await db.prayerTime.deleteMany();
  await db.prayerDay.deleteMany();
  for (const day of weeklyPrayerSchedule) {
    await db.prayerDay.create({
      data: {
        date: day.date,
        hijriDate: day.hijriDate,
        sunrise: day.sunrise,
        prayers: {
          create: day.prayers.map((p, order) => ({
            order,
            name: p.name,
            arabic: p.arabic,
            time: p.time,
            isCurrent: p.isCurrent,
            isNext: p.isNext,
          })),
        },
      },
    });
  }

  console.log("Seed selesai: profil, kategori, transaksi, pengumuman, kegiatan, jadwal, pengurus.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
