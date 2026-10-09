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
  // Deskripsi dipadatkan: 2 baris + "Baca selengkapnya" (data tetap utuh)
  const [descExpanded, setDescExpanded] = useState(false);

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

    // Parser "HH:MM" yang aman — kembalikan null bila format rusak
    function parseMinutes(t: string): number | null {
      const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
      if (!m) return null;
      const h = Number(m[1]);
      const min = Number(m[2]);
      if (h < 0 || h > 23 || min < 0 || min > 59) return null;
      return h * 60 + min;
    }

    function calculateCountdown() {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Cari sholat berikutnya yang waktunya setelah jam sekarang
      let targetPrayer = prayers?.find((p) => {
        const mins = parseMinutes(p.time);
        return mins !== null && mins > currentMinutes;
      });

      let diffMinutes = 0;
      if (targetPrayer) {
        diffMinutes = (parseMinutes(targetPrayer.time) ?? currentMinutes) - currentMinutes;
      } else {
        // Jika sudah lewat Isya, sholat berikutnya adalah Subuh besok
        targetPrayer = prayers?.find((p) => parseMinutes(p.time) !== null) ?? prayers?.[0];
        if (targetPrayer) {
          const mins = parseMinutes(targetPrayer.time);
          diffMinutes = mins !== null ? (24 * 60 - currentMinutes) + mins : 0;
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
  // Normalisasi "Ar - Rahman" -> "Ar-Rahman" agar judul terlihat rapi.
  const heading = (/masjid/i.test(rawName) ? rawName : `Masjid ${rawName}`)
    .replace(/\s+-\s+/g, "-")
    .replace(/\s+/g, " ");
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
            <div className="flex max-w-2xl flex-col items-start lg:col-span-7">
              {/* Satu eyebrow: basmalah menyatu dengan status */}
              <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span
                  lang="ar"
                  dir="rtl"
                  aria-label="Bismillahirrahmanirrahim"
                  className="font-arabic text-xl font-normal text-primary/85 md:text-2xl"
                >
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-background px-3 py-1 text-xs font-semibold text-primary">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                  </span>
                  Terbuka untuk Jamaah 24 Jam
                </span>
              </p>

              {/* Judul Megah Masjid */}
              <h1 className="font-display mt-4 text-balance text-4xl font-bold leading-[1.06] tracking-[-0.02em] text-foreground sm:text-5xl lg:text-[3.4rem]">
                {heading}
              </h1>

              {/* Lokasi Alamat — wrap di HP kecil, pill di layar besar */}
              <p
                title={mosqueProfile.address}
                className="mt-4 inline-flex max-w-full items-start gap-1.5 rounded-2xl border border-border/80 bg-background/80 px-3.5 py-2 text-left text-xs font-medium text-foreground backdrop-blur-sm sm:items-center sm:rounded-full sm:py-1.5 sm:text-sm"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:mt-0" aria-hidden="true" />
                <span className="min-w-0 break-words">{mosqueProfile.address}</span>
              </p>

              {/* Deskripsi Masjid — dipadatkan 2 baris + selengkapnya */}
              <p
                className={cn(
                  "mt-4 max-w-xl text-pretty text-[15px] leading-[1.75] text-muted-foreground sm:text-base",
                  !descExpanded && "line-clamp-2",
                )}
              >
                {mosqueProfile.description?.trim() ||
                  "Amanah yang terjaga, laporan yang terbuka. Setiap pemasukan dan penyaluran dana tercatat tertib untuk kemaslahatan jamaah."}
              </p>
              {mosqueProfile.description && mosqueProfile.description.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  aria-expanded={descExpanded}
                  className="mt-1.5 cursor-pointer text-xs font-semibold text-primary hover:underline"
                >
                  {descExpanded ? "Tutup" : "Baca selengkapnya"}
                </button>
              )}

              {/* Dual Action CTA Buttons — susun vertikal penuh di HP kecil */}
              <div className="mt-7 flex w-full flex-col items-stretch gap-2.5 min-[420px]:w-auto min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-3">
                <a
                  href="/keuangan#donasi"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0 active:scale-[0.99] min-[420px]:w-auto"
                >
                  <Heart className="h-4 w-4" weight="fill" aria-hidden="true" />
                  Salurkan Infaq
                </a>

                <a
                  href="#informasi"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-card/80 px-6 text-sm font-semibold text-foreground backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent active:translate-y-0 active:scale-[0.99] min-[420px]:w-auto"
                >
                  <CalendarBlank className="h-4 w-4 text-primary" aria-hidden="true" />
                  Agenda & Informasi
                </a>
              </div>

              {/* Info Tambahan Bawah — ringkas (tanggal Hijriah menyatu di kartu sholat) */}
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                {mosqueProfile.phone && (
                  <a
                    href={`tel:${mosqueProfile.phone.replace(/[^+\d]/g, "")}`}
                    className="flex items-center gap-1.5 transition-colors hover:text-primary"
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                    <span>{mosqueProfile.phone}</span>
                  </a>
                )}
                {mosqueProfile.establishedYear ? (
                  <span className="flex items-center gap-1.5">
                    <Sparkle className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                    Berdiri sejak {mosqueProfile.establishedYear}
                  </span>
                ) : null}
              </div>
            </div>

            {/* ─── Kolom Kanan: Interactive Mosque Hub Card (5 Kolom) ──────── */}
            <div id="jadwal-sholat" className="scroll-mt-24 lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/60 p-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] backdrop-blur-lg backdrop-saturate-150 sm:p-7 dark:border-white/10 dark:bg-zinc-900/55 dark:backdrop-blur-xl">
                {/* Lapisan kaca: sheen halus + aksen kilau di pojok kanan atas */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-white/10 to-transparent dark:from-white/10 dark:via-transparent dark:to-transparent"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-2xl"
                />

                {/* Header Kartu: Highlight Sholat Berikutnya */}
                <div className="relative border-b border-white/40 pb-5 dark:border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      Waktu Sholat Berikutnya
                    </span>
                    {timeCountdown && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {timeCountdown}
                      </span>
                    )}
                  </div>

                  {nextPrayerToShow && (
                    <div className="mt-3.5 flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
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
                          {today?.hijriDate ? ` • ${today.hijriDate}` : null}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
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
                    <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                      {today.prayers.map((p) => {
                        const isCurrentActive =
                          nextPrayerToShow?.name.toLowerCase() === p.name.toLowerCase();
                        const Icon = PRAYER_ICONS[p.name] || Clock;

                        return (
                          <div
                            key={p.name}
                            className={cn(
                              "flex min-w-0 flex-col items-center rounded-xl border p-1.5 text-center backdrop-blur-sm transition-all sm:p-2",
                              isCurrentActive
                                ? "border-primary/40 bg-primary/15 shadow-xs ring-1 ring-primary/30"
                                : "border-white/30 bg-white/40 hover:bg-white/65 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
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
                                "mt-1 text-[10px] font-semibold leading-none sm:text-[11px]",
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

              </div>
            </div>
          </div>

          {/* Strip Rekening Donasi — di luar kartu sholat agar satu kartu satu pesan */}
          {hasDonationAccount ? (
            <div className="mt-4 flex w-full flex-col gap-2 rounded-2xl border border-white/40 bg-white/55 px-4 py-3 shadow-lg backdrop-blur-lg sm:flex-row sm:items-center sm:gap-3 dark:border-white/10 dark:bg-zinc-900/55">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Bank className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    Rekening Donasi & Infaq
                    <span className="inline-flex items-center gap-0.5 font-medium text-muted-foreground">
                      <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                      DKM Resmi
                    </span>
                  </p>
                  <p
                    title={config?.accountHolder ? `a.n. ${config.accountHolder}` : undefined}
                    className="truncate text-sm font-bold tabular-nums text-foreground"
                  >
                    {config?.bankName} · {config?.accountNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyAccount(config?.accountNumber || "")}
                className={cn(
                  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 active:scale-95",
                  copied
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-foreground hover:bg-accent",
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
          ) : null}

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

