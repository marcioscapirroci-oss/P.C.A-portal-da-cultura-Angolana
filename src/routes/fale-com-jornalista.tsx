import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

export const Route = createFileRoute("/fale-com-jornalista")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Fale com o Jornalista · Analtino Santos Media" },
      { name: "description", content: "Envie mensagens, sugestões de temas e opiniões diretamente ao jornalista Analtino Santos." },
    ],
  }),
  component: ContactJournalist,
});

type Msg = {
  id: string;
  body: string;
  subject: string | null;
  created_at: string;
  reply_to: string | null;
  sender_id: string;
};

function ContactJournalist() {
  const [userId, setUserId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Msg[]>([]);

  async function load(uid: string) {
    const { data } = await supabase
      .from("messages")
      .select("id, body, subject, created_at, reply_to, sender_id")
      .order("created_at", { ascending: false })
      .limit(50);
    setHistory((data ?? []).filter((m) => m.sender_id === uid || m.reply_to !== null));
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      if (user) await load(user.id);
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return toast.info("Inicie sessão para enviar mensagens");
    if (body.trim().length < 4) return toast.error("Escreva a sua mensagem");
    setBusy(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      subject: subject.trim() || null,
      body: body.trim(),
      recipient_is_journalist: true,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Mensagem enviada ao jornalista");
    setSubject("");
    setBody("");
    await load(userId);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl container-px py-12">
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Comunidade</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Fale com o Jornalista</h1>
        <p className="mt-4 text-muted-foreground">
          Envie perguntas, sugestões de temas ou opiniões diretamente ao jornalista Analtino Santos. Respondemos pelo painel editorial.
        </p>

        {userId ? (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto (opcional)"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="A sua mensagem…"
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar
            </button>
          </form>
        ) : (
          <p className="mt-8 rounded-2xl border border-border bg-card px-4 py-4 text-sm">
            <Link to="/auth" className="text-primary underline-offset-4 hover:underline">Inicie sessão</Link> para enviar uma mensagem ao jornalista.
          </p>
        )}

        {history.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl">Histórico</h2>
            <ul className="mt-4 space-y-3">
              {history.map((m) => (
                <li key={m.id} className={`rounded-2xl border px-4 py-3 ${m.sender_id === userId ? "border-border bg-card/60" : "border-primary/40 bg-primary/5"}`}>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{m.sender_id === userId ? "Você" : "Analtino Santos"}</span>
                    <span>{new Date(m.created_at).toLocaleString("pt-PT")}</span>
                  </div>
                  {m.subject && <p className="mt-1 text-sm font-medium">{m.subject}</p>}
                  <p className="mt-1 whitespace-pre-wrap text-sm">{m.body}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
