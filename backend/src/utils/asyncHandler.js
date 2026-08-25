/**
 * Envuelve un controlador async para que sus rechazos lleguen al middleware de
 * errores. Sin esto, una promesa rechazada dejaría la petición colgada.
 */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
