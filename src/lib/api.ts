// Klien HTTP frontend → backend (/api).
// Komponen TIDAK boleh import prisma/services langsung —
// satu-satunya jalan ke data adalah fungsi/hook di file ini.

"use client";

import { useState, useEffect, useCallback } from "react";

/** Galat HTTP dengan status asli — dipakai UI untuk membedakan 401/403/404. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error ?? `Gagal memuat ${path}`, res.status);
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
    throw new ApiError(data?.error ?? `Gagal ${method} ${path}`, res.status);
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
  status: number | null;
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
      .catch((e: unknown) => {
        if (!live) return;
        setFailure({
          source: key,
          message: e instanceof Error ? e.message : "Gagal memuat data.",
          status: e instanceof ApiError ? e.status : null,
        });
      });
    return () => {
      live = false;
    };
  }, [path, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const data = result && result.path === path ? result.value : null;
  const currentFailure = failure?.source === source ? failure : null;
  const error = currentFailure?.message ?? null;
  const errorStatus = currentFailure?.status ?? null;

  return { data, error, errorStatus, isLoading: data === null && error === null, refresh };
}
