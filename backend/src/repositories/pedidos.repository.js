/**
 * Pedidos confirmados. Solo se agregan: son el histórico de ventas.
 *
 * Cada pedido son dos tablas —la cabecera y sus renglones—, así que se insertan
 * en una transacción: un pedido sin líneas no es un pedido a medias, es una
 * venta con total pero sin saber de qué.
 */
import { consultar, enTransaccion } from "../db/pool.js";

const CABECERA = "id_pedido, nombre, telefono, total, utilidad, fecha, fecha_iso";

/** Las mismas columnas, calificadas con el alias `p` de la tabla `pedidos`. */
const CABECERA_P = CABECERA.split(", ")
  .map((c) => `p.${c}`)
  .join(", ");

/** Subconsulta con los renglones de `p`, ya agrupados y en orden. */
const ITEMS_DE_P = `COALESCE(
         (SELECT json_agg(i ORDER BY i.posicion, i.id)
            FROM pedido_items i
           WHERE i.pedido_id = p.id),
         '[]'::json
       ) AS items`;

const aCabecera = (fila) => ({
  id: fila.id_pedido,
  nombre: fila.nombre,
  telefono: fila.telefono,
  total: fila.total,
  utilidad: fila.utilidad,
  fecha: fila.fecha,
  fechaISO: fila.fecha_iso.toISOString(),
});

const aItem = (fila) => ({
  id: fila.id_producto,
  producto: fila.producto,
  categoria: fila.categoria,
  unidad: fila.unidad,
  cantidad: fila.cantidad,
  precioVenta: fila.precio_venta,
  precioCosto: fila.precio_costo,
});

/** Inserta los renglones de un pedido de una sola vez. */
function insertarItems(cliente, pedidoId, items) {
  return cliente.query(
    `INSERT INTO pedido_items
       (pedido_id, posicion, id_producto, producto, categoria, unidad,
        cantidad, precio_venta, precio_costo)
     SELECT $1::bigint, *
       FROM unnest(
         $2::integer[], $3::text[], $4::text[], $5::text[],
         $6::text[], $7::numeric[], $8::numeric[], $9::numeric[]
       )`,
    [
      pedidoId,
      items.map((_, i) => i),
      items.map((i) => i.id),
      items.map((i) => i.producto),
      items.map((i) => i.categoria),
      items.map((i) => i.unidad),
      items.map((i) => i.cantidad),
      items.map((i) => i.precioVenta),
      items.map((i) => i.precioCosto),
    ]
  );
}

export const pedidosRepository = {
  /**
   * Histórico completo, cada pedido con sus renglones.
   *
   * Se traen las dos tablas en una sola consulta y los renglones ya agrupados
   * como JSON: hacer una consulta de items por pedido sería el problema clásico
   * de las N+1 consultas.
   */
  async listar(idNegocio) {
    const { rows } = await consultar(
      `SELECT ${CABECERA_P}, ${ITEMS_DE_P}
         FROM pedidos p
        WHERE p.id_negocio = $1
        ORDER BY p.id`,
      [idNegocio]
    );

    return rows.map((fila) => ({ ...aCabecera(fila), items: fila.items.map(aItem) }));
  },

  /**
   * Solo las cabeceras, sin renglones.
   *
   * Los clientes y el resumen de finanzas se calculan a partir de totales y
   * fechas; arrastrar los renglones de todo el histórico para eso sería tirar
   * ancho de banda a la basura.
   */
  async listarCabeceras(idNegocio) {
    const { rows } = await consultar(
      `SELECT ${CABECERA} FROM pedidos WHERE id_negocio = $1 ORDER BY id`,
      [idNegocio]
    );
    return rows.map(aCabecera);
  },

  /**
   * Los clientes de la tienda, derivados del histórico.
   *
   * Un cliente es un teléfono, y dos pedidos con el mismo número escrito
   * distinto ("+57 300..." y "300...") son la misma persona: por eso se agrupa
   * por los dígitos, igual que hace `digits()` en la API.
   *
   * El nombre, el teléfono y la fecha salen del pedido más reciente —es lo que
   * el dueño quiere ver en la ficha—, mientras que el total y el número de
   * pedidos suman el histórico completo.
   */
  async agruparPorCliente(idNegocio) {
    const { rows } = await consultar(
      `WITH base AS (
         SELECT id, nombre, telefono, total, fecha, fecha_iso,
                regexp_replace(telefono, '[^0-9]', '', 'g') AS clave
           FROM pedidos
          WHERE id_negocio = $1
       ),
       sumas AS (
         SELECT clave, count(*)::int AS pedidos, sum(total) AS total
           FROM base
          GROUP BY clave
       ),
       ultimo AS (
         SELECT DISTINCT ON (clave) clave, nombre, telefono, fecha, fecha_iso
           FROM base
          ORDER BY clave, fecha_iso DESC, id DESC
       )
       SELECT u.telefono, u.nombre, s.pedidos, s.total, u.fecha, u.fecha_iso
         FROM sumas s
         JOIN ultimo u USING (clave)
        ORDER BY u.fecha_iso DESC`,
      [idNegocio]
    );

    return rows.map((f) => ({
      telefono: f.telefono,
      nombre: f.nombre,
      pedidos: f.pedidos,
      total: f.total,
      ultimaFecha: f.fecha,
      ultimaFechaISO: f.fecha_iso.toISOString(),
    }));
  },

  /** Un pedido concreto con sus renglones, o `null`. */
  async buscar(idNegocio, idPedido) {
    const { rows } = await consultar(
      `SELECT ${CABECERA_P}, ${ITEMS_DE_P}
         FROM pedidos p
        WHERE p.id_negocio = $1 AND p.id_pedido = $2`,
      [idNegocio, idPedido]
    );
    if (!rows[0]) return null;
    return { ...aCabecera(rows[0]), items: rows[0].items.map(aItem) };
  },

  /**
   * Registra la venta.
   *
   * Devuelve `null` si ese `id_pedido` ya existía en la tienda: el frontend
   * puede reintentar el envío si se cerró la pestaña de WhatsApp, y esa segunda
   * llamada no debe duplicar la venta. `ON CONFLICT DO NOTHING` resuelve la
   * carrera dentro de la propia base, sin comprobar antes si existe.
   */
  crear(idNegocio, pedido) {
    return enTransaccion(async (cliente) => {
      const { rows } = await cliente.query(
        `INSERT INTO pedidos (id_negocio, ${CABECERA})
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id_negocio, id_pedido) DO NOTHING
         RETURNING id, ${CABECERA}`,
        [
          idNegocio,
          pedido.id,
          pedido.nombre,
          pedido.telefono,
          pedido.total,
          pedido.utilidad,
          pedido.fecha,
          pedido.fechaISO,
        ]
      );

      if (!rows[0]) return null;

      if (pedido.items.length) {
        await insertarItems(cliente, rows[0].id, pedido.items);
      }

      return { ...aCabecera(rows[0]), items: pedido.items };
    });
  },
};
