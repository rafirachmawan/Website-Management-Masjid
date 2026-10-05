import { AdminLayout } from "@/components/admin/AdminLayout";
import { metadata } from "./metadata";

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