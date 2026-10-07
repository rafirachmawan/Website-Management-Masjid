"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChartBar,
  Eye,
  EyeSlash,
  LockKey,
  Mosque,
  ShieldCheck,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.authenticated) router.replace(next);
        else if (d?.isDefaultPassword) setShowDefaultHint(true);
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

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Panel branding */}
      <aside className="relative hidden overflow-hidden bg-emerald-950 text-white lg:flex lg:flex-col lg:justify-between">
        {/* gradasi + pola geometri Islami */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 opacity-[0.14]"
          aria-hidden="true"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='96' height='96' viewBox='0 0 96 96' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='white' stroke-width='1'%3E%3Cpath d='M48 8 88 48 48 88 8 48Z'/%3E%3Cpath d='M48 28 68 48 48 68 28 48Z'/%3E%3Ccircle cx='48' cy='48' r='3' fill='white' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: "96px 96px",
          }}
        />
        <div
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -right-24 -bottom-24 h-[28rem] w-[28rem] rounded-full bg-teal-300/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center gap-3 p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <Mosque className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">Takmir Masjid</p>
            <p className="text-xs tracking-[0.18em] text-emerald-100/70 uppercase">
              Panel Pengurus
            </p>
          </div>
        </div>

        <div className="relative z-10 px-10 xl:px-14">
          <p className="font-arabic text-2xl text-emerald-100/90" dir="rtl" lang="ar">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <h1 className="font-display mt-4 max-w-md text-4xl leading-[1.1] font-semibold text-balance xl:text-[2.75rem]">
            Kelola amanah umat dengan tertib & transparan.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-emerald-100/80">
            Satu pintu untuk mencatat kas, menerbitkan laporan, serta mengelola jadwal,
            pengumuman, dan profil masjid — mudah dipakai takmir, terbuka untuk jamaah.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              { icon: ChartBar, text: "Arus kas & laporan terverifikasi publik" },
              { icon: ShieldCheck, text: "Akses khusus pengurus, tercatat aman" },
              { icon: Sparkle, text: "Template multi-masjid, mudah di-branding ulang" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-4 w-4 text-emerald-100" aria-hidden="true" />
                </span>
                <span className="text-emerald-50/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center justify-between p-8 text-xs text-emerald-100/60">
          <span>Keuangan terbuka • Jamaah percaya</span>
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ring-1 ring-white/15 transition hover:bg-white/10 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Lihat situs publik
          </Link>
        </div>
      </aside>

      {/* Panel form */}
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-8">
        {/* aksen latar halus */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(42rem_22rem_at_50%_-6rem,var(--primary)_12%,transparent_65%)] opacity-[0.08] dark:opacity-[0.14]"
          aria-hidden="true"
        />
        {/* header mobile */}
        <div className="absolute top-0 right-0 left-0 flex items-center justify-between p-4 sm:p-6 lg:hidden">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mosque className="h-5 w-5" aria-hidden="true" />
            </span>
            Takmir Masjid
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Beranda
          </Link>
        </div>

        <div className="relative w-full max-w-md">
          <Link
            href="/"
            className="mb-6 hidden items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground lg:inline-flex"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Kembali ke beranda
          </Link>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_20px_60px_-24px_rgb(0_0_0/0.25)] sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Mosque className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="font-display mt-5 text-2xl font-semibold tracking-tight">
              Masuk Admin
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Kelola keuangan & konten masjid. Khusus pengurus takmir.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
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
                    className="w-full rounded-xl border border-input bg-background py-2.5 pr-11 pl-3.5 text-sm shadow-sm transition placeholder:text-muted-foreground/70 focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    aria-pressed={showPassword}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
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
                  className="flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-[13px] leading-relaxed text-amber-900 dark:text-amber-100"
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
                      className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-500/30 transition hover:bg-amber-500/25 dark:text-amber-100"
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
                    "rounded-xl border border-destructive/25 bg-destructive/[0.06] px-3.5 py-2.5",
                    "text-sm font-medium text-destructive",
                  )}
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2 rounded-xl font-semibold shadow-lg shadow-primary/20"
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

          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
            Bukan pengurus?{" "}
            <Link href="/" className="font-semibold text-primary hover:underline">
              Lihat laporan keuangan publik
            </Link>
            .
          </p>
        </div>
      </div>
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
