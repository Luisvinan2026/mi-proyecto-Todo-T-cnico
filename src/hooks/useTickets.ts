import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { EstadoTicket, Urgencia } from "@/lib/dominio";

export interface Ticket {
  id: string;
  usuario_id: string;
  tecnico_id: string | null;
  titulo: string;
  descripcion: string;
  categoria: string;
  zona: string | null;
  urgencia: Urgencia;
  estado: EstadoTicket;
  notas_cierre: string | null;
  valor_total: number | null;
  cobro_en: string | null;
  pagado: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface Resena {
  id: string;
  ticket_id: string;
  puntuacion: number;
  puntuacion_app: number | null;
  comentario: string | null;
  creado_en: string;
}

const SELECT_TICKET = "*";

/** Suscripción única a los cambios en vivo de los servicios. */
export function useTicketsEnVivo() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const canal = supabase
      .channel("tickets-en-vivo")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets_servicio" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["tickets"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["perfiles"] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [queryClient]);
}

/** Tickets creados por la persona autenticada. */
export function useMisTickets(userId: string | null) {
  return useQuery({
    queryKey: ["tickets", "mios", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets_servicio")
        .select(SELECT_TICKET)
        .eq("usuario_id", userId!)
        .order("creado_en", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Ticket[];
    },
  });
}

/** Solicitudes sin técnico asignado. */
export function useTicketsDisponibles() {
  return useQuery({
    queryKey: ["tickets", "disponibles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets_servicio")
        .select(SELECT_TICKET)
        .is("tecnico_id", null)
        .eq("estado", "pendiente")
        .order("creado_en", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Ticket[];
    },
  });
}

/** Servicios asignados al técnico autenticado. */
export function useTicketsDelTecnico(userId: string | null) {
  return useQuery({
    queryKey: ["tickets", "tecnico", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets_servicio")
        .select(SELECT_TICKET)
        .eq("tecnico_id", userId!)
        .order("actualizado_en", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Ticket[];
    },
  });
}

/** Vista global (solo administración). */
export function useTodosLosTickets() {
  return useQuery({
    queryKey: ["tickets", "todos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets_servicio")
        .select(SELECT_TICKET)
        .order("actualizado_en", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Ticket[];
    },
  });
}

export function useResenas(ticketIds: string[]) {
  const clave = [...ticketIds].sort().join(",");
  return useQuery({
    queryKey: ["resenas", clave],
    enabled: ticketIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resenas")
        .select("*")
        .in("ticket_id", ticketIds);
      if (error) throw error;
      return (data ?? []) as Resena[];
    },
  });
}

export function useCrearTicket(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entrada: {
      titulo: string;
      descripcion: string;
      categoria: string;
      urgencia: Urgencia;
      zona: string;
    }) => {
      const { error } = await supabase
        .from("tickets_servicio")
        .insert({ ...entrada, usuario_id: userId! });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useAceptarTicket(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from("tickets_servicio")
        .update({ tecnico_id: userId!, estado: "asignado" })
        .eq("id", ticketId)
        .is("tecnico_id", null)
        .eq("estado", "pendiente");
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useActualizarTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entrada: {
      id: string;
      estado?: EstadoTicket;
      notas_cierre?: string;
      valor_total?: number;
      cobro_en?: string;
    }) => {
      const { id, ...cambios } = entrada;
      const { error } = await supabase
        .from("tickets_servicio")
        .update(cambios)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useCrearResena() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entrada: {
      ticket_id: string;
      puntuacion: number;
      puntuacion_app: number;
      comentario: string;
    }) => {
      const { error } = await supabase.from("resenas").insert(entrada);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resenas"] }),
  });
}
