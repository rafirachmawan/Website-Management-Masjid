import { announcements } from "@/lib/mock-data";
import type { Announcement } from "@/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CaretRight, Clock, Calendar, Warning, Star } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const priorityConfig = {
  normal: { icon: Clock, label: "Info", dot: "bg-muted-foreground/40", pill: "bg-muted text-muted-foreground" },
  important: { icon: Star, label: "Penting", dot: "bg-amber-500", pill: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  urgent: { icon: Warning, label: "Urgen", dot: "bg-red-500", pill: "bg-red-500/10 text-red-700 dark:text-red-300" },
} as const;

type Priority = keyof typeof priorityConfig;

function AnnouncementRow({ announcement, featured }: { announcement: Announcement; featured?: boolean }) {
  const config = priorityConfig[announcement.priority as Priority];

  return (
    <article
      className={cn(
        "group relative p-5 transition-colors hover:bg-primary/[0.02] md:p-6",
        featured && "bg-primary/[0.03]",
        announcement.priority === "urgent" && "bg-red-500/[0.03] hover:bg-red-500/[0.05]"
      )}
    >
      <div className="flex items-start gap-4">
        <span className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", config.dot)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", config.pill)}>
              <config.icon className="h-3 w-3" aria-hidden="true" />
              {config.label}
            </Badge>
            <time className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {formatDate(announcement.publishedAt, { day: "numeric", month: "long", year: "numeric" })}
            </time>
            <span className="text-xs text-muted-foreground">Oleh {announcement.author}</span>
          </div>
          <h3
            className={cn(
              "mt-3 tracking-tight text-balance text-foreground transition-colors group-hover:text-primary",
              featured ? "text-xl font-bold md:text-2xl" : "text-lg font-semibold"
            )}
          >
            {announcement.title}
          </h3>
          {announcement.imageUrl && (
            <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-muted">
              <img
                src={announcement.imageUrl}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="aspect-[16/7] w-full object-cover"
              />
            </div>
          )}
          <p className={cn("mt-2.5 leading-relaxed text-muted-foreground", featured ? "text-[15px] line-clamp-3" : "text-sm line-clamp-2")}>
            {announcement.content}
          </p>
          <a
            href="#pengumuman"
            aria-label={`Baca selengkapnya: ${announcement.title}`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Baca selengkapnya
            <CaretRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

export function AnnouncementsSection() {
  const [first, ...rest] = announcements;
  return (
    <section
      id="pengumuman"
      aria-labelledby="announcements-heading"
      className="scroll-mt-24 py-16 md:py-20"
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl md:mb-10">
          <h2 id="announcements-heading" className="text-2xl font-bold tracking-tight text-balance text-foreground md:text-3xl">
            Pengumuman Masjid
          </h2>
          <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-muted-foreground md:text-base">
            {announcements.length} info terbaru. Yang terpenting selalu di paling atas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-12 lg:gap-6">
          {first && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:col-span-7">
              <AnnouncementRow announcement={first} featured />
            </div>
          )}
          <div className="flex flex-col gap-4 md:gap-5 lg:col-span-5">
            {rest.map((announcement) => (
              <div
                key={announcement.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                <AnnouncementRow announcement={announcement} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <a
            href="#pengumuman"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            Lihat semua pengumuman
            <CaretRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}