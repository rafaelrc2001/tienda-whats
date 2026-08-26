/**
 * Cuentas de los dueños.
 *
 * No pertenecen a ninguna tienda: son precisamente lo que dice qué tiendas
 * existen, y de ellas cuelga por clave foránea todo lo demás.
 *
 * Una cuenta y su negocio nacen en la misma transacción. Antes eso eran cuatro
 * archivos que se creaban uno detrás de otro y podían quedarse a medias; aquí,
 * o se crean las dos filas o no se crea ninguna, y las tablas de productos,
 * pedidos y direcciones simplemente arrancan vacías para esa tienda.
 */
import { enTransaccion, primeraFila } from "../db/pool.js";

/** Columnas de la cuenta, en el orden en que las mapea `aCuenta`. */
const CAMPOS = "id_negocio, telefono, password_hash, nombre_tienda, estatus, creada_en";

/** Fila de `cuentas` -> el objeto con el que trabajan los servicios. */
const aCuenta = (fila) =>
  fila && {
    idNegocio: fila.id_negocio,
    telefono: fila.telefono,
    passwordHash: fila.password_hash,
    nombreTienda: fila.nombre_tienda,
    estatus: fila.estatus,
    creadaISO: fila.creada_en.toISOString(),
  };

export const cuentasRepository = {
  async buscarPorTelefono(telefono) {
    const fila = await primeraFila(
      `SELECT ${CAMPOS} FROM cuentas WHERE telefono = $1`,
      [telefono]
    );
    return aCuenta(fila);
  },

  async buscarPorIdNegocio(idNegocio) {
    const fila = await primeraFila(
      `SELECT ${CAMPOS} FROM cuentas WHERE id_negocio = $1`,
      [idNegocio]
    );
    return aCuenta(fila);
  },


  /**
   * Da de alta la cuenta y, con ella, la configuración inicial del negocio.
   *
   * El resto de columnas de `negocios` se quedan con los valores por defecto
   * del esquema, que son los mismos que tenía `NEGOCIO_POR_DEFECTO`.
   *
   * Si el teléfono o el slug ya existen, sube la violación de unicidad de
   * PostgreSQL: es el servicio quien la traduce a un mensaje para el dueño.
   */
  crear({ idNegocio, telefono, passwordHash, nombreTienda }) {
    return enTransaccion(async (cliente) => {
      const { rows } = await cliente.query(
        `INSERT INTO cuentas (id_negocio, telefono, password_hash, nombre_tienda)
         VALUES ($1, $2, $3, $4)
         RETURNING ${CAMPOS}`,
        [idNegocio, telefono, passwordHash, nombreTienda]
      );

      await cliente.query(
        "INSERT INTO negocios (id_negocio, nombre, telefono) VALUES ($1, $2, $3)",
        [idNegocio, nombreTienda, telefono]
      );

      return aCuenta(rows[0]);
    });
  },

  /**
   * Guarda los cambios de "Mi perfil".
   *
   * El nombre y el teléfono se copian también a `negocios`: para el dueño son
   * un solo dato, aunque cuenta y configuración sean tablas distintas. El
   * `id_negocio` nunca cambia, para no invalidar el ID que los clientes ya
   * tienen apuntado.
   */
  actualizar(idNegocio, { telefono, nombreTienda, passwordHash }) {
    return enTransaccion(async (cliente) => {
      const { rows } = await cliente.query(
        `UPDATE cuentas
            SET telefono = $2, nombre_tienda = $3, password_hash = $4
          WHERE id_negocio = $1
        RETURNING ${CAMPOS}`,
        [idNegocio, telefono, nombreTienda, passwordHash]
      );
      if (!rows[0]) return null;

      await cliente.query(
        `UPDATE negocios
            SET nombre = $2, telefono = $3, actualizado_en = now()
          WHERE id_negocio = $1`,
        [idNegocio, nombreTienda, telefono]
      );

      return aCuenta(rows[0]);
    });
  },
};
