import {
  getAnnouncements,
  getAnnouncementsPaged,
  createAnnouncement,
} from "@/server/services/content";
import { announcementInputSchema } from "@/server/schemas";
import { ok, fail } from "@/server/api-helpers";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const hasPaging =
      url.searchParams.has("page") || url.searchParams.has("limit") || url.searchParams.has("q");
    if (!hasPaging) return ok(await getAnnouncements());
    return ok(
      await getAnnouncementsPaged({
        page: Number(url.searchParams.get("page") ?? "1") || 1,
        limit: Number(url.searchParams.get("limit") ?? "20") || 20,
        q: url.searchParams.get("q") ?? undefined,
      }),
    );
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  try {
    const input = announcementInputSchema.parse(await req.json());
    return ok(await createAnnouncement(input), 201);
  } catch (e) {
    return fail(e);
  }
}
