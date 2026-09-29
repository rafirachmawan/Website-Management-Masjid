"use client";

import { useState, useEffect, useCallback } from "react";
import type { MosqueProfile, DailyPrayerSchedule } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import { Navbar } from "@/components/public/Navbar";
import {
  Sun,
  Moon,
  Star,
  Clock,
  SunHorizon,
  MapPin,
  ArrowRight,
} from "@phosphor-icons/react";

const PRAYER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Subuh: Sun,
  Dzuhur: Sun,
  Ashar: Sun,
  Maghrib: Moon,
  Isya: Star,
};

export function Hero({
  profile: mosqueProfile,
  prayer,
}: {
  profile: MosqueProfile | null;
  prayer: { today: DailyPrayerSchedule | null; week: DailyPrayerSchedule[] };
}) {
  // Background images from admin / mosque profile
  const images =
    mosqueProfile?.heroImages && mosqueProfile.heroImages.length > 0
      ? mosqueProfile.heroImages
      : mosqueProfile?.coverImageUrl
        ? [mosqueProfile.coverImageUrl]
        : [];

  const isSlider = images.length > 1;
  const [currentIdx, setCurrentIdx] = useState(0);

  const goToNext = useCallback(() => {
    if (!isSlider) return;
    setCurrentIdx((prev) => (prev + 1) % images.length);
  }, [isSlider, images.length]);

  // Auto slide automatically every 2 seconds if there are multiple images
  useEffect(() => {
    if (!isSlider) return;

    const timer = setInterval(() => {
      goToNext();
    }, 2000);

    return () => clearInterval(timer);
  }, [isSlider, goToNext]);

  // Profil/jadwal belum diisi admin — tampilkan sambutan netral, bukan skeleton.
  if (!mosqueProfile) {
    return (
      <header
        aria-label="Sambutan masjid"
        className="relative flex min-h-svh flex-col pb-14 pt-2 text-center md:pb-16 md:pt-3"
      >
        <Navbar />
        <div className="container mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-4">
          <p
            lang="ar"
            dir="rtl"
            aria-label="Bismillahirrahmanirrahim"
            className="font-arabic text-2xl text-primary md:text-3xl"
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <h1 className="font-display text-display-fluid mt-4 font-semibold text-foreground">
            Selamat Datang di Website Masjid
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Profil masjid, laporan keuangan, dan jadwal kegiatan akan tampil di
            sini setelah dilengkapi oleh pengurus.
          </p>
        </div>
      </header>
    );
  }

  const prayerSchedule = prayer.today;

  return (
    <header className="relative overflow-hidden isolate flex min-h-svh flex-col pb-14 pt-2 transition-colors md:pb-16 md:pt-3">
      {/* ─── Background Layer with Translucent Overlay ──────────────────────── */}
      {images.length > 0 && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          {images.map((img, idx) => (
            <div
              key={idx}
              aria-hidden="true"
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-in-out",
                idx === currentIdx ? "opacity-100" : "opacity-0",
              )}
            >
              {/* Latar pengisi: foto sama yang diburamkan agar tidak ada ruang kosong */}
              <img
                src={img}
                alt=""
                aria-hidden="true"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full scale-110 object-cover"
              />
              {/* Foto utama: tampil utuh tanpa dipotong-zoom */}
              <img
                src={img}
                alt=""
                aria-hidden="true"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-contain"
              />
            </div>
          ))}

          {/* Translucent backdrop overlay: semi-transparent gradient */}
          <div className="absolute inset-0 bg-background/55 dark:bg-background/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>
      )}

      {/* Decorative Grid SVG */}
      <div
        className="absolute inset-0 -z-10 opacity-5 pointer-events-none"
        aria-hidden="true"
      >
        <svg
          className="w-full h-full text-primary"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="hero-grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#hero-grid)" />
        </svg>
      </div>

      {/* Navigasi menyatu dengan hero — berbagi background yang sama */}
      <Navbar />
      {/* ─── Main Content: 2 kolom ala referensi ──────────────────────────── */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10 flex flex-1 flex-col justify-center">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* Kolom kiri: sapaan + nama + deskripsi + aksi + metadata */}
          <div className="max-w-2xl">
            <p
              lang="ar"
              dir="rtl"
              aria-label="Bismillahirrahmanirrahim"
              className="font-arabic text-left text-2xl text-primary md:text-3xl"
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="eyebrow-friendly mt-4 border border-primary/25 bg-primary/[0.06] text-primary">
              Selamat datang di rumah ibadah kita
            </p>
            <h1 className="font-display text-display-fluid mt-4 font-semibold text-foreground">
              {mosqueProfile.name}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl md:leading-loose">
              Amanah yang terjaga, laporan yang terbuka. Setiap pemasukan dan
              penyaluran dana tercatat tertib untuk kemaslahatan jamaah.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#keuangan"
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_16px_30px_-14px_var(--primary)] transition-all duration-200 hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
              >
                Lihat Transparansi Kas
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#jadwal-sholat"
                className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground transition-all duration-200 hover:border-primary/40 hover:text-primary active:scale-[0.98]"
              >
                <Clock className="h-4 w-4" aria-hidden="true" />
                Jadwal Sholat
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/70 pt-6 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {mosqueProfile.shortName}
                </span>
                {prayerSchedule && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {formatDate(prayerSchedule.date, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </>
                )}
              </div>
              {prayerSchedule && (
                <div className="flex items-center gap-1.5 font-medium text-primary">
                  <span aria-hidden="true">{prayerSchedule.hijriDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Kolom kanan: kartu jadwal hari ini (data asli, bukan mockup) */}
          <div id="jadwal-sholat" className="scroll-mt-24">
            {prayerSchedule ? (
              <div className="overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_28px_60px_-28px_rgba(4,47,34,0.4)]">
                <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 sm:px-6">
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold tracking-tight text-foreground">
                      Jadwal Sholat Hari Ini
                    </p>
                    <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                      {formatDate(prayerSchedule.date, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}{" "}
                      ·{" "}
                      <span className="font-medium text-primary">
                        {prayerSchedule.hijriDate}
                      </span>
                    </p>
                  </div>
                  <p className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/[0.08] px-2.5 py-1 text-xs font-bold text-primary ring-1 ring-primary/20 ring-inset">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    Hari ini
                  </p>
                </div>

                <ul className="mx-3 mb-3 mt-4 divide-y divide-border/60 rounded-2xl bg-muted/50 px-2 py-1 ring-1 ring-border/50 ring-inset sm:mx-4">
                  {prayerSchedule.prayers.map((p) => {
                    const Icon = PRAYER_ICONS[p.name] || Clock;
                    return (
                      <li
                        key={p.name}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5",
                          p.isCurrent && "bg-primary/[0.07]",
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <Icon
                            aria-hidden="true"
                            className={cn(
                              "h-4 w-4 shrink-0",
                              p.isNext ? "text-primary" : "text-primary/70",
                            )}
                          />
                          <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                            {p.name}
                            <span
                              lang="ar"
                              dir="rtl"
                              aria-hidden="true"
                              className="font-arabic ml-2 text-base font-normal text-muted-foreground"
                            >
                              {p.arabic}
                            </span>
                          </span>
                          {p.isNext && (
                            <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-primary">
                              <span className="h-1 w-1 rounded-full bg-primary" aria-hidden="true" />
                              Berikutnya
                            </span>
                          )}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-[15px] font-bold tabular-nums",
                            p.isNext ? "text-primary" : "text-foreground",
                          )}
                        >
                          {p.time}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-5 py-3.5 text-[13px] text-muted-foreground sm:px-6">
                  <p className="flex items-center gap-1.5 tabular-nums">
                    <SunHorizon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    Terbit {prayerSchedule.sunrise}
                  </p>
                  <p className="flex min-w-0 items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="truncate">{mosqueProfile.shortName}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-[20px] border border-border bg-card p-6 text-sm text-muted-foreground shadow-[0_28px_60px_-28px_rgba(4,47,34,0.4)] sm:p-7">
                Jadwal sholat hari ini belum tersedia. Pengurus dapat melengkapi
                lokasi masjid di halaman admin.
              </div>
            )}
          </div>
        </div>

        {/* ─── Dot Indicators (Only rendered if images > 1) ───────────────── */}
        {isSlider && (
          <div className="flex items-center justify-center gap-2 pt-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                  idx === currentIdx
                    ? "w-7 bg-primary shadow-xs"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60",
                )}
                aria-label={`Lihat banner ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
