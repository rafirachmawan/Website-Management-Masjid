"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import type { MosqueProfile, DailyPrayerSchedule, PrayerTime, AppConfig } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import {
  Sun,
  Moon,
  Star,
  Clock,
  MapPin,
  Phone,
  Bank,
  Copy,
  Check,
  Heart,
  CalendarBlank,
  ShieldCheck,
  Sparkle,
  CaretLeft,
  CaretRight,
  Pause,
  Play,
} from "@phosphor-icons/react";

const PRAYER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Subuh: Sun,
  Dzuhur: Sun,
  Ashar: Sun,
  Maghrib: Moon,
  Isya: Star,
};

const DEFAULT_TZ = "Asia/Jakarta";

// Singkatan zona — hindari "WIB" hardcode di luar Jawa.
function shortZone(tz: string): string {
  if (tz === "Asia/Jakarta") return "WIB";
  if (tz === "Asia/Makassar") return "WITA";
  if (tz === "Asia/Jayapura") return "WIT";
  return tz;
}

// Parser "HH:MM" yang aman — null bila format rusak.
function parseMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

// Jam:menit SEKARANG dalam zona masjid (bukan zona browser).
function mosqueNowMinutes(now: Date, tz: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const h = Number(parts.find((p) => p.type === "hour")?.value ?? "NaN");
    const m = Number(parts.find((p) => p.type === "minute")?.value ?? "NaN");
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return (h % 24) * 60 + m;
  } catch {
    return null;
  }
}

// Label tanggal "Kamis, 15 Okt" dalam zona masjid.
// today.date = "YYYY-MM-DD" (tanpa jam) → jangkar tengah hari agar tak geser hari.
function formatMosqueDate(dateISO: string, tz: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: tz,
      weekday: "long",
      day: "numeric",
      month: "short",
    }).format(new Date(`${dateISO}T12:00:00`));
  } catch {
    return formatDate(dateISO, { weekday: "long", day: "numeric", month: "short" });
  }
}

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
    const raw =
      mosqueProfile?.heroImages && mosqueProfile.heroImages.length > 0
        ? mosqueProfile.heroImages
        : mosqueProfile?.coverImageUrl
          ? [mosqueProfile.coverImageUrl]
          : [];
    return raw.map((s) => s.trim()).filter((s) => s.length > 0);
  }, [mosqueProfile]);

  const isSlider = images.length > 1;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [autoPaused, setAutoPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);

  // Quick Infaq Copy State
  const [copied, setCopied] = useState(false);
  // Deskripsi dipadatkan: 2 baris + "Baca selengkapnya" (data tetap utuh)
  const [descExpanded, setDescExpanded] = useState(false);

  // Countdown ke waktu sholat berikutnya
  const [timeCountdown, setTimeCountdown] = useState<string>("");
  const [currentNextPrayer, setCurrentNextPrayer] = useState<PrayerTime | null>(null);

  const tz = mosqueProfile?.timezone?.trim() || DEFAULT_TZ;
  const zone = shortZone(tz);

  const goToNext = useCallback(() => {
    if (!isSlider) return;
    setCurrentIdx((prev) => (prev + 1) % images.length);
  }, [isSlider, images.length]);

  const goToPrev = useCallback(() => {
    if (!isSlider) return;
    setCurrentIdx((prev) => (prev - 1 + images.length) % images.length);
  }, [isSlider, images.length]);

  // Auto slide tiap 5 detik — hormati jeda manual + hover + tab tersembunyi.
  useEffect(() => {
    if (!isSlider || autoPaused || hoverPaused) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      goToNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [isSlider, autoPaused, hoverPaused, goToNext]);

  // Clamp indeks bila daftar gambar menyusut (mis. admin hapus foto).
  useEffect(() => {
    setCurrentIdx((prev) => (prev >= images.length ? 0 : prev));
  }, [images.length]);

  // Countdown memakai jam zona masjid agar benar untuk jamaah di luar WIB.
  useEffect(() => {
    const prayers = prayer.today?.prayers;
    if (!prayers || prayers.length === 0) {
      setCurrentNextPrayer(null);
      setTimeCountdown("");
      return;
    }

    function calculateCountdown() {
      const nowMin = mosqueNowMinutes(new Date(), tz);
      if (nowMin === null) return;

      // Cari sholat berikutnya yang waktunya setelah jam sekarang (zona masjid)
      let targetPrayer = prayers?.find((p) => {
        const mins = parseMinutes(p.time);
        return mins !== null && mins > nowMin;
      });

      let diffMinutes = 0;
      if (targetPrayer) {
        diffMinutes = (parseMinutes(targetPrayer.time) ?? nowMin) - nowMin;
      } else {
        // Jika sudah lewat Isya, sholat berikutnya adalah Subuh besok
        targetPrayer = prayers?.find((p) => parseMinutes(p.time) !== null) ?? prayers?.[0];
        if (targetPrayer) {
          const mins = parseMinutes(targetPrayer.time);
          diffMinutes = mins !== null ? 24 * 60 - nowMin + mins : 0;
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
    const interval = setInterval(calculateCountdown, 15000);
    return () => clearInterval(interval);
  }, [prayer.today, tz]);

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
        className="relative flex min-h-[70svh] flex-col pb-14 pt-16 text-center md:pb-16 md:pt-[4.25rem]"
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

  const effectivePaused = autoPaused || hoverPaused;

  return (
    <header className="relative isolate flex min-h-[78svh] flex-col justify-center overflow-hidden lg:min-h-[84svh]">
        {/* ─── Foto masjid latar ─────────────────────────────────────── */}
        {images.length > 0 && (
          <div
            className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden"
            aria-hidden="true"
          >
            <div role="region" aria-roledescription="carousel" aria-label="Foto masjid">
              {images.map((img, idx) => {
                const isRemote = /^https?:\/\//i.test(img);
                const active = idx === currentIdx;
                return (
                  <Image
                    key={`${img}-${idx}`}
                    src={img}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="100vw"
                    // Remote tanpa remotePatterns → bypass optimasi agar tak 400.
                    unoptimized={isRemote}
                    {...(idx === 0 ? { preload: true } : { loading: "lazy" as const })}
                    referrerPolicy="no-referrer"
                    aria-roledescription="slide"
                    className={cn(
                      "object-cover object-center transition-all duration-1000 ease-out",
                      active
                        ? "scale-100 opacity-100"
                        : "scale-105 opacity-0",
                    )}
                  />
                );
              })}
            </div>
            {/* Scrim kiri diperkuat agar teks lolos kontras di foto cerah */}
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/10 lg:from-background lg:via-background/55 lg:via-45% lg:to-transparent lg:to-75%" />
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background/80 via-background/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        )}

        <div className="container relative mx-auto flex w-full flex-1 flex-col justify-center px-4 py-8 md:px-6 md:py-12 lg:px-8 lg:py-14">
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
                    {today && timeCountdown && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {timeCountdown}
                      </span>
                    )}
                  </div>

                  {nextPrayerToShow ? (
                    <div className="mt-3.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
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
                          {today ? formatMosqueDate(today.date, tz) : null}
                          {today?.hijriDate ? ` • ${today.hijriDate}` : null}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-3xl font-extrabold tabular-nums tracking-tight text-primary sm:text-4xl">
                          {nextPrayerToShow.time}
                        </span>
                        <span className="ml-1 text-xs font-medium text-muted-foreground">
                          {zone}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3.5 text-sm text-muted-foreground">
                      Jadwal sholat belum tersedia. Pengurus cukup melengkapi lokasi masjid di halaman admin.
                    </p>
                  )}
                </div>

                {/* 5 Waktu Sholat Hari Ini (Compact Grid) */}
                {today ? (
                  <div className="relative py-4">
                    <div className="grid grid-cols-5 gap-1 min-[380px]:gap-1.5 sm:gap-1.5">
                      {today.prayers.map((p) => {
                        const isCurrentActive =
                          nextPrayerToShow?.name.toLowerCase() === p.name.toLowerCase();
                        const Icon = PRAYER_ICONS[p.name] || Clock;

                        return (
                          <div
                            key={p.name}
                            aria-current={isCurrentActive ? "true" : undefined}
                            title={`${p.name} pukul ${p.time} ${zone}${isCurrentActive ? " (berikutnya)" : ""}`}
                            className={cn(
                              "flex min-w-0 flex-col items-center rounded-xl border p-1 text-center backdrop-blur-sm transition-all min-[380px]:p-1.5 sm:p-2",
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
                                "mt-1 w-full truncate px-0.5 text-[10px] font-semibold leading-none sm:text-[11px]",
                                isCurrentActive ? "text-foreground" : "text-muted-foreground",
                              )}
                            >
                              {p.name}
                            </span>
                            <span
                              className={cn(
                                "mt-1 text-[11px] font-bold tabular-nums min-[380px]:text-xs",
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
                ) : null}

              </div>
            </div>
          </div>

          {/* Strip Rekening Donasi — satu baris ramping, tetap full-width */}
          {hasDonationAccount ? (
            <div className="mt-6 flex w-full flex-col gap-2 rounded-2xl border border-border/70 bg-card/85 px-4 py-3 shadow-md backdrop-blur-lg sm:flex-row sm:items-center sm:gap-3 dark:bg-zinc-900/60">
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
                  "inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 active:scale-95 sm:w-auto sm:py-2",
                  copied
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-foreground hover:bg-accent",
                )}
                aria-label="Salin nomor rekening donasi"
                aria-live="polite"
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

          {/* Kontrol Carousel: prev + dots + next + jeda */}
          {isSlider && (
            <div
              className="mt-6 flex min-w-0 flex-wrap items-center justify-center gap-2 lg:justify-start"
              onMouseEnter={() => setHoverPaused(true)}
              onMouseLeave={() => setHoverPaused(false)}
            >
              <button
                type="button"
                onClick={goToPrev}
                aria-label="Foto sebelumnya"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-accent active:scale-95"
              >
                <CaretLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="flex min-w-0 max-w-full flex-wrap items-center justify-center gap-2 px-1" role="tablist" aria-label="Pilih foto latar">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    role="tab"
                    aria-selected={idx === currentIdx}
                    aria-label={`Lihat foto ${idx + 1} dari ${images.length}`}
                    onClick={() => setCurrentIdx(idx)}
                    className={cn(
                      "h-2 cursor-pointer rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      idx === currentIdx
                        ? "w-8 bg-primary shadow-xs"
                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60",
                    )}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={goToNext}
                aria-label="Foto berikutnya"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-accent active:scale-95"
              >
                <CaretRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setAutoPaused((v) => !v)}
                aria-label={effectivePaused ? "Putar otomatis foto" : "Jeda otomatis foto"}
                aria-pressed={effectivePaused}
                title={effectivePaused ? "Putar otomatis" : "Jeda otomatis"}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-accent hover:text-foreground active:scale-95"
              >
                {effectivePaused ? (
                  <Play className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Pause className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          )}
        </div>
      </header>
  );
}
