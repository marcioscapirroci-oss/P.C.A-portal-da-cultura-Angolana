import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useSiteSettings } from "@/lib/site-settings";

export const Route = createFileRoute("/categoria/$slug")({
  head: ({ params }) => {
    const label = decodeURIComponent(params.slug).replace(/^./, (c) => c.toUpperCase());
    return {
      meta: [
        { title: `${label} — PCArt — Plataforma da Cultura Angolana` },
        { name: "description", content: `Matérias da categoria ${label} no portal PCArt — Plataforma da Cultura Angolana.` },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const label = decodeURIComponent(slug);
  const { settings } = useSiteSettings();
  const all = settings.home.demo_articles;
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const items = all.filter((a) => norm(a.category) === norm(label));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-7xl container-px py-16 md:py-24">
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Categoria</p>
        <h1 className="mt-2 font-display text-5xl capitalize md:text-6xl">{label}</h1>
        <p className="mt-3 text-muted-foreground">{items.length} {items.length === 1 ? "matéria" : "matérias"} nesta secção.</p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(items.length ? items : all).map((a) => (
            <Link key={a.slug} to="/artigo/$slug" params={{ slug: a.slug }} className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:border-primary/40">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={a.image} alt={a.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
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
