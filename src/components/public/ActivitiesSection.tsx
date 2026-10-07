"use client";

// Data dikirim sebagai prop dari `app/page.tsx` (Server Component) — tidak ada
// fetch di browser. Tetap Client Component karena @phosphor-icons/react memakai
// React Context internal.
import type { Activity } from "@/types";
import Link from "next/link";
import { formatDate, cn } from "@/lib/utils";
import {
  CaretRight,
  Clock,
  MapPin,
  User,
  CalendarBlank,
  ArrowRight,
} from "@phosphor-icons/react";

// Gambar hanya dari data admin (imageUrl). Tanpa gambar → blok netral,
// bukan gambar acak dari layanan luar.
function coverFor(a: Activity): string | null {
  if (a.imageUrl && (a.imageUrl.startsWith("http") || a.imageUrl.startsWith("/"))) return a.imageUrl;
  return null;
}

function dayNumber(dateStr: string): string {
  return String(new Date(dateStr).getDate()).padStart(2, "0");
}

function shortMonth(dateStr: string): string {
  return formatDate(dateStr, { month: "short" }).replace(".", "");
}

function weekdayShort(dateStr: string): string {
  return formatDate(dateStr, { weekday: "short" });
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function statusLabel(diff: number): string {
  if (diff < 0) return "Selesai";
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Besok";
  if (diff <= 7) return `Dalam ${diff} hari`;
  return "Akan datang";
}

function FeaturedCard({ activity }: { activity: Activity }) {
  const diff = daysUntil(activity.date);

  return (
    <article className="group grid grid-cols-1 overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_24px_50px_-28px_rgba(4,47,34,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_32px_64px_-28px_rgba(4,47,34,0.55)] lg:grid-cols-[1.08fr_1fr]">
      <div className="relative min-h-60 overflow-hidden bg-muted sm:min-h-72 lg:min-h-full">
        {coverFor(activity) ? (
          <img
            src={coverFor(activity)!}
            alt={activity.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/[0.12] via-muted to-muted"
          >
            <span className="font-display text-6xl font-bold text-primary/30">
              {activity.title.trim().charAt(0).toUpperCase() || "•"}
            </span>
          </div>
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 via-transparent to-transparent"
          aria-hidden="true"
        />
        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-emerald-950 tabular-nums shadow-sm backdrop-blur">
            <CalendarBlank className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(activity.date, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="absolute bottom-4 left-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-3 py-1.5 text-xs font-semibold text-emerald-100 ring-1 ring-white/20 ring-inset backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
            </span>
            Paling dekat • {statusLabel(diff)}
          </span>
        </div>
      </div>

      <div className="flex flex-col p-6 sm:p-7 md:p-8">
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">
          Sorotan kegiatan
        </p>
        <h3 className="font-display title-hover mt-2 text-balance text-2xl font-semibold leading-[1.2] text-foreground md:text-[1.75rem]">
          <Link
            href={`/kegiatan/${activity.id}`}
            aria-label={`Detail kegiatan: ${activity.title}`}
            className="transition-colors group-hover:text-primary"
          >
            {activity.title}
          </Link>
        </h3>
        <p className="mt-3 line-clamp-2 text-pretty text-sm leading-relaxed text-muted-foreground md:text-[15px]">
          {activity.description}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <p className="inline-flex items-center gap-2.5 rounded-xl bg-muted/70 px-3 py-2.5 text-[13px] font-medium text-foreground">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-card text-primary ring-1 ring-border">
              <Clock className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="tabular-nums">{activity.time} WIB</span>
          </p>
          <p className="inline-flex items-center gap-2.5 rounded-xl bg-muted/70 px-3 py-2.5 text-[13px] font-medium text-foreground">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-card text-primary ring-1 ring-border">
              <User className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="truncate">{activity.organizer}</span>
          </p>
          <p className="inline-flex items-center gap-2.5 rounded-xl bg-muted/70 px-3 py-2.5 text-[13px] font-medium text-foreground sm:col-span-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-card text-primary ring-1 ring-border">
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="truncate">{activity.location}</span>
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-border/60 pt-5">
          <Link
            href={`/kegiatan/${activity.id}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_10px_24px_-10px_var(--primary)] transition-all duration-200 hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
          >
            Lihat detail kegiatan
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <span className="text-xs text-muted-foreground tabular-nums">
            Oleh {activity.organizer}
          </span>
        </div>
      </div>
    </article>
  );
}

function AgendaRow({ activity }: { activity: Activity }) {
  const diff = daysUntil(activity.date);

  return (
    <article className="group">
      <Link
        href={`/kegiatan/${activity.id}`}
        aria-label={`Detail kegiatan: ${activity.title}`}
        className="flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-all duration-200 hover:-translate-y-px hover:border-primary/25 hover:bg-primary/[0.04] hover:shadow-[0_12px_28px_-18px_rgba(4,47,34,0.5)] focus-visible:border-primary/40 focus-visible:outline-none active:translate-y-0 active:scale-[0.99] sm:gap-5 sm:p-4"
      >
        <div className="flex h-[72px] w-[68px] shrink-0 flex-col items-center justify-center rounded-2xl bg-primary/[0.07] tabular-nums ring-1 ring-primary/15 ring-inset transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary sm:h-20 sm:w-20">
          <span className="text-[11px] font-bold tracking-widest uppercase opacity-70">
            {shortMonth(activity.date)}
          </span>
          <span className="text-2xl leading-none font-extrabold sm:text-[1.7rem]">
            {dayNumber(activity.date)}
          </span>
          <span className="mt-1 text-[11px] font-medium opacity-70">
            {weekdayShort(activity.date)}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-base">
              {activity.title}
            </h3>
            <span
              className={cn(
                "hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset sm:inline-flex",
                diff <= 1
                  ? "bg-primary/10 text-primary ring-primary/20"
                  : "bg-muted text-muted-foreground ring-border"
              )}
            >
              {statusLabel(diff)}
            </span>
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground sm:text-[13px]">
            <Clock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span className="tabular-nums">{activity.time} WIB</span>
            <span aria-hidden="true" className="text-border">•</span>
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">{activity.location}</span>
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground/80">
            Oleh {activity.organizer}
          </p>
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
          <CaretRight className="h-4 w-4 transition-transform group-hover:translate-x-px" aria-hidden="true" />
        </span>
      </Link>
    </article>
  );
}

export function ActivitiesSection({ activities }: { activities: Activity[] }) {
  const sorted = [...activities].sort((a, b) => +new Date(a.date) - +new Date(b.date));

  // Sorotan = kegiatan yang paling mendekati hari ini (hari ini / akan datang
  // yang paling awal). Kegiatan yang sudah lewat tidak boleh jadi sorotan.
  // Kalau semuanya sudah lewat, pakai yang terakhir lewat sebagai fallback.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const upcoming = sorted.filter((a) => {
    const d = new Date(a.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() >= todayStart.getTime();
  });
  const featured = upcoming[0] ?? sorted[sorted.length - 1];
  const rest = featured ? sorted.filter((a) => a.id !== featured.id) : [];

  return (
    <section
      id="kegiatan"
      aria-labelledby="activities-heading"
      className="relative scroll-mt-24 overflow-hidden bg-background py-14 md:py-20"
    >
      {/* Ambient — selaras dengan Ringkasan Keuangan */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/40 to-background" />
        <div className="absolute top-[-6rem] right-[-6rem] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 md:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-10">
          <div>
            <h2
              id="activities-heading"
              className="font-display text-h2-fluid font-semibold text-foreground"
            >
              Kegiatan Masjid
            </h2>
            <p className="mt-2 max-w-[58ch] text-pretty text-sm leading-relaxed text-muted-foreground md:text-[15px]">
              Pengajian, khataman, baksos, dan kajian khusus. Pilih agenda untuk
              melihat waktu, lokasi, dan penyelenggara.
            </p>
          </div>

          {sorted.length > 0 && (
            <Link
              href="/kegiatan"
              className="link-lively inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary"
            >
              Lihat semua kegiatan
              <CaretRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>

        {sorted.length === 0 ? (
          <p className="mx-auto max-w-xl rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            Belum ada kegiatan terjadwal. Agenda dari pengurus akan tampil di sini.
          </p>
        ) : (
          <>
            {featured && <FeaturedCard activity={featured} />}

            {rest.length > 0 && (
              <div className="mt-4 divide-y divide-border/60 rounded-[24px] border border-border bg-card px-2 py-2 shadow-[0_18px_40px_-28px_rgba(4,47,34,0.4)] sm:px-3 md:mt-5">
                {rest.map((a) => (
                  <AgendaRow key={a.id} activity={a} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
