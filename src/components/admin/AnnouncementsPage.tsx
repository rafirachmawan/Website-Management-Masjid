"use client";

import { useState, useMemo } from "react";
import { useApi, apiSend } from "@/lib/api";
import { DataSkeleton } from "@/components/DataSkeleton";
import { formatDate } from "@/lib/utils";
import type { Announcement } from "@/types";
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
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Megaphone,
  Plus,
  MagnifyingGlass,
  Funnel,
  Eye,
  PencilSimple,
  Trash,
  DotsThreeVertical,
  Calendar,
  User,
  CheckCircle,
  BellSimpleRinging,
  Broadcast,
} from "@phosphor-icons/react";

export function AnnouncementsPage() {
  const { data: announcements, refresh } = useApi<Announcement[]>("/api/announcements");
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "normal" as "normal" | "important",
    author: "Pengurus Masjid",
    imageUrl: "",
  });

  const data = announcements ?? [];

  const filteredAnnouncements = useMemo(() => {
    return data
      .filter((item) => {
        const matchSearch =
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.content.toLowerCase().includes(search.toLowerCase()) ||
          item.author.toLowerCase().includes(search.toLowerCase());
        const matchPriority =
          priorityFilter === "all" || item.priority === priorityFilter;
        return matchSearch && matchPriority;
      })
      .sort((a, b) => {
        // Penting selalu paling atas (jadi banner besar di beranda),
        // sisanya terbaru dulu. Otomatis tergeser saat prioritas diubah.
        if (a.priority === b.priority) {
          return +new Date(b.publishedAt) - +new Date(a.publishedAt);
        }
        return a.priority === "important" ? -1 : 1;
      });
  }, [data, search, priorityFilter]);

  const importantCount = data.filter((a) => a.priority === "important").length;
  const normalCount = data.filter((a) => a.priority === "normal").length;

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormData({
      title: "",
      content: "",
      priority: "normal",
      author: "Pengurus Masjid",
      imageUrl: "",
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setIsEditMode(true);
    setSelectedAnnouncement(ann);
    setFormData({
      title: ann.title,
      content: ann.content,
      priority: ann.priority,
      author: ann.author,
      imageUrl: ann.imageUrl || "",
    });
    setIsFormModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) return;
    // Cek cepat di sisi klien: slot Penting hanya 1. Backend menegakkan
    // ulang aturan yang sama sehingga tidak bisa diakali via API langsung.
    if (formData.priority === "important") {
      const holder = data.find(
        (a) =>
          a.priority === "important" &&
          (!isEditMode || !selectedAnnouncement || a.id !== selectedAnnouncement.id),
      );
      if (holder) {
        setFormError(
          `Prioritas Penting sudah dipakai oleh berita "${holder.title}". Ubah berita tersebut menjadi Biasa terlebih dahulu sebelum menetapkan berita lain sebagai Penting.`,
        );
        return;
      }
    }
    setIsSaving(true);
    setFormError(null);
    try {
      if (isEditMode && selectedAnnouncement) {
        await apiSend(`/api/announcements/${selectedAnnouncement.id}`, "PUT", formData);
      } else {
        await apiSend("/api/announcements", "POST", formData);
      }
      refresh();
      setIsFormModalOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Gagal menyimpan berita.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement) return;
    setIsDeleting(true);
    setFormError(null);
    try {
      await apiSend(`/api/announcements/${selectedAnnouncement.id}`, "DELETE");
      refresh();
      setIsDeleteModalOpen(false);
      setSelectedAnnouncement(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Gagal menghapus berita.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "important":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-200 dark:border-emerald-800 gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Penting
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1 font-medium text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
            Biasa
          </Badge>
        );
    }
  };

  if (!announcements) {
    return (
      <div className="space-y-6" aria-label="Memuat berita">
        <DataSkeleton lines={2} className="max-w-md" />
        <DataSkeleton lines={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Berita"
        description="Kelola berita dan informasi untuk jamaah"
        actions={
          <Button onClick={handleOpenAdd} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Buat Berita</span>
          </Button>
        }
      />

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Berita
              </p>
              <h3 className="text-2xl font-bold mt-1 tabular-nums text-foreground">
                {data.length}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Aktif & ditayangkan</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Megaphone className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Penting
              </p>
              <h3 className="text-2xl font-bold mt-1 tabular-nums text-foreground">
                {importantCount}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Agenda & kegiatan utama</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <BellSimpleRinging className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Informasi Umum
              </p>
              <h3 className="text-2xl font-bold mt-1 tabular-nums text-foreground">
                {normalCount}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Pemberitahuan rutin</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Broadcast className="w-6 h-6" />
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
                placeholder="Cari judul berita, isi pesan, atau pembuat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-2">
              <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val || "all")}>
                <SelectTrigger className="w-40">
                  <Funnel className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Prioritas">
                    {priorityFilter === "all" ? "Semua Prioritas" : priorityFilter === "important" ? "Penting" : "Biasa"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Prioritas</SelectItem>
                  <SelectItem value="important">Penting</SelectItem>
                  <SelectItem value="normal">Biasa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <Card className="border-border border-dashed py-12 text-center shadow-none">
            <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                <Megaphone className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-foreground">Tidak Ada Berita</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tidak ada berita yang sesuai dengan kriteria pencarian Anda.
              </p>
            </div>
          </Card>
        ) : (
          filteredAnnouncements.map((item) => (
            <Card
              key={item.id}
              className="border-border hover:border-primary/40 transition-all shadow-sm overflow-hidden group"
            >
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="h-20 w-full shrink-0 rounded-lg border border-border object-cover md:w-28"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {getPriorityBadge(item.priority)}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(item.publishedAt)}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {item.author}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </h2>

                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {item.content}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-start shrink-0 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAnnouncement(item);
                        setIsViewModalOpen(true);
                      }}
                      className="gap-1.5 h-8 text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Lihat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                      className="gap-1.5 h-8 text-xs"
                    >
                      <PencilSimple className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAnnouncement(item);
                        setIsDeleteModalOpen(true);
                      }}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal: View Detail */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-137.5">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              {selectedAnnouncement && getPriorityBadge(selectedAnnouncement.priority)}
            </div>
            <DialogTitle className="text-xl font-bold leading-snug">
              {selectedAnnouncement?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
              <span>Ditulis oleh: {selectedAnnouncement?.author}</span>
              <span>•</span>
              <span>
                {selectedAnnouncement && formatDate(selectedAnnouncement.publishedAt)}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedAnnouncement?.imageUrl && (
              <img
                src={selectedAnnouncement.imageUrl}
                alt={selectedAnnouncement.title}
                className="mb-4 max-h-64 w-full rounded-xl border border-border object-cover"
              />
            )}
            <div className="p-4 bg-muted/40 rounded-xl border border-border">
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                {selectedAnnouncement?.content}
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

      {/* Modal: Create & Edit Announcement */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="sm:max-w-140">
          <DialogHeader className="sticky top-[-1rem] z-10 -mx-4 -mt-4 rounded-t-2xl border-b border-border/60 bg-muted py-3 pr-10 pl-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <Megaphone className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <DialogTitle>
                  {isEditMode ? "Edit Berita" : "Buat Berita Baru"}
                </DialogTitle>
                <DialogDescription>
                  Isi formulir di bawah ini untuk mempublikasikan berita ke jamaah.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 sm:space-y-4 sm:py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Judul Berita <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Pengajian Rutin Ba'da Maghrib"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Prioritas Informasi
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value as "normal" | "important" })
                  }
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="normal">Biasa</option>
                  <option value="important">Penting — tampil besar</option>
                </select>
                {(() => {
                  const holder = data.find(
                    (a) =>
                      a.priority === "important" &&
                      (!isEditMode || !selectedAnnouncement || a.id !== selectedAnnouncement.id),
                  );
                  return (
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {holder
                        ? `Slot Penting sedang dipakai oleh "${holder.title}". Hanya 1 berita yang bisa menjadi Penting.`
                        : "Slot Penting kosong — berita ini bisa dijadikan tampilan besar."}
                    </p>
                  );
                })()}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Penulis / Sumber
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Isi Berita Lengkap <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Tuliskan isi berita lengkap secara jelas..."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <ImageUploadField
              label="Gambar Berita (opsional)"
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            />
          </div>

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
              disabled={isSaving || !formData.title || !formData.content}
            >
              {isSaving
                ? "Menyimpan..."
                : isEditMode
                  ? "Simpan Perubahan"
                  : "Terbitkan Berita"}
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
              Hapus Berita?
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-relaxed">
              Apakah Anda yakin ingin menghapus berita &quot;
              <strong className="text-foreground">
                {selectedAnnouncement?.title}
              </strong>
              &quot;? Berita tidak akan tampil lagi di halaman profil publik.
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
