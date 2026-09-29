// Service: profil masjid (singleton id "main").
// Upsert id "main" dipakai supaya form Pengaturan aman walau baris belum ada.

import { db } from "../db";
import type { MosqueProfile } from "@/types";
import type { MosqueProfileInput } from "../schemas";

function toProfile(row: {
  name: string;
  shortName: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  timezone: string;
  establishedYear: number;
  description: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  heroImages: unknown;
}): MosqueProfile {
  return {
    name: row.name,
    shortName: row.shortName,
    address: row.address,
    phone: row.phone,
    email: row.email,
    latitude: row.latitude,
    longitude: row.longitude,
    timezone: row.timezone,
    establishedYear: row.establishedYear,
    description: row.description,
    logoUrl: row.logoUrl ?? undefined,
    coverImageUrl: row.coverImageUrl ?? undefined,
    heroImages: Array.isArray(row.heroImages) ? (row.heroImages as string[]) : undefined,
  };
}

export async function getMosqueProfile(): Promise<MosqueProfile | null> {
  const row = await db.mosqueProfile.findUnique({ where: { id: "main" } });
  return row ? toProfile(row) : null;
}

export async function updateMosqueProfile(input: MosqueProfileInput): Promise<MosqueProfile> {
  const data = {
    name: input.name,
    shortName: input.shortName,
    address: input.address,
    phone: input.phone,
    email: input.email,
    latitude: input.latitude,
    longitude: input.longitude,
    timezone: input.timezone,
    establishedYear: input.establishedYear,
    description: input.description,
    logoUrl: input.logoUrl || null,
    coverImageUrl: input.coverImageUrl || null,
    heroImages: input.heroImages,
  };
  const row = await db.mosqueProfile.upsert({
    where: { id: "main" },
    create: { id: "main", ...data },
    update: data,
  });
  return toProfile(row);
}
