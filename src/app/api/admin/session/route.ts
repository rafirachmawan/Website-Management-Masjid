import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  DEFAULT_ADMIN_PASSWORD,
  adminSessionCookie,
  createSessionValue,
  ensureAdminSeeded,
  isDefaultPassword,
  revokeAllSessions,
  verifyAdminPassword,
  verifySessionValue,
} from "@/server/services/admin-auth";
import { ok, fail } from "@/server/api-helpers";

// Rate-limit login (in-memory): 5x gagal / 10 menit per IP **dan** 30x gagal /
// 10 menit secara global. Batas global wajib ada karena identitas IP bisa
// dipalsukan lewat header `x-forwarded-for`; tanpa itu penyerang cukup
// merotasi header untuk melewati lockout. Cukup untuk template lokal tanpa Redis.
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_FAIL = 5;
const LOGIN_MAX_FAIL_GLOBAL = 30;
const GLOBAL_BUCKET = "__global__";

type FailEntry = { count: number; firstAt: number; lockedUntil?: number };
const loginFails = new Map<string, FailEntry>();

// Header proxy hanya dipercaya bila memang ada reverse-proxy tepercaya
// (set `TRUST_PROXY=1`). Selain itu semua klien dianggap satu bucket "local".
function clientIp(req: Request): string {
  if (process.env.TRUST_PROXY === "1") {
    const fwd = req.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0].trim() || "local";
    return req.headers.get("x-real-ip") ?? "local";
  }
  return "local";
}

// Buang entri basi agar Map tidak tumbuh tanpa batas.
function pruneFails(now: number) {
  for (const [key, e] of loginFails) {
    const windowPassed = now - e.firstAt > LOGIN_WINDOW_MS;
    const lockOver = !e.lockedUntil || now >= e.lockedUntil;
    if (windowPassed && lockOver) loginFails.delete(key);
  }
}

function isLocked(ip: string): boolean {
  const now = Date.now();
  for (const key of [ip, GLOBAL_BUCKET]) {
    const e = loginFails.get(key);
    if (!e) continue;
    if (e.lockedUntil && now < e.lockedUntil) return true;
    if (now - e.firstAt > LOGIN_WINDOW_MS) loginFails.delete(key);
  }
  return false;
}

function recordFail(ip: string) {
  const now = Date.now();
  pruneFails(now);
  for (const [key, max] of [[ip, LOGIN_MAX_FAIL], [GLOBAL_BUCKET, LOGIN_MAX_FAIL_GLOBAL]] as const) {
    const e = loginFails.get(key);
    if (!e || now - e.firstAt > LOGIN_WINDOW_MS) {
      loginFails.set(key, { count: 1, firstAt: now });
      continue;
    }
    e.count += 1;
    if (e.count >= max) e.lockedUntil = now + LOGIN_WINDOW_MS;
  }
}

// Status sesi — dipakai spanduk "ganti kata sandi bawaan" di panel admin.
// `isDefaultPassword` HANYA diungkap bila permintaan sudah memakai sesi valid,
// supaya anonim tidak bisa memastikan kata sandi bawaan masih berlaku.
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
    loginFails.delete(GLOBAL_BUCKET);
    const { value, expiresAt } = await createSessionValue();
    const jar = await cookies();
    jar.set(adminSessionCookie(value, expiresAt));
    const firstRun = password === DEFAULT_ADMIN_PASSWORD && (await isDefaultPassword());
    return ok({ success: true, shouldChangePassword: firstRun });
  } catch (e) {
    return fail(e);
  }
}

// Keluar — selalu berhasil (idempotent) walau tanpa sesi.
// `?all=1` mencabut sesi di SEMUA perangkat (secret sesi dirotasi),
// dipakai tombol "Keluar dari semua perangkat" di Pengaturan → Keamanan.
export async function DELETE(req: Request) {
  try {
    const jar = await cookies();
    jar.delete(ADMIN_SESSION_COOKIE);
    const url = new URL(req.url);
    if (url.searchParams.get("all") === "1") {
      await revokeAllSessions();
      return ok({ success: true, revoked: "all" });
    }
    return ok({ success: true });
  } catch (e) {
    return fail(e);
  }
}
