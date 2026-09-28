import { getOfficials, createOfficial } from "@/server/services/officials";
import { officialInputSchema } from "@/server/schemas";
import { ok, fail } from "@/server/api-helpers";

export async function GET() {
  try {
    return ok(await getOfficials());
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    const input = officialInputSchema.parse(await req.json());
    return ok(await createOfficial(input), 201);
  } catch (e) {
    return fail(e);
  }
}
