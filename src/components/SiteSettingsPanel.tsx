import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useSiteSettings,
  useUpdateSiteSettings,
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
