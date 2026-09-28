"use client";

import { useState } from "react";
import { prayerSchedule, weeklyPrayerSchedule, mosqueProfile } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import {
  Mosque,
  Clock,
  Compass,
  MapPin,
  Sliders,
  ArrowsClockwise,
  CheckCircle,
  SunHorizon,
  MoonStars,
  Sun,
  CloudSun,
} from "@phosphor-icons/react";

export function PrayerSchedulePage() {
  const [schedule, setSchedule] = useState(prayerSchedule);
  const [offsets, setOffsets] = useState({
    Subuh: 2,
    Dzuhur: 2,
    Ashar: 2,
    Maghrib: 2,
    Isya: 2,
  });
  const [iqamahDelays, setIqamahDelays] = useState({
    Subuh: 10,
    Dzuhur: 10,
    Ashar: 10,
    Maghrib: 7,
    Isya: 10,
  });
  const [isSaved, setIsSaved] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("kemenag");

  const handleOffsetChange = (prayerName: string, delta: number) => {
    setOffsets((prev) => ({
      ...prev,
      [prayerName]: (prev[prayerName as keyof typeof prev] || 0) + delta,
    }));
  };

  const handleIqamahChange = (prayerName: string, delta: number) => {
    setIqamahDelays((prev) => ({
      ...prev,
      [prayerName]: Math.max(1, (prev[prayerName as keyof typeof prev] || 10) + delta),
    }));
  };

  const handleSaveSettings = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const getPrayerIcon = (name: string) => {
    switch (name) {
      case "Subuh":
        return <SunHorizon className="w-6 h-6 text-sky-500" />;
      case "Dzuhur":
        return <Sun className="w-6 h-6 text-amber-500" />;
      case "Ashar":
        return <CloudSun className="w-6 h-6 text-orange-500" />;
      case "Maghrib":
        return <SunHorizon className="w-6 h-6 text-red-500" />;
      case "Isya":
        return <MoonStars className="w-6 h-6 text-indigo-500" />;
      default:
        return <Clock className="w-6 h-6 text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Jadwal Sholat & Waktu Ibadah"
        description="Pengaturan waktu azan otomatis, koreksi ihtiyati, jeda iqamah, dan sinkronisasi Kemenag"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSaveSettings()}
              className="gap-2"
            >
              <ArrowsClockwise className="w-4 h-4" />
              Sinkronkan Jadwal
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSettings}
              className="gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Simpan Pengaturan
            </Button>
          </>
        }
      />

      {/* Success Alert Banner */}
      {isSaved && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Pengaturan jadwal sholat dan waktu iqamah berhasil disimpan!</span>
          </div>
          <button
            onClick={() => setIsSaved(false)}
            className="text-xs font-semibold hover:underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Today's Highlight Banner */}
      <Card className="border-border overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium">
                  Hari Ini
                </Badge>
                <span className="text-xs font-medium text-muted-foreground">
                  {formatDate(schedule.date)}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs font-semibold text-primary">
                  {schedule.hijriDate}
                </span>
              </div>
              <h2 className="font-display text-2xl font-semibold text-balance text-foreground">
                Jadwal Waktu Sholat {mosqueProfile.name}
              </h2>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                Kemang, Mampang Prapatan, Jakarta Selatan (GMT+7) • Terbit: {schedule.sunrise} WIB
              </p>
            </div>

            {/* Next prayer countdown callout */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground block">
                  Waktu Sholat Berikutnya
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-bold text-foreground">Maghrib</span>
                  <span className="text-sm font-semibold text-primary">17:58 WIB</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Sekitar 4 jam 5 menit lagi
                </span>
              </div>
            </div>
          </div>

          {/* Today Prayer Times Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-6">
            {schedule.prayers.map((prayer) => (
              <div
                key={prayer.name}
                className={`p-4 rounded-xl border transition-all text-center relative ${
                  prayer.isCurrent
                    ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20"
                    : prayer.isNext
                    ? "bg-card border-primary/40 shadow-xs"
                    : "bg-card border-border shadow-xs hover:border-border/80"
                }`}
              >
                {prayer.isCurrent && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-emerald-600 text-[10px] text-white font-bold uppercase tracking-wider shadow-xs">
                    Waktu Saat Ini
                  </span>
                )}
                {prayer.isNext && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-[10px] text-primary-foreground font-bold uppercase tracking-wider shadow-xs">
                    Berikutnya
                  </span>
                )}
                <div className="flex justify-center mb-2">
                  {getPrayerIcon(prayer.name)}
                </div>
                <span
                  lang="ar"
                  dir="rtl"
                  aria-hidden="true"
                  className={`font-arabic block text-lg leading-relaxed ${
                    prayer.isCurrent ? "text-primary-foreground/85" : "text-muted-foreground"
                  }`}
                >
                  {prayer.arabic}
                </span>
                <span
                  className={`text-sm font-bold block ${
                    prayer.isCurrent ? "text-primary-foreground" : "text-foreground"
                  }`}
                >
                  {prayer.name}
                </span>
                <span
                  className={`text-2xl font-black mt-1 block tracking-tight tabular-nums ${
                    prayer.isCurrent ? "text-primary-foreground" : "text-primary"
                  }`}
                >
                  {prayer.time}
                </span>
                <span
                  className={`text-[11px] block mt-1.5 opacity-80 ${
                    prayer.isCurrent ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  Jeda Iqamah: {iqamahDelays[prayer.name as keyof typeof iqamahDelays] || 10} mnt
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settings & Adjustment Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ihtiyati & Manual Correction */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              Koreksi Ihtiyati & Jeda Iqamah
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Sesuaikan menit koreksi azan (ihtiyati pengaman) dan jeda waktu countdown iqamah
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {["Subuh", "Dzuhur", "Ashar", "Maghrib", "Isya"].map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border"
                >
                  <div>
                    <span className="text-sm font-semibold text-foreground">
                      {name}
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      Koreksi Waktu: +{offsets[name as keyof typeof offsets]} menit
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Offset buttons */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOffsetChange(name, -1)}
                        className="h-7 w-7 p-0 text-xs"
                      >
                        -
                      </Button>
                      <span className="text-xs font-bold w-6 text-center">
                        {offsets[name as keyof typeof offsets]}m
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOffsetChange(name, 1)}
                        className="h-7 w-7 p-0 text-xs"
                      >
                        +
                      </Button>
                    </div>

                    {/* Iqamah delay */}
                    <div className="flex items-center gap-1.5 pl-3 border-l border-border">
                      <span className="text-xs text-muted-foreground mr-1">Iqamah:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleIqamahChange(name, -1)}
                        className="h-7 w-7 p-0 text-xs"
                      >
                        -
                      </Button>
                      <span className="text-xs font-bold w-7 text-center">
                        {iqamahDelays[name as keyof typeof iqamahDelays]}m
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleIqamahChange(name, 1)}
                        className="h-7 w-7 p-0 text-xs"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calculation & Coordinates Configuration */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              Metode Perhitungan & Koordinat Geografis
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Parameter astronomis dan metode hisab hisab syar&apos;i
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Metode Hisab / Perhitungan
              </label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="kemenag">Kementerian Agama Republik Indonesia (Kemenag RI)</option>
                <option value="muhammadiyah">Majelis Tarjih & Tajdid Muhammadiyah</option>
                <option value="nu">Lembaga Falakiyah Nahdlatul Ulama (LFNU)</option>
                <option value="mwl">Muslim World League (MWL)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Garis Lintang (Latitude)
                </label>
                <input
                  type="text"
                  defaultValue="-6.2615"
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Garis Bujur (Longitude)
                </label>
                <input
                  type="text"
                  defaultValue="106.8106"
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Zona Waktu
                </label>
                <input
                  type="text"
                  disabled
                  defaultValue="Asia/Jakarta (WIB - UTC+7)"
                  className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-lg text-muted-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Sudut Subuh / Isya
                </label>
                <input
                  type="text"
                  disabled
                  defaultValue="Subuh 20° / Isya 18°"
                  className="w-full px-3 py-2 text-sm bg-muted border border-input rounded-lg text-muted-foreground"
                />
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg border border-border text-xs text-muted-foreground">
              💡 <strong>Catatan:</strong> Sinkronisasi API Jadwal Sholat Kemenag diperbarui otomatis setiap tanggal 1 setiap bulan. Anda dapat melakukan penyesuaian manual sewaktu-waktu.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Schedule Table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Mosque className="w-5 h-5 text-primary" />
            Jadwal Sholat 7 Hari Mendatang
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Kalender jadwal sholat mingguan Masjid Ar-Rahman
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
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
                {weeklyPrayerSchedule.map((day, idx) => {
                  const subuh = day.prayers.find((p) => p.name === "Subuh")?.time;
                  const dzuhur = day.prayers.find((p) => p.name === "Dzuhur")?.time;
                  const ashar = day.prayers.find((p) => p.name === "Ashar")?.time;
                  const maghrib = day.prayers.find((p) => p.name === "Maghrib")?.time;
                  const isya = day.prayers.find((p) => p.name === "Isya")?.time;

                  return (
                    <TableRow
                      key={day.date}
                      className={idx === 0 ? "bg-primary/5 font-semibold" : ""}
                    >
                      <TableCell className="text-xs py-3">
                        <div className="flex items-center gap-2">
                          {idx === 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          )}
                          <span>{formatDate(day.date)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-3">
                        {day.hijriDate}
                      </TableCell>
                      <TableCell className="text-xs text-center py-3 font-mono">
                        {subuh}
                      </TableCell>
                      <TableCell className="text-xs text-center text-muted-foreground py-3 font-mono">
                        {day.sunrise}
                      </TableCell>
                      <TableCell className="text-xs text-center py-3 font-mono">
                        {dzuhur}
                      </TableCell>
                      <TableCell className="text-xs text-center py-3 font-mono">
                        {ashar}
                      </TableCell>
                      <TableCell className="text-xs text-center py-3 font-mono">
                        {maghrib}
                      </TableCell>
                      <TableCell className="text-xs text-center py-3 font-mono">
                        {isya}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
