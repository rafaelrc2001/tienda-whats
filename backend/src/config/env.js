/** Configuración del servidor, leída una sola vez desde el entorno. */
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

dotenv.config();

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const numeroO = (valor, porDefecto) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : porDefecto;
};

/**
 * Ajustes del pool de PostgreSQL, tal como los espera `pg`.
 *
 * Se admiten las dos formas habituales: una `DATABASE_URL` completa (que es lo
 * que dan Render, Railway, Neon y compañía) o las variables sueltas de siempre.
 * Si hay URL, manda la URL.
 */
function configurarBaseDeDatos() {
  const comun = {
    // Cuántas conexiones simultáneas puede tener abiertas este proceso.
    max: numeroO(process.env.PGPOOL_MAX, 10),
    // Se cierra una conexión ociosa pasados 30 s.
    idleTimeoutMillis: numeroO(process.env.PGPOOL_IDLE_MS, 30_000),
    // Si la base no contesta en 10 s, mejor fallar que dejar la petición colgada.
    connectionTimeoutMillis: numeroO(process.env.PGPOOL_CONNECT_MS, 10_000),
  };

  // Los servicios gestionados exigen TLS y usan certificados que Node no trae
  // en su almacén, de ahí el `rejectUnauthorized: false`.
  const ssl = process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined;

  if (process.env.DATABASE_URL) {
    return { ...comun, connectionString: process.env.DATABASE_URL, ssl };
  }

  return {
    ...comun,
    ssl,
    host: process.env.PGHOST || "localhost",
    port: numeroO(process.env.PGPORT, 5432),
    database: process.env.PGDATABASE || "pedidos_tienda",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "",
  };
}

const esProduccion = process.env.NODE_ENV === "production";

export const config = {
  puerto: numeroO(process.env.PORT, 4000),
  entorno: process.env.NODE_ENV || "development",
  esProduccion,

  /** Orígenes autorizados. Vacío = se permite cualquiera (útil en desarrollo). */
  corsOrigin: (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  /** Conexión a PostgreSQL, que es donde vive todo el estado de la aplicación. */
  db: configurarBaseDeDatos(),

  /**
   * Alta por código de activación.
   *
   * El código se lo manda n8n al dueño por WhatsApp. Mientras esa automatización
   * no esté conectada, `codigoFijo` deja uno siempre igual para poder probar el
   * flujo entero sin recibir ningún mensaje: en desarrollo vale 123 si nadie
   * dice otra cosa; en producción, o se pone a mano o se sortea uno de verdad.
   */
  activacion: {
    codigoFijo: process.env.ACTIVACION_CODIGO_FIJO ?? (esProduccion ? "" : "123"),
    minutosVigencia: numeroO(process.env.ACTIVACION_MINUTOS, 15),
    /** Webhook de n8n que manda el código. Vacío = se simula y queda en el log. */
    urlN8n: process.env.N8N_URL_ACTIVACION || "",
  },

  /** Build del frontend, servido en producción desde el mismo puerto. */
  staticDir: path.resolve(RAIZ, process.env.STATIC_DIR || "../frontend/dist"),
};

/** Cómo describir la conexión en los logs, sin enseñar la contraseña. */
export function describirBaseDeDatos() {
  const { connectionString, host, port, database } = config.db;
  if (!connectionString) return `${host}:${port}/${database}`;
  try {
    const url = new URL(connectionString);
    return `${url.hostname}:${url.port || 5432}${url.pathname}`;
  } catch {
    return "(DATABASE_URL)";
  }
}
