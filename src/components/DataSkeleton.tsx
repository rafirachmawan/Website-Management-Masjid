// Placeholder saat frontend menunggu data dari /api.
// Dipakai seragam oleh halaman publik & admin agar loading terlihat tenang.

import { cn } from "@/lib/utils";

export function DataSkeleton({
  lines = 4,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("animate-pulse space-y-3", className)}
      role="status"
      aria-label="Memuat data"
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-lg bg-muted"
          style={{ width: i === lines - 1 ? "55%" : "100%" }}
        />
      ))}
    </div>
  );
}
