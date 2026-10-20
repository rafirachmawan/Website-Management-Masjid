// Service: pengurus / pengguna (read + tulis).

import { db } from "../db";
import { BadRequestError, NotFoundError } from "../api-helpers";
import { deleteUploadIfUnused } from "./uploads";
import type { Official } from "@/types";
import type { OfficialInput } from "../schemas";

function toOfficial(o: {
  id: string;
  name: string;
  role: string;
  systemRole: string;
  phone: string;
  email: string;
  status: string;
  joinedDate: string;
  avatar: string | null;
}): Official {
  return {
    id: o.id,
    name: o.name,
    role: o.role,
    systemRole: o.systemRole as Official["systemRole"],
    phone: o.phone,
    email: o.email,
    status: o.status as Official["status"],
    joinedDate: o.joinedDate,
    avatar: o.avatar ?? undefined,
  };
}

export async function getOfficials(): Promise<Official[]> {
  const rows = await db.official.findMany({ orderBy: { joinedDate: "asc" } });
  return rows.map(toOfficial);
}

export async function getOfficialById(id: string): Promise<Official | null> {
  const row = await db.official.findUnique({ where: { id } });
  return row ? toOfficial(row) : null;
}

async function ensureEmailFree(email: string, exceptId?: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  // Unik case-insensitive: SQLite findUnique case-sensitive, jadi cek manual.
  const rows = await db.official.findMany({ select: { id: true, email: true } });
  const clash = rows.find((r) => r.email.trim().toLowerCase() === normalized && r.id !== exceptId);
  if (clash) {
    throw new BadRequestError(`Email ${email} sudah dipakai pengurus lain.`);
  }
}

export async function createOfficial(input: OfficialInput): Promise<Official> {
  await ensureEmailFree(input.email);
  const row = await db.official.create({
    data: {
      name: input.name,
      role: input.role,
      systemRole: input.systemRole,
      phone: input.phone,
      email: input.email,
      status: input.status,
      joinedDate: input.joinedDate,
      avatar: input.avatar || null,
    },
  });
  return toOfficial(row);
}

export async function updateOfficial(id: string, input: Partial<OfficialInput>): Promise<Official> {
  const existing = await db.official.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Pengurus yang akan diubah tidak ditemukan.");
  if (input.email) await ensureEmailFree(input.email, id);

  // Guard sole-superadmin juga untuk PUT (dulu hanya DELETE):
  // demote / nonaktifkan satu-satunya superadmin aktif dilarang.
  if (existing.systemRole === "superadmin" && existing.status === "active") {
    const nextRole = input.systemRole ?? existing.systemRole;
    const nextStatus = input.status ?? existing.status;
    if (nextRole !== "superadmin" || nextStatus !== "active") {
      const otherSuperadmin = await db.official.count({
        where: { systemRole: "superadmin", status: "active", NOT: { id } },
      });
      if (otherSuperadmin === 0) {
        throw new BadRequestError(
          "Ini satu-satunya Superadmin aktif. Tunjuk superadmin lain sebelum menurunkan peran atau menonaktifkannya.",
        );
      }
    }
  }

  const row = await db.official.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.role !== undefined && { role: input.role }),
      ...(input.systemRole !== undefined && { systemRole: input.systemRole }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.joinedDate !== undefined && { joinedDate: input.joinedDate }),
      ...(input.avatar !== undefined && { avatar: input.avatar || null }),
    },
  });
  if (existing.avatar && existing.avatar !== row.avatar) {
    await deleteUploadIfUnused(existing.avatar);
  }
  return toOfficial(row);
}

export async function deleteOfficial(id: string): Promise<void> {
  const existing = await db.official.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Pengurus yang akan dihapus tidak ditemukan.");

  // Jangan sampai takmir mengunci dirinya sendiri keluar dari sistem.
  if (existing.systemRole === "superadmin") {
    const otherSuperadmin = await db.official.count({
      where: { systemRole: "superadmin", status: "active", NOT: { id } },
    });
    if (otherSuperadmin === 0) {
      throw new BadRequestError(
        "Ini satu-satunya Superadmin aktif. Tunjuk superadmin lain sebelum menonaktifkan atau menghapusnya.",
      );
    }
  }
  await db.official.delete({ where: { id } });
  await deleteUploadIfUnused(existing.avatar);
}
