import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Share2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArticleEngagement } from "@/components/ArticleEngagement";
import { useSiteSettings } from "@/lib/site-settings";
import { getPublishedArticle } from "@/lib/public-articles.functions";
import { blocksFromLegacyContent, normalizeBlocks, type ContentBlock } from "@/lib/article-blocks";


export const Route = createFileRoute("/artigo/$slug")({
  loader: async ({ params }) => {
    const { article: dbArticle } = await getPublishedArticle({ data: { slug: params.slug } });
    if (dbArticle) {
      return {
        article: {
          id: dbArticle.id,
          slug: dbArticle.slug,
          title: dbArticle.title,
          subtitle: dbArticle.subtitle ?? "",
          excerpt: dbArticle.excerpt ?? "",
          category: dbArticle.category,
          image: dbArticle.cover_image ?? "",
          author: "Analtino Santos",
          date: dbArticle.published_at
            ? new Date(dbArticle.published_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })
            : "",
          readTime: "5 min",
          content: dbArticle.content ?? "",
          blocks: (Array.isArray(dbArticle.blocks) ? dbArticle.blocks : []) as ContentBlock[],
        },

      };
    }
    return { article: null };
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.article
      ? [
          { title: `${loaderData.article!.title} — PCArt — Plataforma da Cultura Angolana` },
          { name: "description", content: loaderData.article!.excerpt },
          { property: "og:title", content: loaderData.article!.title },
          { property: "og:description", content: loaderData.article!.excerpt },
          { property: "og:image", content: loaderData.article!.image },
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
  const { article: dbArticle } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const { settings } = useSiteSettings();
  const fallback = settings.home.demo_articles.find((a) => a.slug === slug);
  const article = dbArticle
    ?? (fallback
      ? { id: "", ...fallback, subtitle: "", content: fallback.content ?? "", blocks: [] as ContentBlock[] }
      : null);


  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-32 text-center">
          <h1 className="font-display text-4xl">Matéria não encontrada</h1>
          <Link to="/" className="mt-6 inline-block text-primary">Voltar ao início</Link>
        </div>
        <SiteFooter />
      </div>
    );
  }
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const wa = `https://wa.me/?text=${encodeURIComponent(article.title + " — " + shareUrl)}`;
  const stored = normalizeBlocks(article.blocks);
  const blocks = stored.length ? stored : blocksFromLegacyContent(article.content ?? "");


  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article className="mx-auto max-w-3xl container-px py-12 md:py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Início
        </Link>

        <p className="mt-8 text-[11px] uppercase tracking-[0.3em] text-primary">{article.category}</p>
        <h1 className="mt-3 font-display text-4xl leading-tight md:text-6xl">{article.title}</h1>
        {article.subtitle && (
          <p className="mt-4 font-display text-xl leading-snug text-foreground/80">{article.subtitle}</p>
        )}
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

        {blocks.length ? (
          <div className="mt-10 space-y-6">
            {blocks.map((b, i) =>
              b.type === "text" ? (
                <div key={i} className="prose prose-invert max-w-none text-base leading-[1.85] text-foreground/90">
                  {b.text.split(/\n{2,}/).map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
              ) : b.type === "image" ? (
                <figure key={i}>
                  <img src={b.url} alt={b.caption || article.title} className="w-full rounded-2xl" loading="lazy" />
                  {b.caption && <figcaption className="mt-2 text-center text-xs text-muted-foreground">{b.caption}</figcaption>}
                </figure>
              ) : (
                <figure key={i}>
                  <video src={b.url} controls playsInline className="w-full rounded-2xl" />
                  {b.caption && <figcaption className="mt-2 text-center text-xs text-muted-foreground">{b.caption}</figcaption>}
                </figure>
              ),
            )}
          </div>
        ) : (
          <div className="prose prose-invert mt-10 max-w-none text-base leading-[1.85] text-foreground/90">
            <p>Conteúdo em preparação.</p>
          </div>
        )}


        {article.id && <ArticleEngagement articleId={article.id} />}
      </article>

      <SiteFooter />
    </div>
  );
}
