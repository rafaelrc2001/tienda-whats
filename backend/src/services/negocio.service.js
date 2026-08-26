/**
 * Configuración del negocio.
 * Normaliza lo que llega del cliente antes de guardarlo: la tabla tiene una
 * columna por dato y no admite campos sueltos ni tipos inesperados.
 */
import { NEGOCIO_POR_DEFECTO, negocioRepository } from "../repositories/negocio.repository.js";
import { esObjeto, numeroOCero } from "../utils/validacion.js";

function normalizarUbicacion(u) {
  if (!esObjeto(u)) return null;
  const lat = Number(u.lat);
  const lng = Number(u.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function normalizarHorario(h) {
  const base = NEGOCIO_POR_DEFECTO.horario;
  if (!esObjeto(h)) return { ...base, dias: { ...base.dias } };
  const dias = esObjeto(h.dias) ? h.dias : base.dias;
  return {
    dias: Object.fromEntries(Object.keys(base.dias).map((k) => [k, Boolean(dias[k])])),
    apertura: typeof h.apertura === "string" ? h.apertura : base.apertura,
    cierre: typeof h.cierre === "string" ? h.cierre : base.cierre,
    atenderFuera: Boolean(h.atenderFuera),
    recargo: numeroOCero(h.recargo),
  };
}

function normalizar(entrada) {
  const banco = esObjeto(entrada.banco) ? entrada.banco : {};
  return {
    nombre: String(entrada.nombre || "").trim(),
    telefono: String(entrada.telefono || "").trim(),
    ubicacion: normalizarUbicacion(entrada.ubicacion),
    banco: {
      nombre: String(banco.nombre || "").trim(),
      beneficiario: String(banco.beneficiario || "").trim(),
      numeroCuenta: String(banco.numeroCuenta || "").trim(),
    },
    skinId: String(entrada.skinId || NEGOCIO_POR_DEFECTO.skinId),
    horario: normalizarHorario(entrada.horario),
  };
}

export const negocioService = {
  obtener: (idNegocio) => negocioRepository.obtener(idNegocio),

  /** Reemplaza la configuración completa y devuelve la versión ya normalizada. */
  guardar: (idNegocio, entrada) => negocioRepository.guardar(idNegocio, normalizar(entrada)),
};
