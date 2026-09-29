"use client";

import { useState, useEffect, useCallback } from "react";
import type { MosqueProfile, DailyPrayerSchedule } from "@/types";
import { formatDate, cn } from "@/lib/utils";

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
        className="relative flex min-h-svh flex-col items-center justify-center py-14 text-center md:py-16"
      >
        <div className="container mx-auto max-w-2xl px-4">
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
    <header className="relative overflow-hidden isolate flex min-h-svh flex-col py-14 md:py-16 transition-colors">
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

      {/* ─── Main Content ───────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10 flex flex-1 flex-col">
        <div className="max-w-4xl mx-auto w-full flex flex-1 flex-col justify-center text-center -translate-y-5 md:-translate-y-8">
          {/* Sapaan Arab — hangat & khas masjid */}
          <p
            lang="ar"
            dir="rtl"
            aria-label="Bismillahirrahmanirrahim"
            className="font-arabic text-2xl text-primary md:text-3xl"
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p className="eyebrow-friendly mx-auto mt-4 border border-primary/25 bg-primary/[0.06] text-primary">
            Selamat datang di rumah ibadah kita
          </p>
          {/* Heading */}
          <h1 className="font-display text-display-fluid mt-4 font-semibold text-foreground mb-6">
            {mosqueProfile.name}
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed md:leading-loose font-normal">
            Amanah yang terjaga, laporan yang terbuka. Setiap pemasukan dan
            penyaluran dana tercatat tertib untuk kemaslahatan jamaah.
          </p>

          {/* Footer Metadata */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-muted-foreground border-t border-border/70 pt-6">
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

        {/* ─── Dot Indicators (Only rendered if images > 1) ───────────────── */}
        {isSlider && (
          <div className="flex items-center justify-center gap-2 pt-6">
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
