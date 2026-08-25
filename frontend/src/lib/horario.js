/**
 * Horario de servicio del negocio.
 *
 * Un horario es `{ dias: { lun..dom: bool }, apertura: "HH:MM", cierre: "HH:MM",
 * atenderFuera: bool, recargo: number }`. Contempla turnos que cruzan la medianoche
 * (una taquería de 18:00 a 02:00), donde el día marcado es el día en que ABRE el turno.
 */

export const DIAS = [
  { key: "lun", label: "Lun", idx: 1 },
  { key: "mar", label: "Mar", idx: 2 },
  { key: "mie", label: "Mié", idx: 3 },
  { key: "jue", label: "Jue", idx: 4 },
  { key: "vie", label: "Vie", idx: 5 },
  { key: "sab", label: "Sáb", idx: 6 },
  { key: "dom", label: "Dom", idx: 0 },
];

export const NOMBRE_DIA = { 0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado" };
export const KEY_POR_IDX = { 0: "dom", 1: "lun", 2: "mar", 3: "mie", 4: "jue", 5: "vie", 6: "sab" };

/** Horario por defecto de un negocio recién configurado. */
export const HORARIO_INICIAL = {
  dias: { lun: true, mar: true, mie: true, jue: true, vie: true, sab: true, dom: false },
  apertura: "08:00",
  cierre: "18:00",
  atenderFuera: false,
  recargo: 20,
};

/** "14:30" -> 870 minutos desde medianoche. */
export function minutosDeHora(hhmm) {
  const [h, m] = String(hhmm || "0:0").split(":").map(Number);
  return h * 60 + (m || 0);
}

/** true si el turno cruza la medianoche (ej. taquería de 18:00 a 02:00). */
export function cruzaMedianoche(horario) {
  return minutosDeHora(horario.cierre) < minutosDeHora(horario.apertura);
}

/** ¿El negocio está atendiendo en este momento? */
export function estaEnHorario(horario, fecha = new Date()) {
  const apertura = minutosDeHora(horario.apertura);
  const cierre = minutosDeHora(horario.cierre);
  const min = fecha.getHours() * 60 + fecha.getMinutes();
  const abiertoHoy = !!horario.dias[KEY_POR_IDX[fecha.getDay()]];

  // horario normal: apertura y cierre caen el mismo dia
  if (cierre >= apertura) return abiertoHoy && min >= apertura && min <= cierre;

  // horario nocturno: el turno arranca un dia y termina en la madrugada del siguiente.
  // El dia marcado en "Dias con servicio" es el dia en que ABRE el turno.
  if (min >= apertura) return abiertoHoy; // turno que abrio hoy y sigue corriendo
  if (min <= cierre) {                    // madrugada del turno que abrio ayer
    const ayer = new Date(fecha);
    ayer.setDate(ayer.getDate() - 1);
    return !!horario.dias[KEY_POR_IDX[ayer.getDay()]];
  }
  return false;
}

/** Texto y fecha de la próxima apertura ("mañana a partir de las 08:00"). */
export function proximaAtencion(horario, fecha = new Date()) {
  const aperturaMin = minutosDeHora(horario.apertura);
  for (let add = 0; add <= 7; add++) {
    const d = new Date(fecha);
    d.setDate(d.getDate() + add);
    const key = KEY_POR_IDX[d.getDay()];
    if (!horario.dias[key]) continue;
    const aperturaDate = new Date(d);
    aperturaDate.setHours(Math.floor(aperturaMin / 60), aperturaMin % 60, 0, 0);
    if (add === 0 && fecha >= aperturaDate) continue; // hoy ya pasó el horario de apertura
    const texto = add === 0 ? `hoy a partir de las ${horario.apertura}` : add === 1 ? `mañana a partir de las ${horario.apertura}` : `el ${NOMBRE_DIA[d.getDay()]} a partir de las ${horario.apertura}`;
    return { texto, fecha: aperturaDate };
  }
  return { texto: "próximamente", fecha: null };
}
