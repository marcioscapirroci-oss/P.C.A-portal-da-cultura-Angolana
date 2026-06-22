import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

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
      .select("id, slug, title, excerpt, category, cover_image, published_at, views")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return { articles: data ?? [] };
  },
);

export const getPublishedArticle = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row, error } = await sb
      .from("articles")
      .select("id, slug, title, excerpt, content, category, cover_image, published_at, views")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { article: row };
  });
