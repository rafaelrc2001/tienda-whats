import { config } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

/**
 * Último middleware de la cadena: convierte cualquier error en una respuesta JSON.
 * Los AppError salen con su código y su mensaje; el resto se registra completo en
 * el servidor y se reporta como 500 sin filtrar detalles internos al cliente.
 */
export function errorHandler(err, _req, res, _next) {
  const esConocido = err instanceof AppError;
  const estado = esConocido ? err.estado : 500;

  if (!esConocido) console.error("[error]", err);

  res.status(estado).json({
    error: esConocido ? err.message : "Error interno del servidor",
    ...(esConocido && err.detalles ? { detalles: err.detalles } : {}),
    ...(config.esProduccion || esConocido ? {} : { stack: err.stack }),
  });
}
