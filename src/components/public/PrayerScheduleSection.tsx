"use client";

import { useState, useEffect } from "react";
import type { DailyPrayerSchedule, MosqueProfile } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sun, Moon, Star, Clock, Timer, SunHorizon, MapPin } from "@phosphor-icons/react";

const PRAYER_ORDER = ["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"] as const;
const PRAYER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Subuh: Sun,
  Dzuhur: Sun,
  Ashar: Sun,
  Maghrib: Moon,
  Isya: Star,
};

const DEFAULT_TZ = "Asia/Jakarta";

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function jakartaParts(d: Date, tz: string): { h: number; m: number; s: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { h: get("hour") % 24, m: get("minute"), s: get("second") };
}

function jakartaTodayISO(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

interface LiveInfo {
  name: string;
  time: string;
  arabic: string;
  besok: boolean;
  currentName: string | null;
  ticking: string;
  friendly: string | null;
  progressPct: number;
  nowLabel: string;
}

function Timetable({
  schedule,
  isToday,
  nowMin,
  live,
}: {
  schedule: DailyPrayerSchedule;
  isToday: boolean;
  nowMin: number | null;
  live: LiveInfo | null;
}) {
  const mins = PRAYER_ORDER.map(
    (n) => toMinutes(schedule.prayers.find((p) => p.name === n)?.time ?? "00:00"),
  );
  const nextIdx = isToday && nowMin !== null ? mins.findIndex((m) => m > nowMin) : -2;
  // nextIdx: -2 = bukan hari ini (netral) | -1 = semua lewat | >=0 = index berikutnya

  const statusOf = (idx: number): "done" | "current" | "next" | "idle" => {
    if (nextIdx === -2) return "idle";
    if (nextIdx === -1) return idx === mins.length - 1 ? "current" : "done";
    if (nextIdx === 0) return idx === 0 ? "next" : "idle";
    if (idx < nextIdx - 1) return "done";
    if (idx === nextIdx - 1) return "current";
    if (idx === nextIdx) return "next";
    return "idle";
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {isToday && live && (
        <div className="border-b border-border/60">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4">
            <p className="flex min-w-0 items-center gap-2 text-[15px] text-foreground">
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              <span className="truncate">
                Berikutnya: <strong className="font-bold">{live.name}</strong>{" "}
                <span lang="ar" dir="rtl" className="font-arabic text-muted-foreground">
                  {live.arabic}
                </span>{" "}
                <span className="text-muted-foreground tabular-nums">
                  • {live.time} WIB{live.besok ? " (besok)" : ""}
                </span>
              </span>
            </p>
            <p className="flex shrink-0 items-center gap-1.5 text-xl font-bold tabular-nums text-foreground">
              <Timer className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {live.ticking}
            </p>
          </div>
          <div
            className="mx-5 mb-4 h-1 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`Perjalanan waktu menuju ${live.name} ${live.progressPct} persen`}
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${live.progressPct}%` }} />
          </div>
        </div>
      )}

      <ul className="divide-y divide-border/60">
        {PRAYER_ORDER.map((prayerName, idx) => {
          const prayer = schedule.prayers.find((p) => p.name === prayerName);
          if (!prayer) return null;
          const status = statusOf(idx);
          const Icon = PRAYER_ICONS[prayer.name] || Clock;
          return (
            <li
              key={prayerName}
              className={cn(
                "flex items-center justify-between gap-3 px-5 py-3.5",
                status === "current" && "bg-primary/[0.06]",
                status === "done" && "opacity-55",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    status === "done" ? "text-muted-foreground" : "text-primary",
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-foreground">
                    {prayer.name}
                    <span
                      lang="ar"
                      dir="rtl"
                      aria-hidden="true"
                      className="font-arabic ml-2.5 font-normal text-muted-foreground"
                    >
                      {prayer.arabic}
                    </span>
                  </p>
                  {status === "current" && (
                    <p className="mt-0.5 text-xs font-semibold text-primary">Sedang berlangsung</p>
                  )}
                  {status === "next" && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Berikutnya{live?.friendly ? ` • ${live.friendly}` : ""}
                    </p>
                  )}
                </div>
              </div>
              <p
                className={cn(
                  "shrink-0 text-lg font-bold tabular-nums",
                  status === "next"
                    ? "text-primary"
                    : status === "done"
                      ? "text-muted-foreground"
                      : "text-foreground",
                )}
              >
                {prayer.time}
              </p>
            </li>
          );
        })}
      </ul>

      {isToday && live && (
        <div className="border-t border-border/60 px-5 py-3 text-[13px] text-muted-foreground tabular-nums">
          Sekarang {live.nowLabel} WIB
          {live.currentName ? ` • Sedang: ${live.currentName}` : ""}
          {live.friendly ? ` • ${live.friendly} menuju ${live.name}` : ""}
        </div>
      )}
    </div>
  );
}

export function PrayerScheduleSection({
  profile,
  prayer: prayerData,
}: {
  profile: MosqueProfile;
  prayer: { today: DailyPrayerSchedule; week: DailyPrayerSchedule[] };
}) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const tz = profile?.timezone ?? DEFAULT_TZ;
  const weeklyPrayerSchedule = prayerData?.week ?? [];

  const todayISO = mounted ? jakartaTodayISO(now, tz) : null;
  const todayIndex = todayISO
    ? weeklyPrayerSchedule.findIndex((s) => s.date === todayISO)
    : -1;
  const [activeDay, setActiveDay] = useState(0);
  const [dayPinned, setDayPinned] = useState(false);

  if (!dayPinned && todayIndex !== -1) {
    setActiveDay(todayIndex);
    setDayPinned(true);
  }

  const activeSchedule = weeklyPrayerSchedule[activeDay];
  const todaySchedule = todayIndex !== -1 ? weeklyPrayerSchedule[todayIndex] : undefined;

  // ── Status live hari ini (zona waktu masjid) ──
  let live: LiveInfo | null = null;
  let nowMinLive: number | null = null;

  if (todaySchedule && mounted) {
    const { h, m, s } = jakartaParts(now, tz);
    const nowMin = h * 60 + m;
    nowMinLive = nowMin;
    const mins = PRAYER_ORDER.map(
      (n) => toMinutes(todaySchedule.prayers.find((p) => p.name === n)?.time ?? "00:00"),
    );
    const nextIdx = mins.findIndex((mm) => mm > nowMin);
    const prayerOf = (n: string) => todaySchedule.prayers.find((p) => p.name === n);

    let name: string;
    let besok = false;
    let currentName: string | null;
    let diffSec: number;
    let progress: number;

    if (nextIdx === -1) {
      const subuh = prayerOf("Subuh");
      name = "Subuh";
      besok = true;
      currentName = "Isya";
      diffSec = (1440 - nowMin + mins[0]) * 60 - s;
      progress = (nowMin - mins[4]) / (mins[0] + 1440 - mins[4]);
    } else {
      name = PRAYER_ORDER[nextIdx];
      currentName = nextIdx === 0 ? null : PRAYER_ORDER[nextIdx - 1];
      diffSec = (mins[nextIdx] - nowMin) * 60 - s;
      const prevAbs = nextIdx === 0 ? mins[4] - 1440 : mins[nextIdx - 1];
      progress = (nowMin - prevAbs) / (mins[nextIdx] - prevAbs);
    }

    const p = prayerOf(name);
    live = {
      name,
      time: p?.time ?? "",
      arabic: p?.arabic ?? "",
      besok,
      currentName,
      ticking:
        diffSec > 0
          ? `${pad(Math.floor(diffSec / 3600))}:${pad(Math.floor((diffSec % 3600) / 60))}:${pad(diffSec % 60)}`
          : "--:--:--",
      friendly:
        diffSec > 0
          ? diffSec >= 3600
            ? `${Math.floor(diffSec / 3600)} jam ${Math.floor((diffSec % 3600) / 60)} mnt lagi`
            : diffSec >= 60
              ? `${Math.floor(diffSec / 60)} mnt ${diffSec % 60} dtk lagi`
              : `${diffSec} dtk lagi`
          : null,
      progressPct: Math.round(Math.min(1, Math.max(0, progress)) * 100),
      nowLabel: `${pad(h)}:${pad(m)}`,
    };
  }

  if (weeklyPrayerSchedule.length === 0) {
    return (
      <section
        id="jadwal-sholat"
        aria-labelledby="prayer-heading"
        className="scroll-mt-24 bg-background py-16 md:py-20"
      >
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            Jadwal sholat belum tersedia. Jalankan <code>npm run db:seed</code> untuk
            mengisinya.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="jadwal-sholat"
      aria-labelledby="prayer-heading"
      className="scroll-mt-24 bg-background py-16 md:py-20"
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1 text-xs font-semibold text-primary">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            Jadwal sholat • Diperbarui harian
          </p>
          <h2
            id="prayer-heading"
            className="font-display text-h2-fluid mt-3 font-semibold text-foreground"
          >
            Jadwal Sholat Mingguan
          </h2>
          <p className="mt-2.5 max-w-[58ch] text-pretty text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            Mengikuti lokasi masjid. Pilih hari untuk melihat lima waktu sholat.
          </p>
        </div>

        <Tabs
          value={activeSchedule.date}
          onValueChange={(v) =>
            setActiveDay(weeklyPrayerSchedule.findIndex((s) => s.date === v))
          }
          className="mt-8 w-full"
        >
          {/* Baris tanggal aktif — teks biasa, tanpa kartu */}
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-lg font-bold text-foreground">
                {formatDate(activeSchedule.date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                {activeSchedule.date === todayISO && (
                  <span className="ml-2 rounded-full bg-primary/[0.08] px-2 py-0.5 align-middle text-[11px] font-bold text-primary">
                    Hari ini
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-sm font-medium text-primary">
                {activeSchedule.hijriDate}
              </p>
            </div>
            <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground tabular-nums">
              <SunHorizon className="h-4 w-4 text-primary" aria-hidden="true" />
              Terbit {activeSchedule.sunrise} WIB
            </p>
          </div>

          {/* Pemilih hari: strip tab bergaris bawah */}
          <TabsList
            className="mt-3 flex h-auto! w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border/60 bg-transparent p-0"
            aria-label="Pilih hari"
          >
            {weeklyPrayerSchedule.map((schedule) => {
              const isTodayTab = schedule.date === todayISO;
              return (
                <TabsTrigger
                  key={schedule.date}
                  value={schedule.date}
                  className="group h-auto min-w-[3.75rem] flex-1 snap-start flex-col gap-0 rounded-none border-0 px-3 py-2 text-muted-foreground data-active:bg-transparent data-active:text-foreground data-active:shadow-none! sm:min-w-0 sm:px-2"
                >
                  <span className="text-[11px] font-bold tracking-widest uppercase">
                    {formatDate(schedule.date, { weekday: "short" })}
                  </span>
                  <span className="text-lg leading-snug font-bold tabular-nums">
                    {formatDate(schedule.date, { day: "numeric" })}
                    <span className="ml-1 text-[11px] font-medium text-muted-foreground">
                      {formatDate(schedule.date, { month: "short" }).replace(".", "")}
                    </span>
                  </span>
                  <span className="mt-1 flex h-1 items-center" aria-hidden="true">
                    {isTodayTab && (
                      <span className="h-1 w-1 rounded-full bg-primary group-data-active:bg-primary" />
                    )}
                  </span>
                  <span
                    className="absolute inset-x-3 bottom-[-1px] hidden h-0.5 rounded-full bg-primary group-data-active:block"
                    aria-hidden="true"
                  />
                </TabsTrigger>
              );
            })}
          </TabsList>

          {weeklyPrayerSchedule.map((schedule) => (
            <TabsContent key={schedule.date} value={schedule.date} className="mt-4">
              <Timetable
                schedule={schedule}
                isToday={schedule.date === todayISO}
                nowMin={schedule.date === todayISO ? nowMinLive : null}
                live={schedule.date === todayISO ? live : null}
              />
            </TabsContent>
          ))}

          <p className="mt-5 flex items-start gap-1.5 text-[13px] leading-relaxed text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            Mengikuti lokasi {profile.name} — Jakarta • Zona WIB • Diperbarui setiap hari.
          </p>
        </Tabs>
      </div>
    </section>
  );
}
