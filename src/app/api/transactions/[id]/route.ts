import {
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "@/server/services/finance";
import { transactionUpdateSchema } from "@/server/schemas";
import { ok, fail } from "@/server/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const txn = await getTransactionById(id);
    if (!txn) return ok({ error: "Transaksi tidak ditemukan." }, 404);
    return ok(txn);
  } catch (e) {
    return fail(e);
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const input = transactionUpdateSchema.parse(await req.json());
    return ok(await updateTransaction(id, input));
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteTransaction(id);
    return ok({ success: true });
  } catch (e) {
    return fail(e);
  }
}
