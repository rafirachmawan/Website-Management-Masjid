"use client";

import { useState, useEffect } from "react";
import { weeklyPrayerSchedule, mosqueProfile } from "@/lib/mock-data";
import type { DailyPrayerSchedule, PrayerTime } from "@/types";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sun, Moon, Star, Clock } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const PRAYER_ORDER = ["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"] as const;
const PRAYER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Subuh: Sun,
  Dzuhur: Sun,
  Ashar: Sun,
  Maghrib: Moon,
  Isya: Star,
};

function PrayerTimeCard({ prayer, isCurrent, isNext }: { prayer: PrayerTime; isCurrent: boolean; isNext: boolean }) {
  const Icon = PRAYER_ICONS[prayer.name] || Clock;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center overflow-hidden rounded-2xl p-5 pt-7 text-center transition-colors duration-200",
        isCurrent
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
          : isNext
          ? "border border-primary/30 bg-primary/[0.06] shadow-sm"
          : "border border-border bg-card shadow-sm hover:border-primary/30"
      )}
    >
      {isCurrent && (
        <>
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            aria-hidden="true"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              maskImage: "radial-gradient(ellipse 80% 80% at 50% 0%, black 40%, transparent 100%)",
            }}
          />
          <div className="absolute -top-0 left-1/2 -translate-x-1/2 translate-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden="true" />
              Sekarang
            </span>
          </div>
        </>
      )}
      {isNext && !isCurrent && (
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            Berikutnya
          </span>
        </div>
      )}

      <Icon className={cn("mb-2.5 h-7 w-7", isCurrent ? "text-white" : "text-primary")} aria-hidden="true" />
      <p className={cn("text-[13px] font-semibold tracking-wide uppercase", isCurrent ? "text-white/85" : "text-muted-foreground")}>
        {prayer.name}
      </p>
      <p className={cn("mt-0.5 mb-2 text-xs", isCurrent ? "text-white/65" : "text-muted-foreground/80")} aria-hidden="true">
        {prayer.arabic}
      </p>
      <p className={cn("font-bold tabular-nums tracking-tight", isCurrent ? "text-[1.7rem] leading-none" : "text-xl")}>
        {prayer.time}
      </p>
    </div>
  );
}

function DaySchedule({ schedule, isToday }: { schedule: DailyPrayerSchedule; isToday: boolean }) {
  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div>
          <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-primary">
            <span className={cn("h-1.5 w-1.5 rounded-full", isToday ? "animate-pulse bg-primary" : "bg-muted-foreground/40")} aria-hidden="true" />
            {isToday ? "Hari ini" : formatDate(schedule.date, { weekday: "long" })}
          </p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{formatDate(schedule.date, { day: "numeric", month: "long" })}</p>
          <p className="mt-1 text-sm font-medium text-primary">{schedule.hijriDate}</p>
        </div>
        <div className="border-t border-border/60 pt-4 sm:border-0 sm:pt-0 sm:text-right">
          <p className="text-xs font-medium text-muted-foreground">Terbit Matahari</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">{schedule.sunrise}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Waktu Indonesia Barat</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-5">
        {PRAYER_ORDER.map((prayerName) => {
          const prayer = schedule.prayers.find((p) => p.name === prayerName);
          if (!prayer) return null;
          return (
            <PrayerTimeCard
              key={prayerName}
              prayer={prayer}
              isCurrent={isToday && prayer.isCurrent}
              isNext={isToday && prayer.isNext}
            />
          );
        })}
      </div>
    </div>
  );
}

export function PrayerScheduleSection() {
  const [activeDay, setActiveDay] = useState(0);

  const today = new Date().toISOString().split("T")[0];
  const todayIndex = weeklyPrayerSchedule.findIndex((s) => s.date === today);

  useEffect(() => {
    if (todayIndex !== -1) {
      setActiveDay(todayIndex);
    }
  }, [todayIndex]);

  return (
    <section
      id="jadwal-sholat"
      aria-labelledby="prayer-heading"
      className="scroll-mt-24 bg-background py-16 md:py-20"
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl md:mb-10">
          <h2 id="prayer-heading" className="text-2xl font-bold tracking-tight text-balance text-foreground md:text-3xl">
            Jadwal Sholat Mingguan
          </h2>
          <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-muted-foreground md:text-base">
            Mengikuti lokasi masjid. Waktu berjalan ditandai hijau.
          </p>
        </div>

        <div className="w-full">
        <Tabs value={weeklyPrayerSchedule[activeDay].date} onValueChange={(v) => setActiveDay(weeklyPrayerSchedule.findIndex((s) => s.date === v))} className="w-full">
          <TabsList className="mb-6 flex gap-1 overflow-x-auto rounded-full border border-border bg-muted/60 p-1.5" aria-label="Hari">
            {weeklyPrayerSchedule.map((schedule) => (
              <TabsTrigger
                key={schedule.date}
                value={schedule.date}
                className={cn(
                  "shrink-0 snap-start rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition-colors",
                  schedule.date === today && "text-primary"
                )}
              >
                <span className="font-semibold">{formatDate(schedule.date, { weekday: "short" })}</span>
                <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">{formatDate(schedule.date, { day: "2-digit", month: "2-digit" })}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {weeklyPrayerSchedule.map((schedule) => (
            <TabsContent key={schedule.date} value={schedule.date}>
              <DaySchedule schedule={schedule} isToday={schedule.date === today} />
            </TabsContent>
          ))}

          <p className="mt-6 text-[13px] leading-relaxed text-muted-foreground">
            Hisab otomatis ({mosqueProfile.latitude}, {mosqueProfile.longitude}),
            di-cache harian.
          </p>
        </Tabs>
        </div>
      </div>
    </section>
  );
}