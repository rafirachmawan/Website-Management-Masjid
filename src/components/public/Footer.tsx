import { mosqueProfile } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Envelope, Phone, MapPin, FacebookLogo, InstagramLogo, YoutubeLogo, TwitterLogo, Globe } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const socialLinks = [
  { name: "Facebook", href: "#", icon: FacebookLogo },
  { name: "Instagram", href: "#", icon: InstagramLogo },
  { name: "YouTube", href: "#", icon: YoutubeLogo },
  { name: "Twitter", href: "#", icon: TwitterLogo },
];

const navigation = {
  Keuangan: [
    { name: "Ringkasan Kas", href: "#kas" },
    { name: "Grafik Keuangan", href: "#grafik" },
    { name: "Rincian Transaksi", href: "#transaksi" },
    { name: "Laporan Bulanan", href: "#laporan" },
  ],
  Informasi: [
    { name: "Pengumuman", href: "#pengumuman" },
    { name: "Kegiatan", href: "#kegiatan" },
    { name: "Jadwal Sholat", href: "#jadwal-sholat" },
    { name: "Galeri Kegiatan", href: "#galeri" },
  ],
  Profil: [
    { name: "Sejarah Masjid", href: "#sejarah" },
    { name: "Struktur Pengurus", href: "#pengurus" },
    { name: "Kontak Kami", href: "#kontak" },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/30 border-t border-border" role="contentinfo">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-xl">AI</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{mosqueProfile.name}</h3>
                <p className="text-xs text-muted-foreground">Didirikan {mosqueProfile.establishedYear}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
              {mosqueProfile.description}
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Navigasi Keuangan">
            <h4 className="font-semibold text-foreground mb-4">Keuangan</h4>
            <ul className="space-y-2 text-sm">
              {navigation.Keuangan.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Navigasi Informasi">
            <h4 className="font-semibold text-foreground mb-4">Informasi</h4>
            <ul className="space-y-2 text-sm">
              {navigation.Informasi.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Kontak & Lokasi</h4>
            <address className="not-italic text-sm text-muted-foreground space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p>{mosqueProfile.address}</p>
                  <a href={`https://maps.google.com/?q=${mosqueProfile.latitude},${mosqueProfile.longitude}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs mt-1 inline-block">
                    Buka di Google Maps
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <a href={`tel:${mosqueProfile.phone}`} className="hover:text-primary transition-colors">
                  {mosqueProfile.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Envelope className="w-5 h-5 flex-shrink-0" />
                <a href={`mailto:${mosqueProfile.email}`} className="hover:text-primary transition-colors">
                  {mosqueProfile.email}
                </a>
              </div>
            </address>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {currentYear} {mosqueProfile.name}. Hak cipta dilindungi.
            <br />
            Dibangun untuk transparansi keuangan dan informasi jamaah.
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Kebijakan Privasi</a>
            <span aria-hidden="true">·</span>
            <a href="#" className="hover:text-primary transition-colors">Syarat Penggunaan</a>
            <span aria-hidden="true">·</span>
            <a href="#" className="hover:text-primary transition-colors">Aksesibilitas</a>
          </div>
        </div>
      </div>
    </footer>
  );
}