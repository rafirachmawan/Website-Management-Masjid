export interface MosqueProfile {
  name: string;
  shortName: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  timezone: string;
  establishedYear: number;
  description: string;
  logoUrl?: string;
  coverImageUrl?: string;
  heroImages?: string[];
}

export interface Transaction {
  id: string;
  date: string;
  type: "income" | "expense";
  category: string;
  categoryId: string;
  amount: number;
  description: string;
  proofUrl?: string;
  recordedBy: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon?: string;
  color?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  priority: "normal" | "important" | "urgent";
  publishedAt: string;
  author: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  imageUrl?: string;
}

export interface PrayerTime {
  name: string;
  arabic: string;
  time: string;
  isCurrent: boolean;
  isNext: boolean;
}

export interface DailyPrayerSchedule {
  date: string;
  hijriDate: string;
  prayers: PrayerTime[];
  sunrise: string;
}

export interface FinancialSummary {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  yearlyIncome: number;
  yearlyExpense: number;
  lastUpdated: string;
}

export interface ChartDataPoint {
  period: string;
  income: number;
  expense: number;
  balance: number;
}

export type PeriodFilter = "daily" | "weekly" | "monthly" | "yearly";

export interface AppConfig {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  minBalanceAlert: number;
  publicTransparency: boolean;
  showDonationQRIS: boolean;
}

export interface Official {
  id: string;
  name: string;
  role: string;
  systemRole: "superadmin" | "admin" | "bendahara" | "pengurus";
  phone: string;
  email: string;
  status: "active" | "inactive";
  joinedDate: string;
  avatar?: string;
}