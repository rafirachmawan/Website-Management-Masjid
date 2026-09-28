import { getPrayerSchedule } from "@/server/services/prayer";
import { ok, fail } from "@/server/api-helpers";

export async function GET() {
  try {
    return ok(await getPrayerSchedule());
  } catch (e) {
    return fail(e);
  }
}
