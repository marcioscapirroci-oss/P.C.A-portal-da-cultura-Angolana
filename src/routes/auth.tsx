import { createFileRoute, useNavigate, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { SiteHeader } from "@/components/SiteHeader";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Entrar · Analtino Santos Media" },
      { name: "description", content: "Crie a sua conta de leitor e junte-se à comunidade do jornalista Analtino Santos." },
    ],
  }),
  component: AuthPage,
});

type Identifier = "email" | "phone";

function normalizePhone(input: string) {
  const trimmed = input.trim().replace(/[\s-]/g, "");
  if (trimmed.startsWith("+")) return trimmed;
  // Default Angola country code if missing
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("244")) return `+${digits}`;
  return `+244${digits}`;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [identifier, setIdentifier] = useState<Identifier>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A palavra-passe deve ter pelo menos 6 caracteres");
      return;
    }
    if (identifier === "email" && !/.+@.+\..+/.test(email)) {
      toast.error("Email inválido");
      return;
    }
    if (identifier === "phone" && phone.replace(/\D/g, "").length < 8) {
      toast.error("Número de telefone inválido");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const creds =
          identifier === "email"
            ? { email: email.trim(), password, options: { data: { full_name: fullName.trim() } } }
            : { phone: normalizePhone(phone), password, options: { data: { full_name: fullName.trim() } } };
        const { error } = await supabase.auth.signUp(creds as Parameters<typeof supabase.auth.signUp>[0]);
        if (error) throw error;
        toast.success(`Bem-vindo${fullName ? `, ${fullName.split(" ")[0]}` : ""}! Conta criada com sucesso.`);
        navigate({ to: "/" });
      } else {
        const creds =
          identifier === "email"
            ? { email: email.trim(), password }
            : { phone: normalizePhone(phone), password };
        const { error } = await supabase.auth.signInWithPassword(creds as Parameters<typeof supabase.auth.signInWithPassword>[0]);
        if (error) throw error;
        toast.success("Sessão iniciada");
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro de autenticação");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/",
      });
      if (result.error) {
        toast.error("Erro ao iniciar sessão com Google");
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch {
      toast.error("Erro inesperado");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col container-px py-12">
        <Link to="/" className="text-xs text-muted-foreground">← Voltar</Link>
        <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-primary">Comunidade</p>
        <h1 className="mt-2 font-display text-4xl">{mode === "signin" ? "Entrar" : "Criar conta"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Aceda à sua conta para comentar, guardar matérias e falar com o jornalista."
            : "Junte-se à comunidade de leitores do Analtino Santos."}
        </p>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium transition hover:border-primary disabled:opacity-50"
        >
          <GoogleIcon /> Continuar com Google
        </button>

        <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
        </div>

        <div className="mb-4 inline-flex self-start rounded-full border border-border p-1 text-xs">
          <button
            type="button"
            onClick={() => setIdentifier("email")}
            className={`rounded-full px-4 py-1.5 transition ${identifier === "email" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setIdentifier("phone")}
            className={`rounded-full px-4 py-1.5 transition ${identifier === "phone" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Telefone
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Nome</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="O seu nome"
              />
            </div>
          )}
          {identifier === "email" ? (
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="email@exemplo.ao"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Telefone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="+244 9XX XXX XXX"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Palavra-passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="Mínimo 6 caracteres"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Pode usar apenas letras, apenas números, ou combinar ambos.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-gold px-5 py-3 text-sm font-medium text-primary-foreground shadow-elegant disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
        </button>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5.3 0 10.2-2 13.9-5.4l-6.4-5.4C29.3 34.5 26.8 35.5 24 35.5c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39 16.2 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.4 5.4c-.4.4 6.8-4.9 6.8-15 0-1.2-.1-2.4-.4-3.5z"/></svg>
  );
}
