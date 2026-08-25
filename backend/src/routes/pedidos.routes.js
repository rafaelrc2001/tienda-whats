import { Router } from "express";

import { pedidosController } from "../controllers/pedidos.controller.js";

export const pedidosRouter = Router();

// /resumen va antes de cualquier ruta con parámetro para que no la capture
pedidosRouter.get("/resumen", pedidosController.resumen);
pedidosRouter.get("/", pedidosController.listar);
pedidosRouter.post("/", pedidosController.crear);
