import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Share2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ARTICLES } from "@/lib/content";

export const Route = createFileRoute("/artigo/$slug")({
  loader: ({ params }) => {
    const article = ARTICLES.find((a) => a.slug === params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.article.title} — Analtino Santos Media` },
          { name: "description", content: loaderData.article.excerpt },
          { property: "og:title", content: loaderData.article.title },
          { property: "og:description", content: loaderData.article.excerpt },
          { property: "og:image", content: loaderData.article.image },
          { property: "og:type", content: "article" },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <h1 className="font-display text-4xl">Matéria não encontrada</h1>
        <Link to="/" className="mt-6 inline-block text-primary">Voltar ao início</Link>
      </div>
    </div>
  ),
  errorComponent: () => <div className="p-8">Erro ao carregar matéria.</div>,
  component: ArticlePage,
});

function ArticlePage() {
  const { article } = Route.useLoaderData();
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const wa = `https://wa.me/?text=${encodeURIComponent(article.title + " — " + shareUrl)}`;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-3xl container-px py-12 md:py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Início
        </Link>

        <p className="mt-8 text-[11px] uppercase tracking-[0.3em] text-primary">{article.category}</p>
        <h1 className="mt-3 font-display text-4xl leading-tight md:text-6xl">{article.title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-border/60 py-4 text-xs text-muted-foreground">
          <span>Por {article.author} · {article.date} · {article.readTime} de leitura</span>
          <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 hover:text-foreground">
            <Share2 className="h-3 w-3" /> Partilhar no WhatsApp
          </a>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl shadow-elegant">
          <img src={article.image} alt={article.title} className="h-full w-full object-cover" />
        </div>

        <div className="prose prose-invert mt-10 max-w-none text-base leading-[1.85] text-foreground/90">
          <p>Esta é uma demonstração do conteúdo editorial do portal. O sistema de gestão completo de artigos, comentários, agendamento e estatísticas será disponibilizado assim que o Lovable Cloud for activado — incluindo a área privada do jornalista com login seguro.</p>
          <p>Entretanto, todas as páginas (categorias, perfis de artistas, vídeos, eventos e perfil do jornalista) já estão prontas e optimizadas para telemóvel, tablet e desktop.</p>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
