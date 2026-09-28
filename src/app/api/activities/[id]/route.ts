import {
  getActivityById,
  updateActivity,
  deleteActivity,
} from "@/server/services/content";
import { activityInputSchema } from "@/server/schemas";
import { ok, fail } from "@/server/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const row = await getActivityById(id);
    if (!row) return ok({ error: "Kegiatan tidak ditemukan." }, 404);
    return ok(row);
  } catch (e) {
    return fail(e);
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const input = activityInputSchema.partial().parse(await req.json());
    return ok(await updateActivity(id, input));
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteActivity(id);
    return ok({ success: true });
  } catch (e) {
    return fail(e);
  }
}
