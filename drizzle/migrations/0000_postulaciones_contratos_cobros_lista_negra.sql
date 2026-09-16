-- 1. Columnas nuevas
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cedula text,
  ADD COLUMN IF NOT EXISTS cv_ruta text,
  ADD COLUMN IF NOT EXISTS cv_nombre text,
  ADD COLUMN IF NOT EXISTS cv_subido_en timestamptz;

ALTER TABLE public.tickets_servicio
  ADD COLUMN IF NOT EXISTS valor_total numeric(12,2),
  ADD COLUMN IF NOT EXISTS cobro_en timestamptz,
  ADD COLUMN IF NOT EXISTS pagado boolean NOT NULL DEFAULT false;

ALTER TABLE public.resenas
  ADD COLUMN IF NOT EXISTS puntuacion_app integer;

-- 2. Contratos aceptados
CREATE TABLE IF NOT EXISTS public.contratos_aceptados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('tecnico','cliente')),
  version text NOT NULL DEFAULT 'v1',
  aceptado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tipo, version)
);
CREATE INDEX IF NOT EXISTS idx_contratos_user ON public.contratos_aceptados(user_id);

GRANT SELECT, INSERT ON public.contratos_aceptados TO authenticated;
GRANT ALL ON public.contratos_aceptados TO service_role;
ALTER TABLE public.contratos_aceptados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ver contrato propio o admin" ON public.contratos_aceptados
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "firmar contrato propio" ON public.contratos_aceptados
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 3. Datos bancarios de la empresa
CREATE TABLE IF NOT EXISTS public.datos_bancarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banco text NOT NULL,
  tipo_cuenta text NOT NULL,
  numero_cuenta text NOT NULL,
  identificacion text NOT NULL,
  titular text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.datos_bancarios TO authenticated;
GRANT ALL ON public.datos_bancarios TO service_role;
ALTER TABLE public.datos_bancarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "datos bancarios visibles autenticados" ON public.datos_bancarios
  FOR SELECT TO authenticated USING (activo);

CREATE POLICY "admin gestiona datos bancarios" ON public.datos_bancarios
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.datos_bancarios (banco, tipo_cuenta, numero_cuenta, identificacion, titular)
VALUES ('Banco de Loja', 'Corriente', '2100000000', '0999999999001', 'Dispatch7 S.A.');

-- 4. Lista negra
CREATE TABLE IF NOT EXISTS public.lista_negra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  telefono text,
  cedula text,
  motivo text NOT NULL DEFAULT 'Expulsado por la administración',
  user_id uuid,
  creado_por uuid,
  creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lista_negra_email ON public.lista_negra(lower(email));
CREATE INDEX IF NOT EXISTS idx_lista_negra_cedula ON public.lista_negra(cedula);

GRANT SELECT ON public.lista_negra TO authenticated;
GRANT ALL ON public.lista_negra TO service_role;
ALTER TABLE public.lista_negra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin ve lista negra" ON public.lista_negra
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. Consulta pública de bloqueo (no expone datos, solo booleano)
CREATE OR REPLACE FUNCTION public.en_lista_negra(_email text, _telefono text DEFAULT NULL, _cedula text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lista_negra ln
    WHERE (_email IS NOT NULL AND lower(ln.email) = lower(_email))
       OR (_telefono IS NOT NULL AND _telefono <> '' AND ln.telefono = _telefono)
       OR (_cedula IS NOT NULL AND _cedula <> '' AND ln.cedula = _cedula)
  )
$$;
REVOKE ALL ON FUNCTION public.en_lista_negra(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.en_lista_negra(text, text, text) TO anon, authenticated, service_role;

-- 6. Baneo permanente por parte del administrador
CREATE OR REPLACE FUNCTION public.banear_tecnico(_user_id uuid, _motivo text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
  _tel text;
  _ced text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT lower(u.email) INTO _email FROM auth.users u WHERE u.id = _user_id;
  SELECT p.telefono, p.cedula INTO _tel, _ced FROM public.profiles p WHERE p.id = _user_id;

  INSERT INTO public.lista_negra (email, telefono, cedula, motivo, user_id, creado_por)
  VALUES (_email, _tel, _ced, COALESCE(NULLIF(_motivo, ''), 'Expulsado por la administración'), _user_id, auth.uid());

  UPDATE public.profiles SET estado = 'suspendido' WHERE id = _user_id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.banear_tecnico(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.banear_tecnico(uuid, text) TO authenticated, service_role;

-- 7. Bloqueo permanente al crear perfil
CREATE OR REPLACE FUNCTION public.bloquear_lista_negra()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
BEGIN
  SELECT lower(u.email) INTO _email FROM auth.users u WHERE u.id = NEW.id;
  IF public.en_lista_negra(_email, NEW.telefono, NEW.cedula) THEN
    RAISE EXCEPTION 'Registro bloqueado permanentemente por la administración';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_lista_negra ON public.profiles;
CREATE TRIGGER trg_profiles_lista_negra
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_lista_negra();
