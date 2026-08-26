/**
 * Sesiones de administrador abiertas, una fila por token.
 *
 * La clave foránea a `cuentas` hace sola algo que antes había que recordar: si
 * se borra una tienda, sus sesiones se van con ella y ningún token huérfano
 * sigue dando acceso.
 */
import { consultar, primeraFila } from "../db/pool.js";

export const sesionesRepository = {
  async crear(token, idNegocio) {
    await consultar("INSERT INTO sesiones (token, id_negocio) VALUES ($1, $2)", [
      token,
      idNegocio,
    ]);
  },

  /** @returns {Promise<{idNegocio: string, creadaISO: string}|null>} */
  async buscar(token) {
    const fila = await primeraFila(
      "SELECT id_negocio, creada_en FROM sesiones WHERE token = $1",
      [token]
    );
    return fila && { idNegocio: fila.id_negocio, creadaISO: fila.creada_en.toISOString() };
  },

  /** Borrar un token que ya no existe no es un error. */
  async borrar(token) {
    await consultar("DELETE FROM sesiones WHERE token = $1", [token]);
  },
};
