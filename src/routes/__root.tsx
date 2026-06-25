import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Erro 404</p>
        <h1 className="mt-3 font-display text-5xl">Página não encontrada</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A matéria que procura pode ter sido movida ou já não existe.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-gold px-6 py-3 text-sm font-medium text-primary-foreground shadow-elegant transition hover:opacity-90"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl">Algo correu mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tente novamente ou regresse ao início.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Tentar de novo
          </button>
          <a href="/" className="rounded-full border border-border px-5 py-2.5 text-sm">Início</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Analtino Santos Media — Jornalismo, Cultura e Música de Angola" },
      { name: "description", content: "Portal digital do jornalista Analtino Santos: entrevistas, reportagens, música, cultura e cobertura de eventos em Angola." },
      { name: "author", content: "Analtino Santos" },
      { property: "og:title", content: "Analtino Santos Media — Jornalismo, Cultura e Música de Angola" },
      { property: "og:description", content: "Portal digital do jornalista Analtino Santos: entrevistas, reportagens, música, cultura e cobertura de eventos em Angola." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Analtino Santos Media — Jornalismo, Cultura e Música de Angola" },
      { name: "twitter:description", content: "Portal digital do jornalista Analtino Santos: entrevistas, reportagens, música, cultura e cobertura de eventos em Angola." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/e1e2b860-2631-4cce-919c-0feada56d7ac" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/e1e2b860-2631-4cce-919c-0feada56d7ac" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-AO">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
