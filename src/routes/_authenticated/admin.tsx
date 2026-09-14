import { useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Cabecera, Panel } from "@/components/Consola";
import { PanelPostulantes } from "@/components/Postulantes";
import { usePerfil } from "@/hooks/useSesion";
import { useTicketsEnVivo, useTodosLosTickets, type Resena } from "@/hooks/useTickets";
import { useCambiarEstadoPerfil, usePersonas } from "@/hooks/useAdministracion";
import { useBanearTecnico, useListaNegra } from "@/hooks/usePostulaciones";
import {
  ETIQUETA_ESTADO,
  ETIQUETA_PERFIL,
  codigoTicket,
  moneda,
  rutaPorRol,
  type EstadoPerfil,
} from "@/lib/dominio";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Panel de administración · Dispatch7" },
      {
        name: "description",
        content:
          "Métricas de operación, gestión de técnicos y monitoreo global de servicios en tiempo real.",
      },
      { property: "og:title", content: "Panel de administración · Dispatch7" },
      {
        property: "og:description",
        content: "Aprueba técnicos, revisa métricas y supervisa los servicios en vivo.",
      },
    ],
  }),
  component: PanelAdmin,
});

function PanelAdmin() {
  const navigate = useNavigate();
  const { perfil, rol, cargando } = usePerfil();
  useTicketsEnVivo();

  const { data: tickets = [] } = useTodosLosTickets();
  const { data: personas = [] } = usePersonas();
  const cambiarEstado = useCambiarEstadoPerfil();
  const banear = useBanearTecnico();
  const { data: listaNegra = [] } = useListaNegra();

  const { data: resenas = [] } = useQuery({
    queryKey: ["resenas", "todas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("resenas").select("*").limit(500);
      if (error) throw error;
      return (data ?? []) as Resena[];
    },
  });

  const metricas = useMemo(() => {
    const tecnicos = personas.filter((p) => p.rol === "tecnico");
    const enCurso = tickets.filter(
      (t) => t.estado !== "pendiente" && t.estado !== "finalizado",
    ).length;
    const promedio =
      resenas.length > 0
        ? resenas.reduce((a, r) => a + r.puntuacion, 0) / resenas.length
        : 0;
    return {
      total: tickets.length,
      tecnicosActivos: tecnicos.filter((t) => t.estado === "activo").length,
      tecnicosPendientes: tecnicos.filter((t) => t.estado === "pendiente_aprobacion")
        .length,
      promedio,
      resenas: resenas.length,
      enCurso,
      facturado: tickets.reduce((a, t) => a + Number(t.valor_total ?? 0), 0),
    };
  }, [personas, tickets, resenas]);

  const postulantes = useMemo(
    () => personas.filter((p) => p.rol === "tecnico" && p.estado === "pendiente_aprobacion"),
    [personas],
  );

  if (!cargando && rol && rol !== "admin") {
    void navigate({ to: rutaPorRol(rol), replace: true });
  }

  return (
    <div className="min-h-screen bg-carbon">
      <Cabecera
        nombre={perfil?.nombre_completo ?? "…"}
        rol="admin"
        etiquetaVivo="MONITOREO EN TIEMPO REAL"
      />

      <main className="max-w-6xl mx-auto px-5 py-10 md:px-8">
        <div className="mb-6">
          <div className="font-mono text-[11px] text-steel tracking-[0.15em] mb-1">
            NIVEL ADMINISTRADOR
          </div>
          <h1 className="font-semibold text-2xl tracking-tight text-paper">
            Panel de monitoreo y gestión
          </h1>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <Tarjeta
            etiqueta="TOTAL SERVICIOS"
            valor={String(metricas.total)}
            pie={`${metricas.enCurso} en curso`}
          />
          <Tarjeta
            etiqueta="TÉCNICOS ACTIVOS"
            valor={String(metricas.tecnicosActivos)}
            pie={`${metricas.tecnicosPendientes} por aprobar`}
          />
          <Tarjeta
            etiqueta="CALIFICACIÓN PROM."
            valor={metricas.promedio ? metricas.promedio.toFixed(1) : "—"}
            pie={`sobre 5.0 · ${metricas.resenas} reseñas`}
            destacado
          />
          <Tarjeta
            etiqueta="FACTURADO"
            valor={moneda(metricas.facturado)}
            pie={`comisión empresa ${moneda(metricas.facturado * 0.15)}`}
          />
          <Tarjeta
            etiqueta="SERVICIOS EN CURSO"
            valor={String(metricas.enCurso)}
            pie="actualizado en vivo"
            vivo
          />
        </div>

        <div className="mb-4">
          <PanelPostulantes
            postulantes={postulantes}
            procesando={cambiarEstado.isPending}
            onAceptar={(id) => cambiarEstado.mutate({ id, estado: "activo" })}
            onDenegar={(id) => cambiarEstado.mutate({ id, estado: "suspendido" })}
          />
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-4 items-start">
          <Panel
            titulo="Gestión de usuarios y técnicos"
            extra={
              <span className="font-mono text-[10px] text-steel-2">
                APROBAR · RECHAZAR · SUSPENDER
              </span>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[12px]">
                <thead>
                  <tr className="text-steel-2 text-[10px] tracking-[0.1em] border-b border-carbon-4">
                    <th className="pb-2 font-medium">NOMBRE</th>
                    <th className="pb-2 font-medium">ROL</th>
                    <th className="pb-2 font-medium">ZONA</th>
                    <th className="pb-2 font-medium">ESTADO</th>
                    <th className="pb-2 font-medium text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="text-paper">
                  {personas.map((p) => (
                    <tr key={p.id} className="border-b border-carbon-4/60">
                      <td className="py-2.5">{p.nombre_completo}</td>
                      <td className="py-2.5 text-steel">{p.rol}</td>
                      <td className="py-2.5 text-steel">{p.zona ?? "—"}</td>
                      <td className="py-2.5">
                        <span className={colorEstado(p.estado)}>
                          ● {ETIQUETA_PERFIL[p.estado]}
                        </span>
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        {p.estado !== "activo" && (
                          <button
                            onClick={() =>
                              cambiarEstado.mutate({ id: p.id, estado: "activo" })
                            }
                            className="px-2 py-1 rounded bg-signal/15 text-signal text-[10px] mr-1"
                          >
                            {p.estado === "pendiente_aprobacion" ? "Aprobar" : "Reactivar"}
                          </button>
                        )}
                        {p.estado === "pendiente_aprobacion" && (
                          <button
                            onClick={() =>
                              cambiarEstado.mutate({ id: p.id, estado: "suspendido" })
                            }
                            className="px-2 py-1 rounded bg-carbon-4 text-steel text-[10px]"
                          >
                            Rechazar
                          </button>
                        )}
                        {p.estado === "activo" && (
                          <button
                            onClick={() =>
                              cambiarEstado.mutate({ id: p.id, estado: "suspendido" })
                            }
                            className="px-2 py-1 rounded bg-danger/15 text-danger text-[10px] mr-1"
                          >
                            Suspender
                          </button>
                        )}
                        {p.rol === "tecnico" && (
                          <button
                            disabled={banear.isPending}
                            onClick={() => {
                              const motivo = window.prompt(
                                "Motivo del baneo permanente (fraude, cobro por fuera, malas calificaciones…)",
                                "Fraude o cobro por fuera de la app",
                              );
                              if (motivo) banear.mutate({ userId: p.id, motivo });
                            }}
                            className="px-2 py-1 rounded bg-danger text-carbon text-[10px]"
                          >
                            Banear
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {personas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-3 text-steel-2">
                        Sin personas registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="space-y-4">
          <Panel
            titulo="Monitor en vivo"
            extra={<span className="size-2 rounded-full bg-signal pulse-live" />}
          >
            <div className="flex items-end gap-1.5 h-20 mb-4">
              {barras(tickets.length).map((h, i) => (
                <div
                  key={i}
                  className={`bar-grow flex-1 rounded-sm ${
                    i % 3 === 0 ? "bg-signal" : i % 3 === 1 ? "bg-amber" : "bg-carbon-4"
                  }`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="space-y-2 font-mono text-[11px]">
              {tickets.slice(0, 8).map((t) => (
                <div key={t.id} className="flex justify-between text-paper gap-3">
                  <span className="truncate">{codigoTicket(t.id)}</span>
                  <span
                    className={
                      t.estado === "finalizado"
                        ? "text-steel"
                        : t.estado === "pendiente"
                          ? "text-warn"
                          : "text-signal"
                    }
                  >
                    {ETIQUETA_ESTADO[t.estado].toUpperCase()}
                  </span>
                </div>
              ))}
              {tickets.length === 0 && (
                <p className="text-steel-2">Sin servicios registrados.</p>
              )}
            </div>
          </Panel>

          <Panel
            titulo="Lista negra"
            extra={
              <span className="font-mono text-[10px] text-danger">
                {listaNegra.length} VETADOS
              </span>
            }
          >
            <div className="space-y-2 font-mono text-[11px]">
              {listaNegra.map((b) => (
                <div key={b.id} className="panel-inset rounded-lg p-2.5">
                  <div className="text-paper truncate">{b.email ?? "sin correo"}</div>
                  <div className="text-steel-2">
                    {b.telefono ?? "sin teléfono"} · {b.cedula ?? "sin ID"}
                  </div>
                  <div className="text-danger mt-1">{b.motivo}</div>
                </div>
              ))}
              {listaNegra.length === 0 && (
                <p className="text-steel-2">Sin cuentas vetadas.</p>
              )}
            </div>
          </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}

function colorEstado(estado: EstadoPerfil) {
  if (estado === "activo") return "text-signal";
  if (estado === "pendiente_aprobacion") return "text-warn";
  return "text-danger";
}

function barras(semilla: number) {
  return Array.from({ length: 7 }, (_, i) => 40 + ((semilla * 13 + i * 29) % 60));
}

function Tarjeta({
  etiqueta,
  valor,
  pie,
  destacado,
  vivo,
}: {
  etiqueta: string;
  valor: string;
  pie: string;
  destacado?: boolean;
  vivo?: boolean;
}) {
  return (
    <div className="panel rounded-[14px] p-4">
      <div className="font-mono text-[10px] text-steel tracking-[0.15em]">{etiqueta}</div>
      <div
        className={`font-mono text-3xl mt-2 flex items-center gap-2 ${
          destacado ? "text-amber-2" : "text-paper"
        }`}
      >
        {valor}
        {vivo && <span className="size-2 rounded-full bg-signal pulse-live" />}
      </div>
      <div className="font-mono text-[11px] text-steel-2 mt-1">{pie}</div>
    </div>
  );
}
