// Service: konten — pengumuman & kegiatan (read + tulis).
// Delete dipakai hard-delete: data masjid kecil, dan "dihapus" harus berarti hilang
// supaya angka keuangan & laporan tidak pernah berbeda dengan isi tabel.

import { db } from "../db";
import { BadRequestError } from "../api-helpers";
import type { Announcement, Activity } from "@/types";
import type { AnnouncementInput, ActivityInput } from "../schemas";

function toAnnouncement(a: {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  priority: string;
  publishedAt: Date;
  author: string;
}): Announcement {
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    imageUrl: a.imageUrl ?? undefined,
    priority: a.priority as Announcement["priority"],
    publishedAt: a.publishedAt.toISOString(),
    author: a.author,
  };
}

function toActivity(a: {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  imageUrl: string | null;
}): Activity {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    date: a.date,
    time: a.time,
    location: a.location,
    organizer: a.organizer,
    imageUrl: a.imageUrl ?? undefined,
  };
}

// ── Pengumuman ───────────────────────────────────────────────────────────────

// Prioritas "important" = kartu besar (featured) di halaman publik.
// Hanya boleh dipakai 1 berita dalam satu waktu — ditegakkan di sini supaya
// tidak bisa diakali lewat request API langsung.
async function assertImportantSlotFree(exceptId?: string): Promise<void> {
  const holder = await db.announcement.findFirst({
    where: {
      priority: "important",
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true, title: true },
  });
  if (holder) {
    throw new BadRequestError(
      `Prioritas Penting sudah dipakai oleh berita "${holder.title}". Ubah berita tersebut menjadi Biasa terlebih dahulu sebelum menetapkan berita lain sebagai Penting.`,
    );
  }
}

export interface ContentListParams {
  page?: number;
  limit?: number;
  q?: string;
}

function parsePageLimit(params: ContentListParams): { page: number; limit: number } | null {
  if (params.page === undefined && params.limit === undefined && params.q === undefined) return null;
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 20)));
  return { page, limit };
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const rows = await db.announcement.findMany({ orderBy: { publishedAt: "desc" } });
  return rows.map(toAnnouncement);
}

export async function getAnnouncementsPaged(params: ContentListParams): Promise<{
  data: Announcement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const parsed = parsePageLimit(params) ?? { page: 1, limit: 20 };
  const q = params.q?.trim();
  const where = q
    ? { OR: [{ title: { contains: q } }, { content: { contains: q } }, { author: { contains: q } }] }
    : {};
  const [total, rows] = await Promise.all([
    db.announcement.count({ where: where as never }),
    db.announcement.findMany({
      where: where as never,
      orderBy: { publishedAt: "desc" },
      skip: (parsed.page - 1) * parsed.limit,
      take: parsed.limit,
    }),
  ]);
  return {
    data: rows.map(toAnnouncement),
    total,
    page: parsed.page,
    limit: parsed.limit,
    totalPages: Math.max(1, Math.ceil(total / parsed.limit)),
  };
}

export async function getAnnouncementById(id: string): Promise<Announcement | null> {
  const row = await db.announcement.findUnique({ where: { id } });
  return row ? toAnnouncement(row) : null;
}

export async function createAnnouncement(input: AnnouncementInput): Promise<Announcement> {
  if (input.priority === "important") await assertImportantSlotFree();
  const publishedAt = input.publishedAt ? new Date(input.publishedAt) : new Date();
  if (Number.isNaN(publishedAt.getTime())) {
    throw new BadRequestError("Tanggal terbit tidak valid.");
  }
  const row = await db.announcement.create({
    data: {
      title: input.title,
      content: input.content,
      imageUrl: input.imageUrl?.trim() ? input.imageUrl.trim() : null,
      priority: input.priority,
      author: input.author,
      publishedAt,
    },
  });
  return toAnnouncement(row);
}

export async function updateAnnouncement(
  id: string,
  input: Partial<AnnouncementInput>,
): Promise<Announcement> {
  const existing = await db.announcement.findUnique({ where: { id } });
  if (!existing) throw new BadRequestError("Pengumuman yang akan diubah tidak ditemukan.");

  if (input.priority === "important") await assertImportantSlotFree(id);

  let publishedAt: Date | undefined;
  if (input.publishedAt !== undefined) {
    publishedAt = new Date(input.publishedAt);
    if (Number.isNaN(publishedAt.getTime())) {
      throw new BadRequestError("Tanggal terbit tidak valid.");
    }
  }

  const row = await db.announcement.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.author !== undefined && { author: input.author }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl?.trim() ? input.imageUrl.trim() : null }),
      ...(publishedAt !== undefined && { publishedAt }),
    },
  });
  return toAnnouncement(row);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await db.announcement.delete({ where: { id } });
}

// ── Kegiatan ─────────────────────────────────────────────────────────────────

export async function getActivities(): Promise<Activity[]> {
  const rows = await db.activity.findMany({ orderBy: { date: "asc" } });
  return rows.map(toActivity);
}

export async function getActivitiesPaged(params: ContentListParams): Promise<{
  data: Activity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const parsed = parsePageLimit(params) ?? { page: 1, limit: 20 };
  const q = params.q?.trim();
  const where = q
    ? {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { location: { contains: q } },
          { organizer: { contains: q } },
        ],
      }
    : {};
  const [total, rows] = await Promise.all([
    db.activity.count({ where: where as never }),
    db.activity.findMany({
      where: where as never,
      orderBy: { date: "asc" },
      skip: (parsed.page - 1) * parsed.limit,
      take: parsed.limit,
    }),
  ]);
  return {
    data: rows.map(toActivity),
    total,
    page: parsed.page,
    limit: parsed.limit,
    totalPages: Math.max(1, Math.ceil(total / parsed.limit)),
  };
}

export async function getActivityById(id: string): Promise<Activity | null> {
  const row = await db.activity.findUnique({ where: { id } });
  return row ? toActivity(row) : null;
}

export async function createActivity(input: ActivityInput): Promise<Activity> {
  const row = await db.activity.create({
    data: {
      title: input.title,
      description: input.description,
      date: input.date,
      time: input.time,
      location: input.location,
      organizer: input.organizer,
      imageUrl: input.imageUrl?.trim() ? input.imageUrl.trim() : null,
    },
  });
  return toActivity(row);
}

export async function updateActivity(id: string, input: Partial<ActivityInput>): Promise<Activity> {
  const existing = await db.activity.findUnique({ where: { id } });
  if (!existing) throw new BadRequestError("Kegiatan yang akan diubah tidak ditemukan.");

  const row = await db.activity.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.date !== undefined && { date: input.date }),
      ...(input.time !== undefined && { time: input.time }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.organizer !== undefined && { organizer: input.organizer }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl?.trim() ? input.imageUrl.trim() : null }),
    },
  });
  return toActivity(row);
}

export async function deleteActivity(id: string): Promise<void> {
  await db.activity.delete({ where: { id } });
}
