import {
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/server/services/content";
import { announcementInputSchema } from "@/server/schemas";
import { ok, fail } from "@/server/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const row = await getAnnouncementById(id);
    if (!row) return ok({ error: "Pengumuman tidak ditemukan." }, 404);
    return ok(row);
  } catch (e) {
    return fail(e);
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const input = announcementInputSchema.partial().parse(await req.json());
    return ok(await updateAnnouncement(id, input));
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteAnnouncement(id);
    return ok({ success: true });
  } catch (e) {
    return fail(e);
  }
}
