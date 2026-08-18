import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, Music2, Youtube } from "lucide-react";
import { useSiteSettings } from "@/lib/site-settings";

export function SiteFooter() {
  const { settings } = useSiteSettings();

  return (
    <footer className="mt-24 border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl container-px py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img
                src="/pcart-logo.jpg"
                alt={settings.full_name}
                className="h-12 w-12 rounded-full object-cover"
                width={48}
                height={48}
              />
              <div>
                <p className="font-display text-xl">{settings.full_name}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{settings.footer_tagline}</p>
              </div>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">{settings.footer_about}</p>
            <div className="mt-6 flex gap-3">
              {[
                { Icon: Facebook, href: "#" },
                { Icon: Instagram, href: "#" },
                { Icon: Youtube, href: "#" },
                { Icon: Music2, href: "#" },
                { Icon: Mail, href: `mailto:${settings.contact_email}` },
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
              {settings.categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    to="/categoria/$slug"
                    params={{ slug: c.slug }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">Contacto</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{settings.contact_city}</li>
              <li>{settings.contact_email}</li>
              <li>{settings.contact_phone}</li>
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
          <p>© {new Date().getFullYear()} {settings.full_name}. Todos os direitos reservados.</p>
          <p>{settings.footer_note}</p>
        </div>
      </div>
    </footer>
  );
}
