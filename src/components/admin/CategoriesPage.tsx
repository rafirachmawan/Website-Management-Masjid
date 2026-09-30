"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { CategoryManager } from "@/components/admin/CategoryManager";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// Halaman khusus CRUD kategori kas masuk & keluar.
// Dipisah dari Pengaturan → Rekening Bank agar tanggung jawab tiap menu jelas:
// - /admin/categories = jenis-jenis kas (dipakai saat mencatat transaksi)
// - /admin/settings = rekening bank donasi + preferensi + keamanan
export function CategoriesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Kategori Kas"
        description="Kelola jenis pemasukan dan pengeluaran yang dipakai saat mencatat transaksi"
      />

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Kas Masuk & Kas Keluar</CardTitle>
          <CardDescription>
            Tambah, ubah, atau hapus kategori. Kategori yang sudah dipakai
            transaksi tidak bisa dihapus atau dipindah tipenya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryManager />
        </CardContent>
      </Card>
    </div>
  );
}
