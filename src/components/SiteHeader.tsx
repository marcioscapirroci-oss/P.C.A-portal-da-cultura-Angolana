import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, Search, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/lib/site-settings";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

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

  const linkClass = "text-muted-foreground transition-colors hover:text-foreground";

  function NavLinks({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
    return (
      <>
        {settings.nav.map((n) => (
          <Link
            key={n.to}
            to={n.to as "/"}
            onClick={onNavigate}
            className={className ?? linkClass}
            activeProps={{ className: "text-foreground" }}
            activeOptions={{ exact: n.to === "/" }}
          >
            {n.label}
          </Link>
        ))}
        {settings.categories.slice(0, 5).map((c) => (
          <Link
            key={c.slug}
            to="/categoria/$slug"
            params={{ slug: c.slug }}
            onClick={onNavigate}
            className={className ?? linkClass}
            activeProps={{ className: "text-foreground" }}
          >
            {c.label}
          </Link>
        ))}
      </>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 container-px py-4">
        <Link to="/" className="flex items-center gap-3 min-w-0">
          <img
            src="/pcart-logo.jpg"
            alt={`${settings.brand} — ${settings.tagline}`}
            className="h-10 w-10 shrink-0 rounded-full object-cover shadow-elegant"
            width={40}
            height={40}
          />
          <span className="min-w-0">
            <span className="block truncate font-display text-lg leading-none tracking-tight">{settings.brand}</span>
            <span className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {settings.header_kicker}
            </span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm">
          <NavLinks />
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
            <NavLinks
              onNavigate={() => setOpen(false)}
              className="border-b border-border/40 py-3 text-muted-foreground hover:text-foreground"
            />
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
