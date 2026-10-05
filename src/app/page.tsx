import { Hero } from "@/components/public/Hero";
import { Navbar } from "@/components/public/Navbar";
import { AnnouncementsSection } from "@/components/public/AnnouncementsSection";
import { ActivitiesSection } from "@/components/public/ActivitiesSection";
import { Footer } from "@/components/public/Footer";
import { getPublicHomeData } from "@/server/services/public-home";

// Data diambil SATU KALI di server lalu diteruskan sebagai props.
// Efeknya: HTML sudah berisi angka & berita terbaru (bagus untuk SEO dan HP
// lambat), dan halaman tidak lagi menembak ~10 request ke /api diri sendiri.
// `force-dynamic` = begitu pengurus menyimpan di /admin, kunjungan berikutnya
// langsung melihat data terbaru.
export const dynamic = "force-dynamic";

export default async function Home() {
  const {
    profile,
    prayer,
    announcements,
    activities,
  } = await getPublicHomeData();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {profile === null && (
        <p
          role="status"
          className="border-b border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-center text-[13px] font-medium text-amber-800 dark:text-amber-200"
        >
          Website masjid dalam penyiapan — pengurus dapat melengkapi profil, keuangan,
          dan jadwal lewat halaman admin.
        </p>
      )}
      {/* Navbar sticky: tetap di atas saat scroll. Dibuat transparan di
          atas hero (Hero ditarik naik -mt-14) lalu Navbar memberi latar
          blur otomatis setelah di-scroll (lihat Navbar `scrolled`). */}
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>
      <div id="beranda" className="-mt-14 scroll-mt-20">
        <Hero profile={profile} prayer={prayer} />
      </div>
      <main className="flex flex-1 flex-col">
        {/* Informasi */}
        <div id="informasi" className="flex scroll-mt-20 flex-col">
          <div className="border-y border-border/60 bg-muted/40">
            <AnnouncementsSection announcements={announcements} />
          </div>
          <ActivitiesSection activities={activities} />
        </div>
      </main>
      <Footer profile={profile} />
    </div>
  );
}
