import { updateCategory, deleteCategory } from "@/server/services/finance";
import { categoryInputSchema } from "@/server/schemas";
import { ok, fail, BadRequestError, requireAdminSession, unauthorized } from "@/server/api-helpers";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdminSession(req))) return unauthorized();
    const { id } = await params;
    const raw = await req.json();
    if (!raw || Object.keys(raw).length === 0) {
      throw new BadRequestError("Tidak ada perubahan — kirim minimal satu field yang diubah.");
    }
    const input = categoryInputSchema.partial().parse(raw);
    return ok(await updateCategory(id, input));
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdminSession(req))) return unauthorized();
    const { id } = await params;
    await deleteCategory(id);
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
