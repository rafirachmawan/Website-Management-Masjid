// Agregator data untuk halaman publik.
//
// Dipanggil LANGSUNG dari Server Component (`app/page.tsx`) — bukan lewat HTTP
// ke /api sendiri. Satu fungsi ini menggantikan ~10 request browser, sehingga
// render hanya satu putaran dan selalu memakai data terbaru dari database.

import { getMosqueProfile } from "./mosque";
import { getAnnouncements, getActivities } from "./content";
import { getPrayerSchedule } from "./prayer";
import { getAppConfig, DEFAULT_CONFIG } from "./config";
import {
  buildChartFromTransactions,
  getFinancialSummary,
  getTransactions,
} from "./finance";
import { DEFAULT_TIME_ZONE } from "@/lib/utils";
import type {
  MosqueProfile,
  Announcement,
  Activity,
  DailyPrayerSchedule,
  FinancialSummary,
  ChartDataPoint,
  Transaction,
  AppConfig,
} from "@/types";

export interface PublicHomeData {
  profile: MosqueProfile | null;
  prayer: { today: DailyPrayerSchedule | null; week: DailyPrayerSchedule[] };
  financialSummary: FinancialSummary;
  chartData: ChartDataPoint[];
  transactions: Transaction[];
  announcements: Announcement[];
  activities: Activity[];
  config: AppConfig;
}

// Nilai aman bila satu bagian gagal dimuat. Tiap section di beranda sudah punya
// empty state sendiri, jadi cukup jatuhkan nilai netral — bukan melempar galat.
const EMPTY_PRAYER: PublicHomeData["prayer"] = { today: null, week: [] };
const EMPTY_SUMMARY: FinancialSummary = {
  currentBalance: 0,
  monthlyIncome: 0,
  monthlyExpense: 0,
  yearlyIncome: 0,
  yearlyExpense: 0,
  lastUpdated: new Date().toISOString(),
};

function pick<T>(
  result: PromiseSettledResult<T>,
  fallback: T,
  label: string,
): T {
  if (result.status === "fulfilled") return result.value;
  console.error(`[public-home] gagal memuat ${label}:`, result.reason);
  return fallback;
}

export async function getPublicHomeData(): Promise<PublicHomeData> {
  // Semua query independen → jalankan paralel.
  //
  // `allSettled`, bukan `all`: dengan `Promise.all` satu kegagalan (DB terkunci,
  // nilai zona waktu rusak, dsb.) merobohkan SELURUH beranda padahal tiap
  // bagian punya empty state. Dengan `allSettled` bagian lain tetap tampil.
  // Beranda hanya menampilkan profil, jadwal, keuangan, berita, dan kegiatan.
  // Daftar pengurus punya halamannya sendiri (`/pengurus`) → tidak di-query di sini.
  const [
    profileR,
    prayerR,
    financialSummaryR,
    transactionsR,
    announcementsR,
    activitiesR,
    configR,
  ] = await Promise.allSettled([
    getMosqueProfile(),
    getPrayerSchedule(),
    getFinancialSummary(),
    getTransactions(),
    getAnnouncements(),
    getActivities(),
    getAppConfig(),
  ]);

  const profile = pick(profileR, null, "profil");
  const transactions = pick(transactionsR, [], "transaksi");

  // Grafik dibangun dari transaksi yang sudah dimuat (tanpa query tambahan).
  // Dibungkus try/catch karena inti ini sinkron: zona waktu rusak dari data
  // kotor tidak boleh merobohkan beranda yang sebenarnya sudah siap.
  let chartData: ChartDataPoint[] = [];
  try {
    chartData = buildChartFromTransactions(
      transactions,
      12,
      new Date(),
      profile?.timezone?.trim() || DEFAULT_TIME_ZONE,
    );
  } catch (error) {
    console.error("[public-home] gagal menyusun grafik:", error);
  }

  return {
    profile,
    prayer: pick(prayerR, EMPTY_PRAYER, "jadwal sholat"),
    financialSummary: pick(financialSummaryR, EMPTY_SUMMARY, "ringkasan keuangan"),
    chartData,
    transactions,
    announcements: pick(announcementsR, [], "berita"),
    activities: pick(activitiesR, [], "kegiatan"),
    config: pick(configR, DEFAULT_CONFIG, "konfigurasi"),
  };
}
