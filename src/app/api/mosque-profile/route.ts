import { getMosqueProfile, updateMosqueProfile, patchMosqueProfile } from "@/server/services/mosque";
import { mosqueProfileInputSchema, mosqueProfileUpdateSchema } from "@/server/schemas";
import { ok, fail, requireAdminSession, unauthorized } from "@/server/api-helpers";

export async function GET() {
  try {
    const profile = await getMosqueProfile();
    if (!profile) {
      return ok({ error: "Profil masjid belum diisi. Lengkapi lewat halaman admin." }, 404);
    }
    return ok(profile);
  } catch (e) {
    return fail(e);
  }
}

export async function PUT(req: Request) {
  try {
    if (!(await requireAdminSession(req))) return unauthorized();
    const input = mosqueProfileInputSchema.parse(await req.json());
    return ok(await updateMosqueProfile(input));
  } catch (e) {
    return fail(e);
  }
}

export async function PATCH(req: Request) {
  try {
    if (!(await requireAdminSession(req))) return unauthorized();
    const input = mosqueProfileUpdateSchema.parse(await req.json());
    return ok(await patchMosqueProfile(input));
  } catch (e) {
    return fail(e);
  }
}
