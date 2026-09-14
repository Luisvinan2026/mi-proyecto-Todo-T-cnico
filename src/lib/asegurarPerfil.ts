import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { Rol } from "@/lib/dominio";

/**
 * Crea el perfil y el rol la primera vez que alguien entra, usando los datos
 * capturados en el registro. Es idempotente.
 */
export async function asegurarPerfil(user: User): Promise<void> {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const texto = (clave: string) =>
    typeof meta[clave] === "string" ? (meta[clave] as string) : undefined;
  const rol: Rol = texto("rol") === "tecnico" ? "tecnico" : "usuario";

  const { data: perfil } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil) {
    await supabase.from("profiles").insert({
      id: user.id,
      nombre_completo:
        texto("nombre_completo") ??
        texto("full_name") ??
        user.email?.split("@")[0] ??
        "Sin nombre",
      telefono: texto("telefono") ?? null,
      cedula: texto("cedula") ?? null,
      zona: texto("zona") ?? null,
      estado: rol === "tecnico" ? "pendiente_aprobacion" : "activo",
    });
  }



  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (!roles || roles.length === 0) {
    await supabase.from("user_roles").insert({ user_id: user.id, role: rol });
  }

  // Otorga el rol de administrador solo si el correo está en la lista
  // autorizada del servidor (tabla admins_autorizados). Nadie puede
  // autoasignárselo desde el navegador.
  const yaEsAdmin = (roles ?? []).some((r) => r.role === "admin");
  if (!yaEsAdmin) {
    await supabase.rpc("reclamar_admin");
  }
}
