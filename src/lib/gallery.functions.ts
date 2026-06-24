import { createServerFn } from "@tanstack/react-start";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export type GalleryItem = {
  path: string;
  name: string;
  url: string;
  type: "image" | "video" | "other";
  mimeType: string;
  size: number;
  createdAt: string | null;
};

function classify(mime: string, name: string): GalleryItem["type"] {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "m4v"].includes(ext)) return "video";
  return "other";
}

export const listGalleryMedia = createServerFn({ method: "GET" }).handler(
  async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.storage.from("media").list("uploads", {
      limit: 500,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) throw new Error(error.message);
    const files = (data ?? []).filter((f) => f.name && !f.name.startsWith("."));
    if (files.length === 0) return { items: [] as GalleryItem[] };
    const paths = files.map((f) => `uploads/${f.name}`);
    const { data: signed, error: e2 } = await supabaseAdmin.storage
      .from("media")
      .createSignedUrls(paths, TEN_YEARS);
    if (e2) throw new Error(e2.message);
    const items: GalleryItem[] = signed
      .map((s, i) => {
        const mime = ((files[i].metadata as any)?.mimetype as string) ?? "";
        return {
          path: paths[i],
          name: files[i].name,
          url: s.signedUrl ?? "",
          type: classify(mime, files[i].name),
          mimeType: mime,
          size: ((files[i].metadata as any)?.size as number) ?? 0,
          createdAt: files[i].created_at ?? null,
        };
      })
      .filter((i) => i.url && i.type !== "other");
    return { items };
  },
);
