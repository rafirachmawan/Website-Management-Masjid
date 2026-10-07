"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { MosqueProfile, DailyPrayerSchedule, PrayerTime, AppConfig } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import {
  Sun,
  Moon,
  Star,
  Clock,
  SunHorizon,
  MapPin,
  Phone,
  Bank,
  Copy,
  Check,
  Heart,
  CalendarBlank,
  ShieldCheck,
  Sparkle,
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
  config,
}: {
  profile: MosqueProfile | null;
  prayer: { today: DailyPrayerSchedule | null; week: DailyPrayerSchedule[] };
  config?: AppConfig | null;
}) {
  // Background images from admin / mosque profile
  const images = useMemo(() => {
    return mosqueProfile?.heroImages && mosqueProfile.heroImages.length > 0
      ? mosqueProfile.heroImages
      : mosqueProfile?.coverImageUrl
        ? [mosqueProfile.coverImageUrl]
        : [];
  }, [mosqueProfile]);

  const isSlider = images.length > 1;
  const [currentIdx, setCurrentIdx] = useState(0);

  // Quick Infaq Copy State
  const [copied, setCopied] = useState(false);

  // Countdown ke waktu sholat berikutnya
  const [timeCountdown, setTimeCountdown] = useState<string>("");
  const [currentNextPrayer, setCurrentNextPrayer] = useState<PrayerTime | null>(null);

  const goToNext = useCallback(() => {
    if (!isSlider) return;
    setCurrentIdx((prev) => (prev + 1) % images.length);
  }, [isSlider, images.length]);

  // Auto slide automatically every 5 seconds if there are multiple images
  useEffect(() => {
    if (!isSlider) return;
    const timer = setInterval(() => {
      goToNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [isSlider, goToNext]);

  // Dynamic live countdown calculation
  useEffect(() => {
    const prayers = prayer.today?.prayers;
    if (!prayers || prayers.length === 0) return;

    function calculateCountdown() {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Cari sholat berikutnya yang waktunya setelah jam sekarang
      let targetPrayer = prayers?.find((p) => {
        const [h, m] = p.time.split(":").map(Number);
        return h * 60 + m > currentMinutes;
      });

      let diffMinutes = 0;
      if (targetPrayer) {
        const [h, m] = targetPrayer.time.split(":").map(Number);
        diffMinutes = h * 60 + m - currentMinutes;
      } else {
        // Jika sudah lewat Isya, sholat berikutnya adalah Subuh besok
        targetPrayer = prayers?.[0];
        if (targetPrayer) {
          const [h, m] = targetPrayer.time.split(":").map(Number);
          diffMinutes = (24 * 60 - currentMinutes) + (h * 60 + m);
        }
      }

      setCurrentNextPrayer(targetPrayer || null);

      if (diffMinutes <= 0) {
        setTimeCountdown("Waktu Sholat Telah Tiba");
      } else if (diffMinutes < 60) {
        setTimeCountdown(`${diffMinutes} menit lagi`);
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        setTimeCountdown(mins > 0 ? `${hours} jam ${mins} mnt lagi` : `${hours} jam lagi`);
      }
    }

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 10000);
    return () => clearInterval(interval);
  }, [prayer.today]);

  const handleCopyAccount = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Profil belum diisi admin — sambutan ramah
  if (!mosqueProfile) {
    return (
      <header
        aria-label="Sambutan masjid"
        className="relative flex min-h-svh flex-col pb-14 pt-16 text-center md:pb-16 md:pt-[4.25rem]"
      >
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
  const heading = /masjid/i.test(rawName) ? rawName : `Masjid ${rawName}`;
  const nextPrayerToShow = currentNextPrayer || today?.prayers.find((p) => p.isNext) || today?.prayers[0];

  const hasDonationAccount =
    Boolean(config?.accountNumber && config.accountNumber.trim().length > 0);

  return (
    <header className="relative isolate flex min-h-[92vh] flex-col justify-center overflow-hidden pt-16 lg:pt-20">
        {/* ─── Foto masjid latar dengan kejernihan maksimal ─────────────── */}
        {images.length > 0 && (
          <div
            className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden"
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
                  "absolute inset-0 h-full w-full object-cover object-center transition-all duration-1000 ease-out",
                  idx === currentIdx
                    ? "scale-100 opacity-100 brightness-[1.02] contrast-[1.03]"
                    : "scale-105 opacity-0",
                )}
              />
            ))}
            {/* Overlay lembut: melindungi keterbacaan teks di kiri, membiarkan foto masjid di tengah & kanan tampil jernih dan tajam */}
            <div className="absolute inset-0 bg-linear-to-r from-background/95 via-background/60 to-transparent lg:from-background/90 lg:from-10% lg:via-background/45 lg:via-45% lg:to-transparent lg:to-75%" />
            <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-background/80 via-background/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-background to-transparent" />
          </div>
        )}

        <div className="container relative mx-auto flex w-full flex-1 flex-col justify-center px-4 py-10 md:px-6 md:py-14 lg:px-8 lg:py-16">
          <div className="grid w-full items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* ─── Kolom Kiri: Sambutan & Identitas Masjid (7 Kolom) ───────── */}
            <div className="flex flex-col items-start lg:col-span-7">
              {/* Kaligrafi Basmalah & Status Badge */}
              <div className="flex flex-wrap items-center gap-3">
                <span
                  lang="ar"
                  dir="rtl"
                  aria-label="Bismillahirrahmanirrahim"
                  className="font-arabic text-xl font-normal text-primary/85 md:text-2xl"
                >
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </span>
                <span className="hidden text-border sm:inline" aria-hidden="true">
                  |
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                  </span>
                  Terbuka untuk Jamaah 24 Jam
                </span>
              </div>

              {/* Judul Megah Masjid */}
              <h1 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.12]">
                {heading}
              </h1>

              {/* Lokasi Alamat */}
              <p
                title={mosqueProfile.address}
                className="mt-4 inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-full border border-border/80 bg-background/80 px-3.5 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm sm:text-sm"
              >
                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">{mosqueProfile.address}</span>
              </p>

              {/* Deskripsi Masjid */}
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed">
                {mosqueProfile.description?.trim() ||
                  "Amanah yang terjaga, laporan yang terbuka. Setiap pemasukan dan penyaluran dana tercatat tertib untuk kemaslahatan jamaah."}
              </p>

              {/* Dual Action CTA Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <a
                  href="/keuangan#donasi"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0 active:scale-[0.99]"
                >
                  <Heart className="h-4 w-4" weight="fill" aria-hidden="true" />
                  Salurkan Infaq
                </a>

                <a
                  href="#informasi"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-card/80 px-6 text-sm font-semibold text-foreground backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent active:translate-y-0 active:scale-[0.99]"
                >
                  <CalendarBlank className="h-4 w-4 text-primary" aria-hidden="true" />
                  Agenda & Informasi
                </a>
              </div>

              {/* Info Tambahan Bawah */}
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground sm:text-sm">
                {mosqueProfile.phone && (
                  <a
                    href={`tel:${mosqueProfile.phone}`}
                    className="flex items-center gap-1.5 transition-colors hover:text-primary"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{mosqueProfile.phone}</span>
                  </a>
                )}
                {mosqueProfile.establishedYear ? (
                  <span className="flex items-center gap-1.5">
                    <Sparkle className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    Berdiri sejak {mosqueProfile.establishedYear}
                  </span>
                ) : null}
                {today && (
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <CalendarBlank className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {today.hijriDate}
                  </span>
                )}
              </div>
            </div>

            {/* ─── Kolom Kanan: Interactive Mosque Hub Card (5 Kolom) ──────── */}
            <div id="jadwal-sholat" className="scroll-mt-24 lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/90 p-5 shadow-2xl backdrop-blur-xl sm:p-7 dark:bg-card/80">
                {/* Aksen kilau halus di pojok kanan atas kartu */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/15 blur-2xl"
                />

                {/* Header Kartu: Highlight Sholat Berikutnya */}
                <div className="relative border-b border-border/60 pb-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                      Waktu Sholat Berikutnya
                    </span>
                    {timeCountdown && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {timeCountdown}
                      </span>
                    )}
                  </div>

                  {nextPrayerToShow && (
                    <div className="mt-3.5 flex items-baseline justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                            {nextPrayerToShow.name}
                          </h3>
                          <span
                            lang="ar"
                            dir="rtl"
                            className="font-arabic text-lg text-muted-foreground"
                          >
                            {nextPrayerToShow.arabic}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(today?.date || new Date().toISOString(), {
                            weekday: "long",
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-extrabold tabular-nums tracking-tight text-primary sm:text-4xl">
                          {nextPrayerToShow.time}
                        </span>
                        <span className="ml-1 text-xs font-medium text-muted-foreground">
                          WIB
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5 Waktu Sholat Hari Ini (Compact Grid) */}
                {today && (
                  <div className="relative py-4">
                    <div className="grid grid-cols-5 gap-1.5">
                      {today.prayers.map((p) => {
                        const isCurrentActive =
                          nextPrayerToShow?.name.toLowerCase() === p.name.toLowerCase();
                        const Icon = PRAYER_ICONS[p.name] || Clock;

                        return (
                          <div
                            key={p.name}
                            className={cn(
                              "flex flex-col items-center rounded-xl p-2 text-center transition-all",
                              isCurrentActive
                                ? "border border-primary/40 bg-primary/15 ring-1 ring-primary/30 shadow-xs"
                                : "bg-muted/40 hover:bg-muted/70",
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-3.5 w-3.5",
                                isCurrentActive ? "text-primary" : "text-muted-foreground",
                              )}
                              aria-hidden="true"
                            />
                            <span
                              className={cn(
                                "mt-1 text-[11px] font-semibold leading-none",
                                isCurrentActive ? "text-foreground" : "text-muted-foreground",
                              )}
                            >
                              {p.name}
                            </span>
                            <span
                              className={cn(
                                "mt-1 text-xs font-bold tabular-nums",
                                isCurrentActive ? "text-primary" : "text-foreground",
                              )}
                            >
                              {p.time}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quick Infaq Box (Rekening Resmi DKM) */}
                {hasDonationAccount ? (
                  <div className="relative mt-2 rounded-2xl border border-primary/20 bg-primary/[0.04] p-3.5 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Bank className="h-4 w-4" aria-hidden="true" />
                        <span>Rekening Donasi & Infaq</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        DKM Resmi
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">
                          {config?.bankName} · {config?.accountHolder}
                        </div>
                        <div className="mt-0.5 text-sm font-bold tabular-nums tracking-wide text-foreground sm:text-base">
                          {config?.accountNumber}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyAccount(config?.accountNumber || "")}
                        className={cn(
                          "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                          copied
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-card text-foreground hover:bg-muted active:scale-95",
                        )}
                        aria-label="Salin nomor rekening donasi"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            Tersalin!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                            Salin
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative mt-2 rounded-2xl border border-border/60 bg-muted/30 p-3 text-center text-xs text-muted-foreground">
                    Salurkan infaq dan sedekah melalui kotak amal masjid atau hubungi pengurus.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigasi Titik Carousel (jika foto > 1) */}
          {isSlider && (
            <div className="mt-8 flex items-center justify-center gap-2 lg:justify-start">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={cn(
                    "h-1.5 cursor-pointer rounded-full transition-all duration-300",
                    idx === currentIdx
                      ? "w-8 bg-primary shadow-xs"
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

