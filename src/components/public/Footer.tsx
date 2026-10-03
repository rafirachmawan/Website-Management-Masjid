"use client";

// Data profil dikirim sebagai prop dari `app/page.tsx` (Server Component) —
// tidak ada fetch di browser. Komponen ini tetap Client Component karena
// @phosphor-icons/react memakai React Context internal.
import type { MosqueProfile } from "@/types";
import { FacebookLogo, InstagramLogo, YoutubeLogo, TwitterLogo } from "@phosphor-icons/react";

const socialLinks = [
  { name: "Facebook", href: "#", icon: FacebookLogo },
  { name: "Instagram", href: "#", icon: InstagramLogo },
  { name: "YouTube", href: "#", icon: YoutubeLogo },
  { name: "Twitter", href: "#", icon: TwitterLogo },
];

export function Footer({ profile: mosqueProfile }: { profile: MosqueProfile | null }) {
  const currentYear = new Date().getFullYear();

  if (!mosqueProfile) {
    return (
      <footer id="kontak" className="relative scroll-mt-20 overflow-hidden bg-[#0B2B23] text-white" role="contentinfo">
        <div className="relative mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-7">
          <p className="text-center text-[13px] text-white/60">
            &copy; {currentYear} Website Masjid. Kontak dan lokasi akan tampil setelah profil dilengkapi pengurus.
          </p>
        </div>
      </footer>
    );
  }

  const mapEmbedSrc = `https://maps.google.com/maps?q=${mosqueProfile.latitude},${mosqueProfile.longitude}&z=16&output=embed`;
  const mapLink = `https://maps.google.com/?q=${mosqueProfile.latitude},${mosqueProfile.longitude}`;

  return (
    <footer id="kontak" className="relative scroll-mt-20 overflow-hidden bg-[#0B2B23] text-white" role="contentinfo">
      <div className="pointer-events-none absolute inset-0 opacity-[0.035]" aria-hidden="true">
        <svg className="h-full w-full text-white" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="footer-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="currentColor" strokeWidth="0.4" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#footer-grid)" />
        </svg>
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          {/* Identitas masjid */}
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
              <span className="text-base font-bold text-[#0B2B23]">
                {mosqueProfile.shortName.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <h3 className="font-display mt-4 text-xl font-semibold text-white md:text-2xl">
              {mosqueProfile.name}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              {mosqueProfile.address}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-white/70">
              Telp.{" "}
              <a href={`tel:${mosqueProfile.phone}`} className="transition-colors hover:text-white">
                {mosqueProfile.phone}
              </a>
              <span aria-hidden="true"> | </span>
              <a href={`mailto:${mosqueProfile.email}`} className="transition-colors hover:text-white">
                {mosqueProfile.email}
              </a>
            </p>
            <div className="mt-4 flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0B2B23] transition-opacity hover:opacity-85"
                  aria-label={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="h-4 w-4" weight="fill" />
                </a>
              ))}
            </div>
          </div>

          {/* Peta lokasi */}
          <div>
            <iframe
              title={`Peta lokasi ${mosqueProfile.name}`}
              src={mapEmbedSrc}
              className="h-56 w-full rounded-xl border border-white/15 bg-white/10 md:h-64"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs font-semibold text-white hover:underline"
            >
              Buka di Google Maps
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-white/15 pt-5 text-center">
          <p className="text-[13px] text-white/60">
            Copyright &copy; {currentYear} {mosqueProfile.name}
          </p>
          <div className="mt-2 flex items-center justify-center gap-3 text-xs text-white/50">
            <a href="#" className="transition-colors hover:text-white">Kebijakan Privasi</a>
            <span aria-hidden="true" className="h-3 w-px bg-white/15" />
            <a href="#" className="transition-colors hover:text-white">Syarat Penggunaan</a>
            <span aria-hidden="true" className="h-3 w-px bg-white/15" />
            <a href="#" className="transition-colors hover:text-white">Aksesibilitas</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
