export const VERSION_CONTRATO = "v1";

export interface ClausulaContrato {
  clave: string;
  titulo: string;
  texto: string;
}

export const CONTRATO_TECNICO: ClausulaContrato[] = [
  {
    clave: "reparto",
    titulo: "Reparto de ganancias (85% / 15%)",
    texto:
      "De cada servicio cobrado a través de Dispatch7, el 15% del valor total corresponde a la empresa por concepto de intermediación, plataforma, soporte y captación de clientes, y el 85% restante corresponde al técnico. La liquidación se calcula sobre el valor total registrado al cierre del servicio y se paga sobre el saldo acumulado del técnico.",
  },
  {
    clave: "responsabilidad",
    titulo: "Responsabilidad civil y calidad del trabajo",
    texto:
      "El técnico es responsable absoluto de la calidad, seguridad y correcta ejecución del trabajo realizado. Cualquier daño material, negligencia, instalación defectuosa o perjuicio ocasionado al cliente o a terceros será valorado por la empresa y descontado directamente de su remuneración o de su saldo acumulado, sin perjuicio de las acciones legales que correspondan.",
  },
  {
    clave: "puntualidad",
    titulo: "Puntualidad y cancelaciones",
    texto:
      "Al aceptar un servicio el técnico se compromete a asistir en el horario acordado. La cancelación de un servicio ya aceptado sin causa justificada, el abandono del trabajo o los retrasos reiterados generan penalizaciones económicas descontadas del saldo acumulado y pueden derivar en la suspensión o expulsión definitiva de la plataforma.",
  },
  {
    clave: "confidencialidad",
    titulo: "Confidencialidad y no elusión",
    texto:
      "Los datos de los clientes son confidenciales y de uso exclusivo dentro de la plataforma. Queda estrictamente prohibido cobrar por fuera de la aplicación, aceptar pagos en efectivo o transferencias personales, entregar contactos propios o pactar trabajos futuros de forma privada con clientes de Dispatch7. El incumplimiento implica la baja inmediata de la cuenta y su registro permanente en la lista negra.",
  },
];

export const CONTRATO_CLIENTE: ClausulaContrato[] = [
  {
    clave: "intermediario",
    titulo: "Dispatch7 es un intermediario de confianza",
    texto:
      "Dispatch7 conecta al cliente con técnicos independientes verificados en eléctricos, cámaras, cercas eléctricas, motores de garaje, porteros y video porteros, centrales telefónicas y línea blanca. La empresa gestiona la asignación, el seguimiento y el cobro, pero la ejecución material del trabajo corresponde al técnico asignado.",
  },
  {
    clave: "imprevistos",
    titulo: "Alcance de la responsabilidad",
    texto:
      "La empresa no se hace responsable de forma directa por imprevistos, demoras o daños causados por el técnico durante la visita; no obstante, se compromete a gestionar internamente todo reclamo, aplicar las sanciones contractuales correspondientes al técnico y acompañar al cliente hasta la resolución del caso.",
  },
  {
    clave: "pagos",
    titulo: "Pagos únicamente por los canales oficiales",
    texto:
      "El cliente se compromete a no realizar pagos directos en efectivo ni transferencias personales al técnico. Todo pago se realiza a la cuenta bancaria oficial de la empresa mostrada en la aplicación al finalizar el servicio. Los pagos fuera de la plataforma anulan la garantía y el respaldo de Dispatch7.",
  },
  {
    clave: "datos",
    titulo: "Datos, calificación y garantía",
    texto:
      "El cliente autoriza el uso de sus datos de contacto y ubicación para la prestación del servicio, y se compromete a calificar el trabajo al finalizar. La calificación es la herramienta de control de calidad que permite mantener o retirar técnicos de la plataforma.",
  },
];
