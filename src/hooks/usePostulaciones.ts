import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const EXTENSIONES_CV = [".pdf", ".doc", ".docx"];

export function archivoCVValido(archivo: File): boolean {
  const nombre = archivo.name.toLowerCase();
  return EXTENSIONES_CV.some((ext) => nombre.endsWith(ext));
}

/** Sube el CV del técnico y lo enlaza a su perfil. */
export function useSubirCV(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (archivo: File) => {
      if (!archivoCVValido(archivo)) {
        throw new Error("El CV debe estar en formato PDF o Word (.doc, .docx).");
      }
      const extension = archivo.name.slice(archivo.name.lastIndexOf("."));
      const ruta = `${userId}/cv-${Date.now()}${extension}`;
      const { error: errorSubida } = await supabase.storage
        .from("cvs")
        .upload(ruta, archivo, { upsert: true });
      if (errorSubida) throw errorSubida;

      const { error } = await supabase
        .from("profiles")
        .update({
          cv_ruta: ruta,
          cv_nombre: archivo.name,
          cv_subido_en: new Date().toISOString(),
        })
        .eq("id", userId!);
      if (error) throw error;
      return ruta;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["perfil"] });
      void queryClient.invalidateQueries({ queryKey: ["perfiles"] });
    },
  });
}

/** Enlace temporal firmado para ver o descargar un CV. */
export async function urlFirmadaCV(ruta: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from("cvs").createSignedUrl(ruta, 300);
  if (error) return null;
  return data.signedUrl;
}

export function useBanearTecnico() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entrada: { userId: string; motivo: string }) => {
      const { error } = await supabase.rpc("banear_tecnico", {
        _user_id: entrada.userId,
        _motivo: entrada.motivo,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["perfiles"] });
      void queryClient.invalidateQueries({ queryKey: ["lista-negra"] });
    },
  });
}

export function useListaNegra() {
  return useQuery({
    queryKey: ["lista-negra"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lista_negra")
        .select("*")
        .order("creado_en", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Verificación previa al registro: bloquea datos vetados de forma permanente. */
export async function estaVetado(entrada: {
  email: string;
  telefono?: string;
  cedula?: string;
}): Promise<boolean> {
  const { data, error } = await supabase.rpc("en_lista_negra", {
    _email: entrada.email,
    _telefono: entrada.telefono ?? "",
    _cedula: entrada.cedula ?? "",
  });
  if (error) return false;
  return data === true;
}
