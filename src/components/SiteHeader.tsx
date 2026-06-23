import { Link } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/categoria/musica", label: "Música" },
  { to: "/categoria/cultura", label: "Cultura" },
  { to: "/categoria/entrevistas", label: "Entrevistas" },
  { to: "/categoria/noticias", label: "Notícias" },
  { to: "/categoria/eventos", label: "Eventos" },
  { to: "/sobre", label: "Sobre" },
  { to: "/fale-com-jornalista", label: "Fale com o Jornalista" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
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
          </nav>
        </div>
      )}
    </header>
  );
}
