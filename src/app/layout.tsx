import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Keuangan Masjid | Transparansi Keuangan & Informasi Jamaah",
    template: "%s | Keuangan Masjid",
  },
  description: "Sistem informasi keuangan masjid yang transparan. Lihat laporan kas, pengumuman, jadwal sholat, dan kegiatan masjid secara real-time.",
  keywords: ["masjid", "keuangan", "kas", "transparansi", "jamaah", "jadwal sholat", "pengumuman"],
  authors: [{ name: "Takmir Masjid" }],
  creator: "Takmir Masjid",
  publisher: "Masjid",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://masjid.example.com",
    siteName: "Keuangan Masjid",
    title: "Keuangan Masjid | Transparansi Keuangan & Informasi Jamaah",
    description: "Sistem informasi keuangan masjid yang transparan untuk jamaah.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Keuangan Masjid - Transparansi Keuangan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Keuangan Masjid",
    description: "Transparansi keuangan masjid untuk jamaah",
    images: ["/og-image.png"],
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#17181a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}