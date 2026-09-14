CREATE TABLE IF NOT EXISTS public.admins_autorizados (
  email text PRIMARY KEY,
  creado_en timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.admins_autorizados TO service_role;

ALTER TABLE public.admins_autorizados ENABLE ROW LEVEL SECURITY;

INSERT INTO public.admins_autorizados (email) VALUES ('luisfernandovinan@gmail.com')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.reclamar_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
BEGIN
  SELECT lower(email) INTO _email FROM auth.users WHERE id = auth.uid();
  IF _email IS NULL THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.admins_autorizados WHERE lower(email) = _email) THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.profiles SET estado = 'activo' WHERE id = auth.uid();
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.reclamar_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reclamar_admin() TO authenticated, service_role;