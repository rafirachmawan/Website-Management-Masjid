import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { getActivityById, getActivities } from "@/server/services/content";
import { getMosqueProfile } from "@/server/services/mosque";
import { formatDate } from "@/lib/utils";

// Selalu baca dari database — begitu pengurus menyimpan di /admin,
// kunjungan berikutnya langsung melihat data terbaru.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getActivityById(id);
  if (!item) return { title: "Kegiatan tidak ditemukan" };
  return {
    title: item.title,
    description: item.description.slice(0, 160),
  };
}

export default async function KegiatanDetailPage({ params }: Props) {
  const { id } = await params;
  const [item, profile, all] = await Promise.all([
    getActivityById(id),
    getMosqueProfile(),
    getActivities(),
  ]);

  if (!item) notFound();

  const related = all.filter((a) => a.id !== item.id).slice(0, 3);

  const info = [
    { label: "Hari & Tanggal", value: formatDate(item.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) },
    { label: "Waktu", value: `${item.time} WIB` },
    { label: "Lokasi", value: item.location },
    { label: "Penyelenggara", value: item.organizer },
  ];

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
            <Link href="/kegiatan" className="transition-colors hover:text-primary">
              Kegiatan
            </Link>
            <span aria-hidden="true">/</span>
            <span className="max-w-55 truncate font-medium text-foreground">
              {item.title}
            </span>
          </nav>

          <article className="mt-6 overflow-hidden rounded-[24px] border border-border bg-card shadow-sm">
            {item.imageUrl && (item.imageUrl.startsWith("http") || item.imageUrl.startsWith("/")) ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="aspect-[16/9] w-full object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-primary/[0.12] via-muted to-muted"
              >
                <span className="font-display text-5xl font-bold text-primary/30">
                  {item.title.trim().charAt(0).toUpperCase() || "•"}
                </span>
              </div>
            )}
            <div className="p-5 md:p-8">
              <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                Detail kegiatan
              </p>
              <h1 className="font-display mt-2 text-balance text-2xl font-semibold leading-snug text-foreground md:text-[2rem] md:leading-[1.25]">
                {item.title}
              </h1>

              <dl className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {info.map((row) => (
                  <div
                    key={row.label}
                    className="rounded-xl bg-muted/70 px-4 py-3 ring-1 ring-border/50 ring-inset"
                  >
                    <dt className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                      {row.label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 border-t border-border/60 pt-5">
                <h2 className="text-sm font-semibold text-foreground">
                  Deskripsi kegiatan
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-foreground/90 md:text-base md:leading-loose">
                  {item.description}
                </p>
              </div>
            </div>
          </article>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              href="/kegiatan"
              className="inline-flex h-10 items-center rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
            >
              ← Semua kegiatan
            </Link>
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
            >
              Kembali ke Beranda
            </Link>
          </div>

          {related.length > 0 && (
            <section aria-label="Kegiatan lainnya" className="mt-10">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Kegiatan lainnya
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {related.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/kegiatan/${a.id}`}
                      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
                    >
                      <span className="text-[11px] font-semibold text-primary tabular-nums">
                        {formatDate(a.date, { day: "numeric", month: "short", year: "numeric" })} • {a.time} WIB
                      </span>
                      <span className="mt-1.5 line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {a.title}
                      </span>
                      <span className="mt-1 truncate text-xs text-muted-foreground">
                        {a.location}
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
