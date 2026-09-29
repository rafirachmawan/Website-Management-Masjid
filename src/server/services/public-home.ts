// Agregator data untuk halaman publik.
//
// Dipanggil LANGSUNG dari Server Component (`app/page.tsx`) — bukan lewat HTTP
// ke /api sendiri. Satu fungsi ini menggantikan ~10 request browser, sehingga
// render hanya satu putaran dan selalu memakai data terbaru dari database.

import { getMosqueProfile } from "./mosque";
import { getAnnouncements, getActivities } from "./content";
import { getPrayerSchedule } from "./prayer";
import { getOfficials } from "./officials";
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
  Official,
} from "@/types";

export interface PublicHomeData {
  profile: MosqueProfile | null;
  prayer: { today: DailyPrayerSchedule | null; week: DailyPrayerSchedule[] };
  financialSummary: FinancialSummary;
  chartData: ChartDataPoint[];
  transactions: Transaction[];
  announcements: Announcement[];
  activities: Activity[];
  officials: Official[];
}

export async function getPublicHomeData(): Promise<PublicHomeData> {
  // Semua query independen → jalankan paralel.
  const [profile, prayer, financialSummary, chartData, transactions, announcements, activities, officials] =
    await Promise.all([
      getMosqueProfile(),
      getPrayerSchedule(),
      getFinancialSummary(),
      getChartData(),
      getTransactions(),
      getAnnouncements(),
      getActivities(),
      getOfficials(),
    ]);

  return {
    profile,
    prayer,
    financialSummary,
    chartData,
    transactions,
    announcements,
    activities,
    officials: officials.filter((o) => o.status === "active"),
  };
}
