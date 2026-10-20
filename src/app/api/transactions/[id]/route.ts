import {
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "@/server/services/finance";
import { transactionUpdateSchema } from "@/server/schemas";
import { getAppConfig } from "@/server/services/config";
import { ok, fail, forbidden, requireAdminSession, unauthorized } from "@/server/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  try {
    const config = await getAppConfig();
    if (!config.publicTransparency && !(await requireAdminSession(req))) {
      return forbidden("Rincian transaksi tidak dipublikasikan oleh pengurus.");
    }
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
    if (!(await requireAdminSession(req))) return unauthorized();
    const { id } = await params;
    const input = transactionUpdateSchema.parse(await req.json());
    return ok(await updateTransaction(id, input));
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    if (!(await requireAdminSession(_req))) return unauthorized();
    const { id } = await params;
    await deleteTransaction(id);
    return ok({ success: true });
  } catch (e) {
    return fail(e);
  }
}
