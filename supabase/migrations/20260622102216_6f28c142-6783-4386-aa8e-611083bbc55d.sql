
-- Storage policies for media bucket
CREATE POLICY "Public can read media" ON storage.objects FOR SELECT TO public USING (bucket_id = 'media');
CREATE POLICY "Staff can upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')));
CREATE POLICY "Staff can update media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')));
CREATE POLICY "Staff can delete media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')));
