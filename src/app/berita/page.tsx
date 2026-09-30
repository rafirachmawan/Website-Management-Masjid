import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { Badge } from "@/components/ui/badge";
import { getAnnouncements } from "@/server/services/content";
import { getMosqueProfile } from "@/server/services/mosque";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Semua Berita",
  description: "Kabar kegiatan, kajian, dan info penting masjid. Dikelola pengurus.",
};

const priorityConfig = {
  normal: { label: "Info", pill: "bg-muted text-muted-foreground" },
  important: { label: "Penting", pill: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
} as const;

type Priority = keyof typeof priorityConfig;

const PRIORITY_WEIGHT: Record<Priority, number> = {
  important: 0,
  normal: 1,
};

export default async function BeritaListPage() {
  const [announcements, profile] = await Promise.all([
    getAnnouncements(),
    getMosqueProfile(),
  ]);

  const sorted = [...announcements].sort((a, b) => {
    const w =
      (PRIORITY_WEIGHT[a.priority as Priority] ?? PRIORITY_WEIGHT.normal) -
      (PRIORITY_WEIGHT[b.priority as Priority] ?? PRIORITY_WEIGHT.normal);
    if (w !== 0) return w;
    return +new Date(b.publishedAt) - +new Date(a.publishedAt);
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <Navbar />
      </header>

      <main className="flex flex-1 flex-col">
        <div className="container mx-auto w-full px-4 py-8 md:px-6 md:py-12 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-primary">
              Beranda
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-foreground">Berita</span>
          </nav>

          <div className="mx-auto mt-4 mb-8 max-w-2xl text-center md:mb-10">
            <h1 className="font-display text-h2-fluid font-semibold text-foreground">
              Semua Berita
            </h1>
            <p className="mx-auto mt-2 max-w-[52ch] text-sm leading-relaxed text-muted-foreground md:text-base">
              Kabar kegiatan, kajian, dan info penting masjid. Dikelola pengurus.
            </p>
          </div>

          {sorted.length === 0 ? (
            <p className="mx-auto max-w-xl rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              Belum ada pengumuman. Kabar terbaru dari pengurus akan tampil di sini.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
              {sorted.map((a) => {
                const config =
                  priorityConfig[a.priority as Priority] ?? priorityConfig.normal;
                return (
                  <li key={a.id} className="h-full">
                    <Link
                      href={`/berita/${a.id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-colors hover:border-primary/40"
                    >
                      {a.imageUrl && (a.imageUrl.startsWith("http") || a.imageUrl.startsWith("/")) ? (
                        <img
                          src={a.imageUrl}
                          alt={a.title}
                          loading="lazy"
                          className="aspect-[16/9] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div aria-hidden="true" className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-primary/[0.12] via-muted to-muted">
                          <span className="font-display text-4xl font-bold text-primary/30">
                            {a.title.trim().charAt(0).toUpperCase() || "•"}
                          </span>
                        </div>
                      )}
                      <span className="flex flex-1 flex-col p-5">
                        <span className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", config.pill)}>
                            {config.label}
                          </Badge>
                          <time dateTime={a.publishedAt} className="text-xs text-muted-foreground tabular-nums">
                            {formatDate(a.publishedAt, { day: "numeric", month: "long", year: "numeric" })}
                          </time>
                        </span>
                        <span className="font-display mt-2.5 line-clamp-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                          {a.title}
                        </span>
                        <span className="mt-1 text-xs text-muted-foreground">Oleh {a.author}</span>
                        <span className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {a.content}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <Footer profile={profile} />
    </div>
  );
}
