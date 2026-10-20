"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApi, apiSend } from "@/lib/api";
import { downloadTextFile, todayISO, DEFAULT_TIME_ZONE } from "@/lib/utils";
import { DataSkeleton } from "@/components/DataSkeleton";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import type { MosqueProfile, AppConfig } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

// Form kosong untuk masjid yang profilnya belum pernah diisi admin.
// Bukan data contoh — semua kolom wajib dilengkapi sebelum disimpan.
const EMPTY_PROFILE: MosqueProfile = {
  name: "",
  shortName: "",
  address: "",
  phone: "",
  email: "",
  latitude: 0,
  longitude: 0,
  timezone: "Asia/Jakarta",
  establishedYear: new Date().getFullYear(),
  description: "",
  logoUrl: "",
  coverImageUrl: "",
  heroImages: [],
};

const EMPTY_CONFIG: AppConfig = {
  bankName: "",
  accountNumber: "",
  accountHolder: "",
  minBalanceAlert: 0,
  publicTransparency: true,
  showDonationQRIS: true,
  qrisImageUrl: "",
};
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mosque,
  Bank,
  SlidersHorizontal,
  ShieldCheck,
  CheckCircle,
  FloppyDisk,
  DownloadSimple,
  UploadSimple,
  LockKey,
  Image as ImageIcon,
  Trash,
  Plus,
  Sparkle,
  SignOut,
} from "@phosphor-icons/react";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const {
    data: fetchedProfile,
    error: profileLoadError,
    errorStatus: profileLoadStatus,
    refresh: refreshProfile,
  } = useApi<MosqueProfile>("/api/mosque-profile");
  const {
    data: fetchedConfig,
    error: configLoadError,
    errorStatus: configLoadStatus,
    refresh: refreshConfig,
  } = useApi<AppConfig>("/api/config");
  // Pola "draft atau data server": sebelum pengurus mengubah apa pun, form
  // memakai data terbaru dari server; begitu ada perubahan, draft mengambil
  // alih. Tidak ada effect yang menyalin data ke state → tidak ada render ganda
  // dan tidak ada nilai basi saat server mengirim versi baru.
  const [profileDraft, setProfileDraft] = useState<MosqueProfile | null>(null);
  // HANYA 404 yang berarti "profil belum pernah diisi". Galat lain (401, 500,
  // jaringan putus) tidak boleh menampilkan form kosong — kalau disimpan, form
  // kosong itu bisa menimpa data yang sebenarnya masih ada.
  const blankProfile = profileLoadStatus === 404;
  const profile = profileDraft ?? fetchedProfile ?? (blankProfile ? { ...EMPTY_PROFILE } : null);
  const timeZone = profile?.timezone?.trim() || DEFAULT_TIME_ZONE;
  const setProfile = setProfileDraft;
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Konfigurasi rekening & preferensi — tersimpan di database (/api/config).
  const [configDraft, setConfigDraft] = useState<AppConfig | null>(null);
  const financeConfig = configDraft ?? fetchedConfig ?? { ...EMPTY_CONFIG };
  const setFinanceConfig = setConfigDraft;
  const [isSavingFinance, setIsSavingFinance] = useState(false);
  const [financeError, setFinanceError] = useState<string | null>(null);

  // Draft teks untuk kolom angka. Dulu kolom ini menulis langsung ke state
  // `number` lewat `parseFloat(...) || 0`, sehingga (a) mengosongkan kolom
  // diam-diam menjadi 0 dan (b) mengetik "0" ikut terhapus karena nilai
  // tersimpan dinilai kosong (`0 || ""`). Sekarang teks mentahnya ditahan di
  // sini dan baru dikonversi saat disimpan (atau saat tombol Simpan ditekan).
  const [numDrafts, setNumDrafts] = useState<Record<string, string>>({});

  /** Teks yang ditampilkan di kolom angka: draft mentah, atau nilai tersimpan. */
  const numText = (key: string, stored: number) =>
    numDrafts[key] ?? (Number.isFinite(stored) ? String(stored) : "");

  /** Draft → angka. Kosong/bukan angka → null (tidak diam-diam menjadi 0). */
  const numValue = (key: string, stored: number): number | null => {
    const raw = numDrafts[key];
    if (raw === undefined) return stored;
    const parsed = Number.parseFloat(raw.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  };

  const draftNumber = (key: string, raw: string) =>
    setNumDrafts((drafts) => ({ ...drafts, [key]: raw }));

  // Security Form State
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const router = useRouter();

  // Spanduk peringatan kata sandi bawaan (lihat `AdminLayout`) menautkan ke
  // ?tab=security → langsung buka tab Keamanan agar pengurus tidak mencari-cari.
  // Dibaca setelah mount dan dijadwalkan (bukan di badan effect) supaya HTML
  // server dan klien tetap identik.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") !== "security") return;
    const id = setTimeout(() => setActiveTab("security"), 0);
    return () => clearTimeout(id);
  }, []);

  // Backup: unduh seluruh data (transaksi, berita, kegiatan, pengurus,
  // profil, konfigurasi) sebagai satu file JSON untuk kebutuhan audit.
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);

  const handleExportBackup = async () => {
    setIsExportingBackup(true);
    setBackupError(null);
    try {
      const paths = ["transactions", "categories", "announcements", "activities", "officials", "mosque-profile", "config"];
      const backup: Record<string, unknown> = { exportedAt: new Date().toISOString() };
      for (const p of paths) {
        const res = await fetch(`/api/${p}`, { cache: "no-store" });
        const data = await res.json().catch(() => null);
        // 404 = bagian data belum pernah diisi (mis. profil) — catat null.
        if (!res.ok && res.status !== 404) throw new Error(`Gagal mengambil data ${p}.`);
        backup[p] = res.ok ? data : null;
      }
      const date = todayISO(timeZone);
      downloadTextFile(`backup-masjid-${date}.json`, JSON.stringify(backup, null, 2), "application/json");
    } catch (err) {
      setBackupError(err instanceof Error ? err.message : "Gagal mengekspor cadangan.");
    } finally {
      setIsExportingBackup(false);
    }
  };
  // Unggah banner: pilih file dari perangkat → unggah ke server → masuk daftar.
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [heroUploadError, setHeroUploadError] = useState<string | null>(null);

  const handlePickHeroFile = (file: File | null) => {
    setHeroUploadError(null);
    if (heroPreview) URL.revokeObjectURL(heroPreview);
    if (!file) {
      setHeroFile(null);
      setHeroPreview(null);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setHeroUploadError("Format file harus JPG, PNG, WebP, atau GIF.");
      setHeroFile(null);
      setHeroPreview(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setHeroUploadError("Ukuran file maksimal 5 MB.");
      setHeroFile(null);
      setHeroPreview(null);
      return;
    }
    setHeroFile(file);
    setHeroPreview(URL.createObjectURL(file));
  };

  const handleUploadHero = async () => {
    if (!heroFile || !profile) return;
    setIsUploadingHero(true);
    setHeroUploadError(null);
    try {
      const form = new FormData();
      form.append("file", heroFile);
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Gagal mengunggah foto.");
      setProfile({
        ...profile,
        heroImages: [...(profile.heroImages || []), data.url as string],
      });
      if (heroPreview) URL.revokeObjectURL(heroPreview);
      setHeroFile(null);
      setHeroPreview(null);
    } catch (err) {
      setHeroUploadError(err instanceof Error ? err.message : "Gagal mengunggah foto.");
    } finally {
      setIsUploadingHero(false);
    }
  };

  const handleRemoveHeroImage = (indexToRemove: number) => {
    if (!profile) return;
    const currentImages = profile.heroImages || [];
    setProfile({
      ...profile,
      heroImages: currentImages.filter((_, i) => i !== indexToRemove),
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    // Angka diambil dari draft teks (bukan dari `|| 0` di input): kosong =
    // ditolak dengan pesan jelas, jadi tidak pernah tersimpan sebagai 0
    // yang membuat "belum diisi" tak terbedakan dari titik 0.
    const latitude = numValue("latitude", profile.latitude);
    const longitude = numValue("longitude", profile.longitude);
    const establishedYear = numValue("establishedYear", profile.establishedYear);
    if (latitude === null || longitude === null) {
      setProfileError("Garis lintang dan garis bujur wajib diisi berupa angka (mis. -6.2 dan 106.8).");
      return;
    }
    if (establishedYear === null) {
      setProfileError("Tahun berdiri wajib diisi berupa angka (mis. 2019).");
      return;
    }
    setIsSavingProfile(true);
    setProfileError(null);
    try {
      const saved = await apiSend<MosqueProfile>("/api/mosque-profile", "PUT", {
        ...profile,
        latitude,
        longitude,
        establishedYear,
        logoUrl: profile.logoUrl ?? "",
        coverImageUrl: profile.coverImageUrl ?? "",
        heroImages: profile.heroImages ?? [],
      });
      setProfile(saved);
      // Draft dibuang supaya kolom menampilkan nilai yang benar-benar tersimpan.
      setNumDrafts({});
      refreshProfile();
      // Beri tahu Sidebar agar logo baru langsung tampil tanpa reload.
      window.dispatchEvent(new CustomEvent("mosque-profile-updated"));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Gagal menyimpan profil masjid.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    // Kosong = tanpa peringatan (0), tetapi angka yang tidak sah ditolak —
    // dulu `Number(...) || 0` mengubah salah ketik apa pun menjadi 0 diam-diam.
    const minBalanceAlert = numValue("minBalanceAlert", financeConfig.minBalanceAlert);
    if (minBalanceAlert === null || minBalanceAlert < 0) {
      setFinanceError("Batas saldo minimal harus berupa angka 0 atau lebih.");
      return;
    }
    setIsSavingFinance(true);
    setFinanceError(null);
    try {
      const saved = await apiSend<AppConfig>("/api/config", "PUT", {
        ...financeConfig,
        minBalanceAlert,
      });
      setFinanceConfig(saved);
      setNumDrafts({});
      refreshConfig();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setFinanceError(err instanceof Error ? err.message : "Gagal menyimpan konfigurasi.");
    } finally {
      setIsSavingFinance(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityForm.currentPassword || !securityForm.newPassword) return;
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityError("Konfirmasi kata sandi baru tidak sama.");
      return;
    }
    if (securityForm.newPassword.length < 8) {
      setSecurityError("Kata sandi baru minimal 8 karakter.");
      return;
    }
    setIsSavingSecurity(true);
    setSecurityError(null);
    try {
      await apiSend("/api/admin/password", "PUT", {
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });
      setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : "Gagal memperbarui kata sandi.");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  // Cabut sesi di SEMUA perangkat. Logout biasa hanya menghapus cookie di
  // peramban ini; endpoint `?all=1` merotasi secret sesi sehingga token yang
  // terlanjur tersalin (backup, komputer lain, HP hilang) langsung mati.
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const handleRevokeSessions = async () => {
    setIsRevokingSessions(true);
    setRevokeError(null);
    try {
      await apiSend("/api/admin/session?all=1", "DELETE");
      router.replace("/admin/login");
      router.refresh();
    } catch (err) {
      setRevokeError(err instanceof Error ? err.message : "Gagal mencabut sesi.");
      setIsRevokingSessions(false);
    }
  };

  if (profileLoadError && !blankProfile) {
    const needsLogin = profileLoadStatus === 401 || profileLoadStatus === 403;
    return (
      <div className="space-y-6">
        <PageHeader title="Pengaturan" description="Profil masjid, rekening, dan preferensi" />
        <AdminErrorState
          title="Gagal memuat profil masjid"
          message={profileLoadError}
          actionHref={needsLogin ? "/admin/login?next=/admin/settings" : undefined}
          actionLabel={needsLogin ? "Masuk kembali" : undefined}
        />
      </div>
    );
  }

  if (configLoadError) {
    const needsLogin = configLoadStatus === 401 || configLoadStatus === 403;
    return (
      <div className="space-y-6">
        <PageHeader title="Pengaturan" description="Profil masjid, rekening, dan preferensi" />
        <AdminErrorState
          title="Gagal memuat konfigurasi"
          message={configLoadError}
          actionHref={needsLogin ? "/admin/login?next=/admin/settings" : undefined}
          actionLabel={needsLogin ? "Masuk kembali" : undefined}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6" aria-label="Memuat pengaturan">
        <DataSkeleton lines={2} className="max-w-md" />
        <DataSkeleton lines={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Pengaturan Sistem"
        description="Konfigurasi profil masjid, rekening donasi, transparansi publik, dan keamanan akun"
      />

      {/* Success Notification Alert */}
      {isSaved && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-300 text-sm animate-in fade-in duration-300">
          <div className="flex min-w-0 items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Perubahan pengaturan berhasil disimpan dan diterapkan!</span>
          </div>
          <button
            onClick={() => setIsSaved(false)}
            className="shrink-0 text-xs font-semibold hover:underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-2xl bg-muted/60 p-1 border border-border">
          <TabsTrigger value="profile" className="gap-2 text-xs sm:text-sm">
            <Mosque className="w-4 h-4" />
            <span>Profil Masjid</span>
          </TabsTrigger>
          <TabsTrigger value="finance" className="gap-2 text-xs sm:text-sm">
            <Bank className="w-4 h-4" />
            <span>Rekening Bank</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2 text-xs sm:text-sm">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Preferensi</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 text-xs sm:text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Keamanan</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PROFIL MASJID */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Informasi Profil Masjid</CardTitle>
              <CardDescription>
                Data identitas ini ditampilkan pada landing page publik dan laporan keuangan resmi masjid.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blankProfile && (
                <p className="mb-4 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[13px] font-medium text-amber-800 dark:text-amber-200">
                  Profil masjid belum pernah diisi. Lengkapi seluruh kolom lalu simpan —
                  data tampil di halaman publik.
                </p>
              )}
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* ── Bagian 1: Logo ─────────────────────────────────── */}
                <section aria-labelledby="profil-logo-heading" className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                    <div className="min-w-0">
                      <h3 id="profil-logo-heading" className="text-sm font-bold text-foreground">
                        1. Logo Masjid
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Logo tampil kecil di pojok kiri atas sidebar admin dan halaman publik.
                      </p>
                      <div className="mt-3">
                        <ImageUploadField
                          label="File logo"
                          description="Pilih file → klik Unggah logo → jangan lupa Simpan Profil di bawah."
                          value={profile.logoUrl ?? ""}
                          onChange={(url) => setProfile({ ...profile, logoUrl: url })}
                          variant="logo"
                        />
                      </div>
                    </div>
                    {/* Pratinjau langsung: persis seperti di sidebar */}
                    <div className="rounded-xl border border-border bg-card p-3">
                      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                        Pratinjau sidebar
                      </p>
                      <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5">
                        {profile.logoUrl ? (
                          <img
                            src={profile.logoUrl}
                            alt="Pratinjau logo sidebar"
                            className="h-8 w-8 shrink-0 rounded-lg border border-border bg-white object-contain p-0.5"
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                            {(profile.shortName || profile.name || "M").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="truncate text-sm font-semibold text-foreground">
                          {profile.shortName || profile.name || "Nama Masjid"}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                        {profile.logoUrl
                          ? "Seperti ini logo akan terlihat di sidebar."
                          : "Belum ada logo — sidebar memakai inisial nama."}
                      </p>
                    </div>
                  </div>
                </section>

                {/* ── Bagian 2: Identitas ────────────────────────────── */}
                <section aria-labelledby="profil-identitas-heading" className="space-y-4">
                  <div>
                    <h3 id="profil-identitas-heading" className="text-sm font-bold text-foreground">
                      2. Identitas Masjid
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Nama ini tampil besar di halaman depan publik dan laporan resmi.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="profil-name" className="text-xs font-semibold text-foreground">
                      Nama Lengkap Masjid <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="profil-name"
                      type="text"
                      placeholder="Contoh: Masjid Ar-Rahman"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/60"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="profil-short" className="text-xs font-semibold text-foreground">
                      Nama Singkat / Panggilan
                    </label>
                    <input
                      id="profil-short"
                      type="text"
                      placeholder="Contoh: Ar-Rahman"
                      value={profile.shortName}
                      onChange={(e) =>
                        setProfile({ ...profile, shortName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/60"
                    />
                    <p className="text-[11px] text-muted-foreground">Dipakai di sidebar agar pendek dan rapi.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="profil-year" className="text-xs font-semibold text-foreground">
                      Tahun Berdiri
                    </label>
                    <input
                      id="profil-year"
                      type="number"
                      min={1900}
                      max={2100}
                      placeholder="Contoh: 2019"
                      value={numText("establishedYear", profile.establishedYear)}
                      onChange={(e) => {
                        draftNumber("establishedYear", e.target.value);
                        const v = parseInt(e.target.value, 10);
                        // Kosong → 0 agar validasi simpan menolak dengan pesan
                        // jelas, bukan diam-diam jadi tahun berjalan.
                        setProfile({
                          ...profile,
                          establishedYear: Number.isFinite(v) ? v : 0,
                        });
                      }}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="profil-desc" className="text-xs font-semibold text-foreground">
                      Deskripsi & Sejarah Singkat Masjid
                    </label>
                    <textarea
                      id="profil-desc"
                      rows={4}
                      placeholder="Contoh: Masjid Ar-Rahman terletak di utara Stadion Supriyadi, diresmikan tahun 2019…"
                      value={profile.description}
                      onChange={(e) =>
                        setProfile({ ...profile, description: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none placeholder:text-muted-foreground/60"
                    />
                    <p className="text-[11px] text-muted-foreground">Tampil di halaman depan, di bawah nama masjid.</p>
                  </div>
                  </div>
                </section>

                {/* ── Bagian 3: Kontak & alamat ──────────────────────── */}
                <section aria-labelledby="profil-kontak-heading" className="space-y-4 border-t border-border pt-5">
                  <div>
                    <h3 id="profil-kontak-heading" className="text-sm font-bold text-foreground">
                      3. Kontak & Alamat
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Dipakai jamaah untuk menghubungi dan menemukan lokasi masjid.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="profil-phone" className="text-xs font-semibold text-foreground">
                      Nomor Telepon / WhatsApp Sekretariat
                    </label>
                    <input
                      id="profil-phone"
                      type="text"
                      inputMode="tel"
                      placeholder="Contoh: 0857-0718-5783"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/60"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="profil-email" className="text-xs font-semibold text-foreground">
                      Email Resmi DKM
                    </label>
                    <input
                      id="profil-email"
                      type="email"
                      placeholder="Contoh: takmir@arrahman.id"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/60"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="profil-address" className="text-xs font-semibold text-foreground">
                      Alamat Lengkap Masjid
                    </label>
                    <input
                      id="profil-address"
                      type="text"
                      placeholder="Contoh: Jl. Ciliwung No.2, Bendo, Kepanjenkidul, Kota Blitar 66116"
                      value={profile.address}
                      onChange={(e) =>
                        setProfile({ ...profile, address: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/60"
                    />
                  </div>
                  </div>
                </section>

                  {/* ── Bagian 4: Lokasi (jadwal sholat otomatis) ─────── */}
                  <section aria-labelledby="profil-lokasi-heading" className="space-y-3 border-t border-border pt-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 id="profil-lokasi-heading" className="text-sm font-bold text-foreground">
                          4. Lokasi Masjid
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Lokasi ini dipakai untuk menghitung jadwal sholat otomatis setiap hari.
                        </p>
                      </div>
                      <a
                        href="https://www.google.com/maps"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                      >
                        Buka Google Maps →
                      </a>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label htmlFor="profil-lat" className="text-xs font-semibold text-foreground">
                          Garis Lintang <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="profil-lat"
                          type="text"
                          inputMode="decimal"
                          placeholder="-8,09"
                          value={numText("latitude", profile.latitude)}
                          onChange={(e) => {
                            draftNumber("latitude", e.target.value);
                            const v = parseFloat(e.target.value.replace(",", "."));
                            if (Number.isFinite(v)) setProfile({ ...profile, latitude: v });
                          }}
                          className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="profil-lng" className="text-xs font-semibold text-foreground">
                          Garis Bujur <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="profil-lng"
                          type="text"
                          inputMode="decimal"
                          placeholder="112,16"
                          value={numText("longitude", profile.longitude)}
                          onChange={(e) => {
                            draftNumber("longitude", e.target.value);
                            const v = parseFloat(e.target.value.replace(",", "."));
                            if (Number.isFinite(v)) setProfile({ ...profile, longitude: v });
                          }}
                          className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="profil-tz" className="text-xs font-semibold text-foreground">
                          Zona Waktu
                        </label>
                        <select
                          id="profil-tz"
                          value={profile.timezone}
                          onChange={(e) =>
                            setProfile({ ...profile, timezone: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="Asia/Jakarta">WIB — Asia/Jakarta</option>
                          <option value="Asia/Makassar">WITA — Asia/Makassar</option>
                          <option value="Asia/Jayapura">WIT — Asia/Jayapura</option>
                        </select>
                      </div>
                    </div>
                    <p className="rounded-lg bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                      Cara isi: buka Google Maps → klik kanan tepat di masjid → klik angka koordinat untuk menyalin.
                      Angka pertama = lintang, kedua = bujur. Contoh Blitar: -8,09 dan 112,16.
                    </p>
                  </section>

                  {/* ── Bagian 5: Foto halaman depan ─────────────────── */}
                  <section aria-labelledby="profil-foto-heading" className="space-y-3 border-t border-border pt-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h3 id="profil-foto-heading" className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                          <ImageIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                          5. Foto Halaman Depan
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Foto latar di bagian sambutan website publik. 1 foto = diam, lebih dari 1 = geser otomatis.
                        </p>
                      </div>
                      <div>
                        {(profile.heroImages?.length || 0) > 1 ? (
                          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 gap-1 text-xs">
                            <Sparkle className="w-3 h-3" />
                            Mode Slider Aktif ({profile.heroImages?.length} foto)
                          </Badge>
                        ) : (profile.heroImages?.length || 0) === 1 ? (
                          <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
                            Mode Statis (1 foto saja, tidak slide)
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs text-muted-foreground">
                            Tanpa Foto Banner
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Current Images Grid */}
                    {(profile.heroImages || []).length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(profile.heroImages || []).map((imgUrl, idx) => (
                          <div
                            key={idx}
                            className="relative group rounded-xl overflow-hidden border border-border bg-muted/30 aspect-video shadow-xs"
                          >
                            <img
                              src={imgUrl}
                              alt={`Banner ${idx + 1}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-3">
                              <span className="text-xs font-semibold text-white drop-shadow">
                                Foto #{idx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveHeroImage(idx)}
                                className="w-8 h-8 rounded-lg bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                                title="Hapus foto ini"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Unggah foto baru dari perangkat */}
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label className="inline-flex h-9 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                          <UploadSimple className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                          <span className="truncate">
                            {heroFile ? heroFile.name : "Pilih foto dari perangkat…"}
                          </span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={(e) => handlePickHeroFile(e.target.files?.[0] ?? null)}
                          />
                        </label>
                        {heroPreview && (
                          <img
                            src={heroPreview}
                            alt="Pratinjau foto banner"
                            className="h-12 w-20 shrink-0 rounded-lg border border-border object-cover"
                          />
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleUploadHero}
                          disabled={!heroFile || isUploadingHero}
                          className="gap-1.5 shrink-0 text-xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>{isUploadingHero ? "Mengunggah..." : "Unggah Foto"}</span>
                        </Button>
                      </div>
                      {heroUploadError && (
                        <p role="alert" className="text-xs font-medium text-destructive">
                          {heroUploadError}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        Format JPG, PNG, WebP, atau GIF — maksimal 5 MB. Foto tersimpan
                        di server dan tampil setelah profil disimpan.
                      </p>
                    </div>

                    {/* Foto sampul — dulu hanya bisa diisi lewat API sehingga
                        selalu kosong (Hero memakainya sebagai fallback foto). */}
                    <div className="rounded-xl border border-border bg-card p-3">
                      <ImageUploadField
                        label="Foto sampul (opsional)"
                        description="Gambar utama yang dipakai sebagai cadangan bila foto banner belum ada."
                        value={profile.coverImageUrl ?? ""}
                        onChange={(url) => setProfile({ ...profile, coverImageUrl: url })}
                        variant="banner"
                      />
                    </div>

                    <div className="rounded-lg border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
                      💡 <strong>Cara kerja:</strong> <strong>1 foto</strong> = tampil diam.
                      <strong> Lebih dari 1 foto</strong> = otomatis jadi slide yang bergeser sendiri
                      di halaman depan.
                    </div>
                  </section>

                {profileError && (
                  <p
                    role="alert"
                    className="rounded-lg border border-destructive/25 bg-destructive/6 px-3 py-2 text-sm font-medium text-destructive"
                  >
                    {profileError}
                  </p>
                )}

                <div className="flex flex-col gap-2 rounded-xl border border-primary/25 bg-primary/5 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Selesai mengisi? Klik <strong className="text-foreground">Simpan Profil</strong> agar
                    logo, nama, dan foto tampil di website & sidebar.
                  </p>
                  <Button type="submit" className="gap-2 sm:min-w-40" disabled={isSavingProfile}>
                    <FloppyDisk className="h-4 w-4" />
                    <span>{isSavingProfile ? "Menyimpan..." : "Simpan Profil"}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: REKENING BANK & QRIS */}
        <TabsContent value="finance" className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Rekening Bank & QRIS Donasi</CardTitle>
              <CardDescription>
                Nomor rekening resmi dan kode QRIS untuk penerimaan infak, sedekah, dan wakaf jamaah.
                Kelola jenis kas masuk & keluar lewat menu Kategori Kas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveFinance} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="finance-bank-name" className="text-xs font-semibold text-foreground">
                      Nama Bank
                    </label>
                    <input
                      id="finance-bank-name"
                      type="text"
                      value={financeConfig.bankName}
                      onChange={(e) =>
                        setFinanceConfig({ ...financeConfig, bankName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="finance-account-number" className="text-xs font-semibold text-foreground">
                      Nomor Rekening
                    </label>
                    <input
                      id="finance-account-number"
                      type="text"
                      value={financeConfig.accountNumber}
                      onChange={(e) =>
                        setFinanceConfig({
                          ...financeConfig,
                          accountNumber: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="finance-account-holder" className="text-xs font-semibold text-foreground">
                      Atas Nama Rekening
                    </label>
                    <input
                      id="finance-account-holder"
                      type="text"
                      value={financeConfig.accountHolder}
                      onChange={(e) =>
                        setFinanceConfig({
                          ...financeConfig,
                          accountHolder: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="finance-min-balance" className="text-xs font-semibold text-foreground">
                      Batas Saldo Kas Minimal untuk Peringatan (IDR)
                    </label>
                    <input
                      id="finance-min-balance"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={numText("minBalanceAlert", financeConfig.minBalanceAlert)}
                      onChange={(e) => {
                        draftNumber("minBalanceAlert", e.target.value);
                        const v = parseInt(e.target.value, 10);
                        if (Number.isFinite(v)) {
                          setFinanceConfig({ ...financeConfig, minBalanceAlert: v });
                        }
                      }}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      Sistem akan memberikan notifikasi peringatan jika saldo kas masjid berada di bawah nilai ini.
                    </span>
                  </div>

                  <div className="space-y-1.5 md:col-span-2 pt-3 border-t border-border">
                    <ImageUploadField
                      label="Foto / Gambar Kode QRIS Donasi (opsional)"
                      description="Unggah foto kode QRIS resmi masjid (JPG, PNG, WebP). Akan ditampilkan di blok donasi jamaah."
                      value={financeConfig.qrisImageUrl ?? ""}
                      onChange={(url) => setFinanceConfig({ ...financeConfig, qrisImageUrl: url })}
                      variant="logo"
                    />
                  </div>
                </div>

                {financeError && (
                  <p
                    role="alert"
                    className="rounded-lg border border-destructive/25 bg-destructive/6 px-3 py-2 text-sm font-medium text-destructive"
                  >
                    {financeError}
                  </p>
                )}

                <div className="pt-3 flex justify-end">
                  <Button type="submit" className="gap-2" disabled={isSavingFinance}>
                    <FloppyDisk className="w-4 h-4" />
                    <span>{isSavingFinance ? "Menyimpan..." : "Simpan Rekening"}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: PREFERENSI & TRANSPARANSI */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Preferensi & Tampilan Publik</CardTitle>
              <CardDescription>
                Atur fitur transparansi publik yang dapat diakses oleh jamaah melalui landing page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                  <div className="min-w-0">
                    <h4 id="pref-transparency-label" className="text-sm font-semibold text-foreground">
                      Publikasi Saldo Kas Real-time
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tampilkan nominal saldo kas masjid secara transparan di halaman utama publik
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    aria-labelledby="pref-transparency-label"
                    checked={financeConfig.publicTransparency}
                    onChange={(e) =>
                      setFinanceConfig({
                        ...financeConfig,
                        publicTransparency: e.target.checked,
                      })
                    }
                    className="w-4 h-4 shrink-0 rounded text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-muted/40 border border-border">
                  <div className="min-w-0">
                    <h4 id="pref-qris-label" className="text-sm font-semibold text-foreground">
                      Tampilkan Kanal Donasi (Rekening & QRIS)
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Izinkan jamaah melihat rekening donasi dan memindai kode QRIS masjid di halaman publik
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    aria-labelledby="pref-qris-label"
                    checked={financeConfig.showDonationQRIS}
                    onChange={(e) =>
                      setFinanceConfig({
                        ...financeConfig,
                        showDonationQRIS: e.target.checked,
                      })
                    }
                    className="w-4 h-4 shrink-0 rounded text-primary focus:ring-primary cursor-pointer"
                  />
                </div>
              </div>

              {financeError && (
                <p
                  role="alert"
                  className="rounded-lg border border-destructive/25 bg-destructive/6 px-3 py-2 text-sm font-medium text-destructive"
                >
                  {financeError}
                </p>
              )}

              <div className="flex justify-end">
                <Button onClick={handleSaveFinance} className="gap-2" disabled={isSavingFinance}>
                  <FloppyDisk className="w-4 h-4" />
                  <span>{isSavingFinance ? "Menyimpan..." : "Simpan Preferensi"}</span>
                </Button>
              </div>

              {/* Backup & Export Data */}
              <div className="pt-4 border-t border-border space-y-3">
                <h4 className="text-sm font-bold text-foreground">
                  Cadangkan & Ekspor Data (Backup)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Simpan cadangan data keuangan, jadwal kegiatan, dan pengurus untuk kebutuhan audit.
                </p>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleExportBackup}
                    disabled={isExportingBackup}
                  >
                    <DownloadSimple className="w-4 h-4" />
                    <span>{isExportingBackup ? "Mengekspor..." : "Ekspor Database (JSON)"}</span>
                  </Button>
                </div>
                {backupError && (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {backupError}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Berkas JSON berisi seluruh data dan dapat dibuka di teks editor untuk audit.
                  Simpan di tempat aman — berkas ini memuat seluruh database.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: KEAMANAN & AKUN */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Keamanan & Kata Sandi</CardTitle>
              <CardDescription>
                Ubah kata sandi akun administrator untuk menjaga keamanan data keuangan masjid.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSecurity} className="space-y-4 max-w-lg">
                {securityError && (
                  <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/6 px-3 py-2 text-sm font-medium text-destructive">
                    {securityError}
                  </p>
                )}
                <div className="space-y-1.5">
                  <label htmlFor="security-current" className="text-xs font-semibold text-foreground">
                    Kata Sandi Saat Ini
                  </label>
                  <input
                    id="security-current"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={securityForm.currentPassword}
                    onChange={(e) =>
                      setSecurityForm({
                        ...securityForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="security-new" className="text-xs font-semibold text-foreground">
                    Kata Sandi Baru
                  </label>
                  <input
                    id="security-new"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Minimal 8 karakter..."
                    value={securityForm.newPassword}
                    onChange={(e) =>
                      setSecurityForm({
                        ...securityForm,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="security-confirm" className="text-xs font-semibold text-foreground">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <input
                    id="security-confirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Ulangi kata sandi baru..."
                    value={securityForm.confirmPassword}
                    onChange={(e) =>
                      setSecurityForm({
                        ...securityForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="pt-3">
                  <Button
                    type="submit"
                    className="gap-2"
                    disabled={
                      isSavingSecurity ||
                      !securityForm.currentPassword ||
                      !securityForm.newPassword ||
                      securityForm.newPassword !== securityForm.confirmPassword
                    }
                  >
                    <LockKey className="w-4 h-4" />
                    <span>{isSavingSecurity ? "Menyimpan..." : "Perbarui Kata Sandi"}</span>
                  </Button>
                </div>
              </form>

              {/* Pencabutan sesi lintas perangkat — pelengkap tombol Keluar. */}
              <div className="mt-6 border-t border-border pt-5">
                <h4 className="text-sm font-semibold text-foreground">Keluar dari semua perangkat</h4>
                <p className="mt-0.5 max-w-[70ch] text-xs leading-relaxed text-muted-foreground">
                  Pakai bila kata sandi pernah terlihat orang lain, atau Anda lupa di
                  perangkat mana saja masih masuk. Semua sesi — termasuk perangkat ini —
                  akan dicabut dan Anda perlu masuk ulang.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 gap-2"
                  disabled={isRevokingSessions}
                  onClick={handleRevokeSessions}
                >
                  <SignOut className="h-4 w-4" aria-hidden="true" />
                  <span>{isRevokingSessions ? "Mencabut…" : "Cabut semua sesi"}</span>
                </Button>
                {revokeError && (
                  <p role="alert" className="mt-2 text-sm font-medium text-destructive">
                    {revokeError}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
