import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useSiteSettings } from "@/lib/site-settings";
import { listPublishedByCategory } from "@/lib/public-articles.functions";

export const Route = createFileRoute("/categoria/$slug")({
  head: ({ params }) => {
    const label = decodeURIComponent(params.slug).replace(/^./, (c) => c.toUpperCase());
    return {
      meta: [
        { title: `${label} — PCArt — Plataforma da Cultura Angolana` },
        { name: "description", content: `Matérias da categoria ${label} no portal PCArt — Plataforma da Cultura Angolana.` },
        { property: "og:title", content: `${label} — PCArt` },
        { property: "og:description", content: `Todas as matérias de ${label} no portal PCArt.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CategoryPage,
});

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function CategoryPage() {
  const { slug } = Route.useParams();
  const { settings } = useSiteSettings();
  const match = settings.categories.find((c) => norm(c.slug) === norm(decodeURIComponent(slug)));
  const label = match?.label ?? decodeURIComponent(slug);

  const q = useQuery({
    queryKey: ["category-articles", label],
    queryFn: () => listPublishedByCategory({ data: { category: label } }),
    staleTime: 30_000,
  });

  const published = (q.data?.articles ?? []).map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt ?? a.subtitle ?? "",
    category: a.category,
    image: a.cover_image ?? "",
  }));

  const demo = settings.home.show_demo_articles
    ? settings.home.demo_articles
        .filter((a) => norm(a.category) === norm(label))
        .filter((a) => !published.some((p) => p.slug === a.slug))
        .map((a) => ({ slug: a.slug, title: a.title, excerpt: a.excerpt, category: a.category, image: a.image }))
    : [];

  const items = [...published, ...demo];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-7xl container-px py-16 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Categoria</p>
        <h1 className="mt-2 font-display text-5xl capitalize md:text-6xl">{label}</h1>
        <p className="mt-3 text-muted-foreground">
          {q.isLoading ? "A carregar…" : `${items.length} ${items.length === 1 ? "matéria" : "matérias"} nesta secção.`}
        </p>

        {!q.isLoading && items.length === 0 && (
          <p className="mt-12 rounded-2xl border border-border/60 bg-card/30 px-6 py-12 text-center text-sm text-muted-foreground">
            Ainda não há matérias publicadas em {label}.
          </p>
        )}

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <Link key={a.slug} to="/artigo/$slug" params={{ slug: a.slug }} className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:border-primary/40">
              <div className="aspect-[4/3] overflow-hidden">
                {a.image ? (
                  <img src={a.image} alt={a.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <span className="text-[10px] uppercase tracking-[0.25em] text-primary">{a.category}</span>
                <h3 className="mt-2 font-display text-lg leading-snug">{a.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
