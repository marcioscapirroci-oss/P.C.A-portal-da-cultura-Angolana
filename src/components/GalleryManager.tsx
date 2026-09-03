import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowDown, ArrowUp, Image as ImageIcon, Loader2, Play, Plus, Star, Trash2, Upload, Video as VideoIcon, X,
} from "lucide-react";
import {
  addGalleryItems, deleteGallery, deleteGalleryItem, listGalleriesAdmin, reorderGalleryItems,
  setGalleryCover, updateGalleryItem, upsertGallery,
  type GalleryMediaItem, type GalleryRecord,
} from "@/lib/galleries.functions";
import { listArticlesAdmin } from "@/lib/admin.functions";
import { signMediaUpload } from "@/lib/media.functions";
import { uploadMedia } from "@/lib/media-upload";

const inputClass = "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

export function GalleryManager() {
  const qc = useQueryClient();
  const listFn = useServerFn(listGalleriesAdmin);
  const listArticles = useServerFn(listArticlesAdmin);
  const saveFn = useServerFn(upsertGallery);
  const removeFn = useServerFn(deleteGallery);

  const galleriesQ = useQuery({ queryKey: ["admin-galleries"], queryFn: () => listFn() });
  const articlesQ = useQuery({ queryKey: ["admin-articles"], queryFn: () => listArticles() });
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ title: "", slug: "", description: "", article_id: "" });

  const galleries = (galleriesQ.data?.galleries ?? []) as GalleryRecord[];
  const current = galleries.find((g) => g.id === selected) ?? null;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-galleries"] });

  const save = useMutation({
    mutationFn: (data: any) => saveFn({ data }),
    onSuccess: (r: any) => {
      toast.success("Galeria guardada");
      setCreating(false);
      setDraft({ title: "", slug: "", description: "", article_id: "" });
      invalidate();
      if (r?.gallery?.id) setSelected(r.gallery.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: () => { toast.success("Galeria removida"); setSelected(null); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Galeria multimédia</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize fotografias e vídeos do mesmo evento. Legendas e créditos são opcionais e podem ser preenchidos depois.
          </p>
        </div>
        <button
          onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant"
        >
          <Plus className="h-4 w-4" /> Nova galeria
        </button>
      </div>

      {creating && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({
              title: draft.title,
              slug: draft.slug || slugify(draft.title),
              description: draft.description || null,
              article_id: draft.article_id || null,
              published: true,
            });
          }}
          className="space-y-3 rounded-2xl border border-border/60 bg-card/40 p-5"
        >
          <input
            required placeholder="Título da galeria (ex: Festival de Luanda 2026)"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value, slug: d.slug || slugify(e.target.value) }))}
            className={inputClass}
          />
          <input placeholder="slug-da-galeria" value={draft.slug}
            onChange={(e) => setDraft((d) => ({ ...d, slug: slugify(e.target.value) }))} className={inputClass} />
          <textarea rows={2} placeholder="Descrição (opcional)" value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} className={inputClass} />
          <select value={draft.article_id} onChange={(e) => setDraft((d) => ({ ...d, article_id: e.target.value }))} className={inputClass}>
            <option value="">Sem matéria associada</option>
            {(articlesQ.data?.articles ?? []).map((a: any) => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCreating(false)} className="rounded-full border border-border px-4 py-2 text-sm">Cancelar</button>
            <button type="submit" disabled={save.isPending} className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-5 py-2 text-sm text-primary-foreground disabled:opacity-50">
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Criar
            </button>
          </div>
        </form>
      )}

      {galleriesQ.isLoading ? (
        <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : galleries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Ainda sem galerias. Crie a primeira acima.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {galleries.map((g) => {
            const cover = g.items.find((i) => i.is_cover) ?? g.items[0];
            const photos = g.items.filter((i) => i.media_type === "image").length;
            const videos = g.items.filter((i) => i.media_type === "video").length;
            return (
              <button
                key={g.id}
                onClick={() => setSelected(g.id === selected ? null : g.id)}
                className={`overflow-hidden rounded-2xl border text-left transition ${g.id === selected ? "border-primary" : "border-border/60 hover:border-primary/60"}`}
              >
                <div className="aspect-video bg-background">
                  {cover ? (
                    cover.media_type === "image"
                      ? <img src={cover.url} alt="" className="h-full w-full object-cover" />
                      : <video src={cover.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">sem capa</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="truncate font-medium">{g.title}</p>
                  <p className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><ImageIcon className="h-3 w-3" /> {photos}</span>
                    <span className="inline-flex items-center gap-1"><VideoIcon className="h-3 w-3" /> {videos}</span>
                    {!g.published && <span className="text-primary">rascunho</span>}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {current && (
        <GalleryEditor
          gallery={current}
          articles={(articlesQ.data?.articles ?? []) as any[]}
          onChanged={invalidate}
          onSaveGallery={(d) => save.mutate({ ...d, id: current.id })}
          onDelete={() => confirm(`Remover a galeria “${current.title}”?`) && remove.mutate(current.id)}
        />
      )}
    </div>
  );
}

function GalleryEditor({
  gallery, articles, onChanged, onSaveGallery, onDelete,
}: {
  gallery: GalleryRecord;
  articles: any[];
  onChanged: () => void;
  onSaveGallery: (d: any) => void;
  onDelete: () => void;
}) {
  const sign = useServerFn(signMediaUpload);
  const addFn = useServerFn(addGalleryItems);
  const updateFn = useServerFn(updateGalleryItem);
  const delFn = useServerFn(deleteGalleryItem);
  const reorderFn = useServerFn(reorderGalleryItems);
  const coverFn = useServerFn(setGalleryCover);

  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [preview, setPreview] = useState<GalleryMediaItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [meta, setMeta] = useState({
    title: gallery.title, slug: gallery.slug,
    description: gallery.description ?? "", article_id: gallery.article_id ?? "",
    published: gallery.published,
  });

  const items = gallery.items;
  const counts = useMemo(() => ({
    all: items.length,
    image: items.filter((i) => i.media_type === "image").length,
    video: items.filter((i) => i.media_type === "video").length,
  }), [items]);
  const shown = filter === "all" ? items : items.filter((i) => i.media_type === filter);

  async function handleFiles(files: FileList) {
    const list = Array.from(files);
    setUploading({ done: 0, total: list.length });
    const uploaded: any[] = [];
    for (const f of list) {
      try {
        const u = await uploadMedia(f, sign as any);
        uploaded.push({
          media_type: u.mediaType, url: u.url, storage_path: u.path,
          mime_type: u.mimeType, size_bytes: u.size,
        });
      } catch (e: any) {
        toast.error(`${f.name}: ${e?.message ?? "falha no envio"}`);
      }
      setUploading((p) => (p ? { ...p, done: p.done + 1 } : p));
    }
    setUploading(null);
    if (uploaded.length) {
      try {
        await addFn({ data: { gallery_id: gallery.id, items: uploaded } });
        toast.success(`${uploaded.length} ficheiro(s) adicionados`);
        onChanged();
      } catch (e: any) {
        toast.error(e?.message ?? "Falha ao guardar");
      }
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const ids = items.map((i) => i.id);
    const [id] = ids.splice(index, 1);
    ids.splice(j, 0, id);
    await reorderFn({ data: { gallery_id: gallery.id, ids } });
    onChanged();
  }

  return (
    <div className="rounded-2xl border border-primary/40 bg-card/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl">{gallery.title}</h3>
        <button onClick={onDelete} className="inline-flex items-center gap-2 rounded-full border border-destructive/50 px-4 py-2 text-xs text-destructive-foreground/90 hover:bg-destructive/10">
          <Trash2 className="h-3 w-3" /> Remover galeria
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input value={meta.title} onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))} className={inputClass} placeholder="Título" />
        <input value={meta.slug} onChange={(e) => setMeta((m) => ({ ...m, slug: slugify(e.target.value) }))} className={inputClass} placeholder="slug" />
        <textarea rows={2} value={meta.description} onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))} className={`${inputClass} sm:col-span-2`} placeholder="Descrição (opcional)" />
        <select value={meta.article_id} onChange={(e) => setMeta((m) => ({ ...m, article_id: e.target.value }))} className={inputClass}>
          <option value="">Sem matéria associada</option>
          {articles.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={meta.published} onChange={(e) => setMeta((m) => ({ ...m, published: e.target.checked }))} />
          Publicada no site
        </label>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          onClick={() => onSaveGallery({ ...meta, description: meta.description || null, article_id: meta.article_id || null })}
          className="rounded-full bg-gradient-gold px-5 py-2 text-xs font-medium text-primary-foreground"
        >
          Guardar dados da galeria
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {([
          { key: "all", label: "Todos", count: counts.all },
          { key: "image", label: "Fotos", count: counts.image },
          { key: "video", label: "Vídeos", count: counts.video },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-wider ${
              filter === t.key ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
            }`}
          >
            {t.label}
            <span className={`rounded-full px-2 py-0.5 text-[10px] ${filter === t.key ? "bg-primary-foreground/20" : "bg-muted"}`}>{t.count}</span>
          </button>
        ))}
      </div>

      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/50 bg-background/50 px-6 py-8 text-sm hover:bg-background">
        {uploading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Upload className="h-5 w-5 text-primary" />}
        <span className="text-muted-foreground">
          {uploading ? `A enviar ${uploading.done}/${uploading.total}…` : "Arraste ou escolha várias fotos e vídeos (upload múltiplo)"}
        </span>
        <span className="text-[11px] text-muted-foreground/70">As imagens são optimizadas automaticamente. Legenda e crédito são opcionais.</span>
        <input
          ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" disabled={!!uploading}
          onChange={(e) => { const f = e.target.files; if (f?.length) handleFiles(f); e.target.value = ""; }}
        />
      </label>

      {shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sem conteúdos nesta vista.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {shown.map((item) => {
            const index = items.findIndex((i) => i.id === item.id);
            return (
              <li key={item.id} className="grid gap-3 rounded-2xl border border-border/60 bg-background/60 p-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto]">
                <button type="button" onClick={() => setPreview(item)} className="relative h-24 w-full overflow-hidden rounded-xl border border-border bg-card sm:w-32">
                  {item.media_type === "image" ? (
                    <img src={item.url} alt={item.caption ?? ""} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <>
                      <video src={item.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                      <span className="absolute inset-0 grid place-items-center bg-black/30">
                        <Play className="h-6 w-6 text-white" />
                      </span>
                    </>
                  )}
                  {item.is_cover && <span className="absolute left-1 top-1 rounded-full bg-primary px-2 py-0.5 text-[9px] text-primary-foreground">capa</span>}
                </button>

                <div className="space-y-2">
                  <input
                    defaultValue={item.caption ?? ""} placeholder="Legenda (opcional)"
                    onBlur={(e) => {
                      if ((item.caption ?? "") === e.target.value) return;
                      updateFn({ data: { id: item.id, caption: e.target.value || null } }).then(onChanged);
                    }}
                    className={inputClass}
                  />
                  <input
                    defaultValue={item.credit ?? ""} placeholder="Crédito / fonte (opcional)"
                    onBlur={(e) => {
                      if ((item.credit ?? "") === e.target.value) return;
                      updateFn({ data: { id: item.id, credit: e.target.value || null } }).then(onChanged);
                    }}
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-row gap-1 sm:flex-col">
                  <button type="button" title="Definir como capa" onClick={() => coverFn({ data: { gallery_id: gallery.id, item_id: item.id } }).then(onChanged)} className="rounded-full border border-border p-1.5">
                    <Star className={`h-3.5 w-3.5 ${item.is_cover ? "text-primary" : ""}`} />
                  </button>
                  <button type="button" title="Subir" onClick={() => move(index, -1)} className="rounded-full border border-border p-1.5"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button type="button" title="Descer" onClick={() => move(index, 1)} className="rounded-full border border-border p-1.5"><ArrowDown className="h-3.5 w-3.5" /></button>
                  <button
                    type="button" title="Eliminar"
                    onClick={() => confirm("Eliminar este conteúdo?") && delFn({ data: { id: item.id } }).then(() => { toast.success("Removido"); onChanged(); })}
                    className="rounded-full border border-destructive/50 p-1.5 text-destructive-foreground/90"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {preview && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-background/90 p-4" onClick={() => setPreview(null)}>
          <button className="absolute right-4 top-4 rounded-full border border-border p-2" onClick={() => setPreview(null)}><X className="h-4 w-4" /></button>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] w-full max-w-4xl">
            {preview.media_type === "image"
              ? <img src={preview.url} alt={preview.caption ?? ""} className="max-h-[80vh] w-full rounded-2xl object-contain" />
              : <video src={preview.url} controls autoPlay className="max-h-[80vh] w-full rounded-2xl" />}
            {(preview.caption || preview.credit) && (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                {preview.caption} {preview.credit ? <span className="text-xs">· {preview.credit}</span> : null}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
