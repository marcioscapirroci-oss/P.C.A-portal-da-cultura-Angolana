import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const MODES = ["improve", "rewrite", "spelling", "title", "subtitle", "summary"] as const;

const input = z.object({
  mode: z.enum(MODES),
  text: z.string().min(1).max(20000),
  context: z.string().max(2000).optional().default(""),
});

const PROMPTS: Record<(typeof MODES)[number], string> = {
  improve:
    "Melhora a redacção do texto jornalístico em português de Angola, mantendo rigorosamente o sentido original, os factos e os nomes. Não inventes informação. Devolve apenas o texto final.",
  rewrite:
    "Reescreve o texto jornalístico em português de Angola com outra construção frásica, mais fluida e clara, mantendo rigorosamente o sentido, os factos e os nomes. Não inventes informação. Devolve apenas o texto final.",
  spelling:
    "Corrige apenas ortografia, gramática, acentuação e pontuação do texto em português europeu/Angola. Não alteres o estilo nem o conteúdo. Devolve apenas o texto corrigido.",
  title:
    "Gera um único título jornalístico forte para o texto, em português, com no máximo 90 caracteres, sem aspas e sem ponto final. Devolve apenas o título.",
  subtitle:
    "Gera um único subtítulo (lead curto) para o texto, em português, com no máximo 160 caracteres, sem aspas. Devolve apenas o subtítulo.",
  summary:
    "Gera um resumo do texto em português com 2 a 3 frases (máx. 400 caracteres), mantendo o sentido original. Devolve apenas o resumo.",
};

const STAFF = ["jornalista", "admin", "super_admin", "editor"];

export const aiEditorAssist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data, context }) => {
    const { data: roleRows, error: roleErr } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (roleErr) throw new Error(roleErr.message);
    if (!(roleRows ?? []).some((r: { role: string }) => STAFF.includes(r.role))) {
      throw new Error("Forbidden");
    }

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { text: "", error: "IA indisponível de momento." };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: `És um editor de jornalismo cultural angolano. ${PROMPTS[data.mode]}` },
          {
            role: "user",
            content: data.context ? `Contexto: ${data.context}\n\nTexto:\n${data.text}` : data.text,
          },
        ],
      }),
    });

    if (res.status === 429) return { text: "", error: "Limite de pedidos de IA atingido. Tente novamente em instantes." };
    if (res.status === 402) return { text: "", error: "Créditos de IA esgotados." };
    if (!res.ok) return { text: "", error: "Falha ao contactar a IA." };

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const out = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!out) return { text: "", error: "A IA não devolveu conteúdo." };
    return { text: out, error: null as string | null };
  });
