"use client";

// Data profil dikirim sebagai prop dari `app/page.tsx` (Server Component) —
// tidak ada fetch di browser. Komponen ini tetap Client Component karena
// @phosphor-icons/react memakai React Context internal.
import type { MosqueProfile } from "@/types";
import {
  ArrowUpRight,
  EnvelopeSimple,
  FacebookLogo,
  InstagramLogo,
  MapPin,
  Phone,
  TwitterLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";

// Isi href asli bila akun sudah ada. Entri bertanda "#" disembunyikan
// otomatis agar tidak ada ikon mati yang diklik jamaah.
const socialLinks = [
  { name: "Facebook", href: "#", icon: FacebookLogo },
  { name: "Instagram", href: "#", icon: InstagramLogo },
  { name: "YouTube", href: "#", icon: YoutubeLogo },
  { name: "Twitter", href: "#", icon: TwitterLogo },
];

const legalLinks = [
  { name: "Kebijakan Privasi", href: "#" },
  { name: "Syarat Penggunaan", href: "#" },
  { name: "Aksesibilitas", href: "#" },
];

function isRealHref(href: string): boolean {
  return href !== "#" && href.trim().length > 0;
}

export function Footer({ profile: mosqueProfile }: { profile: MosqueProfile | null }) {
  const currentYear = new Date().getFullYear();

  if (!mosqueProfile) {
    return (
      <footer id="kontak" className="relative scroll-mt-20 overflow-hidden bg-[#0B2B23] text-white" role="contentinfo">
        <div className="container mx-auto w-full px-4 py-8 md:px-6 md:py-10 lg:px-8">
          <p className="text-center text-[13px] text-white/60">
            &copy; {currentYear} Website Masjid. Kontak dan lokasi akan tampil setelah profil dilengkapi pengurus.
          </p>
        </div>
      </footer>
    );
  }

  const mapEmbedSrc = `https://maps.google.com/maps?q=${mosqueProfile.latitude},${mosqueProfile.longitude}&z=16&output=embed`;
  const mapLink = `https://maps.google.com/?q=${mosqueProfile.latitude},${mosqueProfile.longitude}`;
  const hasPhone = Boolean(mosqueProfile.phone?.trim());
  const hasEmail = Boolean(mosqueProfile.email?.trim());

  return (
    <footer id="kontak" className="relative scroll-mt-20 overflow-hidden bg-[#0B2B23] text-white" role="contentinfo">
      {/* Tekstur grid halus. Tanpa viewBox: pattern memakai satuan piksel asli,
          supaya kotaknya tetap 28px dan tidak melar mengikuti lebar footer. */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" aria-hidden="true">
        <svg className="h-full w-full text-white">
          <defs>
            <pattern id="footer-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-grid)" />
        </svg>
      </div>

      {/* Lebar mengikuti container halaman (bukan max-w-6xl) supaya tepi kiri-kanan
          footer sejajar dengan kartu konten di atasnya. */}
      <div className="relative container mx-auto w-full px-4 py-10 md:px-6 md:py-14 lg:px-8">
        <div className="grid gap-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-14 xl:gap-16">
          {/* Identitas masjid — porsi lebih besar supaya blok kiri tidak tenggelam
              di samping peta. */}
          <div className="flex flex-col">
            <div>
              <div className="flex items-center gap-4">
                {mosqueProfile.logoUrl?.trim() ? (
                  <img
                    src={mosqueProfile.logoUrl}
                    alt={`Logo ${mosqueProfile.name}`}
                    className="h-14 w-14 shrink-0 rounded-full border border-white/20 bg-white object-cover p-0.5 md:h-16 md:w-16"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white md:h-16 md:w-16">
                    <span className="text-lg font-bold text-[#0B2B23]">
                      {(mosqueProfile.shortName?.trim() || mosqueProfile.name?.trim() || "M").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-display text-2xl font-semibold text-white md:text-[28px] md:leading-tight">
                    {mosqueProfile.name}
                  </h3>
                  {mosqueProfile.establishedYear > 0 && (
                    <p className="mt-1 text-[13px] font-medium text-white/55">
                      Berdiri sejak {mosqueProfile.establishedYear}
                    </p>
                  )}
                </div>
              </div>

              {mosqueProfile.description?.trim() && (
                <p className="mt-5 line-clamp-3 max-w-[58ch] text-sm leading-relaxed text-white/65 md:text-[15px]">
                  {mosqueProfile.description}
                </p>
              )}

              <address className="mt-6 space-y-3 text-sm leading-relaxed text-white/75 not-italic md:text-[15px]">
                <p className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-[18px] w-[18px] shrink-0 text-white/40" weight="fill" aria-hidden="true" />
                  <span className="break-words">{mosqueProfile.address}</span>
                </p>
                {hasPhone && (
                  <p className="flex items-center gap-3">
                    <Phone className="h-[18px] w-[18px] shrink-0 text-white/40" weight="fill" aria-hidden="true" />
                    <a
                      href={`tel:${mosqueProfile.phone}`}
                      className="transition-colors hover:text-white focus-visible:outline-white"
                    >
                      {mosqueProfile.phone}
                    </a>
                  </p>
                )}
                {hasEmail && (
                  <p className="flex items-center gap-3">
                    <EnvelopeSimple className="h-[18px] w-[18px] shrink-0 text-white/40" weight="fill" aria-hidden="true" />
                    <a
                      href={`mailto:${mosqueProfile.email}`}
                      className="break-all transition-colors hover:text-white focus-visible:outline-white"
                    >
                      {mosqueProfile.email}
                    </a>
                  </p>
                )}
              </address>
            </div>

            {socialLinks.some((s) => isRealHref(s.href)) && (
              <div className="mt-6 flex items-center gap-2">
                {socialLinks
                  .filter((social) => isRealHref(social.href))
                  .map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:bg-white hover:text-[#0B2B23] focus-visible:outline-white"
                      aria-label={social.name}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <social.icon className="h-4 w-4" weight="fill" aria-hidden="true" />
                    </a>
                  ))}
              </div>
            )}
          </div>

          {/* Peta lokasi */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-white/15">
              <iframe
                title={`Peta lokasi ${mosqueProfile.name}`}
                src={mapEmbedSrc}
                className="block aspect-[16/10] w-full border-0 bg-white/10 lg:aspect-auto lg:h-[300px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/85 transition-colors hover:text-white focus-visible:outline-white"
            >
              Buka di Google Maps
              <ArrowUpRight className="h-3.5 w-3.5" weight="bold" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 border-t border-white/10 pt-5 text-center md:mt-12 md:flex-row md:justify-between md:text-left">
          <p className="text-[13px] text-white/60">
            Copyright &copy; {currentYear} {mosqueProfile.name}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-xs text-white/55 md:justify-end">
            {legalLinks.map((link, i) => (
              <span key={link.name} className="inline-flex items-center gap-2">
                {i > 0 && <span aria-hidden="true" className="h-3 w-px bg-white/15" />}
                {isRealHref(link.href) ? (
                  <a href={link.href} className="transition-colors hover:text-white focus-visible:outline-white">
                    {link.name}
                  </a>
                ) : (
                  <span>{link.name}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
