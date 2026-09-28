// Service: keuangan — kategori, transaksi (CRUD), ringkasan, grafik.
// Ringkasan & grafik DIHITUNG dari transaksi (bukan tabel) agar selalu konsisten.
//
// Definisi (didokumentasikan agar takmir & frontend satu pemahaman):
// - currentBalance = seluruh pemasukan − seluruh pengeluaran (historis).
// - monthly* = filter bulan berjalan (zona masjid), yearly* = tahun berjalan.

import { db } from "../db";
import { BadRequestError } from "../api-helpers";
import type {
  Category,
  Transaction,
  FinancialSummary,
  ChartDataPoint,
} from "@/types";
import type { TransactionInput, TransactionUpdate } from "../schemas";

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
  return {
    id: t.id,
    date: t.date,
    type: t.type as Transaction["type"],
    category: t.category,
    categoryId: t.categoryId,
    amount: t.amount,
    description: t.description,
    proofUrl: t.proofUrl ?? undefined,
    recordedBy: t.recordedBy,
    createdAt: t.createdAt.toISOString(),
  };
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

export async function getTransactions(): Promise<Transaction[]> {
  const rows = await db.transaction.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] });
  return rows.map(toTransaction);
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
  const row = await db.transaction.create({
    data: {
      date: input.date,
      type: input.type,
      category: category.name,
      categoryId: category.id,
      amount: input.amount,
      description: input.description,
      proofUrl: input.proofUrl,
      recordedBy: input.recordedBy,
    },
  });
  return toTransaction(row);
}

export async function updateTransaction(id: string, input: TransactionUpdate): Promise<Transaction> {
  const patch: Record<string, unknown> = { ...input };
  delete patch.categoryId;
  delete patch.category;

  if (input.categoryId) {
    const existing = await db.transaction.findUniqueOrThrow({ where: { id } });
    const category = await db.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw new BadRequestError("Kategori yang dipilih tidak ditemukan.");
    const type = input.type ?? existing.type;
    if (category.type !== type) {
      throw new BadRequestError(
        category.type === "income"
          ? `Kategori "${category.name}" hanya untuk pemasukan, bukan pengeluaran.`
          : `Kategori "${category.name}" hanya untuk pengeluaran, bukan pemasukan.`,
      );
    }
    patch.categoryId = category.id;
    patch.category = category.name;
  }

  const row = await db.transaction.update({ where: { id }, data: patch });
  return toTransaction(row);
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transaction.delete({ where: { id } });
}

export async function getFinancialSummary(now = new Date()): Promise<FinancialSummary> {
  const rows = await db.transaction.findMany({ select: { date: true, type: true, amount: true } });
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
    lastUpdated: now.toISOString(),
  };
}

export async function getChartData(): Promise<ChartDataPoint[]> {
  const rows = await db.transaction.findMany({
    orderBy: { date: "asc" },
    select: { date: true, type: true, amount: true },
  });

  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const t of rows) {
    const key = t.date.slice(0, 7); // yyyy-MM
    const bucket = byMonth.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "income") bucket.income += t.amount;
    else bucket.expense += t.amount;
    byMonth.set(key, bucket);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, v]) => {
      const [y, m] = key.split("-").map(Number);
      return {
        period: `${ID_MONTHS[m - 1]} ${y}`,
        income: v.income,
        expense: v.expense,
        balance: v.income - v.expense,
      };
    });
}
