// Service: keuangan — kategori, transaksi (CRUD), ringkasan, grafik.
// Ringkasan & grafik DIHITUNG dari transaksi (bukan tabel) agar selalu konsisten.
//
// Definisi (didokumentasikan agar takmir & frontend satu pemahaman):
// - currentBalance = seluruh pemasukan − seluruh pengeluaran (historis).
// - monthly* = filter bulan berjalan (zona masjid), yearly* = tahun berjalan.

import { db } from "../db";
import { randomUUID } from "crypto";
import { BadRequestError } from "../api-helpers";
import type {
  Category,
  Transaction,
  FinancialSummary,
  ChartDataPoint,
} from "@/types";
import type { TransactionInput, TransactionUpdate, CategoryInput } from "../schemas";

const ID_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function jakartaMonthKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).format(d); // yyyy-MM
}

function toTransaction(t: {
  id: string;
  date: string;
  type: string;
  category: string;
  categoryId: string;
  amount: number;
  description: string;
  proofUrl: string | null;
  recordedBy: string;
  createdAt: Date;
}): Transaction {
  const proof = typeof t.proofUrl === "string" ? t.proofUrl.trim() : "";
  return {
    id: t.id,
    date: t.date,
    type: t.type as Transaction["type"],
    category: t.category,
    categoryId: t.categoryId,
    amount: t.amount,
    description: t.description,
    proofUrl: proof ? proof : undefined,
    recordedBy: t.recordedBy,
    createdAt: t.createdAt.toISOString(),
  };
}

function normalizeProofUrl(v: string | undefined): string | null {
  if (v === undefined) return null;
  const trimmed = v.trim();
  return trimmed ? trimmed : null;
}

export async function getCategories(): Promise<Category[]> {
  const rows = await db.category.findMany({ orderBy: { name: "asc" } });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type as Category["type"],
    icon: c.icon ?? undefined,
    color: c.color ?? undefined,
  }));
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const name = input.name.trim();
  // SQLite `equals` case-sensitive — bandingkan lower agar "Infak" vs "infak" ketahuan.
  const siblings = await db.category.findMany({ where: { type: input.type }, select: { name: true } });
  if (siblings.some((c) => c.name.trim().toLowerCase() === name.toLowerCase())) {
    throw new BadRequestError(`Kategori "${name}" sudah ada.`);
  }
  const row = await db.category.create({
    data: {
      id: `cat-${randomUUID().slice(0, 8)}`,
      name,
      type: input.type,
      icon: input.icon || null,
      color: input.color || null,
    },
  });
  return {
    id: row.id,
    name: row.name,
    type: row.type as Category["type"],
    icon: row.icon ?? undefined,
    color: row.color ?? undefined,
  };
}

export async function updateCategory(id: string, input: Partial<CategoryInput>): Promise<Category> {
  const existing = await db.category.findUnique({ where: { id } });
  if (!existing) throw new BadRequestError("Kategori yang akan diubah tidak ditemukan.");

  const name = input.name?.trim() || existing.name;
  const type = input.type ?? (existing.type as Category["type"]);

  // Kategori yang sudah dipakai transaksi tidak boleh pindah tipe
  // (transaksi terikat pada tipe kategori).
  if (type !== existing.type) {
    const used = await db.transaction.count({ where: { categoryId: id } });
    if (used > 0) {
      throw new BadRequestError(
        `Kategori "${existing.name}" sudah dipakai ${used} transaksi — tipe tidak boleh diubah. Buat kategori baru.`,
      );
    }
  }

  const siblings = await db.category.findMany({
    where: { type, NOT: { id } },
    select: { name: true },
  });
  if (siblings.some((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase())) {
    throw new BadRequestError(`Kategori "${name}" sudah ada.`);
  }

  const row = await db.category.update({
    where: { id },
    data: {
      name,
      type,
      ...(input.icon !== undefined && { icon: input.icon || null }),
      ...(input.color !== undefined && { color: input.color || null }),
    },
  });

  // Nama kategori didenormalisasi di transaksi — ikut perbarui.
  if (name !== existing.name) {
    await db.transaction.updateMany({ where: { categoryId: id }, data: { category: name } });
  }

  return {
    id: row.id,
    name: row.name,
    type: row.type as Category["type"],
    icon: row.icon ?? undefined,
    color: row.color ?? undefined,
  };
}

export async function deleteCategory(id: string): Promise<void> {
  const existing = await db.category.findUnique({ where: { id } });
  if (!existing) throw new BadRequestError("Kategori yang akan dihapus tidak ditemukan.");
  const used = await db.transaction.count({ where: { categoryId: id } });
  if (used > 0) {
    throw new BadRequestError(
      `Kategori "${existing.name}" masih dipakai ${used} transaksi — hapus/ pindahkan transaksinya dulu.`,
    );
  }
  await db.category.delete({ where: { id } });
}

export interface TransactionListParams {
  page?: number;
  limit?: number;
  q?: string;
  type?: "income" | "expense";
  categoryId?: string;
  from?: string; // yyyy-MM-dd
  to?: string; // yyyy-MM-dd
}

export async function getTransactions(): Promise<Transaction[]> {
  const rows = await db.transaction.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] });
  return rows.map(toTransaction);
}

// Server-side pagination + filter agar tabel besar tidak mengunduh full-table.
// Dipakai bila query ?page&limit ada; tanpa param tetap kembalikan semua (kompatibel lama).
export async function getTransactionsPaged(params: TransactionListParams): Promise<{
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.floor(params.limit ?? 20)));
  const where: Record<string, unknown> = {};
  if (params.type === "income" || params.type === "expense") where.type = params.type;
  if (params.categoryId) where.categoryId = params.categoryId;
  if (params.from || params.to) {
    const date: Record<string, string> = {};
    if (params.from) date.gte = params.from;
    if (params.to) date.lte = params.to;
    where.date = date;
  }
  if (params.q) {
    const q = params.q.trim();
    if (q) {
      where.OR = [
        { description: { contains: q } },
        { category: { contains: q } },
        { recordedBy: { contains: q } },
      ];
    }
  }
  const [total, rows] = await Promise.all([
    db.transaction.count({ where: where as never }),
    db.transaction.findMany({
      where: where as never,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return {
    data: rows.map(toTransaction),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const row = await db.transaction.findUnique({ where: { id } });
  return row ? toTransaction(row) : null;
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const category = await db.category.findUnique({ where: { id: input.categoryId } });
  if (!category) throw new BadRequestError("Kategori yang dipilih tidak ditemukan.");
  if (category.type !== input.type) {
    throw new BadRequestError(
      category.type === "income"
        ? `Kategori "${category.name}" hanya untuk pemasukan, bukan pengeluaran.`
        : `Kategori "${category.name}" hanya untuk pengeluaran, bukan pemasukan.`,
    );
  }
  const proof = normalizeProofUrl(input.proofUrl);
  const row = await db.transaction.create({
    data: {
      date: input.date,
      type: input.type,
      category: category.name,
      categoryId: category.id,
      amount: input.amount,
      description: input.description.trim(),
      proofUrl: proof,
      recordedBy: input.recordedBy.trim(),
    },
  });
  return toTransaction(row);
}

export async function updateTransaction(id: string, input: TransactionUpdate): Promise<Transaction> {
  if (Object.keys(input).length === 0) {
    throw new BadRequestError("Tidak ada perubahan — kirim minimal satu field yang diubah.");
  }
  const existing = await db.transaction.findUnique({ where: { id } });
  if (!existing) throw new BadRequestError("Transaksi yang akan diubah tidak ditemukan.");

  // Tentukan tipe & kategori akhir, lalu validasi silang SELALU
  // (menutup celah PUT {type} tanpa categoryId yang dulu desinkron).
  const nextType = input.type ?? (existing.type as "income" | "expense");
  const nextCategoryId = input.categoryId ?? existing.categoryId;
  const category = await db.category.findUnique({ where: { id: nextCategoryId } });
  if (!category) throw new BadRequestError("Kategori yang dipilih tidak ditemukan.");
  if (category.type !== nextType) {
    throw new BadRequestError(
      category.type === "income"
        ? `Kategori "${category.name}" hanya untuk pemasukan, bukan pengeluaran.`
        : `Kategori "${category.name}" hanya untuk pengeluaran, bukan pemasukan.`,
    );
  }

  const patch: Record<string, unknown> = {};
  if (input.date !== undefined) patch.date = input.date;
  if (input.type !== undefined) patch.type = input.type;
  if (input.categoryId !== undefined) {
    patch.categoryId = category.id;
    patch.category = category.name;
  } else if (input.type !== undefined) {
    // Tipe berubah tapi kategori sama tidak mungkin lolos validasi di atas
    // kecuali kategori memang cocok — sinkronkan label untuk keamanan.
    patch.category = category.name;
  }
  if (input.amount !== undefined) patch.amount = input.amount;
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.recordedBy !== undefined) patch.recordedBy = input.recordedBy.trim();
  if (input.proofUrl !== undefined) patch.proofUrl = normalizeProofUrl(input.proofUrl);

  const row = await db.transaction.update({ where: { id }, data: patch });
  return toTransaction(row);
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transaction.delete({ where: { id } });
}

export async function getFinancialSummary(now = new Date()): Promise<FinancialSummary> {
  const [rows, latest] = await Promise.all([
    db.transaction.findMany({ select: { date: true, type: true, amount: true } }),
    db.transaction.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);
  const monthKey = jakartaMonthKey(now);
  const yearKey = monthKey.slice(0, 4);

  let balance = 0;
  let monthlyIncome = 0;
  let monthlyExpense = 0;
  let yearlyIncome = 0;
  let yearlyExpense = 0;

  for (const t of rows) {
    const signed = t.type === "income" ? t.amount : -t.amount;
    balance += signed;
    if (t.date.startsWith(monthKey)) {
      if (t.type === "income") monthlyIncome += t.amount;
      else monthlyExpense += t.amount;
    }
    if (t.date.startsWith(yearKey)) {
      if (t.type === "income") yearlyIncome += t.amount;
      else yearlyExpense += t.amount;
    }
  }

  return {
    currentBalance: balance,
    monthlyIncome,
    monthlyExpense,
    yearlyIncome,
    yearlyExpense,
    // Freshness data = waktu catat terakhir, bukan waktu request.
    lastUpdated: (latest?.createdAt ?? now).toISOString(),
  };
}

function isValidMonthKey(key: string): boolean {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return false;
  const month = Number(m[2]);
  return month >= 1 && month <= 12;
}

function lastNMonthKeys(n: number, now = new Date(), timeZone = "Asia/Jakarta"): string[] {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  let y = Number(parts.find((p) => p.type === "year")?.value);
  let m = Number(parts.find((p) => p.type === "month")?.value);
  const keys: string[] = [];
  for (let i = 0; i < n; i++) {
    keys.push(`${y}-${String(m).padStart(2, "0")}`);
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return keys.reverse();
}

export async function getChartData(months = 12, now = new Date()): Promise<ChartDataPoint[]> {
  const rows = await db.transaction.findMany({
    orderBy: { date: "asc" },
    select: { date: true, type: true, amount: true },
  });

  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const t of rows) {
    const key = t.date.slice(0, 7); // yyyy-MM
    if (!isValidMonthKey(key)) continue; // lewati data kotor warisan, jangan crash
    const bucket = byMonth.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "income") bucket.income += t.amount;
    else bucket.expense += t.amount;
    byMonth.set(key, bucket);
  }

  // Zero-fill 12 bulan terakhir agar garis tidak menyesatkan (sparse → penuh).
  return lastNMonthKeys(months, now).map((key) => {
    const v = byMonth.get(key) ?? { income: 0, expense: 0 };
    const [y, m] = key.split("-").map(Number);
    return {
      period: `${ID_MONTHS[m - 1]} ${y}`,
      income: v.income,
      expense: v.expense,
      balance: v.income - v.expense,
    };
  });
}
