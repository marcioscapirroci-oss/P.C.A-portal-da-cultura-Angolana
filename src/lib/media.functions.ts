import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

async function assertStaff(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  if (!roles.includes("admin") && !roles.includes("editor")) {
    throw new Error("Forbidden");
  }
}

export const signMediaUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ path: z.string().min(1).max(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("media")
      .createSignedUrl(data.path, TEN_YEARS);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

export const listMediaAssets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.storage.from("media").list("uploads", {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) throw new Error(error.message);
    const files = (data ?? []).filter((f) => f.name && !f.name.startsWith("."));
    const paths = files.map((f) => `uploads/${f.name}`);
    if (paths.length === 0) return { assets: [] };
    const { data: signedList, error: e2 } = await supabaseAdmin.storage
      .from("media")
      .createSignedUrls(paths, TEN_YEARS);
    if (e2) throw new Error(e2.message);
    const assets = signedList.map((s, i) => ({
      path: paths[i],
      name: files[i].name,
      url: s.signedUrl,
      mimeType: (files[i].metadata as any)?.mimetype ?? "",
      size: (files[i].metadata as any)?.size ?? 0,
      createdAt: files[i].created_at ?? null,
    }));
    return { assets };
  });
