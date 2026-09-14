import { useState } from "react";

import { Marca } from "@/components/Consola";
import type { ClausulaContrato } from "@/lib/contratos";

export function PantallaContrato({
  titulo,
  subtitulo,
  clausulas,
  etiquetaBoton,
  enviando,
  error,
  extra,
  puedeFirmar = true,
  onFirmar,
}: {
  titulo: string;
  subtitulo: string;
  clausulas: ClausulaContrato[];
  etiquetaBoton: string;
  enviando?: boolean;
  error?: string | null;
  extra?: React.ReactNode;
  puedeFirmar?: boolean;
  onFirmar: () => void;
}) {
  const [marcadas, setMarcadas] = useState<Record<string, boolean>>({});
  const todas = clausulas.every((c) => marcadas[c.clave]);

  return (
    <div className="min-h-screen bg-carbon">
      <div className="max-w-3xl mx-auto px-5 py-10 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <Marca />
          <span className="font-mono text-[10px] text-steel tracking-[0.15em]">
            CONTRATO DIGITAL
          </span>
        </div>

        <div className="panel p-5 md:p-7">
          <h1 className="font-semibold text-xl text-paper tracking-tight">{titulo}</h1>
          <p className="text-sm text-steel mt-1">{subtitulo}</p>

          <div className="mt-6 space-y-3">
            {clausulas.map((c, i) => (
              <label
                key={c.clave}
                className={`block panel-inset rounded-xl p-4 cursor-pointer transition-colors ${
                  marcadas[c.clave] ? "ring-1 ring-signal/50" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-[var(--amber)] shrink-0"
                    checked={!!marcadas[c.clave]}
                    onChange={(e) =>
                      setMarcadas((m) => ({ ...m, [c.clave]: e.target.checked }))
                    }
                  />
                  <div>
                    <div className="font-mono text-[10px] text-steel-2 tracking-[0.15em] mb-1">
                      CLÁUSULA {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="text-sm text-paper font-medium">{c.titulo}</div>
                    <p className="text-[13px] text-steel mt-1.5 leading-relaxed">
                      {c.texto}
                    </p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {extra}

          {error && <p className="mt-4 font-mono text-[11px] text-danger">{error}</p>}

          <p className="mt-5 font-mono text-[10px] text-steel-2">
            {todas
              ? "TODAS LAS CLÁUSULAS ACEPTADAS"
              : `FALTAN ${clausulas.filter((c) => !marcadas[c.clave]).length} CLÁUSULAS POR ACEPTAR`}
          </p>

          <button
            disabled={!todas || !puedeFirmar || enviando}
            onClick={onFirmar}
            className="mt-3 w-full py-3.5 btn-amber text-sm hover:-translate-y-px disabled:opacity-40"
          >
            {enviando ? "Registrando firma…" : etiquetaBoton}
          </button>
        </div>
      </div>
    </div>
  );
}
