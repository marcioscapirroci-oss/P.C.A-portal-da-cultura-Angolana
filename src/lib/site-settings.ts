import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ARTICLES, ARTISTS, EVENTS, JOURNALIST, VIDEOS } from "@/lib/content";

export type NavItem = { label: string; to: string };
export type CategoryItem = { label: string; slug: string };

export type ArtistItem = { name: string; genre: string; slug: string; image: string };
export type VideoItem = { title: string; duration: string; thumb: string };
export type EventItem = { date: string; title: string; city: string };
export type ArticleItem = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  author: string;
  date: string;
  readTime: string;
  content?: string;
};
export type StatItem = { value: string; label: string };

export type AboutSettings = {
  kicker: string;
  name: string;
  role: string;
  bio: string;
  portrait: string;
  stats: StatItem[];
  gallery_kicker: string;
  gallery_title: string;
  gallery: string[];
  contact_title: string;
  contact_text: string;
  contact_email: string;
};

export type HomeSettings = {
  hero_image: string;
  hero_kicker: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta_label: string;
  hero_cta_to: string;
  show_demo_articles: boolean;
  show_latest: boolean;
  show_interviews: boolean;
  show_artists: boolean;
  show_videos: boolean;
  show_events: boolean;
  show_ad: boolean;
  show_journalist: boolean;
  artists: ArtistItem[];
  videos: VideoItem[];
  events: EventItem[];
  demo_articles: ArticleItem[];
  journalist_name: string;
  journalist_role: string;
  journalist_bio: string;
  journalist_photo: string;
  ad_kicker: string;
  ad_title: string;
  ad_text: string;
  ad_email: string;
};

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
  home: HomeSettings;
  about: AboutSettings;
};

export const DEFAULT_ABOUT: AboutSettings = {
  kicker: "Perfil",
  name: JOURNALIST.name,
  role: JOURNALIST.role,
  bio: JOURNALIST.bio,
  portrait: JOURNALIST.photos.portrait,
  stats: [
    { value: "1.2k+", label: "Matérias" },
    { value: "300+", label: "Entrevistas" },
    { value: "12", label: "Distinções" },
  ],
  gallery_kicker: "Galeria",
  gallery_title: "Momentos de uma carreira",
  gallery: [JOURNALIST.photos.group, JOURNALIST.photos.interview, JOURNALIST.photos.award],
  contact_title: "Quer propor uma entrevista ou cobertura?",
  contact_text: "Envie a sua proposta e a equipa entrará em contacto.",
  contact_email: "contacto@analtinosantos.ao",
};

export const DEFAULT_HOME: HomeSettings = {
  hero_image: "",
  hero_kicker: "",
  hero_title: "",
  hero_subtitle: "",
  hero_cta_label: "",
  hero_cta_to: "",
  show_demo_articles: true,
  show_latest: true,
  show_interviews: true,
  show_artists: true,
  show_videos: true,
  show_events: true,
  show_ad: true,
  show_journalist: true,
  artists: ARTISTS.map((a) => ({ name: a.name, genre: a.genre, slug: a.slug, image: a.image })),
  videos: VIDEOS.map((v) => ({ title: v.title, duration: v.duration, thumb: v.thumb })),
  events: EVENTS.map((e) => ({ date: e.date, title: e.title, city: e.city })),
  demo_articles: ARTICLES.map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category,
    image: a.image,
    author: a.author,
    date: a.date,
    readTime: a.readTime,
    content: "",
  })),
  journalist_name: JOURNALIST.name,
  journalist_role: JOURNALIST.role,
  journalist_bio: JOURNALIST.bio,
  journalist_photo: JOURNALIST.photos.award,
  ad_kicker: "Parcerias & publicidade",
  ad_title: "Anuncie no portal de referência da cultura angolana",
  ad_text:
    "Espaços premium para marcas que querem comunicar com o público cultural mais qualificado de Angola.",
  ad_email: "contacto@pcart.ao",
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
  home: DEFAULT_HOME,
  about: DEFAULT_ABOUT,
};


export const siteSettingsQueryKey = ["site-settings"] as const;

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "site")
    .maybeSingle();
  if (error || !data) return DEFAULT_SETTINGS;
  const raw = (data.value ?? {}) as Partial<SiteSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    home: { ...DEFAULT_HOME, ...((raw.home ?? {}) as Partial<HomeSettings>) },
    about: { ...DEFAULT_ABOUT, ...((raw.about ?? {}) as Partial<AboutSettings>) },
  };

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
