import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Cabecera, Panel, RailEstado } from "@/components/Consola";
import { PantallaContrato } from "@/components/Contrato";
import { usePerfil, type Perfil } from "@/hooks/useSesion";
import { useContratoFirmado, useFirmarContrato } from "@/hooks/useContratos";
import { archivoCVValido, useSubirCV } from "@/hooks/usePostulaciones";
import { CONTRATO_TECNICO } from "@/lib/contratos";
import {
  useAceptarTicket,
  useActualizarTicket,
  useTicketsDelTecnico,
  useTicketsDisponibles,
  useTicketsEnVivo,
  type Ticket,
} from "@/hooks/useTickets";
import {
  CATEGORIAS,
  ETIQUETA_ESTADO,
  ETIQUETA_URGENCIA,
  ZONAS,
  anteriorEstado,
  codigoTicket,
  colorUrgencia,
  iniciales,
  moneda,
  rutaPorRol,
  siguienteEstado,
} from "@/lib/dominio";

export const Route = createFileRoute("/_authenticated/tecnico")({
  head: () => ({
    meta: [
      { title: "Consola del técnico · Dispatch7" },
      {
        name: "description",
        content:
          "Tablero de solicitudes disponibles, servicio activo, cobro y notas técnicas de cierre.",
      },
      { property: "og:title", content: "Consola del técnico · Dispatch7" },
      {
        property: "og:description",
        content: "Acepta servicios, actualiza estados y registra el cobro desde el celular.",
      },
    ],
  }),
  component: ConsolaTecnico,
});

function ConsolaTecnico() {
  const navigate = useNavigate();
  const { userId, perfil, rol, cargando } = usePerfil();
  useTicketsEnVivo();

  const { data: firmado, isLoading: cargandoContrato } = useContratoFirmado(
    userId,
    "tecnico",
  );
  const { data: disponibles = [] } = useTicketsDisponibles();
  const { data: mios = [] } = useTicketsDelTecnico(userId);
  const aceptar = useAceptarTicket(userId);

  const [filtroZona, setFiltroZona] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);

  const activo = useMemo(
    () => mios.find((t) => t.estado !== "finalizado") ?? null,
    [mios],
  );

  const listado = disponibles.filter(
    (t) =>
      (!filtroZona || t.zona === filtroZona) &&
      (!filtroCategoria || t.categoria === filtroCategoria),
  );

  if (!cargando && rol && rol !== "tecnico") {
    void navigate({ to: rutaPorRol(rol), replace: true });
  }

  if (!cargando && !cargandoContrato && userId && (firmado === false || !perfil?.cv_ruta)) {
    return <Postulacion userId={userId} perfil={perfil} yaFirmado={firmado === true} />;
  }

  const bloqueado = perfil?.estado !== "activo";

  return (
    <div className="min-h-screen bg-carbon-2">
      <Cabecera
        nombre={perfil?.nombre_completo ?? "…"}
        rol="tecnico"
        etiquetaVivo="MODO OPERATIVO"
      />

      <main className="max-w-6xl mx-auto px-5 py-10 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-semibold text-xl md:text-2xl tracking-tight text-paper">
            Consola del técnico
          </h1>
          <span className="font-mono text-[11px] text-signal tracking-wide flex items-center gap-2">
            <span className="size-2 rounded-full bg-signal pulse-live" />
            {perfil?.estado === "activo" ? "HABILITADO" : "SIN HABILITAR"}
          </span>
        </div>

        {bloqueado && (
          <div className="panel p-4 mb-6">
            <p className="font-mono text-[11px] text-warn tracking-wide mb-1">
              CUENTA {perfil?.estado === "suspendido" ? "SUSPENDIDA" : "EN REVISIÓN"}
            </p>
            <p className="text-sm text-steel">
              Tu postulación y tu CV están en revisión. Un administrador debe aprobar tu
              cuenta antes de que puedas aceptar servicios.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <Panel
            titulo="Solicitudes disponibles"
            extra={
              <span className="font-mono text-[10px] text-steel">
                {listado.length} ACTIVAS
              </span>
            }
          >
            <div className="flex flex-wrap gap-2 mb-4">
              <Chip
                activo={!filtroZona && !filtroCategoria}
                onClick={() => {
                  setFiltroZona(null);
                  setFiltroCategoria(null);
                }}
              >
                Todas
              </Chip>
              {ZONAS.map((z) => (
                <Chip
                  key={z}
                  activo={filtroZona === z}
                  onClick={() => setFiltroZona(filtroZona === z ? null : z)}
                >
                  {z}
                </Chip>
              ))}
              {CATEGORIAS.map((c) => (
                <Chip
                  key={c}
                  activo={filtroCategoria === c}
                  onClick={() => setFiltroCategoria(filtroCategoria === c ? null : c)}
                >
                  {c}
                </Chip>
              ))}
            </div>

            <div className="space-y-2.5">
              {listado.map((t) => (
                <div key={t.id} className="bg-carbon rounded-lg p-3 ring-1 ring-carbon-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`font-mono text-[10px] tracking-wide ${colorUrgencia(t.urgencia)}`}
                    >
                      ● {ETIQUETA_URGENCIA[t.urgencia].toUpperCase()}
                    </span>
                    <span className="font-mono text-[10px] text-steel-2">
                      {codigoTicket(t.id)}
                    </span>
                  </div>
                  <div className="text-sm text-paper">{t.titulo}</div>
                  <div className="font-mono text-[11px] text-steel mt-1">
                    {t.categoria} · {t.zona ?? "Sin zona"}
                  </div>
                  <button
                    disabled={bloqueado || !!activo || aceptar.isPending}
                    onClick={() => aceptar.mutate(t.id)}
                    className="mt-2.5 w-full py-2 btn-amber text-[13px] hover:-translate-y-px disabled:opacity-40"
                  >
                    Aceptar servicio
                  </button>
                </div>
              ))}
              {listado.length === 0 && (
                <p className="font-mono text-[11px] text-steel-2">
                  No hay solicitudes con esos filtros.
                </p>
              )}
            </div>
          </Panel>

          {activo ? (
            <ServicioActivo ticket={activo} />
          ) : (
            <Panel titulo="Servicio activo">
              <p className="font-mono text-[11px] text-steel-2">
                Acepta una solicitud para comenzar.
              </p>
            </Panel>
          )}
        </div>
      </main>
    </div>
  );
}

function Postulacion({
  userId,
  perfil,
  yaFirmado,
}: {
  userId: string;
  perfil: Perfil | null;
  yaFirmado: boolean;
}) {
  const subirCV = useSubirCV(userId);
  const firmar = useFirmarContrato(userId);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tieneCV = !!perfil?.cv_ruta;

  async function enviar() {
    setError(null);
    try {
      if (!tieneCV) {
        if (!archivo) {
          setError("Adjunta tu hoja de vida en PDF o Word para postular.");
          return;
        }
        await subirCV.mutateAsync(archivo);
      }
      if (!yaFirmado) await firmar.mutateAsync("tecnico");
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo completar la postulación.",
      );
    }
  }

  return (
    <PantallaContrato
      titulo="Contrato del técnico Dispatch7"
      subtitulo="Lee y acepta cada cláusula, y adjunta tu hoja de vida para completar tu postulación."
      clausulas={CONTRATO_TECNICO}
      etiquetaBoton="Aceptar contrato y enviar postulación"
      enviando={subirCV.isPending || firmar.isPending}
      error={error}
      onFirmar={() => void enviar()}
      extra={
        <div className="mt-5 panel-inset rounded-xl p-4">
          <div className="font-mono text-[10px] text-steel-2 tracking-[0.15em] mb-2">
            HOJA DE VIDA (PDF O WORD) · OBLIGATORIA
          </div>
          {tieneCV ? (
            <p className="text-[13px] text-signal font-mono">
              ✓ CV recibido: {perfil?.cv_nombre ?? "documento"}
            </p>
          ) : (
            <>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (f && !archivoCVValido(f)) {
                    setError("Formato no válido. Solo PDF o Word (.doc, .docx).");
                    setArchivo(null);
                    return;
                  }
                  setError(null);
                  setArchivo(f);
                }}
                className="block w-full text-[13px] text-steel file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-carbon-4 file:text-paper file:font-mono file:text-[11px]"
              />
              {archivo && (
                <p className="mt-2 font-mono text-[11px] text-signal">
                  {archivo.name} listo para enviar
                </p>
              )}
            </>
          )}
        </div>
      }
    />
  );
}

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md font-mono text-[11px] ${
        activo ? "bg-amber text-carbon" : "bg-carbon text-steel ring-1 ring-carbon-4"
      }`}
    >
      {children}
    </button>
  );
}

function ServicioActivo({ ticket }: { ticket: Ticket }) {
  const actualizar = useActualizarTicket();
  const [notas, setNotas] = useState(ticket.notas_cierre ?? "");
  const [valor, setValor] = useState(
    ticket.valor_total != null ? String(ticket.valor_total) : "",
  );

  const { data: cliente } = useQuery({
    queryKey: ["perfiles", "cliente", ticket.usuario_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", ticket.usuario_id)
        .maybeSingle();
      if (error) throw error;
      return data as Perfil | null;
    },
  });

  const siguiente = siguienteEstado(ticket.estado);
  const anterior = anteriorEstado(ticket.estado);
  const requiereCierre = siguiente === "finalizado";
  const valorNumero = Number(valor.replace(",", "."));
  const valorValido = Number.isFinite(valorNumero) && valorNumero > 0;
  const cierreListo = notas.trim().length >= 5 && valorValido;

  return (
    <Panel
      titulo="Servicio activo"
      extra={
        <span className="font-mono text-[10px] text-amber tracking-[0.15em]">
          {codigoTicket(ticket.id)}
        </span>
      }
    >
      <div className="bg-carbon rounded-lg p-3 mb-3">
        <RailEstado estado={ticket.estado} />
      </div>

      <div className="flex items-center gap-3 bg-carbon rounded-lg p-3 mb-3">
        <div className="size-9 rounded-full bg-carbon-3 grid place-items-center font-mono text-xs text-paper ring-1 ring-carbon-4 shrink-0">
          {iniciales(cliente?.nombre_completo ?? "")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-paper">
            {cliente?.nombre_completo ?? "Cliente"}
          </div>
          <div className="font-mono text-[11px] text-steel">
            {cliente?.telefono ?? "Sin teléfono"}
          </div>
        </div>
        {cliente?.telefono && (
          <a
            href={`tel:${cliente.telefono}`}
            className="px-3 py-2 btn-ghost font-mono text-[11px] text-signal hover:-translate-y-px"
          >
            LLAMAR
          </a>
        )}
      </div>

      <div className="bg-carbon rounded-lg p-3 mb-3">
        <div className="font-mono text-[10px] text-steel tracking-[0.15em] mb-2">
          UBICACIÓN · {ticket.zona ?? "SIN ZONA"}
        </div>
        <div className="h-24 rounded-md bg-carbon-3 relative overflow-hidden">
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(var(--carbon-4)_1px,transparent_1px),linear-gradient(90deg,var(--carbon-4)_1px,transparent_1px)] [background-size:20px_20px]" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-3 rounded-full bg-signal pulse-live" />
        </div>
      </div>

      <div className="text-sm text-paper mb-1">{ticket.titulo}</div>
      <p className="font-mono text-[11px] text-steel mb-3">{ticket.descripcion}</p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          disabled={!anterior || actualizar.isPending}
          onClick={() => anterior && actualizar.mutate({ id: ticket.id, estado: anterior })}
          className="py-2.5 btn-ghost font-mono text-[11px] hover:-translate-y-px disabled:opacity-40"
        >
          ← {anterior ? ETIQUETA_ESTADO[anterior] : "Sin retroceso"}
        </button>
        <button
          disabled={!siguiente || actualizar.isPending || (requiereCierre && !cierreListo)}
          onClick={() =>
            siguiente &&
            actualizar.mutate({
              id: ticket.id,
              estado: siguiente,
              ...(requiereCierre
                ? {
                    notas_cierre: notas,
                    valor_total: Math.round(valorNumero * 100) / 100,
                    cobro_en: new Date().toISOString(),
                  }
                : {}),
            })
          }
          className={`py-2.5 font-mono text-[11px] hover:-translate-y-px disabled:opacity-40 ${
            requiereCierre ? "btn-signal" : "btn-amber"
          }`}
        >
          {siguiente ? `${ETIQUETA_ESTADO[siguiente]} ✓` : "Completado"}
        </button>
      </div>

      <label className="field-label">VALOR TOTAL A COBRAR (USD)</label>
      <input
        inputMode="decimal"
        placeholder="0.00"
        className="field font-mono text-amber"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
      {valorValido && (
        <p className="mt-2 font-mono text-[10px] text-steel">
          Cliente paga {moneda(valorNumero)} · empresa 15% {moneda(valorNumero * 0.15)} ·
          tu liquidación 85% {moneda(valorNumero * 0.85)}
        </p>
      )}

      <label className="field-label mt-3">NOTAS TÉCNICAS DEL CIERRE</label>
      <textarea
        rows={2}
        placeholder="Trabajo realizado, repuestos, evidencias…"
        className="field resize-none"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
      />
      {requiereCierre && !cierreListo && (
        <p className="mt-2 font-mono text-[10px] text-warn">
          Para finalizar registra las notas de cierre y el valor total a cobrar; el cliente
          lo verá al instante.
        </p>
      )}
    </Panel>
  );
}
