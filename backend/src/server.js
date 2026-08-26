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

main().catch((err) => {
  console.error("No se pudo arrancar el servidor:", err.message);
  process.exit(1);
});
