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

/** Nilai beserta path asalnya. */
interface Sourced<T> {
  path: string;
  value: T;
}

/** Galat beserta "sumbernya" (path + nomor refresh). */
interface SourcedFailure {
  source: string;
  message: string;
}

export function useApi<T>(path: string | null) {
  // Nilai disimpan bersama path asalnya, galat bersama path + nomor refresh.
  // Efeknya: `refresh()` tidak perlu `setState` sinkron untuk mereset galat —
  // galat lama otomatis basi karena nomor refresh berubah (pola yang dulu
  // memicu render ganda dan error lint set-state-in-effect), sedangkan data
  // yang sudah tiba tetap tampil sampai data baru menyusul.
  const [result, setResult] = useState<Sourced<T> | null>(null);
  const [failure, setFailure] = useState<SourcedFailure | null>(null);
  const [version, setVersion] = useState(0);

  const source = `${path ?? ""}#${version}`;

  useEffect(() => {
    if (!path) return;
    const key = `${path}#${version}`;
    let live = true;
    apiGet<T>(path)
      .then((d) => {
        if (live) setResult({ path, value: d });
      })
      .catch((e: Error) => {
        if (live) setFailure({ source: key, message: e.message });
      });
    return () => {
      live = false;
    };
  }, [path, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const data = result && result.path === path ? result.value : null;
  const error = failure?.source === source ? failure.message : null;

  return { data, error, isLoading: data === null && error === null, refresh };
}
