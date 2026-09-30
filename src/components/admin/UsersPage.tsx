"use client";

import { useState, useMemo } from "react";
import { useApi, apiSend } from "@/lib/api";
import { DataSkeleton } from "@/components/DataSkeleton";
import { formatDate } from "@/lib/utils";
import { POSITIONS, normalizePosition, TIER_NAME } from "@/lib/positions";
import type { Official } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  ShieldCheck,
  Phone,
  EnvelopeSimple,
  PencilSimple,
  Trash,
  CheckCircle,
  MagnifyingGlass,
  Funnel,
  IdentificationBadge,
} from "@phosphor-icons/react";

export function UsersPage() {
  const { data: officials, refresh } = useApi<Official[]>("/api/officials");
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
    systemRole: "pengurus" as "superadmin" | "admin" | "bendahara" | "pengurus",
    phone: "",
    email: "",
    status: "active" as "active" | "inactive",
    avatar: "",
  });

  const data = officials ?? [];

  const filteredOfficials = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        normalizePosition(item.role).toLowerCase().includes(search.toLowerCase()) ||
        item.email.toLowerCase().includes(search.toLowerCase()) ||
        item.phone.toLowerCase().includes(search.toLowerCase());

      const matchRole =
        roleFilter === "all" || item.systemRole === roleFilter;

      return matchSearch && matchRole;
    });
  }, [data, search, roleFilter]);

  const superAdminCount = data.filter((u) => u.systemRole === "superadmin").length;
  const adminCount = data.filter((u) => u.systemRole === "admin" || u.systemRole === "bendahara").length;
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
      systemRole: item.systemRole,
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
          joinedDate: new Date().toISOString().split("T")[0],
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

  const getRoleBadge = (systemRole: string) => {
    switch (systemRole) {
      case "superadmin":
        return (
          <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 font-medium">
            Super Admin
          </Badge>
        );
      case "admin":
        return (
          <Badge className="bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800 font-medium">
            Admin Sistem
          </Badge>
        );
      case "bendahara":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-medium">
            Bendahara
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="font-medium text-muted-foreground">
            Pengurus DKM
          </Badge>
        );
    }
  };

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
        title="Struktur Pengurus & Pengguna"
        description="Kelola data Dewan Kemakmuran Masjid (DKM), takmir, dan hak akses sistem informasi"
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
              <h3 className="text-2xl font-bold mt-1 tabular-nums text-emerald-600">
                {activeCount}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Status aktif bertugas</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Pengelola Kas & Web
              </p>
              <h3 className="text-2xl font-bold mt-1 tabular-nums text-sky-600">
                {adminCount}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Akses bendahara & admin</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Penanggung Jawab Utama
              </p>
              <h3 className="text-2xl font-bold mt-1 tabular-nums text-purple-600">
                {superAdminCount}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Ketua DKM (Superadmin)</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
              <IdentificationBadge className="w-6 h-6" />
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
                <SelectTrigger className="w-42.5">
                  <Funnel className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Hak Akses" />
                </SelectTrigger>
                <SelectContent align="end" alignItemWithTrigger={false}>
                  <SelectItem value="all">Semua Hak Akses</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin Sistem</SelectItem>
                  <SelectItem value="bendahara">Bendahara</SelectItem>
                  <SelectItem value="pengurus">Pengurus DKM</SelectItem>
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
                      className="w-16 h-16 aspect-square rounded-full border-2 border-primary/20 object-cover shadow-xs [object-position:center_20%]"
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

                <div>{getRoleBadge(item.systemRole)}</div>

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
              Isi informasi biodata pengurus serta hak akses akun di aplikasi masjid.
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
                Jabatan menentukan posisi di struktur pengurus. Peran &amp; hak
                akses di bawah tidak memengaruhi urutan tampil.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Peran & Hak Akses Sistem
                </label>
                <Select
                  value={formData.systemRole}
                  onValueChange={(val) => {
                    if (val) setFormData({ ...formData, systemRole: val as "superadmin" | "admin" | "bendahara" | "pengurus" });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" alignItemWithTrigger={false}>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin Sistem</SelectItem>
                    <SelectItem value="bendahara">Bendahara</SelectItem>
                    <SelectItem value="pengurus">Pengurus DKM</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start" alignItemWithTrigger={false}>
                    <SelectItem value="active">Aktif Bertugas</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              className="rounded-lg border border-destructive/25 bg-destructive/[0.06] px-3 py-2 text-sm font-medium text-destructive"
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
              &quot;? Akses akun yang bersangkutan akan dinonaktifkan.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/25 bg-destructive/[0.06] px-3 py-2 text-sm font-medium text-destructive"
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
