"use client";

import { useState, useEffect, useCallback } from "react";
import type { DailyPrayerSchedule, MosqueProfile } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import {
  Sun,
  Moon,
  Star,
  Clock,
  Timer,
  SunHorizon,
  MapPin,
  CaretDown,
} from "@phosphor-icons/react";

const PRAYER_ORDER = ["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"] as const;
const PRAYER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Subuh: Sun,
  Dzuhur: Sun,
  Ashar: Sun,
  Maghrib: Moon,
  Isya: Star,
};

const DEFAULT_TZ = "Asia/Jakarta";

// Singkatan zona untuk label waktu (menghindari "WIB" hardcode di luar Jawa).
function shortZone(tz: string): string {
  if (tz === "Asia/Jakarta") return "WIB";
  if (tz === "Asia/Makassar") return "WITA";
  if (tz === "Asia/Jayapura") return "WIT";
  return tz;
}

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

// Lis geometris bintang 8-sisi — tipis, dari token primary, tanpa aset baru.
function GeometricTrim() {
  const stars = Array.from({ length: 48 });
  return (
    <div
      aria-hidden="true"
      className="flex h-3.5 items-center gap-2 overflow-hidden border-b border-border/60 px-5 text-primary/25 sm:px-6"
    >
      {stars.map((_, i) => (
        <svg
          key={i}
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className="shrink-0"
        >
          <rect
            x="2"
            y="2"
            width="6"
            height="6"
            stroke="currentColor"
            strokeWidth="1"
          />
          <rect
            x="2"
            y="2"
            width="6"
            height="6"
            stroke="currentColor"
            strokeWidth="1"
            transform="rotate(45 5 5)"
          />
        </svg>
      ))}
    </div>
  );
}

function CountdownPill({
  live,
  zone,
  mounted,
}: {
  live: LiveInfo | null;
  zone: string;
  mounted: boolean;
}) {
  if (!live || !mounted) {
    return (
      <p
        role="status"
        className="inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-[13px] font-semibold text-muted-foreground tabular-nums"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/60" />
        Memuat hitung mundur…
      </p>
    );
  }
  return (
    <p
      aria-label={`Berikutnya ${live.name} pukul ${live.time}${live.besok ? " besok" : ""}, tersisa ${live.ticking}`}
      className="inline-flex max-w-full items-center gap-2 rounded-full bg-primary/[0.08] px-3.5 py-1.5 text-[13px] font-bold text-primary ring-1 ring-primary/20 ring-inset tabular-nums"
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
      </span>
      <span className="truncate">
        {live.name} · {live.ticking}
      </span>
      <span className="shrink-0 font-semibold text-primary/70">{zone}</span>
    </p>
  );
}

// ── Papan desktop: 1 kartu, baris = waktu, kolom = 7 hari ──
function PrayerBoard({
  week,
  todayISO,
  nowMin,
  live,
  zone,
}: {
  week: DailyPrayerSchedule[];
  todayISO: string | null;
  nowMin: number | null;
  live: LiveInfo | null;
  zone: string;
}) {
  const todayIdx = todayISO ? week.findIndex((s) => s.date === todayISO) : -1;

  // Status hanya untuk kolom hari ini; hari lain netral.
  let nextRow = -1;
  if (todayIdx !== -1 && nowMin !== null && week[todayIdx]) {
    const mins = PRAYER_ORDER.map((n) =>
      toMinutes(week[todayIdx].prayers.find((p) => p.name === n)?.time ?? "00:00"),
    );
    nextRow = mins.findIndex((m) => m > nowMin);
  }

  const statusOfToday = (idx: number): "done" | "current" | "next" | "idle" => {
    if (todayIdx === -1 || nowMin === null) return "idle";
    if (nextRow === -1) return idx === PRAYER_ORDER.length - 1 ? "current" : "done";
    if (nextRow === 0) return idx === 0 ? "next" : "idle";
    if (idx < nextRow - 1) return "done";
    if (idx === nextRow - 1) return "current";
    if (idx === nextRow) return "next";
    return "idle";
  };

  const onGridKeys = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (!keys.includes(e.key)) return;
    const el = document.activeElement as HTMLElement | null;
    if (!el?.dataset?.cell) return;
    e.preventDefault();
    const r = Number(el.dataset.r);
    const c = Number(el.dataset.c);
    let nr = r;
    let nc = c;
    if (e.key === "ArrowUp") nr = Math.max(0, r - 1);
    if (e.key === "ArrowDown") nr = Math.min(PRAYER_ORDER.length - 1, r + 1);
    if (e.key === "ArrowLeft") nc = Math.max(0, c - 1);
    if (e.key === "ArrowRight") nc = Math.min(week.length - 1, c + 1);
    const next = document.querySelector<HTMLElement>(
      `[data-cell="time"][data-r="${nr}"][data-c="${nc}"]`,
    );
    next?.focus();
  }, [week.length]);

  return (
    <div
      role="grid"
      aria-label="Jadwal sholat 7 hari"
      aria-colcount={week.length + 1}
      aria-rowcount={PRAYER_ORDER.length + 1}
      onKeyDown={onGridKeys}
      className="grid min-w-[760px]"
      style={{
        gridTemplateColumns: `minmax(168px, 1.1fr) repeat(${week.length}, minmax(0, 1fr))`,
      }}
    >
      {/* Baris kepala hari */}
      <div role="row" className="contents">
        <div
          role="columnheader"
          aria-label="Waktu sholat"
          className="flex items-end px-5 pb-3 pt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:px-6"
        >
          Waktu
        </div>
        {week.map((s, ci) => {
          const isToday = s.date === todayISO;
          return (
            <div
              key={s.date}
              role="columnheader"
              aria-label={`${formatDate(s.date, { weekday: "long", day: "numeric", month: "long" })}${isToday ? ", hari ini" : ""}`}
              className={cn(
                "border-l border-border/50 px-2 pb-3 pt-4 text-center",
                isToday && "bg-primary/[0.06]",
              )}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {formatDate(s.date, { weekday: "short" })}
              </p>
              <p className="mt-0.5 text-[15px] font-extrabold tabular-nums text-foreground">
                {formatDate(s.date, { day: "numeric" })}{" "}
                <span className="text-xs font-semibold text-muted-foreground">
                  {formatDate(s.date, { month: "short" }).replace(".", "")}
                </span>
              </p>
              <span className="mt-1.5 flex h-1.5 items-center justify-center" aria-hidden="true">
                {isToday ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                ) : null}
              </span>
            </div>
          );
        })}
      </div>

      {/* Baris waktu */}
      {PRAYER_ORDER.map((prayerName, ri) => {
        const Icon = PRAYER_ICONS[prayerName] || Clock;
        const arabic =
          week[0]?.prayers.find((p) => p.name === prayerName)?.arabic ?? "";
        return (
          <div key={prayerName} role="row" className="contents">
            <div
              role="rowheader"
              className="flex items-center gap-2.5 border-t border-border/60 px-5 py-3 sm:px-6"
            >
              <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <p className="min-w-0 truncate text-[14px] font-semibold text-foreground">
                {prayerName}
                <span
                  lang="ar"
                  dir="rtl"
                  aria-hidden="true"
                  className="font-arabic ml-2 text-[17px] font-normal text-muted-foreground"
                >
                  {arabic}
                </span>
              </p>
            </div>
            {week.map((s, ci) => {
              const prayer = s.prayers.find((p) => p.name === prayerName);
              const isToday = s.date === todayISO;
              const st = isToday ? statusOfToday(ri) : "idle";
              const isNext = isToday && st === "next";
              return (
                <div
                  key={s.date + prayerName}
                  role="gridcell"
                  data-cell="time"
                  data-r={ri}
                  data-c={ci}
                  tabIndex={0}
                  aria-label={`${prayerName} ${formatDate(s.date, { weekday: "short", day: "numeric", month: "short" })} pukul ${prayer?.time ?? "--:--"}${isNext ? ", berikutnya" : ""}${isToday && st === "done" ? ", telah lewat" : ""}`}
                  aria-selected={isNext}
                  className={cn(
                    "border-l border-t border-border/50 px-2 py-3 text-center outline-none transition-colors",
                    "focus-visible:bg-primary/[0.1] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    isToday && "bg-primary/[0.06]",
                    st === "done" && "opacity-50",
                  )}
                >
                  <p
                    className={cn(
                      "text-[15px] font-bold tabular-nums",
                      isNext
                        ? "text-primary"
                        : st === "done"
                          ? "text-muted-foreground"
                          : "text-foreground",
                    )}
                  >
                    {prayer?.time ?? "--:--"}
                  </p>
                  <span
                    className="mt-1 flex h-3 items-center justify-center gap-1"
                    aria-hidden="true"
                  >
                    {isNext && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          {live?.friendly ? live.friendly.split(" ").slice(0, 2).join(" ") : "Berikutnya"}
                        </span>
                      </>
                    )}
                    {isToday && st === "current" && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Sedang
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Baris terbit */}
      <div role="row" className="contents">
        <div
          role="rowheader"
          className="flex items-center gap-2.5 border-t border-border/60 px-5 py-3 text-[13px] text-muted-foreground sm:px-6"
        >
          <SunHorizon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          Terbit
        </div>
        {week.map((s) => {
          const isToday = s.date === todayISO;
          return (
            <div
              key={s.date + "sunrise"}
              role="gridcell"
              aria-label={`Terbit ${formatDate(s.date, { weekday: "short" })} pukul ${s.sunrise} ${zone}`}
              className={cn(
                "border-l border-t border-border/50 px-2 py-3 text-center text-[13px] font-semibold tabular-nums text-muted-foreground",
                isToday && "bg-primary/[0.06]",
              )}
            >
              {s.sunrise}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Daftar mobile: 7 kartu hari, hari ini paling atas & terbuka ──
function MobileDayList({
  ordered,
  todayISO,
  nowMin,
  live,
  zone,
  expandedDate,
  onToggle,
}: {
  ordered: DailyPrayerSchedule[];
  todayISO: string | null;
  nowMin: number | null;
  live: LiveInfo | null;
  zone: string;
  expandedDate: string | null;
  onToggle: (date: string) => void;
}) {
  const minsToday =
    todayISO && nowMin !== null
      ? (() => {
          const t = ordered.find((s) => s.date === todayISO);
          if (!t) return null;
          return PRAYER_ORDER.map((n) =>
            toMinutes(t.prayers.find((p) => p.name === n)?.time ?? "00:00"),
          );
        })()
      : null;
  const nextRowToday =
    minsToday && nowMin !== null ? minsToday.findIndex((m) => m > nowMin) : -1;

  return (
    <div className="space-y-3 md:hidden">
      {ordered.map((s) => {
        const isToday = s.date === todayISO;
        const expanded = expandedDate === s.date;
        const panelId = `prayer-day-${s.date}`;
        const first = s.prayers[0];
        const todayNext =
          isToday && live && nextRowToday >= 0
            ? s.prayers.find((p) => p.name === PRAYER_ORDER[nextRowToday])
            : null;
        return (
          <article
            key={s.date}
            className={cn(
              "overflow-hidden rounded-2xl border border-border bg-card",
              isToday && "border-primary/30 ring-1 ring-primary/20 ring-inset",
            )}
          >
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => onToggle(s.date)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-bold text-foreground">
                    {formatDate(s.date, { weekday: "long", day: "numeric", month: "short" })}
                  </span>
                  {isToday && (
                    <span className="rounded-full bg-primary/[0.08] px-2 py-0.5 text-[11px] font-bold text-primary ring-1 ring-primary/20 ring-inset">
                      Hari ini
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[13px] font-medium text-primary">
                  {s.hijriDate}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2.5">
                <span className="text-right tabular-nums">
                  <span className="block text-sm font-extrabold text-foreground">
                    {(todayNext ?? first)?.time ?? "--:--"}
                  </span>
                  <span className="block text-[11px] font-semibold text-muted-foreground">
                    {(todayNext ?? first)?.name ?? ""} · {zone}
                  </span>
                </span>
                <CaretDown
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    expanded && "rotate-180",
                  )}
                />
              </span>
            </button>

            {isToday && (
              <div className="border-t border-border/60 px-5 py-3">
                {live ? (
                  <div>
                    <div className="flex items-baseline justify-between gap-2 tabular-nums">
                      <p className="text-[13px] font-semibold text-muted-foreground">
                        {live.name}
                        {live.besok ? " (besok)" : ""} · {live.time} {zone}
                      </p>
                      <p className="text-lg font-extrabold tabular-nums text-foreground">
                        {live.ticking}
                      </p>
                    </div>
                    <div
                      className="mt-2 h-1 overflow-hidden rounded-full bg-border"
                      role="img"
                      aria-label={`Perjalanan waktu menuju ${live.name} ${live.progressPct} persen`}
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${live.progressPct}%` }}
                      />
                    </div>
                    {live.friendly && (
                      <p className="mt-1.5 text-xs text-muted-foreground">{live.friendly}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[13px] text-muted-foreground">Memuat hitung mundur…</p>
                )}
              </div>
            )}

            {expanded && (
              <ul id={panelId} className="divide-y divide-border/60 border-t border-border/60">
                {PRAYER_ORDER.map((prayerName, idx) => {
                  const prayer = s.prayers.find((p) => p.name === prayerName);
                  if (!prayer) return null;
                  const Icon = PRAYER_ICONS[prayer.name] || Clock;
                  let st: "done" | "current" | "next" | "idle" = "idle";
                  if (isToday && nextRowToday !== -1 && nowMin !== null) {
                    if (nextRowToday === -1) st = idx === 4 ? "current" : "done";
                    else if (nextRowToday === 0) st = idx === 0 ? "next" : "idle";
                    else if (idx < nextRowToday - 1) st = "done";
                    else if (idx === nextRowToday - 1) st = "current";
                    else if (idx === nextRowToday) st = "next";
                  } else if (isToday && nextRowToday === -1) {
                    st = idx === 4 ? "current" : "done";
                  }
                  return (
                    <li
                      key={prayerName}
                      className={cn(
                        "flex items-center justify-between gap-3 px-5 py-3",
                        st === "current" && "bg-primary/[0.06]",
                        st === "done" && "opacity-55",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Icon
                          aria-hidden="true"
                          className={cn(
                            "h-4 w-4 shrink-0",
                            st === "done" ? "text-muted-foreground" : "text-primary",
                          )}
                        />
                        <span className="min-w-0 truncate text-[15px] font-semibold text-foreground">
                          {prayer.name}
                          <span
                            lang="ar"
                            dir="rtl"
                            aria-hidden="true"
                            className="font-arabic ml-2 text-[17px] font-normal text-muted-foreground"
                          >
                            {prayer.arabic}
                          </span>
                        </span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-[15px] font-bold tabular-nums",
                          st === "next"
                            ? "text-primary"
                            : st === "done"
                              ? "text-muted-foreground"
                              : "text-foreground",
                        )}
                      >
                        {prayer.time}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        );
      })}
    </div>
  );
}

export function PrayerScheduleSection({
  profile,
  prayer: prayerData,
}: {
  profile: MosqueProfile | null;
  prayer: { today: DailyPrayerSchedule | null; week: DailyPrayerSchedule[] };
}) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const tz = profile?.timezone ?? DEFAULT_TZ;
  const zone = shortZone(tz);
  const weeklyPrayerSchedule = prayerData?.week ?? [];

  const todayISO = mounted ? jakartaTodayISO(now, tz) : null;
  const todayIndex = todayISO
    ? weeklyPrayerSchedule.findIndex((s) => s.date === todayISO)
    : -1;
  const todaySchedule =
    todayIndex !== -1 ? weeklyPrayerSchedule[todayIndex] : undefined;

  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  useEffect(() => {
    if (weeklyPrayerSchedule.length === 0) return;
    if (expandedDate !== null) return;
    if (todayIndex !== -1) setExpandedDate(weeklyPrayerSchedule[todayIndex].date);
    else setExpandedDate(weeklyPrayerSchedule[0].date);
  }, [weeklyPrayerSchedule, todayIndex, expandedDate]);

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
          <h2
            id="prayer-heading"
            className="font-display text-h2-fluid font-semibold text-foreground"
          >
            Jadwal Sholat Mingguan
          </h2>
          <p className="mt-2.5 max-w-[58ch] text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            Jadwal sholat belum tersedia. Pengurus cukup melengkapi lokasi masjid di
            halaman admin. Jadwal 7 hari dihitung otomatis setiap hari.
          </p>
        </div>
      </section>
    );
  }

  const activeHijri = todaySchedule?.hijriDate ?? weeklyPrayerSchedule[0]?.hijriDate;
  const activeTitle = todaySchedule
    ? formatDate(todaySchedule.date, { weekday: "long", day: "numeric", month: "long" })
    : formatDate(weeklyPrayerSchedule[0].date, { weekday: "long", day: "numeric", month: "long" });

  // Mobile: hari ini paling atas, lalu hari berikutnya, lalu yang lewat.
  const orderedWeek =
    todayIndex !== -1
      ? [
          ...weeklyPrayerSchedule.slice(todayIndex),
          ...weeklyPrayerSchedule.slice(0, todayIndex),
        ]
      : weeklyPrayerSchedule;

  return (
    <section
      id="jadwal-sholat"
      aria-labelledby="prayer-heading"
      className="scroll-mt-24 bg-background py-16 md:py-20"
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2
              id="prayer-heading"
              className="font-display text-h2-fluid font-semibold text-foreground"
            >
              Jadwal Sholat Mingguan
            </h2>
            <p className="mt-2.5 max-w-[58ch] text-pretty text-sm leading-relaxed text-muted-foreground md:text-[15px]">
              Lima waktu dalam satu papan — kolom yang disorot adalah hari ini,
              titik hijau menandai sholat berikutnya.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground tabular-nums">
            <Timer className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            {mounted && live ? (
              <span>
                Sekarang {live.nowLabel} {zone}
              </span>
            ) : (
              <span>
                Zona {zone}
              </span>
            )}
          </div>
        </div>

        <div className="mt-8">
          {/* Papan mihrab — satu kartu */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <GeometricTrim />
            {/* Kepala ramping */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-foreground">
                  {activeTitle}
                  <span className="ml-2 rounded-full bg-primary/[0.08] px-2 py-0.5 align-middle text-[11px] font-bold text-primary ring-1 ring-primary/20 ring-inset">
                    Hari ini
                  </span>
                </p>
                <p className="mt-0.5 text-[13px] font-medium text-primary">{activeHijri}</p>
              </div>
              <CountdownPill live={live} zone={zone} mounted={mounted} />
            </div>

            {/* Desktop: grid 5 x 7 */}
            <div className="hidden overflow-x-auto border-t border-border/60 md:block">
              <PrayerBoard
                week={weeklyPrayerSchedule}
                todayISO={todayISO}
                nowMin={nowMinLive}
                live={live}
                zone={zone}
              />
            </div>

            {/* Kaki papan — konteks lokasi */}
            <div className="hidden items-center justify-between gap-3 border-t border-border/60 px-5 py-3.5 text-[13px] text-muted-foreground sm:px-6 md:flex">
              <p className="flex min-w-0 items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">
                  {profile
                    ? `Mengikuti lokasi ${profile.name} (${zone}). Diperbarui setiap hari.`
                    : `Zona ${zone}. Diperbarui setiap hari.`}
                </span>
              </p>
              {todaySchedule && (
                <p className="flex shrink-0 items-center gap-1.5 tabular-nums">
                  <SunHorizon className="h-4 w-4 text-primary" aria-hidden="true" />
                  Terbit hari ini {todaySchedule.sunrise} {zone}
                </p>
              )}
            </div>
          </div>

          {/* Mobile: 7 kartu hari */}
          <div className="mt-3 md:hidden">
            <MobileDayList
              ordered={orderedWeek}
              todayISO={todayISO}
              nowMin={nowMinLive}
              live={live}
              zone={zone}
              expandedDate={expandedDate}
              onToggle={(d) => setExpandedDate((prev) => (prev === d ? d : d))}
            />
            <p className="mt-4 flex items-start gap-1.5 text-[13px] leading-relaxed text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {profile
                ? `Mengikuti lokasi ${profile.name} (${zone}). Diperbarui setiap hari.`
                : `Zona ${zone}. Diperbarui setiap hari.`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
