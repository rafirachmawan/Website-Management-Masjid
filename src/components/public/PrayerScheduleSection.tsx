"use client";

import { useState, useEffect } from "react";
import { weeklyPrayerSchedule, mosqueProfile } from "@/lib/mock-data";
import type { DailyPrayerSchedule, PrayerTime } from "@/types";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
        "relative rounded-xl p-4 transition-all duration-300 flex flex-col items-center text-center",
        isCurrent
          ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/50 scale-[1.02]"
          : isNext
          ? "bg-primary/5 border-2 border-primary/30"
          : "bg-card border border-border hover:border-primary/30"
      )}
    >
      {isCurrent && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          <Badge className="px-2 py-0.5 text-xs font-medium bg-primary-foreground text-primary animate-pulse">
            Sekarang
          </Badge>
        </div>
      )}
      {isNext && !isCurrent && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary">
            Berikutnya
          </Badge>
        </div>
      )}

      <Icon className="w-8 h-8 mb-2" aria-hidden="true" />
      <p className="text-sm font-medium uppercase tracking-wider mb-1">
        {prayer.name}
      </p>
      <p className="text-xs text-muted-foreground/70 mb-2" aria-hidden="true">
        {prayer.arabic}
      </p>
      <p className={cn("font-mono font-bold tabular-nums", isCurrent ? "text-2xl" : "text-xl")}>
        {prayer.time}
      </p>
    </div>
  );
}

function DaySchedule({ schedule, isToday }: { schedule: DailyPrayerSchedule; isToday: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
        <div>
          <p className="text-sm text-muted-foreground">{isToday ? "Hari Ini" : formatDate(schedule.date, { weekday: "long" })}</p>
          <p className="text-xl font-semibold text-foreground">{formatDate(schedule.date, { day: "numeric", month: "long" })}</p>
          <p className="text-sm text-muted-foreground">{schedule.hijriDate}</p>
        </div>
        {isToday && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Terbit Matahari</p>
            <p className="font-mono font-bold text-foreground">{schedule.sunrise}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-3">
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
    <section aria-labelledby="prayer-heading" className="py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 id="prayer-heading" className="text-2xl font-semibold text-foreground">
              Jadwal Sholat Mingguan
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Jadwal sholat otomatis berdasarkan lokasi masjid
            </p>
          </div>
        </div>

        <Tabs value={weeklyPrayerSchedule[activeDay].date} onValueChange={(v) => setActiveDay(weeklyPrayerSchedule.findIndex((s) => s.date === v))} className="w-full">
          <TabsList className="bg-muted p-1 rounded-lg flex-nowrap overflow-x-auto pb-2 -mx-1 px-1 mb-6" aria-label="Hari">
            {weeklyPrayerSchedule.map((schedule) => (
              <TabsTrigger
                key={schedule.date}
                value={schedule.date}
                className={cn(
                  "px-3 py-1.5 text-sm whitespace-nowrap flex items-center gap-1.5 transition-all",
                  schedule.date === today && "bg-primary/10 text-primary"
                )}
              >
                <span className="font-medium">{formatDate(schedule.date, { weekday: "short" })}</span>
                <span className="text-xs text-muted-foreground">{formatDate(schedule.date, { day: "2-digit", month: "2-digit" })}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {weeklyPrayerSchedule.map((schedule) => (
            <TabsContent key={schedule.date} value={schedule.date}>
              <DaySchedule schedule={schedule} isToday={schedule.date === today} />
            </TabsContent>
          ))}

          <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border">
            <p className="text-sm text-muted-foreground text-center">
              Jadwal sholat dihitung otomatis menggunakan metode Hisab (Koordinat: {mosqueProfile.latitude}, {mosqueProfile.longitude}).
              Data di-cache harian untuk memastikan ketersediaan saat API eksternal tidak tersedia.
            </p>
          </div>
        </Tabs>
      </div>
    </section>
  );
}