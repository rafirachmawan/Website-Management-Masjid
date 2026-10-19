import { ImageResponse } from "next/og";
import { getMosqueProfile } from "@/server/services/mosque";

// Kartu pratinjau saat tautan dibagikan (WhatsApp/Facebook/Twitter).
// Dibuat saat-runtime oleh Next (bukan file PNG statis) supaya nama masjid
// selalu mengikuti data terbaru dari database.
export const alt = "Keuangan Masjid — transparansi kas untuk jamaah";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Nama masjid dibaca dari database → jangan di-cache sebagai halaman statis,
// agar kartu pratinjau ikut berubah begitu profil diperbarui.
export const dynamic = "force-dynamic";

export default async function OpengraphImage() {
  // Kegagalan DB tidak boleh merusak kartu pratinjau → fallback generik.
  const profile = await getMosqueProfile().catch(() => null);
  const name = profile?.name?.trim() || "Masjid";
  const address = profile?.address?.trim() || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #04301f 0%, #064e3b 55%, #0b6b4f 100%)",
          color: "#f0fdf4",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(240, 253, 244, 0.14)",
              border: "1px solid rgba(240, 253, 244, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
            }}
          >
            ☾
          </div>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "rgba(240, 253, 244, 0.85)",
            }}
          >
            Transparansi Keuangan
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.1 }}>{name}</div>
          <div style={{ fontSize: 32, color: "rgba(240, 253, 244, 0.82)" }}>
            Laporan kas, pengumuman, agenda, dan jadwal salat untuk jamaah.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 26,
            color: "rgba(240, 253, 244, 0.75)",
          }}
        >
          <div>{address}</div>
          <div style={{ fontWeight: 600, color: "#f0fdf4" }}>Kas masjid terbuka</div>
        </div>
      </div>
    ),
    size,
  );
}
