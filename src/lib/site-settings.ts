import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type NavItem = { label: string; to: string };
export type CategoryItem = { label: string; slug: string };

export type SiteSettings = {
  brand: string;
  tagline: string;
  full_name: string;
  header_kicker: string;
  description: string;
  footer_about: string;
  footer_tagline: string;
  footer_note: string;
  contact_city: string;
  contact_email: string;
  contact_phone: string;
  nav: NavItem[];
  categories: CategoryItem[];
};

export const DEFAULT_SETTINGS: SiteSettings = {
  brand: "PCArt",
  tagline: "Plataforma da Cultura Angolana",
  full_name: "PCArt — Plataforma da Cultura Angolana",
  header_kicker: "Cultura · Angola",
  description:
    "PCArt — Plataforma da Cultura Angolana: entrevistas, reportagens, música, cultura e cobertura de eventos em Angola.",
  footer_about:
    "Plataforma digital independente dedicada à informação cultural angolana — entrevistas, reportagens e cobertura dos eventos que movem a nossa música e a nossa sociedade.",
  footer_tagline: "Jornalismo · Cultura · Música",
  footer_note: "Feito com paixão em Luanda 🇦🇴",
  contact_city: "Luanda, Angola",
  contact_email: "contacto@pcart.ao",
  contact_phone: "+244 923 000 000",
  nav: [
    { label: "Início", to: "/" },
    { label: "Galeria", to: "/galeria" },
    { label: "Sobre", to: "/sobre" },
    { label: "Fale com o Jornalista", to: "/fale-com-jornalista" },
  ],
  categories: [
    { label: "Música", slug: "musica" },
    { label: "Cultura", slug: "cultura" },
    { label: "Entrevistas", slug: "entrevistas" },
    { label: "Notícias", slug: "noticias" },
    { label: "Eventos", slug: "eventos" },
    { label: "Celebridades", slug: "celebridades" },
    { label: "Sociedade", slug: "sociedade" },
  ],
};

export const siteSettingsQueryKey = ["site-settings"] as const;

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "site")
    .maybeSingle();
  if (error || !data) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...((data.value ?? {}) as Partial<SiteSettings>) };
}

export function useSiteSettings() {
  const q = useQuery({
    queryKey: siteSettingsQueryKey,
    queryFn: fetchSiteSettings,
    staleTime: 5 * 60_000,
  });
  return { settings: q.data ?? DEFAULT_SETTINGS, isLoading: q.isLoading };
}

export function useUpdateSiteSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (value: SiteSettings) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "site", value: value as unknown as never }, { onConflict: "key" });
      if (error) throw new Error(error.message);
      return value;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: siteSettingsQueryKey }),
  });
}
