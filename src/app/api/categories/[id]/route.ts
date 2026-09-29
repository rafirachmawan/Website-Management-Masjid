import { updateCategory, deleteCategory } from "@/server/services/finance";
import { categoryInputSchema } from "@/server/schemas";
import { ok, fail } from "@/server/api-helpers";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = categoryInputSchema.partial().parse(await req.json());
    return ok(await updateCategory(id, input));
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteCategory(id);
    return ok({ deleted: true });
  } catch (e) {
    return fail(e);
  }
}
