/** Ayudas de rangos de fechas usadas por el módulo de finanzas. */

/** Lunes de la semana a la que pertenece `fecha`, a las 00:00. */
export function inicioSemana(fecha) {
  const d = new Date(fecha);
  const dia = d.getDay(); // 0 = domingo
  const diff = (dia === 0 ? -6 : 1) - dia; // arranca en lunes
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Filtra registros con `fechaISO` dentro del rango [desde, hasta] inclusive.
 * Un extremo vacío significa "sin límite por ese lado".
 */
export function filtrarPorRango(lista, desdeStr, hastaStr) {
  const desde = desdeStr ? new Date(`${desdeStr}T00:00:00`) : null;
  const hasta = hastaStr ? new Date(`${hastaStr}T23:59:59`) : null;
  return lista.filter((p) => {
    const d = new Date(p.fechaISO);
    if (desde && d < desde) return false;
    if (hasta && d > hasta) return false;
    return true;
  });
}
