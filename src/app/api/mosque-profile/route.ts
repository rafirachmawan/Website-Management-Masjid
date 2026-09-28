import { getMosqueProfile, updateMosqueProfile } from "@/server/services/mosque";
import { mosqueProfileInputSchema } from "@/server/schemas";
import { ok, fail } from "@/server/api-helpers";

export async function GET() {
  try {
    return ok(await getMosqueProfile());
  } catch (e) {
    return fail(e);
  }
}

export async function PUT(req: Request) {
  try {
    const input = mosqueProfileInputSchema.parse(await req.json());
    return ok(await updateMosqueProfile(input));
  } catch (e) {
    return fail(e);
  }
}
