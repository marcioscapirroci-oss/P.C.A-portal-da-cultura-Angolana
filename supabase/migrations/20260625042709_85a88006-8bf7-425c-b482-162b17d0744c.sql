-- Backfill: super_admins also become jornalistas
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'jornalista'::public.app_role FROM public.user_roles WHERE role = 'super_admin'::public.app_role
ON CONFLICT DO NOTHING;

-- Update owner-assign trigger fn to also add jornalista
CREATE OR REPLACE FUNCTION public.assign_super_admin_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF LOWER(NEW.email) = 'marcioscapirroci@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin'::public.app_role) ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin'::public.app_role) ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'jornalista'::public.app_role) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;