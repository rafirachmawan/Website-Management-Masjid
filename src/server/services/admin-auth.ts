// Auth admin — satu akun pengurus untuk seluruh halaman /admin.
//
// Desain untuk template lokal (SQLite, tanpa layanan luar, tanpa dependensi
// baru): kredensial tersimpan di tabel Config (key-value) sehingga kata sandi
// bisa diganti lewat UI Pengaturan oleh pengurus non-teknisi.
// - Hash: scrypt (node:crypto bawaan) — tidak ada bcrypt/argon2.
// - Sesi: cookie httpOnly berisi `expiry.signature` (HMAC-SHA256 dengan secret
//   acak yang juga tersimpan di Config). Stateless — tidak ada tabel sesi.
// - Password bawaan "admin123" dibuat otomatis saat pertama kali dibutuhkan;
//   flag `admin_password_is_default` memicu spanduk "segera ganti" di admin.

import { scrypt, randomBytes, timingSafeEqual, createHmac } from "crypto";
import { db } from "../db";

export const ADMIN_SESSION_COOKIE = "masjid_admin_session";
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 jam
export const DEFAULT_ADMIN_PASSWORD = "admin123";
export const MIN_PASSWORD_LENGTH = 8;

const HASH_KEY = "admin_password_hash";
const SECRET_KEY = "admin_session_secret";
const DEFAULT_FLAG_KEY = "admin_password_is_default";

async function configGet(key: string): Promise<string | null> {
  const row = await db.config.findUnique({ where: { key } });
  return row ? row.value : null;
}

async function configSet(key: string, value: string): Promise<void> {
  await db.config.upsert({ where: { key }, create: { key, value }, update: { value } });
}

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16);
    scrypt(password, salt, 32, { N: 16384, r: 8, p: 1 }, (err, key) => {
      if (err) return reject(err);
      resolve(`scrypt$16384$8$1$${salt.toString("hex")}$${(key as Buffer).toString("hex")}`);
    });
  });
}

function verifyHash(password: string, stored: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const parts = stored.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return resolve(false);
    const N = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return resolve(false);
    const salt = Buffer.from(parts[4], "hex");
    const expected = Buffer.from(parts[5], "hex");
    if (salt.length === 0 || expected.length === 0) return resolve(false);
    scrypt(password, salt, expected.length, { N, r, p }, (err, key) => {
      if (err) return reject(err);
      const actual = key as Buffer;
      if (actual.length !== expected.length) return resolve(false);
      resolve(timingSafeEqual(actual, expected));
    });
  });
}

// Pastikan akun bawaan ada. Dipanggil saat login / cek sesi — bukan saat
// build — supaya database produksi kosong tetap bisa dimasuki pertama kali.
export async function ensureAdminSeeded(): Promise<void> {
  const existing = await configGet(HASH_KEY);
  if (existing) return;
  await configSet(HASH_KEY, await hashPassword(DEFAULT_ADMIN_PASSWORD));
  await configSet(DEFAULT_FLAG_KEY, "1");
}

export async function isDefaultPassword(): Promise<boolean> {
  return (await configGet(DEFAULT_FLAG_KEY)) === "1";
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  await ensureAdminSeeded();
  const stored = await configGet(HASH_KEY);
  if (!stored) return false;
  return verifyHash(password, stored);
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<void> {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Kata sandi baru minimal ${MIN_PASSWORD_LENGTH} karakter.`);
  }
  const ok = await verifyAdminPassword(currentPassword);
  if (!ok) throw new Error("Kata sandi saat ini salah.");
  await configSet(HASH_KEY, await hashPassword(newPassword));
  await configSet(DEFAULT_FLAG_KEY, "0");
}

async function getSessionSecret(): Promise<string> {
  let secret = await configGet(SECRET_KEY);
  if (!secret) {
    secret = randomBytes(32).toString("hex");
    await configSet(SECRET_KEY, secret);
  }
  return secret;
}

function sign(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

// Nilai cookie: `<expiryMs>.<signature>` dengan signature = HMAC(secret, `admin:<expiryMs>`).
export async function createSessionValue(): Promise<{ value: string; expiresAt: Date }> {
  const secret = await getSessionSecret();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const payload = `admin:${expiresAt.getTime()}`;
  return { value: `${expiresAt.getTime()}.${sign(secret, payload)}`, expiresAt };
}

export async function verifySessionValue(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  const dot = value.indexOf(".");
  if (dot <= 0) return false;
  const expiryMs = Number(value.slice(0, dot));
  const sig = value.slice(dot + 1);
  if (!Number.isFinite(expiryMs) || expiryMs < Date.now()) return false;
  if (!/^[0-9a-f]{64}$/.test(sig)) return false;
  const secret = await getSessionSecret();
  const expected = sign(secret, `admin:${expiryMs}`);
  return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
}
