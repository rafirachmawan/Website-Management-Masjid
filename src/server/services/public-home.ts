// Agregator data untuk halaman publik.
//
// Dipanggil LANGSUNG dari Server Component (`app/page.tsx`) — bukan lewat HTTP
// ke /api sendiri. Satu fungsi ini menggantikan ~10 request browser, sehingga
// render hanya satu putaran dan selalu memakai data terbaru dari database.

import { getMosqueProfile } from "./mosque";
import { getAnnouncements, getActivities } from "./content";
import { getPrayerSchedule } from "./prayer";
import {
  getFinancialSummary,
  getChartData,
  getTransactions,
} from "./finance";
import type {
  MosqueProfile,
  Announcement,
  Activity,
  DailyPrayerSchedule,
  FinancialSummary,
  ChartDataPoint,
  Transaction,
} from "@/types";

export interface PublicHomeData {
  profile: MosqueProfile;
  prayer: { today: DailyPrayerSchedule; week: DailyPrayerSchedule[] };
  financialSummary: FinancialSummary;
  chartData: ChartDataPoint[];
  transactions: Transaction[];
  announcements: Announcement[];
  activities: Activity[];
}

export async function getPublicHomeData(): Promise<PublicHomeData> {
  // Semua query independen → jalankan paralel.
  const [profile, prayer, financialSummary, chartData, transactions, announcements, activities] =
    await Promise.all([
      getMosqueProfile(),
      getPrayerSchedule(),
      getFinancialSummary(),
      getChartData(),
      getTransactions(),
      getAnnouncements(),
      getActivities(),
    ]);

  return {
    profile,
    prayer,
    financialSummary,
    chartData,
    transactions,
    announcements,
    activities,
  };
}
