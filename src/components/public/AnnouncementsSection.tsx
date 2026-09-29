"use client";

// Data dikirim sebagai prop dari `app/page.tsx` (Server Component) — tidak ada
// fetch di browser. Tetap Client Component karena @phosphor-icons/react memakai
// React Context internal.
import type { Announcement } from "@/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CaretRight, Calendar, Clock, Star, Warning } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const priorityConfig = {
  normal: { icon: Clock, label: "Info", pill: "bg-muted text-muted-foreground" },
  important: { icon: Star, label: "Penting", pill: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  urgent: { icon: Warning, label: "Urgen", pill: "bg-red-500/10 text-red-700 dark:text-red-300" },
} as const;

type Priority = keyof typeof priorityConfig;

const PRIORITY_WEIGHT: Record<Priority, number> = {
  urgent: 0,
  important: 1,
  normal: 2,
};

// Gambar hanya dari data admin (imageUrl). Tanpa gambar → blok netral,
// bukan gambar acak dari layanan luar.
function coverFor(a: Announcement): string | null {
  if (a.imageUrl && (a.imageUrl.startsWith("http") || a.imageUrl.startsWith("/"))) return a.imageUrl;
  return null;
}

function CoverPlaceholder({ title, className }: { title: string; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex w-full items-center justify-center bg-gradient-to-br from-primary/[0.12] via-muted to-muted",
        className,
      )}
    >
      <span className="font-display text-4xl font-bold text-primary/30">
        {title.trim().charAt(0).toUpperCase() || "•"}
      </span>
    </div>
  );
}

function Meta({ announcement, light = false }: { announcement: Announcement; light?: boolean }) {
  const config = priorityConfig[announcement.priority as Priority];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* TODO(admin): tambah field kategori di tabel pengumuman, badge ini sementara memakai prioritas */}
      <Badge variant="secondary" className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", config.pill)}>
        <config.icon className="h-3 w-3" aria-hidden="true" />
        {config.label}
      </Badge>
      <time
        dateTime={announcement.publishedAt}
        className={cn(
          "flex items-center gap-1.5 text-xs tabular-nums",
          light ? "text-white/80" : "text-muted-foreground"
        )}
      >
        <Calendar className="h-3 w-3" aria-hidden="true" />
        {formatDate(announcement.publishedAt, { day: "numeric", month: "long", year: "numeric" })}
      </time>
    </div>
  );
}

function FeaturedCard({ announcement }: { announcement: Announcement }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-colors hover:border-primary/40">
      <div className="relative overflow-hidden bg-muted">
        {coverFor(announcement) ? (
          <img
            src={coverFor(announcement)!}
            alt={announcement.title}
            loading="eager"
            className="aspect-[16/9] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
        ) : (
          <CoverPlaceholder title={announcement.title} className="aspect-[16/9]" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 md:p-6">
        <Meta announcement={announcement} />
        <h3 className="font-display title-hover mt-3 text-balance text-xl font-semibold leading-snug text-foreground transition-colors group-hover:text-primary md:text-2xl">
          <a href="#pengumuman" aria-label={`Baca selengkapnya: ${announcement.title}`}>
            {announcement.title}
          </a>
        </h3>
        <p className="mt-1.5 text-xs text-muted-foreground">Oleh {announcement.author}</p>
        <p className="mt-2.5 line-clamp-3 text-[15px] leading-relaxed text-muted-foreground">
          {announcement.content}
        </p>
        <a
          href="#pengumuman"
          className="link-lively mt-4 inline-flex w-fit items-center gap-1 text-sm font-semibold text-primary"
        >
          Baca selengkapnya
          <CaretRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function SideCard({ announcement }: { announcement: Announcement }) {
  return (
    <article className="group flex gap-4 overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/40">
      <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-28 sm:w-36">
        {coverFor(announcement) ? (
          <img
            src={coverFor(announcement)!}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <CoverPlaceholder title={announcement.title} className="h-full" />
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <Meta announcement={announcement} />
        <h3 className="mt-1.5 line-clamp-2 text-balance text-[15px] font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
          <a href="#pengumuman" aria-label={`Baca selengkapnya: ${announcement.title}`}>
            {announcement.title}
          </a>
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">Oleh {announcement.author}</p>
      </div>
    </article>
  );
}

function LowerCard({ announcement }: { announcement: Announcement }) {
  return (
    <article className="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 sm:flex-row md:p-5">
      <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:h-36 sm:w-48 md:h-40 md:w-56">
        {coverFor(announcement) ? (
          <img
            src={coverFor(announcement)!}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <CoverPlaceholder title={announcement.title} className="h-full" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-balance text-lg font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
          <a href="#pengumuman" aria-label={`Baca selengkapnya: ${announcement.title}`}>
            {announcement.title}
          </a>
        </h3>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Oleh {announcement.author} <span aria-hidden="true">·</span>{" "}
          {formatDate(announcement.publishedAt, { day: "numeric", month: "short", year: "numeric" })}
        </p>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {announcement.content}
        </p>
        <a
          href="#pengumuman"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          Baca selengkapnya
          <CaretRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

export function AnnouncementsSection({
  announcements,
}: {
  announcements: Announcement[];
}) {
  const sorted = [...announcements].sort((a, b) => {
    const w = PRIORITY_WEIGHT[a.priority as Priority] - PRIORITY_WEIGHT[b.priority as Priority];
    if (w !== 0) return w;
    return +new Date(b.publishedAt) - +new Date(a.publishedAt);
  });

  const featured = sorted[0];
  //Layout: 1 besar di kiri, maksimal 3 kecil menumpuk di kanan, sisanya 2 kolom di bawah.
  const side = sorted.length > 5 ? sorted.slice(1, 4) : sorted.slice(1, 3);
  const lower = sorted.slice(1 + side.length);

  return (
    <section
      id="pengumuman"
      aria-labelledby="announcements-heading"
      className="scroll-mt-24 py-16 md:py-20"
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
          <h2
            id="announcements-heading"
            className="font-display text-h2-fluid font-semibold text-foreground"
          >
            Berita Terbaru
          </h2>
          <p className="mx-auto mt-2 max-w-[52ch] text-sm leading-relaxed text-muted-foreground md:text-base">
            Kabar kegiatan, kajian, dan info penting masjid. Dikelola pengurus.
          </p>
        </div>

        {sorted.length === 0 ? (
          <p className="mx-auto max-w-xl rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            Belum ada pengumuman. Kabar terbaru dari pengurus akan tampil di sini.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-3 lg:gap-6">
              {featured && (
                <div className="lg:col-span-2">
                  <FeaturedCard announcement={featured} />
                </div>
              )}
              <div className="flex flex-col gap-4 md:gap-5">
                {side.map((a) => (
                  <SideCard key={a.id} announcement={a} />
                ))}
              </div>
            </div>

            {lower.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-4 md:mt-5 md:gap-5 lg:gap-6 xl:grid-cols-2">
                {lower.map((a) => (
                  <LowerCard key={a.id} announcement={a} />
                ))}
              </div>
            )}

            <div className="mt-8 text-center">
              <a
                href="#pengumuman"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
              >
                Lihat semua pengumuman
                <CaretRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
