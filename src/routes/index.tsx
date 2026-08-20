import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, MapPin, Play, Share2, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ARTICLES, ARTISTS, EVENTS, JOURNALIST, VIDEOS, type Article as StaticArticle } from "@/lib/content";
import { listPublishedArticles } from "@/lib/public-articles.functions";
import { useSiteSettings } from "@/lib/site-settings";


import hero640 from "@/assets/hero-analtino-640.webp.asset.json";
import hero1280 from "@/assets/hero-analtino-1280.webp.asset.json";
import hero1920 from "@/assets/hero-analtino-1920.webp.asset.json";

const heroSrcSet = `${hero640.url} 640w, ${hero1280.url} 1280w, ${hero1920.url} 1920w`;

const publishedQuery = queryOptions({
  queryKey: ["published-articles"],
  queryFn: () => listPublishedArticles(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PCArt — Plataforma da Cultura Angolana — Jornalismo, Cultura e Música de Angola" },
      { name: "description", content: "Entrevistas exclusivas, reportagens e cobertura cultural de Angola pelo jornalista Analtino Santos." },
      { property: "og:title", content: "PCArt — Plataforma da Cultura Angolana" },
      { property: "og:description", content: "Entrevistas, reportagens e a cultura angolana em destaque." },
      { property: "og:image", content: hero1280.url },
    ],
    links: [
      { rel: "preload", as: "image", href: hero1280.url, imagesrcset: heroSrcSet, imagesizes: "100vw", fetchpriority: "high" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(publishedQuery),
  errorComponent: () => <div className="p-8">Erro ao carregar.</div>,
  notFoundComponent: () => <div className="p-8">Página não encontrada.</div>,
  component: Home,
});

type FeedArticle = StaticArticle;

function Home() {
  const { data } = useSuspenseQuery(publishedQuery);
  const { settings } = useSiteSettings();
  const home = settings.home;

  const published: FeedArticle[] = (data.articles ?? []).map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt ?? "",
    category: a.category,
    image: a.cover_image ?? JOURNALIST.photos.group,
    author: "Analtino Santos",
    date: a.published_at ? new Date(a.published_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" }) : "",
    readTime: "5 min",
  }));
  const demo = home.show_demo_articles ? ARTICLES.filter((s) => !published.some((p) => p.slug === s.slug)) : [];
  const merged: FeedArticle[] = [...published, ...demo];
  const featured: FeedArticle | undefined = published[0] ?? demo.find((a) => a.featured) ?? demo[0];
  const latest = merged.filter((a) => a.slug !== featured?.slug).slice(0, 4);
  const interviews = merged.filter((a) => a.category === "Entrevistas");

  const artists = home.artists.length ? home.artists : home.show_demo_articles ? ARTISTS : [];
  const videos = home.videos.length ? home.videos : home.show_demo_articles ? VIDEOS : [];
  const events = home.events.length ? home.events : home.show_demo_articles ? EVENTS : [];

  const heroImage = home.hero_image || hero1280.url;
  const heroKicker = home.hero_kicker || (featured ? `${featured.category} · Em destaque` : "");
  const heroTitle = home.hero_title || featured?.title || settings.full_name;
  const heroText = home.hero_subtitle || featured?.excerpt || settings.description;
  const heroCtaLabel = home.hero_cta_label || "Ler matéria";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative">
        <div className="relative h-[78vh] min-h-[560px] w-full overflow-hidden">
          <img
            src={heroImage}
            {...(home.hero_image ? {} : { srcSet: heroSrcSet, sizes: "100vw" })}
            alt={heroTitle}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center motion-safe:animate-[heroZoom_18s_ease-out_forwards]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/55 to-background/90" />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-7xl container-px pb-12 md:pb-20">
              {heroKicker && (
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/40 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-primary backdrop-blur">
                  <Sparkles className="h-3 w-3" /> {heroKicker}
                </span>
              )}
              <h1 className="mt-5 max-w-4xl font-display text-3xl leading-[1.05] sm:text-5xl md:text-6xl">
                {heroTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {heroText}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                {home.hero_cta_to ? (
                  <a
                    href={home.hero_cta_to}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3 text-sm font-medium text-primary-foreground shadow-elegant transition hover:opacity-90"
                  >
                    {heroCtaLabel} <ArrowRight className="h-4 w-4" />
                  </a>
                ) : featured ? (
                  <Link
                    to="/artigo/$slug"
                    params={{ slug: featured.slug }}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3 text-sm font-medium text-primary-foreground shadow-elegant transition hover:opacity-90"
                  >
                    {heroCtaLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
                {featured && !home.hero_title && (
                  <span className="text-xs text-muted-foreground">
                    Por {featured.author} · {featured.date} · {featured.readTime} de leitura
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* LATEST */}
      <section className="mx-auto max-w-7xl container-px py-16 md:py-24">
        <SectionHeading eyebrow="Últimas publicações" title="O que está a definir a agenda cultural" link="/categoria/noticias" linkLabel="Ver todas" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      </section>

      {/* INTERVIEWS */}
      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl container-px py-16 md:py-24">
          <SectionHeading eyebrow="Entrevistas exclusivas" title="Conversas que ficam para a história" link="/categoria/entrevistas" linkLabel="Todas as entrevistas" />
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {interviews.concat(interviews).slice(0, 2).map((a, i) => (
              <Link
                key={i}
                to="/artigo/$slug"
                params={{ slug: a.slug }}
                className="group grid gap-6 rounded-3xl border border-border/60 bg-card p-4 shadow-card transition hover:border-primary/40 sm:grid-cols-[1fr_1.2fr] sm:p-6"
              >
                <div className="aspect-[4/5] overflow-hidden rounded-2xl">
                  <img src={a.image} alt={a.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-primary">{a.category}</span>
                  <h3 className="mt-3 font-display text-2xl leading-tight md:text-3xl">{a.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{a.excerpt}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm text-primary">
                    Ler entrevista <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ARTISTS */}
      <section className="mx-auto max-w-7xl container-px py-16 md:py-24">
        <SectionHeading eyebrow="Artistas em destaque" title="As vozes que fazem Angola" link="/categoria/musica" linkLabel="Explorar música" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ARTISTS.map((artist) => (
            <Link
              key={artist.slug}
              to="/artista/$slug"
              params={{ slug: artist.slug }}
              className="group relative overflow-hidden rounded-3xl border border-border/60"
            >
              <div className="aspect-[3/4] overflow-hidden">
                <img src={artist.image} alt={artist.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-[11px] uppercase tracking-[0.25em] text-primary">{artist.genre}</p>
                <h3 className="mt-1 font-display text-xl">{artist.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* VIDEOS */}
      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl container-px py-16 md:py-24">
          <SectionHeading eyebrow="Vídeos recentes" title="Reportagens em movimento" link="/categoria/noticias" linkLabel="Ver canal" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {VIDEOS.map((v) => (
              <div key={v.id} className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/60">
                <div className="aspect-video overflow-hidden">
                  <img src={v.thumb} alt={v.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                </div>
                <div className="absolute inset-0 grid place-items-center bg-background/30 opacity-0 transition group-hover:opacity-100">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-gold text-primary-foreground shadow-elegant">
                    <Play className="h-6 w-6" fill="currentColor" />
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 p-4">
                  <p className="text-sm font-medium leading-tight">{v.title}</p>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{v.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EVENTS + AD */}
      <section className="mx-auto max-w-7xl container-px py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionHeading eyebrow="Cobertura de eventos" title="Agenda cultural de Angola" />
            <ul className="mt-8 divide-y divide-border/60 rounded-2xl border border-border/60 bg-card/30">
              {EVENTS.map((e, i) => (
                <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 py-5 sm:px-7">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-gold text-center text-primary-foreground">
                    <span className="font-display text-xs leading-none">{e.date.split(" ")[0]}</span>
                    <span className="text-[10px] uppercase">{e.date.split(" ")[1]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{e.title}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {e.city}</p>
                  </div>
                  <button className="hidden shrink-0 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground sm:inline">Detalhes</button>
                </li>
              ))}
            </ul>
          </div>

          <aside className="rounded-3xl border border-primary/30 bg-gradient-to-br from-card to-background p-8 shadow-card">
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Parcerias & publicidade</p>
            <h3 className="mt-3 font-display text-2xl">Anuncie no portal de referência da cultura angolana</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Espaços premium para marcas que querem comunicar com o público cultural mais qualificado de Angola.
            </p>
            <a href="mailto:contacto@analtinosantos.ao" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-medium text-primary-foreground">
              Falar com a equipa <ArrowRight className="h-4 w-4" />
            </a>
          </aside>
        </div>
      </section>

      {/* JOURNALIST STRIP */}
      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto grid max-w-7xl gap-10 container-px py-16 md:grid-cols-[1.1fr_1.4fr] md:py-24">
          <div className="overflow-hidden rounded-3xl shadow-elegant">
            <img src={JOURNALIST.photos.award} alt={JOURNALIST.name} className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Sobre o jornalista</p>
            <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{JOURNALIST.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{JOURNALIST.role}</p>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">{JOURNALIST.bio}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/sobre" className="rounded-full bg-gradient-gold px-6 py-3 text-sm font-medium text-primary-foreground shadow-elegant">
                Conhecer o percurso
              </Link>
              <button className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm">
                <Share2 className="h-4 w-4" /> Partilhar perfil
              </button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function SectionHeading({ eyebrow, title, link, linkLabel }: { eyebrow: string; title: string; link?: string; linkLabel?: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl leading-tight md:text-4xl">{title}</h2>
      </div>
      {link && (
        <Link to={link} className="hidden shrink-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground sm:inline-flex">
          {linkLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function ArticleCard({ article }: { article: { slug: string; title: string; excerpt: string; category: string; image: string; date: string; readTime: string } }) {
  return (
    <Link to="/artigo/$slug" params={{ slug: article.slug }} className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:border-primary/40">
      <div className="aspect-[4/3] overflow-hidden">
        <img src={article.image} alt={article.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="text-[10px] uppercase tracking-[0.25em] text-primary">{article.category}</span>
        <h3 className="mt-2 font-display text-lg leading-snug">{article.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>
        <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {article.date}</span>
          <span>{article.readTime}</span>
        </div>
      </div>
    </Link>
  );
}
