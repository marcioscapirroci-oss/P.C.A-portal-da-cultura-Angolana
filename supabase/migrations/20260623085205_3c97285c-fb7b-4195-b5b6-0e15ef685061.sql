
CREATE OR REPLACE FUNCTION public.is_reply_to_my_message(_reply_to uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.messages
    WHERE id = _reply_to AND sender_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Reader reads replies to own messages" ON public.messages;
CREATE POLICY "Reader reads replies to own messages" ON public.messages
  FOR SELECT TO authenticated
  USING (reply_to IS NOT NULL AND public.is_reply_to_my_message(reply_to));
