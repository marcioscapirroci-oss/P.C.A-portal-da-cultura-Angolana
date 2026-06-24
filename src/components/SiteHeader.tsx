import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, Search, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/categoria/musica", label: "Música" },
  { to: "/categoria/cultura", label: "Cultura" },
  { to: "/categoria/entrevistas", label: "Entrevistas" },
  { to: "/categoria/noticias", label: "Notícias" },
  { to: "/categoria/eventos", label: "Eventos" },
  { to: "/galeria", label: "Galeria" },
  { to: "/sobre", label: "Sobre" },
  { to: "/fale-com-jornalista", label: "Fale com o Jornalista" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setEmail(data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setOpen(false);
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 container-px py-4">
        <Link to="/" className="flex items-center gap-3 min-w-0">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-gold font-display text-lg font-bold text-primary-foreground shadow-elegant">
            A
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-lg leading-none tracking-tight">Analtino Santos</span>
            <span className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Media · Angola</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {email ? (
            <div className="hidden sm:flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5 text-primary" />
                <span className="max-w-[160px] truncate">{email}</span>
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground transition hover:text-foreground hover:border-primary"
              >
                <LogOut className="h-3.5 w-3.5" />
                Terminar sessão
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="hidden sm:inline-flex items-center rounded-full border border-border px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground transition hover:text-foreground hover:border-primary"
            >
              Entrar
            </Link>
          )}
          <button className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground transition hover:text-foreground hover:border-primary">
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground"
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border/60 bg-background">
          <nav className="mx-auto flex max-w-7xl flex-col container-px py-3 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="border-b border-border/40 py-3 text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
            {email ? (
              <div className="flex items-center justify-between gap-3 py-3">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span className="max-w-[180px] truncate">{email}</span>
                </span>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-primary"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Terminar sessão
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center justify-center rounded-full bg-gradient-gold px-4 py-2 text-xs uppercase tracking-wider text-primary-foreground"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
