import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  SESSION_TTL_MS,
  DEFAULT_ADMIN_PASSWORD,
  createSessionValue,
  ensureAdminSeeded,
  isDefaultPassword,
  verifyAdminPassword,
  verifySessionValue,
} from "@/server/services/admin-auth";
import { ok, fail } from "@/server/api-helpers";

function sessionCookie(value: string, expiresAt: Date) {
  return {
    name: ADMIN_SESSION_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    expires: expiresAt,
    secure: process.env.NODE_ENV === "production",
  };
}

// Rate-limit login sederhana (in-memory): 5x gagal / 10 menit per IP → 429.
// Cukup untuk template lokal tanpa Redis; reset saat sukses.
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_FAIL = 5;
const loginFails = new Map<string, { count: number; firstAt: number; lockedUntil?: number }>();

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}

function isLocked(ip: string): boolean {
  const e = loginFails.get(ip);
  if (!e) return false;
  if (e.lockedUntil && Date.now() < e.lockedUntil) return true;
  if (Date.now() - e.firstAt > LOGIN_WINDOW_MS) {
    loginFails.delete(ip);
    return false;
  }
  return false;
}

function recordFail(ip: string) {
  const now = Date.now();
  const e = loginFails.get(ip);
  if (!e || now - e.firstAt > LOGIN_WINDOW_MS) {
    loginFails.set(ip, { count: 1, firstAt: now });
    return;
  }
  e.count += 1;
  if (e.count >= LOGIN_MAX_FAIL) {
    e.lockedUntil = now + LOGIN_WINDOW_MS;
  }
}

// Status sesi — dipakai banner "ganti password bawaan" dan halaman login.
// `isDefaultPassword` hanya diungkap ke sesi login agar anonim tidak bisa
// memastikan password bawaan masih berlaku (hint visual tetap ada default).
export async function GET() {
  try {
    await ensureAdminSeeded();
    const jar = await cookies();
    const authenticated = await verifySessionValue(jar.get(ADMIN_SESSION_COOKIE)?.value);
    const flag = authenticated ? await isDefaultPassword() : false;
    return ok({ authenticated, isDefaultPassword: flag });
  } catch (e) {
    return fail(e);
  }
}

// Masuk — body { password }.
export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    if (isLocked(ip)) {
      return ok({ error: "Terlalu banyak percobaan gagal. Coba lagi 10 menit." }, 429);
    }
    const body = await req.json().catch(() => null);
    const password = typeof body?.password === "string" ? body.password : "";
    if (!password) {
      return ok({ error: "Kata sandi wajib diisi." }, 401);
    }
    const valid = await verifyAdminPassword(password);
    if (!valid) {
      recordFail(ip);
      // Delay kecil agar brute-force lebih mahal (tanpa captcha tambahan).
      await new Promise((r) => setTimeout(r, 500));
      return ok({ error: "Kata sandi salah. Silakan coba lagi." }, 401);
    }
    loginFails.delete(ip);
    const { value, expiresAt } = await createSessionValue();
    const jar = await cookies();
    jar.set(sessionCookie(value, expiresAt));
    const firstRun = password === DEFAULT_ADMIN_PASSWORD && (await isDefaultPassword());
    return ok({ success: true, shouldChangePassword: firstRun });
  } catch (e) {
    return fail(e);
  }
}

// Keluar — selalu berhasil (idempotent) walau tanpa sesi.
export async function DELETE() {
  try {
    const jar = await cookies();
    jar.delete(ADMIN_SESSION_COOKIE);
    return ok({ success: true });
  } catch (e) {
    return fail(e);
  }
}
