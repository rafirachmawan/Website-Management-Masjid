"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChartBar,
  Eye,
  EyeSlash,
  LockKey,
  MapPin,
  Mosque,
  Phone,
  ShieldCheck,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { MosqueProfile } from "@/types";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Selalu tampilkan dulu peringatan kata sandi bawaan (sesuai permintaan).
  const [showDefaultHint, setShowDefaultHint] = useState(true);
  const [profile, setProfile] = useState<MosqueProfile | null>(null);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.authenticated) router.replace(next);
        else if (d?.isDefaultPassword) setShowDefaultHint(true);
      })
      .catch(() => null);
    // Profil untuk branding (logo, nama, foto) — sama seperti web publik.
    fetch("/api/mosque-profile", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.name === "string") setProfile(d as MosqueProfile);
      })
      .catch(() => null);
  }, [router, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Gagal masuk.");
      // Login pertama (password bawaan) selalu masuk ke Overview (/admin).
      // Banner peringatan di AdminLayout akan mengarahkan untuk ganti password.
      router.replace(data?.shouldChangePassword ? "/admin" : next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDefault = () => setPassword("admin123");

  // ── Branding dinamis dari portal admin (sama seperti Navbar/Footer web) ──
  const brandName = profile?.name?.trim() || "Takmir Masjid";
  const brandLogoUrl = profile?.logoUrl?.trim() ? profile.logoUrl.trim() : null;
  // ── Background dari admin — logika sama seperti Hero web publik ──
  // 1 foto = diam, >1 foto = slider otomatis. Sumber: Pengaturan → Foto Halaman Depan.
  const images = useMemo(() => {
    const hero = (profile?.heroImages || []).map((u) => u?.trim()).filter((u) => u);
    if (hero.length > 0) return hero;
    const cover = profile?.coverImageUrl?.trim();
    return cover ? [cover] : [];
  }, [profile]);
  const isSlider = images.length > 1;
  const [currentIdx, setCurrentIdx] = useState(0);

  const goToNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIdx((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // Geser otomatis tiap 5 detik bila ada >1 foto — sama seperti Hero.
  useEffect(() => {
    if (!isSlider) return;
    const timer = setInterval(goToNext, 5000);
    return () => clearInterval(timer);
  }, [isSlider, goToNext]);

  // Indeks aman bila daftar foto menyusut (tanpa effect agar lolos lint).
  const safeIdx = images.length === 0 ? 0 : currentIdx % images.length;
  const address = profile?.address?.trim() || "";
  const phone = profile?.phone?.trim() || "";

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-background">
      {/* ─── Foto masjid latar — slider sama seperti Hero web publik (1=diam, >1=otomatis) ─── */}
      {images.length > 0 ? (
        <div className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden" aria-hidden="true">
          {images.map((img, idx) => (
            <img
              key={`${img}-${idx}`}
              src={img}
              alt=""
              referrerPolicy="no-referrer"
              className={cn(
                "absolute inset-0 h-full w-full object-cover object-center transition-all duration-1000 ease-out",
                idx === safeIdx
                  ? "scale-100 opacity-100 brightness-[1.02] contrast-[1.03]"
                  : "scale-105 opacity-0",
              )}
            />
          ))}
          {/* Overlay lembut: teks tetap terbaca, foto tetap jernih seperti Hero */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/70 to-background/95 lg:bg-gradient-to-r lg:from-background/95 lg:via-background/60 lg:to-background/20" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background/90 via-background/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/60 to-background" />
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -right-24 -bottom-24 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='96' height='96' viewBox='0 0 96 96' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23000' stroke-width='1'%3E%3Cpath d='M48 8 88 48 48 88 8 48Z'/%3E%3Cpath d='M48 28 68 48 48 68 28 48Z'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "96px 96px",
            }}
          />
        </div>
      )}

      {/* ─── Bar atas: logo + nama masjid, seperti navbar mobile web ─── */}
      <div className="container mx-auto flex h-14 w-full items-center justify-between gap-3 px-4 md:px-6 lg:px-8">
        <Link href="/#beranda" className="flex min-w-0 items-center gap-2.5" aria-label="Ke beranda">
          {brandLogoUrl ? (
            <img
              src={brandLogoUrl}
              alt={`Logo ${brandName}`}
              className="h-8 w-8 shrink-0 rounded-full border border-border bg-white object-cover shadow-sm"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
              <Mosque className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
          )}
          <span className="min-w-0">
            <span className="block max-w-[52vw] truncate text-sm font-bold tracking-tight text-foreground sm:max-w-none">
              {brandName}
            </span>
            <span className="block text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Panel Pengurus
            </span>
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card/80 px-3.5 text-xs font-semibold text-foreground backdrop-blur-sm transition-all hover:-translate-y-px hover:bg-accent active:translate-y-0"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Beranda
        </Link>
      </div>

      {/* ─── Isi: sambutan ala Hero + kartu kaca ─── */}
      <main className="container mx-auto flex w-full flex-1 flex-col justify-center px-4 py-6 md:px-6 md:py-10 lg:px-8">
        <div className="grid w-full items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Kolom kiri: gaya Hero web — hanya desktop agar mobile tetap ringkas */}
          <div className="hidden max-w-2xl flex-col items-start lg:col-span-7 lg:flex">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span
                lang="ar"
                dir="rtl"
                aria-label="Bismillahirrahmanirrahim"
                className="font-arabic text-xl font-normal text-primary/85 xl:text-2xl"
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-sm">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Khusus Pengurus Takmir
              </span>
            </p>
            <h1 className="font-display mt-4 text-4xl leading-[1.06] font-bold tracking-[-0.02em] text-balance text-foreground xl:text-[3.4rem]">
              Kelola amanah umat dengan tertib & transparan.
            </h1>
            {address ? (
              <p className="mt-4 inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3.5 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm">
                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">{address}</span>
              </p>
            ) : null}
            <p className="mt-4 max-w-xl text-[15px] leading-[1.75] text-pretty text-muted-foreground sm:text-base">
              Satu pintu untuk mencatat kas, menerbitkan laporan, serta mengelola jadwal,
              pengumuman, dan profil masjid — mudah dipakai takmir, terbuka untuk jamaah.
            </p>
            <ul className="mt-7 grid w-full max-w-xl gap-2">
              {[
                { icon: ChartBar, text: "Arus kas & laporan terverifikasi publik" },
                { icon: ShieldCheck, text: "Akses khusus pengurus, tercatat aman" },
                { icon: Sparkle, text: "Template multi-masjid, mudah di-branding ulang" },
              ].map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-2.5 rounded-2xl border border-white/40 bg-white/55 px-3.5 py-2.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-lg dark:border-white/10 dark:bg-zinc-900/55"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
            {(phone || profile?.establishedYear) && (
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                {phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                    {phone}
                  </span>
                )}
                {profile?.establishedYear ? (
                  <span className="flex items-center gap-1.5">
                    <Sparkle className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                    Berdiri sejak {profile.establishedYear}
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {/* Kolom kanan: kartu login kaca */}
          <div className="w-full lg:col-span-5">
            {/* Eyebrow mobile — ringkas ala Hero */}
            <div className="mb-4 lg:hidden">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span lang="ar" dir="rtl" className="font-arabic text-xl font-normal text-primary/85">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-sm">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  Panel Pengurus
                </span>
              </p>
              <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-balance text-foreground">
                Masuk Admin
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Kelola keuangan & konten masjid. Khusus pengurus takmir.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/60 p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] backdrop-blur-lg backdrop-saturate-150 sm:p-7 dark:border-white/10 dark:bg-zinc-900/55 dark:backdrop-blur-xl">
              {/* Sheen + kilau seperti kartu Hero */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-white/10 to-transparent dark:from-white/10 dark:via-transparent dark:to-transparent"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/20 blur-2xl"
              />

              <div className="relative">
                <div className="flex items-center gap-3">
                  {brandLogoUrl ? (
                    <img
                      src={brandLogoUrl}
                      alt={`Logo ${brandName}`}
                      className="h-12 w-12 rounded-2xl border border-border bg-white object-cover shadow-md"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                      <Mosque className="h-6 w-6" aria-hidden="true" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-display hidden text-2xl font-semibold tracking-tight text-foreground lg:block">
                      Masuk Admin
                    </h2>
                    <p className="hidden text-sm leading-relaxed text-muted-foreground lg:block">
                      Kelola keuangan & konten masjid.
                    </p>
                    <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase lg:hidden">
                      {brandName}
                    </p>
                  </div>
                  <span className="ml-auto hidden shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary sm:inline-flex">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Khusus takmir
                  </span>
                </div>

                <form onSubmit={submit} className="mt-5 space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="admin-password"
                      className="text-xs font-semibold tracking-wide text-foreground uppercase"
                    >
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <input
                        id="admin-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        autoFocus
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan kata sandi admin…"
                        className="h-12 w-full rounded-2xl border border-input bg-background/90 py-2.5 pr-11 pl-4 text-sm shadow-sm backdrop-blur-sm transition placeholder:text-muted-foreground/70 focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                        aria-pressed={showPassword}
                        className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeSlash className="h-4.5 w-4.5" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4.5 w-4.5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>

                  {showDefaultHint && (
                    <div
                      role="note"
                      aria-label="Peringatan kata sandi bawaan"
                      className="flex gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-[13px] leading-relaxed text-amber-900 backdrop-blur-sm dark:text-amber-100"
                    >
                      <WarningCircle
                        className="mt-0.5 h-4.5 w-4.5 shrink-0 text-amber-600 dark:text-amber-300"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-semibold">Mode awal — kata sandi bawaan</p>
                        <p className="mt-0.5 text-amber-800 dark:text-amber-200/90">
                          Belum pernah diganti? Kata sandi bawaan adalah{" "}
                          <code className="rounded-md bg-amber-500/15 px-1.5 py-0.5 font-mono font-bold text-amber-900 dark:text-amber-100">
                            admin123
                          </code>{" "}
                          — segera ganti di Pengaturan → Keamanan setelah masuk.
                        </p>
                        <button
                          type="button"
                          onClick={fillDefault}
                          className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-500/30 transition hover:bg-amber-500/25 dark:text-amber-100"
                        >
                          <LockKey className="h-3.5 w-3.5" aria-hidden="true" />
                          Isi otomatis admin123
                        </button>
                      </div>
                    </div>
                  )}

                  {error && (
                    <p
                      role="alert"
                      className={cn(
                        "rounded-2xl border border-destructive/25 bg-destructive/[0.06] px-3.5 py-2.5",
                        "text-sm font-medium text-destructive",
                      )}
                    >
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 w-full gap-2 rounded-full text-sm font-semibold shadow-lg shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30 active:translate-y-0 active:scale-[0.99]"
                    disabled={isLoading || !password}
                  >
                    <LockKey className="h-4 w-4" aria-hidden="true" />
                    {isLoading ? "Memeriksa…" : "Masuk ke Panel"}
                  </Button>

                  <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Sesi pengurus dilindungi & tercatat.
                  </p>
                </form>
              </div>
            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
              Bukan pengurus?{" "}
              <Link href="/" className="font-semibold text-primary hover:underline">
                Lihat laporan keuangan publik
              </Link>
              .
            </p>
            {address ? (
              <p className="mx-auto mt-2 flex max-w-md items-start justify-center gap-1.5 text-center text-[11px] leading-relaxed text-muted-foreground">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="line-clamp-2">{address}</span>
              </p>
            ) : null}
          </div>
        </div>
      </main>

      <footer className="container mx-auto w-full px-4 pb-5 md:px-6 lg:px-8">
        <p className="text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} {brandName} • Keuangan terbuka, jamaah percaya
        </p>
      </footer>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
