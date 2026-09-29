// Service: jadwal sholat mingguan — DIHITUNG OTOMATIS, bukan input admin.
//
// Sumber: koordinat + zona waktu di profil masjid (diisi sekali lewat
// halaman Pengaturan). Metode Singapore (Subuh 20° / Isya 18°) = standar
// Kemenag RI. Tabel PrayerDay/PrayerTime tidak lagi dipakai.

import { CalculationMethod, Coordinates, PrayerTimes } from "adhan";
import { db } from "../db";
import type { DailyPrayerSchedule } from "@/types";

const ORDER = ["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"] as const;

const ARABIC: Record<(typeof ORDER)[number], string> = {
  Subuh: "الفجر",
  Dzuhur: "الظهر",
  Ashar: "العصر",
  Maghrib: "المغرب",
  Isya: "العشاء",
};

const WEEK_DAYS = 7;

function isoInTimeZone(instant: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

function addDaysISO(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(instant: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("hour").padStart(2, "0")}:${get("minute")}`.replace("24:", "00:");
}

function formatHijri(instant: Date, tz: string): string {
  try {
    const s = new Intl.DateTimeFormat("id-u-ca-islamic", {
      timeZone: tz,
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(instant);
    return s.replace(" AH", " H").trim();
  } catch {
    return "";
  }
}

export async function getWeeklyPrayerSchedule(now = new Date()): Promise<DailyPrayerSchedule[]> {
  const profile = await db.mosqueProfile.findUnique({ where: { id: "main" } });
  // Belum ada profil / koordinat belum diisi (0,0 = Samudra Atlantik) → kosong.
  if (!profile || (profile.latitude === 0 && profile.longitude === 0)) return [];

  const tz = profile.timezone || "Asia/Jakarta";
  const coords = new Coordinates(profile.latitude, profile.longitude);
  const params = CalculationMethod.Singapore();

  const todayISO = isoInTimeZone(now, tz);
  const nowMin =
    Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hour: "2-digit",
        hour12: false,
      }).format(now),
    ) *
      60 +
    Number(
      new Intl.DateTimeFormat("en-GB", { timeZone: tz, minute: "2-digit", hour12: false }).format(
        now,
      ),
    );

  const week: DailyPrayerSchedule[] = [];
  for (let i = 0; i < WEEK_DAYS; i++) {
    const iso = addDaysISO(todayISO, i);
    // Tengah hari UTC: komponen lokal server untuk instans ini selalu jatuh
    // pada hari yang sama untuk zona server yang wajar (UTC−12…UTC+11),
    // sehingga adhan menghitung hari yang tepat.
    const noon = new Date(`${iso}T12:00:00Z`);
    const pt = new PrayerTimes(coords, noon, params);

    const times: Record<(typeof ORDER)[number], string> = {
      Subuh: formatTime(pt.fajr, tz),
      Dzuhur: formatTime(pt.dhuhr, tz),
      Ashar: formatTime(pt.asr, tz),
      Maghrib: formatTime(pt.maghrib, tz),
      Isya: formatTime(pt.isha, tz),
    };

    let isCurrent: string | null = null;
    let isNext: string | null = null;
    if (i === 0) {
      for (const name of ORDER) {
        if (toMinutes(times[name]) <= nowMin) isCurrent = name;
        else if (!isNext) isNext = name;
      }
      if (!isNext) {
        isNext = "Subuh";
        isCurrent = "Isya";
      }
    }

    week.push({
      date: iso,
      hijriDate: formatHijri(noon, tz),
      sunrise: formatTime(pt.sunrise, tz),
      prayers: ORDER.map((name) => ({
        name,
        arabic: ARABIC[name],
        time: times[name],
        isCurrent: isCurrent === name,
        isNext: isNext === name,
      })),
    });
  }
  return week;
}

export async function getPrayerSchedule(now = new Date()): Promise<{
  today: DailyPrayerSchedule | null;
  week: DailyPrayerSchedule[];
}> {
  const week = await getWeeklyPrayerSchedule(now);
  if (week.length === 0) return { today: null, week };

  const profile = await db.mosqueProfile.findUnique({ where: { id: "main" } });
  const tz = profile?.timezone || "Asia/Jakarta";
  const todayISO = isoInTimeZone(now, tz);
  return { today: week.find((d) => d.date === todayISO) ?? week[0], week };
}
