"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LockKey, Mosque } from "@phosphor-icons/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDefaultHint, setShowDefaultHint] = useState(false);

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
      router.replace(data?.shouldChangePassword ? "/admin/settings" : next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm border-border shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mosque className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">Masuk Admin</CardTitle>
          <CardDescription>Kelola keuangan & konten masjid. Khusus pengurus.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-xs font-semibold text-foreground">
                Kata Sandi
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi admin…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            {showDefaultHint && (
              <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                Belum pernah diganti? Kata sandi bawaan adalah <strong>admin123</strong> — segera
                ganti di Pengaturan → Keamanan setelah masuk.
              </p>
            )}
            {error && (
              <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/[0.06] px-3 py-2 text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full gap-2" disabled={isLoading || !password}>
              <LockKey className="h-4 w-4" aria-hidden="true" />
              {isLoading ? "Memeriksa…" : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
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
