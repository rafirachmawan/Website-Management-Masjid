"use client";

import { useState, useEffect, useCallback } from "react";
import { mosqueProfile, prayerSchedule } from "@/lib/mock-data";
import { formatDate, cn } from "@/lib/utils";

export function Hero() {
  const currentPrayer = prayerSchedule.prayers.find((p) => p.isCurrent);
  const nextPrayer = prayerSchedule.prayers.find((p) => p.isNext);

  // Background images from admin / mosque profile
  const images =
    mosqueProfile.heroImages && mosqueProfile.heroImages.length > 0
      ? mosqueProfile.heroImages
      : mosqueProfile.coverImageUrl
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

  return (
    <header className="relative overflow-hidden isolate py-16 md:py-24 lg:py-28 transition-colors">
      {/* ─── Background Layer with Translucent Overlay ──────────────────────── */}
      {images.length > 0 && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out",
                idx === currentIdx ? "opacity-100" : "opacity-0"
              )}
            />
          ))}

          {/* Translucent backdrop overlay: subtle blur + semi-transparent gradient */}
          <div className="absolute inset-0 bg-background/55 dark:bg-background/70 backdrop-blur-[1.5px]" />
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
            <pattern id="hero-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#hero-grid)" />
        </svg>
      </div>

      {/* ─── Main Content ───────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-semibold mb-6 border border-primary/20 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            Transparansi Keuangan Masjid
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-[1.15]">
            {mosqueProfile.name}
            <br />
            <span className="text-primary font-medium">
              Keuangan Transparan untuk Jamaah
            </span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Setiap rupiah yang masuk dan keluar dicatat dengan jelas. Laporan
            keuangan terbuka untuk umum, demi kepercayaan dan kebersamaan jamaah.
          </p>

          {/* Highlight Cards */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card/90 backdrop-blur-md border border-border shadow-sm hover:border-primary/40 transition-colors">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                Saldo Saat Ini
              </span>
              <span
                className="text-xl sm:text-2xl font-bold text-foreground tabular-nums"
                id="current-balance"
              >
                Rp 87.450.000
              </span>
            </div>

            {currentPrayer && (
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-primary/10 backdrop-blur-md border border-primary/30 shadow-sm">
                <span className="text-xs sm:text-sm font-medium text-primary">
                  Sedang Waktu
                </span>
                <span className="text-lg sm:text-xl font-bold text-primary tabular-nums">
                  {currentPrayer.name} {currentPrayer.time}
                </span>
                <span
                  className="text-xs sm:text-sm font-semibold text-primary/70"
                  aria-hidden="true"
                >
                  {currentPrayer.arabic}
                </span>
              </div>
            )}

            {nextPrayer && (
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-card/90 backdrop-blur-md border border-border shadow-sm">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Berikutnya
                </span>
                <span className="text-lg sm:text-xl font-medium text-foreground tabular-nums">
                  {nextPrayer.name} {nextPrayer.time}
                </span>
                <span
                  className="text-xs sm:text-sm text-muted-foreground"
                  aria-hidden="true"
                >
                  {nextPrayer.arabic}
                </span>
              </div>
            )}
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center justify-center gap-6 text-xs sm:text-sm text-muted-foreground border-t border-border/70 pt-6">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {mosqueProfile.shortName}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {formatDate(prayerSchedule.date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-primary">
              <span aria-hidden="true">{prayerSchedule.hijriDate}</span>
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
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  )}
                  aria-label={`Lihat banner ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}