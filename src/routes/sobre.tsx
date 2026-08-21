import { createFileRoute } from "@tanstack/react-router";
import { Award, Mic2, Newspaper } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useSiteSettings } from "@/lib/site-settings";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre Analtino Santos — Jornalista Cultural" },
      { name: "description", content: "Percurso, biografia e galeria do jornalista angolano Analtino Santos." },
      { property: "og:title", content: "Sobre Analtino Santos" },
      { property: "og:description", content: "Duas décadas a cobrir a cultura, a música e a sociedade de Angola." },
    ],
  }),
  component: SobrePage,
});

function SobrePage() {
  const { settings } = useSiteSettings();
  const about = settings.about;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="mx-auto max-w-7xl container-px pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="grid gap-10 md:grid-cols-[1.1fr_1fr]">
          <div className="order-2 md:order-1 flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary">{about.kicker}</p>
            <h1 className="mt-3 font-display text-5xl leading-[1.02] md:text-7xl">{about.name}</h1>
            <p className="mt-3 text-base text-muted-foreground">{about.role}</p>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">{about.bio}</p>

            <div className="mt-10 grid grid-cols-3 gap-4">
              {about.stats.map(({ value, label }, i) => {
                const Icon = [Newspaper, Mic2, Award][i % 3];
                return (
                <div key={label + i} className="rounded-2xl border border-border/60 bg-card/50 p-4">
                  <Icon className="h-4 w-4 text-primary" />
                  <p className="mt-3 font-display text-2xl">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                );
              })}
            </div>
          </div>

          <div className="order-1 md:order-2 relative">
            <div className="overflow-hidden rounded-3xl shadow-elegant">
              <img src={about.portrait} alt={about.name} className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden h-32 w-32 rounded-2xl border border-primary/40 bg-gradient-gold md:block" />
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl container-px py-16 md:py-24">
          <p className="text-[11px] uppercase tracking-[0.3em] text-primary">{about.gallery_kicker}</p>
          <h2 className="mt-2 font-display text-3xl md:text-4xl">{about.gallery_title}</h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:grid-rows-2">
            {about.gallery.map((src, i) => (
              <figure
                key={i}
                className={i === 0 ? "lg:col-span-7 lg:row-span-2 overflow-hidden rounded-3xl" : "lg:col-span-5 overflow-hidden rounded-3xl"}
              >
                <img src={src} alt={`${about.name} — imagem ${i + 1}`} className="h-full w-full object-cover" />
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="mx-auto max-w-3xl container-px py-20 text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Contacto</p>
        <h2 className="mt-2 font-display text-3xl md:text-4xl">{about.contact_title}</h2>
        <p className="mt-3 text-muted-foreground">{about.contact_text}</p>
        <a href={`mailto:${about.contact_email}`} className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-gold px-6 py-3 text-sm font-medium text-primary-foreground shadow-elegant">
          {about.contact_email}
        </a>
      </section>

      <SiteFooter />
    </div>
  );
}
