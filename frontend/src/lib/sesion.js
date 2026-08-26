/**
 * Sesión guardada en el navegador.
 *
 * Guarda a qué tienda se entró y con qué modo, para que recargar la página no
 * obligue a identificarse otra vez. El token solo existe en modo administrador:
 * el modo cliente no necesita ninguno porque no autoriza nada.
 *
 * Todo va envuelto en try/catch a propósito. En navegación privada, con las
 * cookies bloqueadas o si el almacenamiento está lleno, `localStorage` lanza; y
 * quedarse sin sesión persistente es molesto, pero romper la aplicación entera
 * por eso sería peor.
 */
const CLAVE = "pt:sesion";

export const MODO = { admin: "admin", cliente: "cliente" };

/** @returns {{modo: string, idNegocio: string, nombreTienda: string, token?: string}|null} */
export function leerSesion() {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const sesion = JSON.parse(crudo);
    // Una sesión sin tienda o sin modo conocido no sirve para nada.
    if (!sesion?.idNegocio || !Object.values(MODO).includes(sesion.modo)) return null;
    return sesion;
  } catch (err) {
    console.warn("[sesion] no se pudo leer la sesión guardada:", err.message);
    return null;
  }
}

/** Guarda la sesión. Devuelve la misma que recibió, se haya podido escribir o no. */
export function guardarSesion(sesion) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(sesion));
  } catch (err) {
    console.warn("[sesion] no se pudo guardar la sesión:", err.message);
  }
  return sesion;
}

export function borrarSesion() {
  try {
    localStorage.removeItem(CLAVE);
  } catch (err) {
    console.warn("[sesion] no se pudo borrar la sesión:", err.message);
  }
}
