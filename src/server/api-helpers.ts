// Helper respons API: bentuk error selalu `{ error: string }`.
// Pesan ditulis dalam Bahasa Indonesia & ramah untuk pengguna (takmir),
// bukan pesan mentah dari driver/validator.

import { NextResponse } from "next/server";
import { ZodError } from "zod";

// Pelanggaran aturan bisnis (mis. kategori tidak cocok dengan tipe transaksi).
// Dipakai service agar backend menolak dengan 400 + pesan jelas, bukan 500.
export class BadRequestError extends Error {}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function fail(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }
  if (error instanceof BadRequestError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
    return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });
  }
  const message = error instanceof Error ? error.message : "Terjadi kesalahan server.";
  return NextResponse.json({ error: message }, { status: 500 });
}
