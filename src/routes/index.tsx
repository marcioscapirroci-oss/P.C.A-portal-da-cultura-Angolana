import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, CalendarDays, Clock, MapPin, Play } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { type Article as StaticArticle } from "@/lib/content";
import { listPublishedArticles } from "@/lib/public-articles.functions";
import { useSiteSettings } from "@/lib/site-settings";

import hero1280 from "@/assets/hero-analtino-1280.webp.asset.json";

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
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(publishedQuery),
  errorComponent: () => <div className="p-8">Erro ao carregar.</div>,
  notFoundComponent: () => <div className="p-8">Página não encontrada.</div>,
  component: Home,
});

type FeedArticle = StaticArticle;

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

function byCategory(list: FeedArticle[], ...names: string[]) {
  const keys = names.map(norm);
  return list.filter((a) => keys.some((k) => norm(a.category).includes(k)));
}

function Home() {
  const { data } = useSuspenseQuery(publishedQuery);
  const { settings } = useSiteSettings();
  const home = settings.home;

  const published: FeedArticle[] = (data.articles ?? []).map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt ?? "",
    category: a.category,
    image: a.cover_image ?? "",
    author: "Analtino Santos",
    date: a.published_at ? new Date(a.published_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" }) : "",
    readTime: "5 min",
  }));
  const demo: FeedArticle[] = home.show_demo_articles
    ? home.demo_articles
        .filter((s) => !published.some((p) => p.slug === s.slug))
        .map((s) => ({ ...s, featured: false }))
    : [];
  const merged: FeedArticle[] = [...published, ...demo];

  const featured: FeedArticle | undefined = published[0] ?? demo[0];
  const rest = merged.filter((a) => a.slug !== featured?.slug);
  const latest = rest.slice(0, 4);
  const dayHighlights = rest.slice(4, 7);

  const cultura = byCategory(rest, "cultura").slice(0, 4);
  const musica = byCategory(rest, "música", "musica").slice(0, 4);
  const entrevistas = byCategory(rest, "entrevista").slice(0, 3);
  const sociedade = byCategory(rest, "sociedade", "notícias", "noticias", "celebridades").slice(0, 4);

  const artists = home.artists;
  const videos = home.videos;
  const events = home.events;

  const heroTitle = home.hero_title || featured?.title || settings.full_name;
  const heroText = home.hero_subtitle || featured?.excerpt || settings.description;
  const heroKicker = home.hero_kicker || (featured ? featured.category : "");
  const heroCtaLabel = home.hero_cta_label || "Ler matéria";
  const heroImage = featured?.image || home.hero_image;

  const today = new Date().toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* DATE STRIP */}
      <div className="border-b border-border/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between container-px py-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="capitalize">{today}</span>
          <span className="hidden sm:block">{settings.tagline}</span>
        </div>
      </div>

      {/* MANCHETE — grande notícia principal */}
      {featured && (
        <section className="mx-auto max-w-7xl container-px pt-10 pb-12 md:pt-14">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
            <Link
              to="/artigo/$slug"
              params={{ slug: featured.slug }}
              className="group relative block overflow-hidden"
            >
              <div className="aspect-[16/10] overflow-hidden bg-muted">
                {heroImage && (
                  <img
                    src={heroImage}
                    alt={heroTitle}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                )}
              </div>
            </Link>
            <div className="flex flex-col justify-center border-t-2 border-primary pt-6 lg:border-t-0 lg:pt-0">
              {heroKicker && (
                <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
                  {heroKicker}
                </span>
              )}
              <h1 className="mt-4 font-display text-3xl leading-[1.08] sm:text-4xl md:text-[2.9rem]">
                <Link
                  to="/artigo/$slug"
                  params={{ slug: featured.slug }}
                  className="transition-colors hover:text-primary"
                >
                  {heroTitle}
                </Link>
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                {heroText}
              </p>
              <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{featured.author}</span>
                <span aria-hidden>·</span>
                <span>{featured.date}</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {featured.readTime}
                </span>
              </div>
              <div className="mt-7">
                {home.hero_cta_to ? (
                  <a
                    href={home.hero_cta_to}
                    className="inline-flex items-center gap-2 border border-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] transition hover:bg-foreground hover:text-background"
                  >
                    {heroCtaLabel} <ArrowRight className="h-4 w-4" />
                  </a>
                ) : (
                  <Link
                    to="/artigo/$slug"
                    params={{ slug: featured.slug }}
                    className="inline-flex items-center gap-2 border border-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] transition hover:bg-foreground hover:text-background"
                  >
                    {heroCtaLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ÚLTIMAS NOTÍCIAS */}
      {home.show_latest && latest.length > 0 && (
        <section className="border-t border-border/60">
          <div className="mx-auto max-w-7xl container-px py-12 md:py-16">
            <SectionHeading title="Últimas Notícias" link="/categoria/noticias" linkLabel="Ver todas" />
            <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {latest.map((a, i) => (
                <LatestCard key={a.slug} article={a} index={i + 1} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* DESTAQUES DO DIA */}
      {dayHighlights.length > 0 && (
        <section className="border-t border-border/60 bg-card/30">
          <div className="mx-auto max-w-7xl container-px py-12 md:py-16">
            <SectionHeading title="Destaques do Dia" />
            <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
              {dayHighlights[0] && (
                <Link
                  to="/artigo/$slug"
                  params={{ slug: dayHighlights[0].slug }}
                  className="group block"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    {dayHighlights[0].image && (
                      <img
                        src={dayHighlights[0].image}
                        alt={dayHighlights[0].title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                      />
                    )}
                  </div>
                  <span className="mt-5 block text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
                    {dayHighlights[0].category}
                  </span>
                  <h3 className="mt-2 font-display text-2xl leading-tight transition-colors group-hover:text-primary md:text-3xl">
                    {dayHighlights[0].title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {dayHighlights[0].excerpt}
                  </p>
                </Link>
              )}
              <div className="flex flex-col divide-y divide-border/60 border-t border-border/60 lg:border-t-0">
                {dayHighlights.slice(1).map((a) => (
                  <Link
                    key={a.slug}
                    to="/artigo/$slug"
                    params={{ slug: a.slug }}
                    className="group flex gap-5 py-6 first:pt-0 last:pb-0 lg:first:pt-0"
                  >
                    <div className="w-28 shrink-0 overflow-hidden bg-muted sm:w-36">
                      <div className="aspect-[4/3]">
                        {a.image && (
                          <img
                            src={a.image}
                            alt={a.title}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          />
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
                        {a.category}
                      </span>
                      <h4 className="mt-1.5 font-display text-base leading-snug transition-colors group-hover:text-primary sm:text-lg">
                        {a.title}
                      </h4>
                      <span className="mt-2 block text-[11px] text-muted-foreground">{a.date}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CULTURA */}
      {cultura.length > 0 && (
        <CategorySection
          title="Cultura"
          link="/categoria/cultura"
          articles={cultura}
        />
      )}

      {/* MÚSICA + ARTISTAS */}
      {(musica.length > 0 || (home.show_artists && artists.length > 0)) && (
        <section className="border-t border-border/60 bg-card/30">
          <div className="mx-auto max-w-7xl container-px py-12 md:py-16">
            <SectionHeading title="Música" link="/categoria/musica" linkLabel="Explorar música" />
            {musica.length > 0 && (
              <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {musica.map((a) => (
                  <SmallCard key={a.slug} article={a} />
                ))}
              </div>
            )}
            {home.show_artists && artists.length > 0 && (
              <div className="mt-12 border-t border-border/60 pt-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Artistas em destaque
                </p>
                <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
                  {artists.map((artist, i) => (
                    <Link
                      key={artist.slug || i}
                      to="/artista/$slug"
                      params={{ slug: artist.slug }}
                      className="group flex items-center gap-4"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted sm:h-20 sm:w-20">
                        {artist.image && (
                          <img
                            src={artist.image}
                            alt={artist.name}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-base leading-tight transition-colors group-hover:text-primary sm:text-lg">
                          {artist.name}
                        </h3>
                        <p className="truncate text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                          {artist.genre}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ENTREVISTAS */}
      {home.show_interviews && entrevistas.length > 0 && (
        <section className="border-t border-border/60">
          <div className="mx-auto max-w-7xl container-px py-12 md:py-16">
            <SectionHeading title="Entrevistas" link="/categoria/entrevistas" linkLabel="Todas as entrevistas" />
            <div className="mt-8 grid gap-10 lg:grid-cols-3">
              {entrevistas.map((a) => (
                <Link key={a.slug} to="/artigo/$slug" params={{ slug: a.slug }} className="group block">
                  <div className="aspect-[4/5] overflow-hidden bg-muted">
                    {a.image && (
                      <img
                        src={a.image}
                        alt={a.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                      />
                    )}
                  </div>
                  <span className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
                    {a.category}
                  </span>
                  <h3 className="mt-2 font-display text-xl leading-tight transition-colors group-hover:text-primary md:text-2xl">
                    {a.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{a.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
                    Ler entrevista <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* EVENTOS + PUBLICIDADE */}
      {((home.show_events && events.length > 0) || home.show_ad) && (
        <section className="border-t border-border/60 bg-card/30">
          <div className="mx-auto max-w-7xl container-px py-12 md:py-16">
            <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
              {home.show_events && events.length > 0 && (
                <div>
                  <SectionHeading title="Eventos" link="/categoria/eventos" linkLabel="Agenda completa" />
                  <ul className="mt-8 divide-y divide-border/60 border-y border-border/60">
                    {events.map((e, i) => (
                      <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-5 py-5">
                        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center border border-primary/40 text-center">
                          <span className="font-display text-xl leading-none text-primary">{e.date.split(" ")[0]}</span>
                          <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{e.date.split(" ")[1]}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-display text-lg">{e.title}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 text-primary" /> {e.city}
                          </p>
                        </div>
                        <span className="hidden shrink-0 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground sm:inline">
                          Detalhes
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {home.show_ad && (
                <aside className="flex flex-col justify-center border-l-2 border-primary pl-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">{home.ad_kicker}</p>
                  <h3 className="mt-3 font-display text-2xl leading-tight">{home.ad_title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{home.ad_text}</p>
                  <a
                    href={`mailto:${home.ad_email || settings.contact_email}`}
                    className="mt-6 inline-flex w-fit items-center gap-2 border border-foreground px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] transition hover:bg-foreground hover:text-background"
                  >
                    Falar com a equipa <ArrowRight className="h-4 w-4" />
                  </a>
                </aside>
              )}
            </div>
          </div>
        </section>
      )}

      {/* SOCIEDADE */}
      {sociedade.length > 0 && (
        <CategorySection
          title="Sociedade"
          link="/categoria/sociedade"
          articles={sociedade}
        />
      )}

      {/* PODCAST E MULTIMÉDIA */}
      {home.show_videos && videos.length > 0 && (
        <section className="border-t border-border/60 bg-card/30">
          <div className="mx-auto max-w-7xl container-px py-12 md:py-16">
            <SectionHeading title="Podcast & Multimédia" link="/galeria" linkLabel="Ver galeria" />
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {videos.map((v, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {v.thumb && (
                      <img
                        src={v.thumb}
                        alt={v.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                      />
                    )}
                    <div className="absolute inset-0 grid place-items-center bg-background/40 opacity-0 transition group-hover:opacity-100">
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Play className="h-5 w-5" fill="currentColor" />
                      </span>
                    </div>
                    <span className="absolute bottom-3 right-3 bg-background/85 px-2 py-0.5 text-[10px] font-medium tracking-wider text-foreground">
                      {v.duration}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-base leading-snug transition-colors group-hover:text-primary">
                    {v.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SOBRE O JORNALISTA */}
      {home.show_journalist && (
        <section className="border-t border-border/60">
          <div className="mx-auto grid max-w-7xl gap-10 container-px py-14 md:grid-cols-[1fr_1.5fr] md:gap-16 md:py-20">
            <div className="overflow-hidden bg-muted">
              <img
                src={home.journalist_photo}
                alt={home.journalist_name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center border-t-2 border-primary pt-8 md:border-t-0 md:pt-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">O Jornalista</p>
              <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">{home.journalist_name}</h2>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{home.journalist_role}</p>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">{home.journalist_bio}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/sobre"
                  className="inline-flex items-center gap-2 border border-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] transition hover:bg-foreground hover:text-background"
                >
                  Conhecer o percurso <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/fale-com-jornalista"
                  className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground transition hover:text-foreground"
                >
                  Fale com o jornalista
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}

function SectionHeading({ title, link, linkLabel }: { title: string; link?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b-2 border-foreground pb-4">
      <h2 className="font-display text-3xl leading-none md:text-4xl">{title}</h2>
      {link && (
        <Link
          to={link}
          className="hidden shrink-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground transition hover:text-primary sm:inline-flex"
        >
          {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function LatestCard({ article, index }: { article: FeedArticle; index: number }) {
  return (
    <Link to="/artigo/$slug" params={{ slug: article.slug }} className="group block">
      <div className="flex items-baseline gap-3 border-b border-border/60 pb-3">
        <span className="font-display text-2xl text-primary/70">{String(index).padStart(2, "0")}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">{article.category}</span>
      </div>
      <div className="mt-4 aspect-[16/10] overflow-hidden bg-muted">
        {article.image && (
          <img
            src={article.image}
            alt={article.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <h3 className="mt-4 font-display text-lg leading-snug transition-colors group-hover:text-primary">
        {article.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <CalendarDays className="h-3 w-3" /> {article.date}
        <span aria-hidden>·</span>
        <span>{article.readTime}</span>
      </div>
    </Link>
  );
}

function SmallCard({ article }: { article: FeedArticle }) {
  return (
    <Link to="/artigo/$slug" params={{ slug: article.slug }} className="group block">
      <div className="aspect-[16/10] overflow-hidden bg-muted">
        {article.image && (
          <img
            src={article.image}
            alt={article.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <span className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
        {article.category}
      </span>
      <h3 className="mt-2 font-display text-lg leading-snug transition-colors group-hover:text-primary">
        {article.title}
      </h3>
      <span className="mt-2 block text-[11px] text-muted-foreground">{article.date}</span>
    </Link>
  );
}

function CategorySection({ title, link, articles }: { title: string; link: string; articles: FeedArticle[] }) {
  const [lead, ...restItems] = articles;
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-7xl container-px py-12 md:py-16">
        <SectionHeading title={title} link={link} linkLabel="Ver secção" />
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <Link to="/artigo/$slug" params={{ slug: lead.slug }} className="group block">
            <div className="aspect-[16/9] overflow-hidden bg-muted">
              {lead.image && (
                <img
                  src={lead.image}
                  alt={lead.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                />
              )}
            </div>
            <h3 className="mt-5 font-display text-2xl leading-tight transition-colors group-hover:text-primary md:text-3xl">
              {lead.title}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{lead.excerpt}</p>
            <span className="mt-3 block text-[11px] text-muted-foreground">
              {lead.author} · {lead.date}
            </span>
          </Link>
          <div className="flex flex-col divide-y divide-border/60">
            {restItems.map((a) => (
              <Link
                key={a.slug}
                to="/artigo/$slug"
                params={{ slug: a.slug }}
                className="group flex items-start justify-between gap-4 py-5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <h4 className="font-display text-lg leading-snug transition-colors group-hover:text-primary">
                    {a.title}
                  </h4>
                  <span className="mt-2 block text-[11px] text-muted-foreground">{a.date}</span>
                </div>
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
