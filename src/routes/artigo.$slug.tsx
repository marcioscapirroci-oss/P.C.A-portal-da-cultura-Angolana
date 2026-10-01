import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Share2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArticleEngagement } from "@/components/ArticleEngagement";
import { useSiteSettings } from "@/lib/site-settings";
import { getPublishedArticle } from "@/lib/public-articles.functions";
import { getGalleryByArticle, type GalleryRecord } from "@/lib/galleries.functions";
import { ArticleGallery } from "@/components/ArticleGallery";
import { blocksFromLegacyContent, normalizeBlocks, type ContentBlock } from "@/lib/article-blocks";


export const Route = createFileRoute("/artigo/$slug")({
  loader: async ({ params }) => {
    const { article: dbArticle } = await getPublishedArticle({ data: { slug: params.slug } });
    if (dbArticle) {
      const gallery = (dbArticle as any).gallery_id
        ? (await getGalleryByArticle({ data: { articleId: dbArticle.id } })).gallery
        : null;
      return {
        gallery: gallery as GalleryRecord | null,
        relatedVideos: (Array.isArray((dbArticle as any).related_videos) ? (dbArticle as any).related_videos : []) as { url: string; caption?: string }[],
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
    return { article: null, gallery: null, relatedVideos: [] as { url: string; caption?: string }[] };
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
  const { article: dbArticle, gallery, relatedVideos } = Route.useLoaderData();
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

      <article className="py-10 md:py-16">
        {/* Cabeçalho editorial */}
        <header className="mx-auto max-w-4xl container-px">
          <Link to="/" className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Início
          </Link>

          <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">{article.category}</p>
          <h1 className="mt-4 font-display text-4xl leading-[1.08] tracking-tight md:text-6xl">{article.title}</h1>
          {article.subtitle && (
            <p className="mt-5 font-display text-xl leading-snug text-foreground/75 md:text-2xl">{article.subtitle}</p>
          )}
          {article.excerpt && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y-2 border-foreground/90 py-4">
            <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Por <span className="font-semibold text-foreground">{article.author}</span>
              {article.date && <> · {article.date}</>}
              {article.readTime && <> · {article.readTime} de leitura</>}
            </p>
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-foreground px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] transition hover:bg-foreground hover:text-background"
            >
              <Share2 className="h-3.5 w-3.5" /> Partilhar
            </a>
          </div>
        </header>

        {/* Imagem de capa */}
        {article.image && (
          <figure className="mx-auto mt-10 max-w-5xl container-px">
            <img src={article.image} alt={article.title} className="w-full object-cover" />
          </figure>
        )}

        {/* Corpo da matéria */}
        <div className="mx-auto mt-12 max-w-2xl container-px md:mt-16">
          {blocks.length ? (
            <div className="space-y-10">
              {blocks.map((b, i) =>
                b.type === "text" ? (
                  <div key={i} className="space-y-6 text-[1.05rem] leading-[1.9] text-foreground/90">
                    {b.text.split(/\n{2,}/).map((p, j) => (
                      <p key={j} className={i === 0 && j === 0 ? "first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-6xl first-letter:leading-[0.85] first-letter:text-primary" : undefined}>
                        {p}
                      </p>
                    ))}
                  </div>
                ) : b.type === "image" ? (
                  <figure key={i} className="-mx-0 md:-mx-16">
                    <img src={b.url} alt={b.caption || article.title} className="w-full object-cover" loading="lazy" />
                    {b.caption && (
                      <figcaption className="mt-3 border-l-2 border-primary pl-3 text-xs leading-relaxed text-muted-foreground md:mx-16">
                        {b.caption}
                      </figcaption>
                    )}
                  </figure>
                ) : (
                  <figure key={i}>
                    <video src={b.url} controls playsInline preload="metadata" className="w-full bg-black" />
                    {b.caption && (
                      <figcaption className="mt-3 border-l-2 border-primary pl-3 text-xs leading-relaxed text-muted-foreground">
                        {b.caption}
                      </figcaption>
                    )}
                  </figure>
                ),
              )}
            </div>
          ) : (
            <p className="text-[1.05rem] leading-[1.9] text-foreground/90">Conteúdo em preparação.</p>
          )}
        </div>

        <div className="mx-auto mt-14 max-w-5xl container-px">
          <ArticleGallery gallery={gallery ?? null} relatedVideos={relatedVideos ?? []} />
        </div>

        {article.id && (
          <div className="mx-auto mt-10 max-w-2xl container-px">
            <ArticleEngagement articleId={article.id} />
          </div>
        )}
      </article>

      <SiteFooter />
    </div>
  );
}
