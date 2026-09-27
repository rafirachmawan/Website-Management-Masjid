import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin Dashboard | Keuangan Masjid Al-Ikhlas",
    template: "%s | Admin Keuangan Masjid",
  },
  description: "Panel admin untuk mengelola keuangan, pengumuman, kegiatan, dan pengurus masjid.",
  robots: {
    index: false,
    follow: false,
  },
};