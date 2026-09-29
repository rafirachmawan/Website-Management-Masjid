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
  const dims = size === "lg" ? "h-24 w-24 text-3xl md:h-28 md:w-28" : "h-16 w-16 text-xl";
  if (url) {
    return (
      <img
        src={url}
        alt={official.name}
        loading="lazy"
        className={cn(dims, "shrink-0 rounded-full border-2 border-white/60 object-cover shadow-md")}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        dims,
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-800 font-display font-bold text-white shadow-md",
      )}
    >
      {getInitials(official.name)}
    </span>
  );
}

function RoleBadge({ official, light = false }: { official: Official; light?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset",
        light
          ? "bg-white/10 text-emerald-100 ring-white/20"
          : "bg-primary/[0.08] text-primary ring-primary/20",
      )}
    >
      {official.systemRole === "superadmin" && <Crown className="h-3 w-3" aria-hidden="true" />}
      {ROLE_LABEL[official.systemRole]}
    </span>
  );
}

function ContactLinks({ official, light = false }: { official: Official; light?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {official.phone && (
        <a
          href={`tel:${official.phone.replace(/[^+\d]/g, "")}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            light
              ? "bg-white/10 text-white ring-1 ring-white/15 ring-inset hover:bg-white/20"
              : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary",
          )}
        >
          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
          {official.phone}
        </a>
      )}
      {official.email && (
        <a
          href={`mailto:${official.email}`}
          aria-label={`Kirim email ke ${official.name}`}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
            light
              ? "bg-white/10 text-white ring-1 ring-white/15 ring-inset hover:bg-white/20"
              : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary",
          )}
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
      className="relative scroll-mt-24 overflow-hidden bg-background py-16 md:py-20"
    >
      {/* Ambient — selaras dengan seksi keuangan */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/40 to-background" />
        <div className="absolute top-[-6rem] left-[-6rem] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 md:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
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

        {leader && (
          <div className="relative mx-auto mb-4 max-w-3xl overflow-hidden rounded-[24px] bg-emerald-950 p-6 text-white shadow-[0_28px_60px_-24px_rgba(4,47,34,0.65)] ring-1 ring-white/10 sm:p-7 md:mb-5 md:p-8">
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-950 to-[#021a12]" />
              <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
              <div className="absolute inset-0 rounded-[24px] ring-1 ring-white/10 ring-inset" />
            </div>
            <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              <Avatar official={leader} size="lg" />
              <div className="min-w-0 flex-1">
                <RoleBadge official={leader} light />
                <h3 className="font-display mt-2 text-balance text-xl font-semibold leading-snug md:text-2xl">
                  {leader.name}
                </h3>
                <p className="mt-1 text-sm text-white/70">{leader.role}</p>
                <div className="mt-3 flex justify-center sm:justify-start">
                  <ContactLinks official={leader} light />
                </div>
              </div>
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {rest.map((o) => (
              <article
                key={o.id}
                className="group flex flex-col items-center gap-3 rounded-[24px] border border-border bg-card p-6 text-center shadow-[0_18px_40px_-28px_rgba(4,47,34,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30"
              >
                <Avatar official={o} size="md" />
                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                    {o.name}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {o.role}
                  </p>
                </div>
                <RoleBadge official={o} />
                <ContactLinks official={o} />
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
