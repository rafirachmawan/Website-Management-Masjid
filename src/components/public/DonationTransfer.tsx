"use client";

import { useState } from "react";
import type { AppConfig } from "@/types";
import { Bank, Copy, Check, ShieldCheck } from "@phosphor-icons/react";

// Strip rekening resmi — gaya disamakan dengan FinancialSummaryCards:
// permukaan bg-card, border-border, radius 2xl, tombol pill. Tanpa gradien,
// tanpa kaca, tanpa tiga kartu generik. Data dari /admin → Pengaturan →
// Rekening & Kas (bankName, accountNumber, accountHolder).
export function DonationTransfer({ config }: { config: AppConfig }) {
  const [copied, setCopied] = useState(false);

  // Hormati preferensi admin + jangan tampilkan kartu kosong bila admin
  // belum mengisi rekening atau QRIS.
  if (!config.showDonationQRIS) return null;
  const bank = config.bankName?.trim() ?? "";
  const number = config.accountNumber?.trim() ?? "";
  const holder = config.accountHolder?.trim() ?? "";
  const qris = config.qrisImageUrl?.trim() ?? "";
  if (!bank && !number && !holder && !qris) return null;

  const copyText = number || `${bank} ${number}`.trim();

  const handleCopy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
    } catch {
      // Fallback peramban lama: salin via textarea sementara.
      const ta = document.createElement("textarea");
      ta.value = copyText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto -mt-6 px-4 pb-2 md:-mt-8 md:px-6 lg:px-8">
      <div
        className={`grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card ${
          qris && number
            ? "lg:grid-cols-[1fr_auto_240px]"
            : qris
              ? "lg:grid-cols-[1fr_auto]"
              : number
                ? "lg:grid-cols-[1fr_280px]"
                : ""
        }`}
      >
        {/* Kiri: identitas rekening ala baris buku kas */}
        <div className="p-6 sm:p-7">
          <p className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
              <Bank className="h-4 w-4" aria-hidden="true" />
              Kanal donasi & infaq resmi
            </span>
            <span aria-hidden="true" className="text-border">
              |
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Terverifikasi DKM
            </span>
          </p>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {bank && (
              <p className="text-[15px] font-bold text-foreground">{bank}</p>
            )}
            {holder && (
              <p className="text-[13px] text-muted-foreground">
                a.n. {holder}
              </p>
            )}
          </div>

          {number ? (
            <p
              className="mt-1.5 font-mono text-3xl font-bold tracking-tight break-all tabular-nums text-foreground sm:text-4xl"
              aria-label={`Nomor rekening ${bank} ${number}`}
            >
              {number}
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-muted-foreground">
              {qris ? "Scan kode QRIS di samping untuk berinfak digital langsung." : "Nomor rekening belum dilengkapi pengurus."}
            </p>
          )}

          <p className="mt-3 max-w-[60ch] text-[13px] leading-relaxed text-muted-foreground">
            Transfer infak, sedekah, atau wakaf ke nomor di atas {qris ? "atau scan kode QRIS" : ""}. Setiap
            dana yang masuk dicatat bendahara
            {config.publicTransparency
              ? " dan bisa ditelusuri di Rincian Transaksi di bawah."
              : "."}
          </p>
        </div>

        {/* Tengah/Kanan: Gambar QRIS jika diunggah pengurus */}
        {qris && (
          <div className="flex flex-col items-center justify-center border-t border-border bg-muted/20 p-6 sm:p-7 lg:border-t-0 lg:border-l">
            <div className="overflow-hidden rounded-xl border border-border bg-white p-2 shadow-xs">
              <img
                src={qris}
                alt="Kode QRIS Donasi Masjid"
                className="h-32 w-32 object-contain sm:h-36 sm:w-36"
              />
            </div>
            <p className="mt-2 text-center text-xs font-semibold text-foreground">
              Pindai QRIS Infaq
            </p>
          </div>
        )}

        {/* Kanan: aksi salin — kolom sempit, dipisah garis */}
        {number ? (
          <div className="flex flex-col justify-center gap-2.5 border-t border-border bg-muted/40 p-6 sm:p-7 lg:border-t-0 lg:border-l">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!number}
              aria-live="polite"
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              {copied ? "Nomor disalin" : "Salin nomor"}
            </button>
            <p className="text-center text-xs leading-relaxed text-muted-foreground lg:text-left">
              Ketuk salin, lalu tempel di m-banking atau ATM.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
