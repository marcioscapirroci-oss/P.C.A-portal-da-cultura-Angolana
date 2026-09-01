import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { searchPublishedArticles } from "@/lib/public-articles.functions";
import { useSiteSettings } from "@/lib/site-settings";

export const Route = createFileRoute("/pesquisa")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Pesquisar matérias — PCArt — Plataforma da Cultura Angolana" },
      { name: "description", content: "Pesquise entrevistas, notícias, cultura e música no portal PCArt — Plataforma da Cultura Angolana." },
      { property: "og:title", content: "Pesquisar matérias — PCArt" },
      { property: "og:description", content: "Encontre entrevistas, notícias e reportagens culturais de Angola." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  const query = useQuery({
    queryKey: ["search-articles", q],
    queryFn: () => searchPublishedArticles({ data: { q } }),
    enabled: q.trim().length > 1,
  });

  const published = (query.data?.articles ?? []).map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt ?? a.subtitle ?? "",
    category: a.category,
    image: a.cover_image ?? "",
  }));

  const demo = settings.home.show_demo_articles && q.trim().length > 1
    ? settings.home.demo_articles
        .filter((a) => [a.title, a.excerpt, a.category].some((f) => norm(f).includes(norm(q))))
        .filter((a) => !published.some((p) => p.slug === a.slug))
        .map((a) => ({ slug: a.slug, title: a.title, excerpt: a.excerpt, category: a.category, image: a.image }))
    : [];

  const items = [...published, ...demo];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-5xl container-px py-16 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Pesquisa</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Procurar no portal</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = String(new FormData(e.currentTarget).get("q") ?? "");
            navigate({ to: "/pesquisa", search: { q: value } });
          }}
          className="mt-8 flex gap-3"
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="Ex.: entrevista, semba, Luanda…"
            className="w-full rounded-full border border-border bg-background px-5 py-3 text-sm outline-none focus:border-primary"
          />
          <button className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3 text-sm font-medium text-primary-foreground">
            <Search className="h-4 w-4" /> Procurar
          </button>
        </form>

        <div className="mt-10 space-y-4">
          {q.trim().length <= 1 && <p className="text-sm text-muted-foreground">Escreva pelo menos duas letras.</p>}
          {query.isLoading && <p className="text-sm text-muted-foreground">A procurar…</p>}
          {q.trim().length > 1 && !query.isLoading && items.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma matéria encontrada para “{q}”.</p>
          )}
          {items.map((a) => (
            <Link
              key={a.slug}
              to="/artigo/$slug"
              params={{ slug: a.slug }}
              className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 rounded-2xl border border-border/60 bg-card/40 p-4 transition hover:border-primary/40"
            >
              <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                {a.image && <img src={a.image} alt={a.title} className="h-full w-full object-cover" loading="lazy" />}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-[0.25em] text-primary">{a.category}</span>
                <h2 className="mt-1 font-display text-lg leading-snug">{a.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
