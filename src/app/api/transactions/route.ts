import {
  getTransactions,
  createTransaction,
} from "@/server/services/finance";
import { transactionInputSchema } from "@/server/schemas";
import { ok, fail } from "@/server/api-helpers";

export async function GET() {
  try {
    return ok(await getTransactions());
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    const input = transactionInputSchema.parse(await req.json());
    return ok(await createTransaction(input), 201);
  } catch (e) {
    return fail(e);
  }
}
