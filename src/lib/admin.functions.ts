import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertStaff(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  if (!roles.includes("admin") && !roles.includes("editor")) {
    throw new Error("Forbidden: precisa de papel de admin ou editor.");
  }
  return roles;
}

const articleInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(3).max(120).regex(/^[a-z0-9-]+$/, "Slug inválido"),
  title: z.string().min(3).max(200),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().max(50000).optional().nullable(),
  category: z.string().min(2).max(60),
  cover_image: z.string().url().max(500).optional().nullable(),
  status: z.enum(["draft", "scheduled", "published"]),
  published_at: z.string().datetime().optional().nullable(),
});

export const listArticlesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { data, error } = await context.supabase
      .from("articles")
      .select("id, slug, title, category, status, published_at, views, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { articles: data ?? [] };
  });

export const upsertArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => articleInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const payload = { ...data, author_id: context.userId };
    const { data: row, error } = data.id
      ? await context.supabase.from("articles").update(payload).eq("id", data.id).select().single()
      : await context.supabase.from("articles").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return { article: row };
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { error } = await context.supabase.from("articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { roles: (data ?? []).map((r: { role: string }) => r.role) };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const [{ count: total }, { count: published }, { data: top }] = await Promise.all([
      context.supabase.from("articles").select("*", { count: "exact", head: true }),
      context.supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published"),
      context.supabase.from("articles").select("title, views").order("views", { ascending: false }).limit(5),
    ]);
    const totalViews = (top ?? []).reduce((a: number, r: { views: number }) => a + (r.views ?? 0), 0);
    return { total: total ?? 0, published: published ?? 0, totalViews, top: top ?? [] };
  });
