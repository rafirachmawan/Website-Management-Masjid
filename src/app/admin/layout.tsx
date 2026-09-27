import { AdminLayout } from "@/components/admin/AdminLayout";
import { ThemeProvider } from "@/components/ThemeProvider";
import { metadata } from "./metadata";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AdminLayout>
        {children}
      </AdminLayout>
    </ThemeProvider>
  );
}