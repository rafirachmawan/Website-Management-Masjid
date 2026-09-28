import { getChartData } from "@/server/services/finance";
import { ok, fail } from "@/server/api-helpers";

export async function GET() {
  try {
    return ok(await getChartData());
  } catch (e) {
    return fail(e);
  }
}
