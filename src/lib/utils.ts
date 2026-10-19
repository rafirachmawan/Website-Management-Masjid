import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(amount);
}

// ── Zona waktu ─────────────────────────────────────────────────────────────
// Satu sumber kebenaran untuk seluruh UI. Template ini menyasar masjid di
// Indonesia; default WIB dan bisa diganti engine-per-masjid lewat
// `MosqueProfile.timezone`.

export const DEFAULT_TIME_ZONE = "Asia/Jakarta";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

// Label zona yang ramah jamaah: WIB/WITA/WIT, fallback nama IANA.
export function shortZone(timeZone: string): string {
  const tz = (timeZone || "").trim() || DEFAULT_TIME_ZONE;
  if (tz === "Asia/Jakarta") return "WIB";
  if (tz === "Asia/Makassar" || tz === "Asia/Ujung_Pandang") return "WITA";
  if (tz === "Asia/Jayapura") return "WIT";
  return tz;
}

// Tanggal "hari ini" (yyyy-mm-dd) di zona masjid — BUKAN UTC, agar tidak
// bergeser sehari pada pukul 00:00–07:00 WIB.
export function todayISO(timeZone: string = DEFAULT_TIME_ZONE): string {
  const format = (tz: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  try {
    return format(timeZone);
  } catch {
    return format(DEFAULT_TIME_ZONE);
  }
}

// `new Date("2026-10-03")` = tengah malam UTC, dan tanpa `timeZone`
// `toLocaleDateString` memakai zona mesin (server ≠ peramban → tanggal
// bergeser + hydration mismatch). Aturan aman:
// - tanggal-saja (yyyy-mm-dd) → format di UTC agar harinya tidak bergeser;
// - timestamp penuh (mis. publishedAt) → format di zona masjid.
function withSafeTimeZone(
  value: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatOptions {
  if (options.timeZone) return options;
  return { ...options, timeZone: DATE_ONLY_RE.test(value) ? "UTC" : DEFAULT_TIME_ZONE };
}

export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  return new Date(dateStr).toLocaleDateString(
    "id-ID",
    withSafeTimeZone(
      dateStr,
      options ?? { day: "numeric", month: "long", year: "numeric" },
    ),
  );
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(
    "id-ID",
    withSafeTimeZone(dateStr, { day: "2-digit", month: "short", year: "numeric" }),
  );
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(
    "id-ID",
    withSafeTimeZone(dateStr, { hour: "2-digit", minute: "2-digit", hour12: false }),
  );
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trim() + "…";
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

// ── Ekspor file (dipakai tombol Cetak/Export yang nyata) ────────────────────

// Satu baris CSV dengan pemisah titik-koma (cocok untuk Excel Indonesia).
// Nilai yang mengandung koma/petik/baris-baru dibungkus tanda petik.
export function toCsvRow(values: Array<string | number>): string {
  return values
    .map((v) => {
      const s = String(v);
      return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(";");
}

// Mengunduh teks (CSV/JSON) sebagai file. BOM (byte order mark) ditambahkan
// agar Excel menampilkan huruf Indonesia dengan benar.
export function downloadTextFile(filename: string, content: string, mime = "text/csv;charset=utf-8"): void {
  const blob = new Blob(["\uFEFF" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}