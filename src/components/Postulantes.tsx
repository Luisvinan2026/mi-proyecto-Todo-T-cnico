import { useState } from "react";

import { Panel } from "@/components/Consola";
import { urlFirmadaCV } from "@/hooks/usePostulaciones";
import type { PerfilConRol } from "@/hooks/useAdministracion";

export function PanelPostulantes({
  postulantes,
  onAceptar,
  onDenegar,
  procesando,
}: {
  postulantes: PerfilConRol[];
  onAceptar: (id: string) => void;
  onDenegar: (id: string) => void;
  procesando: boolean;
}) {
  const [abriendo, setAbriendo] = useState<string | null>(null);

  async function verCV(ruta: string) {
    setAbriendo(ruta);
    const url = await urlFirmadaCV(ruta);
    setAbriendo(null);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Panel
      titulo="Postulantes a técnico"
      extra={
        <span className="font-mono text-[10px] text-warn">
          {postulantes.length} EN REVISIÓN
        </span>
      }
    >
      <div className="space-y-2.5">
        {postulantes.map((p) => (
          <div key={p.id} className="panel-inset rounded-xl p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-paper truncate">{p.nombre_completo}</div>
                <div className="font-mono text-[11px] text-steel">
                  {p.zona ?? "Sin zona"} · {p.telefono ?? "Sin teléfono"}
                  {p.cedula ? ` · ${p.cedula}` : ""}
                </div>
              </div>
              <span className="font-mono text-[10px] text-warn shrink-0">PENDIENTE</span>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2">
              {p.cv_ruta ? (
                <button
                  onClick={() => void verCV(p.cv_ruta!)}
                  className="px-3 py-1.5 btn-ghost font-mono text-[11px]"
                >
                  {abriendo === p.cv_ruta
                    ? "Abriendo…"
                    : `Ver CV · ${p.cv_nombre ?? "documento"}`}
                </button>
              ) : (
                <span className="font-mono text-[11px] text-danger">Sin CV adjunto</span>
              )}
              <button
                disabled={procesando}
                onClick={() => onAceptar(p.id)}
                className="px-3 py-1.5 rounded-md bg-signal/15 text-signal font-mono text-[11px] disabled:opacity-40"
              >
                Aceptar solicitud
              </button>
              <button
                disabled={procesando}
                onClick={() => onDenegar(p.id)}
                className="px-3 py-1.5 rounded-md bg-danger/15 text-danger font-mono text-[11px] disabled:opacity-40"
              >
                Denegar solicitud
              </button>
            </div>
          </div>
        ))}
        {postulantes.length === 0 && (
          <p className="font-mono text-[11px] text-steel-2">
            No hay postulaciones pendientes.
          </p>
        )}
      </div>
    </Panel>
  );
}
