import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { ARTICLES, ARTISTS } from "@/lib/content";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/sobre", changefreq: "monthly", priority: "0.8" },
          ...["musica", "cultura", "entrevistas", "noticias", "eventos", "celebridades", "sociedade"].map(
            (s) => ({ path: `/categoria/${s}`, changefreq: "weekly", priority: "0.7" })
          ),
          ...ARTISTS.map((a) => ({ path: `/artista/${a.slug}`, changefreq: "monthly", priority: "0.6" })),
          ...ARTICLES.map((a) => ({ path: `/artigo/${a.slug}`, changefreq: "weekly", priority: "0.7" })),
        ];

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...entries.map((e) =>
            `  <url><loc>${BASE_URL}${e.path}</loc><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`
          ),
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
