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

export async function getAnnouncements(): Promise<Announcement[]> {
  const rows = await db.announcement.findMany({ orderBy: { publishedAt: "desc" } });
  return rows.map(toAnnouncement);
}

export async function getAnnouncementById(id: string): Promise<Announcement | null> {
  const row = await db.announcement.findUnique({ where: { id } });
  return row ? toAnnouncement(row) : null;
}

export async function createAnnouncement(input: AnnouncementInput): Promise<Announcement> {
  if (input.priority === "important") await assertImportantSlotFree();
  const row = await db.announcement.create({
    data: {
      title: input.title,
      content: input.content,
      imageUrl: input.imageUrl || null,
      priority: input.priority,
      author: input.author,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : new Date(),
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

  const row = await db.announcement.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.author !== undefined && { author: input.author }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl || null }),
      ...(input.publishedAt !== undefined && { publishedAt: new Date(input.publishedAt) }),
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
      imageUrl: input.imageUrl || null,
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
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl || null }),
    },
  });
  return toActivity(row);
}

export async function deleteActivity(id: string): Promise<void> {
  await db.activity.delete({ where: { id } });
}
