"use client";

import { useState, useMemo } from "react";
import { useApi, apiSend } from "@/lib/api";
import { DataSkeleton } from "@/components/DataSkeleton";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { todayISO, DEFAULT_TIME_ZONE } from "@/lib/utils";
import { POSITIONS, normalizePosition, TIER_NAME } from "@/lib/positions";
import type { Official, MosqueProfile } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  UserMinus,
  ShieldCheck,
  Phone,
  EnvelopeSimple,
  PencilSimple,
  Trash,
  CheckCircle,
  MagnifyingGlass,
  Funnel,
} from "@phosphor-icons/react";

// ── Catatan penting soal "peran" ────────────────────────────────────────────
// Panel admin memakai SATU kata sandi untuk semua pengurus: tidak ada
// pembatasan menu/halaman per peran. Karena itu UI tidak lagi menawarkan
// "Admin Sistem"/"Bendahara" seolah-olah mengatur hak akses — pilihan itu tidak
// berefek apa pun dan hanya menyesatkan.
//
// Satu-satunya nilai yang benar-benar berfungsi adalah `superadmin`:
// akun penanggung jawab teknis yang dilindungi dari penghapusan/penonaktifan
// saat ia satu-satunya yang tersisa (lihat server/services/officials.ts).
// Nilai lama ("admin"/"bendahara") ditampilkan & disimpan sebagai pengurus biasa.
type AssignableRole = "superadmin" | "pengurus";

function toAssignableRole(role: Official["systemRole"]): AssignableRole {
  return role === "superadmin" ? "superadmin" : "pengurus";
}

export function UsersPage() {
  const {
    data: officials,
    error: officialsError,
    errorStatus: officialsErrorStatus,
    refresh,
  } = useApi<Official[]>("/api/officials");
  // Zona masjid untuk tanggal bergabung (bukan asumsi WIB).
  const { data: profile } = useApi<MosqueProfile>("/api/mosque-profile");
  const timeZone = profile?.timezone?.trim() || DEFAULT_TIME_ZONE;
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedOfficial, setSelectedOfficial] = useState<Official | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    role: "Anggota Takmir",
    systemRole: "pengurus" as AssignableRole,
    phone: "",
    email: "",
    status: "active" as "active" | "inactive",
    avatar: "",
  });

  // Di-`useMemo`: array baru tiap render akan membuat `filteredOfficials`
  // (dan statistik di bawahnya) dihitung ulang terus-menerus.
  const data = useMemo(() => officials ?? [], [officials]);

  const filteredOfficials = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        normalizePosition(item.role).toLowerCase().includes(search.toLowerCase()) ||
        item.email.toLowerCase().includes(search.toLowerCase()) ||
        item.phone.toLowerCase().includes(search.toLowerCase());

      const matchRole =
        roleFilter === "all" || toAssignableRole(item.systemRole) === roleFilter;

      return matchSearch && matchRole;
    });
  }, [data, search, roleFilter]);

  const superAdminCount = data.filter((u) => u.systemRole === "superadmin").length;
  const inactiveCount = data.filter((u) => u.status !== "active").length;
  const activeCount = data.filter((u) => u.status === "active").length;

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormData({
      name: "",
      role: "Anggota Takmir",
      systemRole: "pengurus",
      phone: "",
      email: "",
      status: "active",
      avatar: "",
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: Official) => {
    setIsEditMode(true);
    setSelectedOfficial(item);
    setFormData({
      name: item.name,
      // Jabatan lama (mis. "Bendahara") dipetakan ke nilai kanonik supaya
      // nilainya tidak hilang saat form disimpan ulang.
      role: normalizePosition(item.role),
      systemRole: toAssignableRole(item.systemRole),
      phone: item.phone,
      email: item.email,
      status: item.status,
      avatar: item.avatar || "",
    });
    setIsFormModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.role) return;
    setIsSaving(true);
    setFormError(null);
    try {
      if (isEditMode && selectedOfficial) {
        await apiSend(`/api/officials/${selectedOfficial.id}`, "PUT", formData);
      } else {
        await apiSend("/api/officials", "POST", {
          ...formData,
          // Tanggal bergabung zona masjid, bukan UTC — cegah off-by-one
          // bagi pengurus yang menyimpan form lewat tengah malam.
          joinedDate: todayISO(timeZone),
        });
      }
      refresh();
      setIsFormModalOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Gagal menyimpan pengurus.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOfficial) return;
    setIsDeleting(true);
    setFormError(null);
    try {
      await apiSend(`/api/officials/${selectedOfficial.id}`, "DELETE");
      refresh();
      setIsDeleteModalOpen(false);
      setSelectedOfficial(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Gagal menghapus pengurus.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (officialsError) {
    const needsLogin = officialsErrorStatus === 401 || officialsErrorStatus === 403;
    return (
      <div className="space-y-6">
        <PageHeader
          title="Struktur Pengurus"
          description="Kelola data Dewan Kemakmuran Masjid (DKM) dan takmir"
        />
        <AdminErrorState
          title="Gagal memuat pengurus"
          message={officialsError}
          actionHref={needsLogin ? "/admin/login?next=/admin/users" : undefined}
          actionLabel={needsLogin ? "Masuk kembali" : undefined}
        />
      </div>
    );
  }

  if (!officials) {
    return (
      <div className="space-y-6" aria-label="Memuat pengurus">
        <DataSkeleton lines={2} className="max-w-md" />
        <DataSkeleton lines={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Struktur Pengurus"
        description="Kelola data Dewan Kemakmuran Masjid (DKM) dan takmir yang tampil di halaman publik"
        actions={
          <Button onClick={handleOpenAdd} className="gap-2 shadow-sm">
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengurus</span>
          </Button>
        }
      />

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Pengurus
              </p>
              <h3 className="text-2xl font-bold mt-1 tabular-nums text-foreground">
                {data.length}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Struktur takmir DKM</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pengurus Aktif
              </p>
              <h3 className="text-2xl font-bold mt-1 tabular-nums text-foreground">
                {activeCount}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Status aktif bertugas</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <CheckCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pengurus Nonaktif
              </p>
              <h3 className="text-2xl font-bold mt-1 tabular-nums text-foreground">
                {inactiveCount}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Tidak lagi bertugas</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <UserMinus className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Penanggung Jawab Utama
              </p>
              <h3 className="text-2xl font-bold mt-1 tabular-nums text-foreground">
                {superAdminCount}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Akun teknis yang dilindungi</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nama pengurus, jabatan, nomor HP, atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val || "all")}>
                <SelectTrigger className="w-fit max-w-full shrink-0 justify-start">
                  <Funnel className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Peran">
                    {roleFilter === "all"
                      ? "Semua pengurus"
                      : roleFilter === "superadmin"
                        ? "Penanggung jawab teknis"
                        : "Pengurus biasa"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="end" alignItemWithTrigger={false}>
                  <SelectItem value="all">Semua pengurus</SelectItem>
                  <SelectItem value="superadmin">Penanggung jawab teknis</SelectItem>
                  <SelectItem value="pengurus">Pengurus biasa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Officials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredOfficials.length === 0 ? (
          <div className="col-span-full">
            <Card className="border-border border-dashed py-12 text-center shadow-none">
              <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground">Tidak Ada Pengurus</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Tidak ditemukan pengurus yang sesuai pencarian.
                </p>
              </div>
            </Card>
          </div>
        ) : (
          filteredOfficials.map((item) => (
            <Card
              key={item.id}
              className="border-border hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between group overflow-hidden"
            >
              <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
                {/* Avatar with initials or photo */}
                <div className="relative">
                  {item.avatar && (item.avatar.startsWith("http") || item.avatar.startsWith("/")) ? (
                    <img
                      src={item.avatar}
                      alt={item.name}
                      loading="lazy"
                      className="w-16 h-16 aspect-square rounded-full border-2 border-primary/20 object-cover shadow-xs object-[center_20%]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-xl overflow-hidden shadow-xs">
                      {item.name
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card" />
                </div>

                <div>
                  <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium line-clamp-1">
                    {normalizePosition(item.role)}
                  </p>
                </div>

                {/* Hanya penanggung jawab teknis yang diberi label — peran lain
                    tidak punya efek apa pun, jadi tidak perlu ditampilkan
                    (jabatan aslinya sudah tampil di atas). */}
                {item.systemRole === "superadmin" && (
                  <Badge className="bg-primary/10 text-primary border-primary/25 font-medium">
                    Penanggung jawab
                  </Badge>
                )}

                {/* Contacts */}
                <div className="w-full pt-3 border-t border-border/60 text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center justify-center gap-1.5 truncate">
                    <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{item.phone}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 truncate">
                    <EnvelopeSimple className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{item.email}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/60 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(item)}
                    className="gap-1.5 h-8 text-xs flex-1"
                  >
                    <PencilSimple className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedOfficial(item);
                      setIsDeleteModalOpen(true);
                    }}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Create & Edit Official */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-125 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Data Pengurus" : "Tambah Pengurus DKM"}
            </DialogTitle>
            <DialogDescription>
              Isi biodata pengurus. Jabatan menentukan posisinya di struktur yang
              tampil di halaman publik.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Nama Lengkap & Gelar <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Dr. KH. M. Syarif Hidayat, M.A."
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Jabatan di Kepengurusan DKM <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.role}
                onValueChange={(val) => {
                  if (val) setFormData({ ...formData, role: val });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih jabatan" />
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  {TIER_NAME.map((tier, i) => (
                    <SelectGroup key={`${tier}-${i}`}>
                      <SelectLabel>
                        {tier}
                        <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground/70">
                          · {POSITIONS.filter((p) => p.level === i).length}
                        </span>
                      </SelectLabel>
                      {POSITIONS.filter((p) => p.level === i).map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.value}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Jabatan menentukan urutan &amp; posisi di struktur pengurus.
              </p>
            </div>

            <div className="space-y-1 rounded-xl border border-border/70 bg-muted/30 p-3.5">
              <label className="text-xs font-semibold text-foreground">
                Penanggung jawab teknis
              </label>
              <Select
                value={formData.systemRole}
                onValueChange={(val) => {
                  if (val) setFormData({ ...formData, systemRole: val as AssignableRole });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {formData.systemRole === "superadmin"
                      ? "Ya — penanggung jawab teknis"
                      : "Tidak — pengurus biasa"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  <SelectItem value="pengurus">Tidak — pengurus biasa</SelectItem>
                  <SelectItem value="superadmin">Ya — penanggung jawab teknis</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Panel admin memakai satu kata sandi untuk semua pengurus, jadi pilihan
                ini <strong className="font-semibold text-foreground">tidak</strong>{" "}
                membatasi menu atau halaman. Satu-satunya efeknya: akun penanggung jawab
                teknis tidak bisa dihapus/dinonaktifkan selama belum ada penggantinya.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Status Keaktifan
              </label>
              <Select
                value={formData.status}
                onValueChange={(val) => {
                  if (val) setFormData({ ...formData, status: val as "active" | "inactive" });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {formData.status === "active" ? "Aktif Bertugas" : "Nonaktif"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="start" alignItemWithTrigger={false}>
                  <SelectItem value="active">Aktif Bertugas</SelectItem>
                  <SelectItem value="inactive">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="0812-xxxx-xxxx"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="email@masjidarrahman.or.id"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <ImageUploadField
            label="Foto Pengurus (opsional)"
            value={formData.avatar}
            onChange={(url) => setFormData({ ...formData, avatar: url })}
          />

          {formError && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/25 bg-destructive/6 px-3 py-2 text-sm font-medium text-destructive"
            >
              {formError}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFormModalOpen(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !formData.name || !formData.role}
            >
              {isSaving ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Tambah Pengurus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirm Delete */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-105">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash className="w-5 h-5" />
              Hapus Pengurus?
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm">
              Apakah Anda yakin ingin menghapus data pengurus &quot;
              <strong className="text-foreground">
                {selectedOfficial?.name}
              </strong>
              &quot;? Data pengurus akan dihapus dari struktur dan halaman publik.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/25 bg-destructive/6 px-3 py-2 text-sm font-medium text-destructive"
            >
              {formError}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
