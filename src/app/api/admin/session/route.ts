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

// Status sesi — dipakai banner "ganti password bawaan" dan halaman login.
export async function GET() {
  try {
    await ensureAdminSeeded();
    const jar = await cookies();
    const authenticated = await verifySessionValue(jar.get(ADMIN_SESSION_COOKIE)?.value);
    return ok({ authenticated, isDefaultPassword: await isDefaultPassword() });
  } catch (e) {
    return fail(e);
  }
}

// Masuk — body { password }.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const password = typeof body?.password === "string" ? body.password : "";
    if (!password) {
      return ok({ error: "Kata sandi wajib diisi." }, 401);
    }
    const valid = await verifyAdminPassword(password);
    if (!valid) {
      return ok({ error: "Kata sandi salah. Silakan coba lagi." }, 401);
    }
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
