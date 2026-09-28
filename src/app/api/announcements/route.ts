import {
  getAnnouncements,
  createAnnouncement,
} from "@/server/services/content";
import { announcementInputSchema } from "@/server/schemas";
import { ok, fail } from "@/server/api-helpers";

export async function GET() {
  try {
    return ok(await getAnnouncements());
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
