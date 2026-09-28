import { getFinancialSummary } from "@/server/services/finance";
import { ok, fail } from "@/server/api-helpers";

export async function GET() {
  try {
    return ok(await getFinancialSummary());
  } catch (e) {
    return fail(e);
  }
}
