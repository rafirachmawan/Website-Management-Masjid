import { announcements } from "@/lib/mock-data";
import type { Announcement } from "@/types";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CaretRight, Clock, Calendar, Warning, Star } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const priorityConfig = {
  normal: { icon: Clock, label: "Biasa", className: "bg-muted text-muted-foreground" },
  important: { icon: Star, label: "Penting", className: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  urgent: { icon: Warning, label: "Urgen", className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
} as const;

type Priority = keyof typeof priorityConfig;

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const config = priorityConfig[announcement.priority as Priority];

  return (
    <article className="group">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {announcement.imageUrl && (
          <div className="relative w-full sm:w-48 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5" />
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className={cn("gap-1.5 px-2.5 py-0.5 text-xs", config.className)}>
                  <config.icon className="w-3 h-3" />
                  {config.label}
                </Badge>
                <time className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(announcement.publishedAt, { day: "numeric", month: "long", year: "numeric" })}
                </time>
              </div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {announcement.title}
              </h3>
            </div>
          </div>
          <p className="text-muted-foreground text-sm line-clamp-3 flex-1">
            {announcement.content}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              Oleh {announcement.author}
            </span>
            <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Baca selengkapnya
              <CaretRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function AnnouncementsSection() {
  return (
    <section aria-labelledby="announcements-heading" className="py-10 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 id="announcements-heading" className="text-2xl font-semibold text-foreground">
              Pengumuman Masjid
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Informasi terbaru kegiatan, jadwal, dan program masjid
            </p>
          </div>
          <a
            href="#"
            className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            Lihat semua
            <CaretRight className="w-4 h-4" />
          </a>
        </div>

        <div className="space-y-4">
          {announcements.map((announcement, index) => (
            <Card key={announcement.id} className="overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="p-5 md:p-6">
                <AnnouncementCard announcement={announcement} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}