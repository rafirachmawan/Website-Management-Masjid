import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { Badge } from "@/components/ui/badge";
import { getAnnouncementById, getAnnouncements } from "@/server/services/content";
import { getMosqueProfile } from "@/server/services/mosque";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Selalu baca dari database — begitu pengurus menyimpan di /admin,
// kunjungan berikutnya langsung melihat data terbaru.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const priorityConfig = {
  normal: { label: "Info", pill: "bg-muted text-muted-foreground" },
  important: { label: "Penting", pill: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
} as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getAnnouncementById(id);
  if (!item) return { title: "Berita tidak ditemukan" };
  return {
    title: item.title,
    description: item.content.slice(0, 160),
  };
}

export default async function BeritaDetailPage({ params }: Props) {
  const { id } = await params;
  const [item, profile, all] = await Promise.all([
    getAnnouncementById(id),
    getMosqueProfile(),
    getAnnouncements(),
  ]);

  if (!item) notFound();

  const config =
    priorityConfig[item.priority as keyof typeof priorityConfig] ??
    priorityConfig.normal;
  const related = all.filter((a) => a.id !== item.id).slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <Navbar />
      </header>

      <main className="flex flex-1 flex-col">
        <div className="container mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-12 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-primary">
              Beranda
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/berita" className="transition-colors hover:text-primary">
              Berita
            </Link>
            <span aria-hidden="true">/</span>
            <span className="max-w-55 truncate font-medium text-foreground">
              {item.title}
            </span>
          </nav>

          <article className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {item.imageUrl && (item.imageUrl.startsWith("http") || item.imageUrl.startsWith("/")) && (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="aspect-[16/9] w-full object-cover"
              />
            )}
            <div className="p-5 md:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", config.pill)}>
                  {config.label}
                </Badge>
                <time dateTime={item.publishedAt} className="text-xs text-muted-foreground tabular-nums">
                  {formatDate(item.publishedAt, { day: "numeric", month: "long", year: "numeric" })}
                </time>
              </div>
              <h1 className="font-display mt-3 text-balance text-2xl font-semibold leading-snug text-foreground md:text-[2rem] md:leading-[1.25]">
                {item.title}
              </h1>
              <p className="mt-2 text-xs text-muted-foreground">Oleh {item.author}</p>
              <div className="mt-5 border-t border-border/60 pt-5">
                <p className="text-[15px] leading-relaxed whitespace-pre-line text-foreground/90 md:text-base md:leading-loose">
                  {item.content}
                </p>
              </div>
            </div>
          </article>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              href="/berita"
              className="inline-flex h-10 items-center rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
            >
              ← Semua berita
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
            >
              Kembali ke Beranda
            </Link>
          </div>

          {related.length > 0 && (
            <section aria-label="Berita lainnya" className="mt-10">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Berita lainnya
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {related.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/berita/${a.id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-colors hover:border-primary/40"
                    >
                      {a.imageUrl && (a.imageUrl.startsWith("http") || a.imageUrl.startsWith("/")) ? (
                        <img
                          src={a.imageUrl}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          className="aspect-[16/9] w-full object-cover"
                        />
                      ) : (
                        <div aria-hidden="true" className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-primary/[0.12] via-muted to-muted">
                          <span className="font-display text-3xl font-bold text-primary/30">
                            {a.title.trim().charAt(0).toUpperCase() || "•"}
                          </span>
                        </div>
                      )}
                      <span className="flex flex-1 flex-col p-4">
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {formatDate(a.publishedAt, { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <span className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                          {a.title}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>

      <Footer profile={profile} />
    </div>
  );
}
