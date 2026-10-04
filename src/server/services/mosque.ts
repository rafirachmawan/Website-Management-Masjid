// Service: profil masjid (singleton id "main").
// Upsert id "main" dipakai supaya form Pengaturan aman walau baris belum ada.

import { db } from "../db";
import type { MosqueProfile } from "@/types";
import type { MosqueProfileInput, MosqueProfileUpdate } from "../schemas";

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
    logoUrl: input.logoUrl?.trim() ? input.logoUrl.trim() : null,
    coverImageUrl: input.coverImageUrl?.trim() ? input.coverImageUrl.trim() : null,
    heroImages: input.heroImages,
  };
  const row = await db.mosqueProfile.upsert({
    where: { id: "main" },
    create: { id: "main", ...data },
    update: data,
  });
  return toProfile(row);
}

// PATCH parsial — hanya field yang dikirim yang diubah. Aman bila profil belum ada:
// field wajib yang hilang diisi dari baris existing, atau ditolak bila belum ada sama sekali.
export async function patchMosqueProfile(input: MosqueProfileUpdate): Promise<MosqueProfile> {
  const existing = await db.mosqueProfile.findUnique({ where: { id: "main" } });
  if (!existing) {
    throw new Error("Profil masjid belum ada — kirim profil lengkap terlebih dahulu (PUT).");
  }
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.shortName !== undefined) data.shortName = input.shortName;
  if (input.address !== undefined) data.address = input.address;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.email !== undefined) data.email = input.email;
  if (input.latitude !== undefined) data.latitude = input.latitude;
  if (input.longitude !== undefined) data.longitude = input.longitude;
  if (input.timezone !== undefined) data.timezone = input.timezone;
  if (input.establishedYear !== undefined) data.establishedYear = input.establishedYear;
  if (input.description !== undefined) data.description = input.description;
  if (input.logoUrl !== undefined) data.logoUrl = input.logoUrl?.trim() ? input.logoUrl.trim() : null;
  if (input.coverImageUrl !== undefined)
    data.coverImageUrl = input.coverImageUrl?.trim() ? input.coverImageUrl.trim() : null;
  if (input.heroImages !== undefined) data.heroImages = input.heroImages;
  const row = await db.mosqueProfile.update({ where: { id: "main" }, data });
  return toProfile(row);
}
