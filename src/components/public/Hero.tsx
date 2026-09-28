"use client";

import { useState, useEffect, useCallback } from "react";
import { mosqueProfile, prayerSchedule } from "@/lib/mock-data";
import { formatDate, cn } from "@/lib/utils";

export function Hero() {
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
    <header className="relative overflow-hidden isolate flex min-h-svh flex-col py-14 md:py-16 transition-colors">
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
                idx === currentIdx ? "opacity-100" : "opacity-0",
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
          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 leading-[1.15]">
            {mosqueProfile.name}
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
            Amanah yang terjaga, laporan yang terbuka. Setiap pemasukan dan
            penyaluran dana tercatat tertib untuk kemaslahatan jamaah.
          </p>

          {/* Footer Metadata */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-muted-foreground border-t border-border/70 pt-6">
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
