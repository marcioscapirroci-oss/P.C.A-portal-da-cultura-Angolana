import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MediaPicker } from "@/components/MediaPicker";
import {
  useSiteSettings,
  useUpdateSiteSettings,
  type AboutSettings,
  type HomeSettings,
  type SiteSettings,
} from "@/lib/site-settings";

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-current" />
      <span className="text-muted-foreground">{label}</span>
    </label>
  );
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="" className="h-14 w-20 rounded-lg border border-border object-cover" />
        ) : (
          <div className="grid h-14 w-20 place-items-center rounded-lg border border-dashed border-border text-[10px] text-muted-foreground">
            sem imagem
          </div>
        )}
        <button type="button" onClick={() => setOpen(true)} className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary">
          Escolher / enviar
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
            Remover
          </button>
        )}
      </div>
      {open && (
        <MediaPicker
          accept="image/*"
          onClose={() => setOpen(false)}
          onSelect={(a) => {
            onChange(a.url);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");


export function SiteSettingsPanel() {
  const { settings, isLoading } = useSiteSettings();
  const update = useUpdateSiteSettings();
  const [form, setForm] = useState<SiteSettings>(settings);

  useEffect(() => {
    if (!isLoading) setForm(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  function set<K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const home = form.home;
  function setHome<K extends keyof HomeSettings>(k: K, v: HomeSettings[K]) {
    setForm((f) => ({ ...f, home: { ...f.home, [k]: v } }));
  }

  const about = form.about;
  function setAbout<K extends keyof AboutSettings>(k: K, v: AboutSettings[K]) {
    setForm((f) => ({ ...f, about: { ...f.about, [k]: v } }));
  }


  function submit(e: React.FormEvent) {
    e.preventDefault();
    update.mutate(form, {
      onSuccess: () => toast.success("Definições guardadas"),
      onError: (err: Error) => toast.error(err.message),
    });
  }

  if (isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8 rounded-2xl border border-border/60 bg-card/30 p-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Marca"><input value={form.brand} onChange={(e) => set("brand", e.target.value)} className={inputClass} /></Field>
        <Field label="Assinatura"><input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputClass} /></Field>
        <Field label="Nome oficial"><input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className={inputClass} /></Field>
        <Field label="Legenda do cabeçalho"><input value={form.header_kicker} onChange={(e) => set("header_kicker", e.target.value)} className={inputClass} /></Field>
        <div className="sm:col-span-2">
          <Field label="Descrição da plataforma">
            <textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
          </Field>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Texto do rodapé">
            <textarea rows={3} value={form.footer_about} onChange={(e) => set("footer_about", e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="Áreas do rodapé"><input value={form.footer_tagline} onChange={(e) => set("footer_tagline", e.target.value)} className={inputClass} /></Field>
        <Field label="Nota final"><input value={form.footer_note} onChange={(e) => set("footer_note", e.target.value)} className={inputClass} /></Field>
        <Field label="Cidade"><input value={form.contact_city} onChange={(e) => set("contact_city", e.target.value)} className={inputClass} /></Field>
        <Field label="E-mail"><input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} className={inputClass} /></Field>
        <Field label="Telefone"><input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} className={inputClass} /></Field>
      </section>

      <section>
        <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Menu principal</p>
        <div className="space-y-2">
          {form.nav.map((n, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <input
                value={n.label}
                placeholder="Etiqueta"
                onChange={(e) => set("nav", form.nav.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                className={inputClass}
              />
              <input
                value={n.to}
                placeholder="/caminho"
                onChange={(e) => set("nav", form.nav.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)))}
                className={inputClass}
              />
              <button type="button" onClick={() => set("nav", form.nav.filter((_, j) => j !== i))} className="rounded-xl border border-border px-3">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => set("nav", [...form.nav, { label: "", to: "/" }])} className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
          <Plus className="h-3.5 w-3.5" /> Adicionar item
        </button>
      </section>

      <section>
        <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Categorias</p>
        <div className="space-y-2">
          {form.categories.map((c, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <input
                value={c.label}
                placeholder="Nome"
                onChange={(e) =>
                  set(
                    "categories",
                    form.categories.map((x, j) =>
                      j === i ? { label: e.target.value, slug: x.slug || slugify(e.target.value) } : x,
                    ),
                  )
                }
                className={inputClass}
              />
              <input
                value={c.slug}
                placeholder="url"
                onChange={(e) => set("categories", form.categories.map((x, j) => (j === i ? { ...x, slug: slugify(e.target.value) } : x)))}
                className={inputClass}
              />
              <button type="button" onClick={() => set("categories", form.categories.filter((_, j) => j !== i))} className="rounded-xl border border-border px-3">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => set("categories", [...form.categories, { label: "", slug: "" }])} className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
          <Plus className="h-3.5 w-3.5" /> Adicionar categoria
        </button>
      </section>

      <section className="space-y-6 rounded-2xl border border-border/60 p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Página inicial — banner</p>
        <ImageField label="Imagem do banner" value={home.hero_image} onChange={(v) => setHome("hero_image", v)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Etiqueta (opcional)"><input value={home.hero_kicker} onChange={(e) => setHome("hero_kicker", e.target.value)} className={inputClass} /></Field>
          <Field label="Título (vazio = matéria em destaque)"><input value={home.hero_title} onChange={(e) => setHome("hero_title", e.target.value)} className={inputClass} /></Field>
          <div className="sm:col-span-2">
            <Field label="Texto do banner"><textarea rows={2} value={home.hero_subtitle} onChange={(e) => setHome("hero_subtitle", e.target.value)} className={inputClass} /></Field>
          </div>
          <Field label="Texto do botão"><input value={home.hero_cta_label} onChange={(e) => setHome("hero_cta_label", e.target.value)} className={inputClass} placeholder="Ler matéria" /></Field>
          <Field label="Link do botão (opcional)"><input value={home.hero_cta_to} onChange={(e) => setHome("hero_cta_to", e.target.value)} className={inputClass} placeholder="/galeria" /></Field>
        </div>

        <p className="text-xs uppercase tracking-wider text-muted-foreground">Secções visíveis</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Toggle label="Conteúdo de demonstração" checked={home.show_demo_articles} onChange={(v) => setHome("show_demo_articles", v)} />
          <Toggle label="Últimas publicações" checked={home.show_latest} onChange={(v) => setHome("show_latest", v)} />
          <Toggle label="Entrevistas" checked={home.show_interviews} onChange={(v) => setHome("show_interviews", v)} />
          <Toggle label="Artistas" checked={home.show_artists} onChange={(v) => setHome("show_artists", v)} />
          <Toggle label="Vídeos" checked={home.show_videos} onChange={(v) => setHome("show_videos", v)} />
          <Toggle label="Eventos" checked={home.show_events} onChange={(v) => setHome("show_events", v)} />
          <Toggle label="Publicidade" checked={home.show_ad} onChange={(v) => setHome("show_ad", v)} />
          <Toggle label="Bloco do jornalista" checked={home.show_journalist} onChange={(v) => setHome("show_journalist", v)} />
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Artistas em destaque</p>
          <div className="space-y-4">
            {home.artists.map((a, i) => (
              <div key={i} className="space-y-3 rounded-xl border border-border/60 p-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  <input value={a.name} placeholder="Nome" onChange={(e) => setHome("artists", home.artists.map((x, j) => (j === i ? { ...x, name: e.target.value, slug: x.slug || slugify(e.target.value) } : x)))} className={inputClass} />
                  <input value={a.genre} placeholder="Género" onChange={(e) => setHome("artists", home.artists.map((x, j) => (j === i ? { ...x, genre: e.target.value } : x)))} className={inputClass} />
                  <input value={a.slug} placeholder="url" onChange={(e) => setHome("artists", home.artists.map((x, j) => (j === i ? { ...x, slug: slugify(e.target.value) } : x)))} className={inputClass} />
                </div>
                <textarea rows={2} value={a.bio ?? ""} placeholder="Biografia" onChange={(e) => setHome("artists", home.artists.map((x, j) => (j === i ? { ...x, bio: e.target.value } : x)))} className={inputClass} />
                <ImageField label="Fotografia" value={a.image} onChange={(v) => setHome("artists", home.artists.map((x, j) => (j === i ? { ...x, image: v } : x)))} />
                <button type="button" onClick={() => setHome("artists", home.artists.filter((_, j) => j !== i))} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <Trash2 className="h-3.5 w-3.5" /> Remover artista
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setHome("artists", [...home.artists, { name: "", genre: "", slug: "", image: "", bio: "" }])} className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
            <Plus className="h-3.5 w-3.5" /> Adicionar artista
          </button>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Vídeos</p>
          <div className="space-y-4">
            {home.videos.map((v, i) => (
              <div key={i} className="space-y-3 rounded-xl border border-border/60 p-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input value={v.title} placeholder="Título" onChange={(e) => setHome("videos", home.videos.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} className={inputClass} />
                  <input value={v.duration} placeholder="Duração (ex: 08:12)" onChange={(e) => setHome("videos", home.videos.map((x, j) => (j === i ? { ...x, duration: e.target.value } : x)))} className={inputClass} />
                </div>
                <ImageField label="Miniatura" value={v.thumb} onChange={(url) => setHome("videos", home.videos.map((x, j) => (j === i ? { ...x, thumb: url } : x)))} />
                <button type="button" onClick={() => setHome("videos", home.videos.filter((_, j) => j !== i))} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <Trash2 className="h-3.5 w-3.5" /> Remover vídeo
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setHome("videos", [...home.videos, { title: "", duration: "", thumb: "" }])} className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
            <Plus className="h-3.5 w-3.5" /> Adicionar vídeo
          </button>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Agenda de eventos</p>
          <div className="space-y-2">
            {home.events.map((ev, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                <input value={ev.date} placeholder="12 Mar" onChange={(e) => setHome("events", home.events.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} className={inputClass} />
                <input value={ev.title} placeholder="Título" onChange={(e) => setHome("events", home.events.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} className={inputClass} />
                <input value={ev.city} placeholder="Cidade" onChange={(e) => setHome("events", home.events.map((x, j) => (j === i ? { ...x, city: e.target.value } : x)))} className={inputClass} />
                <button type="button" onClick={() => setHome("events", home.events.filter((_, j) => j !== i))} className="rounded-xl border border-border px-3">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setHome("events", [...home.events, { date: "", title: "", city: "" }])} className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
            <Plus className="h-3.5 w-3.5" /> Adicionar evento
          </button>
        </div>


        <div>
          <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Matérias do portal (conteúdo editorial fixo)</p>
          <div className="space-y-4">
            {home.demo_articles.map((a, i) => (
              <div key={i} className="space-y-3 rounded-xl border border-border/60 p-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input value={a.title} placeholder="Título" onChange={(e) => setHome("demo_articles", home.demo_articles.map((x, j) => (j === i ? { ...x, title: e.target.value, slug: x.slug || slugify(e.target.value) } : x)))} className={inputClass} />
                  <input value={a.slug} placeholder="url" onChange={(e) => setHome("demo_articles", home.demo_articles.map((x, j) => (j === i ? { ...x, slug: slugify(e.target.value) } : x)))} className={inputClass} />
                  <input value={a.category} placeholder="Categoria" onChange={(e) => setHome("demo_articles", home.demo_articles.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)))} className={inputClass} />
                  <input value={a.author} placeholder="Autor" onChange={(e) => setHome("demo_articles", home.demo_articles.map((x, j) => (j === i ? { ...x, author: e.target.value } : x)))} className={inputClass} />
                  <input value={a.date} placeholder="12 Mar 2025" onChange={(e) => setHome("demo_articles", home.demo_articles.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} className={inputClass} />
                  <input value={a.readTime} placeholder="6 min" onChange={(e) => setHome("demo_articles", home.demo_articles.map((x, j) => (j === i ? { ...x, readTime: e.target.value } : x)))} className={inputClass} />
                </div>
                <textarea rows={2} value={a.excerpt} placeholder="Resumo" onChange={(e) => setHome("demo_articles", home.demo_articles.map((x, j) => (j === i ? { ...x, excerpt: e.target.value } : x)))} className={inputClass} />
                <textarea rows={4} value={a.content ?? ""} placeholder="Texto da matéria" onChange={(e) => setHome("demo_articles", home.demo_articles.map((x, j) => (j === i ? { ...x, content: e.target.value } : x)))} className={inputClass} />
                <ImageField label="Fotografia" value={a.image} onChange={(v) => setHome("demo_articles", home.demo_articles.map((x, j) => (j === i ? { ...x, image: v } : x)))} />
                <button type="button" onClick={() => setHome("demo_articles", home.demo_articles.filter((_, j) => j !== i))} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <Trash2 className="h-3.5 w-3.5" /> Remover matéria
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setHome("demo_articles", [...home.demo_articles, { slug: "", title: "", excerpt: "", category: "", image: "", author: "", date: "", readTime: "", content: "" }])} className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
            <Plus className="h-3.5 w-3.5" /> Adicionar matéria
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <p className="sm:col-span-2 text-xs uppercase tracking-wider text-muted-foreground">Bloco do jornalista</p>
          <Field label="Nome"><input value={home.journalist_name} onChange={(e) => setHome("journalist_name", e.target.value)} className={inputClass} /></Field>
          <Field label="Função"><input value={home.journalist_role} onChange={(e) => setHome("journalist_role", e.target.value)} className={inputClass} /></Field>
          <div className="sm:col-span-2">
            <Field label="Biografia"><textarea rows={4} value={home.journalist_bio} onChange={(e) => setHome("journalist_bio", e.target.value)} className={inputClass} /></Field>
          </div>
          <div className="sm:col-span-2">
            <ImageField label="Fotografia do jornalista" value={home.journalist_photo} onChange={(v) => setHome("journalist_photo", v)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <p className="sm:col-span-2 text-xs uppercase tracking-wider text-muted-foreground">Bloco de publicidade</p>
          <Field label="Etiqueta"><input value={home.ad_kicker} onChange={(e) => setHome("ad_kicker", e.target.value)} className={inputClass} /></Field>
          <Field label="Título"><input value={home.ad_title} onChange={(e) => setHome("ad_title", e.target.value)} className={inputClass} /></Field>
          <div className="sm:col-span-2">
            <Field label="Texto"><textarea rows={2} value={home.ad_text} onChange={(e) => setHome("ad_text", e.target.value)} className={inputClass} /></Field>
          </div>
          <Field label="E-mail de contacto"><input value={home.ad_email} onChange={(e) => setHome("ad_email", e.target.value)} className={inputClass} /></Field>
        </div>
      </section>



      <section className="space-y-6 rounded-2xl border border-border/60 p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Página “Sobre”</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Etiqueta"><input value={about.kicker} onChange={(e) => setAbout("kicker", e.target.value)} className={inputClass} /></Field>
          <Field label="Nome"><input value={about.name} onChange={(e) => setAbout("name", e.target.value)} className={inputClass} /></Field>
          <Field label="Função"><input value={about.role} onChange={(e) => setAbout("role", e.target.value)} className={inputClass} /></Field>
          <div className="sm:col-span-2">
            <Field label="Biografia"><textarea rows={4} value={about.bio} onChange={(e) => setAbout("bio", e.target.value)} className={inputClass} /></Field>
          </div>
          <div className="sm:col-span-2">
            <ImageField label="Retrato" value={about.portrait} onChange={(v) => setAbout("portrait", v)} />
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Números em destaque</p>
          <div className="space-y-2">
            {about.stats.map((st, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <input value={st.value} placeholder="1.2k+" onChange={(e) => setAbout("stats", about.stats.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} className={inputClass} />
                <input value={st.label} placeholder="Matérias" onChange={(e) => setAbout("stats", about.stats.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className={inputClass} />
                <button type="button" onClick={() => setAbout("stats", about.stats.filter((_, j) => j !== i))} className="rounded-xl border border-border px-3">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setAbout("stats", [...about.stats, { value: "", label: "" }])} className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
            <Plus className="h-3.5 w-3.5" /> Adicionar número
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Etiqueta da galeria"><input value={about.gallery_kicker} onChange={(e) => setAbout("gallery_kicker", e.target.value)} className={inputClass} /></Field>
          <Field label="Título da galeria"><input value={about.gallery_title} onChange={(e) => setAbout("gallery_title", e.target.value)} className={inputClass} /></Field>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Fotografias da galeria</p>
          <div className="space-y-3">
            {about.gallery.map((src, i) => (
              <div key={i} className="flex items-end justify-between gap-3 rounded-xl border border-border/60 p-3">
                <ImageField label={`Imagem ${i + 1}`} value={src} onChange={(v) => setAbout("gallery", about.gallery.map((x, j) => (j === i ? v : x)))} />
                <button type="button" onClick={() => setAbout("gallery", about.gallery.filter((_, j) => j !== i))} className="rounded-xl border border-border px-3 py-2">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setAbout("gallery", [...about.gallery, ""])} className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
            <Plus className="h-3.5 w-3.5" /> Adicionar fotografia
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título do contacto"><input value={about.contact_title} onChange={(e) => setAbout("contact_title", e.target.value)} className={inputClass} /></Field>
          <Field label="E-mail"><input value={about.contact_email} onChange={(e) => setAbout("contact_email", e.target.value)} className={inputClass} /></Field>
          <div className="sm:col-span-2">
            <Field label="Texto do contacto"><textarea rows={2} value={about.contact_text} onChange={(e) => setAbout("contact_text", e.target.value)} className={inputClass} /></Field>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={update.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar definições
        </button>
      </div>
    </form>
  );
}
