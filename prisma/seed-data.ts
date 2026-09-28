import type {
  MosqueProfile,
  Transaction,
  Category,
  Announcement,
  Activity,
  DailyPrayerSchedule,
  FinancialSummary,
  ChartDataPoint,
  Official,
} from "../src/types";

// Data awal (dummy) — dipakai SEKALI oleh `npm run db:seed`.
// Setelah seed, sumber kebenaran = database (dev.db), bukan file ini.

export const mosqueProfile: MosqueProfile = {
  name: "Masjid Ar-Rahman",
  shortName: "Ar-Rahman",
  address: "Jl. Raya Kemang No. 45, RT 03/RW 02, Kemang, Kec. Mampang Prapatan, Kota Jakarta Selatan, DKI Jakarta 12730",
  phone: "+62 21 719 1234",
  email: "takmir@masjidarrahman.or.id",
  latitude: -6.2615,
  longitude: 106.8106,
  timezone: "Asia/Jakarta",
  establishedYear: 1985,
  description: "Masjid Ar-Rahman berdiri sejak tahun 1985 sebagai pusat ibadah, pembinaan umat, dan pelayanan sosial bagi warga sekitar. Pengajian rutin, pembinaan generasi muda, serta program kepedulian masyarakat dikelola takmir secara amanah dan berkesinambungan.",
  logoUrl: "/logo.png",
  coverImageUrl: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1920&q=80",
  heroImages: [
    "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1920&q=80",
  ],
};

export const categories: Category[] = [
  { id: "cat-1", name: "Infak & Sedekah", type: "income", icon: "hand-coins", color: "oklch(0.42 0.12 162)" },
  { id: "cat-2", name: "Zakat Fitrah", type: "income", icon: "package", color: "oklch(0.55 0.15 85)" },
  { id: "cat-3", name: "Zakat Mal", type: "income", icon: "coins", color: "oklch(0.5 0.18 140)" },
  { id: "cat-4", name: "Waqaf", type: "income", icon: "building-2", color: "oklch(0.48 0.14 200)" },
  { id: "cat-5", name: "Sewa Tempat", type: "income", icon: "key", color: "oklch(0.6 0.12 60)" },
  { id: "cat-6", name: "Operasional Masjid", type: "expense", icon: "lightbulb", color: "oklch(0.58 0.2 25)" },
  { id: "cat-7", name: "Honorarium Khatib/Imam", type: "expense", icon: "user-check", color: "oklch(0.55 0.18 30)" },
  { id: "cat-8", name: "Pemeliharaan & Perbaikan", type: "expense", icon: "wrench", color: "oklch(0.6 0.15 40)" },
  { id: "cat-9", name: "Kegiatan Keagamaan", type: "expense", icon: "book-open", color: "oklch(0.52 0.16 280)" },
  { id: "cat-10", name: "Kebersihan & Perlengkapan", type: "expense", icon: "spray-can", color: "oklch(0.58 0.14 180)" },
  { id: "cat-11", name: "Utilitas (Air/Listrik/Internet)", type: "expense", icon: "zap", color: "oklch(0.65 0.18 55)" },
  { id: "cat-12", name: "Bantuan Sosial", type: "expense", icon: "heart-handshake", color: "oklch(0.5 0.2 340)" },
];

const categoryMap = new Map(categories.map((c) => [c.id, c]));

export const transactions: Transaction[] = [
  { id: "txn-1", date: "2026-09-25", type: "income", category: "Infak & Sedekah", categoryId: "cat-1", amount: 2500000, description: "Infak Jumat ke-4 September 2026", proofUrl: "/proofs/infak-jumat-25sep.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-09-25T13:30:00Z" },
  { id: "txn-2", date: "2026-09-24", type: "expense", category: "Operasional Masjid", categoryId: "cat-6", amount: 1200000, description: "Pembayaran listrik bulan September 2026", proofUrl: "/proofs/listrik-sep26.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-09-24T10:15:00Z" },
  { id: "txn-3", date: "2026-09-22", type: "income", category: "Zakat Fitrah", categoryId: "cat-2", amount: 8500000, description: "Zakat Fitrah 1447 H - Tahap 2", proofUrl: "/proofs/zakat-fitrah-2.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-09-22T15:00:00Z" },
  { id: "txn-4", date: "2026-09-20", type: "expense", category: "Honorarium Khatib/Imam", categoryId: "cat-7", amount: 3500000, description: "Honorarium Imam & Khatib September 2026", proofUrl: "/proofs/honor-imam-sep26.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-09-20T09:00:00Z" },
  { id: "txn-5", date: "2026-09-18", type: "income", category: "Sewa Tempat", categoryId: "cat-5", amount: 1500000, description: "Sewa ruang serbaguna untuk acara pernikahan", proofUrl: "/proofs/sewa-ruang-18sep.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-09-18T14:20:00Z" },
  { id: "txn-6", date: "2026-09-15", type: "expense", category: "Pemeliharaan & Perbaikan", categoryId: "cat-8", amount: 4200000, description: "Perbaikan AC ruang wudhu & penggantian pipa bocor", proofUrl: "/proofs/perbaikan-ac.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-09-15T11:30:00Z" },
  { id: "txn-7", date: "2026-09-12", type: "income", category: "Infak & Sedekah", categoryId: "cat-1", amount: 1800000, description: "Infak Jumat ke-2 September 2026", proofUrl: "/proofs/infak-jumat-12sep.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-09-12T13:45:00Z" },
  { id: "txn-8", date: "2026-09-10", type: "expense", category: "Kegiatan Keagamaan", categoryId: "cat-9", amount: 2800000, description: "Biaya perlengkapan pengajian rutin & konsumsi", proofUrl: "/proofs/pengajian-sep26.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-09-10T16:00:00Z" },
  { id: "txn-9", date: "2026-09-08", type: "expense", category: "Kebersihan & Perlengkapan", categoryId: "cat-10", amount: 950000, description: "Pembelian sapu, pel, sabun, tissue, dll", proofUrl: "/proofs/kebersihan-8sep.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-09-08T10:30:00Z" },
  { id: "txn-10", date: "2026-09-05", type: "income", category: "Waqaf", categoryId: "cat-4", amount: 50000000, description: "Waqaf tanah 200m2 dari Bpk. H. Surya", proofUrl: "/proofs/waqaf-tanah.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-09-05T14:00:00Z" },
  { id: "txn-11", date: "2026-09-03", type: "expense", category: "Utilitas (Air/Listrik/Internet)", categoryId: "cat-11", amount: 1850000, description: "Tagihan air PDAM & internet 3 bulan", proofUrl: "/proofs/utilitas-sep26.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-09-03T09:45:00Z" },
  { id: "txn-12", date: "2026-09-01", type: "expense", category: "Bantuan Sosial", categoryId: "cat-12", amount: 3000000, description: "Bantuan untuk 15 keluarga mustahik", proofUrl: "/proofs/bansos-1sep.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-09-01T11:00:00Z" },
  { id: "txn-13", date: "2026-08-28", type: "income", category: "Infak & Sedekah", categoryId: "cat-1", amount: 3200000, description: "Infak Jumat ke-4 Agustus 2026", proofUrl: "/proofs/infak-jumat-28aug.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-08-28T13:30:00Z" },
  { id: "txn-14", date: "2026-08-25", type: "expense", category: "Operasional Masjid", categoryId: "cat-6", amount: 1150000, description: "Pembayaran listrik bulan Agustus 2026", proofUrl: "/proofs/listrik-aug26.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-08-25T10:00:00Z" },
  { id: "txn-15", date: "2026-08-20", type: "income", category: "Zakat Mal", categoryId: "cat-3", amount: 12500000, description: "Zakat Mal dari Bpk. H. Rahman", proofUrl: "/proofs/zakat-mal-rahman.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-08-20T15:30:00Z" },
  { id: "txn-16", date: "2026-08-15", type: "expense", category: "Honorarium Khatib/Imam", categoryId: "cat-7", amount: 3500000, description: "Honorarium Imam & Khatib Agustus 2026", proofUrl: "/proofs/honor-imam-aug26.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-08-15T09:00:00Z" },
  { id: "txn-17", date: "2026-08-10", type: "income", category: "Sewa Tempat", categoryId: "cat-5", amount: 2000000, description: "Sewa halaman untuk bazar ramadhan", proofUrl: "/proofs/sewa-halaman.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-08-10T14:00:00Z" },
  { id: "txn-18", date: "2026-08-05", type: "expense", category: "Pemeliharaan & Perbaikan", categoryId: "cat-8", amount: 1800000, description: "Cat ulang dinding masjid bagian dalam", proofUrl: "/proofs/cat-dinding.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-08-05T10:30:00Z" },
  { id: "txn-19", date: "2026-07-28", type: "income", category: "Infak & Sedekah", categoryId: "cat-1", amount: 2900000, description: "Infak Jumat ke-4 Juli 2026", proofUrl: "/proofs/infak-jumat-28jul.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-07-28T13:30:00Z" },
  { id: "txn-20", date: "2026-07-25", type: "expense", category: "Operasional Masjid", categoryId: "cat-6", amount: 1100000, description: "Pembayaran listrik bulan Juli 2026", proofUrl: "/proofs/listrik-jul26.jpg", recordedBy: "Ust. Ahmad (Bendahara)", createdAt: "2026-07-25T10:00:00Z" },
];

export const announcements: Announcement[] = [
  {
    id: "ann-1",
    title: "Pengajian Rutin Mingguan - Setiap Senin Ba'da Maghrib",
    content: "Kepada seluruh jamaah, pengajian rutin 'Tafsir Al-Quran' akan dilaksanakan setiap hari Senin ba'da sholat Maghrib di Masjid Ar-Rahman. Materi kali ini: Surah Al-Kahf ayat 1-10. Diharapkan kehadiran seluruh jamaah.",
    priority: "normal",
    publishedAt: "2026-09-20T18:00:00Z",
    author: "Ust. Abdullah (Khatib)",
  },
  {
    id: "ann-2",
    title: "Kegiatan Maulid Nabi Muhammad SAW - 12 Rabiul Awal 1448 H",
    content: "Insya Allah Masjid Ar-Rahman akan menggelar peringatan Maulid Nabi Muhammad SAW pada hari Senin, 12 Rabiul Awal 1448 H (sekitar 14 September 2026 M). Acara dimulai pukul 19.00 WIB dengan tausiyah, shalawat badar, dan doa bersama. Dibuka untuk umum.",
    priority: "important",
    publishedAt: "2026-09-15T10:00:00Z",
    author: "Pengurus Masjid",
    imageUrl: "/announcements/maulid-1448.jpg",
  },
  {
    id: "ann-3",
    title: "Pembagian Paket Sembako untuk Mustahik",
    content: "Alhamdulillah, pada hari Jumat, 26 September 2026, Masjid Ar-Rahman akan membagikan paket sembako kepada 50 keluarga mustahik di lingkungan masjid. Pelaksanaan ba'da sholat Jumat. Mohon doa dan dukungan jamaah.",
    priority: "urgent",
    publishedAt: "2026-09-24T08:00:00Z",
    author: "Bagian Sosial",
  },
  {
    id: "ann-4",
    title: "Kelas Tahfidz Anak-Anak - Buka Pendaftaran Gelombang 2",
    content: "Program Tahfidz Anak-Anak Masjid Ar-Rahman membuka pendaftaran gelombang 2 untuk usia 7-12 tahun. Kelas: Sabtu & Minggu pukul 08.00-10.00 WIB. Biaya: Rp 150.000/bulan. Pendaftaran di sekretariat masjid atau WhatsApp: 0812-3456-7890.",
    priority: "normal",
    publishedAt: "2026-09-10T14:00:00Z",
    author: "Koordinator Tahfidz",
  },
  {
    id: "ann-5",
    title: "Jadwal Sholat Jumat - Khutbah Bahasa Indonesia & Arab",
    content: "Mulai bulan ini, khutbah Jumat akan disampaikan secara bergantian: Bahasa Indonesia (minggu 1 & 3) dan Bahasa Arab (minggu 2 & 4). Sholat Jumat pukul 12.15 WIB (Azan) / 12.30 WIB (Iqamah).",
    priority: "normal",
    publishedAt: "2026-09-01T07:00:00Z",
    author: "Ust. Ahmad (Imam)",
  },
];

export const activities: Activity[] = [
  {
    id: "act-1",
    title: "Pengajian Rutin: Tafsir Surah Al-Kahf",
    description: "Pengajian mingguan membahas tafsir Surah Al-Kahf ayat 1-10. Cocok untuk semua kalangan.",
    date: "2026-09-29",
    time: "18:30 - 19:30",
    location: "Masjid Ar-Rahman (Ruang Utama)",
    organizer: "Ust. Abdullah",
    imageUrl: "/activities/pengajian-kahf.jpg",
  },
  {
    id: "act-2",
    title: "Khataman Quran Anak-Anak Tahfidz",
    description: "Acara khataman 30 juz oleh anak-anak program tahfidz masjid. Diikuti doa bersama dan pembagian hadiah.",
    date: "2026-10-04",
    time: "09:00 - 11:30",
    location: "Masjid Ar-Rahman (Halaman)",
    organizer: "Koordinator Tahfidz",
    imageUrl: "/activities/khataman-anak.jpg",
  },
  {
    id: "act-3",
    title: "Baksos Bulanan: Sembako untuk Mustahik",
    description: "Pembagian paket sembako (beras, minyak, gula, telur) kepada 50 keluarga mustahik terdaftar.",
    date: "2026-10-10",
    time: "13:00 - 15:00",
    location: "Masjid Ar-Rahman (Ruang Serbaguna)",
    organizer: "Bagian Sosial",
    imageUrl: "/activities/bansos.jpg",
  },
  {
    id: "act-4",
    title: "Kajian Khusus: Fiqih Zakat & Waqaf",
    description: "Kajian mendalam tentang hukum zakat maal, zakat fitrah, dan waqaf. Pembicara: Ust. Dr. Muhammad Zain.",
    date: "2026-10-18",
    time: "19:00 - 21:00",
    location: "Masjid Ar-Rahman (Ruang Utama) & Live Streaming",
    organizer: "Pengurus Masjid",
    imageUrl: "/activities/kajian-zakat.jpg",
  },
];

export const prayerSchedule: DailyPrayerSchedule = {
  date: "2026-09-27",
  hijriDate: "14 Rabiul Awal 1448 H",
  sunrise: "05:38",
  prayers: [
    { name: "Subuh", arabic: "الفجر", time: "04:45", isCurrent: false, isNext: false },
    { name: "Dzuhur", arabic: "الظهر", time: "11:52", isCurrent: false, isNext: false },
    { name: "Ashar", arabic: "العصر", time: "15:12", isCurrent: true, isNext: false },
    { name: "Maghrib", arabic: "المغرب", time: "17:58", isCurrent: false, isNext: true },
    { name: "Isya", arabic: "العشاء", time: "19:08", isCurrent: false, isNext: false },
  ],
};

export const weeklyPrayerSchedule: DailyPrayerSchedule[] = [
  { date: "2026-09-27", hijriDate: "14 Rabiul Awal 1448 H", sunrise: "05:38", prayers: [{ name: "Subuh", arabic: "الفجر", time: "04:45", isCurrent: false, isNext: false }, { name: "Dzuhur", arabic: "الظهر", time: "11:52", isCurrent: false, isNext: false }, { name: "Ashar", arabic: "العصر", time: "15:12", isCurrent: true, isNext: false }, { name: "Maghrib", arabic: "المغرب", time: "17:58", isCurrent: false, isNext: true }, { name: "Isya", arabic: "العشاء", time: "19:08", isCurrent: false, isNext: false }] },
  { date: "2026-09-28", hijriDate: "15 Rabiul Awal 1448 H", sunrise: "05:38", prayers: [{ name: "Subuh", arabic: "الفجر", time: "04:45", isCurrent: false, isNext: false }, { name: "Dzuhur", arabic: "الظهر", time: "11:52", isCurrent: false, isNext: false }, { name: "Ashar", arabic: "العصر", time: "15:12", isCurrent: false, isNext: false }, { name: "Maghrib", arabic: "المغرب", time: "17:58", isCurrent: false, isNext: false }, { name: "Isya", arabic: "العشاء", time: "19:08", isCurrent: false, isNext: false }] },
  { date: "2026-09-29", hijriDate: "16 Rabiul Awal 1448 H", sunrise: "05:38", prayers: [{ name: "Subuh", arabic: "الفجر", time: "04:45", isCurrent: false, isNext: false }, { name: "Dzuhur", arabic: "الظهر", time: "11:52", isCurrent: false, isNext: false }, { name: "Ashar", arabic: "العصر", time: "15:12", isCurrent: false, isNext: false }, { name: "Maghrib", arabic: "المغرب", time: "17:58", isCurrent: false, isNext: false }, { name: "Isya", arabic: "العشاء", time: "19:08", isCurrent: false, isNext: false }] },
  { date: "2026-09-30", hijriDate: "17 Rabiul Awal 1448 H", sunrise: "05:38", prayers: [{ name: "Subuh", arabic: "الفجر", time: "04:45", isCurrent: false, isNext: false }, { name: "Dzuhur", arabic: "الظهر", time: "11:52", isCurrent: false, isNext: false }, { name: "Ashar", arabic: "العصر", time: "15:12", isCurrent: false, isNext: false }, { name: "Maghrib", arabic: "المغرب", time: "17:58", isCurrent: false, isNext: false }, { name: "Isya", arabic: "العشاء", time: "19:08", isCurrent: false, isNext: false }] },
  { date: "2026-10-01", hijriDate: "18 Rabiul Awal 1448 H", sunrise: "05:38", prayers: [{ name: "Subuh", arabic: "الفجر", time: "04:45", isCurrent: false, isNext: false }, { name: "Dzuhur", arabic: "الظهر", time: "11:52", isCurrent: false, isNext: false }, { name: "Ashar", arabic: "العصر", time: "15:12", isCurrent: false, isNext: false }, { name: "Maghrib", arabic: "المغرب", time: "17:58", isCurrent: false, isNext: false }, { name: "Isya", arabic: "العشاء", time: "19:08", isCurrent: false, isNext: false }] },
  { date: "2026-10-02", hijriDate: "19 Rabiul Awal 1448 H", sunrise: "05:38", prayers: [{ name: "Subuh", arabic: "الفجر", time: "04:45", isCurrent: false, isNext: false }, { name: "Dzuhur", arabic: "الظهر", time: "11:52", isCurrent: false, isNext: false }, { name: "Ashar", arabic: "العصر", time: "15:12", isCurrent: false, isNext: false }, { name: "Maghrib", arabic: "المغرب", time: "17:58", isCurrent: false, isNext: false }, { name: "Isya", arabic: "العشاء", time: "19:08", isCurrent: false, isNext: false }] },
  { date: "2026-10-03", hijriDate: "20 Rabiul Awal 1448 H", sunrise: "05:38", prayers: [{ name: "Subuh", arabic: "الفجر", time: "04:45", isCurrent: false, isNext: false }, { name: "Dzuhur", arabic: "الظهر", time: "11:52", isCurrent: false, isNext: false }, { name: "Ashar", arabic: "العصر", time: "15:12", isCurrent: false, isNext: false }, { name: "Maghrib", arabic: "المغرب", time: "17:58", isCurrent: false, isNext: false }, { name: "Isya", arabic: "العشاء", time: "19:08", isCurrent: false, isNext: false }] },
];

export const financialSummary: FinancialSummary = {
  currentBalance: 87450000,
  monthlyIncome: 74500000,
  monthlyExpense: 22350000,
  yearlyIncome: 342100000,
  yearlyExpense: 189200000,
  lastUpdated: "2026-09-27T06:00:00Z",
};

export const chartData: ChartDataPoint[] = [
  { period: "Jan 2026", income: 28500000, expense: 15200000, balance: 13300000 },
  { period: "Feb 2026", income: 31200000, expense: 18900000, balance: 12300000 },
  { period: "Mar 2026", income: 45800000, expense: 22100000, balance: 23700000 },
  { period: "Apr 2026", income: 38900000, expense: 19500000, balance: 19400000 },
  { period: "Mei 2026", income: 42100000, expense: 21800000, balance: 20300000 },
  { period: "Jun 2026", income: 35600000, expense: 17400000, balance: 18200000 },
  { period: "Jul 2026", income: 48200000, expense: 23500000, balance: 24700000 },
  { period: "Agu 2026", income: 41800000, expense: 19800000, balance: 22000000 },
  { period: "Sep 2026", income: 74500000, expense: 22350000, balance: 52150000 },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getCategoryColor(categoryId: string): string {
  return categoryMap.get(categoryId)?.color || "oklch(0.42 0.12 162)";
}

export function getCategoryIcon(categoryId: string): string {
  return categoryMap.get(categoryId)?.icon || "circle";
}

export const officials: Official[] = [
  {
    id: "off-1",
    name: "Dr. KH. M. Syarif Hidayat, M.A.",
    role: "Ketua DKM (Dewan Kemakmuran Masjid)",
    systemRole: "superadmin",
    phone: "0812-3456-7890",
    email: "kh.syarif@masjidarrahman.or.id",
    status: "active",
    joinedDate: "2021-01-15",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "off-2",
    name: "H. Bambang Prasetyo, S.E.",
    role: "Wakil Ketua DKM",
    systemRole: "admin",
    phone: "0813-9876-5432",
    email: "bambang.prasetyo@masjidarrahman.or.id",
    status: "active",
    joinedDate: "2021-02-01",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "off-3",
    name: "Ust. Ahmad Fauzi, S.E.I.",
    role: "Bendahara Utama",
    systemRole: "bendahara",
    phone: "0811-2233-4455",
    email: "ahmad.fauzi@masjidarrahman.or.id",
    status: "active",
    joinedDate: "2022-03-10",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "off-4",
    name: "Ust. Abdullah Zulkarnaen, S.Pd.I.",
    role: "Sekretaris & Bidang Dakwah",
    systemRole: "admin",
    phone: "0815-6677-8899",
    email: "abdullah.z@masjidarrahman.or.id",
    status: "active",
    joinedDate: "2022-04-01",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "off-5",
    name: "Ust. Hilman Nurhakim, Lc.",
    role: "Imam Besar & Koordinator Kajian",
    systemRole: "pengurus",
    phone: "0821-1122-3344",
    email: "hilman.nur@masjidarrahman.or.id",
    status: "active",
    joinedDate: "2020-08-17",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "off-6",
    name: "Ust. Bilal Ramadan",
    role: "Muadzin Utama & Pembina Remaja",
    systemRole: "pengurus",
    phone: "0857-4455-6677",
    email: "bilal.ramadan@masjidarrahman.or.id",
    status: "active",
    joinedDate: "2023-01-10",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "off-7",
    name: "H. Suryadi",
    role: "Koordinator Sarana & Pemeliharaan",
    systemRole: "pengurus",
    phone: "0812-7788-9900",
    email: "suryadi.sarpras@masjidarrahman.or.id",
    status: "active",
    joinedDate: "2021-06-01",
    avatar: "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "off-8",
    name: "Pak Solihin",
    role: "Marbot & Kebersihan",
    systemRole: "pengurus",
    phone: "0878-1122-4466",
    email: "solihin@masjidarrahman.or.id",
    status: "active",
    joinedDate: "2019-11-01",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
  },
];