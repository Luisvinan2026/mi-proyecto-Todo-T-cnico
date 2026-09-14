import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { EstadoPerfil, Rol } from "@/lib/dominio";
import type { Perfil } from "@/hooks/useSesion";

export interface PerfilConRol extends Perfil {
  rol: Rol;
}

/** Todas las personas registradas, con su rol. Solo visible para administración. */
export function usePersonas() {
  return useQuery({
    queryKey: ["perfiles", "todos"],
    queryFn: async () => {
      const [perfilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("creado_en", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (perfilesRes.error) throw perfilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      const mapa = new Map<string, Rol>();
      for (const fila of rolesRes.data ?? []) {
        const rol = fila.role as Rol;
        const actual = mapa.get(fila.user_id);
        if (rol === "admin" || (rol === "tecnico" && actual !== "admin") || !actual) {
          mapa.set(fila.user_id, rol);
        }
      }

      return (perfilesRes.data ?? []).map((p) => ({
        ...(p as Perfil),
        rol: mapa.get(p.id) ?? "usuario",
      })) as PerfilConRol[];
    },
  });
}

export function useCambiarEstadoPerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entrada: { id: string; estado: EstadoPerfil }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ estado: entrada.estado })
        .eq("id", entrada.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["perfiles"] }),
  });
}
