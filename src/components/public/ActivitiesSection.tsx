import { activities } from "@/lib/mock-data";
import type { Activity } from "@/types";
import { formatDate } from "@/lib/utils";
import { CaretRight, Clock, MapPin, User } from "@phosphor-icons/react";

// TODO(admin): ganti resolver ini dengan URL gambar dari CMS atau upload admin.
// Gambar lokal yang belum ada otomatis memakai placeholder picsum per id.
function coverFor(a: Activity, w: number, h: number): string {
  if (a.imageUrl && a.imageUrl.startsWith("http")) return a.imageUrl;
  return `https://picsum.photos/seed/masjid-${a.id}/${w}/${h}`;
}

function dayNumber(dateStr: string): string {
  return String(new Date(dateStr).getDate()).padStart(2, "0");
}

function shortMonth(dateStr: string): string {
  return formatDate(dateStr, { month: "short" }).replace(".", "");
}

function FeaturedCard({ activity }: { activity: Activity }) {
  return (
    <article className="group grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-colors hover:border-primary/40 md:grid-cols-2">
      <div className="relative min-h-56 overflow-hidden bg-muted md:min-h-full">
        <img
          src={coverFor(activity, 900, 600)}
          alt={activity.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-col p-5 md:p-7">
        <p className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tabular-nums">
          {formatDate(activity.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h3 className="mt-3 text-balance text-xl font-bold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary md:text-2xl">
          <a href="#kegiatan" aria-label={`Detail kegiatan: ${activity.title}`}>
            {activity.title}
          </a>
        </h3>
        <p className="mt-1.5 text-xs text-muted-foreground">Oleh {activity.organizer}</p>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
          {activity.description}
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="tabular-nums">{activity.time} WIB</span>
          </li>
          <li className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{activity.location}</span>
          </li>
          <li className="flex items-center gap-2.5">
            <User className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{activity.organizer}</span>
          </li>
        </ul>
        <a
          href="#kegiatan"
          className="mt-5 inline-flex w-fit items-center gap-1 text-sm font-semibold text-primary"
        >
          Lihat detail kegiatan
          <CaretRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function AgendaRow({ activity }: { activity: Activity }) {
  return (
    <article className="group">
      <a
        href="#kegiatan"
        aria-label={`Detail kegiatan: ${activity.title}`}
        className="flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.03] sm:gap-5 sm:p-4"
      >
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary/[0.07] tabular-nums sm:h-[72px] sm:w-[72px]">
          <span className="text-xl font-bold leading-none text-primary sm:text-2xl">
            {dayNumber(activity.date)}
          </span>
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-primary/75">
            {shortMonth(activity.date)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-balance text-[15px] font-bold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-base">
            {activity.title}
          </h3>
          <p className="mt-1 truncate text-xs text-muted-foreground sm:text-[13px]">
            {activity.time} WIB | {activity.location}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground/80">
            Oleh {activity.organizer}
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary">
          <CaretRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </a>
    </article>
  );
}

export function ActivitiesSection() {
  const sorted = [...activities].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const [featured, ...rest] = sorted;

  return (
    <section
      id="kegiatan"
      aria-labelledby="activities-heading"
      className="scroll-mt-24 bg-background py-16 md:py-20"
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl md:mb-10">
          <h2 id="activities-heading" className="text-balance text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Kegiatan Masjid
          </h2>
          <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted-foreground md:text-base">
            Agenda terdekat lebih dulu. Pengajian, khataman, baksos, dan kajian khusus.
          </p>
        </div>

        {featured && <FeaturedCard activity={featured} />}

        {rest.length > 0 && (
          <div className="mt-4 divide-y divide-border/60 rounded-2xl border border-border bg-card px-2 py-1 shadow-sm sm:px-3 md:mt-5">
            {rest.map((a) => (
              <AgendaRow key={a.id} activity={a} />
            ))}
          </div>
        )}

        <div className="mt-8">
          <a
            href="#kegiatan"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            Lihat semua kegiatan
            <CaretRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
