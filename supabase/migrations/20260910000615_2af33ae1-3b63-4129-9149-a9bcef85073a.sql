CREATE TYPE public.app_role AS ENUM ('usuario','tecnico','admin');
CREATE TYPE public.estado_perfil AS ENUM ('activo','pendiente_aprobacion','suspendido');
CREATE TYPE public.estado_ticket AS ENUM ('pendiente','asignado','en_camino','en_proceso','finalizado');
CREATE TYPE public.urgencia_ticket AS ENUM ('baja','media','alta','critica');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  nombre_completo text NOT NULL DEFAULT '',
  telefono text,
  zona text,
  estado public.estado_perfil NOT NULL DEFAULT 'activo',
  creado_en timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.perfil_activo(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND estado = 'activo')
$$;

CREATE TABLE public.tickets_servicio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tecnico_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descripcion text NOT NULL,
  categoria text NOT NULL,
  zona text,
  urgencia public.urgencia_ticket NOT NULL DEFAULT 'media',
  estado public.estado_ticket NOT NULL DEFAULT 'pendiente',
  notas_cierre text,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tickets_usuario ON public.tickets_servicio(usuario_id);
CREATE INDEX idx_tickets_tecnico ON public.tickets_servicio(tecnico_id);
CREATE INDEX idx_tickets_estado ON public.tickets_servicio(estado);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets_servicio TO authenticated;
GRANT ALL ON public.tickets_servicio TO service_role;
ALTER TABLE public.tickets_servicio ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.resenas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL UNIQUE REFERENCES public.tickets_servicio(id) ON DELETE CASCADE,
  puntuacion int NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
  comentario text,
  creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_resenas_ticket ON public.resenas(ticket_id);
GRANT SELECT, INSERT ON public.resenas TO authenticated;
GRANT ALL ON public.resenas TO service_role;
ALTER TABLE public.resenas ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "perfil propio visible" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.tickets_servicio t WHERE (t.usuario_id = profiles.id AND t.tecnico_id = auth.uid()) OR (t.tecnico_id = profiles.id AND t.usuario_id = auth.uid())));
CREATE POLICY "crear perfil propio" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "editar perfil propio" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "admin gestiona perfiles" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin elimina perfiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- user_roles policies
CREATE POLICY "ver roles propios" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "registrar rol propio no admin" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role <> 'admin');

-- tickets policies
CREATE POLICY "ver tickets propios o disponibles" ON public.tickets_servicio FOR SELECT TO authenticated
  USING (
    usuario_id = auth.uid()
    OR tecnico_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR (estado = 'pendiente' AND tecnico_id IS NULL AND public.has_role(auth.uid(), 'tecnico') AND public.perfil_activo(auth.uid()))
  );
CREATE POLICY "usuario crea ticket" ON public.tickets_servicio FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid() AND public.perfil_activo(auth.uid()));
CREATE POLICY "tecnico toma ticket disponible" ON public.tickets_servicio FOR UPDATE TO authenticated
  USING (estado = 'pendiente' AND tecnico_id IS NULL AND public.has_role(auth.uid(), 'tecnico') AND public.perfil_activo(auth.uid()))
  WITH CHECK (tecnico_id = auth.uid());
CREATE POLICY "tecnico asignado actualiza" ON public.tickets_servicio FOR UPDATE TO authenticated
  USING (tecnico_id = auth.uid()) WITH CHECK (tecnico_id = auth.uid());
CREATE POLICY "admin actualiza tickets" ON public.tickets_servicio FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "usuario cancela ticket pendiente" ON public.tickets_servicio FOR DELETE TO authenticated
  USING (usuario_id = auth.uid() AND estado = 'pendiente');

-- resenas policies
CREATE POLICY "ver resenas relacionadas" ON public.resenas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tickets_servicio t WHERE t.id = resenas.ticket_id
    AND (t.usuario_id = auth.uid() OR t.tecnico_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "usuario califica su ticket finalizado" ON public.resenas FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.tickets_servicio t WHERE t.id = resenas.ticket_id
    AND t.usuario_id = auth.uid() AND t.estado = 'finalizado'));

CREATE OR REPLACE FUNCTION public.touch_actualizado_en()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.actualizado_en = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_tickets_touch BEFORE UPDATE ON public.tickets_servicio
FOR EACH ROW EXECUTE FUNCTION public.touch_actualizado_en();

ALTER TABLE public.tickets_servicio REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets_servicio;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;