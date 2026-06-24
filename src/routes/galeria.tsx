import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, X, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { listGalleryMedia, type GalleryItem } from "@/lib/gallery.functions";

export const Route = createFileRoute("/galeria")({
  head: () => ({
    meta: [
      { title: "Galeria multimédia — Analtino Santos Media" },
      { name: "description", content: "Fotos e vídeos de reportagens, entrevistas e eventos cobertos por Analtino Santos." },
      { property: "og:title", content: "Galeria multimédia — Analtino Santos Media" },
      { property: "og:description", content: "Navegue pelas fotos e vídeos do portal Analtino Santos Media." },
    ],
  }),
  loader: () => listGalleryMedia(),
  component: GalleryPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen grid place-items-center bg-background p-6 text-center">
      <div>
        <h1 className="font-display text-3xl">Não foi possível carregar a galeria</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-gradient-gold px-5 py-2.5 text-sm text-primary-foreground">Voltar ao início</Link>
      </div>
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Sem conteúdos.</div>,
});

const PAGE_SIZE = 24;
type Filter = "all" | "image" | "video";

function GalleryPage() {
  const { items } = Route.useLoaderData();
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.type === filter)),
    [items, filter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [filter]);

  const counts = useMemo(() => ({
    all: items.length,
    image: items.filter((i) => i.type === "image").length,
    video: items.filter((i) => i.type === "video").length,
  }), [items]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl container-px py-12">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Multimédia</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">Galeria</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Imagens e vídeos das reportagens, entrevistas e eventos cobertos pela redacção.
          </p>
        </header>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          {(
            [
              { key: "all", label: "Todos", icon: null, count: counts.all },
              { key: "image", label: "Fotos", icon: ImageIcon, count: counts.image },
              { key: "video", label: "Vídeos", icon: VideoIcon, count: counts.video },
            ] as const
          ).map((tab) => {
            const active = filter === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-wider transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary"
                }`}
              >
                {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? "bg-primary-foreground/20" : "bg-muted"}`}>{tab.count}</span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-16 text-center text-sm text-muted-foreground">
            Ainda não há conteúdos nesta categoria.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {pageItems.map((item, i) => (
                <button
                  key={item.path}
                  onClick={() => setOpenIndex((safePage - 1) * PAGE_SIZE + i)}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-card"
                >
                  {item.type === "image" ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <>
                      <video
                        src={item.url}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute inset-0 grid place-items-center bg-black/30">
                        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-elegant">
                          <Play className="h-5 w-5" />
                        </span>
                      </span>
                    </>
                  )}
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left opacity-0 transition group-hover:opacity-100">
                    <span className="block truncate text-[11px] text-white/90">{item.name}</span>
                  </span>
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground disabled:opacity-40"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                  .map((n, idx, arr) => (
                    <span key={n} className="flex items-center">
                      {idx > 0 && n - arr[idx - 1] > 1 ? (
                        <span className="px-2 text-xs text-muted-foreground">…</span>
                      ) : null}
                      <button
                        onClick={() => setPage(n)}
                        className={`h-10 min-w-10 rounded-full px-3 text-sm transition ${
                          n === safePage
                            ? "bg-gradient-gold text-primary-foreground shadow-elegant"
                            : "border border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {n}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground disabled:opacity-40"
                  aria-label="Página seguinte"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}
          </>
        )}
      </main>

      {openIndex !== null ? (
        <Lightbox
          items={filtered}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onIndex={(i) => setOpenIndex(i)}
        />
      ) : null}

      <SiteFooter />
    </div>
  );
}

function Lightbox({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const current = items[index];
  const prev = () => onIndex((index - 1 + items.length) % items.length);
  const next = () => onIndex((index + 1) % items.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items.length]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md" role="dialog" aria-modal="true">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label="Fechar"
      >
        <X className="h-5 w-5" />
      </button>
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label="Seguinte"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="flex h-full w-full items-center justify-center p-4 sm:p-10">
        {current.type === "image" ? (
          <img src={current.url} alt={current.name} className="max-h-full max-w-full rounded-lg object-contain" />
        ) : (
          <video
            src={current.url}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full rounded-lg"
          />
        )}
      </div>

      <div className="absolute inset-x-0 bottom-4 z-10 px-6 text-center text-xs text-white/70">
        {index + 1} / {items.length} · {current.name}
      </div>
    </div>
  );
}
