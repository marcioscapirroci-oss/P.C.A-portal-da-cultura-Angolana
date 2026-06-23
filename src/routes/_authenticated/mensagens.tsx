import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";
import { Loader2, Send, Inbox } from "lucide-react";

export const Route = createFileRoute("/_authenticated/mensagens")({
  ssr: false,
  head: () => ({ meta: [{ title: "Mensagens · Painel" }] }),
  component: MessagesAdmin,
});

type Msg = {
  id: string;
  sender_id: string;
  subject: string | null;
  body: string;
  read_at: string | null;
  reply_to: string | null;
  created_at: string;
  sender_name?: string | null;
};

function MessagesAdmin() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [list, setList] = useState<Msg[]>([]);
  const [selected, setSelected] = useState<Msg | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, subject, body, read_at, reply_to, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    const items = (data ?? []) as Msg[];
    const ids = Array.from(new Set(items.map((m) => m.sender_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p.full_name]));
      setList(items.map((m) => ({ ...m, sender_name: map.get(m.sender_id) ?? "Leitor" })));
    } else {
      setList(items);
    }
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      if (!user) return;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const staff = (roles ?? []).some((r) => r.role === "admin" || r.role === "super_admin");
      setIsStaff(staff);
      if (staff) await load();
    })();
  }, []);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !userId || reply.trim().length < 2) return;
    setBusy(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      subject: selected.subject ? `Re: ${selected.subject}` : "Resposta",
      body: reply.trim(),
      reply_to: selected.id,
      recipient_is_journalist: false,
    });
    if (!error && !selected.read_at) {
      await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", selected.id);
    }
    if (!error) {
      await supabase.from("notifications").insert({
        user_id: selected.sender_id,
        title: "Nova resposta do jornalista",
        body: reply.trim().slice(0, 120),
        link: "/fale-com-jornalista",
      });
    }
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Resposta enviada");
    setReply("");
    setSelected(null);
    await load();
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-2xl container-px py-16 text-center">
          <h1 className="font-display text-3xl">Apenas para administradores</h1>
          <p className="mt-2 text-muted-foreground">Esta área é exclusiva da equipa editorial.</p>
        </main>
      </div>
    );
  }

  const incoming = list.filter((m) => m.reply_to === null);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl container-px py-10">
        <header className="flex items-center gap-3">
          <Inbox className="h-5 w-5 text-primary" />
          <h1 className="font-display text-3xl">Caixa de mensagens</h1>
        </header>
        <p className="mt-2 text-sm text-muted-foreground">{incoming.length} mensagens dos leitores.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <ul className="space-y-3">
            {incoming.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => setSelected(m)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selected?.id === m.id ? "border-primary" : "border-border hover:border-primary/60"} ${!m.read_at ? "bg-primary/5" : "bg-card/60"}`}
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{m.sender_name}</span>
                    <span>{new Date(m.created_at).toLocaleDateString("pt-PT")}</span>
                  </div>
                  {m.subject && <p className="mt-1 text-sm font-medium">{m.subject}</p>}
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.body}</p>
                </button>
              </li>
            ))}
            {incoming.length === 0 && <li className="text-sm text-muted-foreground">Sem mensagens.</li>}
          </ul>

          <div className="rounded-2xl border border-border bg-card p-5">
            {selected ? (
              <>
                <p className="text-xs text-muted-foreground">De {selected.sender_name} · {new Date(selected.created_at).toLocaleString("pt-PT")}</p>
                {selected.subject && <h2 className="mt-1 font-display text-xl">{selected.subject}</h2>}
                <p className="mt-3 whitespace-pre-wrap text-sm">{selected.body}</p>
                <form onSubmit={sendReply} className="mt-6 space-y-3">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={5}
                    placeholder="Escreva a resposta…"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Responder
                  </button>
                </form>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Selecione uma mensagem para responder.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
