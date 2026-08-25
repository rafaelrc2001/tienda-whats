/** Comprobaciones sueltas reutilizadas por los servicios. */
import { AppError } from "./AppError.js";

export const esObjeto = (v) => typeof v === "object" && v !== null && !Array.isArray(v);

/** Deja solo los dígitos: así se comparan los teléfonos en todo el sistema. */
export const digits = (s) => String(s || "").replace(/\D/g, "");

export function exigirObjeto(valor, campo) {
  if (!esObjeto(valor)) throw AppError.peticionInvalida(`"${campo}" debe ser un objeto.`);
  return valor;
}

export function exigirArreglo(valor, campo) {
  if (!Array.isArray(valor)) throw AppError.peticionInvalida(`"${campo}" debe ser un arreglo.`);
  return valor;
}

export function exigirTexto(valor, campo) {
  if (typeof valor !== "string" || !valor.trim()) {
    throw AppError.peticionInvalida(`"${campo}" es obligatorio.`);
  }
  return valor.trim();
}

export function numeroOCero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}
