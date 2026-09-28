import {
  getOfficialById,
  updateOfficial,
  deleteOfficial,
} from "@/server/services/officials";
import { officialInputSchema } from "@/server/schemas";
import { ok, fail } from "@/server/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
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
    const { id } = await params;
    const input = officialInputSchema.partial().parse(await req.json());
    return ok(await updateOfficial(id, input));
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteOfficial(id);
    return ok({ success: true });
  } catch (e) {
    return fail(e);
  }
}
