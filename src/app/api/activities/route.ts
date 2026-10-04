import { getActivities, getActivitiesPaged, createActivity } from "@/server/services/content";
import { activityInputSchema } from "@/server/schemas";
import { ok, fail } from "@/server/api-helpers";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const hasPaging =
      url.searchParams.has("page") || url.searchParams.has("limit") || url.searchParams.has("q");
    if (!hasPaging) return ok(await getActivities());
    return ok(
      await getActivitiesPaged({
        page: Number(url.searchParams.get("page") ?? "1") || 1,
        limit: Number(url.searchParams.get("limit") ?? "20") || 20,
        q: url.searchParams.get("q") ?? undefined,
      }),
    );
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    const input = activityInputSchema.parse(await req.json());
    return ok(await createActivity(input), 201);
  } catch (e) {
    return fail(e);
  }
}
