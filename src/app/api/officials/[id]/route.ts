import {
  getOfficialById,
  updateOfficial,
  deleteOfficial,
} from "@/server/services/officials";
import { officialUpdateSchema } from "@/server/schemas";
import { ok, fail, requireAdminSession, unauthorized } from "@/server/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    if (!(await requireAdminSession(_req))) return unauthorized();
    const { id } = await params;
    const row = await getOfficialById(id);
    if (!row) return ok({ error: "Pengurus tidak ditemukan." }, 404);
    return ok(row);
  } catch (e) {
    return fail(e);
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    if (!(await requireAdminSession(req))) return unauthorized();
    const { id } = await params;
    const input = officialUpdateSchema.parse(await req.json());
    return ok(await updateOfficial(id, input));
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    if (!(await requireAdminSession(_req))) return unauthorized();
    const { id } = await params;
    await deleteOfficial(id);
    return ok({ success: true });
  } catch (e) {
    return fail(e);
  }
}
