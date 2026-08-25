/** Configuración del servidor, leída una sola vez desde el entorno. */
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

dotenv.config();

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const config = {
  puerto: Number(process.env.PORT) || 4000,
  entorno: process.env.NODE_ENV || "development",
  esProduccion: process.env.NODE_ENV === "production",

  /** Orígenes autorizados. Vacío = se permite cualquiera (útil en desarrollo). */
  corsOrigin: (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  /** Carpeta con los archivos JSON que hacen de base de datos. */
  dataDir: path.resolve(RAIZ, process.env.DATA_DIR || "data"),

  /** Build del frontend, servido en producción desde el mismo puerto. */
  staticDir: path.resolve(RAIZ, process.env.STATIC_DIR || "../frontend/dist"),
};
