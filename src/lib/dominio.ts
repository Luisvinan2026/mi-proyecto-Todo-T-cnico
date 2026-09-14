export type Rol = "usuario" | "tecnico" | "admin";
export type EstadoPerfil = "activo" | "pendiente_aprobacion" | "suspendido";
export type EstadoTicket =
  | "pendiente"
  | "asignado"
  | "en_camino"
  | "en_proceso"
  | "finalizado";
export type Urgencia = "baja" | "media" | "alta" | "critica";

export const ESTADOS_TICKET: EstadoTicket[] = [
  "pendiente",
  "asignado",
  "en_camino",
  "en_proceso",
  "finalizado",
];

export const ETIQUETA_ESTADO: Record<EstadoTicket, string> = {
  pendiente: "Pendiente",
  asignado: "Asignado",
  en_camino: "En Camino",
  en_proceso: "En Proceso",
  finalizado: "Finalizado",
};

export const ETIQUETA_ESTADO_CORTA: Record<EstadoTicket, string> = {
  pendiente: "PEND.",
  asignado: "ASIG.",
  en_camino: "CAMINO",
  en_proceso: "PROCESO",
  finalizado: "FIN.",
};

export const ETIQUETA_URGENCIA: Record<Urgencia, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica",
};

export const ETIQUETA_PERFIL: Record<EstadoPerfil, string> = {
  activo: "activo",
  pendiente_aprobacion: "pendiente",
  suspendido: "suspendido",
};

export const CATEGORIAS = [
  "Eléctricos",
  "Cámaras",
  "Cercas eléctricas",
  "Motores de garaje",
  "Porteros / Video porteros",
  "Centrales telefónicas",
  "Línea blanca",
] as const;

export function moneda(valor: number | null | undefined): string {
  if (valor == null) return "—";
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  }).format(valor);
}

export const ZONAS = ["Norte", "Centro", "Sur", "Este", "Oeste"] as const;

export function siguienteEstado(estado: EstadoTicket): EstadoTicket | null {
  const i = ESTADOS_TICKET.indexOf(estado);
  if (i < 0 || i >= ESTADOS_TICKET.length - 1) return null;
  return ESTADOS_TICKET[i + 1] ?? null;
}

export function anteriorEstado(estado: EstadoTicket): EstadoTicket | null {
  const i = ESTADOS_TICKET.indexOf(estado);
  if (i <= 1) return null; // no se puede volver antes de "asignado"
  return ESTADOS_TICKET[i - 1] ?? null;
}

export function progresoEstado(estado: EstadoTicket): number {
  const i = ESTADOS_TICKET.indexOf(estado);
  return (i / (ESTADOS_TICKET.length - 1)) * 100;
}

export function colorUrgencia(u: Urgencia): string {
  if (u === "critica") return "text-danger";
  if (u === "alta") return "text-amber";
  if (u === "media") return "text-warn";
  return "text-steel";
}

export function codigoTicket(id: string): string {
  return `TCK-${id.slice(0, 4).toUpperCase()}`;
}

export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "··";
  return partes
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function rutaPorRol(rol: Rol): "/panel" | "/tecnico" | "/admin" {
  if (rol === "admin") return "/admin";
  if (rol === "tecnico") return "/tecnico";
  return "/panel";
}
