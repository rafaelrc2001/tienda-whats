/**
 * Almacén de datos sobre archivos JSON.
 *
 * Es deliberadamente simple: un archivo por colección, escritura completa y
 * atómica (se escribe a un temporal y se renombra, para no dejar un JSON a
 * medias si el proceso muere), y una cola por archivo para que dos peticiones
 * simultáneas no se pisen.
 *
 * Cuando el volumen lo pida, sustituir esta capa por SQLite o Postgres no
 * debería tocar nada fuera de repositories/: los servicios solo ven `leer` y
 * `escribir`.
 */
import fs from "node:fs/promises";
import path from "node:path";

import { config } from "../config/env.js";

/** Cola de escritura por archivo: encadena las operaciones sobre el mismo JSON. */
const colas = new Map();

function encolar(archivo, tarea) {
  const previa = colas.get(archivo) || Promise.resolve();
  const siguiente = previa.then(tarea, tarea);
  // la cola no debe romperse si una tarea falla
  colas.set(archivo, siguiente.catch(() => {}));
  return siguiente;
}

const rutaDe = (nombre) => path.join(config.dataDir, `${nombre}.json`);

/** Crea la carpeta de datos si todavía no existe. */
export async function prepararAlmacen() {
  await fs.mkdir(config.dataDir, { recursive: true });
}

/**
 * Crea un repositorio para una colección.
 * @param {string} nombre  nombre del archivo, sin extensión
 * @param {*} porDefecto   valor devuelto cuando el archivo no existe
 */
export function crearAlmacen(nombre, porDefecto) {
  const archivo = rutaDe(nombre);

  async function leer() {
    try {
      const texto = await fs.readFile(archivo, "utf8");
      return JSON.parse(texto);
    } catch (err) {
      if (err.code === "ENOENT") return estructuraClonada();
      if (err instanceof SyntaxError) {
        // Un JSON corrupto no debe tumbar la API: se avisa y se arranca en blanco.
        console.error(`[jsonStore] ${nombre}.json está corrupto, se ignora:`, err.message);
        return estructuraClonada();
      }
      throw err;
    }
  }

  function estructuraClonada() {
    return JSON.parse(JSON.stringify(porDefecto));
  }

  async function escribir(datos) {
    return encolar(archivo, async () => {
      await fs.mkdir(path.dirname(archivo), { recursive: true });
      const temporal = `${archivo}.tmp`;
      await fs.writeFile(temporal, JSON.stringify(datos, null, 2), "utf8");
      await fs.rename(temporal, archivo);
      return datos;
    });
  }

  /** Lee, transforma y guarda en una sola operación encolada. */
  async function actualizar(transformar) {
    return encolar(archivo, async () => {
      const actual = await leer();
      const nuevo = await transformar(actual);
      await fs.mkdir(path.dirname(archivo), { recursive: true });
      const temporal = `${archivo}.tmp`;
      await fs.writeFile(temporal, JSON.stringify(nuevo, null, 2), "utf8");
      await fs.rename(temporal, archivo);
      return nuevo;
    });
  }

  return { nombre, leer, escribir, actualizar };
}
