import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, Music2, Youtube } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl container-px py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-gold font-display text-xl font-bold text-primary-foreground">
                A
              </span>
              <div>
                <p className="font-display text-xl">PCArt — Plataforma da Cultura Angolana</p>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Jornalismo · Cultura · Música</p>
              </div>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
              Plataforma digital independente dedicada à informação cultural angolana — entrevistas,
              reportagens e cobertura dos eventos que movem a nossa música e a nossa sociedade.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { Icon: Facebook, href: "#" },
                { Icon: Instagram, href: "#" },
                { Icon: Youtube, href: "#" },
                { Icon: Music2, href: "#" },
                { Icon: Mail, href: "mailto:contacto@analtinosantos.ao" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">Secções</p>
            <ul className="space-y-2 text-sm">
              {["Música", "Cultura", "Entrevistas", "Notícias", "Eventos", "Celebridades", "Sociedade"].map((c) => (
                <li key={c}>
                  <Link
                    to="/categoria/$slug"
                    params={{ slug: c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">Contacto</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Luanda, Angola</li>
              <li>contacto@analtinosantos.ao</li>
              <li>+244 923 000 000</li>
              <li className="pt-2">
                <Link to="/sobre" className="text-primary hover:underline">Sobre o jornalista →</Link>
              </li>
              <li>
                <Link to="/auth" className="text-muted-foreground hover:text-foreground">Acesso editorial</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} PCArt — Plataforma da Cultura Angolana. Todos os direitos reservados.</p>
          <p>Feito com paixão em Luanda 🇦🇴</p>
        </div>
      </div>
    </footer>
  );
}
