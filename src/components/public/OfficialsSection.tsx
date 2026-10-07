"use client";

// Data dikirim sebagai prop dari `app/page.tsx` (Server Component) — tidak ada
// fetch di browser. Tetap Client Component karena @phosphor-icons/react memakai
// React Context internal.
import type { Official } from "@/types";
import { getInitials, cn } from "@/lib/utils";
import { levelOf, rankOf, normalizePosition, TIER_NAME } from "@/lib/positions";
import {
  Users,
  Crown,
  Phone,
  EnvelopeSimple,
  WhatsappLogo,
  ShieldCheck,
} from "@phosphor-icons/react";

/** "Superadmin"/"Admin" adalah istilah internal aplikasi, jadi di halaman publik
 *  diganti label yang dipahami jamaah. */
const TIER_LABEL: Record<Official["systemRole"], string> = {
  superadmin: "Ketua Takmir",
  admin: "Admin Masjid",
  bendahara: "Bendahara",
  pengurus: "Pengurus",
};

const LINE = "bg-border";

function avatarUrl(o: Official): string | null {
  if (o.avatar && (o.avatar.startsWith("http") || o.avatar.startsWith("/"))) return o.avatar;
  return null;
}

/** Nomor lokal 0857… → format wa.me yang bisa dibuka WhatsApp. */
function waLink(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const intl = digits.startsWith("0")
    ? `62${digits.slice(1)}`
    : digits.startsWith("8")
      ? `62${digits}`
      : digits;
  return `https://wa.me/${intl}`;
}

function prettyPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return /^0\d{9,11}$/.test(d)
    ? `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8, 12)}`
    : phone;
}

/** Label peran & hak akses sistem (diatur admin) selalu tampil di kartu agar
 *  konsisten antar pengurus — jabatan struktural tampil terpisah di bawah nama. */

function Avatar({ official, size }: { official: Official; size: "md" | "sm" }) {
  const url = avatarUrl(official);
  const dims = size === "md" ? "h-16 w-16 text-lg" : "h-12 w-12 text-sm";

  if (url) {
    return (
      <img
        src={url}
        alt={official.name}
        loading="lazy"
        draggable={false}
        className={cn(
          dims,
          "aspect-square shrink-0 rounded-full bg-muted object-cover ring-1 ring-border [object-position:center_20%]",
        )}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        dims,
        "font-display flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary ring-1 ring-primary/20",
      )}
    >
      {getInitials(official.name)}
    </span>
  );
}

/** Tiga aksi kontak dengan lebar sama — muat rapi di kartu sempit schema. */
function ContactRow({ official }: { official: Official }) {
  const tel = official.phone ? `tel:${official.phone.replace(/[^+\d]/g, "")}` : null;
  const wa = waLink(official.phone);
  const mail = official.email ? `mailto:${official.email}` : null;

  const cell =
    "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.07] hover:text-primary";

  if (!tel && !wa && !mail) {
    return (
      <p className="flex h-9 w-full items-center justify-center text-[11px] text-muted-foreground">
        Kontak belum dilengkapi.
      </p>
    );
  }

  return (
    <div className="flex w-full items-center gap-1.5">
      {tel && (
        <a
          href={tel}
          title={prettyPhone(official.phone)}
          aria-label={`Telepon ${official.name}`}
          className={cell}
        >
          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate text-[11px] font-semibold tabular-nums">
            {prettyPhone(official.phone)}
          </span>
        </a>
      )}
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          title="WhatsApp"
          aria-label={`Hubungi ${official.name} lewat WhatsApp`}
          className={cn(cell, "max-w-9 shrink-0 px-0")}
        >
          <WhatsappLogo className="h-4 w-4" weight="fill" aria-hidden="true" />
        </a>
      )}
      {mail && (
        <a
          href={mail}
          title="Email"
          aria-label={`Kirim email ke ${official.name}`}
          className={cn(cell, "max-w-9 shrink-0 px-0")}
        >
          <EnvelopeSimple className="h-4 w-4" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

function OfficialCard({
  official,
  lead = false,
  className,
}: {
  official: Official;
  lead?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex h-full flex-col items-center rounded-2xl border bg-card p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(4,47,34,0.45)]",
        lead ? "border-primary/30 shadow-[0_16px_34px_-22px_rgba(4,47,34,0.45)]" : "border-border",
        className,
      )}
    >
      <div className="relative mx-auto">
        <Avatar official={official} size={lead ? "md" : "sm"} />
        {lead && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card"
          >
            <Crown className="h-3 w-3" weight="fill" />
          </span>
        )}
      </div>

      {/* Badge peran & hak akses sistem selalu tampil agar konsisten di semua kartu. */}
      <p className="mt-2.5 inline-flex w-fit items-center self-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
        {TIER_LABEL[official.systemRole]}
      </p>

      <h3
        className={cn(
          "font-display mt-1.5 flex w-full items-center justify-center text-balance font-semibold leading-snug text-foreground",
          lead ? "min-h-[3.25rem] text-lg" : "min-h-[2.75rem] text-[15px]",
        )}
      >
        <span className="line-clamp-2">{official.name}</span>
      </h3>
      <p className="mt-0.5 flex min-h-[2.625rem] w-full items-start justify-center text-[13px] leading-relaxed text-muted-foreground">
        <span className="line-clamp-2">{normalizePosition(official.role)}</span>
      </p>

      {/* Kontak selalu menempel di dasar kartu supaya sejajar antar kartu. */}
      <div className="mt-auto w-full pt-3.5">
        <ContactRow official={official} />
      </div>
    </article>
  );
}

/** Satu baris tingkat: setiap kartu punya batang naik menuju garis walang di
 *  atasnya, dan (kalau ada tingkat di bawahnya) batang turun juga. */
function TierRow({
  items,
  lead = false,
  down = false,
}: {
  items: Official[];
  lead?: boolean;
  down?: boolean;
}) {
  return (
    <div className="grid w-full grid-cols-1 items-stretch gap-4 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((o) => (
        <div key={o.id} className="flex h-full flex-col items-center">
          {!lead && <div aria-hidden="true" className={cn("mb-6 h-6 w-px shrink-0", LINE)} />}
          <OfficialCard official={o} lead={lead} className="w-full flex-1" />
          {down && <div aria-hidden="true" className={cn("mt-6 h-6 w-px shrink-0", LINE)} />}
        </div>
      ))}
    </div>
  );
}

export function OfficialsSection({ officials }: { officials: Official[] }) {
  // Urutan hanya dari Jabatan (lihat src/lib/positions.ts): jenjang jabatan
  // dulu, lalu urutan di dalam jenjang itu, lalu tanggal bergabung paling awal.
  // `systemRole` sengaja tidak dipakai — itu hak akses aplikasi, bukan posisi.
  const sorted = [...officials].sort(
    (a, b) =>
      levelOf(a.role) - levelOf(b.role) ||
      rankOf(a.role) - rankOf(b.role) ||
      (a.joinedDate < b.joinedDate ? -1 : 1),
  );

  // Schema hanya punya satu puncak, jadi ketua kedua otomatis turun ke
  // tingkat pengurus harian.
  const tiers: Official[][] = [[], [], []];
  let rootTaken = false;
  for (const o of sorted) {
    let level = levelOf(o.role);
    if (level === 0) {
      level = rootTaken ? 1 : 0;
      rootTaken = true;
    }
    tiers[level].push(o);
  }

  const hasLower = tiers[1].length > 0;
  const hasBottom = tiers[2].length > 0;
  const filled = tiers.map((t) => t.length).filter((n) => n > 0);

  return (
    <section
      id="pengurus"
      aria-labelledby="officials-heading"
      className="relative scroll-mt-24 overflow-hidden bg-background py-14 md:py-20"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/40 to-background" />
        <div className="absolute top-[-5rem] left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/[0.08] blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 md:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-xl text-center md:mb-12">
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
          <p className="mx-auto mt-2.5 max-w-[46ch] text-pretty text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            Susunan kepengurusan masjid beserta kontak yang dapat dihubungi.
          </p>
        </div>

        {sorted.length === 0 ? (
          <p className="mx-auto max-w-xl rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
            Belum ada data pengurus. Susunan takmir akan tampil di sini setelah
            dilengkapi lewat halaman admin.
          </p>
        ) : (
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col items-center">
              {/* Tingkat 1 — selalu tepat satu orang */}
              {tiers[0].map((o) => (
                <div key={o.id} className="flex w-full max-w-[16rem] flex-col items-center">
                  <OfficialCard official={o} lead className="w-full" />
                  {hasLower && <div aria-hidden="true" className={cn("h-8 w-px", LINE)} />}
                </div>
              ))}

              {/* Tingkat 2 — pengurus harian */}
              {hasLower && (
                <>
                  <div aria-hidden="true" className={cn("h-px w-full", LINE)} />
                  <TierRow items={tiers[1]} down={hasBottom} />
                </>
              )}

              {/* Tingkat 3 — anggota */}
              {hasBottom && (
                <>
                  <div aria-hidden="true" className={cn("h-px w-full", LINE)} />
                  <TierRow items={tiers[2]} />
                </>
              )}
            </div>

            <p className="mt-12 flex flex-col items-center gap-2 text-center text-[13px] text-muted-foreground">
              <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 tabular-nums">
                {filled.map((n, i) => (
                  <span key={TIER_NAME[i]} className="inline-flex items-center gap-1.5">
                    {i > 0 && <span aria-hidden="true">•</span>}
                    {n} {TIER_NAME[i]}
                  </span>
                ))}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                Struktur mengikuti jabatan yang diisi di halaman admin.
              </span>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
