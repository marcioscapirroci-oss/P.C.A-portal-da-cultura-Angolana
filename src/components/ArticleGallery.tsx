import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, Play, Video as VideoIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryMediaItem, GalleryRecord } from "@/lib/galleries.functions";

type RelatedVideo = { url: string; caption?: string };

export function ArticleGallery({
  gallery,
  relatedVideos,
}: {
  gallery: GalleryRecord | null;
  relatedVideos: RelatedVideo[];
}) {
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [open, setOpen] = useState<number | null>(null);

  const items: GalleryMediaItem[] = useMemo(() => {
    const base = gallery?.items ?? [];
    const extra: GalleryMediaItem[] = (relatedVideos ?? [])
      .filter((v) => v?.url)
      .map((v, i) => ({
        id: `rel-${i}`,
        gallery_id: "",
        media_type: "video" as const,
        url: v.url,
        storage_path: null,
        thumbnail_url: null,
        caption: v.caption ?? null,
        credit: null,
        position: 1000 + i,
        is_cover: false,
        mime_type: null,
      }));
    return [...base, ...extra];
  }, [gallery, relatedVideos]);

  const counts = useMemo(
    () => ({
      all: items.length,
      image: items.filter((i) => i.media_type === "image").length,
      video: items.filter((i) => i.media_type === "video").length,
    }),
    [items],
  );

  const shown = filter === "all" ? items : items.filter((i) => i.media_type === filter);

  if (items.length === 0) return null;

  return (
    <section className="mt-14 border-t border-border/60 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Galeria multimédia</p>
          <h2 className="mt-1 font-display text-2xl">{gallery?.title ?? "Fotos e vídeos"}</h2>
          {gallery?.description ? (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{gallery.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            { key: "all", label: "Todos", icon: null, count: counts.all },
            { key: "image", label: "Fotos", icon: ImageIcon, count: counts.image },
            { key: "video", label: "Vídeos", icon: VideoIcon, count: counts.video },
          ] as const).map((t) => {
            const active = filter === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] uppercase tracking-wider transition ${
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {Icon ? <Icon className="h-3 w-3" /> : null}
                {t.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-primary-foreground/20" : "bg-muted"}`}>{t.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {shown.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setOpen(i)}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-card"
          >
            {item.media_type === "image" ? (
              <img src={item.url} alt={item.caption ?? ""} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            ) : (
              <>
                <video src={item.thumbnail_url ?? item.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                <span className="absolute inset-0 grid place-items-center bg-black/30">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-elegant">
                    <Play className="h-4 w-4" />
                  </span>
                </span>
              </>
            )}
            {item.caption ? (
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2 text-left text-[11px] text-white/90">
                <span className="line-clamp-2">{item.caption}</span>
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {open !== null && shown[open] ? (
        <Viewer items={shown} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
      ) : null}
    </section>
  );
}

function Viewer({
  items, index, onClose, onIndex,
}: {
  items: GalleryMediaItem[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const current = items[index];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onIndex((index - 1 + items.length) % items.length);
      if (e.key === "ArrowRight") onIndex((index + 1) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onIndex]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/95" onClick={onClose}>
      <button onClick={onClose} className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white" aria-label="Fechar">
        <X className="h-5 w-5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onIndex((index - 1 + items.length) % items.length); }}
        className="absolute left-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onIndex((index + 1) % items.length); }}
        className="absolute right-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white"
        aria-label="Seguinte"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="flex h-full w-full items-center justify-center p-4 pb-24 sm:p-10" onClick={(e) => e.stopPropagation()}>
        {current.media_type === "image" ? (
          <img src={current.url} alt={current.caption ?? ""} className="max-h-full max-w-full rounded-lg object-contain" />
        ) : (
          <video src={current.url} controls autoPlay playsInline className="max-h-full max-w-full rounded-lg" />
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/60 px-4 py-4 text-center backdrop-blur">
        {current.caption ? <p className="text-sm text-white/90">{current.caption}</p> : null}
        <p className="mt-1 text-[11px] text-white/60">
          {index + 1} / {items.length}
          {current.credit ? ` · Crédito: ${current.credit}` : ""}
        </p>
      </div>
    </div>
  );
}
