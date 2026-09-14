import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Cabecera, Estrellas, Panel, RailEstado } from "@/components/Consola";
import { PantallaContrato } from "@/components/Contrato";
import { usePerfil } from "@/hooks/useSesion";
import {
  useContratoFirmado,
  useDatosBancarios,
  useFirmarContrato,
} from "@/hooks/useContratos";
import { CONTRATO_CLIENTE } from "@/lib/contratos";
import {
  useCrearResena,
  useCrearTicket,
  useMisTickets,
  useResenas,
  useTicketsEnVivo,
  type Ticket,
} from "@/hooks/useTickets";
import {
  CATEGORIAS,
  ETIQUETA_ESTADO,
  ETIQUETA_URGENCIA,
  ZONAS,
  codigoTicket,
  moneda,
  rutaPorRol,
  type Urgencia,
} from "@/lib/dominio";

export const Route = createFileRoute("/_authenticated/panel")({
  head: () => ({
    meta: [
      { title: "Mis servicios · Dispatch7" },
      {
        name: "description",
        content:
          "Solicita soporte técnico, sigue el estado en tiempo real, califica al técnico y paga por los canales oficiales.",
      },
      { property: "og:title", content: "Mis servicios · Dispatch7" },
      {
        property: "og:description",
        content: "Historial de servicios, cobro y seguimiento en vivo de tu solicitud.",
      },
    ],
  }),
  component: PanelUsuario,
});

function PanelUsuario() {
  const navigate = useNavigate();
  const { userId, perfil, rol, cargando } = usePerfil();
  useTicketsEnVivo();

  const { data: firmado, isLoading: cargandoContrato } = useContratoFirmado(
    userId,
    "cliente",
  );
  const firmar = useFirmarContrato(userId);

  const { data: tickets = [] } = useMisTickets(userId);
  const crearTicket = useCrearTicket(userId);
  const crearResena = useCrearResena();

  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);
  const [urgencia, setUrgencia] = useState<Urgencia>("media");
  const [zona, setZona] = useState<string>(ZONAS[0]);

  const activo = useMemo(
    () => tickets.find((t) => t.estado !== "finalizado") ?? null,
    [tickets],
  );
  const finalizados = useMemo(
    () => tickets.filter((t) => t.estado === "finalizado"),
    [tickets],
  );
  const { data: resenas = [] } = useResenas(finalizados.map((t) => t.id));
  const porCalificar = finalizados.find(
    (t) => !resenas.some((r) => r.ticket_id === t.id),
  );
  const porPagar = finalizados.find(
    (t) => t.valor_total != null && resenas.some((r) => r.ticket_id === t.id) && !t.pagado,
  );

  if (!cargando && rol && rol !== "usuario") {
    void navigate({ to: rutaPorRol(rol), replace: true });
  }

  if (!cargando && !cargandoContrato && userId && firmado === false) {
    return (
      <PantallaContrato
        titulo="Términos y condiciones del cliente"
        subtitulo="Antes de solicitar un servicio, acepta las condiciones que rigen el uso de Dispatch7."
        clausulas={CONTRATO_CLIENTE}
        etiquetaBoton="Acepto los términos y continuar"
        enviando={firmar.isPending}
        error={firmar.error ? "No se pudo registrar la aceptación." : null}
        onFirmar={() => firmar.mutate("cliente")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-carbon">
      <Cabecera
        nombre={perfil?.nombre_completo ?? "…"}
        rol="usuario"
        etiquetaVivo="SEGUIMIENTO EN VIVO"
      />

      <main className="max-w-6xl mx-auto px-5 py-10 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-semibold text-xl md:text-2xl tracking-tight text-paper">
            Panel del usuario
          </h1>
          <span className="font-mono text-[11px] text-steel tracking-wide">
            MÓVIL PRIMERO
          </span>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,380px)_1fr] gap-6 items-start">
          <div className="mx-auto w-full max-w-[380px]">
            <div className="panel p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-mono text-[10px] text-steel tracking-[0.15em]">
                    HOLA, {(perfil?.nombre_completo ?? "").split(" ")[0]?.toUpperCase()}
                  </div>
                  <div className="font-semibold text-paper">Historial de servicios</div>
                </div>
              </div>

              {activo ? (
                <div className="panel-inset p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] tracking-[0.15em] text-amber">
                      {codigoTicket(activo.id)} ·{" "}
                      {ETIQUETA_ESTADO[activo.estado].toUpperCase()}
                    </span>
                    <span className="font-mono text-[10px] text-steel">
                      {new Date(activo.actualizado_en).toLocaleTimeString("es", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-paper mb-4">{activo.titulo}</div>
                  <RailEstado estado={activo.estado} compacto />
                </div>
              ) : (
                <div className="panel-inset p-4 rounded-xl text-sm text-steel">
                  No tienes servicios en curso.
                </div>
              )}

              <div className="mt-3 space-y-2">
                {tickets
                  .filter((t) => t.id !== activo?.id)
                  .map((t) => (
                    <FilaHistorial
                      key={t.id}
                      ticket={t}
                      puntuacion={
                        resenas.find((r) => r.ticket_id === t.id)?.puntuacion ?? null
                      }
                    />
                  ))}
                {tickets.length === 0 && (
                  <p className="font-mono text-[11px] text-steel-2 py-2">
                    Aún no has solicitado soporte.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 panel p-3 sticky bottom-3">
              <button
                onClick={() => setFormularioAbierto((v) => !v)}
                className="w-full py-3.5 btn-amber text-sm hover:-translate-y-px active:translate-y-0"
              >
                {formularioAbierto ? "Cerrar formulario" : "+ Solicitar Soporte Técnico"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {porCalificar && porCalificar.valor_total != null && (
              <PantallaCobro
                ticket={porCalificar}
                enviando={crearResena.isPending}
                onEnviar={(puntuacion, puntuacionApp, comentario) =>
                  crearResena.mutate({
                    ticket_id: porCalificar.id,
                    puntuacion,
                    puntuacion_app: puntuacionApp,
                    comentario,
                  })
                }
              />
            )}

            {porPagar && <DatosBancarios ticket={porPagar} />}

            {porCalificar && porCalificar.valor_total == null && (
              <CalificarServicio
                ticket={porCalificar}
                enviando={crearResena.isPending}
                onEnviar={(puntuacion, puntuacionApp, comentario) =>
                  crearResena.mutate({
                    ticket_id: porCalificar.id,
                    puntuacion,
                    puntuacion_app: puntuacionApp,
                    comentario,
                  })
                }
              />
            )}

            <div className={formularioAbierto ? "block" : "hidden lg:block"}>
              <Panel
                titulo="Nueva solicitud"
                extra={
                  <span className="font-mono text-[10px] text-amber tracking-[0.15em]">
                    FORMULARIO
                  </span>
                }
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    crearTicket.mutate(
                      { titulo, descripcion, categoria, urgencia, zona },
                      {
                        onSuccess: () => {
                          setTitulo("");
                          setDescripcion("");
                          setFormularioAbierto(false);
                        },
                      },
                    );
                  }}
                >
                  <label className="field-label">TÍTULO</label>
                  <input
                    className="field"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                  />
                  <label className="field-label mt-3">DESCRIPCIÓN DEL PROBLEMA</label>
                  <textarea
                    rows={3}
                    className="field resize-none"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    required
                  />
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <label className="field-label">CATEGORÍA</label>
                      <select
                        className="field"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                      >
                        {CATEGORIAS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="field-label">URGENCIA</label>
                      <select
                        className="field text-amber"
                        value={urgencia}
                        onChange={(e) => setUrgencia(e.target.value as Urgencia)}
                      >
                        {(Object.keys(ETIQUETA_URGENCIA) as Urgencia[]).map((u) => (
                          <option key={u} value={u}>
                            {ETIQUETA_URGENCIA[u]}
                          </option>
                        ))}
                      </select>
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
                  {crearTicket.error && (
                    <p className="mt-3 font-mono text-[11px] text-danger">
                      {perfil?.estado === "suspendido"
                        ? "Tu cuenta está suspendida."
                        : "No se pudo enviar la solicitud."}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={crearTicket.isPending}
                    className="mt-4 w-full py-3 btn-ghost text-sm hover:-translate-y-px disabled:opacity-60"
                  >
                    Enviar solicitud
                  </button>
                </form>
              </Panel>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function FilaHistorial({
  ticket,
  puntuacion,
}: {
  ticket: Ticket;
  puntuacion: number | null;
}) {
  return (
    <div className="panel-inset p-3 flex items-center gap-3">
      <span
        className={`size-2 rounded-full shrink-0 ${
          ticket.estado === "finalizado" ? "bg-signal" : "bg-amber"
        }`}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-paper truncate">{ticket.titulo}</div>
        <div className="font-mono text-[10px] text-steel-2">
          {codigoTicket(ticket.id)} · {ETIQUETA_ESTADO[ticket.estado].toUpperCase()}
          {ticket.valor_total != null && ` · ${moneda(ticket.valor_total)}`}
        </div>
      </div>
      <div className="font-mono text-[11px] text-amber-2">
        {puntuacion ? "★".repeat(puntuacion) : "—"}
      </div>
    </div>
  );
}

/** Total a pagar + calificación obligatoria antes de mostrar los datos bancarios. */
function PantallaCobro({
  ticket,
  onEnviar,
  enviando,
}: {
  ticket: Ticket;
  onEnviar: (puntuacion: number, puntuacionApp: number, comentario: string) => void;
  enviando: boolean;
}) {
  return (
    <Panel
      titulo="Servicio finalizado · Total a pagar"
      extra={
        <span className="font-mono text-[10px] text-amber tracking-[0.15em]">
          {codigoTicket(ticket.id)}
        </span>
      }
    >
      <div className="panel-inset rounded-xl p-5 text-center">
        <div className="font-mono text-[10px] text-steel tracking-[0.2em]">
          TOTAL A PAGAR
        </div>
        <div className="font-mono text-4xl text-amber-2 mt-2">
          {moneda(ticket.valor_total)}
        </div>
        <div className="font-mono text-[11px] text-steel-2 mt-2">{ticket.titulo}</div>
        {ticket.notas_cierre && (
          <p className="text-[13px] text-steel mt-3">{ticket.notas_cierre}</p>
        )}
      </div>

      <p className="mt-4 text-[13px] text-steel">
        Para ver los datos bancarios y realizar tu transferencia, primero califica el
        servicio. Recuerda: nunca pagues en efectivo ni a cuentas personales del técnico.
      </p>

      <div className="mt-4">
        <FormularioCalificacion onEnviar={onEnviar} enviando={enviando} />
      </div>
    </Panel>
  );
}

function CalificarServicio({
  ticket,
  onEnviar,
  enviando,
}: {
  ticket: Ticket;
  onEnviar: (puntuacion: number, puntuacionApp: number, comentario: string) => void;
  enviando: boolean;
}) {
  return (
    <Panel
      titulo="Calificar servicio"
      extra={
        <span className="font-mono text-[10px] text-steel-2">
          {codigoTicket(ticket.id)}
        </span>
      }
    >
      <FormularioCalificacion onEnviar={onEnviar} enviando={enviando} />
    </Panel>
  );
}

function FormularioCalificacion({
  onEnviar,
  enviando,
}: {
  onEnviar: (puntuacion: number, puntuacionApp: number, comentario: string) => void;
  enviando: boolean;
}) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [puntuacionApp, setPuntuacionApp] = useState(0);
  const [comentario, setComentario] = useState("");
  const listo = puntuacion > 0 && puntuacionApp > 0 && comentario.trim().length >= 3;

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <div className="field-label">CALIFICA AL TÉCNICO</div>
          <Estrellas valor={puntuacion} onCambio={setPuntuacion} />
        </div>
        <div>
          <div className="field-label">CALIFICA LA APLICACIÓN</div>
          <Estrellas valor={puntuacionApp} onCambio={setPuntuacionApp} />
        </div>
      </div>
      <textarea
        rows={2}
        placeholder="Comentario sobre el técnico y el servicio…"
        className="field resize-none mt-3"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
      />
      <button
        onClick={() => onEnviar(puntuacion, puntuacionApp, comentario)}
        disabled={enviando || !listo}
        className="mt-3 w-full py-3 btn-amber text-sm hover:-translate-y-px disabled:opacity-40"
      >
        {enviando ? "Enviando…" : "Enviar calificación"}
      </button>
      {!listo && (
        <p className="mt-2 font-mono text-[10px] text-warn">
          La calificación del técnico, de la app y un comentario son obligatorios.
        </p>
      )}
    </div>
  );
}

function DatosBancarios({ ticket }: { ticket: Ticket }) {
  const { data: cuenta } = useDatosBancarios();

  return (
    <Panel
      titulo="Datos bancarios para tu transferencia"
      extra={
        <span className="font-mono text-[10px] text-signal tracking-[0.15em]">
          CALIFICACIÓN ENVIADA ✓
        </span>
      }
    >
      <div className="panel-inset rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-steel tracking-[0.2em]">
            TOTAL A TRANSFERIR
          </span>
          <span className="font-mono text-2xl text-amber-2">
            {moneda(ticket.valor_total)}
          </span>
        </div>
      </div>

      {cuenta ? (
        <dl className="mt-4 space-y-2 font-mono text-[12px]">
          <Dato etiqueta="BANCO" valor={cuenta.banco} />
          <Dato etiqueta="TIPO DE CUENTA" valor={cuenta.tipo_cuenta} />
          <Dato etiqueta="N° DE CUENTA" valor={cuenta.numero_cuenta} />
          <Dato etiqueta="RUC / ID" valor={cuenta.identificacion} />
          <Dato etiqueta="TITULAR" valor={cuenta.titular} />
        </dl>
      ) : (
        <p className="mt-4 font-mono text-[11px] text-steel-2">
          Datos bancarios no disponibles. Contacta a la empresa.
        </p>
      )}

      <p className="mt-4 text-[12px] text-steel">
        Realiza la transferencia únicamente a esta cuenta de la empresa y conserva el
        comprobante. Los pagos en efectivo o a cuentas personales del técnico no tienen
        respaldo ni garantía.
      </p>
    </Panel>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-carbon-4/60 pb-2">
      <dt className="text-steel-2 text-[10px] tracking-[0.15em]">{etiqueta}</dt>
      <dd className="text-paper">{valor}</dd>
    </div>
  );
}
