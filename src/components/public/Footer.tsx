import { mosqueProfile } from "@/lib/mock-data";
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
    { name: "Grafik Keuangan", href: "#grafik" },
    { name: "Rincian Transaksi", href: "#transaksi" },
  ],
  Informasi: [
    { name: "Pengumuman", href: "#pengumuman" },
    { name: "Jadwal Sholat", href: "#jadwal-sholat" },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-[#0B2B23] text-white" role="contentinfo">
      {/* Gema grid hero dalam versi terang-di-gelap */}
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
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" aria-hidden="true" />

      <div className="container relative mx-auto px-4 pt-14 pb-10 md:px-6 md:pt-16 lg:px-8">
        <div className="mb-10 max-w-2xl md:mb-12">
          <p className="text-xl font-bold tracking-tight text-balance md:text-2xl">{mosqueProfile.name}</p>
          <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-white/70">
            {mosqueProfile.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr] lg:gap-12">
          <div className="lg:col-span-1">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <span className="text-lg font-bold text-white">AI</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">{mosqueProfile.shortName}</h3>
                <p className="text-xs text-white/60">Didirikan {mosqueProfile.establishedYear}</p>
              </div>
            </div>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-white/65">
              Pusat ibadah, kajian, dan program sosial warga, dikelola takmir dan diawasi jamaah.
            </p>
            <div className="flex items-center gap-1.5">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Navigasi Keuangan">
            <h4 className="mb-4 font-semibold text-white">Keuangan</h4>
            <ul className="space-y-2.5 text-sm">
              {navigation.Keuangan.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="block py-0.5 text-white/60 transition-colors hover:text-white">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Navigasi Informasi">
            <h4 className="mb-4 font-semibold text-white">Informasi</h4>
            <ul className="space-y-2.5 text-sm">
              {navigation.Informasi.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="block py-0.5 text-white/60 transition-colors hover:text-white">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h4 className="mb-4 font-semibold text-white">Kontak & Lokasi</h4>
            <address className="space-y-3 text-sm text-white/65 not-italic">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-white/50" />
                <div>
                  <p className="leading-relaxed">{mosqueProfile.address}</p>
                  <a href={`https://maps.google.com/?q=${mosqueProfile.latitude},${mosqueProfile.longitude}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-white hover:underline">
                    Buka di Google Maps
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-white/50" />
                <a href={`tel:${mosqueProfile.phone}`} className="transition-colors hover:text-white">
                  {mosqueProfile.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Envelope className="h-5 w-5 shrink-0 text-white/50" />
                <a href={`mailto:${mosqueProfile.email}`} className="transition-colors hover:text-white">
                  {mosqueProfile.email}
                </a>
              </div>
            </address>
          </div>
        </div>

        <div className="my-8 h-px bg-white/10" />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-white/60 md:text-left">
            &copy; {currentYear} {mosqueProfile.name}. Hak cipta dilindungi.
            <span className="mt-1 block text-xs text-white/45">Dibangun untuk transparansi keuangan dan informasi jamaah.</span>
          </p>

          <div className="flex items-center gap-4 text-sm text-white/60">
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