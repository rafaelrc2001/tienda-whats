/**
 * El enlace público de cada tienda.
 *
 * Cada negocio se abre con su propio link: `https://mi-tienda.com/abarrote-sjuan`.
 * El primer tramo de la ruta es el `idNegocio`, que es justo lo que el comprador
 * tenía que teclear a mano antes.
 *
 * Del lado del servidor no hace falta nada: la API ya devuelve `index.html` para
 * cualquier ruta que no empiece por `/api/`, así que el enlace entra en la
 * aplicación y es aquí donde se traduce a una sesión de cliente.
 */

/** Un id de negocio es un slug: minúsculas, dígitos y guiones. */
const SLUG = /^[a-z0-9-]+$/;

/**
 * Tramos que nunca son una tienda.
 *
 * `api` y `assets` los sirve el backend antes de llegar aquí, pero si alguna vez
 * se pide uno de ellos "a secas" cae en el catch-all y acabaría en esta función.
 * Mejor no salir a preguntarle al servidor por una tienda que no existe.
 */
const RESERVADOS = new Set(["api", "assets", "favicon.ico", "index.html", "robots.txt"]);

/**
 * ID de la tienda que pide la URL actual, o `null` si la URL no nombra ninguna.
 * @returns {string|null}
 */
export function slugDeUrl() {
  const tramo = window.location.pathname.split("/")[1] || "";
  if (!tramo || RESERVADOS.has(tramo) || !SLUG.test(tramo)) return null;
  return tramo;
}

/** El enlace que el dueño reparte a sus clientes. */
export function enlaceDeTienda(idNegocio) {
  if (!idNegocio) return "";
  return `${window.location.origin}/${idNegocio}`;
}

/**
 * Pone la barra de direcciones en la tienda activa, sin recargar ni apilar
 * historial: al entrar a una tienda su enlace queda listo para copiar, y al
 * cerrar sesión la URL vuelve a la raíz para no reabrir la tienda anterior.
 */
export function fijarUrlDeTienda(idNegocio) {
  const destino = idNegocio ? `/${idNegocio}` : "/";
  if (window.location.pathname === destino) return;
  try {
    window.history.replaceState(null, "", destino + window.location.search);
  } catch (err) {
    // Algún navegador muy restrictivo o un origen raro; el enlace sigue
    // funcionando, solo no se refleja en la barra.
    console.warn("[enlace] no se pudo actualizar la URL:", err.message);
  }
}
