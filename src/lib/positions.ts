// Daftar jabatan resmi kepengurusan masjid (DKM).
//
// Ini satu-satunya sumber urutan: form admin memakai `POSITIONS` sebagai
// pilihan dropdown, dan halaman publik memakainya untuk menentukan tingkat di
// schema struktur. Jabatan yang tidak ada di daftar ini tidak bisa dipilih lagi
// — pakai `LEGACY_ROLE_MAP` untuk memetakannya.
//
// Catatan: `systemRole` (Peran & Hak Akses Sistem) TIDAK menentukan urutan.
// Itu murni soal hak akses aplikasi, terpisah dari posisi di kepengurusan.

export type PositionLevel = 0 | 1 | 2;

export interface Position {
  /** Nilai yang disimpan di kolom `role`. */
  value: string;
  /** Tingkat di schema: 0 = puncak, 1 = pengurus harian, 2 = anggota. */
  level: PositionLevel;
  /** Urutan di dalam satu tingkat (kecil tampil lebih dulu). */
  rank: number;
}

export const TIER_NAME = ["Ketua", "Pengurus Harian", "Anggota"] as const;

export const POSITIONS: Position[] = [
  // Tingkat 0 — puncak
  { value: "Ketua DKM", level: 0, rank: 0 },
  // Tingkat 1 — pengurus harian
  { value: "Wakil Ketua DKM", level: 1, rank: 1 },
  { value: "Sekretaris DKM", level: 1, rank: 2 },
  { value: "Bendahara DKM", level: 1, rank: 3 },
  { value: "Kasir DKM", level: 1, rank: 4 },
  // Tingkat 2 — anggota & bidang
  { value: "Bidroh", level: 2, rank: 5 },
  { value: "Pembina Rohani", level: 2, rank: 6 },
  { value: "Marbot", level: 2, rank: 7 },
  { value: "Koordinator Kegiatan", level: 2, rank: 8 },
  { value: "Anggota Takmir", level: 2, rank: 9 },
];

const BY_VALUE = new Map(POSITIONS.map((p) => [p.value, p]));
const BY_LOWER = new Map(POSITIONS.map((p) => [p.value.toLowerCase(), p]));

/** Jabatan yang dipakai sebelum daftar ini dibuat — dipetakan ke nilai
 *  kanonik supaya data lama tidak hilang saat admin menyimpan ulang. */
const LEGACY_ROLE_MAP: Record<string, string> = {
  "ketua pengurus masjid": "Ketua DKM",
  "ketua": "Ketua DKM",
  "ketua takmir": "Ketua DKM",
  "ketua dkm": "Ketua DKM",
  "wakil ketua": "Wakil Ketua DKM",
  "sekretaris": "Sekretaris DKM",
  "bendahara": "Bendahara DKM",
  "bendahara utama": "Bendahara DKM",
  "kasir": "Kasir DKM",
  "anggota": "Anggota Takmir",
  "anggota dkm": "Anggota Takmir",
  "pengurus": "Anggota Takmir",
};

/** Jabatan bebas (mis. hasil impor lama atau huruf kapital) dipetakan bila bisa;
 *  kalau tidak dikenali, jatuh ke "Anggota Takmir" supaya tidak pernah gagal
 *  dirender. Fungsi ini tidak pernah melempar error. */
export function normalizePosition(role: string): string {
  const trimmed = role.trim();
  if (BY_VALUE.has(trimmed)) return trimmed;
  const lower = trimmed.toLowerCase();
  return BY_LOWER.get(lower)?.value ?? LEGACY_ROLE_MAP[lower] ?? "Anggota Takmir";
}

const FALLBACK: Position = { value: "Anggota Takmir", level: 2, rank: 9 };

export function positionOf(role: string): Position {
  return BY_VALUE.get(normalizePosition(role)) ?? FALLBACK;
}

export function levelOf(role: string): PositionLevel {
  return positionOf(role).level;
}

export function rankOf(role: string): number {
  return positionOf(role).rank;
}
