import { supabase } from "@/integrations/supabase/client";

export type UploadedMedia = {
  path: string;
  url: string;
  mimeType: string;
  mediaType: "image" | "video";
  size: number;
  name: string;
};

const MAX_DIM = 1920;
const QUALITY = 0.82;

/** Compresses/resizes images in the browser before upload. Videos pass through untouched. */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/webp", QUALITY));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp" });
  } catch {
    return file;
  }
}

export function storagePathFor(file: File) {
  const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, "_").slice(-40);
  return `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
}

/**
 * Uploads a single file to the media bucket (images are compressed first) and
 * returns its signed URL + metadata. Only metadata/URL is stored in the database.
 */
export async function uploadMedia(
  file: File,
  sign: (args: { data: { path: string } }) => Promise<{ url: string }>,
): Promise<UploadedMedia> {
  const prepared = await compressImage(file);
  const path = storagePathFor(prepared);
  const { error } = await supabase.storage.from("media").upload(path, prepared, {
    contentType: prepared.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  const { url } = await sign({ data: { path } });
  return {
    path,
    url,
    mimeType: prepared.type,
    mediaType: prepared.type.startsWith("video/") ? "video" : "image",
    size: prepared.size,
    name: prepared.name,
  };
}
