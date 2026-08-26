/** Arranque del servidor. */
import { config, describirBaseDeDatos } from "./config/env.js";
import { cerrarPool, comprobarConexion } from "./db/pool.js";
import { crearApp } from "./app.js";

async function main() {
  // Se comprueba la base antes de abrir el puerto: más vale no arrancar que
  // aceptar peticiones y devolverles un 500 a todas.
  const base = await comprobarConexion();

  const app = crearApp();
  const server = app.listen(config.puerto, () => {
    console.log(`API de Pedidos Tienda escuchando en http://localhost:${config.puerto}/api`);
    console.log(`Entorno: ${config.entorno} · base ${base} en ${describirBaseDeDatos()}`);
  });

  // Cierre ordenado: deja terminar las peticiones en curso y después suelta las
  // conexiones de PostgreSQL, para no dejarlas colgando en el servidor.
  for (const senal of ["SIGINT", "SIGTERM"]) {
    process.on(senal, () => {
      console.log(`\n${senal} recibido, cerrando servidor...`);
      server.close(async () => {
        await cerrarPool().catch(() => {});
        process.exit(0);
      });
    });
  }
}

/**
 * Explica un fallo de arranque.
 *
 * Node agrupa en un `AggregateError` los intentos de conexión a un host que
 * resuelve a varias direcciones (IPv6 e IPv4, que es lo que pasa con
 * "localhost"). Ese error tiene el `message` vacío, así que imprimirlo a secas
 * deja un renglón sin información; el motivo está en `errors`.
 */
function explicar(err) {
  const partes = [];
  if (err?.message) partes.push(err.message);
  for (const causa of err?.errors ?? []) {
    if (causa?.message) partes.push(causa.message);
  }
  if (partes.length === 0) partes.push(err?.code || String(err));
  return partes.join("; ");
}

main().catch((err) => {
  console.error("No se pudo arrancar el servidor:", explicar(err));

  // El fallo típico en despliegue: nadie escucha en el sitio al que apunta la
  // configuración, casi siempre porque falta DATABASE_URL o PGHOST y se ha
  // usado el "localhost" por defecto, donde no hay ningún PostgreSQL.
  if (err?.code === "ECONNREFUSED" || err?.code === "ENOTFOUND") {
    console.error(`No hay PostgreSQL escuchando en ${describirBaseDeDatos()}.`);
    console.error("Revisa DATABASE_URL (o PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD).");
  }

  process.exit(1);
});
