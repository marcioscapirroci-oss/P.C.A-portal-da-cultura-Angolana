CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Staff insert site settings" ON public.site_settings
  FOR INSERT TO authenticated WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'jornalista'::app_role)
  );

CREATE POLICY "Staff update site settings" ON public.site_settings
  FOR UPDATE TO authenticated USING (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'jornalista'::app_role)
  ) WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'jornalista'::app_role)
  );

CREATE TRIGGER site_settings_set_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_settings (key, value) VALUES ('site', jsonb_build_object(
  'brand', 'PCArt',
  'tagline', 'Plataforma da Cultura Angolana',
  'full_name', 'PCArt — Plataforma da Cultura Angolana',
  'header_kicker', 'Cultura · Angola',
  'description', 'PCArt — Plataforma da Cultura Angolana: entrevistas, reportagens, música, cultura e cobertura de eventos em Angola.',
  'footer_about', 'Plataforma digital independente dedicada à informação cultural angolana — entrevistas, reportagens e cobertura dos eventos que movem a nossa música e a nossa sociedade.',
  'footer_tagline', 'Jornalismo · Cultura · Música',
  'footer_note', 'Feito com paixão em Luanda 🇦🇴',
  'contact_city', 'Luanda, Angola',
  'contact_email', 'contacto@pcart.ao',
  'contact_phone', '+244 923 000 000',
  'nav', jsonb_build_array(
    jsonb_build_object('label','Início','to','/'),
    jsonb_build_object('label','Galeria','to','/galeria'),
    jsonb_build_object('label','Sobre','to','/sobre'),
    jsonb_build_object('label','Fale com o Jornalista','to','/fale-com-jornalista')
  ),
  'categories', jsonb_build_array(
    jsonb_build_object('label','Música','slug','musica'),
    jsonb_build_object('label','Cultura','slug','cultura'),
    jsonb_build_object('label','Entrevistas','slug','entrevistas'),
    jsonb_build_object('label','Notícias','slug','noticias'),
    jsonb_build_object('label','Eventos','slug','eventos'),
    jsonb_build_object('label','Celebridades','slug','celebridades'),
    jsonb_build_object('label','Sociedade','slug','sociedade')
  )
));