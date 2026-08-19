import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { MediaPicker } from "@/components/MediaPicker";
import {
  deleteArticle,
  getAdminStats,
  getMyRoles,
  listArticlesAdmin,
  upsertArticle,
} from "@/lib/admin.functions";
import { SiteSettingsPanel } from "@/components/SiteSettingsPanel";
import { useSiteSettings } from "@/lib/site-settings";
import { BarChart3, Eye, FileText, LogOut, Plus, Trash2, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Painel · PCArt — Plataforma da Cultura Angolana" }] }),
  component: AdminPage,
});

type Article = {
  id: string; slug: string; title: string; category: string;
  status: "draft" | "scheduled" | "published";
  published_at: string | null; views: number; updated_at: string;
};

function AdminPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const fetchRoles = useServerFn(getMyRoles);
  const fetchList = useServerFn(listArticlesAdmin);
  const fetchStats = useServerFn(getAdminStats);
  const saveFn = useServerFn(upsertArticle);
  const removeFn = useServerFn(deleteArticle);
  const [editing, setEditing] = useState<Partial<Article> | null>(null);
  const [tab, setTab] = useState<"materias" | "definicoes">("materias");

  const rolesQ = useQuery({ queryKey: ["my-roles"], queryFn: () => fetchRoles() });
  const isStaff = rolesQ.data?.roles?.some((r) => r === "jornalista" || r === "admin" || r === "super_admin" || r === "editor");

  const listQ = useQuery({
    queryKey: ["admin-articles"],
    queryFn: () => fetchList(),
    enabled: !!isStaff,
  });
  const statsQ = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchStats(),
    enabled: !!isStaff,
  });

  const save = useMutation({
    mutationFn: (data: any) => saveFn({ data }),
    onSuccess: () => {
      toast.success("Matéria guardada");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Removida");
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleLogout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  useEffect(() => {
    // refresh on auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.invalidate();
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  if (rolesQ.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-xl container-px py-20 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 font-display text-3xl">Acesso restrito a jornalistas</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            A sua conta está autenticada, mas não tem o papel de <span className="text-primary">jornalista</span>.
            O painel administrativo é exclusivo da equipa editorial. Se acredita que isto é um erro, contacte o administrador da plataforma.
          </p>
          <button onClick={handleLogout} className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl container-px py-10">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Painel editorial</p>
            <h1 className="mt-1 font-display text-3xl md:text-4xl">Gestão de matérias</h1>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setEditing({ status: "draft", category: "Notícias" })}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant"
            >
              <Plus className="h-4 w-4" /> Nova matéria
            </button>
            <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard icon={FileText} label="Total" value={statsQ.data?.total ?? 0} />
          <StatCard icon={BarChart3} label="Publicadas" value={statsQ.data?.published ?? 0} />
          <StatCard icon={Eye} label="Visitas (top 5)" value={statsQ.data?.totalViews ?? 0} />
        </div>

        {/* LIST */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-border/60 bg-card/30">
          {listQ.isLoading ? (
            <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : (listQ.data?.articles ?? []).length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">
              Ainda sem matérias. Carregue em <span className="text-primary">“Nova matéria”</span> para começar.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {(listQ.data?.articles as Article[]).map((a) => (
                <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{a.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <StatusPill status={a.status} />
                      <span>{a.category}</span>
                      <span>· {a.views} visitas</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => setEditing(a)} className="rounded-full border border-border px-3 py-1.5 text-xs">Editar</button>
                    <button
                      onClick={() => confirm(`Remover “${a.title}”?`) && remove.mutate(a.id)}
                      className="rounded-full border border-destructive/50 px-3 py-1.5 text-xs text-destructive-foreground/90 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {editing && <EditorModal initial={editing} onClose={() => setEditing(null)} onSave={(d) => save.mutate(d)} saving={save.isPending} />}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 font-display text-3xl">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: Article["status"] }) {
  const map = {
    draft: { l: "Rascunho", c: "bg-muted text-muted-foreground" },
    scheduled: { l: "Agendada", c: "bg-accent/20 text-accent-foreground" },
    published: { l: "Publicada", c: "bg-primary/20 text-primary" },
  }[status];
  return <span className={`rounded-full px-2 py-0.5 ${map.c}`}>{map.l}</span>;
}

function EditorModal({
  initial, onClose, onSave, saving,
}: {
  initial: Partial<Article>;
  onClose: () => void;
  onSave: (data: any) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<any>({
    id: initial.id,
    title: initial.title ?? "",
    slug: initial.slug ?? "",
    excerpt: (initial as any).excerpt ?? "",
    content: (initial as any).content ?? "",
    category: initial.category ?? "Notícias",
    cover_image: (initial as any).cover_image ?? "",
    status: initial.status ?? "draft",
    published_at: initial.published_at ?? null,
  });
  const [picker, setPicker] = useState<null | "cover" | "content">(null);

  function set<K extends string>(k: K, v: any) {
    setForm((f: any) => ({ ...f, [k]: v }));
  }

  function insertIntoContent(asset: { url: string; mimeType: string }) {
    const snippet = asset.mimeType.startsWith("video/")
      ? `\n\n<video src="${asset.url}" controls playsinline style="width:100%;border-radius:14px"></video>\n\n`
      : `\n\n![](${asset.url})\n\n`;
    set("content", (form.content ?? "") + snippet);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      ...form,
      excerpt: form.excerpt || null,
      content: form.content || null,
      cover_image: form.cover_image || null,
      published_at: form.published_at || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur sm:items-center" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-border bg-card p-6 shadow-elegant sm:rounded-3xl"
      >
        <h2 className="font-display text-2xl">{form.id ? "Editar matéria" : "Nova matéria"}</h2>

        <div className="mt-6 space-y-4">
          <Field label="Título"><input required maxLength={200} value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass} /></Field>
          <Field label="Slug (url)"><input required pattern="[a-z0-9-]+" value={form.slug} onChange={(e) => set("slug", e.target.value)} className={inputClass} placeholder="ex: entrevista-bonga" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoria">
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputClass}>
                {["Música","Cultura","Entrevistas","Notícias","Eventos","Celebridades","Sociedade"].map(c=>(<option key={c}>{c}</option>))}
              </select>
            </Field>
            <Field label="Estado">
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputClass}>
                <option value="draft">Rascunho</option>
                <option value="scheduled">Agendar</option>
                <option value="published">Publicar</option>
              </select>
            </Field>
          </div>
          {(form.status === "scheduled" || form.status === "published") && (
            <Field label="Data de publicação">
              <input
                type="datetime-local"
                value={form.published_at ? new Date(form.published_at).toISOString().slice(0,16) : ""}
                onChange={(e) => set("published_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                className={inputClass}
              />
            </Field>
          )}

          <Field label="Imagem de capa">
            <div className="flex items-center gap-3">
              <div className="h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-border bg-background">
                {form.cover_image ? (
                  <img src={form.cover_image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[10px] text-muted-foreground">sem capa</div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => setPicker("cover")} className="rounded-full bg-gradient-gold px-4 py-2 text-xs font-medium text-primary-foreground">
                  Carregar / escolher
                </button>
                {form.cover_image && (
                  <button type="button" onClick={() => set("cover_image", "")} className="text-[11px] text-muted-foreground hover:text-foreground">
                    Remover
                  </button>
                )}
              </div>
            </div>
          </Field>

          <Field label="Resumo"><textarea rows={2} maxLength={500} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} className={inputClass} /></Field>

          <div>
            <div className="mb-1 flex items-end justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Conteúdo</span>
              <button type="button" onClick={() => setPicker("content")} className="text-[11px] text-primary hover:underline">
                + Inserir imagem ou vídeo
              </button>
            </div>
            <textarea
              rows={10}
              maxLength={50000}
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              className={inputClass}
              placeholder="Escreva a matéria. Pode inserir imagens e vídeos pelo botão acima."
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Suporta markdown <code>![](url)</code> e tags <code>&lt;video&gt;</code>.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancelar</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
          </button>
        </div>
      </form>

      {picker && (
        <MediaPicker
          accept={picker === "cover" ? "image/*" : "image/*,video/*"}
          onClose={() => setPicker(null)}
          onSelect={(a) => {
            if (picker === "cover") set("cover_image", a.url);
            else insertIntoContent(a);
            setPicker(null);
          }}
        />
      )}
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
