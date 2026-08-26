/**
 * Catálogo de productos.
 *
 * La pantalla de Productos edita el catálogo entero como una tabla y lo manda
 * completo, así que reemplazar es borrar e insertar dentro de una transacción:
 * si algo falla a mitad, la tienda se queda con el catálogo que ya tenía en vez
 * de con medio catálogo nuevo.
 *
 * El orden importa —es el que ve el cliente— y por eso se guarda en `posicion`;
 * en un JSON lo daba gratis el propio arreglo.
 */
import { consultar, enTransaccion } from "../db/pool.js";

const CAMPOS = `id_producto, categoria, producto, marca, unidad,
                precio_venta, precio_costo, proveedor, imagen`;

const aProducto = (fila) => ({
  id: fila.id_producto,
  categoria: fila.categoria,
  producto: fila.producto,
  marca: fila.marca,
  unidad: fila.unidad,
  precioVenta: fila.precio_venta,
  precioCosto: fila.precio_costo,
  proveedor: fila.proveedor,
  imagen: fila.imagen,
});

export const productosRepository = {
  async listar(idNegocio) {
    const { rows } = await consultar(
      `SELECT ${CAMPOS} FROM productos
        WHERE id_negocio = $1
        ORDER BY posicion, id`,
      [idNegocio]
    );
    return rows.map(aProducto);
  },

  /**
   * Reemplaza el catálogo completo y devuelve el que quedó guardado.
   *
   * Las filas se insertan de una sola vez con `unnest`: un `INSERT` por producto
   * sería un viaje a la base por cada fila, y un catálogo de mil productos con
   * fotos en data URI haría eso muy caro.
   */
  reemplazar(idNegocio, productos) {
    return enTransaccion(async (cliente) => {
      await cliente.query("DELETE FROM productos WHERE id_negocio = $1", [idNegocio]);

      if (productos.length) {
        await cliente.query(
          `INSERT INTO productos
             (id_negocio, posicion, id_producto, categoria, producto, marca,
              unidad, precio_venta, precio_costo, proveedor, imagen)
           SELECT $1::text, *
             FROM unnest(
               $2::integer[], $3::text[], $4::text[], $5::text[], $6::text[],
               $7::text[], $8::numeric[], $9::numeric[], $10::text[], $11::text[]
             )`,
          [
            idNegocio,
            productos.map((_, i) => i),
            productos.map((p) => p.id),
            productos.map((p) => p.categoria),
            productos.map((p) => p.producto),
            productos.map((p) => p.marca),
            productos.map((p) => p.unidad),
            productos.map((p) => p.precioVenta),
            productos.map((p) => p.precioCosto),
            productos.map((p) => p.proveedor),
            productos.map((p) => p.imagen),
          ]
        );
      }

      const { rows } = await cliente.query(
        `SELECT ${CAMPOS} FROM productos
          WHERE id_negocio = $1
          ORDER BY posicion, id`,
        [idNegocio]
      );
      return rows.map(aProducto);
    });
  },
};
