// Klien Prisma tunggal (singleton).
// Seluruh akses database WAJIB lewat `db` ini — dilarang `new PrismaClient()`
// di services maupun route handlers (mencegah kehabisan koneksi saat HMR).

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
