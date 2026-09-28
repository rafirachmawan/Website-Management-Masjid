import { getActivities, createActivity } from "@/server/services/content";
import { activityInputSchema } from "@/server/schemas";
import { ok, fail } from "@/server/api-helpers";

export async function GET() {
  try {
    return ok(await getActivities());
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
