"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { MosqueProfile, DailyPrayerSchedule, PrayerTime, AppConfig } from "@/types";
import { formatDate, shortZone, DEFAULT_TIME_ZONE, cn } from "@/lib/utils";
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
  CaretDown,
} from "@phosphor-icons/react";

const PRAYER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Subuh: Sun,
  Dzuhur: Sun,
  Ashar: Sun,
  Maghrib: Moon,
  Isya: Star,
};

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
  const [hoverPaused, setHoverPaused] = useState(false);

  // Quick Infaq Copy State
  const [copied, setCopied] = useState(false);
  // Deskripsi dipadatkan: 2 baris + "Baca selengkapnya" (data tetap utuh)
  const [descExpanded, setDescExpanded] = useState(false);

  // Countdown ke waktu sholat berikutnya
  const [timeCountdown, setTimeCountdown] = useState<string>("");
  const [currentNextPrayer, setCurrentNextPrayer] = useState<PrayerTime | null>(null);

  const tz = mosqueProfile?.timezone?.trim() || DEFAULT_TIME_ZONE;
  const zone = shortZone(tz);

  const goToNext = useCallback(() => {
    if (!isSlider) return;
    setCurrentIdx((prev) => (prev + 1) % images.length);
  }, [isSlider, images.length]);

  // Auto slide tiap 5 detik — berhenti saat hover atau tab tersembunyi.
  useEffect(() => {
    if (!isSlider || hoverPaused) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      goToNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [isSlider, hoverPaused, goToNext]);

  // Indeks aktif dihitung, bukan disimpan ulang lewat effect: bila daftar
  // gambar menyusut (mis. admin hapus foto) kita cukup jatuh ke foto pertama
  // tanpa render tambahan.
  const activeIdx = images.length > 0 && currentIdx >= images.length ? 0 : currentIdx;

  // Countdown memakai jam zona masjid agar benar untuk jamaah di luar WIB.
  useEffect(() => {
    const prayers = prayer.today?.prayers;

    function calculateCountdown() {
      if (!prayers || prayers.length === 0) {
        setCurrentNextPrayer(null);
        setTimeCountdown("");
        return;
      }

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

    // Pembaruan pertama dijadwalkan (bukan dipanggil langsung di badan effect)
    // supaya render pertama tetap sama dengan HTML server dan tidak memicu
    // render ganda — hasilnya tetap muncul di frame berikutnya.
    const first = setTimeout(calculateCountdown, 0);
    const interval = setInterval(calculateCountdown, 15000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
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

  // Sinkronisasi navigasi #jadwal-sholat (Desktop vs Mobile)
  useEffect(() => {
    const handleHash = () => {
      if (typeof window === "undefined") return;
      if (window.location.hash === "#jadwal-sholat") {
        const isMobile = window.innerWidth < 1024;
        const targetId = isMobile ? "jadwal-sholat-mobile" : "jadwal-sholat-desktop";
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Profil belum diisi admin — sambutan ramah.
  // `id="jadwal-sholat"` tetap dipasang supaya menu "Jadwal Sholat" di Navbar
  // tidak menjadi tautan mati selama masa penyiapan (belum ada jadwal nyata).
  if (!mosqueProfile) {
    return (
      <header
        id="jadwal-sholat"
        aria-label="Sambutan masjid"
        className="relative flex min-h-[70svh] scroll-mt-24 flex-col pt-16 pb-14 text-center md:pt-17 md:pb-16"
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

  const hasDonationAccount = Boolean(
    config?.showDonationQRIS &&
      ((config?.accountNumber && config.accountNumber.trim().length > 0) ||
        Boolean(config?.qrisImageUrl && config.qrisImageUrl.trim().length > 0)),
  );

  // ─── Komponen Bersama: Interactive Mosque Hub Card ───────────────────────────
  const prayerHubCard = (
    <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/60 p-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] backdrop-blur-lg backdrop-saturate-150 sm:p-7 dark:border-white/10 dark:bg-zinc-900/55 dark:backdrop-blur-xl">
      {/* Lapisan kaca: sheen halus + aksen kilau di pojok kanan atas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/50 via-white/10 to-transparent dark:from-white/10 dark:via-transparent dark:to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-2xl"
      />

      {/* ── Zona 1 · HEADER: label status + hitung mundur ── */}
      <div className="relative flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <span className="hero-label inline-flex min-w-0 items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          Waktu Sholat Berikutnya
        </span>
        {today && timeCountdown && (
          <span className="hero-label inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-primary">
            {timeCountdown}
          </span>
        )}
      </div>

      {/* Pembeda 1 — batas header → isi */}
      <div
        aria-hidden="true"
        className="relative mt-3.5 h-px bg-linear-to-r from-primary/45 via-white/60 to-transparent sm:mt-4 dark:via-white/15"
      />

      {/* ── Zona 2 · DESKRIPSI + ISI: sholat berikutnya dan waktunya ── */}
      {nextPrayerToShow ? (
        <div className="relative mt-3.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 sm:mt-4">
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
            {/* Tanggal masehi + Hijriah */}
            <p className="hero-meta mt-1 text-muted-foreground tabular-nums">
              {today ? formatMosqueDate(today.date, tz) : null}
              {today?.hijriDate ? ` • ${today.hijriDate}` : null}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-3xl font-extrabold tabular-nums tracking-tight text-primary sm:text-4xl">
              {nextPrayerToShow.time}
            </span>
            <span className="hero-meta ml-1 text-muted-foreground">
              {zone}
            </span>
          </div>
        </div>
      ) : (
        <p className="hero-meta mt-4 text-muted-foreground">
          Jadwal sholat belum tersedia. Pengurus cukup melengkapi lokasi masjid di halaman admin.
        </p>
      )}

      {/* Pembeda 2 — batas isi → jadwal harian */}
      {today ? (
        <div
          aria-hidden="true"
          className="relative mt-3.5 h-px bg-linear-to-r from-primary/45 via-white/60 to-transparent sm:mt-4 dark:via-white/15"
        />
      ) : null}

      {/* ── Zona 3 · ISI: 5 Waktu Sholat Hari Ini (Compact Grid) ── */}
      {today ? (
        <div className="relative pt-3.5 sm:pt-4">
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
                      "mt-1 w-full truncate px-0.5 text-[11px] font-semibold leading-none",
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
      ) : null}
    </div>
  );

  // ─── Komponen Bersama: Strip Rekening & QRIS Donasi ──────────────────────────
  const donationStrip = (
    <div className="flex w-full flex-col gap-2 rounded-2xl border border-border/70 bg-card/85 px-4 py-3 shadow-md backdrop-blur-lg sm:flex-row sm:items-center sm:gap-3 dark:bg-zinc-900/60">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Bank className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            Kanal Donasi & Infaq
            <span className="inline-flex items-center gap-0.5 font-medium text-muted-foreground">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              DKM Resmi
            </span>
          </p>
          <p
            title={config?.accountHolder ? `a.n. ${config.accountHolder}` : undefined}
            className="truncate text-sm font-bold tabular-nums text-foreground"
          >
            {config?.accountNumber
              ? `${config?.bankName ? `${config.bankName} · ` : ""}${config.accountNumber}`
              : "QRIS Infaq Digital Siap Dipindai"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {config?.qrisImageUrl && (
          <Link
            href="/keuangan#donasi"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Scan QRIS
          </Link>
        )}
        {config?.accountNumber && (
          <button
            type="button"
            onClick={() => handleCopyAccount(config?.accountNumber || "")}
            className={cn(
              "inline-flex w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 active:scale-95 sm:w-auto",
              copied
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-primary text-primary-foreground hover:brightness-110",
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
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Salin Rekening
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ─── SCREEN 1: Hero Section (Pas 1 Layar Penuh di Mobile & Proporsional di Desktop) ─── */}
      <header className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col justify-center overflow-hidden py-6 sm:py-8 lg:min-h-[84svh] lg:py-14">
        {/* ─── Foto masjid latar ─────────────────────────────────────── */}
        {images.length > 0 && (
          <div
            className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden"
            aria-hidden="true"
          >
            <div role="region" aria-roledescription="carousel" aria-label="Foto masjid">
              {images.map((img, idx) => {
                const isRemote = /^https?:\/\//i.test(img);
                const active = idx === activeIdx;
                return (
                  <Image
                    key={`${img}-${idx}`}
                    src={img}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="100vw"
                    unoptimized={isRemote}
                    {...(idx === 0 ? { preload: true } : { loading: "lazy" as const })}
                    referrerPolicy="no-referrer"
                    aria-roledescription="slide"
                    className={cn(
                      "object-cover object-center transition-all duration-1000 ease-out",
                      active ? "scale-100 opacity-100" : "scale-105 opacity-0",
                    )}
                  />
                );
              })}
            </div>
            {/* Scrim kiri diperkuat agar teks lolos kontras di foto cerah */}
            <div className="absolute inset-0 bg-linear-to-r from-background via-background/75 to-background/10 lg:from-background lg:via-background/55 lg:via-45% lg:to-transparent lg:to-75%" />
            <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-background/80 via-background/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-background via-background/40 to-transparent" />
          </div>
        )}

        <div className="container relative mx-auto flex w-full flex-1 flex-col justify-center px-4 md:px-6 lg:px-8">
          <div className="grid w-full items-center gap-6 sm:gap-8 lg:grid-cols-12 lg:gap-12">
            {/* ─── Kolom Sambutan & Identitas Masjid ───────── */}
            <div className="flex w-full max-w-2xl flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
              {/* Basmalah & Status Badge */}
              <p className="flex w-full flex-col items-center gap-2 sm:gap-4 lg:items-start">
                <span
                  lang="ar"
                  dir="rtl"
                  aria-label="Bismillahirrahmanirrahim"
                  className="font-arabic text-[1.45rem] font-normal text-primary/85 sm:text-3xl lg:text-[2.1rem]"
                >
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </span>
                <span className="hero-label inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-primary/20 bg-background/85 px-3 py-1 text-xs text-primary backdrop-blur-sm sm:px-3.5 sm:py-1.5">
                  <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary"></span>
                  </span>
                  Terbuka untuk Jamaah 24 Jam
                </span>
              </p>

              {/* Judul Megah Masjid */}
              <h1 className="font-display mt-2 w-full text-balance text-3xl font-bold leading-[1.08] tracking-[-0.02em] text-foreground min-[380px]:text-[2.2rem] sm:mt-3 sm:text-5xl lg:mt-3.5 lg:text-[3.4rem]">
                {heading}
              </h1>

              {/* Lokasi Alamat */}
              <p
                title={mosqueProfile.address}
                className="hero-meta mt-2 inline-flex max-w-full items-start gap-1.5 text-xs text-muted-foreground sm:mt-3.5 sm:items-center sm:rounded-full sm:border sm:border-border/80 sm:bg-background/80 sm:px-3.5 sm:py-1.5 sm:text-sm sm:text-foreground sm:backdrop-blur-sm lg:mt-4"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary sm:mt-0 sm:h-4 sm:w-4" aria-hidden="true" />
                <span className="min-w-0 wrap-break-word">{mosqueProfile.address}</span>
              </p>

              {/* Deskripsi Masjid */}
              <p
                className={cn(
                  "hero-lead mt-3 w-full max-w-xl text-pretty text-xs text-muted-foreground sm:mt-5 sm:text-base lg:mt-6",
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
                  className="hero-action mt-1.5 cursor-pointer text-xs text-primary hover:underline sm:text-sm"
                >
                  {descExpanded ? "Tutup" : "Baca selengkapnya"}
                </button>
              )}

              {/* Dual Action CTA Buttons (Sejajar rapi di mobile) */}
              <div className="mt-4 flex w-full flex-row flex-wrap items-center justify-center gap-2 sm:mt-6 sm:gap-3 min-[420px]:w-auto lg:mt-7">
                <a
                  href="/keuangan#donasi"
                  className="hero-action inline-flex h-11 flex-1 min-[340px]:flex-initial items-center justify-center gap-2 rounded-full bg-primary px-4 sm:px-6 text-xs sm:text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 active:translate-y-0 active:scale-[0.99]"
                >
                  <Heart className="h-4 w-4" weight="fill" aria-hidden="true" />
                  Salurkan Infaq
                </a>

                <a
                  href="#informasi"
                  className="hero-action inline-flex h-11 flex-1 min-[340px]:flex-initial items-center justify-center gap-2 rounded-full border border-border bg-card/80 px-4 sm:px-6 text-xs sm:text-sm font-semibold text-foreground backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent active:translate-y-0 active:scale-[0.99]"
                >
                  <CalendarBlank className="h-4 w-4 text-primary" aria-hidden="true" />
                  Agenda & Info
                </a>
              </div>

              {/* Info Tambahan Bawah */}
              <div className="hero-meta mt-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground sm:mt-5 lg:justify-start">
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

              {/* Cue Navigasi Cepat Mobile ke Section Jadwal Sholat */}
              <div className="mt-4 flex w-full justify-center lg:hidden">
                <a
                  href="#jadwal-sholat-mobile"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("jadwal-sholat-mobile")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm transition-all hover:border-primary/50 hover:text-primary"
                >
                  <span>Lihat Jadwal Sholat</span>
                  <CaretDown className="h-3.5 w-3.5 text-primary transition-transform duration-300 group-hover:translate-y-0.5" />
                </a>
              </div>
            </div>

            {/* ─── Kolom Kanan (Desktop Only): Interactive Mosque Hub Card (5 Kolom) ──────── */}
            <div id="jadwal-sholat-desktop" className="hidden scroll-mt-24 lg:col-span-5 lg:block">
              {prayerHubCard}
            </div>
          </div>

          {/* Strip Rekening Donasi (Desktop Only) */}
          {hasDonationAccount ? (
            <div className="mt-6 hidden lg:block">
              {donationStrip}
            </div>
          ) : null}

          {/* Penanda slide */}
          {isSlider && (
            <div
              className="mt-4 sm:mt-6 flex w-full min-w-0 flex-wrap items-center justify-center gap-1"
              onMouseEnter={() => setHoverPaused(true)}
              onMouseLeave={() => setHoverPaused(false)}
              role="tablist"
              aria-label="Pilih foto latar"
            >
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={idx === activeIdx}
                  aria-label={`Lihat foto ${idx + 1} dari ${images.length}`}
                  onClick={() => setCurrentIdx(idx)}
                  className="group/dot flex h-6 cursor-pointer items-center justify-center rounded-full px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      idx === activeIdx
                        ? "w-8 bg-primary shadow-xs"
                        : "w-2 bg-muted-foreground/30 group-hover/dot:bg-muted-foreground/60",
                    )}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ─── SCREEN 2: Dedicated Mobile Section for Jadwal Sholat & Rekening (Pas Selayar) ────────── */}
      <section
        id="jadwal-sholat-mobile"
        className="relative z-10 flex min-h-[calc(100svh-4rem)] flex-col justify-center scroll-mt-16 border-t border-border/50 bg-linear-to-b from-background via-muted/20 to-background px-4 py-8 lg:hidden"
      >
        <div className="container mx-auto max-w-lg space-y-4">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Jadwal Ibadah Hari Ini
            </span>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Waktu Sholat & Infaq
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Zona {zone} ({tz}) · Diperbarui otomatis
            </p>
          </div>

          {prayerHubCard}

          {hasDonationAccount && donationStrip}
        </div>
      </section>
    </>
  );
}
