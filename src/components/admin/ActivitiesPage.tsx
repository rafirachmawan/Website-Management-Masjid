"use client";

import { useState, useMemo } from "react";
import { useApi, apiSend } from "@/lib/api";
import { DataSkeleton } from "@/components/DataSkeleton";
import { formatDate } from "@/lib/utils";
import type { Activity } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
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
  SelectItem,
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
  CalendarBlank,
  Clock,
  MapPin,
  User,
  Plus,
  MagnifyingGlass,
  Eye,
  PencilSimple,
  Trash,
  CheckCircle,
  Hourglass,
  CalendarCheck,
  Sparkle,
} from "@phosphor-icons/react";

export function ActivitiesPage() {
  const { data: activities, refresh } = useApi<Activity[]>("/api/activities");
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    time: "19:30 - 21:00",
    location: "Masjid Ar-Rahman (Ruang Utama)",
    organizer: "Pengurus Masjid",
    imageUrl: "",
  });

  const data = activities ?? [];

  const todayStr = "2026-09-27";

  const getActivityStatus = (dateStr: string) => {
    if (dateStr < todayStr) return "completed";
    if (dateStr === todayStr) return "today";
    return "upcoming";
  };

  const filteredActivities = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.organizer.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase());

      const status = getActivityStatus(item.date);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "upcoming" && (status === "upcoming" || status === "today")) ||
        (statusFilter === "completed" && status === "completed");

      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  const upcomingCount = data.filter((a) => a.date >= todayStr).length;
  const completedCount = data.filter((a) => a.date < todayStr).length;

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormData({
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      time: "19:30 - 21:00",
      location: "Masjid Ar-Rahman (Ruang Utama)",
      organizer: "Pengurus Masjid",
      imageUrl: "",
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (act: Activity) => {
    setIsEditMode(true);
    setSelectedActivity(act);
    setFormData({
      title: act.title,
      description: act.description,
      date: act.date,
      time: act.time,
      location: act.location,
      organizer: act.organizer,
      imageUrl: act.imageUrl || "",
    });
    setIsFormModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.date) return;
    setIsSaving(true);
    setFormError(null);
    try {
      if (isEditMode && selectedActivity) {
        await apiSend(`/api/activities/${selectedActivity.id}`, "PUT", formData);
      } else {
        await apiSend("/api/activities", "POST", formData);
      }
      refresh();
      setIsFormModalOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Gagal menyimpan kegiatan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedActivity) return;
    setIsDeleting(true);
    setFormError(null);
    try {
      await apiSend(`/api/activities/${selectedActivity.id}`, "DELETE");
      refresh();
      setIsDeleteModalOpen(false);
      setSelectedActivity(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Gagal menghapus kegiatan.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!activities) {
    return (
      <div className="space-y-6" aria-label="Memuat agenda kegiatan">
        <DataSkeleton lines={2} className="max-w-md" />
        <DataSkeleton lines={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Agenda Kegiatan"
        description="Kelola jadwal kajian, kegiatan hari besar Islam, dan aktivitas sosial masjid"
        actions={
          <Button onClick={handleOpenAdd} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Tambah Kegiatan</span>
          </Button>
        }
      />

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Agenda
              </p>
              <h3 className="text-2xl font-bold mt-1 tabular-nums text-foreground">
                {data.length}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Kegiatan terdaftar</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Akan Datang
              </p>
              <h3 className="text-2xl font-bold mt-1 tabular-nums text-emerald-600">
                {upcomingCount}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Siap diselenggarakan</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Hourglass className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Telah Terlaksana
              </p>
              <h3 className="text-2xl font-bold mt-1 tabular-nums text-muted-foreground">
                {completedCount}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Arsip kegiatan lampau</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              <CheckCircle className="w-6 h-6" />
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
                placeholder="Cari nama kegiatan, pembicara, lokasi, atau deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status Kegiatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="upcoming">Akan Datang</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredActivities.length === 0 ? (
          <div className="col-span-full">
            <Card className="border-border border-dashed py-12 text-center shadow-none">
              <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                  <CalendarBlank className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground">Tidak Ada Kegiatan</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Tidak ditemukan kegiatan yang cocok dengan kriteria filter.
                </p>
              </div>
            </Card>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const status = getActivityStatus(act.date);
            const isUpcoming = status === "upcoming" || status === "today";

            return (
              <Card
                key={act.id}
                className="border-border hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between group"
              >
                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Top status & date badge */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        {isUpcoming ? (
                          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 gap-1 font-medium">
                            <Sparkle className="w-3 h-3" />
                            Akan Datang
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 font-medium text-muted-foreground">
                            Selesai
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <CalendarBlank className="w-3.5 h-3.5" />
                        {formatDate(act.date)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {act.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                      {act.description}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{act.time} WIB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{act.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Penyelenggara: {act.organizer}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedActivity(act);
                        setIsViewModalOpen(true);
                      }}
                      className="gap-1 h-8 text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Detail
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(act)}
                      className="gap-1 h-8 text-xs"
                    >
                      <PencilSimple className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedActivity(act);
                        setIsDeleteModalOpen(true);
                      }}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal: View Detail */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-130">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedActivity?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Detail lengkap agenda kegiatan masjid
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-muted/40 rounded-xl border border-border text-xs">
              <div>
                <span className="text-muted-foreground block">Hari & Tanggal</span>
                <span className="font-semibold text-foreground mt-0.5 block">
                  {selectedActivity && formatDate(selectedActivity.date)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Waktu</span>
                <span className="font-semibold text-foreground mt-0.5 block">
                  {selectedActivity?.time} WIB
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground block">Lokasi</span>
                <span className="font-semibold text-foreground mt-0.5 block">
                  {selectedActivity?.location}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground block">Penyelenggara / Pemateri</span>
                <span className="font-semibold text-foreground mt-0.5 block">
                  {selectedActivity?.organizer}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-foreground mb-1.5">
                Deskripsi Kegiatan:
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedActivity?.description}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewModalOpen(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Create & Edit Activity */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-140">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Agenda Kegiatan" : "Tambah Kegiatan Baru"}
            </DialogTitle>
            <DialogDescription>
              Isi data detail kegiatan untuk dijadwalkan di profil masjid.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Nama Kegiatan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Tabligh Akbar Menyambut Bulan Suci"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Tanggal Pelaksanaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Waktu Pelaksanaan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 19:30 - 21:00"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Lokasi Tempat
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Masjid Ar-Rahman (Ruang Utama)"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Penyelenggara / Ustadz
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ust. Abdullah"
                  value={formData.organizer}
                  onChange={(e) =>
                    setFormData({ ...formData, organizer: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Deskripsi & Catatan
              </label>
              <textarea
                rows={3}
                placeholder="Rincian informasi acara, materi kajian, atau sasaran peserta..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

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
              disabled={isSaving || !formData.title || !formData.date}
            >
              {isSaving ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Simpan Kegiatan"}
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
              Hapus Kegiatan?
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm">
              Apakah Anda yakin ingin menghapus agenda &quot;
              <strong className="text-foreground">
                {selectedActivity?.title}
              </strong>
              &quot;? Data kegiatan ini akan dihapus dari jadwal publik.
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
