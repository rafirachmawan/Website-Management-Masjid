import { getOfficials, createOfficial } from "@/server/services/officials";
import { officialInputSchema } from "@/server/schemas";
import { ok, fail, requireAdminSession, unauthorized } from "@/server/api-helpers";

export async function GET() {
  try {
    // Data pengurus memuat PII (phone/email) + data nonaktif.
    // Halaman publik tidak lewat API ini (langsung via service),
    // jadi wajib login — menutup bocor publik di proxy GET terbuka.
    if (!(await requireAdminSession())) return unauthorized();
    return ok(await getOfficials());
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    if (!(await requireAdminSession(req))) return unauthorized();
    const input = officialInputSchema.parse(await req.json());
    return ok(await createOfficial(input), 201);
  } catch (e) {
    return fail(e);
  }
}
