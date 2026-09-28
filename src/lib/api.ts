// Klien HTTP frontend → backend (/api).
// Komponen TIDAK boleh import prisma/services langsung —
// satu-satunya jalan ke data adalah fungsi/hook di file ini.

"use client";

import { useState, useEffect, useCallback } from "react";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Gagal memuat ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function apiSend<T>(path: string, method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Gagal ${method} ${path}`);
  }
  return res.json() as Promise<T>;
}

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!path) return;
    let live = true;
    setError(null);
    apiGet<T>(path)
      .then((d) => {
        if (live) setData(d);
      })
      .catch((e: Error) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [path, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  return { data, error, isLoading: data === null && error === null, refresh };
}
