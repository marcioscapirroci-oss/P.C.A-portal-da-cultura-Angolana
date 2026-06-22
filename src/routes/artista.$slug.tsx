import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Facebook, Instagram, Youtube } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ARTICLES, ARTISTS, VIDEOS } from "@/lib/content";

export const Route = createFileRoute("/artista/$slug")({
  loader: ({ params }) => {
    const artist = ARTISTS.find((a) => a.slug === params.slug);
    if (!artist) throw notFound();
    return { artist };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.artist.name} — Analtino Santos Media` },
          { name: "description", content: loaderData.artist.bio },
          { property: "og:title", content: loaderData.artist.name },
          { property: "og:description", content: loaderData.artist.bio },
          { property: "og:image", content: loaderData.artist.image },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <h1 className="font-display text-4xl">Artista não encontrado</h1>
        <Link to="/" className="mt-6 inline-block text-primary">Voltar ao início</Link>
      </div>
    </div>
  ),
  errorComponent: () => <div className="p-8">Erro ao carregar artista.</div>,
  component: ArtistPage,
});

function ArtistPage() {
  const { artist } = Route.useLoaderData();
  const related = ARTICLES.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative">
        <div className="absolute inset-0 h-[60vh] overflow-hidden">
          <img src={artist.image} alt={artist.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-hero" />
        </div>
        <div className="relative mx-auto max-w-7xl container-px pt-32 pb-16 md:pt-44 md:pb-24">
          <Link to="/" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Voltar
          </Link>
          <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-primary">{artist.genre}</p>
          <h1 className="mt-3 font-display text-5xl leading-[1.05] md:text-7xl">{artist.name}</h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground">{artist.bio}</p>
          <div className="mt-6 flex gap-3">
            {[Facebook, Instagram, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl container-px py-16">
        <h2 className="font-display text-3xl">Notícias relacionadas</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((a) => (
            <Link key={a.slug} to="/artigo/$slug" params={{ slug: a.slug }} className="group overflow-hidden rounded-2xl border border-border/60 bg-card">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={a.image} alt={a.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <span className="text-[10px] uppercase tracking-[0.25em] text-primary">{a.category}</span>
                <h3 className="mt-2 font-display text-lg">{a.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl container-px py-16">
          <h2 className="font-display text-3xl">Vídeos</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {VIDEOS.map((v) => (
              <div key={v.id} className="overflow-hidden rounded-2xl border border-border/60">
                <div className="aspect-video overflow-hidden">
                  <img src={v.thumb} alt={v.title} className="h-full w-full object-cover" />
                </div>
                <p className="p-4 text-sm">{v.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
