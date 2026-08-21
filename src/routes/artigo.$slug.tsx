import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Share2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArticleEngagement } from "@/components/ArticleEngagement";
import { useSiteSettings } from "@/lib/site-settings";
import { getPublishedArticle } from "@/lib/public-articles.functions";

export const Route = createFileRoute("/artigo/$slug")({
  loader: async ({ params }) => {
    const { article: dbArticle } = await getPublishedArticle({ data: { slug: params.slug } });
    if (dbArticle) {
      return {
        article: {
          id: dbArticle.id,
          slug: dbArticle.slug,
          title: dbArticle.title,
          excerpt: dbArticle.excerpt ?? "",
          category: dbArticle.category,
          image: dbArticle.cover_image ?? "",
          author: "Analtino Santos",
          date: dbArticle.published_at
            ? new Date(dbArticle.published_at).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })
            : "",
          readTime: "5 min",
          content: dbArticle.content ?? "",
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

// Minimal, safe renderer for markdown images + <video> tags + paragraphs.
// Strips any other HTML to avoid XSS.
function renderContent(raw: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const blocks: string[] = [];
  // Tokenize by media markers
  const re = /(!\[[^\]]*\]\(([^)\s]+)\))|(<video\s+src="([^"]+)"[^>]*><\/video>)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) blocks.push(textBlock(raw.slice(last, m.index)));
    if (m[2]) {
      blocks.push(`<img src="${escape(m[2])}" alt="" class="my-6 w-full rounded-2xl" loading="lazy" />`);
    } else if (m[4]) {
      blocks.push(
        `<video src="${escape(m[4])}" controls playsinline class="my-6 w-full rounded-2xl"></video>`,
      );
    }
    last = re.lastIndex;
  }
  if (last < raw.length) blocks.push(textBlock(raw.slice(last)));
  return blocks.join("\n");

  function textBlock(t: string): string {
    const paras = escape(t).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    return paras.map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("");
  }
}

function ArticlePage() {
  const { article: dbArticle } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const { settings } = useSiteSettings();
  const fallback = settings.home.demo_articles.find((a) => a.slug === slug);
  const article = dbArticle ?? (fallback ? { id: "", ...fallback, content: fallback.content ?? "" } : null);

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
  const html = article.content ? renderContent(article.content) : "";

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

        {html ? (
          <div
            className="prose prose-invert mt-10 max-w-none text-base leading-[1.85] text-foreground/90"
            dangerouslySetInnerHTML={{ __html: html }}
          />
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
