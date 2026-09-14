import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import {
  ESTADOS_TICKET,
  ETIQUETA_ESTADO_CORTA,
  iniciales,
  progresoEstado,
  type EstadoTicket,
  type Rol,
} from "@/lib/dominio";
import { useCerrarSesion } from "@/hooks/useSesion";

export function Marca() {
  return (
    <div className="flex items-center gap-3">
      <div className="size-9 rounded-md bg-amber grid place-items-center text-carbon font-mono font-semibold text-sm tracking-tight">
        D7
      </div>
      <div>
        <div className="font-semibold text-paper leading-none tracking-tight text-lg">
          DISPATCH<span className="text-amber">7</span>
        </div>
        <div className="font-mono text-[10px] text-steel tracking-[0.2em] mt-1">
          SOPORTE TÉCNICO · ON-PREM
        </div>
      </div>
    </div>
  );
}

export function PuntoVivo({ etiqueta }: { etiqueta: string }) {
  return (
    <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-steel">
      <span className="size-2 rounded-full bg-signal pulse-live" /> {etiqueta}
    </div>
  );
}

export function Cabecera({
  nombre,
  rol,
  etiquetaVivo,
}: {
  nombre: string;
  rol: Rol;
  etiquetaVivo: string;
}) {
  const cerrarSesion = useCerrarSesion();
  const etiquetaRol =
    rol === "admin" ? "ADMINISTRADOR" : rol === "tecnico" ? "TÉCNICO" : "USUARIO";

  return (
    <header className="border-b border-carbon-4 bg-carbon-2">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between gap-4">
        <Link to="/">
          <Marca />
        </Link>
        <div className="flex items-center gap-3">
          <PuntoVivo etiqueta={etiquetaVivo} />
          <div className="hidden md:block text-right">
            <div className="font-mono text-[10px] text-steel tracking-[0.15em]">
              {etiquetaRol}
            </div>
            <div className="text-sm text-paper leading-tight">{nombre}</div>
          </div>
          <div className="size-9 rounded-full bg-carbon-3 grid place-items-center font-mono text-xs text-amber ring-1 ring-carbon-4">
            {iniciales(nombre)}
          </div>
          <button
            onClick={() => void cerrarSesion()}
            className="px-3 py-2 btn-ghost font-mono text-[11px] hover:-translate-y-px"
          >
            SALIR
          </button>
        </div>
      </div>
    </header>
  );
}

export function RailEstado({
  estado,
  compacto = false,
}: {
  estado: EstadoTicket;
  compacto?: boolean;
}) {
  const indiceActual = ESTADOS_TICKET.indexOf(estado);
  const tamano = compacto ? "size-2.5" : "size-3";

  return (
    <div>
      <div className="relative">
        <div className="flex justify-between">
          {ESTADOS_TICKET.map((e, i) => (
            <span
              key={e}
              className={`${tamano} rounded-full ${
                i < indiceActual
                  ? "bg-amber"
                  : i === indiceActual
                    ? "bg-signal pulse-live"
                    : "bg-carbon-4"
              }`}
            />
          ))}
        </div>
        <div className="absolute top-1/2 left-1 right-1 -translate-y-1/2 h-0.5 bg-carbon-4 -z-10" />
        <div
          className="rail-fill absolute top-1/2 left-1 -translate-y-1/2 h-0.5 bg-amber"
          style={{ width: `${progresoEstado(estado)}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 font-mono text-[9px] text-steel-2">
        {ESTADOS_TICKET.map((e) => (
          <span key={e} className={e === estado ? "text-signal" : undefined}>
            {ETIQUETA_ESTADO_CORTA[e]}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Estrellas({
  valor,
  onCambio,
  tamano = "text-2xl",
}: {
  valor: number;
  onCambio?: (v: number) => void;
  tamano?: string;
}) {
  return (
    <div className={`flex gap-1.5 font-mono ${tamano} text-amber-2`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onCambio}
          onClick={() => onCambio?.(n)}
          className={n <= valor ? "" : "text-steel-2"}
          aria-label={`${n} estrellas`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function Panel({
  titulo,
  extra,
  children,
  className = "",
}: {
  titulo: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel p-4 md:p-5 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold text-paper">{titulo}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}
