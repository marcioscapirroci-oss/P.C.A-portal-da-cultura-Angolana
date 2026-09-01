import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

const LIST_COLS = "id, slug, title, subtitle, excerpt, category, cover_image, published_at, views";
const FULL_COLS = "id, slug, title, subtitle, excerpt, content, blocks, category, cover_image, published_at, views";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listPublishedArticles = createServerFn({ method: "GET" }).handler(
  async () => {
    const sb = publicClient();
    const { data, error } = await sb
      .from("articles")
      .select(LIST_COLS)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { articles: data ?? [] };
  },
);

export const listPublishedByCategory = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ category: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: rows, error } = await sb
      .from("articles")
      .select(LIST_COLS)
      .eq("status", "published")
      .ilike("category", data.category)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { articles: rows ?? [] };
  });

export const searchPublishedArticles = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ q: z.string().max(120) }).parse(d))
  .handler(async ({ data }) => {
    const q = data.q.trim();
    if (!q) return { articles: [] };
    const sb = publicClient();
    const like = `%${q.replace(/[%_]/g, "")}%`;
    const { data: rows, error } = await sb
      .from("articles")
      .select(LIST_COLS)
      .eq("status", "published")
      .or(`title.ilike.${like},excerpt.ilike.${like},subtitle.ilike.${like},category.ilike.${like}`)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { articles: rows ?? [] };
  });

export const getPublishedArticle = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row, error } = await sb
      .from("articles")
      .select(FULL_COLS)
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { article: row };
  });
