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
  Phone,
  ArrowRight,
} from "@phosphor-icons/react";

const PRAYER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Subuh: Sun,
  Dzuhur: Sun,
  Ashar: Sun,
  Maghrib: Moon,
  Isya: Star,
};

/**
 * Pita jadwal sholat di bawah hero — lima waktu dalam satu baris.
 * Dipisah dari hero supaya kolom kanan hero bisa dipakai foto masjid
 * penuh ke tepi layar, dan tautan Navbar/Footer ke #jadwal-sholat tetap hidup.
 */
function PrayerTimesBand({
  today,
  shortName,
}: {
  today: DailyPrayerSchedule | null;
  shortName: string;
}) {
  return (
    <section
      id="jadwal-sholat"
      aria-label="Jadwal sholat hari ini"
      className="scroll-mt-20 border-t border-border/60 bg-muted/40"
    >
      <div className="container mx-auto px-4 py-12 md:px-6 md:py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-12">
          <div>
            <p className="eyebrow-friendly border border-primary/25 bg-primary/[0.07] text-primary">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Waktu Sholat
            </p>
            <h2 className="font-display text-h2-fluid mt-4 font-semibold text-foreground">
              Jadwal Sholat Hari Ini
            </h2>
            {today ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {formatDate(today.date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                <span aria-hidden="true"> · </span>
                <span className="font-medium text-primary">{today.hijriDate}</span>
              </p>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Jadwal sholat hari ini belum tersedia. Pengurus dapat melengkapi
                lokasi masjid di halaman admin.
              </p>
            )}
          </div>

          {today && (
            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {today.prayers.map((p) => {
                const Icon = PRAYER_ICONS[p.name] || Clock;
                return (
                  <li
                    key={p.name}
                    className={cn(
                      "rounded-2xl border p-3.5 transition-colors",
                      p.isNext
                        ? "border-primary/45 bg-primary/[0.07]"
                        : "border-border/70 bg-card",
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          p.isNext ? "text-primary" : "text-primary/60",
                        )}
                        aria-hidden="true"
                      />
                      <span className="truncate text-[13px] font-semibold text-foreground">
                        {p.name}
                      </span>
                    </span>
                    <span className="mt-2 block text-xl font-bold tabular-nums text-foreground">
                      {p.time}
                    </span>
                    <span
                      lang="ar"
                      dir="rtl"
                      aria-hidden="true"
                      className="font-arabic block text-base text-muted-foreground"
                    >
                      {p.arabic}
                    </span>
                    {p.isNext && (
                      <span className="mt-1.5 block text-[11px] font-bold tracking-wide text-primary">
                        Berikutnya
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {today && (
          <p className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border/60 pt-4 text-[13px] text-muted-foreground">
            <span className="flex items-center gap-1.5 tabular-nums">
              <SunHorizon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Terbit {today.sunrise}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {shortName}
            </span>
          </p>
        )}
      </div>
    </section>
  );
}

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

  const today = prayer.today;
  const rawName = mosqueProfile.name.trim();
  // Cegah dobel kata "Masjid" bila pengurus sudah menuliskannya di profil.
  const heading = /masjid/i.test(rawName) ? rawName : `Masjid ${rawName}`;

  return (
    <>
      <header className="relative isolate flex min-h-svh flex-col overflow-hidden">
        {/* ─── Foto masjid ────────────────────────────────────────────────
            Layar lebar: foto naik ke tepi kanan dan terpotong di bawah,
            teks kiri berdiri di atas warna latar yang bersih.
            Layar kecil: foto turun ke belakang layar jadi backdrop lembut. */}
        {images.length > 0 && (
          <div
            className="pointer-events-none absolute inset-0 -z-10 select-none"
            aria-hidden="true"
          >
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt=""
                aria-hidden="true"
                referrerPolicy="no-referrer"
                className={cn(
                  "absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-in-out",
                  idx === currentIdx ? "opacity-100" : "opacity-0",
                )}
              />
            ))}
            {/* Kabut warna latar: teks kiri selalu terbaca, foto menyatu
                halus ke background tanpa garis potong yang keras. */}
            <div className="absolute inset-0 bg-background/60 lg:bg-gradient-to-r lg:from-background lg:from-10% lg:via-background/40 lg:via-50% lg:to-transparent lg:to-80%" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}

        <Navbar />

        <div className="container relative mx-auto flex w-full flex-1 flex-col justify-center px-4 pb-12 pt-10 md:px-6 md:pb-16 lg:px-8 lg:pb-20 lg:pt-24">
          <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="max-w-2xl">
              <p className="eyebrow-friendly max-w-full items-start rounded-2xl border border-primary/25 bg-primary/[0.07] text-primary lg:items-center lg:rounded-full">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 lg:mt-0"
                  aria-hidden="true"
                />
                <span>{mosqueProfile.address}</span>
              </p>

              <h1 className="font-display text-display-fluid mt-6 font-semibold text-foreground">
                {heading}
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg md:leading-loose">
                {mosqueProfile.description?.trim() ||
                  "Amanah yang terjaga, laporan yang terbuka. Setiap pemasukan dan penyaluran dana tercatat tertib untuk kemaslahatan jamaah."}
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

              <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-muted-foreground">
                {mosqueProfile.phone && (
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {mosqueProfile.phone}
                  </span>
                )}
                {mosqueProfile.establishedYear ? (
                  <span>Berdiri sejak {mosqueProfile.establishedYear}</span>
                ) : null}
                {today && (
                  <span className="font-medium text-primary">
                    {today.hijriDate}
                  </span>
                )}
              </div>
            </div>

            {/* Kolom kanan sengaja kosong: ruang foto bleed ke tepi layar. */}
            <div aria-hidden="true" className="hidden lg:block" />
          </div>

          {isSlider && (
            <div className="flex items-center justify-center gap-2 pt-12 lg:justify-end">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={cn(
                    "h-1.5 cursor-pointer rounded-full transition-all duration-300",
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

      <PrayerTimesBand today={today} shortName={mosqueProfile.shortName} />
    </>
  );
}
