import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Kepala halaman admin yang seragam — mengikuti gaya judul halaman publik:
// serif display hangat + deskripsi ringkas + slot aksi di kanan.
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-display text-[1.7rem] leading-snug font-semibold text-balance text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-pretty text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
