"use client";

import { useState } from "react";
import { mosqueProfile as initialProfile, categories } from "@/lib/mock-data";
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
  const [profile, setProfile] = useState(initialProfile);
  const [isSaved, setIsSaved] = useState(false);

  // Financial Settings State
  const [financeConfig, setFinanceConfig] = useState({
    bankName: "Bank Syariah Indonesia (BSI)",
    accountNumber: "7123-4567-8901",
    accountHolder: "DKM Masjid Al-Ikhlas Kemang",
    minBalanceAlert: 10000000,
    publicTransparency: true,
    showDonationQRIS: true,
  });

  // Security Form State
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [newImageUrl, setNewImageUrl] = useState("");

  const handleAddHeroImage = (urlToAdd?: string) => {
    const url = (urlToAdd || newImageUrl).trim();
    if (!url) return;
    const currentImages = profile.heroImages || [];
    setProfile({
      ...profile,
      heroImages: [...currentImages, url],
    });
    setNewImageUrl("");
  };

  const handleRemoveHeroImage = (indexToRemove: number) => {
    const currentImages = profile.heroImages || [];
    setProfile({
      ...profile,
      heroImages: currentImages.filter((_, i) => i !== indexToRemove),
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    Object.assign(initialProfile, profile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSaveFinance = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityForm.newPassword && securityForm.newPassword === securityForm.confirmPassword) {
      setIsSaved(true);
      setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Pengaturan Sistem
          </h1>
          <p className="text-sm text-muted-foreground">
            Konfigurasi profil masjid, rekening donasi, transparansi publik, dan keamanan akun
          </p>
        </div>
      </div>

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

                    {/* Add new image input */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="url"
                        placeholder="Masukkan tautan URL foto baru (misal: https://images.unsplash.com/...)"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddHeroImage()}
                        disabled={!newImageUrl.trim()}
                        className="gap-1.5 shrink-0 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Foto</span>
                      </Button>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-lg border border-border text-[11px] text-muted-foreground leading-relaxed">
                      💡 <strong>Ketentuan Sistem:</strong> Jika Anda memasukkan <strong>lebih dari 1 foto</strong>, hero section di halaman utama secara otomatis akan menjadi <em>slide carousel transparan</em> yang bergulir halus setiap 6 detik beserta titik indikator navigasi. Jika <strong>hanya 1 foto</strong>, foto akan tampil diam (statis) tanpa bergulir.
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <Button type="submit" className="gap-2">
                    <FloppyDisk className="w-4 h-4" />
                    <span>Simpan Profil</span>
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

                {/* Kategori Master List */}
                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-foreground mb-2">
                    Daftar Kategori Kas Terdaftar ({categories.length} Kategori):
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <Badge
                        key={c.id}
                        variant="outline"
                        className={
                          c.type === "income"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200"
                            : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200"
                        }
                      >
                        {c.name} ({c.type === "income" ? "Masuk" : "Keluar"})
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <Button type="submit" className="gap-2">
                    <FloppyDisk className="w-4 h-4" />
                    <span>Simpan Rekening</span>
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
