import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4, IBM_Plex_Mono, Amiri } from "next/font/google";
import { Providers } from "@/components/Providers";
import { getMosqueProfile } from "@/server/services/mosque";
import "./globals.css";

// Tubuh & UI: Inter — netral, formal, dan profesional. Standar antarmuka
// institusional dengan keterbacaan tinggi di segala ukuran.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// Display / heading: Source Serif 4 — serif formal dan berwibawa untuk kesan
// institusional yang tepercaya. Dipakai khusus judul besar.
const sourceSerif = Source_Serif_4({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  style: ["normal", "italic"],
  // optical sizing otomatis menyesuaikan ketajaman di tiap ukuran
});

// Arab: Amiri — naskh indah untuk lafaz salat & basmalah.
const amiri = Amiri({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// Alamat publik situs. Set `NEXT_PUBLIC_SITE_URL` di produksi (mis.
// https://masjidku.id) supaya tautan OG/Twitter absolut dan benar.
function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "http://localhost:3000";
  try {
    return new URL(raw).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const base = siteUrl();
  // Nama masjid dari database; bila DB belum siap → judul generik, bukan error.
  const profile = await getMosqueProfile().catch(() => null);
  const mosqueName = profile?.name?.trim() || "Keuangan Masjid";
  const description = `Transparansi kas, pengumuman, agenda, dan jadwal salat ${mosqueName} untuk jamaah.`;
  // Placeholder lama ("google-site-verification-code") membuat Search Console
  // menolak verifikasi — sekarang hanya muncul bila diisi lewat env.
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

  return {
    // Tanpa metadataBase, semua URL relatif di metadata memicu peringatan build.
    metadataBase: new URL(base),
    title: {
      default: `${mosqueName} | Transparansi Keuangan & Informasi Jamaah`,
      template: `%s | ${mosqueName}`,
    },
    description,
    keywords: ["masjid", "keuangan", "kas", "transparansi", "jamaah", "jadwal sholat", "pengumuman"],
    authors: [{ name: "Takmir Masjid" }],
    creator: "Takmir Masjid",
    publisher: mosqueName,
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
    // Gambar pratinjau dibuat otomatis dari `src/app/opengraph-image.tsx`
    // (sebelumnya menunjuk `/og-image.png` yang tidak pernah ada).
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: base,
      siteName: mosqueName,
      title: `${mosqueName} | Transparansi Keuangan & Informasi Jamaah`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: mosqueName,
      description,
    },
    ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  };
}

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
      className={`${inter.variable} ${sourceSerif.variable} ${amiri.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}