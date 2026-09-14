import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { EstadoPerfil, Rol } from "@/lib/dominio";

export interface Perfil {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  zona: string | null;
  estado: EstadoPerfil;
  creado_en: string;
  cedula?: string | null;
  cv_ruta?: string | null;
  cv_nombre?: string | null;
  cv_subido_en?: string | null;
}

/** Sesión del navegador, sincronizada con los cambios de autenticación. */
export function useSesion() {
  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => {
      if (!activo) return;
      setSession(s);
      setCargando(false);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      setSession(data.session);
      setCargando(false);
    });
    return () => {
      activo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, userId: session?.user.id ?? null, cargando };
}

/** Perfil + rol de la persona autenticada. */
export function usePerfil() {
  const { userId, cargando } = useSesion();

  const query = useQuery({
    queryKey: ["perfil", userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const [perfilRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId!).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId!),
      ]);
      if (perfilRes.error) throw perfilRes.error;
      if (rolesRes.error) throw rolesRes.error;

      const roles = (rolesRes.data ?? []).map((r) => r.role as Rol);
      const rol: Rol = roles.includes("admin")
        ? "admin"
        : roles.includes("tecnico")
          ? "tecnico"
          : "usuario";

      return { perfil: (perfilRes.data as Perfil | null), rol, roles };
    },
  });

  return {
    userId,
    perfil: query.data?.perfil ?? null,
    rol: query.data?.rol ?? null,
    cargando: cargando || query.isLoading,
    error: query.error,
  };
}

export function useCerrarSesion() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    window.location.href = "/";
  };
}
