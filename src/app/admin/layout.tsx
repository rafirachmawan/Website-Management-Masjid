import { AdminLayout } from "@/components/admin/AdminLayout";
import { metadata as adminMetadata } from "./metadata";

// Halaman admin tidak boleh diindeks mesin pencari (`robots: noindex` ada di
// ./metadata) dan judul tab memakai template yang sama untuk semua subhalaman.
export const metadata = adminMetadata;

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}