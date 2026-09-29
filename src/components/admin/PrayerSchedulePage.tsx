"use client";

import Link from "next/link";
import { useApi } from "@/lib/api";
import { DataSkeleton } from "@/components/DataSkeleton";
import { formatDate } from "@/lib/utils";
import type { DailyPrayerSchedule, MosqueProfile } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Clock, MapPin, CheckCircle, Gear } from "@phosphor-icons/react";

// Halaman ini READ-ONLY: jadwal dihitung otomatis setiap hari dari
// koordinat + zona waktu di profil masjid (metode Kemenag: Subuh 20°,
// Isya 18°). Pengurus tidak mengatur jam manual — cukup pastikan
// koordinat di Pengaturan benar.
export function PrayerSchedulePage() {
  const { data: prayerData } = useApi<{
    today: DailyPrayerSchedule | null;
    week: DailyPrayerSchedule[];
  }>("/api/prayer-schedule");
  const { data: profile } = useApi<MosqueProfile>("/api/mosque-profile");

  if (!prayerData) {
    return (
      <div className="space-y-6" aria-label="Memuat jadwal sholat">
        <DataSkeleton lines={2} className="max-w-md" />
        <DataSkeleton lines={6} />
      </div>
    );
  }

  const week = prayerData.week;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Sholat"
        description="Dihitung otomatis setiap hari dari lokasi masjid — tanpa pengaturan jam manual"
      />

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Sumber Perhitungan
          </CardTitle>
          <CardDescription>
            Metode Kemenag RI (Subuh 20°, Isya 18°). Akurasi mengikuti koordinat di bawah.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profile ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-muted/40 border border-border p-4">
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-foreground">{profile.name}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {profile.latitude}, {profile.longitude} • {profile.timezone}
                </p>
              </div>
              <Link href="/admin/settings">
                <Button variant="outline" size="sm" className="gap-2">
                  <Gear className="h-4 w-4" />
                  Ubah Lokasi di Pengaturan
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
              Profil masjid belum diisi — jadwal belum bisa dihitung.{" "}
              <Link href="/admin/settings" className="font-semibold underline">
                Lengkapi profil & koordinat di Pengaturan
              </Link>
              .
            </div>
          )}
        </CardContent>
      </Card>

      {week.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-sm font-bold text-foreground">Jadwal belum tersedia</p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
              Isi profil masjid beserta koordinatnya, jadwal 7 hari ke depan
              akan dihitung otomatis.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Pratinjau 7 Hari ke Depan
            </CardTitle>
            <CardDescription>
              Sama persis dengan yang tampil di halaman publik.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold text-xs">Hari & Tanggal</TableHead>
                    <TableHead className="font-semibold text-xs">Hijriyah</TableHead>
                    <TableHead className="font-semibold text-xs text-center">Subuh</TableHead>
                    <TableHead className="font-semibold text-xs text-center">Terbit</TableHead>
                    <TableHead className="font-semibold text-xs text-center">Dzuhur</TableHead>
                    <TableHead className="font-semibold text-xs text-center">Ashar</TableHead>
                    <TableHead className="font-semibold text-xs text-center">Maghrib</TableHead>
                    <TableHead className="font-semibold text-xs text-center">Isya</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {week.map((day, idx) => {
                    const t = (n: string) => day.prayers.find((p) => p.name === n)?.time ?? "-";
                    return (
                      <TableRow key={day.date} className={idx === 0 ? "bg-primary/5 font-semibold" : ""}>
                        <TableCell className="text-xs py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {idx === 0 && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                                Hari Ini
                              </Badge>
                            )}
                            <span>{formatDate(day.date)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-3 whitespace-nowrap">
                          {day.hijriDate}
                        </TableCell>
                        <TableCell className="text-xs text-center py-3 font-mono">{t("Subuh")}</TableCell>
                        <TableCell className="text-xs text-center text-muted-foreground py-3 font-mono">
                          {day.sunrise}
                        </TableCell>
                        <TableCell className="text-xs text-center py-3 font-mono">{t("Dzuhur")}</TableCell>
                        <TableCell className="text-xs text-center py-3 font-mono">{t("Ashar")}</TableCell>
                        <TableCell className="text-xs text-center py-3 font-mono">{t("Maghrib")}</TableCell>
                        <TableCell className="text-xs text-center py-3 font-mono">{t("Isya")}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
