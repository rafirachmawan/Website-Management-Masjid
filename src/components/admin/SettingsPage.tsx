"use client";

import { useState } from "react";
import { useApi, apiSend } from "@/lib/api";
import { DataSkeleton } from "@/components/DataSkeleton";
import type { MosqueProfile, AppConfig } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { CategoryManager } from "@/components/admin/CategoryManager";

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
  heroImages: [],
};

const EMPTY_CONFIG: AppConfig = {
  bankName: "",
  accountNumber: "",
  accountHolder: "",
  minBalanceAlert: 0,
  publicTransparency: true,
  showDonationQRIS: true,
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
  Gear,
  Mosque,
  Bank,
  SlidersHorizontal,
  ShieldCheck,
  CheckCircle,
  FloppyDisk,
  QrCode,
  DownloadSimple,
  UploadSimple,
  LockKey,
  Info,
  Image,
  Trash,
  Plus,
  Sparkle,
} from "@phosphor-icons/react";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { data: fetchedProfile, error: profileLoadError, refresh: refreshProfile } = useApi<MosqueProfile>(
    "/api/mosque-profile",
  );
  const { data: fetchedConfig, refresh: refreshConfig } = useApi<AppConfig>("/api/config");
  const [profile, setProfile] = useState<MosqueProfile | null>(null);
  const [blankTried, setBlankTried] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Profil diambil dari server; bila belum ada (404) tampilkan form kosong
  // agar pengurus langsung bisa mengisi profil pertama. Penyesuaian state
  // dilakukan saat render (bukan di effect) agar tidak memicu render beruntun.
  if (fetchedProfile && !profile) setProfile(fetchedProfile);
  else if (profileLoadError && !profile && !blankTried) {
    setProfile({ ...EMPTY_PROFILE });
    setBlankTried(true);
  }
  const [isSaved, setIsSaved] = useState(false);

  // Konfigurasi rekening & preferensi — tersimpan di database (/api/config).
  const [financeConfig, setFinanceConfig] = useState<AppConfig>({ ...EMPTY_CONFIG });
  const [configLoaded, setConfigLoaded] = useState(false);
  const [isSavingFinance, setIsSavingFinance] = useState(false);
  const [financeError, setFinanceError] = useState<string | null>(null);

  if (fetchedConfig && !configLoaded) {
    setFinanceConfig({ ...fetchedConfig });
    setConfigLoaded(true);
  }

  // Security Form State
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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
    setIsSavingProfile(true);
    setProfileError(null);
    try {
      const saved = await apiSend<MosqueProfile>("/api/mosque-profile", "PUT", {
        ...profile,
        logoUrl: profile.logoUrl ?? "",
        coverImageUrl: profile.coverImageUrl ?? "",
        heroImages: profile.heroImages ?? [],
      });
      setProfile(saved);
      refreshProfile();
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
    setIsSavingFinance(true);
    setFinanceError(null);
    try {
      const saved = await apiSend<AppConfig>("/api/config", "PUT", {
        ...financeConfig,
        minBalanceAlert: Number(financeConfig.minBalanceAlert) || 0,
      });
      setFinanceConfig(saved);
      refreshConfig();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setFinanceError(err instanceof Error ? err.message : "Gagal menyimpan konfigurasi.");
    } finally {
      setIsSavingFinance(false);
    }
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityForm.newPassword && securityForm.newPassword === securityForm.confirmPassword) {
      setIsSaved(true);
      setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

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
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Perubahan pengaturan berhasil disimpan dan diterapkan!</span>
          </div>
          <button
            onClick={() => setIsSaved(false)}
            className="text-xs font-semibold hover:underline"
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
            <span>Rekening & Kas</span>
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
              {blankTried && (
                <p className="mb-4 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[13px] font-medium text-amber-800 dark:text-amber-200">
                  Profil masjid belum pernah diisi. Lengkapi seluruh kolom lalu simpan —
                  data tampil di halaman publik.
                </p>
              )}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Nama Lengkap Masjid <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Nama Singkat / Panggilan
                    </label>
                    <input
                      type="text"
                      value={profile.shortName}
                      onChange={(e) =>
                        setProfile({ ...profile, shortName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Tahun Berdiri
                    </label>
                    <input
                      type="number"
                      value={profile.establishedYear}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          establishedYear: parseInt(e.target.value) || 1985,
                        })
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Nomor Telepon / WhatsApp Sekretariat
                    </label>
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-foreground">
                      Email Resmi DKM
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-foreground">
                      Alamat Lengkap Masjid
                    </label>
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) =>
                        setProfile({ ...profile, address: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Lokasi — menentukan jadwal sholat otomatis */}
                  <div className="space-y-1.5 md:col-span-2">
                    <p className="text-xs font-semibold text-foreground">
                      Lokasi Masjid <span className="font-normal text-muted-foreground">(menentukan jadwal sholat otomatis)</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Garis Lintang <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="-7.56"
                          value={profile.latitude || ""}
                          onChange={(e) =>
                            setProfile({ ...profile, latitude: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Garis Bujur <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="112.01"
                          value={profile.longitude || ""}
                          onChange={(e) =>
                            setProfile({ ...profile, longitude: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Zona Waktu
                        </label>
                        <select
                          value={profile.timezone}
                          onChange={(e) =>
                            setProfile({ ...profile, timezone: e.target.value })
                          }
                          className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                          <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                          <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Lihat titik di Google Maps (klik kanan → salin koordinat), contoh Blitar: -8.09, 112.16.
                    </p>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-foreground">
                      Deskripsi & Sejarah Singkat Masjid
                    </label>
                    <textarea
                      rows={4}
                      value={profile.description}
                      onChange={(e) =>
                        setProfile({ ...profile, description: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  {/* Hero Banner Images Management */}
                  <div className="space-y-3 md:col-span-2 pt-4 border-t border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Image className="w-4 h-4 text-primary" />
                          Foto / Banner Latar Hero Section (Halaman Depan)
                        </label>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Gambar latar belakang transparan pada bagian sambutan utama di website publik.
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

                    <div className="p-3 bg-muted/40 rounded-lg border border-border text-[11px] text-muted-foreground leading-relaxed">
                      💡 <strong>Ketentuan Sistem:</strong> Jika Anda mengunggah <strong>lebih dari 1 foto</strong>, hero section di halaman utama secara otomatis akan menjadi <em>slide carousel transparan</em> yang bergulir halus beserta titik indikator navigasi. Jika <strong>hanya 1 foto</strong>, foto akan tampil diam (statis) tanpa bergulir.
                    </div>
                  </div>
                </div>

                {profileError && (
                  <p
                    role="alert"
                    className="rounded-lg border border-destructive/25 bg-destructive/[0.06] px-3 py-2 text-sm font-medium text-destructive"
                  >
                    {profileError}
                  </p>
                )}

                <div className="pt-3 flex justify-end">
                  <Button type="submit" className="gap-2" disabled={isSavingProfile}>
                    <FloppyDisk className="w-4 h-4" />
                    <span>{isSavingProfile ? "Menyimpan..." : "Simpan Profil"}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: REKENING & KAS */}
        <TabsContent value="finance" className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Rekening Bank & QRIS Infaq</CardTitle>
              <CardDescription>
                Nomor rekening resmi untuk penerimaan infak, sedekah, dan wakaf jamaah secara transfer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveFinance} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Nama Bank
                    </label>
                    <input
                      type="text"
                      value={financeConfig.bankName}
                      onChange={(e) =>
                        setFinanceConfig({ ...financeConfig, bankName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Nomor Rekening
                    </label>
                    <input
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
                    <label className="text-xs font-semibold text-foreground">
                      Atas Nama Rekening
                    </label>
                    <input
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
                    <label className="text-xs font-semibold text-foreground">
                      Batas Saldo Kas Minimal untuk Peringatan (IDR)
                    </label>
                    <input
                      type="number"
                      value={financeConfig.minBalanceAlert}
                      onChange={(e) =>
                        setFinanceConfig({
                          ...financeConfig,
                          minBalanceAlert: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      Sistem akan memberikan notifikasi peringatan jika saldo kas masjid berada di bawah nilai ini.
                    </span>
                  </div>
                </div>

                {/* Kategori kas — dikelola penuh dari sini, tersimpan di database */}
                <div className="pt-4 border-t border-border">
                  <CategoryManager />
                </div>

                {financeError && (
                  <p
                    role="alert"
                    className="rounded-lg border border-destructive/25 bg-destructive/[0.06] px-3 py-2 text-sm font-medium text-destructive"
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
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Publikasi Saldo Kas Real-time
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tampilkan nominal saldo kas masjid secara transparan di halaman utama publik
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={financeConfig.publicTransparency}
                    onChange={(e) =>
                      setFinanceConfig({
                        ...financeConfig,
                        publicTransparency: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Tampilkan Kode QRIS Infaq Digital
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Izinkan jamaah memindai kode QRIS masjid untuk transfer sedekah cepat
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={financeConfig.showDonationQRIS}
                    onChange={(e) =>
                      setFinanceConfig({
                        ...financeConfig,
                        showDonationQRIS: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                  />
                </div>
              </div>

              {financeError && (
                <p
                  role="alert"
                  className="rounded-lg border border-destructive/25 bg-destructive/[0.06] px-3 py-2 text-sm font-medium text-destructive"
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
                    onClick={() => {
                      alert("Data berhasil diekspor dalam format JSON!");
                    }}
                  >
                    <DownloadSimple className="w-4 h-4" />
                    <span>Ekspor Database (JSON)</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      alert("Fitur impor data cadangan siap.");
                    }}
                  >
                    <UploadSimple className="w-4 h-4" />
                    <span>Pulihkan / Impor Cadangan</span>
                  </Button>
                </div>
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
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Kata Sandi Saat Ini
                  </label>
                  <input
                    type="password"
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
                  <label className="text-xs font-semibold text-foreground">
                    Kata Sandi Baru
                  </label>
                  <input
                    type="password"
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
                  <label className="text-xs font-semibold text-foreground">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <input
                    type="password"
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
                      !securityForm.newPassword ||
                      securityForm.newPassword !== securityForm.confirmPassword
                    }
                  >
                    <LockKey className="w-4 h-4" />
                    <span>Perbarui Kata Sandi</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
