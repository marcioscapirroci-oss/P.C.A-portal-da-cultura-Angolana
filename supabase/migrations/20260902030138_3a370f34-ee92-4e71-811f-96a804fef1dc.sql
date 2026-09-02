CREATE TABLE public.galleries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  published boolean NOT NULL DEFAULT true,
  article_id uuid REFERENCES public.articles(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.galleries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.galleries TO authenticated;
GRANT ALL ON public.galleries TO service_role;

ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads published galleries" ON public.galleries
  FOR SELECT USING (published = true);
CREATE POLICY "Staff reads all galleries" ON public.galleries
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'jornalista'));
CREATE POLICY "Staff inserts galleries" ON public.galleries
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'jornalista'));
CREATE POLICY "Staff updates galleries" ON public.galleries
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'jornalista'));
CREATE POLICY "Staff deletes galleries" ON public.galleries
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'jornalista'));

CREATE TRIGGER galleries_set_updated_at BEFORE UPDATE ON public.galleries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  media_type text NOT NULL DEFAULT 'image',
  url text NOT NULL,
  storage_path text,
  thumbnail_url text,
  caption text,
  credit text,
  position integer NOT NULL DEFAULT 0,
  is_cover boolean NOT NULL DEFAULT false,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX gallery_items_gallery_idx ON public.gallery_items (gallery_id, position);

GRANT SELECT ON public.gallery_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
GRANT ALL ON public.gallery_items TO service_role;

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads items of published galleries" ON public.gallery_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.galleries g WHERE g.id = gallery_id AND g.published = true));
CREATE POLICY "Staff reads all gallery items" ON public.gallery_items
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'jornalista'));
CREATE POLICY "Staff inserts gallery items" ON public.gallery_items
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'jornalista'));
CREATE POLICY "Staff updates gallery items" ON public.gallery_items
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'jornalista'));
CREATE POLICY "Staff deletes gallery items" ON public.gallery_items
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'editor') OR has_role(auth.uid(),'jornalista'));

CREATE TRIGGER gallery_items_set_updated_at BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS gallery_id uuid REFERENCES public.galleries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_videos jsonb NOT NULL DEFAULT '[]'::jsonb;