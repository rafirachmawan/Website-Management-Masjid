import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  MIN_PASSWORD_LENGTH,
  changeAdminPassword,
  verifySessionValue,
} from "@/server/services/admin-auth";
import { ok, fail } from "@/server/api-helpers";

// Ganti kata sandi admin — body { currentPassword, newPassword }.
// Middleware sudah menuntut sesi untuk PUT, pemeriksaan di sini lapis kedua
// agar route tetap aman walau matcher middleware berubah.
export async function PUT(req: Request) {
  try {
    const jar = await cookies();
    const authed = await verifySessionValue(jar.get(ADMIN_SESSION_COOKIE)?.value);
    if (!authed) {
      return ok({ error: "Sesi admin berakhir. Silakan masuk kembali." }, 401);
    }
    const body = await req.json().catch(() => null);
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
    if (!currentPassword || !newPassword) {
      return ok({ error: "Kata sandi saat ini dan yang baru wajib diisi." }, 400);
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return ok({ error: `Kata sandi baru minimal ${MIN_PASSWORD_LENGTH} karakter.` }, 400);
    }
    await changeAdminPassword(currentPassword, newPassword);
    return ok({ success: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Kata sandi saat ini salah.") {
      return ok({ error: e.message }, 400);
    }
    return fail(e);
  }
}
