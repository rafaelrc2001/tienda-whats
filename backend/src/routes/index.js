/** Monta todos los recursos de la API bajo /api. */
import { Router } from "express";

import { clientesRouter } from "./clientes.routes.js";
import { negocioRouter } from "./negocio.routes.js";
import { pedidosRouter } from "./pedidos.routes.js";
import { productosRouter } from "./productos.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true, servicio: "pedidos-tienda-api", hora: new Date().toISOString() });
});

apiRouter.use("/negocio", negocioRouter);
apiRouter.use("/productos", productosRouter);
apiRouter.use("/pedidos", pedidosRouter);
apiRouter.use("/clientes", clientesRouter);
