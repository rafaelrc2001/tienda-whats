import { AppError } from "../utils/AppError.js";

/** Cualquier ruta de API que no exista termina aquí como un 404 controlado. */
export function notFound(req, _res, next) {
  next(AppError.noEncontrado(`No existe la ruta ${req.method} ${req.originalUrl}`));
}
