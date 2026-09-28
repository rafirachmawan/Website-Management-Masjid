"use client";

// Data profil dikirim sebagai prop dari `app/page.tsx` (Server Component) —
// tidak ada fetch di browser. Komponen ini tetap Client Component karena
// @phosphor-icons/react memakai React Context internal.
import type { MosqueProfile } from "@/types";
import { Envelope, Phone, MapPin, FacebookLogo, InstagramLogo, YoutubeLogo, TwitterLogo } from "@phosphor-icons/react";

const socialLinks = [
  { name: "Facebook", href: "#", icon: FacebookLogo },
  { name: "Instagram", href: "#", icon: InstagramLogo },
  { name: "YouTube", href: "#", icon: YoutubeLogo },
  { name: "Twitter", href: "#", icon: TwitterLogo },
];

const navigation = {
  Keuangan: [
    { name: "Ringkasan Kas", href: "#ringkasan" },
    { name: "Grafik Bulanan", href: "#grafik" },
    { name: "Rincian Transaksi", href: "#transaksi" },
  ],
  Informasi: [
    { name: "Pengumuman", href: "#pengumuman" },
    { name: "Kegiatan", href: "#kegiatan" },
    { name: "Jadwal Sholat", href: "#jadwal-sholat" },
  ],
};

export function Footer({ profile: mosqueProfile }: { profile: MosqueProfile }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="kontak" className="relative scroll-mt-20 overflow-hidden bg-[#0B2B23] text-white" role="contentinfo">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden="true">
        <svg className="h-full w-full text-white" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="footer-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#footer-grid)" />
        </svg>
      </div>

      <div className="container relative mx-auto px-4 py-8 md:px-6 md:py-10 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_0.8fr_1.5fr] lg:gap-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                <span className="text-sm font-bold text-white">AR</span>
              </div>
              <div>
                <h3 className="font-display text-[15px] font-semibold text-white">{mosqueProfile.name}</h3>
                <p className="text-xs text-white/55">Didirikan {mosqueProfile.establishedYear}</p>
              </div>
            </div>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-white/60">
              Pusat ibadah, kajian, dan program sosial warga.
            </p>
            <div className="mt-3 flex items-center gap-1">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Navigasi Keuangan">
            <h4 className="mb-3 text-sm font-semibold text-white">Keuangan</h4>
            <ul className="space-y-2 text-[13px]">
              {navigation.Keuangan.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-white/60 transition-colors hover:text-white">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Navigasi Informasi">
            <h4 className="mb-3 text-sm font-semibold text-white">Informasi</h4>
            <ul className="space-y-2 text-[13px]">
              {navigation.Informasi.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-white/60 transition-colors hover:text-white">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Kontak dan Lokasi</h4>
            <address className="space-y-2.5 text-[13px] text-white/60 not-italic">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
                <div>
                  <p className="leading-relaxed">{mosqueProfile.address}</p>
                  <a href={`https://maps.google.com/?q=${mosqueProfile.latitude},${mosqueProfile.longitude}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-white hover:underline">
                    Buka di Google Maps
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-white/45" />
                <a href={`tel:${mosqueProfile.phone}`} className="transition-colors hover:text-white">
                  {mosqueProfile.phone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Envelope className="h-4 w-4 shrink-0 text-white/45" />
                <a href={`mailto:${mosqueProfile.email}`} className="transition-colors hover:text-white">
                  {mosqueProfile.email}
                </a>
              </div>
            </address>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-white/50 md:flex-row">
          <p>
            &copy; {currentYear} {mosqueProfile.name}. Hak cipta dilindungi.
          </p>
          <div className="flex items-center gap-3">
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
