import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { OfficialsSection } from "@/components/public/OfficialsSection";
import { getOfficials } from "@/server/services/officials";
import { getMosqueProfile } from "@/server/services/mosque";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pengurus Masjid",
  description: "Susunan takmir dan pengurus masjid beserta kontak yang dapat dihubungi.",
};

export default async function PengurusPage() {
  const [officials, profile] = await Promise.all([
    getOfficials(),
    getMosqueProfile(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <Navbar />
      </header>

      <main className="flex flex-1 flex-col">
        <div className="container mx-auto w-full px-4 pt-8 md:px-6 md:pt-12 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-primary">
              Beranda
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-foreground">Pengurus</span>
          </nav>
        </div>
        <OfficialsSection officials={officials.filter((o) => o.status === "active")} />
      </main>

      <Footer profile={profile} />
    </div>
  );
}
