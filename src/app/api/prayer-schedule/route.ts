import { getPrayerSchedule } from "@/server/services/prayer";
import { ok, fail } from "@/server/api-helpers";

// Jadwal dihitung otomatis dari koordinat profil masjid (metode Kemenag).
export async function GET() {
  try {
    return ok(await getPrayerSchedule());
  } catch (e) {
    return fail(e);
  }
}
