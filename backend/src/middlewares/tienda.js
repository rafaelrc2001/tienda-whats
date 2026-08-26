/**
 * Resolución de la tienda y del modo de acceso.
 *
 * Toda petición de datos dice a qué negocio va con la cabecera `X-Negocio`, y
 * si además trae un `Authorization: Bearer <token>` válido para ese mismo
 * negocio, entra en modo administrador. Sin token —o con uno que no sirve— la
 * petición es de modo cliente, que solo puede ver el catálogo y crear pedidos.
 *
 * El modo se decide aquí y no en el frontend a propósito: ocultar botones no
 * protege nada, porque la API se puede llamar directamente.
 */
import { accesoService } from "../services/acceso.service.js";
import { ESTATUS, cuentasService } from "../services/cuentas.service.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { tokenDeCabecera } from "../utils/token.js";

export const MODO = { admin: "admin", cliente: "cliente" };

/** Deja en `req.tienda` el `{ id, modo }` de la petición. */
export const resolverTienda = asyncHandler(async (req, _res, next) => {
  const idNegocio = String(req.get("x-negocio") || "").trim().toLowerCase();
  if (!idNegocio) {
    throw AppError.peticionInvalida("Falta la cabecera X-Negocio con el ID del negocio.");
  }

  const cuenta = await cuentasService.buscarPorIdNegocio(idNegocio);
  if (!cuenta) throw AppError.noEncontrado("Esa tienda no existe.");

  if (cuenta.estatus !== ESTATUS.activo) {
    throw AppError.prohibido("Esa tienda está suspendida.");
  }

  // Un token válido pero emitido para otra tienda no da permisos aquí: la
  // petición sigue adelante como cliente, igual que si no hubiera token.
  const sesion = await accesoService.sesionDe(tokenDeCabecera(req));
  const esAdmin = sesion?.idNegocio === cuenta.idNegocio;

  req.tienda = { id: cuenta.idNegocio, modo: esAdmin ? MODO.admin : MODO.cliente };
  next();
});

/** Corta la petición si no viene de una sesión de administrador de esa tienda. */
export function exigirAdmin(req, _res, next) {
  if (req.tienda?.modo !== MODO.admin) {
    return next(AppError.prohibido("Esta sección es solo para el administrador de la tienda."));
  }
  return next();
}
