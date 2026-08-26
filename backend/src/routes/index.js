/** Monta todos los recursos de la API bajo /api. */
import { Router } from "express";

import { resolverTienda } from "../middlewares/tienda.js";
import { accesoRouter, cuentasRouter } from "./acceso.routes.js";
import { clientesRouter } from "./clientes.routes.js";
import { negocioRouter } from "./negocio.routes.js";
import { pedidosRouter } from "./pedidos.routes.js";
import { productosRouter } from "./productos.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true, servicio: "pedidos-tienda-api", hora: new Date().toISOString() });
});

// Entrada y alta: van antes de resolver la tienda, porque todavía no se sabe
// cuál es. Son las únicas rutas que no piden la cabecera `X-Negocio`.
apiRouter.use("/acceso", accesoRouter);
apiRouter.use("/cuentas", cuentasRouter);

// A partir de aquí todo va contra una tienda concreta: `resolverTienda` la
// deduce de la cabecera `X-Negocio` y decide, según el token, si la petición
// es de administrador o de cliente.
apiRouter.use(resolverTienda);

apiRouter.use("/negocio", negocioRouter);
apiRouter.use("/productos", productosRouter);
apiRouter.use("/pedidos", pedidosRouter);
apiRouter.use("/clientes", clientesRouter);
