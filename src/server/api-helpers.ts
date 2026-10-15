// Helper respons API: bentuk error selalu `{ error: string }`.
// Pesan ditulis dalam Bahasa Indonesia & ramah untuk pengguna (takmir),
// bukan pesan mentah dari driver/validator.

import { NextResponse } from "next/server";
import { ZodError } from "zod";

// Pelanggaran aturan bisnis (mis. kategori tidak cocok dengan tipe transaksi).
// Dipakai service agar backend menolak dengan 400 + pesan jelas, bukan 500.
export class BadRequestError extends Error {}

export function unauthorized(message = "Sesi admin berakhir. Silakan masuk kembali lewat /admin/login.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

// Defense-in-depth: setiap route tulis + route sensitif (officials, uploads)
// wajib panggil ini, jangan hanya mengandalkan `proxy.ts` di edge.
// Cek Origin/Referer bila ada agar CSRF lintas-situs ditolak
// (SameSite=lax sudah menahan, ini lapis kedua tanpa token tambahan).
export async function requireAdminSession(req?: Request): Promise<boolean> {
  try {
    if (req) {
      const origin = req.headers.get("origin");
      const referer = req.headers.get("referer");
      const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
      const src = origin ?? referer;
      if (src && host) {
        try {
          const srcHost = new URL(src).host;
          if (srcHost !== host) return false;
        } catch {
          return false;
        }
      }
    }
    const { cookies } = await import("next/headers");
    const { ADMIN_SESSION_COOKIE, verifySessionValue } = await import(
      "./services/admin-auth"
    );
    const jar = await cookies();
    return verifySessionValue(jar.get(ADMIN_SESSION_COOKIE)?.value);
  } catch {
    return false;
  }
}

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
  if (typeof error === "object" && error !== null && "code" in error && error.code === "P2003") {
    return NextResponse.json(
      { error: "Data masih dipakai di tempat lain — hapus atau pindahkan dulu sebelum menghapus." },
      { status: 400 },
    );
  }
  if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
    return NextResponse.json(
      { error: "Data duplikat — nilai unik sudah dipakai data lain." },
      { status: 400 },
    );
  }
  // Jangan bocorkan pesan driver/Prisma mentah ke klien.
  if (error instanceof Error && /prisma|Unique constraint|Foreign key/i.test(error.message)) {
    return NextResponse.json({ error: "Operasi database gagal. Periksa kembali data yang dikirim." }, { status: 500 });
  }
  const message = error instanceof Error ? error.message : "Terjadi kesalahan server.";
  return NextResponse.json({ error: message }, { status: 500 });
}
