/**
 * Conexión a PostgreSQL.
 *
 * Un único pool para todo el proceso: `pg` reutiliza las conexiones y las
 * reparte entre las peticiones, así que abrir una por consulta sería tirar
 * trabajo a la basura.
 *
 * Aquí también se ajustan dos cosas que, si no, cambiarían la forma de las
 * respuestas de la API:
 *
 * - `numeric` y `bigint` llegan de Postgres como cadenas, porque no caben
 *   garantizados en un `number` de JavaScript. Los importes y las cantidades de
 *   esta tienda sí caben de sobra, y el frontend lleva desde siempre esperando
 *   números, así que se convierten al leerlos.
 * - Las fechas se guardan en `timestamptz` y salen como `Date`; los servicios
 *   las devuelven como ISO con `.toISOString()`, igual que en los JSON.
 */
import pg from "pg";

import { config } from "../config/env.js";

const { Pool, types } = pg;

// OID 1700 = numeric, 20 = int8/bigint.
types.setTypeParser(1700, (valor) => (valor === null ? null : Number(valor)));
types.setTypeParser(20, (valor) => (valor === null ? null : Number(valor)));

export const pool = new Pool(config.db);

// Un error en una conexión ociosa (la base se reinició, se cayó la red) no debe
// tumbar el proceso: `pg` la descarta sola y la siguiente consulta abre otra.
pool.on("error", (err) => {
  console.error("[db] error en una conexión ociosa del pool:", err.message);
});

/** Consulta suelta, con una conexión prestada del pool. */
export const consultar = (texto, valores) => pool.query(texto, valores);

/** Primera fila del resultado, o `null` si no hubo ninguna. */
export async function primeraFila(texto, valores) {
  const { rows } = await pool.query(texto, valores);
  return rows[0] ?? null;
}

/**
 * Ejecuta varias consultas en una transacción.
 *
 * La función recibe el cliente y debe usarlo para todas sus consultas: si usara
 * `consultar` se saldría de la transacción sin darse cuenta. Si lanza, se hace
 * ROLLBACK y el error sigue subiendo tal cual.
 */
export async function enTransaccion(tarea) {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    const resultado = await tarea(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (err) {
    await cliente.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    cliente.release();
  }
}

/** Código de PostgreSQL para "viola una restricción de unicidad". */
const VIOLACION_UNICA = "23505";

/**
 * ¿Este error es un choque con un UNIQUE concreto?
 *
 * Sirve para traducir la restricción de la base en un mensaje que entienda el
 * dueño ("ese teléfono ya tiene tienda") en vez de un 500.
 *
 * @param {unknown} err
 * @param {string} [restriccion] nombre del índice o constraint; si se omite,
 *                               vale cualquier violación de unicidad
 */
export function esDuplicado(err, restriccion) {
  if (err?.code !== VIOLACION_UNICA) return false;
  return restriccion ? err.constraint === restriccion : true;
}

/**
 * Comprueba que la base responde y que el esquema está aplicado.
 * Se llama al arrancar para fallar con un mensaje claro en vez de a la primera
 * petición con un error de tabla inexistente.
 */
export async function comprobarConexion() {
  const fila = await primeraFila(
    "SELECT to_regclass('public.cuentas') IS NOT NULL AS hay_esquema, current_database() AS base"
  );
  if (!fila?.hay_esquema) {
    throw new Error(
      `La base "${fila?.base}" está conectada pero le falta el esquema. ` +
        "Ejecuta: psql -d <base> -f backend/db/schema.sql"
    );
  }
  return fila.base;
}

/** Cierra el pool. Solo en el apagado ordenado del servidor. */
export const cerrarPool = () => pool.end();
