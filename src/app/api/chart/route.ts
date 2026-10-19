import { getChartData, getChartDataByYear } from "@/server/services/finance";
import { ok, fail } from "@/server/api-helpers";

// Grafik arus kas.
// - Tanpa parameter  → 12 bulan terakhir (dipakai dashboard & beranda).
// - `?year=YYYY`     → 12 bulan penuh tahun tersebut (dipakai halaman Laporan,
//   supaya tahun lama tidak tampil kosong).
export async function GET(req: Request) {
  try {
    const yearParam = new URL(req.url).searchParams.get("year");
    if (yearParam) {
      if (!/^\d{4}$/.test(yearParam)) {
        return ok({ error: "Parameter tahun harus 4 digit (contoh: 2026)." }, 400);
      }
      const year = Number(yearParam);
      if (year < 1900 || year > 2200) {
        return ok({ error: "Tahun di luar rentang yang wajar." }, 400);
      }
      return ok(await getChartDataByYear(year));
    }
    return ok(await getChartData());
  } catch (e) {
    return fail(e);
  }
}
