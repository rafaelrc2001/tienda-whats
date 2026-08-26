import { Router } from "express";

import { pedidosController } from "../controllers/pedidos.controller.js";
import { exigirAdmin } from "../middlewares/tienda.js";

export const pedidosRouter = Router();

// /resumen va antes de cualquier ruta con parámetro para que no la capture
pedidosRouter.get("/resumen", exigirAdmin, pedidosController.resumen);

// El histórico de ventas es del dueño; registrar la propia, del cliente.
pedidosRouter.get("/", exigirAdmin, pedidosController.listar);
pedidosRouter.post("/", pedidosController.crear);
