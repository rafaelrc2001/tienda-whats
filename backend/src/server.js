/** Arranque del servidor. */
import { config } from "./config/env.js";
import { prepararAlmacen } from "./repositories/jsonStore.js";
import { crearApp } from "./app.js";

async function main() {
  await prepararAlmacen();

  const app = crearApp();
  const server = app.listen(config.puerto, () => {
    console.log(`API de Pedidos Tienda escuchando en http://localhost:${config.puerto}/api`);
    console.log(`Entorno: ${config.entorno} · datos en ${config.dataDir}`);
  });

  // Cierre ordenado: deja terminar las peticiones en curso antes de salir.
  for (const senal of ["SIGINT", "SIGTERM"]) {
    process.on(senal, () => {
      console.log(`\n${senal} recibido, cerrando servidor...`);
      server.close(() => process.exit(0));
    });
  }
}

main().catch((err) => {
  console.error("No se pudo arrancar el servidor:", err);
  process.exit(1);
});
