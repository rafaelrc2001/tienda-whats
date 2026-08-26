/**
 * Última dirección conocida de cada cliente, por teléfono (solo dígitos).
 *
 * La API la sigue tratando como un mapa `{ telefono: { direccion, gps } }`,
 * que es como lo espera la pantalla de Clientes; en la base es una fila por
 * teléfono, lo que permite leer una sola sin cargar el resto —justo lo que
 * necesita el modo cliente—.
 */
import { consultar, enTransaccion, primeraFila } from "../db/pool.js";

const CAMPOS = "telefono, direccion, gps_lat, gps_lng";

const aDireccion = (fila) => ({
  direccion: fila.direccion,
  gps: fila.gps_lat === null ? null : { lat: fila.gps_lat, lng: fila.gps_lng },
});

export const direccionesRepository = {
  /** El mapa completo de la tienda. */
  async listar(idNegocio) {
    const { rows } = await consultar(
      `SELECT ${CAMPOS} FROM direcciones WHERE id_negocio = $1 ORDER BY telefono`,
      [idNegocio]
    );
    return Object.fromEntries(rows.map((f) => [f.telefono, aDireccion(f)]));
  },

  /** La de un solo teléfono, o `null` si nunca ha pedido a esta tienda. */
  async obtenerDe(idNegocio, telefono) {
    const fila = await primeraFila(
      `SELECT ${CAMPOS} FROM direcciones WHERE id_negocio = $1 AND telefono = $2`,
      [idNegocio, telefono]
    );
    return fila && aDireccion(fila);
  },

  /** Guarda la de un teléfono sin tocar las demás. */
  async guardarDe(idNegocio, telefono, { direccion, gps }) {
    const fila = await primeraFila(
      `INSERT INTO direcciones (id_negocio, telefono, direccion, gps_lat, gps_lng)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id_negocio, telefono) DO UPDATE SET
           direccion      = EXCLUDED.direccion,
           gps_lat        = EXCLUDED.gps_lat,
           gps_lng        = EXCLUDED.gps_lng,
           actualizada_en = now()
       RETURNING ${CAMPOS}`,
      [idNegocio, telefono, direccion, gps?.lat ?? null, gps?.lng ?? null]
    );
    return aDireccion(fila);
  },

  /**
   * Reemplaza el mapa completo: lo que no venga en él, se borra.
   *
   * Es lo que hace la pantalla de Clientes al guardar, y por eso va en una
   * transacción: si fallara a mitad, la tienda se quedaría sin direcciones.
   */
  reemplazar(idNegocio, mapa) {
    const telefonos = Object.keys(mapa);

    return enTransaccion(async (cliente) => {
      await cliente.query("DELETE FROM direcciones WHERE id_negocio = $1", [idNegocio]);

      if (telefonos.length) {
        await cliente.query(
          `INSERT INTO direcciones (id_negocio, telefono, direccion, gps_lat, gps_lng)
           SELECT $1::text, *
             FROM unnest($2::text[], $3::text[], $4::float8[], $5::float8[])`,
          [
            idNegocio,
            telefonos,
            telefonos.map((t) => mapa[t].direccion),
            telefonos.map((t) => mapa[t].gps?.lat ?? null),
            telefonos.map((t) => mapa[t].gps?.lng ?? null),
          ]
        );
      }

      const { rows } = await cliente.query(
        `SELECT ${CAMPOS} FROM direcciones WHERE id_negocio = $1 ORDER BY telefono`,
        [idNegocio]
      );
      return Object.fromEntries(rows.map((f) => [f.telefono, aDireccion(f)]));
    });
  },
};
