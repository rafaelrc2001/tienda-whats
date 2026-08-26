/**
 * Extracción del token de sesión.
 *
 * Vive suelto aquí porque lo necesitan dos sitios que no deberían depender el
 * uno del otro: el controlador de acceso, para cerrar sesión, y el middleware
 * que resuelve la tienda, para decidir si la petición es de administrador.
 */

/** Token del `Authorization: Bearer <token>`, o `null` si no viene o está mal formado. */
export function tokenDeCabecera(req) {
  const cabecera = req.get?.("authorization") || req.headers?.authorization || "";
  const [esquema, valor] = String(cabecera).split(" ");
  if (esquema?.toLowerCase() !== "bearer" || !valor) return null;
  return valor.trim() || null;
}
