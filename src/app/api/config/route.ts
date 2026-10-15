import { getAppConfig, updateAppConfig } from "@/server/services/config";
import { appConfigInputSchema } from "@/server/schemas";
import { ok, fail, requireAdminSession, unauthorized } from "@/server/api-helpers";

export async function GET() {
  try {
    return ok(await getAppConfig());
  } catch (e) {
    return fail(e);
  }
}

export async function PUT(req: Request) {
  try {
    if (!(await requireAdminSession(req))) return unauthorized();
    const input = appConfigInputSchema.parse(await req.json());
    return ok(await updateAppConfig(input));
  } catch (e) {
    return fail(e);
  }
}
