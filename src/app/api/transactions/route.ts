import {
  getTransactions,
  getTransactionsPaged,
  createTransaction,
} from "@/server/services/finance";
import { transactionInputSchema } from "@/server/schemas";
import { ok, fail } from "@/server/api-helpers";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const hasPaging =
      url.searchParams.has("page") ||
      url.searchParams.has("limit") ||
      url.searchParams.has("q") ||
      url.searchParams.has("type") ||
      url.searchParams.has("categoryId") ||
      url.searchParams.has("from") ||
      url.searchParams.has("to");
    if (!hasPaging) return ok(await getTransactions());
    const type = url.searchParams.get("type");
    return ok(
      await getTransactionsPaged({
        page: Number(url.searchParams.get("page") ?? "1") || 1,
        limit: Number(url.searchParams.get("limit") ?? "20") || 20,
        q: url.searchParams.get("q") ?? undefined,
        type: type === "income" || type === "expense" ? type : undefined,
        categoryId: url.searchParams.get("categoryId") ?? undefined,
        from: url.searchParams.get("from") ?? undefined,
        to: url.searchParams.get("to") ?? undefined,
      }),
    );
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
