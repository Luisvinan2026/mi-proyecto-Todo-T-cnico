import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Marca, PuntoVivo } from "@/components/Consola";
import { rutaPorRol, ZONAS, type Rol } from "@/lib/dominio";
import { asegurarPerfil } from "@/lib/asegurarPerfil";
import { estaVetado } from "@/hooks/usePostulaciones";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dispatch7 · Consola de soporte técnico en tiempo real" },
      {
        name: "description",
        content:
          "Solicita soporte técnico, sigue al técnico en tiempo real y supervisa toda la operación desde una sola consola.",
      },
      { property: "og:title", content: "Dispatch7 · Consola de soporte técnico" },
      {
        property: "og:description",
        content:
          "Solicitudes, seguimiento en vivo y panel de administración para equipos de soporte en campo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Acceso,
});

type Modo = "login" | "registro";

function Acceso() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>("login");
  const [rol, setRol] = useState<Rol>("usuario");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cedula, setCedula] = useState("");
  const [zona, setZona] = useState<string>(ZONAS[0]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!activo || !data.session) return;
      await asegurarPerfil(data.session.user);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id);
      const lista = (roles ?? []).map((r) => r.role as Rol);
      const principal: Rol = lista.includes("admin")
        ? "admin"
        : lista.includes("tecnico")
          ? "tecnico"
          : "usuario";
      void navigate({ to: rutaPorRol(principal), replace: true });
    })();
    return () => {
      activo = false;
    };
  }, [navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    setEnviando(true);
    try {
      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: correo,
          password: clave,
        });
        if (error) throw error;
        const { data } = await supabase.auth.getUser();
        if (data.user) await asegurarPerfil(data.user);
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user!.id);
        const lista = (roles ?? []).map((r) => r.role as Rol);
        const principal: Rol = lista.includes("admin")
          ? "admin"
          : lista.includes("tecnico")
            ? "tecnico"
            : "usuario";
        void navigate({ to: rutaPorRol(principal), replace: true });
      } else {
        if (await estaVetado({ email: correo, telefono, cedula })) {
          throw new Error(
            "Registro bloqueado de forma permanente por la administración de Dispatch7.",
          );
        }
        const { data, error } = await supabase.auth.signUp({
          email: correo,
          password: clave,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              nombre_completo: nombre,
              telefono,
              cedula,
              zona,
              rol,
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          await asegurarPerfil(data.session.user);
          void navigate({ to: rutaPorRol(rol), replace: true });
        } else {
          setMensaje(
            rol === "tecnico"
              ? "Cuenta creada. Confirma tu correo; al ingresar deberás aceptar el contrato y adjuntar tu hoja de vida para que un administrador apruebe tu postulación."
              : "Cuenta creada. Revisa tu correo para confirmar el acceso.",
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la operación");
    } finally {
      setEnviando(false);
    }
  }

  async function conGoogle() {
    setError(null);
    const resultado = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (resultado.error) {
      setError("No se pudo iniciar sesión con Google");
      return;
    }
    if (resultado.redirected) return;
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await asegurarPerfil(data.user);
      void navigate({ to: "/panel", replace: true });
    }
  }

  return (
    <main className="min-h-screen bg-carbon text-paper">
      <section className="bg-carbon-2 border-b border-carbon-4">
        <div className="max-w-6xl mx-auto px-5 py-10 md:px-8">
          <div className="flex items-center justify-between mb-8">
            <Marca />
            <PuntoVivo etiqueta="SISTEMAS EN LÍNEA" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <form onSubmit={enviar} className="panel-inset p-5 md:p-6 rounded-[14px]">
              <div className="flex items-center justify-between mb-5">
                <h1 className="font-semibold text-lg tracking-tight text-paper">
                  {modo === "login" ? "Iniciar sesión" : "Crear acceso"}
                </h1>
                <span className="font-mono text-[10px] text-steel-2 tracking-[0.15em]">
                  ACCESO OPERATIVO
                </span>
              </div>

              {modo === "registro" && (
                <div className="grid grid-cols-2 gap-1.5 mb-5 p-1 bg-carbon rounded-lg">
                  {(["usuario", "tecnico"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRol(r)}
                      className={`py-2 rounded-md font-mono text-xs transition-transform duration-150 ${
                        rol === r
                          ? "bg-amber text-carbon font-semibold"
                          : "text-steel hover:text-paper"
                      }`}
                    >
                      {r === "usuario" ? "USUARIO" : "TÉCNICO"}
                    </button>
                  ))}
                </div>
              )}

              {modo === "registro" && (
                <>
                  <label className="field-label">NOMBRE COMPLETO</label>
                  <input
                    className="field"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <label className="field-label">TELÉFONO</label>
                      <input
                        className="field"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="field-label">ZONA</label>
                      <select
                        className="field"
                        value={zona}
                        onChange={(e) => setZona(e.target.value)}
                      >
                        {ZONAS.map((z) => (
                          <option key={z} value={z}>
                            {z}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <label className="field-label mt-4">CÉDULA / IDENTIFICACIÓN</label>
                  <input
                    className="field"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    required={rol === "tecnico"}
                  />
                  {rol === "tecnico" && (
                    <p className="mt-2 font-mono text-[10px] text-steel-2">
                      Al ingresar deberás aceptar el contrato del técnico (85/15) y
                      adjuntar tu hoja de vida en PDF o Word.
                    </p>
                  )}
                  <div className="mt-4" />
                </>
              )}

              <label className="field-label">CORREO</label>
              <input
                type="email"
                className="field"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
              <label className="field-label mt-4">CONTRASEÑA</label>
              <input
                type="password"
                className="field"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                required
                minLength={6}
              />

              {error && (
                <p className="mt-4 font-mono text-[11px] text-danger">{error}</p>
              )}
              {mensaje && (
                <p className="mt-4 font-mono text-[11px] text-signal">{mensaje}</p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="mt-5 w-full py-3 btn-amber text-sm hover:-translate-y-px active:translate-y-0 disabled:opacity-60"
              >
                {enviando ? "Procesando…" : "Continuar →"}
              </button>

              <button
                type="button"
                onClick={() => void conGoogle()}
                className="mt-2.5 w-full py-3 btn-ghost text-sm hover:-translate-y-px"
              >
                Continuar con Google
              </button>

              <div className="flex items-center justify-between mt-4 font-mono text-[11px]">
                <span className="text-steel">
                  {modo === "login" ? "¿Sin cuenta?" : "¿Ya tienes acceso?"}
                </span>
                <button
                  type="button"
                  className="text-amber"
                  onClick={() => {
                    setModo(modo === "login" ? "registro" : "login");
                    setError(null);
                    setMensaje(null);
                  }}
                >
                  {modo === "login" ? "Crear acceso" : "Iniciar sesión"}
                </button>
              </div>
            </form>

            <div className="hidden md:flex flex-col gap-3">
              <SuperficieRol
                color="bg-amber"
                titulo="ROL USUARIO"
                texto="Seguimiento en tiempo real y calificación"
              />
              <SuperficieRol
                color="bg-signal"
                titulo="ROL TÉCNICO"
                texto="Tablero de solicitudes y estado del servicio"
              />
              <SuperficieRol
                color="bg-danger"
                titulo="ROL ADMINISTRADOR"
                texto="Métricas, gestión y monitoreo en vivo"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SuperficieRol({
  color,
  titulo,
  texto,
}: {
  color: string;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="panel-inset rounded-[14px] p-4 flex items-center gap-4">
      <div className="size-10 rounded-md bg-carbon-4 grid place-items-center">
        <span className={`size-2.5 rounded-full ${color}`} />
      </div>
      <div className="flex-1">
        <div className="font-mono text-[10px] text-steel tracking-[0.15em]">{titulo}</div>
        <div className="text-sm text-paper">{texto}</div>
      </div>
      <span className="font-mono text-xs text-signal">●</span>
    </div>
  );
}
