// Gerbang /admin dan API tulis. Berjalan di runtime Node.js (konvensi
// `proxy.ts` Next.js 16) sehingga boleh memakai database + node:crypto.
//
// - `/admin/login` selalu lolos (pintu masuk).
// - `/admin/*` lain wajib cookie sesi valid → kalau tidak, redirect ke login.
// - `POST/PUT/DELETE/PATCH /api/*` wajib sesi valid → kalau tidak, 401 JSON.
//   (Login/logout baca status sesi dikecualikan agar selalu bisa diakses.)
// - `GET /api/*` tetap terbuka: data baca itu juga tampil di halaman publik.

import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionValue } from "@/server/services/admin-auth";

const PUBLIC_API_PATHS = new Set([
  "/api/admin/session", // login (POST), logout (DELETE), status (GET)
]);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    if (req.method === "GET" || PUBLIC_API_PATHS.has(pathname)) return NextResponse.next();
    const ok = await verifySessionValue(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    if (!ok) {
      return NextResponse.json(
        { error: "Sesi admin berakhir. Silakan masuk kembali lewat /admin/login." },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  // /admin/* (halaman)
  const ok = await verifySessionValue(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
