import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { getActivities } from "@/server/services/content";
import { getMosqueProfile } from "@/server/services/mosque";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Semua Kegiatan",
  description: "Pengajian, khataman, baksos, dan kajian khusus masjid.",
};

export default async function KegiatanListPage() {
  const [activities, profile] = await Promise.all([
    getActivities(),
    getMosqueProfile(),
  ]);

  const sorted = [...activities].sort((a, b) => +new Date(a.date) - +new Date(b.date));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <Navbar profile={profile} />
      </header>

      <main className="flex flex-1 flex-col">
        <div className="container mx-auto w-full px-4 py-8 md:px-6 md:py-12 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-primary">
              Beranda
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-foreground">Kegiatan</span>
          </nav>

          <div className="mx-auto mt-4 mb-8 max-w-2xl text-center md:mb-10">
            <h1 className="font-display text-h2-fluid font-semibold text-foreground">
              Semua Kegiatan
            </h1>
            <p className="mx-auto mt-2 max-w-[58ch] text-sm leading-relaxed text-muted-foreground md:text-[15px]">
              Pengajian, khataman, baksos, dan kajian khusus. Pilih agenda untuk
              melihat waktu, lokasi, dan penyelenggara.
            </p>
          </div>

          {sorted.length === 0 ? (
            <p className="mx-auto max-w-xl rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              Belum ada kegiatan terjadwal. Agenda dari pengurus akan tampil di sini.
            </p>
          ) : (
            <ul className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
              {sorted.map((a) => (
                <li key={a.id} className="h-full">
                  <Link
                    href={`/kegiatan/${a.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
                  >
                    {a.imageUrl && (a.imageUrl.startsWith("http") || a.imageUrl.startsWith("/")) ? (
                      <img
                        src={a.imageUrl}
                        alt={a.title}
                        loading="lazy"
                        className="aspect-[16/9] w-full object-cover"
                      />
                    ) : (
                      <div aria-hidden="true" className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-primary/[0.12] via-muted to-muted">
                        <span className="font-display text-4xl font-bold text-primary/30">
                          {a.title.trim().charAt(0).toUpperCase() || "•"}
                        </span>
                      </div>
                    )}
                    <span className="flex flex-1 flex-col p-5">
                      <span className="text-[11px] font-semibold text-primary tabular-nums">
                        {formatDate(a.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} • {a.time} WIB
                      </span>
                      <span className="font-display mt-1.5 line-clamp-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {a.title}
                      </span>
                      <span className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {a.description}
                      </span>
                      <span className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                        {a.location} • Oleh {a.organizer}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Footer profile={profile} />
    </div>
  );
}
