import { getCategories, createCategory } from "@/server/services/finance";
import { categoryInputSchema } from "@/server/schemas";
import { ok, fail, requireAdminSession, unauthorized } from "@/server/api-helpers";

export async function GET() {
  try {
    return ok(await getCategories());
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    if (!(await requireAdminSession(req))) return unauthorized();
    const input = categoryInputSchema.parse(await req.json());
    return ok(await createCategory(input), 201);
  } catch (e) {
    return fail(e);
  }
}
