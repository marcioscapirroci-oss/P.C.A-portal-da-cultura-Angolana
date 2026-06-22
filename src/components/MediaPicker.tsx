import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Upload, X, Image as ImageIcon, Film } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { listMediaAssets, signMediaUpload } from "@/lib/media.functions";

type Asset = {
  path: string;
  name: string;
  url: string;
  mimeType: string;
};

export function MediaPicker({
  onSelect,
  onClose,
  accept = "image/*,video/*",
}: {
  onSelect: (asset: { url: string; mimeType: string }) => void;
  onClose: () => void;
  accept?: string;
}) {
  const list = useServerFn(listMediaAssets);
  const sign = useServerFn(signMediaUpload);
  const [uploading, setUploading] = useState(false);
  const libQ = useQuery({ queryKey: ["media-library"], queryFn: () => list() });

  async function handleFile(file: File) {
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Ficheiro acima de 50MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").slice(-40);
      const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
      const { error } = await supabase.storage.from("media").upload(path, file, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;
      const { url } = await sign({ data: { path } });
      onSelect({ url, mimeType: file.type });
      toast.success("Ficheiro enviado");
      libQ.refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Falha no envio");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-background/80 backdrop-blur sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-border bg-card p-6 shadow-elegant sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl">Biblioteca de media</h3>
          <button onClick={onClose} className="rounded-full border border-border p-1.5"><X className="h-4 w-4" /></button>
        </div>

        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/50 bg-background/50 px-6 py-8 text-sm hover:bg-background">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Upload className="h-5 w-5 text-primary" />}
          <span className="text-muted-foreground">
            {uploading ? "A enviar..." : "Carregar nova imagem ou vídeo (até 50MB)"}
          </span>
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </label>

        <div className="mt-6">
          <p className="mb-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Reutilizar uma capa já enviada</p>
          {libQ.isLoading ? (
            <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : (libQ.data?.assets as Asset[] | undefined)?.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Ainda sem media. Faça o primeiro upload acima.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {(libQ.data?.assets as Asset[]).map((a) => {
                const isVideo = a.mimeType.startsWith("video/");
                return (
                  <button
                    key={a.path}
                    type="button"
                    onClick={() => onSelect({ url: a.url, mimeType: a.mimeType })}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-background"
                  >
                    {isVideo ? (
                      <div className="grid h-full w-full place-items-center bg-card">
                        <Film className="h-8 w-8 text-primary/70" />
                      </div>
                    ) : (
                      <img src={a.url} alt={a.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                    )}
                    <span className="absolute bottom-1 left-1 right-1 truncate rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-foreground">
                      {isVideo ? <Film className="mr-1 inline h-3 w-3" /> : <ImageIcon className="mr-1 inline h-3 w-3" />}
                      {a.name.split("-").slice(2).join("-") || a.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
