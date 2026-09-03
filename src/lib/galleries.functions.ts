import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

const STAFF_ROLES = ["jornalista", "admin", "super_admin", "editor"] as const;

async function assertStaff(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  if (!roles.some((r: string) => STAFF_ROLES.includes(r as any))) {
    throw new Error("Forbidden: acesso restrito à equipa editorial.");
  }
  return roles;
}

export type GalleryMediaItem = {
  id: string;
  gallery_id: string;
  media_type: "image" | "video";
  url: string;
  storage_path: string | null;
  thumbnail_url: string | null;
  caption: string | null;
  credit: string | null;
  position: number;
  is_cover: boolean;
  mime_type: string | null;
};

export type GalleryRecord = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  published: boolean;
  article_id: string | null;
  items: GalleryMediaItem[];
};

const ITEM_COLS =
  "id, gallery_id, media_type, url, storage_path, thumbnail_url, caption, credit, position, is_cover, mime_type";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Public: published galleries with their items, ordered. */
export const listPublicGalleries = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data: galleries, error } = await sb
    .from("galleries")
    .select("id, title, slug, description, published, article_id")
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) return { galleries: [] as GalleryRecord[], error: error.message };
  const ids = (galleries ?? []).map((g) => g.id);
  if (ids.length === 0) return { galleries: [] as GalleryRecord[] };
  const { data: items } = await sb
    .from("gallery_items")
    .select(ITEM_COLS)
    .in("gallery_id", ids)
    .order("position", { ascending: true });
  const grouped: GalleryRecord[] = (galleries ?? []).map((g) => ({
    ...g,
    items: ((items ?? []) as any[]).filter((i) => i.gallery_id === g.id) as GalleryMediaItem[],
  }));
  return { galleries: grouped };
});

/** Public: single gallery by article id (used on article pages). */
export const getGalleryByArticle = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ articleId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: g } = await sb
      .from("galleries")
      .select("id, title, slug, description, published, article_id")
      .eq("article_id", data.articleId)
      .eq("published", true)
      .maybeSingle();
    if (!g) return { gallery: null };
    const { data: items } = await sb
      .from("gallery_items")
      .select(ITEM_COLS)
      .eq("gallery_id", g.id)
      .order("position", { ascending: true });
    return { gallery: { ...g, items: (items ?? []) as unknown as GalleryMediaItem[] } as GalleryRecord };
  });

/** Staff: every gallery (published or not) with items. */
export const listGalleriesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { data: galleries, error } = await context.supabase
      .from("galleries")
      .select("id, title, slug, description, published, article_id, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (galleries ?? []).map((g: any) => g.id);
    let items: any[] = [];
    if (ids.length) {
      const { data, error: e2 } = await context.supabase
        .from("gallery_items")
        .select(ITEM_COLS)
        .in("gallery_id", ids)
        .order("position", { ascending: true });
      if (e2) throw new Error(e2.message);
      items = data ?? [];
    }
    return {
      galleries: (galleries ?? []).map((g: any) => ({
        ...g,
        items: items.filter((i) => i.gallery_id === g.id),
      })) as GalleryRecord[],
    };
  });

const gallerySchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2).max(200),
  slug: z.string().min(2).max(160).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional().nullable(),
  published: z.boolean().optional().default(true),
  article_id: z.string().uuid().optional().nullable(),
});

export const upsertGallery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => gallerySchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const payload: any = { ...data, created_by: context.userId };
    const { data: row, error } = data.id
      ? await context.supabase.from("galleries").update(payload).eq("id", data.id).select().single()
      : await context.supabase.from("galleries").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return { gallery: row };
  });

export const deleteGallery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { error } = await context.supabase.from("galleries").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const newItemSchema = z.object({
  media_type: z.enum(["image", "video"]),
  url: z.string().min(1).max(2000),
  storage_path: z.string().max(500).optional().nullable(),
  thumbnail_url: z.string().max(2000).optional().nullable(),
  caption: z.string().max(500).optional().nullable(),
  credit: z.string().max(300).optional().nullable(),
  mime_type: z.string().max(120).optional().nullable(),
  size_bytes: z.number().int().nonnegative().optional().nullable(),
});

/** Bulk add: captions/credits are optional and can be filled later. */
export const addGalleryItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ gallery_id: z.string().uuid(), items: z.array(newItemSchema).min(1).max(60) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { data: existing, error: e0 } = await context.supabase
      .from("gallery_items")
      .select("id, position")
      .eq("gallery_id", data.gallery_id)
      .order("position", { ascending: false })
      .limit(1);
    if (e0) throw new Error(e0.message);
    const start = existing?.[0]?.position != null ? existing[0].position + 1 : 0;
    const rows = data.items.map((it, i) => ({ ...it, gallery_id: data.gallery_id, position: start + i }));
    const { data: inserted, error } = await context.supabase.from("gallery_items").insert(rows).select(ITEM_COLS);
    if (error) throw new Error(error.message);
    // first item of an empty gallery becomes the cover automatically
    if (start === 0 && inserted?.[0]) {
      await context.supabase.from("gallery_items").update({ is_cover: true }).eq("id", inserted[0].id);
    }
    return { items: inserted ?? [] };
  });

export const updateGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        caption: z.string().max(500).optional().nullable(),
        credit: z.string().max(300).optional().nullable(),
        url: z.string().max(2000).optional(),
        thumbnail_url: z.string().max(2000).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("gallery_items").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGalleryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { error } = await context.supabase.from("gallery_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderGalleryItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ gallery_id: z.string().uuid(), ids: z.array(z.string().uuid()).max(300) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    for (let i = 0; i < data.ids.length; i++) {
      const { error } = await context.supabase
        .from("gallery_items")
        .update({ position: i })
        .eq("id", data.ids[i])
        .eq("gallery_id", data.gallery_id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const setGalleryCover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ gallery_id: z.string().uuid(), item_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { error: e1 } = await context.supabase
      .from("gallery_items")
      .update({ is_cover: false })
      .eq("gallery_id", data.gallery_id);
    if (e1) throw new Error(e1.message);
    const { error } = await context.supabase
      .from("gallery_items")
      .update({ is_cover: true })
      .eq("id", data.item_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
