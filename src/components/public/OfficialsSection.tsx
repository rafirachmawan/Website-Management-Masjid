"use client";

// Data dikirim sebagai prop dari `app/page.tsx` (Server Component) — tidak ada
// fetch di browser. Tetap Client Component karena @phosphor-icons/react memakai
// React Context internal.
import type { Official } from "@/types";
import { getInitials, cn } from "@/lib/utils";
import { Users, Phone, Envelope, Crown } from "@phosphor-icons/react";

const ROLE_RANK: Record<Official["systemRole"], number> = {
  superadmin: 0,
  admin: 1,
  bendahara: 2,
  pengurus: 3,
};

const ROLE_LABEL: Record<Official["systemRole"], string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  bendahara: "Bendahara",
  pengurus: "Pengurus",
};

function avatarUrl(o: Official): string | null {
  if (o.avatar && (o.avatar.startsWith("http") || o.avatar.startsWith("/"))) return o.avatar;
  return null;
}

function Avatar({ official, size }: { official: Official; size: "lg" | "md" }) {
  const url = avatarUrl(official);
  const dims = size === "lg" ? "h-20 w-20 text-2xl" : "h-16 w-16 text-xl";
  if (url) {
    return (
      <img
        src={url}
        alt={official.name}
        loading="lazy"
        className={cn(dims, "shrink-0 rounded-full bg-muted object-cover ring-1 ring-border")}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        dims,
        "flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-display font-semibold text-primary ring-1 ring-border",
      )}
    >
      {getInitials(official.name)}
    </span>
  );
}

function RoleBadge({ official }: { official: Official }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
        official.systemRole === "superadmin"
          ? "bg-primary text-primary-foreground ring-primary"
          : "bg-muted text-muted-foreground ring-border",
      )}
    >
      {official.systemRole === "superadmin" && <Crown className="h-3 w-3" aria-hidden="true" />}
      {ROLE_LABEL[official.systemRole]}
    </span>
  );
}

function ContactLinks({ official }: { official: Official }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {official.phone && (
        <a
          href={`tel:${official.phone.replace(/[^+\d]/g, "")}`}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
        >
          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
          {official.phone}
        </a>
      )}
      {official.email && (
        <a
          href={`mailto:${official.email}`}
          aria-label={`Kirim email ke ${official.name}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
        >
          <Envelope className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

export function OfficialsSection({ officials }: { officials: Official[] }) {
  if (officials.length === 0) return null;

  const sorted = [...officials].sort(
    (a, b) => ROLE_RANK[a.systemRole] - ROLE_RANK[b.systemRole] || (a.joinedDate < b.joinedDate ? -1 : 1),
  );
  const [leader, ...rest] = sorted;

  return (
    <section
      id="pengurus"
      aria-labelledby="officials-heading"
      className="scroll-mt-24 bg-background py-16 md:py-20"
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1 text-xs font-semibold text-primary">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            Takmir & Pengurus
          </p>
          <h2
            id="officials-heading"
            className="font-display text-h2-fluid mt-3 font-semibold text-foreground"
          >
            Pengurus Masjid
          </h2>
          <p className="mx-auto mt-2 max-w-[52ch] text-sm leading-relaxed text-muted-foreground md:text-base">
            Amanah pengelolaan masjid diemban bersama para pengurus berikut.
          </p>
        </div>

        {/* Satu baris grid untuk semua orang: kartuketua menyatu di baris
            yang sama sehingga tidak ada blok yang meleset ke kanan. */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {leader && (
            <article className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 sm:col-span-2 md:p-6">
              <Avatar official={leader} size="lg" />
              <div className="min-w-0">
                <RoleBadge official={leader} />
                <h3 className="font-display mt-2 text-balance text-xl font-semibold leading-snug text-foreground">
                  {leader.name}
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{leader.role}</p>
                <div className="mt-3">
                  <ContactLinks official={leader} />
                </div>
              </div>
            </article>
          )}

          {rest.map((o) => (
            <article
              key={o.id}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center transition-colors hover:border-primary/35"
            >
              <Avatar official={o} size="md" />
              <div className="min-w-0">
                <h3 className="truncate text-[15px] font-semibold text-foreground">{o.name}</h3>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {o.role}
                </p>
              </div>
              <RoleBadge official={o} />
              <ContactLinks official={o} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
