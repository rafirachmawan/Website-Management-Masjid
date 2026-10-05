import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { ShareButtons } from "@/components/public/ShareButtons";
import { getActivityById, getActivities } from "@/server/services/content";
import { getMosqueProfile } from "@/server/services/mosque";
import { formatDate } from "@/lib/utils";

// Selalu baca dari database — begitu pengurus menyimpan di /admin,
// kunjungan berikutnya langsung melihat data terbaru.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

// Ikon SVG inline — aman dipakai di Server Component
// (paket ikon berbasis context tidak bisa diimpor langsung di RSC).
function MetaIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-primary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function TagIcon() {
  return (
    <MetaIcon>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </MetaIcon>
  );
}

function CalendarIcon() {
  return (
    <MetaIcon>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </MetaIcon>
  );
}

function ClockIcon() {
  return (
    <MetaIcon>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </MetaIcon>
  );
}

function PinIcon() {
  return (
    <MetaIcon>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </MetaIcon>
  );
}

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

  const latest = all.filter((a) => a.id !== item.id).slice(0, 5);
  const fullDate = formatDate(item.date, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const info = [
    { label: "Hari & Tanggal", value: fullDate },
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
        <div className="container mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* ── Artikel utama ─────────────────────────────────── */}
            <article className="h-fit overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="p-5 md:p-7 md:pb-5">
                <h1 className="text-2xl leading-tight font-bold text-primary md:text-[2rem] md:leading-[1.2]">
                  {item.title}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <TagIcon />
                    Kegiatan
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon />
                    <span className="tabular-nums">{fullDate}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon />
                    <span className="tabular-nums">{item.time} WIB</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <PinIcon />
                    {item.location}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-y border-border/70 py-2.5">
                  <span className="text-sm font-medium text-foreground">Share :</span>
                  <ShareButtons title={item.title} />
                </div>
              </div>

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

              <div className="p-5 md:p-7">
                <dl className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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

                <div className="mt-8 flex flex-wrap gap-2.5">
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
              </div>
            </article>

            {/* ── Sidebar kegiatan terbaru ──────────────────────── */}
            <aside aria-label="Kegiatan terbaru">
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <h2 className="bg-primary px-4 py-2.5 text-sm font-bold tracking-wide text-primary-foreground uppercase">
                  Kegiatan Terbaru
                </h2>
                {latest.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    Belum ada kegiatan lain.
                  </p>
                ) : (
                  <ul className="divide-y divide-border/70">
                    {latest.map((a) => (
                      <li key={a.id}>
                        <Link
                          href={`/kegiatan/${a.id}`}
                          className="group flex gap-3 p-3.5 transition-colors hover:bg-muted/50"
                        >
                          {a.imageUrl && (a.imageUrl.startsWith("http") || a.imageUrl.startsWith("/")) ? (
                            <img
                              src={a.imageUrl}
                              alt=""
                              aria-hidden="true"
                              loading="lazy"
                              className="h-20 w-24 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="flex h-20 w-24 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/[0.15] via-muted to-muted"
                            >
                              <span className="font-display text-2xl font-bold text-primary/40">
                                {a.title.trim().charAt(0).toUpperCase() || "•"}
                              </span>
                            </span>
                          )}
                          <span className="min-w-0">
                            <span className="line-clamp-3 text-sm leading-snug font-semibold text-foreground transition-colors group-hover:text-primary">
                              {a.title}
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground tabular-nums">
                              {formatDate(a.date, { day: "2-digit", month: "2-digit", year: "numeric" })}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer profile={profile} />
    </div>
  );
}
