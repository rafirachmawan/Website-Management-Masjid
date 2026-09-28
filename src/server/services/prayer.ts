// Service: jadwal sholat mingguan.
// "today" = hari yang cocok dengan tanggal berjalan di zona masjid,
// jatuh kembali ke hari pertama bila di luar rentang tersimpan.

import { db } from "../db";
import type { DailyPrayerSchedule } from "@/types";

function toDailySchedule(day: {
  date: string;
  hijriDate: string;
  sunrise: string;
  prayers: { name: string; arabic: string; time: string; isCurrent: boolean; isNext: boolean }[];
}): DailyPrayerSchedule {
  return {
    date: day.date,
    hijriDate: day.hijriDate,
    sunrise: day.sunrise,
    prayers: day.prayers.map((p) => ({
      name: p.name,
      arabic: p.arabic,
      time: p.time,
      isCurrent: p.isCurrent,
      isNext: p.isNext,
    })),
  };
}

export async function getWeeklyPrayerSchedule(): Promise<DailyPrayerSchedule[]> {
  const days = await db.prayerDay.findMany({
    orderBy: { date: "asc" },
    include: { prayers: { orderBy: { order: "asc" } } },
  });
  return days.map(toDailySchedule);
}

export async function getPrayerSchedule(): Promise<{
  today: DailyPrayerSchedule;
  week: DailyPrayerSchedule[];
}> {
  const week = await getWeeklyPrayerSchedule();
  if (week.length === 0) throw new Error("Jadwal sholat kosong — jalankan db:seed.");

  const profile = await db.mosqueProfile.findUniqueOrThrow({ where: { id: "main" } });
  const todayISO = new Intl.DateTimeFormat("en-CA", {
    timeZone: profile.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return { today: week.find((d) => d.date === todayISO) ?? week[0], week };
}
