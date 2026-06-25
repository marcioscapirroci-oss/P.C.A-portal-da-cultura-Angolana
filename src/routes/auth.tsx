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

// Translate Supabase auth errors to clear Portuguese messages.
function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou palavra-passe incorretos.";
  if (m.includes("user already registered") || m.includes("already been registered")) return "Este email já está registado. Tente iniciar sessão.";
  if (m.includes("email not confirmed")) return "Confirme o seu email antes de iniciar sessão.";
  if (m.includes("password should be at least")) return "A palavra-passe deve ter pelo menos 6 caracteres.";
  if (m.includes("invalid email") || m.includes("unable to validate email")) return "Email inválido.";
  if (m.includes("rate limit") || m.includes("too many")) return "Demasiadas tentativas. Aguarde alguns minutos.";
  if (m.includes("network") || m.includes("failed to fetch")) return "Sem ligação ao servidor. Verifique a internet.";
  if (m.includes("signup is disabled") || m.includes("signups not allowed")) return "Criação de contas temporariamente desativada.";
  if (m.includes("database error")) return "Erro ao guardar a conta. Tente novamente.";
  return message;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (!/.+@.+\..+/.test(cleanEmail)) {
      toast.error("Introduza um email válido.");
      return;
    }

    if (mode === "forgot") {
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Enviámos um email com as instruções para recuperar a palavra-passe.");
        setMode("signin");
      } catch (err) {
        toast.error(translateAuthError(err instanceof Error ? err.message : "Erro ao enviar email."));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (password.length < 6) {
      toast.error("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }

    if (mode === "signup" && fullName.trim().length < 2) {
      toast.error("Indique o seu nome.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Conta criada. Confirme o seu email para continuar.");
          setMode("signin");
        } else {
          toast.success(`Bem-vindo${fullName ? `, ${fullName.split(" ")[0]}` : ""}!`);
          await redirectByRole(data.session.user.id);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
        toast.success("Sessão iniciada.");
        await redirectByRole(data.user.id);
      }
    } catch (err) {
      toast.error(translateAuthError(err instanceof Error ? err.message : "Erro de autenticação."));
    } finally {
      setLoading(false);
    }
  }

  async function redirectByRole(userId: string) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = (data ?? []).map((r) => r.role);
    const isStaff = roles.some((r) => r === "jornalista" || r === "admin" || r === "super_admin" || r === "editor");
    navigate({ to: isStaff ? "/admin" : "/" });
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/",
      });
      if (result.error) {
        toast.error("Não foi possível iniciar sessão com Google. Tente novamente.");
        setLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch {
      toast.error("Erro inesperado ao iniciar sessão com Google.");
      setLoading(false);
    }
  }

  const title = mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar palavra-passe";
  const subtitle =
    mode === "signin"
      ? "Aceda à sua conta para comentar, guardar matérias e falar com o jornalista."
      : mode === "signup"
      ? "Junte-se à comunidade de leitores do Analtino Santos."
      : "Indique o email da sua conta e enviaremos instruções para definir uma nova palavra-passe.";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col container-px py-12">
        <Link to="/" className="text-xs text-muted-foreground">← Voltar</Link>
        <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-primary">Comunidade</p>
        <h1 className="mt-2 font-display text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

        {mode !== "forgot" && (
          <>
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
          </>
        )}

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Nome</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="O seu nome"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
              placeholder="email@exemplo.ao"
            />
          </div>
          {mode !== "forgot" && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs uppercase tracking-wider text-muted-foreground">Palavra-passe</label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Esqueci-me
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-gold px-5 py-3 text-sm font-medium text-primary-foreground shadow-elegant disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar instruções"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
          {mode === "signin" && (
            <button onClick={() => setMode("signup")} className="text-left hover:text-foreground">
              Não tem conta? <span className="text-primary">Criar agora</span>
            </button>
          )}
          {mode === "signup" && (
            <button onClick={() => setMode("signin")} className="text-left hover:text-foreground">
              Já tem conta? <span className="text-primary">Entrar</span>
            </button>
          )}
          {mode === "forgot" && (
            <button onClick={() => setMode("signin")} className="text-left hover:text-foreground">
              ← Voltar ao início de sessão
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5.3 0 10.2-2 13.9-5.4l-6.4-5.4C29.3 34.5 26.8 35.5 24 35.5c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39 16.2 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.4 5.4c-.4.4 6.8-4.9 6.8-15 0-1.2-.1-2.4-.4-3.5z"/></svg>
  );
}
