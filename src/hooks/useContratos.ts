import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { VERSION_CONTRATO } from "@/lib/contratos";

export type TipoContrato = "tecnico" | "cliente";

/** Indica si la persona ya firmó el contrato vigente de su rol. */
export function useContratoFirmado(userId: string | null, tipo: TipoContrato) {
  return useQuery({
    queryKey: ["contrato", userId, tipo, VERSION_CONTRATO],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos_aceptados")
        .select("id")
        .eq("user_id", userId!)
        .eq("tipo", tipo)
        .eq("version", VERSION_CONTRATO)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

export function useFirmarContrato(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tipo: TipoContrato) => {
      const { error } = await supabase.from("contratos_aceptados").insert({
        user_id: userId!,
        tipo,
        version: VERSION_CONTRATO,
      });
      if (error && error.code !== "23505") throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contrato"] }),
  });
}

/** Datos bancarios oficiales de la empresa. */
export function useDatosBancarios() {
  return useQuery({
    queryKey: ["datos-bancarios"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("datos_bancarios")
        .select("*")
        .eq("activo", true)
        .order("creado_en", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
