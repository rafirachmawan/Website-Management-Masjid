// Service: konfigurasi aplikasi (rekening donasi & preferensi publik).
// Disimpan di tabel Config (key-value) — diisi lewat halaman /admin,
// tanpa nilai contoh milik masjid tertentu.

import { db } from "../db";
import type { AppConfigInput } from "../schemas";
import type { AppConfig } from "@/types";

export const DEFAULT_CONFIG: AppConfig = {
  bankName: "",
  accountNumber: "",
  accountHolder: "",
  minBalanceAlert: 0,
  publicTransparency: true,
  showDonationQRIS: true,
};

export async function getAppConfig(): Promise<AppConfig> {
  const rows = await db.config.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const num = (key: string, fallback: number): number => {
    const raw = map.get(key);
    if (raw === undefined) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
  };
  const bool = (key: string, fallback: boolean): boolean => {
    const raw = map.get(key);
    if (raw === undefined) return fallback;
    return raw === "true";
  };
  return {
    bankName: map.get("bankName") ?? DEFAULT_CONFIG.bankName,
    accountNumber: map.get("accountNumber") ?? DEFAULT_CONFIG.accountNumber,
    accountHolder: map.get("accountHolder") ?? DEFAULT_CONFIG.accountHolder,
    minBalanceAlert: num("minBalanceAlert", DEFAULT_CONFIG.minBalanceAlert),
    publicTransparency: bool("publicTransparency", DEFAULT_CONFIG.publicTransparency),
    showDonationQRIS: bool("showDonationQRIS", DEFAULT_CONFIG.showDonationQRIS),
  };
}

export async function updateAppConfig(input: AppConfigInput): Promise<AppConfig> {
  const entries: Array<[string, string]> = [];
  if (input.bankName !== undefined) entries.push(["bankName", input.bankName]);
  if (input.accountNumber !== undefined) entries.push(["accountNumber", input.accountNumber]);
  if (input.accountHolder !== undefined) entries.push(["accountHolder", input.accountHolder]);
  if (input.minBalanceAlert !== undefined) entries.push(["minBalanceAlert", String(input.minBalanceAlert)]);
  if (input.publicTransparency !== undefined)
    entries.push(["publicTransparency", String(input.publicTransparency)]);
  if (input.showDonationQRIS !== undefined)
    entries.push(["showDonationQRIS", String(input.showDonationQRIS)]);

  for (const [key, value] of entries) {
    await db.config.upsert({ where: { key }, create: { key, value }, update: { value } });
  }
  return getAppConfig();
}
